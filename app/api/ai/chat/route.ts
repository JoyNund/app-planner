import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { taskAIChatDb, taskDb } from '@/lib/db';
import { readFile } from 'fs/promises';
import { join } from 'path';

const GEMINI_API_KEY = 'AIzaSyBUukU6ziuqvUcKv-hbewAaJFjqMCjacTI';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    
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

    // Process files: convert to base64 and prepare for Gemini
    const fileParts: Array<{ inlineData: { data: string; mimeType: string } }> = [];
    
    for (const file of files) {
      try {
        // Get file buffer from FormData
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = buffer.toString('base64');
        
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

        // Add to Gemini parts
        fileParts.push({
          inlineData: {
            data: base64Data,
            mimeType: file.type,
          },
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
    
    // Build messages array for Gemini
    const contents: Array<{ role: string; parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> }> = [];

    // System prompt for initial plan or continuation
    if (isInitialPlan) {
      // For initial plan, send system context + user prompt
      contents.push({
        role: 'user',
        parts: [{
          text: `Eres un asistente de IA especializado en ayudar con tareas de marketing y creatividad. 

Analiza la siguiente tarea y genera un plan de acción detallado y práctico:

TÍTULO: ${task.title}
${task.description ? `DESCRIPCIÓN: ${task.description}` : ''}

Genera un plan de acción que incluya:
1. Pasos claros y accionables
2. Estrategias y enfoques recomendados
3. Consideraciones importantes
4. Ideas creativas y sugerencias

Sé específico, práctico y enfocado en resultados. El plan debe ser útil para ejecutar la tarea de manera efectiva.`
        }]
      });
    } else {
      // For chat continuation, include history (last 10 messages for context)
      const recentHistory = chatHistory.slice(-10);
      for (const msg of recentHistory) {
        if (msg.role === 'user') {
          const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [];
          
          // Add text if exists
          if (msg.content) {
            parts.push({ text: msg.content });
          }
          
          // Add media files if exists
          if (msg.media_files) {
            try {
              const mediaFiles = typeof msg.media_files === 'string' 
                ? JSON.parse(msg.media_files) 
                : msg.media_files;
              
              if (Array.isArray(mediaFiles)) {
                for (const mediaFile of mediaFiles) {
                  try {
                    // Remove leading slash if present
                    const urlPath = mediaFile.url.startsWith('/') ? mediaFile.url.slice(1) : mediaFile.url;
                    const filepath = join(process.cwd(), 'public', urlPath);
                    const fileBuffer = await readFile(filepath);
                    const base64Data = fileBuffer.toString('base64');
                    
                    parts.push({
                      inlineData: {
                        data: base64Data,
                        mimeType: mediaFile.mime_type || (mediaFile.type === 'image' ? 'image/jpeg' : 'video/mp4'),
                      },
                    });
                  } catch (fileErr) {
                    console.error('Error loading individual media file:', fileErr);
                    // Continue with other files
                  }
                }
              }
            } catch (err) {
              console.error('Error loading media files from history:', err);
            }
          }
          
          if (parts.length > 0) {
            contents.push({
              role: 'user',
              parts,
            });
          }
        } else if (msg.role === 'assistant') {
          contents.push({
            role: 'model',
            parts: [{ text: msg.content }]
          });
        }
      }
      
      // Add current message with files
      if (message || fileParts.length > 0) {
        const currentParts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [];
        if (message) {
          currentParts.push({ text: message });
        }
        currentParts.push(...fileParts);
        
        contents.push({
          role: 'user',
          parts: currentParts,
        });
      }
    }

    // Call Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      return NextResponse.json(
        { error: 'Error al comunicarse con la IA' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo generar una respuesta';

    // Save assistant response
    await taskAIChatDb.addMessage(taskId, 'assistant', assistantMessage);

    return NextResponse.json({
      success: true,
      message: assistantMessage,
    });
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

