-- Migration to Supabase PostgreSQL
-- Converted from SQLite schema

-- Enable UUID extension (optional, but useful)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar_color TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  task_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to INTEGER NOT NULL,
  created_by INTEGER NOT NULL,
  priority TEXT NOT NULL CHECK(priority IN ('urgent', 'high', 'medium', 'low')),
  category TEXT NOT NULL CHECK(category IN ('design', 'content', 'video', 'campaign', 'social', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
  admin_approved INTEGER DEFAULT 0,
  start_date TIMESTAMP,
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  parent_task_id INTEGER,
  is_super_task INTEGER DEFAULT 0,
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

-- Task assignments (multiple users per task)
CREATE TABLE IF NOT EXISTS task_assignments (
  task_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (task_id, user_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Task comments (timeline)
CREATE TABLE IF NOT EXISTS task_comments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Task files
CREATE TABLE IF NOT EXISTS task_files (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  message TEXT,
  message_type TEXT DEFAULT 'text',
  file_path TEXT,
  sticker_id TEXT,
  referenced_tasks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Notes (personal and task-related)
CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  task_id INTEGER,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Note shares (for sharing notes between users)
CREATE TABLE IF NOT EXISTS note_shares (
  id SERIAL PRIMARY KEY,
  note_id INTEGER NOT NULL,
  shared_with_user_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_with_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(note_id, shared_with_user_id)
);

-- Task counters (for custom task IDs)
CREATE TABLE IF NOT EXISTS task_counters (
  id SERIAL PRIMARY KEY,
  role_prefix TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  counter INTEGER DEFAULT 0,
  UNIQUE(role_prefix, year, month)
);

-- Checklist items (daily checklist)
CREATE TABLE IF NOT EXISTS checklist_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Checklist history (archived completed items by day)
CREATE TABLE IF NOT EXISTS checklist_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  content TEXT NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  app_name TEXT DEFAULT 'MKT Planner',
  logo_url TEXT,
  theme_colors TEXT DEFAULT '{}',
  ai_prompt_master TEXT
);

-- AI prompts by sector (default prompts)
CREATE TABLE IF NOT EXISTS ai_prompts_by_sector (
  id SERIAL PRIMARY KEY,
  sector TEXT NOT NULL UNIQUE,
  prompt_master TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sticker packs
CREATE TABLE IF NOT EXISTS sticker_packs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stickers
CREATE TABLE IF NOT EXISTS stickers (
  id SERIAL PRIMARY KEY,
  pack_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  FOREIGN KEY (pack_id) REFERENCES sticker_packs(id) ON DELETE CASCADE
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- AI Assistant Prompts (for task action plans)
CREATE TABLE IF NOT EXISTS ai_prompts (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  master_prompt TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task AI Chat (for per-task AI chat history)
CREATE TABLE IF NOT EXISTS task_ai_chat (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  media_files TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_task_id ON tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_files_task_id ON task_files(task_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_checklist_history_user_id ON checklist_history(user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_history_date ON checklist_history(date);
CREATE INDEX IF NOT EXISTS idx_task_ai_chat_task_id ON task_ai_chat(task_id);
CREATE INDEX IF NOT EXISTS idx_task_ai_chat_created_at ON task_ai_chat(created_at);

