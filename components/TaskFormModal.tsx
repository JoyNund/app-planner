'use client';

import { useState, useEffect, useRef } from 'react';
import { getLimaDateString, dateStringToLimaISO } from '@/lib/utils';
import { Plus, Trash2, GripVertical, FileText, ListChecks } from 'lucide-react';

interface User {
    id: number;
    full_name: string;
    role: string;
}

interface Task {
    id?: number;
    title: string;
    description: string | null;
    assigned_to: number;
    assigned_users?: (number | { id: number })[];
    priority: 'urgent' | 'high' | 'medium' | 'low';
    category: 'design' | 'content' | 'video' | 'campaign' | 'social' | 'other';
    status: 'pending' | 'in_progress' | 'completed';
    start_date: string | null;
    due_date: string | null;
}

interface ChecklistItem {
    id: string;
    text: string;
    checked: boolean;
}

interface TaskFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    task?: Task; // If provided, we are editing
    users: User[];
}

// Helper to parse description and detect if it's a checklist
function parseDescription(description: string | null): { type: 'text' | 'checklist', text: string, items: ChecklistItem[] } {
    if (!description) return { type: 'text', text: '', items: [] };
    
    try {
        const parsed = JSON.parse(description);
        if (parsed.type === 'checklist' && Array.isArray(parsed.items)) {
            return { type: 'checklist', text: '', items: parsed.items };
        }
    } catch {
        // Not JSON, treat as plain text
    }
    
    return { type: 'text', text: description, items: [] };
}

// Helper to serialize description
function serializeDescription(type: 'text' | 'checklist', text: string, items: ChecklistItem[]): string | null {
    if (type === 'text') {
        return text || null;
    }
    
    if (items.length === 0) return null;
    
    return JSON.stringify({ type: 'checklist', items });
}

