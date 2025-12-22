#!/usr/bin/env node
/**
 * SQLite to MariaDB Migration Script
 * Migrates all data from mkt-planner.db (SQLite) to MariaDB
 */

const Database = require('better-sqlite3');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const SQLITE_DB = path.join(__dirname, '..', 'mkt-planner.db');
const BACKUP_DB = path.join(__dirname, '..', `mkt-planner-backup-${Date.now()}.db`);

const MYSQL_CONFIG = {
    host: '172.17.0.1', // Docker host IP
    port: 3306,
    user: 'mkt_user',
    password: 'mkt_secure_pass_2024',
    database: 'mkt_planner',
};

async function migrate() {
    console.log('🚀 Starting migration from SQLite to MariaDB...\n');

    // 1. Backup SQLite database
    console.log('📦 Creating backup of SQLite database...');
    fs.copyFileSync(SQLITE_DB, BACKUP_DB);
    console.log(`✅ Backup created: ${BACKUP_DB}\n`);

    // 2. Connect to both databases
    console.log('🔌 Connecting to databases...');
    const sqlite = new Database(SQLITE_DB, { readonly: true });
    const mysqlConn = await mysql.createConnection(MYSQL_CONFIG);
    console.log('✅ Connected to both databases\n');

    try {
        // 3. Migrate users
        console.log('👥 Migrating users...');
        const users = sqlite.prepare('SELECT * FROM users').all();
        for (const user of users) {
            await mysqlConn.execute(
                'INSERT INTO users (id, username, password_hash, full_name, role, avatar_color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [user.id, user.username, user.password_hash, user.full_name, user.role, user.avatar_color, user.created_at]
            );
        }
        console.log(`✅ Migrated ${users.length} users\n`);

        // 4. Migrate tasks
        console.log('📋 Migrating tasks...');
        const tasks = sqlite.prepare('SELECT * FROM tasks').all();
        for (const task of tasks) {
            await mysqlConn.execute(
                'INSERT INTO tasks (id, task_id, title, description, assigned_to, created_by, priority, category, status, start_date, due_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [task.id, task.task_id, task.title, task.description, task.assigned_to, task.created_by, task.priority, task.category, task.status, task.start_date, task.due_date, task.created_at, task.updated_at]
            );
        }
        console.log(`✅ Migrated ${tasks.length} tasks\n`);

        // 5. Migrate task_assignments
        console.log('🔗 Migrating task assignments...');
        const assignments = sqlite.prepare('SELECT * FROM task_assignments').all();
        for (const assignment of assignments) {
            await mysqlConn.execute(
                'INSERT INTO task_assignments (id, task_id, user_id, created_at) VALUES (?, ?, ?, ?)',
                [assignment.id, assignment.task_id, assignment.user_id, assignment.created_at]
            );
        }
        console.log(`✅ Migrated ${assignments.length} task assignments\n`);

        // 6. Migrate task_comments
        console.log('💬 Migrating task comments...');
        const comments = sqlite.prepare('SELECT * FROM task_comments').all();
        for (const comment of comments) {
            await mysqlConn.execute(
                'INSERT INTO task_comments (id, task_id, user_id, content, created_at) VALUES (?, ?, ?, ?, ?)',
                [comment.id, comment.task_id, comment.user_id, comment.content, comment.created_at]
            );
        }
        console.log(`✅ Migrated ${comments.length} comments\n`);

        // 7. Migrate task_files
        console.log('📎 Migrating task files...');
        const files = sqlite.prepare('SELECT * FROM task_files').all();
        for (const file of files) {
            await mysqlConn.execute(
                'INSERT INTO task_files (id, task_id, user_id, filename, filepath, file_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [file.id, file.task_id, file.user_id, file.filename, file.filepath, file.file_type, file.created_at]
            );
        }
        console.log(`✅ Migrated ${files.length} files\n`);

        // 8. Migrate chat_messages
        console.log('💭 Migrating chat messages...');
        const messages = sqlite.prepare('SELECT * FROM chat_messages').all();
        for (const msg of messages) {
            await mysqlConn.execute(
                'INSERT INTO chat_messages (id, user_id, message, message_type, file_path, sticker_id, referenced_tasks, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [msg.id, msg.user_id, msg.message, msg.message_type, msg.file_path, msg.sticker_id, msg.referenced_tasks, msg.created_at]
            );
        }
        console.log(`✅ Migrated ${messages.length} chat messages\n`);

        // 9. Migrate notes
        console.log('📝 Migrating notes...');
        const notes = sqlite.prepare('SELECT * FROM notes').all();
        for (const note of notes) {
            await mysqlConn.execute(
                'INSERT INTO notes (id, user_id, task_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
                [note.id, note.user_id, note.task_id, note.content, note.created_at, note.updated_at]
            );
        }
        console.log(`✅ Migrated ${notes.length} notes\n`);

        // 10. Migrate task_counters
        console.log('🔢 Migrating task counters...');
        const counters = sqlite.prepare('SELECT * FROM task_counters').all();
        for (const counter of counters) {
            await mysqlConn.execute(
                'INSERT INTO task_counters (id, role_prefix, year, month, counter) VALUES (?, ?, ?, ?, ?)',
                [counter.id, counter.role_prefix, counter.year, counter.month, counter.counter]
            );
        }
        console.log(`✅ Migrated ${counters.length} task counters\n`);

        // 11. Verify counts
        console.log('🔍 Verifying migration...');
        const tables = ['users', 'tasks', 'task_assignments', 'task_comments', 'task_files', 'chat_messages', 'notes', 'task_counters'];
        for (const table of tables) {
            const sqliteCount = sqlite.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
            const [mysqlRows] = await mysqlConn.execute(`SELECT COUNT(*) as count FROM ${table}`);
            const mysqlCount = mysqlRows[0].count;

            if (sqliteCount === mysqlCount) {
                console.log(`✅ ${table}: ${sqliteCount} rows (match)`);
            } else {
                console.log(`❌ ${table}: SQLite=${sqliteCount}, MySQL=${mysqlCount} (MISMATCH!)`);
            }
        }

        console.log('\n✨ Migration completed successfully!');
        console.log(`\n📌 Next steps:`);
        console.log(`   1. Update .env.local with DB_TYPE=mysql`);
        console.log(`   2. Restart the application`);
        console.log(`   3. Test all functionality`);
        console.log(`   4. Keep SQLite backup for 7 days: ${BACKUP_DB}`);

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    } finally {
        sqlite.close();
        await mysqlConn.end();
    }
}

migrate().catch(console.error);
