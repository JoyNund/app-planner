import { memo } from 'react';
import Link from 'next/link';
import PriorityBadge from './PriorityBadge';
import CategoryBadge from './CategoryBadge';
import UserAvatar from './UserAvatar';
import { formatDate, isOverdue, getStatusLabel } from '@/lib/utils';
import { Calendar, ListChecks } from 'lucide-react';

// Helper to parse and format checklist description
function formatDescription(description: string | null): { isChecklist: boolean; text: string; progress?: { completed: number; total: number } } {
    if (!description) return { isChecklist: false, text: '' };
    
    try {
        const parsed = JSON.parse(description);
        if (parsed.type === 'checklist' && Array.isArray(parsed.items)) {
            const total = parsed.items.length;
            const completed = parsed.items.filter((item: any) => item.checked).length;
            const itemsPreview = parsed.items.slice(0, 3).map((item: any) => item.text).join(' • ');
            return {
                isChecklist: true,
                text: itemsPreview,
                progress: { completed, total }
            };
        }
    } catch {
        // Not JSON, treat as plain text
    }
    
    return { isChecklist: false, text: description };
}

interface Task {
    id: number;
    task_id: string | null;
    title: string;
    description: string | null;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    category: 'design' | 'content' | 'video' | 'campaign' | 'social' | 'other';
    status: 'pending' | 'in_progress' | 'completed';
    due_date: string | null;
    assigned_user: {
        id: number;
        full_name: string;
        avatar_color: string;
    } | null;
    assigned_users?: {
        id: number;
        full_name: string;
        avatar_color: string;
    }[];
    parent_task_id?: number | null;
    is_super_task?: number;
}

interface TaskCardProps {
    task: Task;
    onDragStart?: (taskId: number) => void;
}

interface TaskCardProps {
    task: Task;
    onDragStart?: (taskId: number) => void;
}

function TaskCard({ task, onDragStart }: TaskCardProps) {
    const overdue = isOverdue(task.due_date);

    // Don't make child tasks draggable (they're inside super tasks)
    const isDraggable = !task.parent_task_id;

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        if (!isDraggable) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', task.id.toString());
        (e.currentTarget as HTMLDivElement).style.opacity = '0.5';
        onDragStart?.(task.id);
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        (e.currentTarget as HTMLDivElement).style.opacity = '1';
    };

    return (
        <div
            className="card"
            draggable={isDraggable}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            style={{
                textDecoration: 'none',
                cursor: isDraggable ? 'grab' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-md)',
                position: 'relative',
            }}
        >
            {/* Status indicator */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background:
                        task.status === 'completed'
                            ? 'var(--status-completed)'
                            : task.status === 'in_progress'
                                ? 'var(--status-in-progress)'
                                : 'var(--status-pending)',
                    borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                }}
            />

            {/* Task ID */}
            {task.task_id && (
                <div style={{
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    color: 'var(--text-muted)',
                    marginTop: 'var(--spacing-sm)',
                    marginBottom: '-var(--spacing-xs)',
                }}>
                    #{task.task_id}
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap', marginTop: 'var(--spacing-xs)' }}>
                <PriorityBadge priority={task.priority} />
                <CategoryBadge category={task.category} />
            </div>

            {/* Title & Description */}
            <div>
                <Link
                    href={`/tasks/${task.id}`}
                    style={{
                        textDecoration: 'none',
                        color: 'inherit',
                    }}
                    onClick={(e) => {
                        // Prevent navigation if dragging
                        if (isDraggable && (e.target as HTMLElement).closest('[draggable="true"]')) {
                            // Allow click if not dragging
                        }
                    }}
                >
                    <h3
                        style={{
                            fontSize: '1.125rem',
                            marginBottom: 'var(--spacing-xs)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                        }}
                    >
                        {task.title}
                    </h3>
                </Link>
                {task.description && (() => {
                    const desc = formatDescription(task.description);
                    if (desc.isChecklist && desc.progress) {
                        return (
                            <div style={{ fontSize: '0.875rem' }}>
                                {/* Progress indicator */}
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px',
                                    marginBottom: '6px',
                                }}>
                                    <ListChecks size={14} color="var(--accent-primary)" />
                                    <div style={{
                                        flex: 1,
                                        height: '4px',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: '2px',
                                        overflow: 'hidden',
                                        maxWidth: '80px',
                                    }}>
                                        <div style={{
                                            width: `${(desc.progress.completed / desc.progress.total) * 100}%`,
                                            height: '100%',
                                            background: desc.progress.completed === desc.progress.total 
                                                ? 'var(--status-completed)' 
                                                : 'var(--accent-primary)',
                                            borderRadius: '2px',
                                            transition: 'width 0.3s',
                                        }} />
                                    </div>
                                    <span style={{ 
                                        fontSize: '0.75rem', 
                                        color: desc.progress.completed === desc.progress.total 
                                            ? 'var(--status-completed)' 
                                            : 'var(--text-muted)',
                                        fontWeight: 500,
                                    }}>
                                        {desc.progress.completed}/{desc.progress.total}
                                    </span>
                                </div>
                                {/* Items preview */}
                                <p style={{
                                    color: 'var(--text-secondary)',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 1,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    fontSize: '0.8125rem',
                                }}>
                                    {desc.text}
                                </p>
                            </div>
                        );
                    }
                    return (
                    <p
                        style={{
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}
                    >
                            {desc.text}
                    </p>
                    );
                })()}
            </div>

            {/* Footer */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 'auto',
                    paddingTop: 'var(--spacing-md)',
                    borderTop: '1px solid var(--border-color)',
                }}
            >
                {/* Assigned Users */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {task.assigned_users && task.assigned_users.length > 0 ? (
                        <div style={{ display: 'flex', paddingLeft: '8px' }}>
                            {task.assigned_users.map((user, index) => (
                                <div 
                                    key={user.id} 
                                    style={{ 
                                        marginLeft: '-8px', 
                                        border: '2px solid var(--bg-secondary)', 
                                        borderRadius: '50%',
                                        zIndex: task.assigned_users!.length - index 
                                    }}
                                    title={user.full_name}
                                >
                                    <UserAvatar name={user.full_name} color={user.avatar_color} size="sm" />
                                </div>
                            ))}
                        </div>
                    ) : task.assigned_user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                            <UserAvatar name={task.assigned_user.full_name} color={task.assigned_user.avatar_color} size="sm" />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {task.assigned_user.full_name}
                            </span>
                        </div>
                    ) : null}
                </div>

                {/* Due Date */}
                {task.due_date && (
                    <div
                        style={{
                            fontSize: '0.75rem',
                            color: overdue ? 'var(--priority-urgent)' : 'var(--text-muted)',
                            fontWeight: overdue ? 600 : 400,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                        }}
                    >
                        <Calendar size={14} color={overdue ? 'var(--priority-urgent)' : 'var(--text-muted)'} />
                        {formatDate(task.due_date)}
                    </div>
                )}
            </div>
        </div>
    );
}

export default memo(TaskCard);
