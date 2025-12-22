'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface Task {
  id: number;
  task_id: string | null;
  title: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  start_date: string | null;
  due_date: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  created_at?: string;
  updated_at?: string;
}

interface GanttViewMobileProps {
  tasks: Task[];
}

export default function GanttViewMobile({ tasks }: GanttViewMobileProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'var(--priority-urgent)';
      case 'high': return 'var(--priority-high)';
      case 'medium': return 'var(--priority-medium)';
      case 'low': return 'var(--priority-low)';
      default: return 'var(--text-muted)';
    }
  };

  const validTasks = tasks.filter(t => t.start_date && t.due_date);

  // Sort tasks by created_at (most recent first)
  const sortedTasks = useMemo(() => {
    return [...validTasks].sort((a, b) => {
      // Primary sort by creation date (most recent first)
      const createdA = new Date(a.created_at || a.start_date || 0).getTime();
      const createdB = new Date(b.created_at || b.start_date || 0).getTime();
      if (createdA !== createdB) {
        return createdB - createdA; // Most recent first
      }
      // If same creation date, sort by start date descending
      const dateA = new Date(a.start_date!).getTime();
      const dateB = new Date(b.start_date!).getTime();
      return dateB - dateA;
    });
  }, [validTasks]);

  const calculateDuration = (start: string, due: string) => {
    const startDate = new Date(start);
    const dueDate = new Date(due);
    const diffTime = Math.abs(dueDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (validTasks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--text-secondary)' }}>
        No hay tareas con fechas de inicio y fin definidas
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      {sortedTasks.map(task => {
        const color = getPriorityColor(task.priority);
        const duration = calculateDuration(task.start_date!, task.due_date!);

        return (
          <Link
            key={task.id}
            href={`/tasks/${task.id}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-sm)',
              padding: 'var(--spacing-md)',
              background: 'var(--glass-bg-medium)',
              backdropFilter: 'blur(var(--blur-amount))',
              WebkitBackdropFilter: 'blur(var(--blur-amount))',
              border: `1px solid ${color}40`,
              borderLeft: `4px solid ${color}`,
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(4px)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${color}30`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Task Title */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--spacing-sm)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    marginBottom: 'var(--spacing-xs)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {task.title}
                </div>
                {task.task_id && (
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      color: 'var(--text-muted)',
                    }}
                  >
                    #{task.task_id}
                  </div>
                )}
              </div>
              {/* Duration Badge */}
              <div
                style={{
                  backgroundColor: `${color}20`,
                  color: color,
                  padding: 'var(--spacing-xs) var(--spacing-sm)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {duration}d
              </div>
            </div>

            {/* Date Range */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '0.7rem' }}>📅</span>
                <span>{formatDate(task.start_date!)}</span>
              </span>
              <span>→</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '0.7rem' }}>📅</span>
                <span>{formatDate(task.due_date!)}</span>
              </span>
            </div>

            {/* Status Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: color,
                }}
              />
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  textTransform: 'capitalize',
                }}
              >
                {task.status === 'completed' ? 'Completada' : task.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

