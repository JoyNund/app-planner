import { supabase, getLimaDateTime } from './supabase';
import type { 
  User, 
  Task, 
  TaskComment, 
  TaskFile, 
  ChatMessage, 
  Note, 
  TaskAIChatMessage 
} from './supabase';

// Re-export types for convenience
export type { User, Task, TaskComment, TaskFile, ChatMessage, Note, TaskAIChatMessage };

// User operations
export const userDb = {
  getAll: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  getById: async (id: number): Promise<User | undefined> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      throw error;
    }
    return data;
  },

  getByUsername: async (username: string): Promise<User | undefined> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      throw error;
    }
    return data;
  },

  create: async (username: string, password_hash: string, full_name: string, role: string, avatar_color: string) => {
    const { data, error } = await supabase
      .from('users')
      .insert({ username, password_hash, full_name, role, avatar_color })
      .select()
      .single();
    
    if (error) throw error;
    return { lastInsertRowid: data.id };
  },

  update: async (id: number, full_name: string, role: string, password_hash?: string) => {
    const updateData: any = { full_name, role };
    if (password_hash) updateData.password_hash = password_hash;

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id);
    
    if (error) throw error;
    return { changes: 1 };
  },

  delete: async (id: number) => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { changes: 1 };
  },
};

// Helper function to enrich task with assigned users and child tasks
async function enrichTask(task: any): Promise<Task> {
  // Get assigned users
  const { data: assignments } = await supabase
    .from('task_assignments')
    .select('user_id')
    .eq('task_id', task.id);
  
  const assignedUsers = assignments?.map(a => a.user_id) || [];

  // If it's a super task, get child tasks
  let childTasks: Task[] = [];
  if (task.is_super_task) {
    const { data: children } = await supabase
      .from('tasks')
      .select('*')
      .eq('parent_task_id', task.id)
      .order('created_at', { ascending: true });
    
    if (children) {
      childTasks = await Promise.all(children.map(async (child: any) => {
        const { data: childAssignments } = await supabase
          .from('task_assignments')
          .select('user_id')
          .eq('task_id', child.id);
        
        return {
          ...child,
          assigned_users: childAssignments?.map(a => a.user_id) || []
        };
      }));
    }
  }

  return {
    ...task,
    assigned_users: assignedUsers,
    child_tasks: childTasks.length > 0 ? childTasks : undefined
  };
}

