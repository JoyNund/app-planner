
import React from 'react';
import { Task, Priority, TaskStatus } from '../types';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const colors = {
    [Priority.LOW]: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    [Priority.MEDIUM]: 'bg-amber-50 text-amber-700 border-amber-100',
    [Priority.HIGH]: 'bg-rose-50 text-rose-700 border-rose-100',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colors[priority]}`}>
      {priority.toUpperCase()}
    </span>
  );
};

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete }) => {
  const isDone = task.status === TaskStatus.DONE;

  return (
    <div className={`group flex items-center justify-between p-4 mb-3 transition-all rounded-xl border ${isDone ? 'bg-slate-50/50 border-slate-100' : 'bg-white border-slate-200 hover:shadow-md hover:border-indigo-200'}`}>
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={() => onToggle(task.id)}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isDone ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 hover:border-indigo-400'}`}
        >
          {isDone && (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <div className="flex flex-col gap-1">
          <h3 className={`font-medium transition-all ${isDone ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
            {task.title}
          </h3>
          {task.description && !isDone && (
            <p className="text-sm text-slate-500 line-clamp-1">{task.description}</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {!isDone && <PriorityBadge priority={task.priority} />}
        <button 
          onClick={() => onDelete(task.id)}
          className="p-2 text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};
