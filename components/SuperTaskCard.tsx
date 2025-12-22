'use client';

import { useState } from 'react';
import Link from 'next/link';
import PriorityBadge from './PriorityBadge';
import CategoryBadge from './CategoryBadge';
import UserAvatar from './UserAvatar';
import { formatDate, isOverdue } from '@/lib/utils';
import { Calendar, ChevronDown, ChevronUp, Folder, X } from 'lucide-react';

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
    child_tasks?: Task[];
}

interface SuperTaskCardProps {
    task: Task;
    onRemoveTask?: (taskId: number) => void;
}

export default function SuperTaskCard({ task, onRemoveTask }: SuperTaskCardProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const childTasks = task.child_tasks || [];

    const handleRemoveTask = async (e: React.MouseEvent, taskId: number) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (confirm('¿Estás seguro de que quieres remover esta tarea de la super tarea?')) {
            try {
                const res = await fetch('/api/tasks/super', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ task_id: taskId, action: 'remove' }),
                });
                
                if (res.ok) {
                    onRemoveTask?.(taskId);
                } else {
                    const error = await res.json();
                    alert(error.error || 'Error al remover la tarea');
                }
            } catch (error) {
                console.error('Error removing task:', error);
                alert('Error al remover la tarea');
            }
        }
    };

    return (
        <div
            className="card"
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-md)',
                position: 'relative',
                border: '2px solid var(--accent-primary)',
            }}
        >
            {/* Super Task Header */}
            <div style={{ position: 'relative' }}>
                {/* Status indicator */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'var(--accent-primary)',
                        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                    }}
                />

                {/* Super Task Badge */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    marginTop: 'var(--spacing-sm)',
                    marginBottom: 'var(--spacing-xs)',
                    fontSize: '0.75rem',
                    color: 'var(--accent-primary)',
                    fontWeight: 600,
                }}>
                    <Folder size={14} />
                    <span>SUPER TAREA</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                        ({childTasks.length} {childTasks.length === 1 ? 'tarea' : 'tareas'})
                    </span>
                </div>

                {/* Header */}
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap', marginTop: 'var(--spacing-xs)' }}>
                    <PriorityBadge priority={task.priority} />
                    <CategoryBadge category={task.category} />
                </div>

                {/* Title */}
                <h3
                    style={{
                        fontSize: '1.125rem',
                        marginTop: 'var(--spacing-sm)',
                        marginBottom: 'var(--spacing-xs)',
                        color: 'var(--text-primary)',
                        cursor: 'default',
                    }}
                >
                    {task.title}
                </h3>

                {/* Expand/Collapse Button */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{
                        position: 'absolute',
                        top: 'var(--spacing-sm)',
                        right: 'var(--spacing-sm)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                    }}
                >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {isExpanded ? 'Ocultar' : 'Mostrar'}
                </button>
            </div>

            {/* Child Tasks */}
            {isExpanded && childTasks.length > 0 && (
                <div style={{
                    marginTop: 'var(--spacing-md)',
                    paddingTop: 'var(--spacing-md)',
                    borderTop: '1px solid var(--border-color)',
                }}>
                    <div style={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        marginBottom: 'var(--spacing-sm)',
                    }}>
                        Tareas incluidas:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                        {childTasks.map((childTask) => (
                            <Link
                                key={childTask.id}
                                href={`/tasks/${childTask.id}`}
                                style={{
                                    textDecoration: 'none',
                                    color: 'inherit',
                                }}
                            >
                                <div
                                    style={{
                                        padding: 'var(--spacing-sm)',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-color)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'var(--bg-hover)';
                                        e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                                        e.currentTarget.style.borderColor = 'var(--border-color)';
                                    }}
                                >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            color: 'var(--text-primary)',
                                            marginBottom: '2px',
                                        }}>
                                            {childTask.title}
                                        </div>
                                        {childTask.task_id && (
                                            <div style={{
                                                fontSize: '0.7rem',
                                                fontFamily: 'monospace',
                                                color: 'var(--text-muted)',
                                            }}>
                                                #{childTask.task_id}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                        {childTask.due_date && (
                                            <div style={{
                                                fontSize: '0.7rem',
                                                color: isOverdue(childTask.due_date) ? 'var(--priority-urgent)' : 'var(--text-muted)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                            }}>
                                                <Calendar size={12} />
                                                {formatDate(childTask.due_date)}
                                            </div>
                                        )}
                                        <button
                                            onClick={(e) => handleRemoveTask(e, childTask.id)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: 'var(--text-muted)',
                                                padding: '4px',
                                                borderRadius: 'var(--radius-sm)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'var(--priority-urgent)20';
                                                e.currentTarget.style.color = 'var(--priority-urgent)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'transparent';
                                                e.currentTarget.style.color = 'var(--text-muted)';
                                            }}
                                            title="Remover de la super tarea"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

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
                            color: isOverdue(task.due_date) ? 'var(--priority-urgent)' : 'var(--text-muted)',
                            fontWeight: isOverdue(task.due_date) ? 600 : 400,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                        }}
                    >
                        <Calendar size={14} color={isOverdue(task.due_date) ? 'var(--priority-urgent)' : 'var(--text-muted)'} />
                        {formatDate(task.due_date)}
                    </div>
                )}
            </div>
        </div>
    );
}

