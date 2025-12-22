import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'mkt-planner.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('🔄 Starting migration to v5 (Notes System)...');

try {
    // 1. Create notes table
    console.log('Creating notes table...');
    db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      task_id INTEGER, -- Nullable for global/personal notes
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);

    console.log('✅ Migration v5 completed successfully!');

} catch (error) {
    console.error('❌ Migration failed:', error);
    if (db.inTransaction) db.exec('ROLLBACK');
    process.exit(1);
}

db.close();
