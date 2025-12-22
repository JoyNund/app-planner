import Database from 'better-sqlite3';
import { join } from 'path';

export function migrate_v12() {
  try {
    const dbPath = join(process.cwd(), 'mkt-planner.db');
    const db = new Database(dbPath);

    db.pragma('foreign_keys = ON');

    // Create task_ai_chat table for storing chat history per task
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS task_ai_chat (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id INTEGER NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        );
      `);
      console.log('Migration v12: Created task_ai_chat table');
    } catch (e: any) {
      if (!e.message.includes('already exists')) {
        console.error('Error creating task_ai_chat table:', e);
      } else {
        console.log('Migration v12: task_ai_chat table already exists');
      }
    }

    // Create index for faster queries
    try {
      db.exec(`CREATE INDEX IF NOT EXISTS idx_task_ai_chat_task_id ON task_ai_chat(task_id);`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_task_ai_chat_created_at ON task_ai_chat(created_at);`);
      console.log('Migration v12: Created indexes on task_ai_chat');
    } catch (e: any) {
      console.error('Error creating indexes on task_ai_chat:', e);
    }

    db.close();
    console.log('Migration v12 completed: Task AI chat support added');
  } catch (error) {
    console.error('Migration v12 error:', error);
  }
}

if (require.main === module) {
  migrate_v12();
}

