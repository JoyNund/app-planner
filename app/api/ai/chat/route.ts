import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { taskAIChatDb, taskDb, settingsDb } from '@/lib/db';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Get DeepSeek API key from environment variables
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    // Check if DeepSeek API key is configured
    if (!DEEPSEEK_API_KEY) {
      console.error('DEEPSEEK_API_KEY not configured');
      return NextResponse.json(
        { error: 'Configuración de IA no disponible. Por favor contacta al administrador.' },
        { status: 500 }
      );
    }
    
    // Check if request has files (FormData) or JSON
    const contentType = request.headers.get('content-type') || '';
    let taskId: number;
    let message: string;
    let isInitialPlan = false;
    let files: File[] = [];
    let mediaFiles: Array<{ type: string; url: string; filename: string; mime_type?: string }> = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      taskId = parseInt(formData.get('taskId') as string);
      message = (formData.get('message') as string) || '';
      isInitialPlan = formData.get('isInitialPlan') === 'true';
      
      // Get files from FormData
      const filesData = formData.getAll('files') as File[];
      files = filesData.filter(f => f instanceof File && f.size > 0);
    } else {
      const body = await request.json();
      taskId = body.taskId;
      message = body.message || '';
      isInitialPlan = body.isInitialPlan || false;
    }

    if (!taskId) {
      return NextResponse.json({ error: 'taskId es requerido' }, { status: 400 });
    }

    // Verify task exists
    const task = await taskDb.getById(taskId);
    if (!task) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    // Process files: save to disk for future reference
    // Note: DeepSeek doesn't support images/videos directly, but we'll save them for reference
    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Save file to disk for future reference
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const timestamp = Date.now();
        const filename = `${timestamp}-${sanitizedName}`;
        const uploadsDir = join(process.cwd(), 'public', 'uploads', 'ai-chat');
        const { mkdir, writeFile } = await import('fs/promises');
        await mkdir(uploadsDir, { recursive: true });
        const filepath = join(uploadsDir, filename);
        await writeFile(filepath, buffer);
        
        const fileType = file.type.startsWith('image/') ? 'image' : 'video';
        mediaFiles.push({
          type: fileType,
          url: `/uploads/ai-chat/${filename}`,
          filename: file.name,
          mime_type: file.type,
        });
      } catch (err) {
        console.error('Error processing file:', err);
        // Continue with other files
      }
    }

    // Save user message with media files
    const mediaFilesJson = mediaFiles.length > 0 ? JSON.stringify(mediaFiles) : null;
    await taskAIChatDb.addMessage(taskId, 'user', message, mediaFilesJson);

    // Get chat history for context
    const chatHistory = await taskAIChatDb.getByTaskId(taskId);
    
    // Get master prompt from settings
    const settings = await settingsDb.get();
    let masterPrompt = settings?.ai_prompt_master || null;

    // If no custom prompt, use default "general" prompt
    if (!masterPrompt) {
      const { supabase } = await import('@/lib/db');
      const { data: defaultPrompt } = await supabase
        .from('ai_prompts_by_sector')
        .select('prompt_master')
        .eq('sector', 'general')
        .single();
      masterPrompt = defaultPrompt?.prompt_master || '';
    }

    try {
      // Build messages array for DeepSeek (OpenAI-compatible format)
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

      // System instruction - use master prompt if available
      let systemInstruction: string;
      
      if (isInitialPlan) {
        // For initial plan, combine master prompt with task-specific instructions
        const taskSpecificPrompt = `Analiza la siguiente tarea y genera un plan de acción detallado y práctico:

TÍTULO: ${task.title}
${task.description ? `DESCRIPCIÓN: ${task.description}` : ''}

Genera un plan de acción que incluya:
1. Pasos claros y accionables
2. Estrategias y enfoques recomendados
3. Consideraciones importantes
4. Ideas creativas y sugerencias

Sé específico, práctico y enfocado en resultados. El plan debe ser útil para ejecutar la tarea de manera efectiva.`;

        if (masterPrompt) {
          systemInstruction = `${masterPrompt}\n\n${taskSpecificPrompt}`;
        } else {
          systemInstruction = `Eres un asistente de IA especializado en ayudar con tareas de marketing y creatividad.\n\n${taskSpecificPrompt}`;
        }
      } else {
        // For chat continuation, use master prompt or default
        if (masterPrompt) {
          systemInstruction = masterPrompt;
        } else {
          systemInstruction = "Eres un asistente de IA especializado en ayudar con tareas de marketing y creatividad. Sé conciso, profesional y útil. Si te piden un plan, ofrece pasos específicos y accionables.";
        }
      }

      messages.push({
        role: 'system',
        content: systemInstruction,
      });

      // Add chat history (last 10 messages for context)
      if (!isInitialPlan) {
        const recentHistory = chatHistory.slice(-10);
        for (const msg of recentHistory) {
          if (msg.role === 'user' || msg.role === 'assistant') {
            // Include media files info in user messages
            let content = msg.content || '';
            if (msg.media_files && msg.role === 'user') {
              try {
                const mediaFiles = typeof msg.media_files === 'string' 
                  ? JSON.parse(msg.media_files) 
                  : msg.media_files;
                if (Array.isArray(mediaFiles) && mediaFiles.length > 0) {
                  const mediaInfo = mediaFiles.map((f: any) => `[${f.type}: ${f.filename}]`).join(', ');
                  content = content ? `${content}\n\nArchivos adjuntos: ${mediaInfo}` : `Archivos adjuntos: ${mediaInfo}`;
                }
              } catch (err) {
                // Ignore parsing errors
              }
            }
            
            messages.push({
              role: msg.role === 'user' ? 'user' : 'assistant',
              content: content,
            });
          }
        }
      }

      // Add current message
      let currentMessage = message || '';
      if (mediaFiles.length > 0) {
        const mediaInfo = mediaFiles.map(f => `[${f.type}: ${f.filename}]`).join(', ');
        currentMessage = currentMessage ? `${currentMessage}\n\nArchivos adjuntos: ${mediaInfo}` : `Archivos adjuntos: ${mediaInfo}`;
      }
      
      if (currentMessage) {
        messages.push({
          role: 'user',
          content: currentMessage,
        });
      }

      // Call DeepSeek API
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: messages,
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage = 'Error al comunicarse con la IA';
        
        try {
          const errorJson = JSON.parse(errorData);
          console.error('DeepSeek API error:', errorJson);
          
          if (errorJson.error?.message) {
            errorMessage = `Error de IA: ${errorJson.error.message}`;
          } else if (errorJson.error?.code === 'invalid_api_key') {
            errorMessage = 'Error de permisos con la API de IA. Contacta al administrador.';
          } else if (errorJson.error?.code === 'rate_limit_exceeded') {
            errorMessage = 'Límite de uso de IA alcanzado. Por favor intenta más tarde.';
          }
        } catch (parseError) {
          console.error('Error parsing DeepSeek API error response:', errorData);
        }
        
        return NextResponse.json(
          { error: errorMessage },
          { status: 500 }
        );
      }

      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message?.content || 'No se pudo generar una respuesta';

      // Save assistant response
      await taskAIChatDb.addMessage(taskId, 'assistant', assistantMessage);

      return NextResponse.json({
        success: true,
        message: assistantMessage,
      });
    } catch (error: any) {
      console.error('DeepSeek API error:', error);
      
      let errorMessage = 'Error al comunicarse con la IA';
      
      if (error.message) {
        errorMessage = `Error de IA: ${error.message}`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in AI chat:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve chat history
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'taskId es requerido' }, { status: 400 });
    }

    const messages = await taskAIChatDb.getByTaskId(parseInt(taskId));

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to clear chat history for a task
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'taskId es requerido' }, { status: 400 });
    }

    await taskAIChatDb.deleteByTaskId(parseInt(taskId));

    return NextResponse.json({
      success: true,
      message: 'Chat limpiado exitosamente',
    });
  } catch (error) {
    console.error('Error clearing chat:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
