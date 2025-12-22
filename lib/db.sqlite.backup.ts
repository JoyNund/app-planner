import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

// Set timezone to Lima, Peru (America/Lima, UTC-5)
process.env.TZ = 'America/Lima';

const dbPath = join(process.cwd(), 'mkt-planner.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Helper function to get current datetime in Lima timezone
function getLimaDateTime(): string {
  const now = new Date();
  // Format as YYYY-MM-DD HH:MM:SS in Lima timezone
  return now.toLocaleString('en-US', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/, '$3-$1-$2 $4:$5:$6');
}

// Create checklist table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS checklist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT 0,
    created_at DATETIME,
    date TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Initialize database with schema
export function initDatabase() {
  const schema = readFileSync(join(process.cwd(), 'lib', 'schema.sql'), 'utf-8');
  db.exec(schema);
  
  // Run migrations
  try {
    const { migrateV9 } = require('./migrate_v9');
    migrateV9();
  } catch (e) {
    console.log('Migration v9:', e);
  }
  
  try {
    const { migrate_v10 } = require('./migrate_v10');
    migrate_v10();
  } catch (e) {
    console.log('Migration v10:', e);
  }
  
  try {
    const { migrate_v11 } = require('./migrate_v11');
    migrate_v11();
  } catch (e) {
    console.log('Migration v11:', e);
  }
  
  try {
    const { migrate_v12 } = require('./migrate_v12');
    migrate_v12();
  } catch (e) {
    console.log('Migration v12:', e);
  }
  
  try {
    const { migrate_v13 } = require('./migrate_v13');
    migrate_v13();
  } catch (e) {
    console.log('Migration v13:', e);
  }
}

// User types
export interface User {
  id: number;
  username: string;
  password_hash: string;
  full_name: string;
  role: string; // Can be any role, including custom ones
  avatar_color: string;
  created_at: string;
}

export interface Task {
  id: number;
  task_id: string | null;
  title: string;
  description: string | null;
  assigned_to: number; // Legacy, kept for backward compatibility but will be nullable/ignored in logic
  created_by: number;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: 'design' | 'content' | 'video' | 'campaign' | 'social' | 'other';
  status: 'pending' | 'in_progress' | 'completed';
  admin_approved: number; // 0 = not approved, 1 = approved by admin
  start_date: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  assigned_users?: number[]; // IDs of assigned users
  parent_task_id?: number | null; // ID of super task parent (if this task is inside a super task)
  is_super_task?: number; // 1 if this is a super task container, 0 otherwise
  child_tasks?: Task[]; // Child tasks if this is a super task
}

export interface TaskComment {
  id: number;
  task_id: number;
  user_id: number;
  content: string;
  created_at: string;
}

export interface TaskFile {
  id: number;
  task_id: number;
  user_id: number;
  filename: string;
  filepath: string;
  file_type: string;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  user_id: number;
  message: string | null;
  message_type: 'text' | 'sticker' | 'image' | 'voice';
  file_path: string | null;
  sticker_id: string | null;
  referenced_tasks: string | null; // JSON array of task_ids
  created_at: string;
}

export interface Note {
  id: number;
  user_id: number;
  task_id: number | null;
  content: string;
  created_at: string;
  updated_at: string;
}

// User operations
export const userDb = {
  getAll: () => db.prepare('SELECT * FROM users').all() as User[],
  getById: (id: number) => db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined,
  getByUsername: (username: string) => db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined,
  create: (username: string, password_hash: string, full_name: string, role: string, avatar_color: string) =>
    db.prepare('INSERT INTO users (username, password_hash, full_name, role, avatar_color) VALUES (?, ?, ?, ?, ?)').run(username, password_hash, full_name, role, avatar_color),
  update: (id: number, full_name: string, role: string, password_hash?: string) => {
    if (password_hash) {
      return db.prepare('UPDATE users SET full_name = ?, role = ?, password_hash = ? WHERE id = ?').run(full_name, role, password_hash, id);
    }
    return db.prepare('UPDATE users SET full_name = ?, role = ? WHERE id = ?').run(full_name, role, id);
  },
  delete: (id: number) => db.prepare('DELETE FROM users WHERE id = ?').run(id),
};

// Task operations
export const taskDb = {
  // Expose db for advanced operations
  db: db,
  getAll: () => {
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC, updated_at DESC').all() as Task[];
    return tasks.map(task => {
      const assignedUsers = db.prepare('SELECT user_id FROM task_assignments WHERE task_id = ?').all(task.id).map((r: any) => r.user_id);
      // If it's a super task, get child tasks
      let childTasks: Task[] = [];
      if (task.is_super_task) {
        childTasks = db.prepare('SELECT * FROM tasks WHERE parent_task_id = ? ORDER BY created_at ASC').all(task.id) as Task[];
        childTasks = childTasks.map(child => ({
          ...child,
          assigned_users: db.prepare('SELECT user_id FROM task_assignments WHERE task_id = ?').all(child.id).map((r: any) => r.user_id)
        }));
      }
      return {
        ...task,
        assigned_users: assignedUsers,
        child_tasks: childTasks.length > 0 ? childTasks : undefined
      };
    });
  },
  getById: (id: number) => {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;
    if (!task) return undefined;
    const assignedUsers = db.prepare('SELECT user_id FROM task_assignments WHERE task_id = ?').all(id).map((r: any) => r.user_id);
    // If it's a super task, get child tasks
    let childTasks: Task[] = [];
    if (task.is_super_task) {
      childTasks = db.prepare('SELECT * FROM tasks WHERE parent_task_id = ? ORDER BY created_at ASC').all(id) as Task[];
      childTasks = childTasks.map(child => ({
        ...child,
        assigned_users: db.prepare('SELECT user_id FROM task_assignments WHERE task_id = ?').all(child.id).map((r: any) => r.user_id)
      }));
    }
    return { 
      ...task, 
      assigned_users: assignedUsers,
      child_tasks: childTasks.length > 0 ? childTasks : undefined
    };
  },
  getByTaskId: (taskId: string) => {
    const task = db.prepare('SELECT * FROM tasks WHERE task_id = ?').get(taskId) as Task | undefined;
    if (!task) return undefined;
    const assignedUsers = db.prepare('SELECT user_id FROM task_assignments WHERE task_id = ?').all(task.id).map((r: any) => r.user_id);
    return { ...task, assigned_users: assignedUsers };
  },
  getByAssignedTo: (userId: number) => {
    // Join with task_assignments, exclude child tasks (they're shown within super tasks)
    const tasks = db.prepare(`
      SELECT t.* FROM tasks t
      JOIN task_assignments ta ON t.id = ta.task_id
      WHERE ta.user_id = ? AND (t.parent_task_id IS NULL OR t.parent_task_id = 0)
      ORDER BY t.created_at DESC, t.updated_at DESC
    `).all(userId) as Task[];

    return tasks.map(task => {
      const assignedUsers = db.prepare('SELECT user_id FROM task_assignments WHERE task_id = ?').all(task.id).map((r: any) => r.user_id);
      // If it's a super task, get child tasks
      let childTasks: Task[] = [];
      if (task.is_super_task) {
        childTasks = db.prepare('SELECT * FROM tasks WHERE parent_task_id = ? ORDER BY created_at ASC').all(task.id) as Task[];
        childTasks = childTasks.map(child => ({
          ...child,
          assigned_users: db.prepare('SELECT user_id FROM task_assignments WHERE task_id = ?').all(child.id).map((r: any) => r.user_id)
        }));
      }
      return {
        ...task,
        assigned_users: assignedUsers,
        child_tasks: childTasks.length > 0 ? childTasks : undefined
      };
    });
  },
  create: (task_id: string, title: string, description: string | null, assigned_to: number, created_by: number, priority: string, category: string, start_date: string | null, due_date: string | null, assigned_users: number[] = []) => {
    const insert = db.prepare('INSERT INTO tasks (task_id, title, description, assigned_to, created_by, priority, category, start_date, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');

    const transaction = db.transaction(() => {
      const result = insert.run(task_id, title, description, assigned_to, created_by, priority, category, start_date, due_date);
      const taskId = result.lastInsertRowid as number;

      // Insert assignments
      const assignStmt = db.prepare('INSERT INTO task_assignments (task_id, user_id) VALUES (?, ?)');

      // Add primary assigned_to if not in list
      const allAssignees = new Set([...assigned_users]);
      if (assigned_to) allAssignees.add(assigned_to);

      for (const userId of allAssignees) {
        assignStmt.run(taskId, userId);
      }

      return result;
    });

    return transaction();
  },
  update: (id: number, title: string, description: string | null, assigned_to: number, priority: string, category: string, status: string, start_date: string | null, due_date: string | null, assigned_users: number[] = []) => {
    const updateTask = db.prepare('UPDATE tasks SET title = ?, description = ?, assigned_to = ?, priority = ?, category = ?, status = ?, start_date = ?, due_date = ?, updated_at = ? WHERE id = ?');

    const transaction = db.transaction(() => {
      updateTask.run(title, description, assigned_to, priority, category, status, start_date, due_date, getLimaDateTime(), id);

      // Update assignments: Delete all and re-insert
      db.prepare('DELETE FROM task_assignments WHERE task_id = ?').run(id);

      const assignStmt = db.prepare('INSERT INTO task_assignments (task_id, user_id) VALUES (?, ?)');

      // Add primary assigned_to if not in list
      const allAssignees = new Set([...assigned_users]);
      if (assigned_to) allAssignees.add(assigned_to);

      for (const userId of allAssignees) {
        assignStmt.run(id, userId);
      }
    });

    return transaction();
  },
  updateStatus: (id: number, status: string) =>
    db.prepare('UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?').run(status, getLimaDateTime(), id),
  updateStatusWithApproval: (id: number, status: string, adminApproved: number) =>
    db.prepare('UPDATE tasks SET status = ?, admin_approved = ?, updated_at = ? WHERE id = ?').run(status, adminApproved, getLimaDateTime(), id),
  updateDescription: (id: number, description: string | null) =>
    db.prepare('UPDATE tasks SET description = ?, updated_at = ? WHERE id = ?').run(description, getLimaDateTime(), id),
  delete: (id: number) => db.prepare('DELETE FROM tasks WHERE id = ?').run(id),

  // Assignment specific helpers
  getAssignedUsers: (taskId: number) => db.prepare('SELECT u.* FROM users u JOIN task_assignments ta ON u.id = ta.user_id WHERE ta.task_id = ?').all(taskId) as User[],
  
  // Super task operations
  createSuperTask: (title: string, created_by: number, taskIds: number[]) => {
    const transaction = db.transaction(() => {
      // Create the super task
      const insert = db.prepare('INSERT INTO tasks (title, description, assigned_to, created_by, priority, category, status, is_super_task) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      const result = insert.run(title, null, created_by, created_by, 'medium', 'other', 'pending', 1);
      const superTaskId = result.lastInsertRowid as number;
      
      // Assign the super task to the creator
      db.prepare('INSERT INTO task_assignments (task_id, user_id) VALUES (?, ?)').run(superTaskId, created_by);
      
      // Move tasks to the super task
      const updateStmt = db.prepare('UPDATE tasks SET parent_task_id = ? WHERE id = ?');
      for (const taskId of taskIds) {
        updateStmt.run(superTaskId, taskId);
      }
      
      return result;
    });
    
    return transaction();
  },
  
  addTaskToSuperTask: (superTaskId: number, taskId: number) => {
    // Verify super task exists and is actually a super task
    const superTask = db.prepare('SELECT is_super_task FROM tasks WHERE id = ?').get(superTaskId) as { is_super_task: number } | undefined;
    if (!superTask || !superTask.is_super_task) {
      throw new Error('Task is not a super task');
    }
    
    // Update the task's parent
    return db.prepare('UPDATE tasks SET parent_task_id = ? WHERE id = ?').run(superTaskId, taskId);
  },
  
  removeTaskFromSuperTask: (taskId: number) => {
    return db.prepare('UPDATE tasks SET parent_task_id = NULL WHERE id = ?').run(taskId);
  },
  
  getChildTasks: (superTaskId: number) => {
    const tasks = db.prepare('SELECT * FROM tasks WHERE parent_task_id = ? ORDER BY created_at ASC').all(superTaskId) as Task[];
    return tasks.map(task => ({
      ...task,
      assigned_users: db.prepare('SELECT user_id FROM task_assignments WHERE task_id = ?').all(task.id).map((r: any) => r.user_id)
    }));
  },
  
  // Get only root tasks (not child tasks of super tasks)
  getRootTasks: () => {
    const tasks = db.prepare('SELECT * FROM tasks WHERE parent_task_id IS NULL ORDER BY created_at DESC, updated_at DESC').all() as Task[];
    return tasks.map(task => {
      const assignedUsers = db.prepare('SELECT user_id FROM task_assignments WHERE task_id = ?').all(task.id).map((r: any) => r.user_id);
      // If it's a super task, get child tasks
      let childTasks: Task[] = [];
      if (task.is_super_task) {
        childTasks = db.prepare('SELECT * FROM tasks WHERE parent_task_id = ? ORDER BY created_at ASC').all(task.id) as Task[];
        childTasks = childTasks.map(child => ({
          ...child,
          assigned_users: db.prepare('SELECT user_id FROM task_assignments WHERE task_id = ?').all(child.id).map((r: any) => r.user_id)
        }));
      }
      return {
        ...task,
        assigned_users: assignedUsers,
        child_tasks: childTasks.length > 0 ? childTasks : undefined
      };
    });
  },
};

// Task comment operations
export const commentDb = {
  getByTaskId: (taskId: number) => db.prepare('SELECT * FROM task_comments WHERE task_id = ? ORDER BY created_at ASC').all(taskId) as TaskComment[],
  getById: (id: number) => db.prepare('SELECT * FROM task_comments WHERE id = ?').get(id) as TaskComment | undefined,
  create: (task_id: number, user_id: number, content: string) =>
    db.prepare('INSERT INTO task_comments (task_id, user_id, content) VALUES (?, ?, ?)').run(task_id, user_id, content),
  delete: (id: number) => db.prepare('DELETE FROM task_comments WHERE id = ?').run(id),
};

// Task file operations
export const fileDb = {
  getByTaskId: (taskId: number) => db.prepare('SELECT * FROM task_files WHERE task_id = ? ORDER BY created_at DESC').all(taskId) as TaskFile[],
  getById: (id: number) => db.prepare('SELECT * FROM task_files WHERE id = ?').get(id) as TaskFile | undefined,
  create: (task_id: number, user_id: number, filename: string, filepath: string, file_type: string) =>
    db.prepare('INSERT INTO task_files (task_id, user_id, filename, filepath, file_type) VALUES (?, ?, ?, ?, ?)').run(task_id, user_id, filename, filepath, file_type),
  delete: (id: number) => db.prepare('DELETE FROM task_files WHERE id = ?').run(id),
};

// Note operations
export const noteDb = {
  getByUser: (userId: number) => {
    // Get user's own notes and notes shared with user
    // Params order: CASE(?1), JOIN(?2), WHERE(?3, ?4) - all userId
    return db.prepare(`
      SELECT DISTINCT n.*, 
        CASE WHEN n.user_id = ? THEN 1 ELSE 0 END as is_owner,
        u.full_name as owner_name,
        u.avatar_color as owner_avatar_color
      FROM notes n
      LEFT JOIN note_shares ns ON n.id = ns.note_id AND ns.shared_with_user_id = ?
      LEFT JOIN users u ON n.user_id = u.id
      WHERE (n.user_id = ? OR ns.shared_with_user_id = ?) 
        AND n.task_id IS NULL 
      ORDER BY n.updated_at DESC
    `).all(userId, userId, userId, userId) as (Note & { is_owner: number; owner_name: string; owner_avatar_color: string })[];
  },
  getByTask: (taskId: number, userId: number) => {
    // Get user's own notes for task and notes shared with user
    // Params order: CASE(?1=userId), JOIN(?2=userId), WHERE(?3=taskId, ?4=userId, ?5=userId)
    return db.prepare(`
      SELECT DISTINCT n.*,
        CASE WHEN n.user_id = ? THEN 1 ELSE 0 END as is_owner,
        u.full_name as owner_name,
        u.avatar_color as owner_avatar_color
      FROM notes n
      LEFT JOIN note_shares ns ON n.id = ns.note_id AND ns.shared_with_user_id = ?
      LEFT JOIN users u ON n.user_id = u.id
      WHERE n.task_id = ? 
        AND (n.user_id = ? OR ns.shared_with_user_id = ?)
      ORDER BY n.updated_at DESC
    `).all(userId, userId, taskId, userId, userId) as (Note & { is_owner: number; owner_name: string; owner_avatar_color: string })[];
  },
  create: (user_id: number, content: string, task_id: number | null = null) =>
    db.prepare('INSERT INTO notes (user_id, content, task_id) VALUES (?, ?, ?)').run(user_id, content, task_id),
  update: (id: number, content: string) =>
    db.prepare('UPDATE notes SET content = ?, updated_at = ? WHERE id = ?').run(content, getLimaDateTime(), id),
  delete: (id: number) => db.prepare('DELETE FROM notes WHERE id = ?').run(id),
  getById: (id: number) => db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Note | undefined,
  
  // Share operations
  shareWithUser: (noteId: number, sharedWithUserId: number) => {
    try {
      return db.prepare('INSERT INTO note_shares (note_id, shared_with_user_id) VALUES (?, ?)').run(noteId, sharedWithUserId);
    } catch (e: any) {
      // Ignore if already shared (UNIQUE constraint)
      if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return { lastInsertRowid: 0 };
      }
      throw e;
    }
  },
  unshareWithUser: (noteId: number, sharedWithUserId: number) =>
    db.prepare('DELETE FROM note_shares WHERE note_id = ? AND shared_with_user_id = ?').run(noteId, sharedWithUserId),
  getSharedUsers: (noteId: number) =>
    db.prepare(`
      SELECT u.id, u.full_name, u.avatar_color, u.role
      FROM note_shares ns
      JOIN users u ON ns.shared_with_user_id = u.id
      WHERE ns.note_id = ?
    `).all(noteId) as { id: number; full_name: string; avatar_color: string; role: string }[],
  isSharedWith: (noteId: number, userId: number): boolean => {
    const result = db.prepare('SELECT 1 FROM note_shares WHERE note_id = ? AND shared_with_user_id = ?').get(noteId, userId);
    return !!result;
  },
};

// Chat operations
export const chatDb = {
  getRecent: (limit: number = 100) => db.prepare('SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT ?').all(limit).reverse() as ChatMessage[],
  create: (
    user_id: number,
    message: string | null,
    type: 'text' | 'sticker' | 'image' | 'voice' = 'text',
    file_path: string | null = null,
    sticker_id: string | null = null,
    referenced_tasks: string[] = []
  ) =>
    db.prepare('INSERT INTO chat_messages (user_id, message, message_type, file_path, sticker_id, referenced_tasks) VALUES (?, ?, ?, ?, ?, ?)').run(user_id, message, type, file_path, sticker_id, JSON.stringify(referenced_tasks)),
  clear: () => db.prepare('DELETE FROM chat_messages').run(),
};

// Task counter operations
export const counterDb = {
  getCounter: (rolePrefix: string, year: number, month: number) => {
    const result = db.prepare('SELECT counter FROM task_counters WHERE role_prefix = ? AND year = ? AND month = ?').get(rolePrefix, year, month) as { counter: number } | undefined;
    return result?.counter || 0;
  },
  incrementCounter: (rolePrefix: string, year: number, month: number) => {
    const current = counterDb.getCounter(rolePrefix, year, month);
    const newCounter = current + 1;
    db.prepare(`
      INSERT INTO task_counters (role_prefix, year, month, counter)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(role_prefix, year, month) DO UPDATE SET counter = ?
    `).run(rolePrefix, year, month, newCounter, newCounter);
    return newCounter;
  },
};

// Checklist operations
export const checklistDb = {
  getByUserAndDate: (userId: number, date: string) =>
    db.prepare('SELECT * FROM checklist_items WHERE user_id = ? AND date = ? ORDER BY created_at ASC').all(userId, date),

  create: (userId: number, content: string, date: string) =>
    db.prepare('INSERT INTO checklist_items (user_id, content, date, created_at) VALUES (?, ?, ?, ?)').run(userId, content, date, getLimaDateTime()),

  toggle: (id: number) => {
    const item = db.prepare('SELECT is_completed FROM checklist_items WHERE id = ?').get(id) as { is_completed: number };
    return db.prepare('UPDATE checklist_items SET is_completed = ? WHERE id = ?').run(item.is_completed ? 0 : 1, id);
  },

  delete: (id: number) => db.prepare('DELETE FROM checklist_items WHERE id = ?').run(id),
};

// Settings operations
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    app_name TEXT DEFAULT 'MKT Planner',
    logo_url TEXT,
    theme_colors TEXT DEFAULT '{}'
  );
  INSERT OR IGNORE INTO settings (id, app_name, theme_colors) VALUES (1, 'MKT Planner', '{}');
