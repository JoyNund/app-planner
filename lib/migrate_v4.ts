import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'mkt-planner.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('🔄 Starting migration to v4 (Group Tasks)...');

try {
    // 1. Create task_assignments table
    console.log('Creating task_assignments table...');
    db.exec(`
    CREATE TABLE IF NOT EXISTS task_assignments (
      task_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (task_id, user_id),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

    // 2. Migrate existing assignments
    console.log('Migrating existing assignments...');
    const tasks = db.prepare('SELECT id, assigned_to FROM tasks WHERE assigned_to IS NOT NULL').all() as Array<{ id: number; assigned_to: number }>;

    const insertStmt = db.prepare('INSERT OR IGNORE INTO task_assignments (task_id, user_id) VALUES (?, ?)');

    db.exec('BEGIN TRANSACTION');
    let migratedCount = 0;
    for (const task of tasks) {
        if (task.assigned_to) {
            insertStmt.run(task.id, task.assigned_to);
            migratedCount++;
        }
    }
    db.exec('COMMIT');
    console.log(`  ✓ Migrated ${migratedCount} assignments`);

    // 3. Make assigned_to column nullable (SQLite doesn't support dropping columns easily, so we just make it nullable or ignore it)
    // In a real production scenario with massive data, we might recreate the table, but for this scale, we'll just ignore the old column.
    // However, to be clean, let's check if we can alter it to be nullable if it isn't already (it is NOT NULL in schema).
    // SQLite limitations make ALTER TABLE difficult for constraints. We will keep the column for now as a "primary assignee" or legacy field, 
    // but the application logic will switch to using task_assignments.

    console.log('✅ Migration v4 completed successfully!');

} catch (error) {
    console.error('❌ Migration failed:', error);
    if (db.inTransaction) db.exec('ROLLBACK');
    process.exit(1);
}

db.close();
