import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Acepta tanto anon key (legacy) como publishable key (moderna)
// - Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (formato JWT)
// - Publishable key: sb_publishable_... (formato moderno)
// El cliente de Supabase acepta ambas sin cambios en el código
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client
// During build, we use empty strings to avoid build-time errors
// In runtime, if env vars are missing, we still create a client but it will fail on queries
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

// Helper to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

// Helper function to get current datetime in Lima timezone
export function getLimaDateTime(): string {
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

// Export types (same as db.ts)
export interface User {
  id: number;
  username: string;
  password_hash: string;
  full_name: string;
  role: string;
  avatar_color: string;
  created_at: string;
}

export interface Task {
  id: number;
  task_id: string | null;
  title: string;
  description: string | null;
  assigned_to: number;
  created_by: number;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: 'design' | 'content' | 'video' | 'campaign' | 'social' | 'other';
  status: 'pending' | 'in_progress' | 'completed';
  admin_approved: number;
  start_date: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  assigned_users?: number[];
  parent_task_id?: number | null;
  is_super_task?: number;
  child_tasks?: Task[];
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
  referenced_tasks: string | null;
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

export interface TaskAIChatMessage {
  id: number;
  task_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  media_files?: string | null;
  created_at: string;
}