// Task operations
export const taskDb = {
  getAll: async (): Promise<Task[]> => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    if (!data) return [];

    return Promise.all(data.map(enrichTask));
  },

  getById: async (id: number): Promise<Task | undefined> => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      throw error;
    }
    if (!data) return undefined;

    return enrichTask(data);
  },

  getByTaskId: async (taskId: string): Promise<Task | undefined> => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('task_id', taskId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      throw error;
    }
    if (!data) return undefined;

    return enrichTask(data);
  },

  getByAssignedTo: async (userId: number): Promise<Task[]> => {
    // Get tasks assigned to user, excluding child tasks
    const { data, error } = await supabase
      .from('task_assignments')
      .select(`
        task_id,
        tasks!task_assignments_task_id_fkey(*)
      `)
      .eq('user_id', userId);
    
    if (error) {
      // Fallback: query tasks directly if foreign key relationship doesn't work
      const { data: assignments } = await supabase
        .from('task_assignments')
        .select('task_id')
        .eq('user_id', userId);
      
      if (!assignments || assignments.length === 0) return [];
      
      const taskIds = assignments.map(a => a.task_id);
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .in('id', taskIds)
        .is('parent_task_id', null);
      
      if (tasksError) throw tasksError;
      if (!tasksData) return [];
      
      return Promise.all(tasksData.map(enrichTask));
    }
    
    if (!data) return [];

    // Filter out child tasks and get unique tasks
    const taskMap = new Map<number, any>();
    for (const assignment of data) {
      const task = (assignment as any).tasks;
      if (task && (!task.parent_task_id || task.parent_task_id === 0)) {
        taskMap.set(task.id, task);
      }
    }

    const tasks = Array.from(taskMap.values());
    return Promise.all(tasks.map(enrichTask));
  },

  create: async (
    task_id: string,
    title: string,
    description: string | null,
    assigned_to: number,
    created_by: number,
    priority: string,
    category: string,
    start_date: string | null,
    due_date: string | null,
    assigned_users: number[] = []
  ) => {
    // Insert task
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .insert({
        task_id,
        title,
        description,
        assigned_to,
        created_by,
        priority,
        category,
        start_date,
        due_date
      })
      .select()
      .single();
    
    if (taskError) throw taskError;
    if (!taskData) throw new Error('Failed to create task');

    // Insert assignments
    const allAssignees = new Set([...assigned_users]);
    if (assigned_to) allAssignees.add(assigned_to);

    if (allAssignees.size > 0) {
      const assignments = Array.from(allAssignees).map(userId => ({
        task_id: taskData.id,
        user_id: userId
      }));

      const { error: assignError } = await supabase
        .from('task_assignments')
        .insert(assignments);
      
      if (assignError) throw assignError;
    }

    return { lastInsertRowid: taskData.id };
  },

  update: async (
    id: number,
    title: string,
    description: string | null,
    assigned_to: number,
    priority: string,
    category: string,
    status: string,
    start_date: string | null,
    due_date: string | null,
    assigned_users: number[] = []
  ) => {
    // Update task
    const { error: taskError } = await supabase
      .from('tasks')
      .update({
        title,
        description,
        assigned_to,
        priority,
        category,
        status,
        start_date,
        due_date,
        updated_at: getLimaDateTime()
      })
      .eq('id', id);
    
    if (taskError) throw taskError;

    // Update assignments: Delete all and re-insert
    await supabase
      .from('task_assignments')
      .delete()
      .eq('task_id', id);

    const allAssignees = new Set([...assigned_users]);
    if (assigned_to) allAssignees.add(assigned_to);

    if (allAssignees.size > 0) {
      const assignments = Array.from(allAssignees).map(userId => ({
        task_id: id,
        user_id: userId
      }));

      const { error: assignError } = await supabase
        .from('task_assignments')
        .insert(assignments);
      
      if (assignError) throw assignError;
    }

    return { changes: 1 };
  },

  updateStatus: async (id: number, status: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status, updated_at: getLimaDateTime() })
      .eq('id', id);
    
    if (error) throw error;
    return { changes: 1 };
  },

  updateStatusWithApproval: async (id: number, status: string, adminApproved: number) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status, admin_approved: adminApproved, updated_at: getLimaDateTime() })
      .eq('id', id);
    
    if (error) throw error;
    return { changes: 1 };
  },

  updateDescription: async (id: number, description: string | null) => {
    const { error } = await supabase
      .from('tasks')
      .update({ description, updated_at: getLimaDateTime() })
      .eq('id', id);
    
    if (error) throw error;
    return { changes: 1 };
  },

  delete: async (id: number) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { changes: 1 };
  },

  getAssignedUsers: async (taskId: number): Promise<User[]> => {
    const { data, error } = await supabase
      .from('task_assignments')
      .select(`
        user_id,
        users!inner(*)
      `)
      .eq('task_id', taskId);
    
    if (error) throw error;
    if (!data) return [];

    return data.map((item: any) => item.users).filter(Boolean);
  },

  // Super task operations
  createSuperTask: async (title: string, created_by: number, taskIds: number[]) => {
    // Create the super task
    const { data: superTask, error: taskError } = await supabase
      .from('tasks')
      .insert({
        title,
        description: null,
        assigned_to: created_by,
        created_by,
        priority: 'medium',
        category: 'other',
        status: 'pending',
        is_super_task: 1
      })
      .select()
      .single();
    
    if (taskError) throw taskError;
    if (!superTask) throw new Error('Failed to create super task');

    // Assign the super task to the creator
    await supabase
      .from('task_assignments')
      .insert({ task_id: superTask.id, user_id: created_by });

    // Move tasks to the super task
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ parent_task_id: superTask.id })
      .in('id', taskIds);
    
    if (updateError) throw updateError;

    return { lastInsertRowid: superTask.id };
  },

  addTaskToSuperTask: async (superTaskId: number, taskId: number) => {
    // Verify super task exists and is actually a super task
    const { data: superTask, error: checkError } = await supabase
      .from('tasks')
      .select('is_super_task')
      .eq('id', superTaskId)
      .single();
    
    if (checkError) throw checkError;
    if (!superTask || !superTask.is_super_task) {
      throw new Error('Task is not a super task');
    }

    // Update the task's parent
    const { error } = await supabase
      .from('tasks')
      .update({ parent_task_id: superTaskId })
      .eq('id', taskId);
    
    if (error) throw error;
    return { changes: 1 };
  },

  removeTaskFromSuperTask: async (taskId: number) => {
    const { error } = await supabase
      .from('tasks')
      .update({ parent_task_id: null })
      .eq('id', taskId);
    
    if (error) throw error;
    return { changes: 1 };
  },

  getChildTasks: async (superTaskId: number): Promise<Task[]> => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('parent_task_id', superTaskId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    if (!data) return [];

    return Promise.all(data.map(async (task: any) => {
      const { data: assignments } = await supabase
        .from('task_assignments')
        .select('user_id')
        .eq('task_id', task.id);
      
      return {
        ...task,
        assigned_users: assignments?.map(a => a.user_id) || []
      };
    }));
  },

  // Get only root tasks (not child tasks of super tasks)
  getRootTasks: async (): Promise<Task[]> => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .is('parent_task_id', null)
      .order('created_at', { ascending: false })
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    if (!data) return [];

    return Promise.all(data.map(enrichTask));
  },
};

