
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum TaskStatus {
  TODO = 'todo',
  DONE = 'done'
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  createdAt: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  suggestedTasks?: Partial<Task>[];
}
