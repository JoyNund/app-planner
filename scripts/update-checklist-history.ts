import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'mkt-planner.db');
const db = new Database(dbPath);

console.log('🔧 Actualizando tabla checklist_history...');

try {
  // Drop old table
  db.exec('DROP TABLE IF EXISTS checklist_history;');
  
  // Create new table with updated structure
  db.exec(`
    CREATE TABLE IF NOT EXISTS checklist_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      content TEXT NOT NULL,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Recreate indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_checklist_history_user_id ON checklist_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_checklist_history_date ON checklist_history(date);
  `);

  console.log('✅ Tabla checklist_history actualizada exitosamente');
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