// Task comment operations
export const commentDb = {
  getByTaskId: async (taskId: number): Promise<TaskComment[]> => {
    const { data, error } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  getById: async (id: number): Promise<TaskComment | undefined> => {
    const { data, error } = await supabase
      .from('task_comments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      throw error;
    }
    return data;
  },

  create: async (task_id: number, user_id: number, content: string) => {
    const { data, error } = await supabase
      .from('task_comments')
      .insert({ task_id, user_id, content })
      .select()
      .single();
    
    if (error) throw error;
    return { lastInsertRowid: data.id };
  },

  delete: async (id: number) => {
    const { error } = await supabase
      .from('task_comments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { changes: 1 };
  },
};

// Task file operations
export const fileDb = {
  getByTaskId: async (taskId: number): Promise<TaskFile[]> => {
    const { data, error } = await supabase
      .from('task_files')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  getById: async (id: number): Promise<TaskFile | undefined> => {
    const { data, error } = await supabase
      .from('task_files')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      throw error;
    }
    return data;
  },

  create: async (task_id: number, user_id: number, filename: string, filepath: string, file_type: string) => {
    const { data, error } = await supabase
      .from('task_files')
      .insert({ task_id, user_id, filename, filepath, file_type })
      .select()
      .single();
    
    if (error) throw error;
    return { lastInsertRowid: data.id };
  },

  delete: async (id: number) => {
    const { error } = await supabase
      .from('task_files')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { changes: 1 };
  },
};

// Note operations
export const noteDb = {
  getByUser: async (userId: number) => {
    const { data, error } = await supabase
      .rpc('get_user_notes', { user_id_param: userId });
    
    if (error) {
      // Fallback to manual query if RPC doesn't exist
      const { data: ownNotes } = await supabase
        .from('notes')
        .select('*, users!notes_user_id_fkey(*)')
        .eq('user_id', userId)
        .is('task_id', null);
      
      const { data: sharedNotes } = await supabase
        .from('note_shares')
        .select('notes(*, users!notes_user_id_fkey(*))')
        .eq('shared_with_user_id', userId);
      
      const notes = [
        ...(ownNotes || []).map((n: any) => ({
          ...n,
          is_owner: 1,
          owner_name: n.users?.full_name,
          owner_avatar_color: n.users?.avatar_color
        })),
        ...(sharedNotes || []).map((ns: any) => ({
          ...ns.notes,
          is_owner: 0,
          owner_name: ns.notes?.users?.full_name,
          owner_avatar_color: ns.notes?.users?.avatar_color
        }))
      ];

      return notes.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    }
    
    return data || [];
  },

  getByTask: async (taskId: number, userId: number) => {
    // Get own notes for task
    const { data: ownNotes, error: ownError } = await supabase
      .from('notes')
      .select('*')
      .eq('task_id', taskId)
      .eq('user_id', userId);
    
    if (ownError) throw ownError;

    // Get shared notes for task
    const { data: sharedNotesData, error: sharedError } = await supabase
      .from('note_shares')
      .select('note_id, notes(*)')
      .eq('shared_with_user_id', userId);
    
    if (sharedError) throw sharedError;

    // Filter shared notes by task_id
    const sharedNoteIds = (sharedNotesData || [])
      .filter((ns: any) => ns.notes?.task_id === taskId)
      .map((ns: any) => ns.note_id);

    let sharedNotes: any[] = [];
    if (sharedNoteIds.length > 0) {
      const { data: sharedNotesList, error: sharedNotesError } = await supabase
        .from('notes')
        .select('*')
        .in('id', sharedNoteIds)
        .eq('task_id', taskId);
      
      if (sharedNotesError) throw sharedNotesError;
      
      // Get owner info
      const ownerIds = [...new Set((sharedNotesList || []).map((n: any) => n.user_id))];
      const { data: owners, error: ownersError } = await supabase
        .from('users')
        .select('id, full_name, avatar_color')
        .in('id', ownerIds);
      
      if (ownersError) throw ownersError;
      const ownerMap = new Map((owners || []).map((o: any) => [o.id, o]));
      
      sharedNotes = (sharedNotesList || []).map((n: any) => {
        const owner = ownerMap.get(n.user_id);
        return {
          ...n,
          is_owner: 0,
          owner_name: owner?.full_name || null,
          owner_avatar_color: owner?.avatar_color || null
        };
      });
    }

    // Get owner info for own notes
    const { data: currentUser } = await supabase
      .from('users')
      .select('full_name, avatar_color')
      .eq('id', userId)
      .single();

    const ownNotesWithUser = (ownNotes || []).map((n: any) => ({
      ...n,
      is_owner: 1,
      owner_name: currentUser?.full_name || null,
      owner_avatar_color: currentUser?.avatar_color || null
    }));

    const allNotes = [...ownNotesWithUser, ...sharedNotes];
    return allNotes.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  },

  create: async (user_id: number, content: string, task_id: number | null = null) => {
    const { data, error } = await supabase
      .from('notes')
      .insert({ user_id, content, task_id })
      .select()
      .single();
    
    if (error) throw error;
    return { lastInsertRowid: data.id };
  },

  update: async (id: number, content: string) => {
    const { error } = await supabase
      .from('notes')
      .update({ content, updated_at: getLimaDateTime() })
      .eq('id', id);
    
    if (error) throw error;
    return { changes: 1 };
  },

  delete: async (id: number) => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { changes: 1 };
  },

  getById: async (id: number): Promise<Note | undefined> => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      throw error;
    }
    return data;
  },

  shareWithUser: async (noteId: number, sharedWithUserId: number) => {
    const { data, error } = await supabase
      .from('note_shares')
      .insert({ note_id: noteId, shared_with_user_id: sharedWithUserId })
      .select()
      .single();
    
    if (error) {
      // Ignore if already shared (UNIQUE constraint)
      if (error.code === '23505') {
        return { lastInsertRowid: 0 };
      }
      throw error;
    }
    return { lastInsertRowid: data.id };
  },

  unshareWithUser: async (noteId: number, sharedWithUserId: number) => {
    const { error } = await supabase
      .from('note_shares')
      .delete()
      .eq('note_id', noteId)
      .eq('shared_with_user_id', sharedWithUserId);
    
    if (error) throw error;
    return { changes: 1 };
  },

  getSharedUsers: async (noteId: number) => {
    const { data: shares, error: sharesError } = await supabase
      .from('note_shares')
      .select('shared_with_user_id')
      .eq('note_id', noteId);
    
    if (sharesError) throw sharesError;
    if (!shares || shares.length === 0) return [];

    const userIds = shares.map(s => s.shared_with_user_id);
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, avatar_color, role')
      .in('id', userIds);
    
    if (usersError) throw usersError;
    return users || [];
  },

  isSharedWith: async (noteId: number, userId: number): Promise<boolean> => {
    const { data, error } = await supabase
      .from('note_shares')
      .select('id')
      .eq('note_id', noteId)
      .eq('shared_with_user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return false; // Not found
      throw error;
    }
    return !!data;
  },
};

