'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GanttViewMobile from './GanttViewMobile';

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

interface GanttViewProps {
  tasks: Task[];
  startDate?: Date;
  endDate?: Date;
}

export default function GanttView({ tasks, startDate, endDate }: GanttViewProps) {
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate date range (must be before conditional return)
  const dateRange = useMemo(() => {
    if (startDate && endDate) {
      return { start: startDate, end: endDate };
    }

    // Auto-calculate from tasks
    const dates = tasks
      .flatMap(t => [t.start_date, t.due_date])
      .filter((d): d is string => d !== null)
      .map(d => new Date(d)); // ISO strings are parsed as UTC

    if (dates.length === 0) {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      };
    }

    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    // Add padding
    minDate.setDate(minDate.getDate() - 3);
    maxDate.setDate(maxDate.getDate() + 3);

    return { start: minDate, end: maxDate };
  }, [tasks, startDate, endDate]);

  // Generate day columns
  const days = useMemo(() => {
    const result: Date[] = [];
    const current = new Date(dateRange.start);

    while (current <= dateRange.end) {
      result.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return result;
  }, [dateRange]);

  // Calculate task bar position and width
  const getTaskBar = (task: Task) => {
    if (!task.start_date || !task.due_date) return null;

    const start = new Date(task.start_date);
    const end = new Date(task.due_date);

    const totalDays = days.length;
    const startDay = Math.max(0, Math.floor((start.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)));
    const endDay = Math.min(totalDays - 1, Math.ceil((end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)));

    const left = (startDay / totalDays) * 100;
    const width = ((endDay - startDay + 1) / totalDays) * 100;

    return { left, width };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'var(--priority-urgent)';
      case 'high': return 'var(--priority-high)';
      case 'medium': return 'var(--priority-medium)';
      case 'low': return 'var(--priority-low)';
      default: return 'var(--text-muted)';
    }
  };

  // Sort tasks by created_at DESC (most recent first) before filtering
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const createdA = new Date(a.created_at || a.start_date || 0).getTime();
      const createdB = new Date(b.created_at || b.start_date || 0).getTime();
      if (createdA !== createdB) {
        return createdB - createdA; // Most recent first
      }
      // If same creation date, sort by updated_at
      const updatedA = new Date(a.updated_at || a.created_at || 0).getTime();
      const updatedB = new Date(b.updated_at || b.created_at || 0).getTime();
      return updatedB - updatedA;
    });
  }, [tasks]);

  const validTasks = sortedTasks.filter(t => t.start_date && t.due_date);

  // Show mobile version on mobile devices (after all hooks)
  if (isMobile) {
    return <GanttViewMobile tasks={sortedTasks} />;
  }

  return (
    <div className="gantt-container" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      {/* Header - Timeline */}
      <div className="gantt-header" style={{
        display: 'flex',
        borderBottom: '2px solid var(--border-color)',
        paddingBottom: 'var(--spacing-sm)',
        marginBottom: 'var(--spacing-lg)',
        minWidth: '800px',
      }}>
        <div className="gantt-task-column" style={{ width: '200px', flexShrink: 0, fontWeight: 600 }}>
          Tarea
        </div>
        <div style={{ flex: 1, display: 'flex', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {days.map((day, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                textAlign: 'center',
                borderLeft: i === 0 ? 'none' : '1px solid var(--border-color)',
                padding: '0 2px',
              }}
            >
              <div>{day.getDate()}</div>
              <div style={{ fontSize: '0.65rem' }}>
                {day.toLocaleDateString('es-ES', { weekday: 'short' })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tasks */}
      {validTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--text-secondary)' }}>
          No hay tareas con fechas de inicio y fin definidas
        </div>
      ) : (
        <div className="gantt-tasks" style={{ minWidth: '800px' }}>
          {validTasks.map(task => {
            const bar = getTaskBar(task);
            if (!bar) return null;

            return (
              <div
                key={task.id}
                className="gantt-task-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 'var(--spacing-md)',
                  minHeight: '40px',
                }}
              >
                {/* Task Name */}
                <div 
                  className="gantt-task-name" 
                  onClick={() => router.push(`/tasks/${task.id}`)}
                  style={{
                    width: '200px',
                    flexShrink: 0,
                    fontSize: '0.875rem',
                    paddingRight: 'var(--spacing-md)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--accent-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'inherit';
                  }}
                >
                  <div style={{ fontWeight: 500 }}>{task.title}</div>
                  {task.task_id && (
                    <div style={{
                      fontSize: '0.7rem',
                      fontFamily: 'monospace',
                      color: 'var(--text-muted)',
                    }}>
                      #{task.task_id}
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div style={{ flex: 1, position: 'relative', height: '32px' }}>
                  {/* Background grid */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                  }}>
                    {days.map((_, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          borderLeft: i === 0 ? 'none' : '1px solid var(--border-color)',
                        }}
                      />
                    ))}
                  </div>

                  {/* Task Bar */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${bar.left}%`,
                      width: `${bar.width}%`,
                      top: '4px',
                      height: '24px',
                      background: getPriorityColor(task.priority),
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      color: 'white',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      opacity: task.status === 'completed' ? 0.5 : 1,
                      textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                    }}
                    title={`${task.title}\n${new Date(task.start_date!).toLocaleDateString()} - ${new Date(task.due_date!).toLocaleDateString()}\nClick para ver detalles`}
                    onClick={() => router.push(`/tasks/${task.id}`)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {bar.width > 10 && (
                      <span style={{ padding: '0 var(--spacing-xs)' }}>
                        {Math.ceil((new Date(task.due_date!).getTime() - new Date(task.start_date!).getTime()) / (1000 * 60 * 60 * 24))}d
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
