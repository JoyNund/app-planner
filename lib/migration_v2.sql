-- Migration script to add new fields and tables for v2

-- Add new fields to tasks table
ALTER TABLE tasks ADD COLUMN task_id TEXT;
ALTER TABLE tasks ADD COLUMN start_date DATETIME;

-- Task counters for generating custom IDs
CREATE TABLE IF NOT EXISTS task_counters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_prefix TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  counter INTEGER DEFAULT 0,
  UNIQUE(role_prefix, year, month)
);

-- Update chat_messages for v2 features
ALTER TABLE chat_messages ADD COLUMN message_type TEXT DEFAULT 'text';
ALTER TABLE chat_messages ADD COLUMN file_path TEXT;
ALTER TABLE chat_messages ADD COLUMN sticker_id TEXT;
ALTER TABLE chat_messages ADD COLUMN referenced_tasks TEXT;

-- Sticker packs
CREATE TABLE IF NOT EXISTS sticker_packs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Individual stickers
CREATE TABLE IF NOT EXISTS stickers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pack_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  FOREIGN KEY (pack_id) REFERENCES sticker_packs(id) ON DELETE CASCADE
);

-- Add index for task_id lookups
CREATE INDEX IF NOT EXISTS idx_tasks_task_id ON tasks(task_id);
