'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import PriorityBadge from '@/components/PriorityBadge';
import CategoryBadge from '@/components/CategoryBadge';
import UserAvatar from '@/components/UserAvatar';
import TaskTimeline from '@/components/TaskTimeline';
import TaskFormModal from '@/components/TaskFormModal';
import NotesWidget from '@/components/NotesWidget';
import TaskChecklist, { isChecklist, parseChecklistItems } from '@/components/TaskChecklist';
import { formatDate, getStatusLabel } from '@/lib/utils';
import { useNotifications } from '@/components/useNotifications';
import { Edit, Trash2, Calendar } from 'lucide-react';

interface Task {
    id: number;
    task_id: string | null;
    title: string;
    description: string | null;
    assigned_to: number;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    category: 'design' | 'content' | 'video' | 'campaign' | 'social' | 'other';
    status: 'pending' | 'in_progress' | 'completed';
    admin_approved?: number;
    start_date: string | null;
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
    created_by_user: {
        id: number;
        full_name: string;
    } | null;
    comments: any[];
    files: any[];
    is_super_task?: number;
    parent_task_id?: number | null;
    child_tasks?: Task[];
}

interface User {
    id: number;
    full_name: string;
    role: string;
}

export default function TaskDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [task, setTask] = useState<Task | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'description'>('description');
    const [activeChildTaskId, setActiveChildTaskId] = useState<number | null>(null);
    const isModalOpenRef = useRef(false);
    const previousCommentsRef = useRef<any[]>([]);
    const previousFilesRef = useRef<any[]>([]);
    const { showNotification } = useNotifications();

    const fetchTask = async () => {
        try {
            const res = await fetch(`/api/tasks/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                const newTask = data.task;
                
                // Reset child task selection when task changes or if it's no longer a super task
                if (task && (task.id !== newTask.id || (task.is_super_task && !newTask.is_super_task))) {
                    setActiveChildTaskId(null);
                    setActiveTab('description');
                }
                
                // Check if user is a participant in this task
                const isParticipant = user && (
                    user.role === 'admin' ||
                    newTask.created_by_user?.id === user.id ||
                    newTask.assigned_to === user.id ||
                    (newTask.assigned_users && newTask.assigned_users.some((u: any) => u.id === user.id))
                );
                
                // Check for new comments or files (only if user is participant)
                if (isParticipant && previousCommentsRef.current.length > 0) {
                    const previousCommentIds = new Set(previousCommentsRef.current.map((c: any) => c.id));
                    const previousFileIds = new Set(previousFilesRef.current.map((f: any) => f.id));
                    
                    const newComments = (newTask.comments || []).filter(
                        (c: any) => !previousCommentIds.has(c.id) && c.user?.id !== user.id
                    );
                    const newFiles = (newTask.files || []).filter(
                        (f: any) => !previousFileIds.has(f.id) && f.user?.id !== user.id
                    );
                    
                    if (newComments.length > 0) {
                        const latestComment = newComments[newComments.length - 1];
                        const senderName = latestComment.user?.full_name || 'Alguien';
                        const commentPreview = latestComment.content.length > 50 
                            ? latestComment.content.substring(0, 50) + '...' 
                            : latestComment.content;
                        
                        showNotification({
                            title: `💬 Nuevo comentario en tarea #${newTask.task_id || newTask.id}`,
                            body: `${senderName}: ${commentPreview}`,
                            tag: `task-comment-${newTask.id}`,
                        });
                    }
                    
                    if (newFiles.length > 0) {
                        const latestFile = newFiles[newFiles.length - 1];
                        const senderName = latestFile.user?.full_name || 'Alguien';
                        
                        showNotification({
                            title: `📎 Nuevo archivo en tarea #${newTask.task_id || newTask.id}`,
                            body: `${senderName} compartió: ${latestFile.filename}`,
                            tag: `task-file-${newTask.id}`,
                        });
                    }
                }
                
                // Update previous refs
                previousCommentsRef.current = newTask.comments || [];
                previousFilesRef.current = newTask.files || [];
                
                setTask(newTask);
            } else {
                router.push('/');
            }
        } catch (error) {
            console.error('Error fetching task:', error);
            router.push('/');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
            }
        } catch (error) {
            console.log('Cannot fetch users');
        }
    };

    // Update ref when modal state changes
    useEffect(() => {
        isModalOpenRef.current = isModalOpen;
    }, [isModalOpen]);

    useEffect(() => {
        fetchTask();
        fetchUsers();

        // Poll for updates every 5 seconds, but only when modal is closed
        const interval = setInterval(() => {
            if (!isModalOpenRef.current) {
            fetchTask();
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [params.id]);

    // Auto-select first child task when super task loads
    useEffect(() => {
        if (task?.is_super_task && task.child_tasks && task.child_tasks.length > 0) {
            if (!activeChildTaskId || !task.child_tasks.find(t => t.id === activeChildTaskId)) {
                setActiveChildTaskId(task.child_tasks[0].id);
                setActiveTab('description');
            }
        } else if (task?.is_super_task && (!task.child_tasks || task.child_tasks.length === 0)) {
            setActiveChildTaskId(null);
        }
    }, [task?.id, task?.is_super_task, task?.child_tasks]);

    const handleStatusChange = async (newStatus: string) => {
        if (!task) return;

        // If viewing a child task, update the child task, not the super task
        const taskIdToUpdate = task.is_super_task && activeChildTaskId ? activeChildTaskId : task.id;

        try {
            const res = await fetch(`/api/tasks/${taskIdToUpdate}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus,
                }),
            });

            if (res.ok) {
                fetchTask(); // This will refresh both super task and child tasks
            } else {
                const error = await res.json();
                console.error('Error updating status:', error);
                alert('Error al actualizar el estado: ' + (error.error || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error updating task:', error);
            alert('Error al actualizar el estado');
        }
    };

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer.')) return;

        try {
            const res = await fetch(`/api/tasks/${task?.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                router.push('/dashboard');
            }
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--text-secondary)' }}>
                Cargando tarea...
            </div>
        );
    }

    if (!task) {
        return null;
    }

    const canEdit = user?.role === 'admin' || user?.id === task.created_by_user?.id;
    const isAdmin = user?.role === 'admin';
    // Handle null/undefined admin_approved (for old tasks)
    const adminApproved = (task.admin_approved !== null && task.admin_approved !== undefined) ? task.admin_approved : 0;
    const needsApproval = task.status === 'completed' && adminApproved === 0;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Back Button */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 'var(--spacing-lg)',
                flexWrap: 'wrap',
                gap: 'var(--spacing-sm)',
            }}>
                <button onClick={() => router.back()} className="btn btn-ghost" style={{ flexShrink: 0 }}>
                    ← Volver
                </button>
                {canEdit && (
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="btn btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                        >
                            <Edit size={16} color="var(--text-primary)" />
                            <span className="btn-text">Editar</span>
                        </button>
                        <button
                            onClick={handleDelete}
                            className="btn"
                            style={{ background: 'var(--status-urgent)', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                        >
                            <Trash2 size={16} color="white" />
                            <span className="btn-text">Eliminar</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Layout Container */}
            <div className="task-detail-layout" style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
                gap: 'var(--spacing-xl)',
                alignItems: 'start',
            }}>
                {/* Left Column - Task Info and Activity */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
                    {/* Task Header Card */}
                    <div className="card task-header-card" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '500px',
                        maxHeight: '500px',
                        overflow: 'hidden',
                    }}>
                        {/* Sticky Title Section - Compact */}
                        <div style={{
                            position: 'sticky',
                            top: 0,
                            backgroundColor: 'var(--bg-secondary)',
                            zIndex: 5,
                            paddingBottom: 'var(--spacing-sm)',
                            borderBottom: '1px solid var(--border-color)',
                            marginTop: '-1px',
                            flexShrink: 0,
                        }}>
                            {/* Task ID and Badges - Compact Row */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 'var(--spacing-sm)', 
                                marginBottom: 'var(--spacing-xs)',
                                flexWrap: 'wrap'
                            }}>
                                {task.task_id && (
                                    <div style={{
                                        fontSize: '0.75rem',
                                        fontFamily: 'monospace',
                                        color: 'var(--accent-primary)',
                                        fontWeight: 600,
                                    }}>
                                        #{task.task_id}
                                    </div>
                                )}
                                <PriorityBadge priority={task.priority} />
                                <CategoryBadge category={task.category} />
                            </div>

                            {/* Title - Smaller and Compact */}
                            <h1 style={{ 
                                marginBottom: 'var(--spacing-sm)',
                                fontSize: '1.25rem',
                                lineHeight: '1.4',
                                fontWeight: 600,
                            }}>
                                {task.title}
                                {task.is_super_task && (
                                    <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        color: 'var(--accent-primary)',
                                        marginLeft: 'var(--spacing-sm)',
                                    }}>
                                        (Super Tarea - {task.child_tasks?.length || 0} {task.child_tasks?.length === 1 ? 'tarea' : 'tareas'})
                                    </span>
                                )}
                            </h1>

                            {/* Tabs */}
                            <div style={{
                                display: 'flex',
                                gap: 'var(--spacing-xs)',
                                borderBottom: '1px solid var(--border-color)',
                                marginBottom: '-1px',
                                overflowX: 'auto',
                                scrollbarWidth: 'thin',
                            }}>
                                {/* For super tasks: Only show child task tabs */}
                                {task.is_super_task ? (
                                    task.child_tasks && task.child_tasks.length > 0 ? (
                                        task.child_tasks.map((childTask, index) => (
                                            <button
                                                key={childTask.id}
                                                onClick={() => {
                                                    setActiveChildTaskId(childTask.id);
                                                    setActiveTab('description');
                                                }}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    borderBottom: activeChildTaskId === childTask.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
                                                    color: activeChildTaskId === childTask.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem',
                                                    fontWeight: activeChildTaskId === childTask.id ? 600 : 400,
                                                    transition: 'all 0.2s',
                                                    whiteSpace: 'nowrap',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                }}
                                            >
                                                {childTask.task_id && (
                                                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                        #{childTask.task_id}
                                                    </span>
                                                )}
                                                <span style={{
                                                    maxWidth: '150px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}>
                                                    {childTask.title}
                                                </span>
                                            </button>
                                        ))
                                    ) : (
                                        <div style={{ padding: '8px 16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                            No hay tareas en esta super tarea
                                        </div>
                                    )
                                ) : (
                                    <>
                                        {/* Description Tab - Only for regular tasks */}
                                        <button
                                            onClick={() => {
                                                setActiveTab('description');
                                                setActiveChildTaskId(null);
                                            }}
                                            style={{
                                                padding: '8px 16px',
                                                background: 'transparent',
                                                border: 'none',
                                                borderBottom: activeTab === 'description' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                                                color: activeTab === 'description' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem',
                                                fontWeight: activeTab === 'description' ? 600 : 400,
                                                transition: 'all 0.2s',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            Descripción
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div style={{
                            flex: '1 1 auto',
                            overflowY: 'auto',
                            paddingTop: 'var(--spacing-md)',
                            paddingBottom: '60px', // Space for fixed status selector
                            minHeight: 0,
                        }}>
                            {/* Super Task: Only show child task content */}
                            {task.is_super_task ? (
                                (() => {
                                    const childTask = task.child_tasks?.find(t => t.id === activeChildTaskId);
                                    
                                    if (!childTask) {
                                        if (task.child_tasks && task.child_tasks.length > 0) {
                                            // Show loading or first task will be selected by useEffect
                                            return (
                                                <p style={{ 
                                                    color: 'var(--text-muted)', 
                                                    fontStyle: 'italic',
                                                    fontSize: '0.9375rem',
                                                    textAlign: 'center',
                                                    padding: 'var(--spacing-xl)',
                                                }}>
                                                    Cargando tarea...
                                                </p>
                                            );
                                        }
                                        return (
                                            <p style={{ 
                                                color: 'var(--text-muted)', 
                                                fontStyle: 'italic',
                                                fontSize: '0.9375rem',
                                                textAlign: 'center',
                                                padding: 'var(--spacing-xl)',
                                            }}>
                                                No hay tareas en esta super tarea.
                                            </p>
                                        );
                                    }
                                    
                                    return (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                                            {/* Child Task Header */}
                                            <div style={{
                                                padding: 'var(--spacing-md)',
                                                background: 'var(--bg-tertiary)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--border-color)',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                                                    {childTask.task_id && (
                                                        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--accent-primary)' }}>
                                                            #{childTask.task_id}
                                                        </span>
                                                    )}
                                                    <PriorityBadge priority={childTask.priority} />
                                                    <CategoryBadge category={childTask.category} />
                                                </div>
                                                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
                                                    {childTask.title}
                                                </h3>
                                            </div>
                                            
                                            {/* Child Task Description */}
                                            {childTask.description ? (
                                                isChecklist(childTask.description) ? (
                                                    <TaskChecklist
                                                        taskId={childTask.id}
                                                        items={parseChecklistItems(childTask.description)}
                                                        onUpdate={fetchTask}
                                                    />
                                                ) : (
                                                    <div style={{
                                                        padding: 'var(--spacing-md)',
                                                        background: 'var(--bg-tertiary)',
                                                        borderRadius: 'var(--radius-md)',
                                                        border: '1px solid var(--border-color)',
                                                    }}>
                                                        <p style={{ 
                                                            color: 'var(--text-secondary)', 
                                                            whiteSpace: 'pre-wrap',
                                                            fontSize: '0.9375rem',
                                                            lineHeight: '1.6',
                                                        }}>
                                                            {childTask.description}
                                                        </p>
                                                    </div>
                                                )
                                            ) : (
                                                <p style={{ 
                                                    color: 'var(--text-muted)', 
                                                    fontStyle: 'italic',
                                                    fontSize: '0.9375rem',
                                                    padding: 'var(--spacing-md)',
                                                }}>
                                                    No hay descripción para esta tarea.
                                                </p>
                                            )}
                                            
                                            {/* Child Task Timeline */}
                                            <TaskTimeline
                                                taskId={childTask.id}
                                                comments={childTask.comments || []}
                                                files={childTask.files || []}
                                                onCommentAdded={fetchTask}
                                                onFileUploaded={fetchTask}
                                            />
                                        </div>
                                    );
                                })()
                            ) : (
                                // Regular task: Show description or AI plan
                                <>
                                    {/* Description Tab */}
                                    {activeTab === 'description' && (
                                        task.description ? (
                                            isChecklist(task.description) ? (
                                                <TaskChecklist
                                                    taskId={task.id}
                                                    items={parseChecklistItems(task.description)}
                                                    onUpdate={fetchTask}
                                                />
                                            ) : (
                                                <p style={{ 
                                                    color: 'var(--text-secondary)', 
                                                    whiteSpace: 'pre-wrap',
                                                    fontSize: '0.9375rem',
                                                    lineHeight: '1.6',
                                                }}>
                                                    {task.description}
                                                </p>
                                            )
                                        ) : (
                                            <p style={{ 
                                                color: 'var(--text-muted)', 
                                                fontStyle: 'italic',
                                                fontSize: '0.9375rem',
                                            }}>
                                                No hay descripción para esta tarea.
                                            </p>
                                        )
                                    )}
                                </>
                            )}
                        </div>

                        {/* Status Selector - Fixed at bottom */}
                        {/* For super tasks, show status but make it read-only (auto-updates based on children) */}
                        {task.is_super_task ? (
                            <div style={{ 
                                position: 'sticky',
                                bottom: 0,
                                backgroundColor: 'var(--bg-secondary)',
                                zIndex: 5,
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 'var(--spacing-sm)',
                                paddingTop: 'var(--spacing-sm)',
                                paddingBottom: 'var(--spacing-sm)',
                                borderTop: '1px solid var(--border-color)',
                                marginTop: 'auto',
                                flexShrink: 0,
                            }}>
                                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Estado:</span>
                                <select
                                    value={task.status}
                                    disabled
                                    style={{ 
                                        flex: '0 0 auto', 
                                        width: 'auto',
                                        fontSize: '0.875rem',
                                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                                        backgroundColor: 'var(--bg-tertiary)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-sm)',
                                        cursor: 'not-allowed',
                                        opacity: 0.7,
                                    }}
                                >
                                    <option value="pending">Pendiente</option>
                                    <option value="in_progress">En Progreso</option>
                                    <option value="completed">Completada</option>
                                </select>
                                <span style={{ 
                                    fontSize: '0.75rem', 
                                    color: 'var(--text-muted)',
                                    fontStyle: 'italic',
                                }}>
                                    (Se actualiza automáticamente cuando todas las tareas se completen)
                                </span>
                            </div>
                        ) : (
                            <div style={{ 
                                position: 'sticky',
                                bottom: 0,
                                backgroundColor: 'var(--bg-secondary)',
                                zIndex: 5,
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 'var(--spacing-sm)',
                                paddingTop: 'var(--spacing-sm)',
                                paddingBottom: 'var(--spacing-sm)',
                                borderTop: '1px solid var(--border-color)',
                                marginTop: 'auto',
                                flexShrink: 0,
                            }}>
                                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Estado:</span>
                                <select
                                    value={task.is_super_task && activeChildTaskId 
                                        ? (task.child_tasks?.find(t => t.id === activeChildTaskId)?.status || task.status)
                                        : task.status
                                    }
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    style={{ 
                                        flex: '0 0 auto', 
                                        width: 'auto',
                                        fontSize: '0.875rem',
                                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                                        backgroundColor: 'var(--bg-tertiary)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-sm)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <option value="pending">Pendiente</option>
                                    <option value="in_progress">En Progreso</option>
                                    <option value="completed">Completada</option>
                                </select>
                                {(() => {
                                    const currentTask = task.is_super_task && activeChildTaskId 
                                        ? task.child_tasks?.find(t => t.id === activeChildTaskId)
                                        : task;
                                    if (!currentTask) return null;
                                    const currentAdminApproved = (currentTask.admin_approved !== null && currentTask.admin_approved !== undefined) ? currentTask.admin_approved : 0;
                                    const currentNeedsApproval = currentTask.status === 'completed' && currentAdminApproved === 0;
                                    
                                    if (!currentNeedsApproval) return null;
                                    
                                    return (
                                        <>
                                            <span style={{ 
                                                fontSize: '0.75rem', 
                                                color: '#f97316',
                                                marginLeft: 'var(--spacing-xs)',
                                            }}>
                                                (Pendiente de aprobación)
                                            </span>
                                            {isAdmin && currentAdminApproved === 0 && (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const taskIdToApprove = task.is_super_task && activeChildTaskId ? activeChildTaskId : task.id;
                                                            const res = await fetch(`/api/tasks/${taskIdToApprove}/status`, {
                                                                method: 'PUT',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ approve: true }),
                                                            });
                                                            if (res.ok) {
                                                                fetchTask();
                                                            }
                                                        } catch (error) {
                                                            console.error('Error approving task:', error);
                                                        }
                                                    }}
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                                                        backgroundColor: 'var(--status-completed)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: 'var(--radius-sm)',
                                                        cursor: 'pointer',
                                                        marginLeft: 'var(--spacing-xs)',
                                                    }}
                                                >
                                                    Aprobar
                                                </button>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>

                    {/* Activity Card */}
                    <div className="card task-activity-card" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        flex: '1 1 auto',
                        minHeight: '400px',
                        maxHeight: '600px',
                        overflow: 'hidden',
                    }}>
                        <h2 style={{ 
                            marginBottom: 'var(--spacing-md)', 
                            flex: '0 0 auto',
                            fontSize: '1.125rem',
                            fontWeight: 600,
                        }}>Actividad</h2>
                        <TaskTimeline
                            taskId={task.is_super_task && activeChildTaskId ? activeChildTaskId : task.id}
                            comments={task.is_super_task && activeChildTaskId 
                                ? (task.child_tasks?.find(t => t.id === activeChildTaskId)?.comments || [])
                                : task.comments
                            }
                            files={task.is_super_task && activeChildTaskId 
                                ? (task.child_tasks?.find(t => t.id === activeChildTaskId)?.files || [])
                                : task.files
                            }
                            onCommentAdded={fetchTask}
                            onFileUploaded={fetchTask}
                        />
                    </div>
                </div>

                {/* Right Column - Details and Notes */}
                <div className="task-details-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', position: 'sticky', top: 0 }}>
                    {/* Task Details Card */}
                    <div className="card">
                        <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Detalles</h3>

                        {/* Task ID in Sidebar */}
                        {task.task_id && (
                            <div style={{ marginBottom: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-lg)', borderBottom: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                                    ID de Tarea
                                </div>
                                <div style={{
                                    fontSize: '0.875rem',
                                    fontFamily: 'monospace',
                                    color: 'var(--accent-primary)',
                                    fontWeight: 600,
                                }}>
                                    #{task.task_id}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                            {/* Assigned To */}
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                                    Asignado a
                                </div>
                                {task.assigned_users && task.assigned_users.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                                        {task.assigned_users.map(user => (
                                            <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                                <UserAvatar name={user.full_name} color={user.avatar_color} size="sm" />
                                                <span style={{ fontSize: '0.875rem' }}>{user.full_name}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : task.assigned_user ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                        <UserAvatar name={task.assigned_user.full_name} color={task.assigned_user.avatar_color} size="sm" />
                                        <span style={{ fontSize: '0.875rem' }}>{task.assigned_user.full_name}</span>
                                    </div>
                                ) : (
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Sin asignar</span>
                                )}
                            </div>

                            {/* Created By */}
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                                    Creado por
                                </div>
                                {task.created_by_user && (
                                    <span style={{ fontSize: '0.875rem' }}>{task.created_by_user.full_name}</span>
                                )}
                            </div>

                            {/* Due Date */}
                            {task.due_date && (
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                                        Fecha de entrega
                                    </div>
                                    <span style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Calendar size={16} color="var(--text-secondary)" />
                                        {formatDate(task.due_date)}
                                    </span>
                                </div>
                            )}

                            {/* Status */}
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                                    Estado actual
                                </div>
                                <span
                                    className="badge"
                                    style={{
                                        backgroundColor:
                                            task.status === 'completed' && adminApproved === 1
                                                ? 'rgba(34, 197, 94, 0.2)'
                                                : task.status === 'completed' && adminApproved === 0
                                                    ? 'rgba(249, 115, 22, 0.2)'
                                                    : task.status === 'in_progress'
                                                        ? 'rgba(59, 130, 246, 0.2)'
                                                        : 'rgba(107, 114, 128, 0.2)',
                                        color:
                                            task.status === 'completed' && adminApproved === 1
                                                ? 'var(--status-completed)'
                                                : task.status === 'completed' && adminApproved === 0
                                                    ? '#f97316'
                                                    : task.status === 'in_progress'
                                                        ? 'var(--status-in-progress)'
                                                        : 'var(--status-pending)',
                                        border: `1px solid ${task.status === 'completed' && adminApproved === 1
                                            ? 'var(--status-completed)'
                                            : task.status === 'completed' && adminApproved === 0
                                                ? '#f97316'
                                                : task.status === 'in_progress'
                                                    ? 'var(--status-in-progress)'
                                                    : 'var(--status-pending)'
                                            }`,
                                    }}
                                >
                                    {task.status === 'completed' && adminApproved === 0 
                                        ? 'Completada (Pendiente aprobación)'
                                        : getStatusLabel(task.status)
                                    }
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Notes Widget */}
                    <div style={{ maxHeight: '400px', overflow: 'hidden' }}>
                        <NotesWidget taskId={task.id} />
                    </div>
                </div>
            </div>
            {task && (
                <TaskFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={fetchTask}
                    task={task}
                    users={users}
                />
            )}
        </div>
    );
}
