'use client';

import { useState, useEffect } from 'react';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    user?: {
        id: number;
        username: string;
        full_name: string;
        role: string;
    } | null;
}

export default function UserFormModal({ isOpen, onClose, onSave, user }: UserFormModalProps) {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        full_name: '',
        role: 'designer',
        customRole: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            // Check if user has a custom role (not in standard list)
            const standardRoles = ['admin', 'designer', 'assistant', 'audiovisual'];
            const isCustomRole = !standardRoles.includes(user.role);
            
            setFormData({
                username: user.username,
                password: '',
                full_name: user.full_name,
                role: isCustomRole ? 'custom' : user.role,
                customRole: isCustomRole ? user.role : '',
            });
        } else {
            setFormData({
                username: '',
                password: '',
                full_name: '',
                role: 'designer',
                customRole: '',
            });
        }
        setError('');
    }, [user, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const url = user ? `/api/users/${user.id}` : '/api/users';
            const method = user ? 'PUT' : 'POST';

            const body: any = {
                full_name: formData.full_name,
                role: formData.role === 'custom' ? formData.customRole : formData.role,
            };

            if (!user) {
                body.username = formData.username;
                body.password = formData.password;
            } else if (formData.password) {
                body.password = formData.password;
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (res.ok) {
                onSave();
                onClose();
            } else {
                setError(data.error || 'Error al guardar usuario');
            }
        } catch (error) {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="modal-overlay" 
            onMouseDown={(e) => {
                // Close modal only when mousedown starts on backdrop (not when dragging text)
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
            style={{ 
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1001,
            }}
        >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{user ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onClose();
                        }} 
                        className="modal-close"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nombre Completo</label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            required
                        />
                    </div>

                    {!user && (
                        <div className="form-group">
                            <label>Usuario</label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>{user ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña'}</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required={!user}
                        />
                    </div>

                    <div className="form-group">
                        <label>Rol</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value, customRole: e.target.value === 'custom' ? formData.customRole : '' })}
                            required
                        >
                            <option value="admin">Administrador</option>
                            <option value="designer">Diseñador</option>
                            <option value="assistant">Asistente</option>
                            <option value="audiovisual">Audiovisual</option>
                            <option value="custom">Personalizado (escribir abajo)</option>
                        </select>
                    </div>

                    {formData.role === 'custom' && (
                        <div className="form-group">
                            <label>Nombre del Rol Personalizado</label>
                            <input
                                type="text"
                                value={formData.customRole}
                                onChange={(e) => setFormData({ ...formData, customRole: e.target.value })}
                                placeholder="Ej: Copywriter, Community Manager, etc."
                                required={formData.role === 'custom'}
                            />
                        </div>
                    )}

                    {error && (
                        <div style={{
                            padding: 'var(--spacing-md)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: 'var(--status-urgent)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--spacing-md)'
                        }}>
                            {error}
                        </div>
                    )}

                    <div className="modal-actions">
                        <button 
                            type="button" 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onClose();
                            }} 
                            className="btn btn-secondary"
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
