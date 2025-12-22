import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'mkt-planner.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Migration v8: Add admin_approved field to tasks
export function migrateV8() {
  try {
    // Check if column already exists
    const tableInfo = db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
    const hasAdminApproved = tableInfo.some(col => col.name === 'admin_approved');

    if (!hasAdminApproved) {
      // Add admin_approved column (0 = not approved, 1 = approved by admin)
      db.prepare(`
        ALTER TABLE tasks 
        ADD COLUMN admin_approved INTEGER DEFAULT 0
      `).run();

      // Set existing completed tasks as approved (backward compatibility)
      db.prepare(`
        UPDATE tasks 
        SET admin_approved = 1 
        WHERE status = 'completed'
      `).run();

      console.log('Migration v8: Added admin_approved field to tasks');
    } else {
      console.log('Migration v8: admin_approved field already exists');
    }
  } catch (error) {
    console.error('Migration v8 error:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateV8();
  db.close();
}

export default migrateV8;

