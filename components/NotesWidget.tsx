'use client';

import { useState, useEffect, useRef } from 'react';
import { formatDate } from '@/lib/utils';
import { Users, Share2, X, FileText, Save, Edit, Trash2 } from 'lucide-react';

interface Note {
    id: number;
    content: string;
    updated_at: string;
    is_owner?: number;
    owner_name?: string;
    owner_avatar_color?: string;
    shared_users?: { id: number; full_name: string; avatar_color: string; role: string }[];
}

interface User {
    id: number;
    full_name: string;
    avatar_color: string;
    role: string;
}

interface NotesWidgetProps {
    taskId?: number;
}

export default function NotesWidget({ taskId }: NotesWidgetProps) {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [newNote, setNewNote] = useState('');
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [sharingNote, setSharingNote] = useState<Note | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const editingRef = useRef(false);
    const sharingRef = useRef(false);

    const fetchNotes = async (silent = false) => {
        try {
            const url = taskId ? `/api/notes?task_id=${taskId}` : '/api/notes';
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setNotes(data.notes);
            }
        } catch (error) {
            if (!silent) {
                console.error('Error fetching notes:', error);
            }
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchNotes();
        fetchUsers();
        
        // Polling para actualizar notas en tiempo real cada 3 segundos
        // Solo actualiza si no hay edición activa
        const interval = setInterval(() => {
            if (!editingRef.current && !sharingRef.current) {
                fetchNotes(true); // silent mode para no mostrar errores en consola
            }
        }, 3000);
        
        return () => clearInterval(interval);
    }, [taskId]);
    
    // Actualizar refs cuando cambian los estados de edición/compartir
    useEffect(() => {
        editingRef.current = editingNote !== null;
    }, [editingNote]);
    
    useEffect(() => {
        sharingRef.current = sharingNote !== null;
    }, [sharingNote]);

    const fetchUsers = async () => {
        try {
            // Get current user from session first
            const userRes = await fetch('/api/auth/session');
            if (userRes.ok) {
                const userData = await userRes.json();
                setCurrentUserId(userData.user?.id || null);
            }
            
            // Get list of users for sharing
            const res = await fetch('/api/users/list');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        setError(null);
        try {
            const res = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newNote, task_id: taskId }),
            });

            if (res.ok) {
                setNewNote('');
                fetchNotes();
            } else {
                const data = await res.json();
                setError(data.error || 'Error al crear la nota');
            }
        } catch (error) {
            console.error('Error creating note:', error);
            setError('Error al crear la nota. Por favor, intenta de nuevo.');
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingNote || !editingNote.content.trim()) return;

        try {
            const res = await fetch(`/api/notes/${editingNote.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editingNote.content }),
            });

            if (res.ok) {
                setEditingNote(null);
                fetchNotes();
            }
        } catch (error) {
            console.error('Error updating note:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar esta nota?')) return;

        try {
            const res = await fetch(`/api/notes/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchNotes();
            }
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    };

    const handleShare = async (noteId: number, userId: number) => {
        try {
            const res = await fetch(`/api/notes/${noteId}/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId }),
            });

            if (res.ok) {
                fetchNotes();
            } else {
                const data = await res.json();
                console.error('Error sharing note:', data.error || 'Error desconocido');
                alert(data.error || 'Error al compartir la nota');
            }
        } catch (error) {
            console.error('Error sharing note:', error);
            alert('Error al compartir la nota. Por favor, intenta de nuevo.');
        }
    };

    const handleUnshare = async (noteId: number, userId: number) => {
        try {
            const res = await fetch(`/api/notes/${noteId}/share?user_id=${userId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchNotes();
            } else {
                const data = await res.json();
                console.error('Error unsharing note:', data.error || 'Error desconocido');
                alert(data.error || 'Error al dejar de compartir la nota');
            }
        } catch (error) {
            console.error('Error unsharing note:', error);
            alert('Error al dejar de compartir la nota. Por favor, intenta de nuevo.');
        }
    };

    if (loading) return <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Cargando notas...</div>;

    return (
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <FileText size={18} />
                {taskId ? 'Notas de Tarea' : 'Mis Notas Personales'}
            </h3>

            {/* Create Note Form */}
            <form onSubmit={handleCreate} style={{ marginBottom: 'var(--spacing-md)' }}>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <input
                            type="text"
                            value={newNote}
                            onChange={(e) => {
                                setNewNote(e.target.value);
                                setError(null);
                            }}
                            placeholder="Escribe una nota rápida..."
                            className="input"
                            style={{ flex: 1 }}
                        />
                        <button type="submit" className="btn btn-primary" disabled={!newNote.trim()}>
                            +
                        </button>
                    </div>
                    {error && (
                        <div style={{ 
                            color: 'var(--error-color, #ef4444)', 
                            fontSize: '0.75rem', 
                            padding: '4px 8px',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: 'var(--radius-sm)'
                        }}>
                            {error}
                        </div>
                    )}
                </div>
            </form>

            {/* Notes List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                {notes.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center', padding: 'var(--spacing-md)' }}>
                        No hay notas aún.
                    </p>
                ) : (
                    notes.map(note => {
                        const isOwner = note.is_owner === 1;
                        const sharedUsers = note.shared_users || [];
                        const availableUsers = users.filter(u => u.id !== currentUserId && !sharedUsers.find(su => su.id === u.id));

                        return (
                        <div key={note.id} style={{
                            padding: 'var(--spacing-sm)',
                                backgroundColor: isOwner ? 'var(--glass-bg-medium)' : 'var(--glass-bg)',
                                backdropFilter: 'blur(var(--blur-amount))',
                                WebkitBackdropFilter: 'blur(var(--blur-amount))',
                            borderRadius: 'var(--radius-md)',
                                border: `1px solid ${isOwner ? 'var(--glass-border)' : 'var(--glass-border-medium)'}`,
                                position: 'relative',
                            }}>
                                {!isOwner && note.owner_name && (
                                    <div style={{ 
                                        fontSize: '0.7rem', 
                                        color: 'var(--text-muted)', 
                                        marginBottom: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <span style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            backgroundColor: note.owner_avatar_color || '#8b5cf6',
                                            display: 'inline-block'
                                        }}></span>
                                        Compartida por {note.owner_name}
                                    </div>
                                )}
                            {editingNote?.id === note.id ? (
                                <form onSubmit={handleUpdate} style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                    <input
                                        type="text"
                                        value={editingNote.content}
                                        onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                                        className="input"
                                        autoFocus
                                        style={{ flex: 1, fontSize: '0.875rem' }}
                                    />
                                    <button type="submit" className="btn btn-sm btn-primary" title="Guardar">
                                        <Save size={14} color="white" />
                                    </button>
                                    <button type="button" onClick={() => setEditingNote(null)} className="btn btn-sm" title="Cancelar">
                                        <X size={14} color="var(--text-secondary)" />
                                    </button>
                                </form>
                            ) : (
                                <div>
                                    <div style={{ fontSize: '0.875rem', marginBottom: '4px', whiteSpace: 'pre-wrap' }}>
                                        {note.content}
                                    </div>
                                        {sharedUsers.length > 0 && isOwner && (
                                            <div style={{ 
                                                fontSize: '0.7rem', 
                                                color: 'var(--text-muted)', 
                                                marginBottom: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                flexWrap: 'wrap'
                                            }}>
                                                <Share2 size={12} color="#10b981" />
                                                Compartida con: {sharedUsers.map(su => su.full_name).join(', ')}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {formatDate(note.updated_at)}
                                        </span>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                {isOwner && (
                                                    <button
                                                        onClick={() => setSharingNote(sharingNote?.id === note.id ? null : note)}
                                                        style={{ 
                                                            background: 'none', 
                                                            border: 'none', 
                                                            cursor: 'pointer', 
                                                            fontSize: '0.875rem', 
                                                            opacity: 0.8,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '2px',
                                                            color: '#10b981'
                                                        }}
                                                        title="Compartir"
                                                    >
                                                        <Share2 size={14} color="#10b981" />
                                                    </button>
                                                )}
                                                {isOwner && (
                                            <button
                                                onClick={() => setEditingNote(note)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', opacity: 0.8, display: 'flex', alignItems: 'center' }}
                                                title="Editar"
                                            >
                                                <Edit size={14} color="#3b82f6" />
                                            </button>
                                                )}
                                                {isOwner && (
                                            <button
                                                onClick={() => handleDelete(note.id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', opacity: 0.8, display: 'flex', alignItems: 'center' }}
                                                title="Eliminar"
                                            >
                                                <Trash2 size={14} color="#ef4444" />
                                            </button>
                                                )}
                                            </div>
                                        </div>
                                        {sharingNote?.id === note.id && (
                                            <div style={{
                                                marginTop: 'var(--spacing-sm)',
                                                padding: 'var(--spacing-sm)',
                                                backgroundColor: 'var(--glass-bg-strong)',
                                                backdropFilter: 'blur(var(--blur-amount))',
                                                WebkitBackdropFilter: 'blur(var(--blur-amount))',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--glass-border)',
                                            }}>
                                                <div style={{ fontSize: '0.75rem', marginBottom: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>
                                                    Compartir con:
                                                </div>
                                                {sharedUsers.length > 0 && (
                                                    <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                                                        {sharedUsers.map(user => (
                                                            <div key={user.id} style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                padding: '4px 8px',
                                                                marginBottom: '4px',
                                                                backgroundColor: 'var(--glass-bg)',
                                                                borderRadius: 'var(--radius-sm)',
                                                            }}>
                                                                <span style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <span style={{
                                                                        width: '8px',
                                                                        height: '8px',
                                                                        borderRadius: '50%',
                                                                        backgroundColor: user.avatar_color,
                                                                        display: 'inline-block'
                                                                    }}></span>
                                                                    {user.full_name}
                                                                </span>
                                                                <button
                                                                    onClick={() => handleUnshare(note.id, user.id)}
                                                                    style={{
                                                                        background: 'none',
                                                                        border: 'none',
                                                                        cursor: 'pointer',
                                                                        padding: '2px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                    }}
                                                                    title="Dejar de compartir"
                                                                >
                                                                    <X size={12} color="var(--text-secondary)" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {availableUsers.length > 0 ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        {availableUsers.map(user => (
                                                            <button
                                                                key={user.id}
                                                                onClick={() => handleShare(note.id, user.id)}
                                                                style={{
                                                                    padding: '4px 8px',
                                                                    fontSize: '0.75rem',
                                                                    backgroundColor: 'var(--glass-bg-medium)',
                                                                    border: '1px solid var(--glass-border)',
                                                                    borderRadius: 'var(--radius-sm)',
                                                                    cursor: 'pointer',
                                                                    color: 'var(--text-primary)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    transition: 'all 0.2s',
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.backgroundColor = 'var(--glass-bg-strong)';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.backgroundColor = 'var(--glass-bg-medium)';
                                                                }}
                                                            >
                                                                <span style={{
                                                                    width: '8px',
                                                                    height: '8px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: user.avatar_color,
                                                                    display: 'inline-block'
                                                                }}></span>
                                                                {user.full_name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                        Todos los usuarios ya tienen acceso
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                </div>
                            )}
                        </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
