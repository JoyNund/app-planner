'use client';

import { useState, useRef, useEffect } from 'react';
import UserAvatar from './UserAvatar';
import { formatDateTime } from '@/lib/utils';
import { linkifyText } from '@/lib/linkify';
import { useAuth } from './AuthProvider';
import { MoreVertical, Trash2 } from 'lucide-react';

interface Comment {
    id: number;
    content: string;
    created_at: string;
    user: {
        id: number;
        full_name: string;
        avatar_color: string;
    } | null;
}

interface TaskFile {
    id: number;
    filename: string;
    filepath: string;
    file_type: string;
    created_at: string;
    user: {
        id: number;
        full_name: string;
    } | null;
}

interface TaskTimelineProps {
    taskId: number;
    comments: Comment[];
    files: TaskFile[];
    onCommentAdded: () => void;
    onFileUploaded: () => void;
}

export default function TaskTimeline({ taskId, comments, files, onCommentAdded, onFileUploaded }: TaskTimelineProps) {
    const { user } = useAuth();
    const [newComment, setNewComment] = useState('');
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Check if user can delete an item
    const canDelete = (itemUserId: number | undefined) => {
        if (!user) return false;
        return user.role === 'admin' || user.id === itemUserId;
    };

    // Delete a comment
    const handleDeleteComment = async (commentId: number) => {
        if (!confirm('¿Eliminar este comentario?')) return;
        
        setDeleting(`comment-${commentId}`);
        try {
            const res = await fetch(`/api/tasks/${taskId}/comments?commentId=${commentId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                onCommentAdded(); // Refresh the timeline
            } else {
                const error = await res.json();
                alert(error.error || 'Error al eliminar comentario');
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
        } finally {
            setDeleting(null);
            setOpenMenuId(null);
        }
    };

    // Delete a file
    const handleDeleteFile = async (fileId: number) => {
        if (!confirm('¿Eliminar este archivo?')) return;
        
        setDeleting(`file-${fileId}`);
        try {
            const res = await fetch(`/api/tasks/${taskId}/files?fileId=${fileId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                onFileUploaded(); // Refresh the timeline
            } else {
                const error = await res.json();
                alert(error.error || 'Error al eliminar archivo');
            }
        } catch (error) {
            console.error('Error deleting file:', error);
        } finally {
            setDeleting(null);
            setOpenMenuId(null);
        }
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('content', newComment);

            const res = await fetch(`/api/tasks/${taskId}/comments`, {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                setNewComment('');
                onCommentAdded();
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        await uploadFile(file);
        e.target.value = '';
    };

    // Core function to upload a file (used by input, paste, and drag/drop)
    const uploadFile = async (file: File) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(`/api/tasks/${taskId}/files`, {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                onFileUploaded();
            }
        } catch (error) {
            console.error('Error uploading file:', error);
        } finally {
            setUploading(false);
        }
    };

    // Handle paste event (Ctrl+V) for images
    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) {
                    // Generate a filename with timestamp
                    const ext = file.type.split('/')[1] || 'png';
                    const filename = `pasted-image-${Date.now()}.${ext}`;
                    const renamedFile = new File([file], filename, { type: file.type });
                    await uploadFile(renamedFile);
                }
                return;
            }
        }
    };

    // Handle drag over
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    // Handle drag leave
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    // Handle drop
    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            const file = files[0];
            // Accept images and common document types
            const allowedTypes = [
                'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                'application/pdf', 
                'application/msword', 
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ];
            if (allowedTypes.includes(file.type) || file.type.startsWith('image/')) {
                await uploadFile(file);
            }
        }
    };

    // Combine comments and files into timeline
    const timelineItems = [
        ...comments.map(c => ({ type: 'comment' as const, data: c, timestamp: c.created_at })),
        ...files.map(f => ({ type: 'file' as const, data: f, timestamp: f.created_at })),
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%', 
            gap: 0,
            minHeight: 0,
        }}>
            {/* Timeline - Scrollable */}
            <div style={{ 
                flex: '1 1 auto', 
                overflowY: 'auto', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 'var(--spacing-sm)', 
                minHeight: 0,
                paddingBottom: 'var(--spacing-sm)',
            }}>
                {timelineItems.length === 0 ? (
                    <p style={{ 
                        color: 'var(--text-muted)', 
                        textAlign: 'center', 
                        padding: 'var(--spacing-xl)',
                        fontSize: '0.875rem',
                    }}>
                        No hay actividad aún. Sé el primero en comentar.
                    </p>
                ) : (
                    timelineItems.map((item, index) => {
                        const itemKey = `${item.type}-${item.data.id}`;
                        const isDeleting = deleting === itemKey;
                        const showMenu = canDelete(item.data.user?.id);
                        
                        return (
                            <div
                                key={itemKey}
                                style={{ 
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    backgroundColor: 'var(--glass-bg-medium)',
                                    backdropFilter: 'blur(var(--blur-amount))',
                                    WebkitBackdropFilter: 'blur(var(--blur-amount))',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--glass-border)',
                                    opacity: isDeleting ? 0.5 : 1,
                                    transition: 'opacity 0.2s',
                                    position: 'relative',
                                }}
                            >
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                    {item.data.user && (
                                        <UserAvatar
                                            name={item.data.user.full_name}
                                            color={(item.data.user as any).avatar_color || '#8b5cf6'}
                                            size="sm"
                                        />
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--spacing-xs)',
                                                marginBottom: 'var(--spacing-xs)',
                                                flexWrap: 'wrap',
                                            }}
                                        >
                                            <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                                                {item.data.user?.full_name || 'Usuario'}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {formatDateTime(item.timestamp)}
                                            </span>
                                        </div>
                                        {item.type === 'comment' ? (
                                            <p style={{ 
                                                fontSize: '0.875rem', 
                                                color: 'var(--text-secondary)',
                                                lineHeight: '1.5',
                                                margin: 0,
                                                wordBreak: 'break-word',
                                            }}>
                                                {linkifyText((item.data as Comment).content)}
                                            </p>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                                                <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                                                    {(item.data as TaskFile).file_type === 'image' ? '🖼️' : '📎'}
                                                </span>
                                                {(item.data as TaskFile).file_type === 'image' ? (
                                                    <a
                                                        href={(item.data as TaskFile).filepath}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}
                                                    >
                                                        <img
                                                            src={(item.data as TaskFile).filepath}
                                                            alt={(item.data as TaskFile).filename}
                                                            style={{
                                                                maxWidth: '250px',
                                                                maxHeight: '150px',
                                                                borderRadius: 'var(--radius-sm)',
                                                                marginTop: 'var(--spacing-xs)',
                                                                display: 'block',
                                                            }}
                                                        />
                                                    </a>
                                                ) : (
                                                    <a
                                                        href={(item.data as TaskFile).filepath}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ 
                                                            color: 'var(--accent-primary)', 
                                                            textDecoration: 'none', 
                                                            fontSize: '0.875rem',
                                                            wordBreak: 'break-word',
                                                        }}
                                                    >
                                                        {(item.data as TaskFile).filename}
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Three dots menu */}
                                    {showMenu && (
                                        <div style={{ position: 'relative', flexShrink: 0 }} ref={openMenuId === itemKey ? menuRef : null}>
                                            <button
                                                onClick={() => setOpenMenuId(openMenuId === itemKey ? null : itemKey)}
                                                disabled={isDeleting}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '4px',
                                                    borderRadius: 'var(--radius-sm)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    opacity: 0.6,
                                                    transition: 'opacity 0.2s, background 0.2s',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.opacity = '1';
                                                    e.currentTarget.style.background = 'var(--glass-bg-strong)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.opacity = '0.6';
                                                    e.currentTarget.style.background = 'transparent';
                                                }}
                                                title="Opciones"
                                            >
                                                <MoreVertical size={16} color="var(--text-secondary)" />
                                            </button>
                                            
                                            {/* Dropdown menu */}
                                            {openMenuId === itemKey && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '100%',
                                                    right: 0,
                                                    marginTop: '4px',
                                                    backgroundColor: 'var(--bg-secondary)',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: 'var(--radius-md)',
                                                    boxShadow: 'var(--shadow-lg)',
                                                    minWidth: '140px',
                                                    zIndex: 100,
                                                    overflow: 'hidden',
                                                }}>
                                                    <button
                                                        onClick={() => {
                                                            if (item.type === 'comment') {
                                                                handleDeleteComment(item.data.id);
                                                            } else {
                                                                handleDeleteFile(item.data.id);
                                                            }
                                                        }}
                                                        style={{
                                                            width: '100%',
                                                            padding: 'var(--spacing-sm) var(--spacing-md)',
                                                            background: 'transparent',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 'var(--spacing-sm)',
                                                            fontSize: '0.8125rem',
                                                            color: 'var(--priority-urgent)',
                                                            transition: 'background 0.2s',
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = 'transparent';
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                        <span>Eliminar</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Add Comment Form - Fixed at bottom */}
            <form 
                onSubmit={handleSubmitComment} 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                    flex: '0 0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-sm)',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: 'var(--spacing-md)',
                    backgroundColor: isDragging ? 'var(--glass-bg-strong)' : 'var(--glass-bg-medium)',
                    backdropFilter: 'blur(var(--blur-amount))',
                    WebkitBackdropFilter: 'blur(var(--blur-amount))',
                    marginTop: 'auto',
                    borderRadius: isDragging ? 'var(--radius-md)' : '0',
                    border: isDragging ? '2px dashed var(--accent-primary)' : '2px dashed transparent',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                }}
            >
                {/* Drag overlay indicator */}
                {isDragging && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        borderRadius: 'var(--radius-md)',
                        pointerEvents: 'none',
                        zIndex: 10,
                    }}>
                        <span style={{ 
                            color: 'var(--accent-primary)', 
                            fontWeight: 600,
                            fontSize: '0.875rem',
                        }}>
                            📎 Suelta para adjuntar
                        </span>
                    </div>
                )}
                <textarea
                    ref={textareaRef}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onPaste={handlePaste}
                    placeholder="Agregar un comentario... (Ctrl+V para pegar imágenes)"
                    rows={2}
                    disabled={submitting || uploading}
                    style={{
                        fontSize: '0.875rem',
                        resize: 'vertical',
                        minHeight: '60px',
                        maxHeight: '120px',
                        opacity: isDragging ? 0.5 : 1,
                    }}
                />
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={submitting || uploading || !newComment.trim()}
                        style={{ fontSize: '0.875rem', padding: 'var(--spacing-xs) var(--spacing-md)' }}
                    >
                        {submitting ? 'Enviando...' : 'Comentar'}
                    </button>
                    <label 
                        className="btn btn-secondary" 
                        style={{ 
                            cursor: uploading ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            padding: 'var(--spacing-xs) var(--spacing-md)',
                            opacity: uploading ? 0.7 : 1,
                        }}
                    >
                        {uploading ? '⏳ Subiendo...' : '📎 Adjuntar'}
                        <input
                            type="file"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            style={{ display: 'none' }}
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                        />
                    </label>
                    {uploading && (
                        <span style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--accent-primary)',
                            marginLeft: 'var(--spacing-xs)',
                        }}>
                            Subiendo archivo...
                        </span>
                    )}
                </div>
            </form>
        </div>
    );
}
