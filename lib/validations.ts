import { z } from 'zod';

// Login validation
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50, 'Username too long'),
  password: z.string().min(1, 'Password is required').max(200, 'Password too long'),
});

// Task validation
export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(5000, 'Description too long').optional().nullable(),
  assigned_to: z.number().int().positive().optional().nullable(),
  priority: z.enum(['urgent', 'high', 'medium', 'low'], {
    message: 'Invalid priority. Must be one of: urgent, high, medium, low',
  }),
  category: z.enum(['design', 'content', 'video', 'campaign', 'social', 'other'], {
    message: 'Invalid category. Must be one of: design, content, video, campaign, social, other',
  }),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  start_date: z.string().datetime().optional().nullable(),
  due_date: z.string().datetime().optional().nullable(),
  assigned_users: z.array(z.number().int().positive()).optional(),
});

// Task update validation (all fields optional except validation)
export const taskUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().max(5000, 'Description too long').optional().nullable(),
  assigned_to: z.number().int().nonnegative().optional().nullable(),
  priority: z.enum(['urgent', 'high', 'medium', 'low']).optional(),
  category: z.enum(['design', 'content', 'video', 'campaign', 'social', 'other']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  start_date: z.string().optional().nullable(), // Accepts both date and datetime formats
  due_date: z.string().optional().nullable(), // Accepts both date and datetime formats
  assigned_users: z.array(z.number().int().positive()).optional(),
});

// Task comment validation
export const taskCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(2000, 'Content too long'),
});

// User validation (for admin)
export const userSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50, 'Username too long'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(200, 'Password too long').optional(),
  full_name: z.string().min(1, 'Full name is required').max(100, 'Full name too long'),
  role: z.enum(['admin', 'designer', 'assistant', 'audiovisual'], {
    message: 'Invalid role. Must be one of: admin, designer, assistant, audiovisual',
  }),
});

// Chat message validation
export const chatMessageSchema = z.object({
  message: z.string().max(2000, 'Message too long').optional().nullable(),
  message_type: z.enum(['text', 'sticker', 'image', 'voice']).optional(),
  sticker_id: z.string().optional().nullable(),
  referenced_tasks: z.array(z.string()).optional(),
});

// Note validation
export const noteSchema = z.object({
  content: z.string().min(1, 'Content is required').max(10000, 'Content too long'),
  task_id: z.number().int().positive().optional().nullable(),
});

// Checklist item validation
export const checklistItemSchema = z.object({
  content: z.string().min(1, 'Content is required').max(500, 'Content too long'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

// Settings validation
export const settingsSchema = z.object({
  app_name: z.string().min(1, 'App name is required').max(100, 'App name too long'),
  logo_url: z.string().url('Invalid URL').optional().nullable(),
  theme_colors: z.string().optional(),
});

// File validation constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_AUDIO_TYPES = ['audio/webm', 'audio/mpeg', 'audio/wav', 'audio/mp3'];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_AUDIO_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
];

// File validation helper
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` };
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: images (${ALLOWED_IMAGE_TYPES.join(', ')}), audio (${ALLOWED_AUDIO_TYPES.join(', ')}), documents (PDF, Word, Excel)`,
    };
  }

  // Sanitize filename (basic check)
  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  if (sanitized !== file.name && sanitized.length === 0) {
    return { valid: false, error: 'Invalid filename' };
  }

  return { valid: true };
}

// Helper function to validate and parse request body
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string; status: number }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: firstError?.message || 'Validation error',
        status: 400,
      };
    }
    return {
      success: false,
      error: 'Invalid request body',
      status: 400,
    };
  }
}

