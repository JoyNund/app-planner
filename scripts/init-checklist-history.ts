import db from '../lib/db';

console.log('🔧 Inicializando tabla checklist_history...');

try {
  // Create checklist_history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS checklist_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      items TEXT NOT NULL,
      total_items INTEGER NOT NULL,
      completed_items INTEGER NOT NULL,
      completion_percentage INTEGER NOT NULL,
      archived_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_checklist_history_user_id ON checklist_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_checklist_history_date ON checklist_history(date);
  `);

  console.log('✅ Tabla checklist_history creada exitosamente');
  console.log('✅ Índices creados exitosamente');
} catch (error) {
  console.error('❌ Error al crear tabla:', error);
  process.exit(1);
}

