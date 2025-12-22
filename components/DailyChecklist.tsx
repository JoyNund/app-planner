'use client';

import { useState, useEffect } from 'react';
import { Check, Plus, Trash2, Loader2, History } from 'lucide-react';
import { getLimaDateString } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface ChecklistItem {
    id: number;
    content: string;
    is_completed: number; // SQLite uses 0/1 for boolean
}

export default function DailyChecklist() {
    const router = useRouter();
    const [items, setItems] = useState<ChecklistItem[]>([]);
    const [newItem, setNewItem] = useState('');
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    // Always get current date in Lima timezone on client side
    const getTodayLima = () => {
        if (typeof window === 'undefined') return '';
        const now = new Date();
        return now.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
    };
    
    const [today, setToday] = useState(getTodayLima());

    // Update today's date periodically to ensure it's always correct
    useEffect(() => {
        const updateDate = () => {
            const currentDate = getTodayLima();
            if (currentDate && currentDate !== today) {
                setToday(currentDate);
            }
        };
        
        // Update every minute to catch date changes
        const interval = setInterval(updateDate, 60000);
        // Also check immediately on mount
        updateDate();
        
        return () => clearInterval(interval);
    }, [today]);

    useEffect(() => {
        if (today) {
        fetchItems();
        }
    }, [today]);

    const fetchItems = async () => {
        try {
            // Always use current date in Lima timezone
            const currentDate = getTodayLima();
            if (currentDate !== today) {
                setToday(currentDate); // Update state to reflect current date
            }
            const res = await fetch(`/api/checklist?date=${currentDate}`);
            if (res.ok) {
                const data = await res.json();
                setItems(data.items);
            }
        } catch (error) {
            console.error('Error fetching checklist:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.trim()) return;

        setAdding(true);
        try {
            // Always use current date in Lima timezone when creating item
            const currentDate = getTodayLima();
            const res = await fetch('/api/checklist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newItem, date: currentDate }),
            });

            if (res.ok) {
                const data = await res.json();
                setItems(data.items);
                setNewItem('');
            }
        } catch (error) {
            console.error('Error adding item:', error);
        } finally {
            setAdding(false);
        }
    };

    const handleToggle = async (id: number) => {
        const item = items.find(i => i.id === id);
        if (!item) return;

        const willBeCompleted = !item.is_completed;

        // Optimistic update
        setItems(prev => prev.map(i =>
            i.id === id ? { ...i, is_completed: i.is_completed ? 0 : 1 } : i
        ));

        try {
            const res = await fetch('/api/checklist', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, date: getTodayLima() }),
            });

            if (!res.ok) {
                // Revert on error
                fetchItems();
                return;
            }

            // If item was just completed, archive it automatically
            if (willBeCompleted) {
                try {
                    const archiveRes = await fetch('/api/checklist/history', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                            date: getTodayLima(),
                            content: item.content,
                        }),
                    });
                    
                    if (!archiveRes.ok) {
                        const errorData = await archiveRes.json();
                        console.error('Error archiving item:', errorData);
                    } else {
                        console.log('Item archived successfully:', item.content);
                    }
                } catch (archiveError) {
                    console.error('Error in archive request:', archiveError);
                }
            }
        } catch (error) {
            console.error('Error toggling item:', error);
            fetchItems();
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar este item?')) return;

        try {
            const res = await fetch(`/api/checklist?id=${id}&date=${getTodayLima()}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                const data = await res.json();
                setItems(data.items);
            }
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };


    return (
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 'var(--spacing-md)',
            }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ✅ Checklist Diario
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                        {today}
                    </span>
                </h3>
                <button
                    onClick={() => router.push('/checklist-history')}
                    style={{
                        background: 'transparent',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.8125rem',
                        color: 'var(--text-secondary)',
                    }}
                    title="Ver historial de completados"
                >
                    <History size={14} />
                </button>
            </div>

            <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '8px', marginBottom: 'var(--spacing-md)' }}>
                <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Nueva tarea..."
                    style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--glass-border)',
                        background: 'var(--glass-bg)',
                        backdropFilter: 'blur(var(--blur-amount))',
                        WebkitBackdropFilter: 'blur(var(--blur-amount))',
                        color: 'var(--text-primary)',
                    }}
                    disabled={adding}
                />
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={adding || !newItem.trim()}
                    style={{ padding: '8px' }}
                >
                    {adding ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                </button>
            </form>

            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 'var(--spacing-md)' }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                        <Loader2 className="animate-spin" />
                    </div>
                ) : items.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: '0.875rem' }}>
                        No hay tareas para hoy. ¡Agrega una!
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {items.map(item => (
                            <div
                                key={item.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '8px',
                                    background: 'var(--glass-bg)',
                                    backdropFilter: 'blur(var(--blur-amount))',
                                    WebkitBackdropFilter: 'blur(var(--blur-amount))',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: 'var(--radius-md)',
                                    opacity: item.is_completed ? 0.7 : 1,
                                    transition: 'all 0.2s',
                                }}
                            >
                                <div
                                    onClick={() => handleToggle(item.id)}
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        border: `2px solid ${item.is_completed ? 'var(--accent-primary)' : 'var(--text-muted)'}`,
                                        background: item.is_completed ? 'var(--accent-primary)' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        flexShrink: 0,
                                    }}
                                >
                                    {item.is_completed ? <Check size={12} color="white" /> : null}
                                </div>
                                <span style={{
                                    flex: 1,
                                    textDecoration: item.is_completed ? 'line-through' : 'none',
                                    color: item.is_completed ? 'var(--text-muted)' : 'var(--text-primary)',
                                    fontSize: '0.9rem',
                                }}>
                                    {item.content}
                                </span>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        padding: '4px',
                                    }}
                                >
                                    <Trash2 size={14} color="#ef4444" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
