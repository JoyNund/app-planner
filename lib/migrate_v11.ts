import Database from 'better-sqlite3';
import { join } from 'path';

export function migrate_v11() {
  try {
    const dbPath = join(process.cwd(), 'mkt-planner.db');
    const db = new Database(dbPath);
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Add parent_task_id column to support super tasks
    try {
      db.exec(`
        ALTER TABLE tasks ADD COLUMN parent_task_id INTEGER;
      `);
      console.log('Migration v11: Added parent_task_id column');
    } catch (e: any) {
      if (e.code === 'SQLITE_ERROR' && e.message.includes('duplicate column')) {
        console.log('Migration v11: parent_task_id column already exists');
      } else {
        throw e;
      }
    }
    
    // Add is_super_task column to identify super task containers
    try {
      db.exec(`
        ALTER TABLE tasks ADD COLUMN is_super_task INTEGER DEFAULT 0;
      `);
      console.log('Migration v11: Added is_super_task column');
    } catch (e: any) {
      if (e.code === 'SQLITE_ERROR' && e.message.includes('duplicate column')) {
        console.log('Migration v11: is_super_task column already exists');
      } else {
        throw e;
      }
    }
    
    // Add foreign key constraint for parent_task_id
    try {
      // SQLite doesn't support adding foreign keys via ALTER TABLE, so we'll handle it in application logic
      // But we can create an index for performance
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);
      `);
      console.log('Migration v11: Created index on parent_task_id');
    } catch (e: any) {
      console.log('Migration v11: Index creation note:', e.message);
    }
    
    db.close();
    console.log('Migration v11 completed: Super tasks support added');
  } catch (error) {
    console.error('Migration v11 error:', error);
  }
}

