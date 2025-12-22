import Database from 'better-sqlite3';
import { join } from 'path';

export function migrate_v10() {
  try {
    const dbPath = join(process.cwd(), 'mkt-planner.db');
    const db = new Database(dbPath);
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Create note_shares table for shared notes
    db.exec(`
      CREATE TABLE IF NOT EXISTS note_shares (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        note_id INTEGER NOT NULL,
        shared_with_user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (shared_with_user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(note_id, shared_with_user_id)
      );
    `);

    db.close();
    console.log('Migration v10 completed: note_shares table created');
  } catch (error) {
    console.error('Migration v10 error:', error);
  }
}