`);

export interface Settings {
  id: number;
  app_name: string;
  logo_url: string | null;
  theme_colors: string;
  ai_prompt_master: string | null;
}

export const settingsDb = {
  get: () => db.prepare('SELECT * FROM settings WHERE id = 1').get() as Settings,
  update: (app_name: string, logo_url: string | null, theme_colors: string, ai_prompt_master: string | null = null) =>
    db.prepare('UPDATE settings SET app_name = ?, logo_url = ?, theme_colors = ?, ai_prompt_master = ? WHERE id = 1').run(app_name, logo_url, theme_colors, ai_prompt_master),
};

// Notification types
export type NotificationType = 
  | 'task_created'
  | 'task_completed'
  | 'task_assigned'
  | 'task_pending'
  | 'chat_message'
  | 'task_activity'
  | 'note_created'
  | 'note_shared';

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: number;
  created_at: string;
}

// Ensure notifications table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
`);

export const notificationDb = {
  // Get notifications for a user
  getByUserId: (userId: number, limit = 50) => 
    db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(userId, limit) as Notification[],
  
  // Get unread count
  getUnreadCount: (userId: number) => {
    const result = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(userId) as { count: number };
    return result.count;
  },
  
  // Create notification
  create: (userId: number, type: NotificationType, title: string, message: string, link?: string) =>
    db.prepare('INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)')
      .run(userId, type, title, message, link || null),
  
  // Create notification for multiple users
  createForMany: (userIds: number[], type: NotificationType, title: string, message: string, link?: string) => {
    const stmt = db.prepare('INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)');
    const transaction = db.transaction(() => {
      for (const userId of userIds) {
        stmt.run(userId, type, title, message, link || null);
      }
    });
    transaction();
  },
  
  // Mark as read
  markAsRead: (id: number) =>
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id),
  
  // Mark all as read for user
  markAllAsRead: (userId: number) =>
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId),
  
  // Delete old notifications (older than 30 days)
  deleteOld: () =>
    db.prepare("DELETE FROM notifications WHERE created_at < datetime('now', '-30 days')").run(),
};