// Chat operations
export const chatDb = {
  getRecent: async (limit: number = 100): Promise<ChatMessage[]> => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return (data || []).reverse();
  },

  create: async (
    user_id: number,
    message: string | null,
    type: 'text' | 'sticker' | 'image' | 'voice' = 'text',
    file_path: string | null = null,
    sticker_id: string | null = null,
    referenced_tasks: string[] = []
  ) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id,
        message,
        message_type: type,
        file_path,
        sticker_id,
        referenced_tasks: JSON.stringify(referenced_tasks)
      })
      .select()
      .single();
    
    if (error) throw error;
    return { lastInsertRowid: data.id };
  },

  clear: async () => {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .neq('id', 0); // Delete all
    
    if (error) throw error;
    return { changes: 1 };
  },
};

// Task counter operations
export const counterDb = {
  getCounter: async (rolePrefix: string, year: number, month: number): Promise<number> => {
    const { data, error } = await supabase
      .from('task_counters')
      .select('counter')
      .eq('role_prefix', rolePrefix)
      .eq('year', year)
      .eq('month', month)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return 0; // Not found
      throw error;
    }
    return data?.counter || 0;
  },

  incrementCounter: async (rolePrefix: string, year: number, month: number): Promise<number> => {
    const current = await counterDb.getCounter(rolePrefix, year, month);
    const newCounter = current + 1;

    const { error } = await supabase
      .from('task_counters')
      .upsert({
        role_prefix: rolePrefix,
        year,
        month,
        counter: newCounter
      }, {
        onConflict: 'role_prefix,year,month'
      });
    
    if (error) throw error;
    return newCounter;
  },
};

