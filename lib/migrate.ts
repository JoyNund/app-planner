import Database from 'better-sqlite3';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { generateTaskId, getRolePrefix } from './taskId';

const dbPath = join(process.cwd(), 'mkt-planner.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('🔄 Starting migration to v2...');

try {
    // Add columns to tasks table
    console.log('Adding task_id column...');
    try {
        db.exec('ALTER TABLE tasks ADD COLUMN task_id TEXT');
    } catch (e: any) {
        if (!e.message.includes('duplicate column')) throw e;
        console.log('  ✓ task_id column already exists');
    }

    console.log('Adding start_date column...');
    try {
        db.exec('ALTER TABLE tasks ADD COLUMN start_date DATETIME');
    } catch (e: any) {
        if (!e.message.includes('duplicate column')) throw e;
        console.log('  ✓ start_date column already exists');
    }

    // Create task_counters table
    console.log('Creating task_counters table...');
    db.exec(`
    CREATE TABLE IF NOT EXISTS task_counters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_prefix TEXT NOT NULL,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      counter INTEGER DEFAULT 0,
      UNIQUE(role_prefix, year, month)
    )
  `);

    // Add columns to chat_messages
    console.log('Updating chat_messages table...');
    try {
        db.exec('ALTER TABLE chat_messages ADD COLUMN message_type TEXT DEFAULT \'text\'');
    } catch (e: any) {
        if (!e.message.includes('duplicate column')) throw e;
    }

    try {
        db.exec('ALTER TABLE chat_messages ADD COLUMN file_path TEXT');
    } catch (e: any) {
        if (!e.message.includes('duplicate column')) throw e;
    }

    try {
        db.exec('ALTER TABLE chat_messages ADD COLUMN sticker_id TEXT');
    } catch (e: any) {
        if (!e.message.includes('duplicate column')) throw e;
    }

    try {
        db.exec('ALTER TABLE chat_messages ADD COLUMN referenced_tasks TEXT');
    } catch (e: any) {
        if (!e.message.includes('duplicate column')) throw e;
    }

    // Create sticker tables
    console.log('Creating sticker tables...');
    db.exec(`
    CREATE TABLE IF NOT EXISTS sticker_packs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    db.exec(`
    CREATE TABLE IF NOT EXISTS stickers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pack_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      FOREIGN KEY (pack_id) REFERENCES sticker_packs(id) ON DELETE CASCADE
    )
  `);

    // Create index
    try {
        db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_task_id ON tasks(task_id)');
    } catch (e: any) {
        // Index might already exist
    }

    console.log('✅ Schema migration completed');

    // Check if task_id column exists
    const tableInfo = db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
    const hasTaskId = tableInfo.some(col => col.name === 'task_id');

    if (!hasTaskId) {
        console.error('❌ task_id column was not created');
        process.exit(1);
    }

    // Generate task_ids for existing tasks
    const tasks = db.prepare('SELECT id, assigned_to, created_at, due_date FROM tasks WHERE task_id IS NULL').all() as Array<{
        id: number;
        assigned_to: number;
        created_at: string;
        due_date: string | null;
    }>;

    console.log(`📝 Generating task IDs for ${tasks.length} existing tasks...`);

    // Get user roles
    const users = db.prepare('SELECT id, role FROM users').all() as Array<{ id: number; role: string }>;
    const userRoles = new Map(users.map(u => [u.id, u.role]));

    // Counter cache
    const counterCache = new Map<string, number>();

    // Start transaction for updates
    db.exec('BEGIN TRANSACTION');

    for (const task of tasks) {
        const role = userRoles.get(task.assigned_to) || 'admin';
        const taskDate = new Date(task.created_at);
        const year = taskDate.getFullYear();
        const month = taskDate.getMonth();
        const rolePrefix = getRolePrefix(role);

        // Get or initialize counter
        const counterKey = `${rolePrefix}-${year}-${month}`;
        let counter = counterCache.get(counterKey);

        if (counter === undefined) {
            // Check database
            const existing = db.prepare(
                'SELECT counter FROM task_counters WHERE role_prefix = ? AND year = ? AND month = ?'
            ).get(rolePrefix, year, month) as { counter: number } | undefined;

            counter = existing ? existing.counter + 1 : 1;
        } else {
            counter++;
        }

        counterCache.set(counterKey, counter);

        // Generate task ID
        const taskId = generateTaskId(role, counter, taskDate);

        // Update task
        db.prepare('UPDATE tasks SET task_id = ? WHERE id = ?').run(taskId, task.id);

        // Update or insert counter
        db.prepare(`
      INSERT INTO task_counters (role_prefix, year, month, counter)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(role_prefix, year, month) DO UPDATE SET counter = ?
    `).run(rolePrefix, year, month, counter, counter);

        // Set start_date if not set (7 days before due_date or created_at)
        if (task.due_date) {
            const dueDate = new Date(task.due_date);
            const startDate = new Date(dueDate);
            startDate.setDate(startDate.getDate() - 7);
            db.prepare('UPDATE tasks SET start_date = ? WHERE id = ?').run(startDate.toISOString(), task.id);
        } else {
            db.prepare('UPDATE tasks SET start_date = ? WHERE id = ?').run(task.created_at, task.id);
        }

        console.log(`  ✓ Task ${task.id} → ${taskId}`);
    }

    db.exec('COMMIT');

    console.log('✅ Migration completed successfully!');
    console.log(`📊 Generated ${tasks.length} task IDs`);
    console.log(`📊 Created ${counterCache.size} counter entries`);

} catch (error) {
    db.exec('ROLLBACK');
    console.error('❌ Migration failed:', error);
    process.exit(1);
}

db.close();
console.log('🎉 Database migration to v2 complete!');
