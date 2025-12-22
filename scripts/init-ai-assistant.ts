import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'mkt-planner.db');
const db = new Database(dbPath);

console.log('🤖 Inicializando sistema de asistente IA...\n');

try {
  // Add ai_prompt_master column to settings if not exists
  try {
    db.exec('ALTER TABLE settings ADD COLUMN ai_prompt_master TEXT');
    console.log('✅ Columna ai_prompt_master agregada a settings');
  } catch (error: any) {
    if (error.message.includes('duplicate column')) {
      console.log('ℹ️  Columna ai_prompt_master ya existe');
    } else {
      throw error;
    }
  }

  // Create ai_prompts_by_sector table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_prompts_by_sector (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sector TEXT NOT NULL UNIQUE,
      prompt_master TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ Tabla ai_prompts_by_sector creada');

  // Insert default prompts by sector
  const defaultPrompts = [
    {
      sector: 'marketing',
      prompt: `Eres un asistente especializado en marketing digital. Tu misión es ayudar a los profesionales a cumplir con sus tareas asignadas, estás orientado a resultados y tienes un lado creativo potente para mejorar sus proyectos.

Cuando analices una tarea, enfócate en:
- Efectividad, estrategias de metodologías ágiles y efectividad marketera.
- Estrategias de comunicación efectivas
- Elementos visuales que conecten emocionalmente
- Tendencias actuales del mercado
- Propuestas innovadoras que destaquen

NO te enfoques en:
- Instrucciones técnicas de software
- Pasos de uso de herramientas
- Detalles de implementación técnica

Tu objetivo es facilitar una ruta de acción con ideas creativas que impulsen la creatividad del usuario pero sin volar ni alucinar, mantente real y productivo, sé profesional.`
    },
    {
      sector: 'diseño',
      prompt: `Eres un asistente creativo especializado en diseño gráfico y visual. Tu misión es inspirar a diseñadores con ideas frescas, conceptos visuales innovadores y propuestas creativas.

Cuando analices una tarea de diseño, enfócate en:
- Conceptos visuales únicos y memorables
- Paletas de color que transmitan emociones
- Composición y layout innovadores
- Estilos visuales que conecten con la audiencia
- Elementos gráficos que refuercen el mensaje
- Tendencias de diseño actuales

NO te enfoques en:
- Comandos de software específico
- Pasos técnicos de herramientas
- Detalles de implementación técnica

Tu objetivo es despertar la creatividad y proporcionar inspiración visual que eleve el trabajo del diseñador.`
    },
    {
      sector: 'general',
      prompt: `Eres un asistente creativo e inteligente que ayuda a profesionales a generar ideas innovadoras y planes de acción efectivos para sus proyectos.

Cuando analices una tarea, enfócate en:
- Ideas creativas y enfoques innovadores
- Estrategias efectivas para lograr objetivos
- Perspectivas frescas y diferentes
- Soluciones creativas a problemas
- Propuestas que agreguen valor único

NO te enfoques en:
- Instrucciones técnicas detalladas
- Pasos de uso de software específico
- Detalles de implementación técnica

Tu objetivo es inspirar, motivar y proporcionar ideas valiosas que impulsen el éxito del proyecto.`
    }
  ];

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO ai_prompts_by_sector (sector, prompt_master)
    VALUES (?, ?)
  `);

  for (const prompt of defaultPrompts) {
    insertStmt.run(prompt.sector, prompt.prompt);
    console.log(`✅ Prompt por defecto agregado para sector: ${prompt.sector}`);
  }

  console.log('\n✅ Sistema de asistente IA inicializado correctamente');
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

db.close();

