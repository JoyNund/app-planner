'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import UserAvatar from '@/components/UserAvatar';
import UserFormModal from '@/components/UserFormModal';
import { useUserModal } from '@/components/UserModalContext';
import { getRoleLabel } from '@/lib/utils';
import { Edit, Trash2 } from 'lucide-react';

interface User {
    id: number;
    username: string;
    full_name: string;
    role: string;
    avatar_color: string;
    stats: {
        total_tasks: number;
        completed: number;
        pending: number;
        in_progress: number;
    };
}

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const { isOpen: isModalOpen, openModal, closeModal } = useUserModal();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        openModal();
    };

    const handleDelete = async (userId: number) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) return;

        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchUsers();
            } else {
                const data = await res.json();
                alert(data.error || 'Error al eliminar usuario');
            }
        } catch (error) {
            alert('Error de conexión');
        }
    };

    const handleModalClose = () => {
        closeModal();
        setSelectedUser(null);
    };

    const isAdmin = currentUser?.role === 'admin';

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2xl)' }}>
                <div>
                    <h1 style={{ marginBottom: 'var(--spacing-sm)', display: isMobile ? 'none' : 'block' }}>Gestión de Usuarios</h1>
                    <p style={{ color: 'var(--text-secondary)', display: isMobile ? 'none' : 'block' }}>
                        Visualiza el equipo y sus estadísticas de tareas
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => {
                            setSelectedUser(null);
                            openModal();
                        }}
                        className="btn btn-primary"
                        style={{ display: isMobile ? 'none' : 'flex' }}
                    >
                        ➕ Nuevo Usuario
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--text-secondary)' }}>
                    Cargando usuarios...
                </div>
            ) : (
                <div className="grid grid-cols-2" style={{ gap: 'var(--spacing-lg)' }}>
                    {users.map((user) => (
                        <div key={user.id} className="card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
                                <UserAvatar name={user.full_name} color={user.avatar_color} size="lg" />
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ marginBottom: 'var(--spacing-xs)' }}>{user.full_name}</h3>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {getRoleLabel(user.role)}
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        @{user.username}
                                    </p>
                                </div>
                                {isAdmin && (
                                    <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="btn btn-secondary"
                                            style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}
                                        >
                                            <Edit size={14} color="var(--text-primary)" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="btn"
                                            style={{
                                                padding: 'var(--spacing-xs) var(--spacing-sm)',
                                                fontSize: '0.875rem',
                                                background: 'var(--status-urgent)',
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <Trash2 size={14} color="white" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: 'var(--spacing-md)',
                                    paddingTop: 'var(--spacing-lg)',
                                    borderTop: '1px solid var(--border-color)',
                                }}
                            >
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                                        {user.stats.total_tasks}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-pending)' }}>
                                        {user.stats.pending}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pendientes</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-in-progress)' }}>
                                        {user.stats.in_progress}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>En Progreso</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-completed)' }}>
                                        {user.stats.completed}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Completadas</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <UserFormModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSave={fetchUsers}
                user={selectedUser}
            />
        </div>
    );
}
