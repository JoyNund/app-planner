import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'mkt-planner.db');
const db = new Database(dbPath);

console.log('🔄 Running migration v6: Chat multimedia support...');

try {
    // Check if columns already exist
    const tableInfo = db.prepare("PRAGMA table_info(chat_messages)").all() as Array<{ name: string }>;
    const columnNames = tableInfo.map(col => col.name);

    // Add message_type if it doesn't exist
    if (!columnNames.includes('message_type')) {
        db.exec("ALTER TABLE chat_messages ADD COLUMN message_type TEXT DEFAULT 'text'");
        console.log('✅ Added message_type column');
    } else {
        console.log('⏭️  message_type column already exists');
    }

    // Add file_path if it doesn't exist
    if (!columnNames.includes('file_path')) {
        db.exec("ALTER TABLE chat_messages ADD COLUMN file_path TEXT");
        console.log('✅ Added file_path column');
    } else {
        console.log('⏭️  file_path column already exists');
    }

    // Add sticker_id if it doesn't exist
    if (!columnNames.includes('sticker_id')) {
        db.exec("ALTER TABLE chat_messages ADD COLUMN sticker_id TEXT");
        console.log('✅ Added sticker_id column');
    } else {
        console.log('⏭️  sticker_id column already exists');
    }

    // Add referenced_tasks if it doesn't exist
    if (!columnNames.includes('referenced_tasks')) {
        db.exec("ALTER TABLE chat_messages ADD COLUMN referenced_tasks TEXT");
        console.log('✅ Added referenced_tasks column');
    } else {
        console.log('⏭️  referenced_tasks column already exists');
    }

    console.log('✅ Migration v6 completed successfully!');
} catch (error) {
    console.error('❌ Migration v6 failed:', error);
    process.exit(1);
} finally {
    db.close();
}