// Checklist History DB operations
export interface ChecklistHistoryItem {
  id: number;
  user_id: number;
  date: string;
  content: string;
  completed_at: string;
}

export interface ChecklistHistoryDay {
  date: string;
  items: ChecklistHistoryItem[];
  total_completed: number;
}

export const checklistHistoryDb = {
  // Get history grouped by days
  getByUserId: (userId: number, limit = 30) => {
    const items = db.prepare(`
      SELECT * FROM checklist_history 
      WHERE user_id = ? 
      ORDER BY date DESC, completed_at DESC
    `).all(userId) as ChecklistHistoryItem[];
    
    // Group by date
    const grouped = new Map<string, ChecklistHistoryItem[]>();
    items.forEach(item => {
      if (!grouped.has(item.date)) {
        grouped.set(item.date, []);
      }
      grouped.get(item.date)!.push(item);
    });
    
    // Convert to array and limit
    const days: ChecklistHistoryDay[] = Array.from(grouped.entries())
      .map(([date, items]) => ({
        date,
        items,
        total_completed: items.length,
      }))
      .slice(0, limit);
    
    return days;
  },
  
  // Get items for a specific date
  getByDate: (userId: number, date: string) =>
    db.prepare('SELECT * FROM checklist_history WHERE user_id = ? AND date = ? ORDER BY completed_at DESC')
      .all(userId, date) as ChecklistHistoryItem[],
  
  // Create history entry (single completed item)
  create: (userId: number, date: string, content: string) =>
    db.prepare('INSERT INTO checklist_history (user_id, date, content) VALUES (?, ?, ?)')
      .run(userId, date, content),
  
  // Delete history entry
  delete: (id: number) =>
    db.prepare('DELETE FROM checklist_history WHERE id = ?').run(id),
  
  // Delete all entries for a specific day
  deleteDay: (userId: number, date: string) =>
    db.prepare('DELETE FROM checklist_history WHERE user_id = ? AND date = ?').run(userId, date),
  
  // Get statistics
  getStats: (userId: number, days = 30) => {
    const result = db.prepare(`
      SELECT 
        COUNT(DISTINCT date) as total_days,
        COUNT(*) as total_completed
      FROM checklist_history 
      WHERE user_id = ? 
      AND date >= date('now', '-' || ? || ' days')
    `).get(userId, days) as { total_days: number; total_completed: number };
    return result;
  },
};

