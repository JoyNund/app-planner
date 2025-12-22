import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { taskAIChatDb, taskDb } from '@/lib/db';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { GoogleGenAI } from '@google/genai';

// Get Gemini API key from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
// Using Gemini 2.0 Flash (faster and more efficient) as default
// Available models: gemini-2.0-flash, gemini-2.0-flash-lite, gemini-2.0-pro-exp
// Note: gemini-1.5-pro and gemini-1.5-flash are deprecated as of September 2025
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    // Check if Gemini API key is configured
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured');
      return NextResponse.json(
        { error: 'Configuración de IA no disponible. Por favor contacta al administrador.' },
        { status: 500 }
      );
    }
    
    // Initialize Gemini AI client
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
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
    
    try {
      let assistantMessage: string;

      if (isInitialPlan) {
        // For initial plan, use generateContent with a single prompt
        const systemPrompt = `Eres un asistente de IA especializado en ayudar con tareas de marketing y creatividad. 

Analiza la siguiente tarea y genera un plan de acción detallado y práctico:

TÍTULO: ${task.title}
${task.description ? `DESCRIPCIÓN: ${task.description}` : ''}

Genera un plan de acción que incluya:
1. Pasos claros y accionables
2. Estrategias y enfoques recomendados
3. Consideraciones importantes
4. Ideas creativas y sugerencias

Sé específico, práctico y enfocado en resultados. El plan debe ser útil para ejecutar la tarea de manera efectiva.`;

        // Build contents: if there are files, use parts array, otherwise use string
        let contents: string | Array<{ text?: string; inlineData?: { data: string; mimeType: string } }>;
        
        if (fileParts.length > 0) {
          // Use parts array when there are files
          contents = [
            { text: systemPrompt },
            ...fileParts
          ];
        } else {
          // Use string when no files
          contents = systemPrompt;
        }

        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: contents,
          config: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        });

        assistantMessage = response.text || 'No se pudo generar una respuesta';
      } else {
        // For chat continuation, build history and use chats.create()
        const recentHistory = chatHistory.slice(-10);
        const historyMessages: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> }> = [];

        // Build history from recent messages
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
              historyMessages.push({ role: 'user', parts });
            }
          } else if (msg.role === 'assistant') {
            historyMessages.push({
              role: 'model',
              parts: [{ text: msg.content }]
            });
          }
        }

        // Create chat with history and system instruction
        const chat = ai.chats.create({
          model: GEMINI_MODEL,
          history: historyMessages,
          config: {
            systemInstruction: "Eres un asistente de IA especializado en ayudar con tareas de marketing y creatividad. Sé conciso, profesional y útil. Si te piden un plan, ofrece pasos específicos y accionables.",
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        });
        
        // Add current message with files
        const currentParts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [];
        if (message) {
          currentParts.push({ text: message });
        }
        currentParts.push(...fileParts);
        
        const response = await chat.sendMessage({ message: currentParts });
        assistantMessage = response.text || 'No se pudo generar una respuesta';
      }

      // Save assistant response
      await taskAIChatDb.addMessage(taskId, 'assistant', assistantMessage);

      return NextResponse.json({
        success: true,
        message: assistantMessage,
      });
    } catch (error: any) {
      console.error('Gemini API error:', error);
      
      let errorMessage = 'Error al comunicarse con la IA';
      
      // Handle specific Gemini API errors
      if (error.message) {
        if (error.message.includes('not found') || error.message.includes('not available')) {
          errorMessage = 'El modelo de IA no está disponible. Por favor contacta al administrador.';
        } else if (error.message.includes('API key') || error.message.includes('permission')) {
          errorMessage = 'Error de permisos con la API de IA. Contacta al administrador.';
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
          errorMessage = 'Límite de uso de IA alcanzado. Por favor intenta más tarde.';
        } else {
          errorMessage = `Error de IA: ${error.message}`;
        }
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
