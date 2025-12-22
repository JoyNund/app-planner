'use client';

import { useState, useEffect } from 'react';
import { Calendar, Check, Trash2, Archive, BarChart3 } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface ChecklistItem {
    id: number;
    user_id: number;
    date: string;
    content: string;
    completed_at: string;
}

interface HistoryDay {
    date: string;
    items: ChecklistItem[];
    total_completed: number;
}

interface Stats {
    total_days: number;
    total_completed: number;
}

export default function ChecklistHistory() {
    const [days, setDays] = useState<HistoryDay[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState<HistoryDay | null>(null);

    useEffect(() => {
        fetchHistory();
        fetchStats();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/checklist/history', {
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                setDays(data.days || []);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/checklist/stats?days=30', {
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleDeleteDay = async (date: string) => {
        if (!confirm('¿Eliminar todos los items de este día?')) return;

        try {
            const res = await fetch(`/api/checklist/history?date=${date}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (res.ok) {
                setDays(prev => prev.filter(day => day.date !== date));
                if (selectedDay?.date === date) {
                    setSelectedDay(null);
                }
                fetchStats(); // Refresh stats
            }
        } catch (error) {
            console.error('Error deleting day:', error);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };


    if (loading) {
        return (
            <div style={{ 
                padding: 'var(--spacing-xl)', 
                textAlign: 'center',
                color: 'var(--text-secondary)' 
            }}>
                Cargando historial...
            </div>
        );
    }

    return (
        <div style={{ 
            padding: 'var(--spacing-lg)',
            maxWidth: '1200px',
            margin: '0 auto',
        }}>
            {/* Header */}
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 'var(--spacing-sm)',
                    marginBottom: 'var(--spacing-md)',
                }}>
                    <Archive size={28} color="var(--accent-primary)" />
                    <h1 style={{ 
                        fontSize: '1.75rem', 
                        fontWeight: 700,
                        margin: 0,
                    }}>
                        Historial de Checklists
                    </h1>
                </div>
                <p style={{ 
                    color: 'var(--text-secondary)', 
                    margin: 0,
                    fontSize: '0.9375rem',
                }}>
                    Revisa tus checklists completados y tu progreso histórico
                </p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-xl)',
                }}>
                    <div style={{
                        background: 'var(--glass-bg-medium)',
                        backdropFilter: 'blur(var(--blur-amount))',
                        WebkitBackdropFilter: 'blur(var(--blur-amount))',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--spacing-lg)',
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 'var(--spacing-sm)',
                            marginBottom: 'var(--spacing-sm)',
                        }}>
                            <Calendar size={20} color="var(--accent-primary)" />
                            <span style={{ 
                                fontSize: '0.8125rem', 
                                color: 'var(--text-secondary)',
                                fontWeight: 600,
                            }}>
                                Días Registrados
                            </span>
                        </div>
                        <div style={{ 
                            fontSize: '2rem', 
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                        }}>
                            {stats.total_days}
                        </div>
                    </div>

                    <div style={{
                        background: 'var(--glass-bg-medium)',
                        backdropFilter: 'blur(var(--blur-amount))',
                        WebkitBackdropFilter: 'blur(var(--blur-amount))',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--spacing-lg)',
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 'var(--spacing-sm)',
                            marginBottom: 'var(--spacing-sm)',
                        }}>
                            <BarChart3 size={20} color="var(--accent-secondary)" />
                            <span style={{ 
                                fontSize: '0.8125rem', 
                                color: 'var(--text-secondary)',
                                fontWeight: 600,
                            }}>
                                Total Completados
                            </span>
                        </div>
                        <div style={{ 
                            fontSize: '2rem', 
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                        }}>
                            {stats.total_completed}
                        </div>
                    </div>
                </div>
            )}

            {/* History List */}
            {days.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: 'var(--spacing-xl)',
                    color: 'var(--text-secondary)',
                }}>
                    <Archive size={48} style={{ opacity: 0.3, marginBottom: 'var(--spacing-md)' }} />
                    <p style={{ margin: 0, fontSize: '0.9375rem' }}>
                        No hay items completados archivados aún
                    </p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        Los items se archivan automáticamente al completarlos
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: selectedDay ? '1fr 1fr' : '1fr',
                    gap: 'var(--spacing-lg)',
                }}>
                    {/* List */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--spacing-md)',
                    }}>
                        {days.map((day) => (
                            <div
                                key={day.date}
                                onClick={() => setSelectedDay(day)}
                                style={{
                                    background: selectedDay?.date === day.date 
                                        ? 'var(--glass-bg-strong)' 
                                        : 'var(--glass-bg-medium)',
                                    backdropFilter: 'blur(var(--blur-amount))',
                                    WebkitBackdropFilter: 'blur(var(--blur-amount))',
                                    border: `1px solid ${selectedDay?.date === day.date ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                                    borderRadius: 'var(--radius-lg)',
                                    padding: 'var(--spacing-lg)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                }}>
                                    <div>
                                        <div style={{ 
                                            fontWeight: 600,
                                            fontSize: '1rem',
                                            marginBottom: '4px',
                                            textTransform: 'capitalize',
                                        }}>
                                            {formatDate(day.date)}
                                        </div>
                                        <div style={{ 
                                            fontSize: '0.8125rem',
                                            color: 'var(--text-secondary)',
                                        }}>
                                            {day.total_completed} {day.total_completed === 1 ? 'item completado' : 'items completados'}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteDay(day.date);
                                        }}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            color: 'var(--text-muted)',
                                        }}
                                    >
                                        <Trash2 size={16} color="#ef4444" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Detail Panel */}
                    {selectedDay && (
                        <div style={{
                            background: 'var(--glass-bg-medium)',
                            backdropFilter: 'blur(var(--blur-amount))',
                            WebkitBackdropFilter: 'blur(var(--blur-amount))',
                            border: '1px solid var(--glass-border)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--spacing-lg)',
                            position: 'sticky',
                            top: 'var(--spacing-lg)',
                            maxHeight: 'calc(100vh - 120px)',
                            overflowY: 'auto',
                        }}>
                            <h3 style={{ 
                                fontSize: '1.125rem',
                                fontWeight: 600,
                                marginBottom: 'var(--spacing-md)',
                                textTransform: 'capitalize',
                            }}>
                                {formatDate(selectedDay.date)}
                            </h3>

                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'var(--spacing-sm)',
                            }}>
                                {selectedDay.items.map((item) => (
                                    <div
                                        key={item.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-sm)',
                                            padding: 'var(--spacing-sm)',
                                            background: 'var(--bg-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                        }}
                                    >
                                        <div style={{
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            border: '2px solid var(--accent-primary)',
                                            background: 'var(--accent-primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <Check size={12} color="white" />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                color: 'var(--text-primary)',
                                                fontSize: '0.9rem',
                                                marginBottom: '2px',
                                            }}>
                                                {item.content}
                                            </div>
                                            <div style={{
                                                fontSize: '0.7rem',
                                                color: 'var(--text-muted)',
                                            }}>
                                                {formatDateTime(item.completed_at)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