// Task AI Chat DB operations
export interface TaskAIChatMessage {
  id: number;
  task_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  media_files?: string | null; // JSON string with array of {type: 'image'|'video', url: string, filename: string}
  created_at: string;
}

export const taskAIChatDb = {
  // Get all messages for a task
  getByTaskId: (taskId: number): TaskAIChatMessage[] => {
    return db.prepare(`
      SELECT * FROM task_ai_chat 
      WHERE task_id = ? 
      ORDER BY created_at ASC
    `).all(taskId) as TaskAIChatMessage[];
  },

  // Add a message to the chat
  addMessage: (taskId: number, role: 'user' | 'assistant' | 'system', content: string, mediaFiles?: string | null) => {
    return db.prepare(`
      INSERT INTO task_ai_chat (task_id, role, content, media_files) 
      VALUES (?, ?, ?, ?)
    `).run(taskId, role, content, mediaFiles ?? null);
  },

  // Delete all messages for a task (for reset)
  deleteByTaskId: (taskId: number) => {
    return db.prepare('DELETE FROM task_ai_chat WHERE task_id = ?').run(taskId);
  },

  // Get the last message (to check if plan was already generated)
  getLastMessage: (taskId: number): TaskAIChatMessage | null => {
    const result = db.prepare(`
      SELECT * FROM task_ai_chat 
      WHERE task_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).get(taskId) as TaskAIChatMessage | undefined;
    return result || null;
  },
};

export default db;