// Checklist operations
export const checklistDb = {
  getByUserAndDate: async (userId: number, date: string) => {
    const { data, error } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  create: async (userId: number, content: string, date: string) => {
    const { data, error } = await supabase
      .from('checklist_items')
      .insert({
        user_id: userId,
        content,
        date,
        created_at: getLimaDateTime()
      })
      .select()
      .single();
    
    if (error) throw error;
    return { lastInsertRowid: data.id };
  },

  toggle: async (id: number) => {
    const { data: item, error: fetchError } = await supabase
      .from('checklist_items')
      .select('is_completed')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    const { error } = await supabase
      .from('checklist_items')
      .update({ is_completed: !item.is_completed })
      .eq('id', id);
    
    if (error) throw error;
    return { changes: 1 };
  },

  delete: async (id: number) => {
    const { error } = await supabase
      .from('checklist_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { changes: 1 };
  },
};

// Settings operations
export interface Settings {
  id: number;
  app_name: string;
  logo_url: string | null;
  theme_colors: string;
  ai_prompt_master: string | null;
}

export const settingsDb = {
  get: async (): Promise<Settings> => {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Create default settings if not exists
        const defaultSettings: Settings = {
          id: 1,
          app_name: 'MKT Planner',
          logo_url: null,
          theme_colors: '{}',
          ai_prompt_master: null
        };
        
        const { data: newData, error: insertError } = await supabase
          .from('settings')
          .insert(defaultSettings)
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newData;
      }
      throw error;
    }
    return data;
  },

  update: async (app_name: string, logo_url: string | null, theme_colors: string, ai_prompt_master: string | null = null) => {
    const { error } = await supabase
      .from('settings')
      .update({ app_name, logo_url, theme_colors, ai_prompt_master })
      .eq('id', 1);
    
    if (error) {
      // If settings don't exist, create them
      if (error.code === 'PGRST116' || error.message.includes('No rows')) {
        const { error: insertError } = await supabase
          .from('settings')
          .insert({ id: 1, app_name, logo_url, theme_colors, ai_prompt_master });
        
        if (insertError) throw insertError;
        return { changes: 1 };
      }
      throw error;
    }
    return { changes: 1 };
  },
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

export const notificationDb = {
  getByUserId: async (userId: number, limit = 50): Promise<Notification[]> => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },

  getUnreadCount: async (userId: number): Promise<number> => {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (error) throw error;
    return count || 0;
  },

  create: async (userId: number, type: NotificationType, title: string, message: string, link?: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .insert({ user_id: userId, type, title, message, link: link || null })
      .select()
      .single();
    
    if (error) throw error;
    return { lastInsertRowid: data.id };
  },

  createForMany: async (userIds: number[], type: NotificationType, title: string, message: string, link?: string) => {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      type,
      title,
      message,
      link: link || null
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);
    
    if (error) throw error;
    return { changes: userIds.length };
  },

  markAsRead: async (id: number) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    if (error) throw error;
    return { changes: 1 };
  },

  markAllAsRead: async (userId: number) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);
    
    if (error) throw error;
    return { changes: 1 };
  },

  deleteOld: async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString());
    
    if (error) throw error;
    return { changes: 1 };
  },
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
  getByUserId: async (userId: number, limit = 30): Promise<ChecklistHistoryDay[]> => {
    const { data, error } = await supabase
      .from('checklist_history')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('completed_at', { ascending: false });
    
    if (error) throw error;
    if (!data) return [];

    // Group by date
    const grouped = new Map<string, ChecklistHistoryItem[]>();
    data.forEach(item => {
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

  getByDate: async (userId: number, date: string): Promise<ChecklistHistoryItem[]> => {
    const { data, error } = await supabase
      .from('checklist_history')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('completed_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  create: async (userId: number, date: string, content: string) => {
    const { data, error } = await supabase
      .from('checklist_history')
      .insert({ user_id: userId, date, content })
      .select()
      .single();
    
    if (error) throw error;
    return { lastInsertRowid: data.id };
  },

  delete: async (id: number) => {
    const { error } = await supabase
      .from('checklist_history')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { changes: 1 };
  },

  deleteDay: async (userId: number, date: string) => {
    const { error } = await supabase
      .from('checklist_history')
      .delete()
      .eq('user_id', userId)
      .eq('date', date);
    
    if (error) throw error;
    return { changes: 1 };
  },

  getStats: async (userId: number, days = 30) => {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);
    
    const { data, error } = await supabase
      .from('checklist_history')
      .select('date')
      .eq('user_id', userId)
      .gte('date', dateLimit.toISOString().split('T')[0]);
    
    if (error) throw error;
    
    const uniqueDates = new Set(data?.map(item => item.date) || []);
    
    return {
      total_days: uniqueDates.size,
      total_completed: data?.length || 0
    };
  },
};

// Task AI Chat DB operations
export const taskAIChatDb = {
  getByTaskId: async (taskId: number): Promise<TaskAIChatMessage[]> => {
    const { data, error } = await supabase
      .from('task_ai_chat')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  addMessage: async (taskId: number, role: 'user' | 'assistant' | 'system', content: string, mediaFiles?: string | null) => {
    const { data, error } = await supabase
      .from('task_ai_chat')
      .insert({ task_id: taskId, role, content, media_files: mediaFiles ?? null })
      .select()
      .single();
    
    if (error) throw error;
    return { lastInsertRowid: data.id };
  },

  deleteByTaskId: async (taskId: number) => {
    const { error } = await supabase
      .from('task_ai_chat')
      .delete()
      .eq('task_id', taskId);
    
    if (error) throw error;
    return { changes: 1 };
  },

  getLastMessage: async (taskId: number): Promise<TaskAIChatMessage | null> => {
    const { data, error } = await supabase
      .from('task_ai_chat')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  },
};

// Export supabase client for advanced operations
export { supabase };
export default supabase;
