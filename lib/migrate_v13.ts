import Database from 'better-sqlite3';
import { join } from 'path';

export function migrate_v13() {
  try {
    const dbPath = join(process.cwd(), 'mkt-planner.db');
    const db = new Database(dbPath);

    db.pragma('foreign_keys = ON');

    // Add media_files column to task_ai_chat table for storing image/video references
    try {
      db.exec(`ALTER TABLE task_ai_chat ADD COLUMN media_files TEXT DEFAULT NULL;`);
      console.log('Migration v13: Added media_files column to task_ai_chat');
    } catch (e: any) {
      if (!e.message.includes('duplicate column name')) {
        console.error('Error adding media_files column:', e);
      } else {
        console.log('Migration v13: media_files column already exists');
      }
    }

    db.close();
    console.log('Migration v13 completed: Task AI chat media support added');
  } catch (error) {
    console.error('Migration v13 error:', error);
  }
}

if (require.main === module) {
  migrate_v13();
}

