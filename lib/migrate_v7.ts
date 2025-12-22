import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'mkt-planner.db');
const db = new Database(dbPath);

console.log('🔄 Running migration v7: Make chat_messages.message nullable...');

try {
    // SQLite doesn't support ALTER COLUMN, so we need to recreate the table

    // 1. Create new table with correct schema
    db.exec(`
        CREATE TABLE IF NOT EXISTS chat_messages_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            message TEXT,
            message_type TEXT DEFAULT 'text',
            file_path TEXT,
            sticker_id TEXT,
            referenced_tasks TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    `);
    console.log('✅ Created new chat_messages table');

    // 2. Copy data from old table to new table
    db.exec(`
        INSERT INTO chat_messages_new (id, user_id, message, message_type, file_path, sticker_id, referenced_tasks, created_at)
        SELECT id, user_id, message, message_type, file_path, sticker_id, referenced_tasks, created_at
        FROM chat_messages;
    `);
    console.log('✅ Copied existing data');

    // 3. Drop old table
    db.exec('DROP TABLE chat_messages;');
    console.log('✅ Dropped old table');

    // 4. Rename new table to original name
    db.exec('ALTER TABLE chat_messages_new RENAME TO chat_messages;');
    console.log('✅ Renamed new table');

    // 5. Recreate index
    db.exec('CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);');
    console.log('✅ Recreated index');

    console.log('✅ Migration v7 completed successfully!');
} catch (error) {
    console.error('❌ Migration v7 failed:', error);
    process.exit(1);
} finally {
    db.close();
}
