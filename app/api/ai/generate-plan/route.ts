import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { settingsDb } from '@/lib/db';

// Get DeepSeek API key from environment variables
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('mkt_session');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const userId = session.id;

    const body = await request.json();
    const { taskTitle, taskDescription } = body;

    if (!taskTitle) {
      return NextResponse.json({ error: 'Título de tarea requerido' }, { status: 400 });
    }

    // Check if DeepSeek API key is configured
    if (!DEEPSEEK_API_KEY) {
      console.error('DEEPSEEK_API_KEY not configured');
      return NextResponse.json(
        { error: 'Configuración de IA no disponible. Por favor contacta al administrador.' },
        { status: 500 }
      );
    }

    // Get master prompt from settings or default
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

    // Build the user prompt
    const userPrompt = `Analiza la siguiente tarea y genera un plan de acción creativo e inspirador:

TÍTULO: ${taskTitle}
${taskDescription ? `DESCRIPCIÓN: ${taskDescription}` : ''}

Genera un plan de acción que incluya:
1. Ideas creativas y conceptos innovadores
2. Estrategias visuales o comunicacionales
3. Elementos clave a considerar
4. Enfoques frescos y atractivos

Sé inspirador, creativo y enfócate en ideas que impulsen la creatividad.`;

    // Call DeepSeek API
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: masterPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('DeepSeek API error:', errorData);
      return NextResponse.json(
        { error: 'Error al generar plan de acción' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const planContent = data.choices[0]?.message?.content || 'No se pudo generar el plan de acción';

    return NextResponse.json({
      success: true,
      plan: planContent,
    });
  } catch (error) {
    console.error('Error generating AI plan:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