export default function TaskFormModal({ isOpen, onClose, onSave, task, users }: TaskFormModalProps) {
    const [formData, setFormData] = useState<Task>({
        title: '',
        description: '',
        assigned_to: users[0]?.id || 0,
        assigned_users: users[0] ? [users[0].id] : [],
        priority: 'medium',
        category: 'other',
        status: 'pending',
        start_date: getLimaDateString(),
        due_date: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const taskIdRef = useRef<number | undefined>(undefined);
    const wasOpenRef = useRef(false);
    const formInitializedRef = useRef(false);
    const lastTaskRef = useRef<Task | undefined>(task);
    
    // Description type state
    const [descriptionType, setDescriptionType] = useState<'text' | 'checklist'>('text');
    const [descriptionText, setDescriptionText] = useState('');
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
    const [newItemText, setNewItemText] = useState('');

    useEffect(() => {
        // Only reset form data when modal opens, never while it's open
        const modalJustOpened = isOpen && !wasOpenRef.current;
        const taskAvailable = task !== undefined;
        const shouldInitialize = modalJustOpened && taskAvailable && !formInitializedRef.current;
        
        if (shouldInitialize) {
        if (task) {
            setFormData({
                ...task,
                assigned_users: task.assigned_users
                    ? task.assigned_users.map(u => typeof u === 'number' ? u : u.id)
                    : (task.assigned_to ? [task.assigned_to] : []),
                start_date: task.start_date ? task.start_date.split('T')[0] : '',
                due_date: task.due_date ? task.due_date.split('T')[0] : '',
            });
            
            // Parse description
            const parsed = parseDescription(task.description);
            setDescriptionType(parsed.type);
            setDescriptionText(parsed.text);
            setChecklistItems(parsed.items);
            
                taskIdRef.current = task.id;
                lastTaskRef.current = task;
                formInitializedRef.current = true;
        } else {
            // Reset for new task
            setFormData({
                title: '',
                description: '',
                assigned_to: users[0]?.id || 0,
                assigned_users: users[0] ? [users[0].id] : [],
                priority: 'medium',
                category: 'other',
                status: 'pending',
                    start_date: (() => {
            const now = new Date();
            return now.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
        })(),
                due_date: '',
            });
            
            // Reset description state
            setDescriptionType('text');
            setDescriptionText('');
            setChecklistItems([]);
            setNewItemText('');
            
                taskIdRef.current = undefined;
                lastTaskRef.current = undefined;
                formInitializedRef.current = true;
            }
        }
        
        wasOpenRef.current = isOpen;
        
        // Reset flag when modal closes
        if (!isOpen) {
            formInitializedRef.current = false;
            taskIdRef.current = undefined;
            lastTaskRef.current = undefined;
        }
    }, [isOpen, task?.id, users]);
    
    // Checklist functions
    const addChecklistItem = () => {
        if (!newItemText.trim()) return;
        const newItem: ChecklistItem = {
            id: Date.now().toString(),
            text: newItemText.trim(),
            checked: false,
        };
        setChecklistItems([...checklistItems, newItem]);
        setNewItemText('');
    };
    
    const removeChecklistItem = (id: string) => {
        setChecklistItems(checklistItems.filter(item => item.id !== id));
    };
    
    const updateChecklistItem = (id: string, text: string) => {
        setChecklistItems(checklistItems.map(item => 
            item.id === id ? { ...item, text } : item
        ));
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const url = task?.id ? `/api/tasks/${task.id}` : '/api/tasks';
            const method = task?.id ? 'PUT' : 'POST';

            // Prepare data: convert date strings to ISO datetime format in Lima timezone
            // Ensure assigned_users is not empty and assigned_to is valid
            const assignedUsersIds = formData.assigned_users 
                ? formData.assigned_users.map(u => typeof u === 'number' ? u : u.id)
                : [];
            
            const assignedUsers = assignedUsersIds.length > 0 
                ? assignedUsersIds 
                : (formData.assigned_to > 0 ? [formData.assigned_to] : []);
            
            const primaryAssignee = assignedUsers.length > 0 ? assignedUsers[0] : formData.assigned_to;
            
            // Serialize description based on type
            const description = serializeDescription(descriptionType, descriptionText, checklistItems);
            
            const submitData = {
                ...formData,
                description,
                assigned_to: primaryAssignee > 0 ? primaryAssignee : null,
                assigned_users: assignedUsers.length > 0 ? assignedUsers : undefined,
                start_date: dateStringToLimaISO(formData.start_date),
                due_date: dateStringToLimaISO(formData.due_date),
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData),
            });

            if (res.ok) {
                onSave();
                onClose();
            } else {
                const errorData = await res.json().catch(() => ({ error: 'Error desconocido' }));
                setError(errorData.error || 'Error al guardar la tarea');
                console.error('Error saving task:', errorData);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al guardar la tarea';
            setError(errorMessage);
            console.error('Error saving task:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
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
            background: 'rgba(15, 15, 35, 0.75)',
            backdropFilter: 'blur(var(--blur-amount-medium))',
            WebkitBackdropFilter: 'blur(var(--blur-amount-medium))',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            zIndex: 1001,
            padding: 'var(--spacing-md)',
            paddingTop: 'calc(var(--spacing-md) + 80px)', // Extra padding to avoid navbar
            paddingBottom: 'calc(var(--spacing-md) + 80px)', // Extra padding to avoid chat button
            overflowY: 'auto',
        }}>
            <div 
                onClick={(e) => e.stopPropagation()}
                className="card-glass task-form-modal" style={{ 
                width: '100%', 
                maxWidth: '600px', 
                maxHeight: '90vh', 
                overflowY: 'auto',
                margin: 'auto',
            }}>
                <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>
                    {task ? 'Editar Tarea' : 'Nueva Tarea'}
                </h2>

                {error && (
                    <div style={{
                        padding: 'var(--spacing-md)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        color: '#dc2626',
                        marginBottom: 'var(--spacing-md)',
                        fontSize: '0.875rem',
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {/* Title */}
                    <div>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>
                            Título
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="input"
                            required
                        />
                    </div>

                    {/* Description Type Toggle */}
                    <div>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>
                            Descripción
                        </label>
                        
                        {/* Type Toggle Buttons */}
                        <div style={{ 
                            display: 'flex', 
                            gap: 'var(--spacing-xs)', 
                            marginBottom: 'var(--spacing-sm)',
                            background: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-md)',
                            padding: '4px',
                        }}>
                            <button
                                type="button"
                                onClick={() => setDescriptionType('text')}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                                    border: 'none',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    fontSize: '0.8125rem',
                                    fontWeight: 500,
                                    transition: 'all 0.2s',
                                    background: descriptionType === 'text' ? 'var(--accent-primary)' : 'transparent',
                                    color: descriptionType === 'text' ? 'white' : 'var(--text-secondary)',
                                }}
                            >
                                <FileText size={16} />
                                Texto
                            </button>
                            <button
                                type="button"
                                onClick={() => setDescriptionType('checklist')}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                                    border: 'none',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    fontSize: '0.8125rem',
                                    fontWeight: 500,
                                    transition: 'all 0.2s',
                                    background: descriptionType === 'checklist' ? 'var(--accent-primary)' : 'transparent',
                                    color: descriptionType === 'checklist' ? 'white' : 'var(--text-secondary)',
                                }}
                            >
                                <ListChecks size={16} />
                                Checklist
                            </button>
                        </div>
                        
                        {/* Text Description */}
                        {descriptionType === 'text' && (
                        <textarea
                                value={descriptionText}
                                onChange={(e) => setDescriptionText(e.target.value)}
                            className="input"
                                placeholder="Describe la tarea..."
                            style={{ minHeight: '100px', resize: 'vertical' }}
                        />
                        )}
                        
                        {/* Checklist Description */}
                        {descriptionType === 'checklist' && (
                            <div style={{
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-tertiary)',
                                overflow: 'hidden',
                            }}>
                                {/* Existing items */}
                                {checklistItems.length > 0 && (
                                    <div style={{ 
                                        maxHeight: '200px', 
                                        overflowY: 'auto',
                                        borderBottom: '1px solid var(--border-color)',
                                    }}>
                                        {checklistItems.map((item, index) => (
                                            <div 
                                                key={item.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 'var(--spacing-sm)',
                                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                                    borderBottom: index < checklistItems.length - 1 ? '1px solid var(--border-color)' : 'none',
                                                }}
                                            >
                                                <GripVertical size={14} color="var(--text-muted)" style={{ cursor: 'grab', flexShrink: 0 }} />
                                                <input
                                                    type="text"
                                                    value={item.text}
                                                    onChange={(e) => updateChecklistItem(item.id, e.target.value)}
                                                    style={{
                                                        flex: 1,
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: 'var(--text-primary)',
                                                        fontSize: '0.875rem',
                                                        padding: '4px 0',
                                                        outline: 'none',
                                                    }}
                                                    placeholder="Elemento del checklist..."
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeChecklistItem(item.id)}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        padding: '4px',
                                                        borderRadius: 'var(--radius-sm)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'var(--text-muted)',
                                                        transition: 'color 0.2s, background 0.2s',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.color = 'var(--priority-urgent)';
                                                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.color = 'var(--text-muted)';
                                                        e.currentTarget.style.background = 'transparent';
                                                    }}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {/* Add new item */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-sm)',
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                }}>
                                    <Plus size={14} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                                    <input
                                        type="text"
                                        value={newItemText}
                                        onChange={(e) => setNewItemText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addChecklistItem();
                                            }
                                        }}
                                        style={{
                                            flex: 1,
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--text-primary)',
                                            fontSize: '0.875rem',
                                            padding: '4px 0',
                                            outline: 'none',
                                        }}
                                        placeholder="Añadir elemento (Enter para agregar)..."
                                    />
                                    <button
                                        type="button"
                                        onClick={addChecklistItem}
                                        disabled={!newItemText.trim()}
                                        style={{
                                            background: newItemText.trim() ? 'var(--accent-primary)' : 'var(--bg-hover)',
                                            border: 'none',
                                            cursor: newItemText.trim() ? 'pointer' : 'not-allowed',
                                            padding: '4px 8px',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            color: newItemText.trim() ? 'white' : 'var(--text-muted)',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        Añadir
                                    </button>
                                </div>
                                
                                {/* Empty state */}
                                {checklistItems.length === 0 && (
                                    <div style={{
                                        padding: 'var(--spacing-lg)',
                                        textAlign: 'center',
                                        color: 'var(--text-muted)',
                                        fontSize: '0.8125rem',
                                        borderTop: '1px solid var(--border-color)',
                                    }}>
                                        Añade elementos a tu checklist
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Row 1: Assigned To & Priority */}
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>
                                Asignar a (Selección múltiple)
                            </label>
                            <div style={{
                                maxHeight: '150px',
                                overflowY: 'auto',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--spacing-sm)',
                                background: 'var(--bg-tertiary)'
                            }}>
                                {users.map(user => (
                                    <div key={user.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                        <input
                                            type="checkbox"
                                            id={`user-${user.id}`}
                                            checked={formData.assigned_users?.includes(user.id)}
                                            onChange={(e) => {
                                                const current = formData.assigned_users || [];
                                                const currentIds = current.map(u => typeof u === 'number' ? u : u.id);
                                                let updated: number[];
                                                if (e.target.checked) {
                                                    updated = [...currentIds, user.id];
                                                } else {
                                                    updated = currentIds.filter(id => id !== user.id);
                                                }
                                                // Ensure at least one is selected if possible, or handle validation later
                                                setFormData({
                                                    ...formData,
                                                    assigned_users: updated,
                                                    assigned_to: updated[0] || 0 // Update primary assignee
                                                });
                                            }}
                                            style={{ marginRight: '8px' }}
                                        />
                                        <label htmlFor={`user-${user.id}`} style={{ cursor: 'pointer', fontSize: '0.875rem' }}>
                                            {user.full_name} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({user.role})</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>
                                Prioridad
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                className="input"
                            >
                                <option value="low">Baja</option>
                                <option value="medium">Media</option>
                                <option value="high">Alta</option>
                                <option value="urgent">Urgente</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 2: Category & Status */}
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>
                                Categoría
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                                className="input"
                            >
                                <option value="design">Diseño</option>
                                <option value="content">Contenido</option>
                                <option value="video">Video</option>
                                <option value="campaign">Campaña</option>
                                <option value="social">Redes Sociales</option>
                                <option value="other">Otros</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>
                                Estado
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                className="input"
                            >
                                <option value="pending">Pendiente</option>
                                <option value="in_progress">En Progreso</option>
                                <option value="completed">Completada</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 3: Dates */}
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>
                                Fecha Inicio
                            </label>
                            <input
                                type="date"
                                value={formData.start_date || ''}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>
                                Fecha Entrega
                            </label>
                            <input
                                type="date"
                                value={formData.due_date || ''}
                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                className="input"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)', paddingBottom: 'var(--spacing-sm)' }}>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!loading) {
                                    onClose();
                                }
                            }}
                            className="btn"
                            style={{ background: 'transparent', border: '1px solid var(--border-color)' }}
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Guardando...' : (task ? 'Actualizar' : 'Crear Tarea')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

