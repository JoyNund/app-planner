'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface SuperTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (title: string) => Promise<void>;
    taskCount: number;
    loading?: boolean;
}

export default function SuperTaskModal({ isOpen, onClose, onConfirm, taskCount, loading = false }: SuperTaskModalProps) {
    const [title, setTitle] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            await onConfirm(title.trim());
            setTitle('');
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                backdropFilter: 'blur(4px)',
            }}
            onClick={onClose}
        >
            <div
                className="card"
                style={{
                    width: '90%',
                    maxWidth: '500px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-xl)',
                    position: 'relative',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: 'var(--spacing-md)',
                        right: 'var(--spacing-md)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        padding: '4px',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                >
                    <X size={20} />
                </button>

                <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    marginBottom: 'var(--spacing-md)',
                    color: 'var(--text-primary)',
                }}>
                    Crear Super Tarea
                </h2>

                <p style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--spacing-lg)',
                }}>
                    Estás a punto de agrupar {taskCount} {taskCount === 1 ? 'tarea' : 'tareas'} en una super tarea.
                    Las tareas se mantendrán individuales pero estarán agrupadas bajo un contenedor.
                </p>

                <form onSubmit={handleSubmit}>
                    <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        marginBottom: 'var(--spacing-sm)',
                    }}>
                        Nombre de la Super Tarea
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ej: Campaña de Verano 2024"
                        required
                        autoFocus
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: 'var(--spacing-md)',
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-primary)',
                            fontSize: '0.9375rem',
                            marginBottom: 'var(--spacing-lg)',
                            outline: 'none',
                            transition: 'all 0.2s',
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = 'var(--accent-primary)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                        }}
                    />

                    <div style={{
                        display: 'flex',
                        gap: 'var(--spacing-md)',
                        justifyContent: 'flex-end',
                    }}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            style={{
                                padding: 'var(--spacing-sm) var(--spacing-lg)',
                                background: 'transparent',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--text-secondary)',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.background = 'var(--bg-tertiary)';
                                    e.currentTarget.style.color = 'var(--text-primary)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                }
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !title.trim()}
                            style={{
                                padding: 'var(--spacing-sm) var(--spacing-lg)',
                                background: loading || !title.trim() ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                color: loading || !title.trim() ? 'var(--text-muted)' : 'white',
                                cursor: loading || !title.trim() ? 'not-allowed' : 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                if (!loading && title.trim()) {
                                    e.currentTarget.style.opacity = '0.9';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!loading && title.trim()) {
                                    e.currentTarget.style.opacity = '1';
                                }
                            }}
                        >
                            {loading ? 'Creando...' : 'Crear Super Tarea'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

