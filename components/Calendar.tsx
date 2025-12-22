'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDate, isoToLimaDateString, getLimaDateString } from '@/lib/utils';
import CalendarMobile from './CalendarMobile';
import { X, ChevronRight } from 'lucide-react';

interface Task {
    id: number;
    title: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    due_date: string | null;
    task_id?: string | null;
    created_at?: string;
    updated_at?: string;
}

interface CalendarProps {
    tasks: Task[];
}

// Priority colors mapping
const priorityColors = {
    urgent: 'var(--priority-urgent)',
    high: 'var(--priority-high)',
    medium: 'var(--priority-medium)',
    low: 'var(--priority-low)',
};

const priorityLabels = {
    urgent: 'Urgente',
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
};

export default function Calendar({ tasks }: CalendarProps) {
    const router = useRouter();
    const [isMobile, setIsMobile] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<{ day: number; tasks: Task[] } | null>(null);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Show mobile version on mobile devices
    if (isMobile) {
        return <CalendarMobile tasks={tasks} />;
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const previousMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const getTasksForDay = (day: number) => {
        // Create date for the specific day in Lima timezone
        const date = new Date(year, month, day);
        const dateStr = date.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
        return tasks.filter(task => {
            if (!task.due_date) return false;
            // Parse task date and compare in Lima timezone using helper function
            const taskDate = isoToLimaDateString(task.due_date);
            return taskDate === dateStr;
        });
    };

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(<div key={`empty-${i}`} style={{ padding: 'var(--spacing-sm)' }} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayTasks = getTasksForDay(day);
        // Check if day is today in Lima timezone
        const todayLima = getLimaDateString();
        const dayDate = new Date(year, month, day);
        const dayDateLima = dayDate.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
        const isToday = todayLima === dayDateLima;
        const hasTasks = dayTasks.length > 0;

        days.push(
            <div
                key={day}
                onClick={() => hasTasks && setSelectedDay({ day, tasks: dayTasks })}
                style={{
                    padding: 'var(--spacing-sm)',
                    background: isToday ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                    border: hasTasks ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    minHeight: '120px',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-xs)',
                    minWidth: 0, // Crucial for grid truncation
                    cursor: hasTasks ? 'pointer' : 'default',
                }}
            >
                <div
                    style={{
                        fontWeight: isToday ? 700 : 600,
                        fontSize: '0.875rem',
                        color: isToday ? 'var(--accent-primary)' : 'var(--text-primary)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <span>{day}</span>
                    {dayTasks.length > 0 && (
                        <span style={{
                            fontSize: '0.65rem',
                            background: 'var(--accent-primary)',
                            color: 'white',
                            padding: '1px 5px',
                            borderRadius: '10px',
                            fontWeight: 600,
                        }}>
                            {dayTasks.length}
                        </span>
                    )}
                </div>
                {dayTasks.slice(0, 4).map(task => (
                    <div
                        key={task.id}
                        style={{
                            fontSize: '0.7rem',
                            padding: '2px 4px',
                            background: `${priorityColors[task.priority]}20`,
                            borderLeft: `3px solid ${priorityColors[task.priority]}`,
                            borderRadius: '2px',
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                        title={task.title}
                    >
                        {task.title}
                    </div>
                ))}
                {dayTasks.length > 4 && (
                    <div style={{
                        fontSize: '0.65rem',
                        color: 'var(--text-muted)',
                        textAlign: 'center',
                        fontStyle: 'italic',
                    }}>
                        +{dayTasks.length - 4} más...
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={{ width: '100%', position: 'relative' }}>
            {/* Calendar Content - disabled when modal is open */}
            <div style={{ 
                pointerEvents: selectedDay ? 'none' : 'auto',
                opacity: selectedDay ? 0.4 : 1,
                transition: 'opacity 0.2s',
            }}>
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--spacing-lg)',
                }}
            >
                <button onClick={previousMonth} className="btn btn-secondary">
                    ← Anterior
                </button>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                    {monthNames[month]} {year}
                </h2>
                <button onClick={nextMonth} className="btn btn-secondary">
                    Siguiente →
                </button>
            </div>

            {/* Day names */}
            <div
                className="calendar-day-names"
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 'var(--spacing-xs)',
                    marginBottom: 'var(--spacing-sm)',
                }}
            >
                {dayNames.map(name => (
                    <div
                        key={name}
                        className="day-name"
                        style={{
                            textAlign: 'center',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                            padding: 'var(--spacing-sm)',
                        }}
                    >
                        {name}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div
                className="calendar-grid"
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 'var(--spacing-xs)',
                }}
            >
                {days}
            </div>
            </div>{/* End of calendar content wrapper */}

            {/* Day Tasks Modal - Compact */}
            {selectedDay && (
                <div
                    onClick={() => setSelectedDay(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1001,
                        padding: 'var(--spacing-lg)',
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '100%',
                            maxWidth: '320px',
                            maxHeight: '60vh',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-lg)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: 'var(--spacing-md)',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                                {selectedDay.day} de {monthNames[month]}
                            </span>
                            <button
                                onClick={() => setSelectedDay(null)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    color: 'var(--text-muted)',
                                    display: 'flex',
                                }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Tasks List */}
                        <div style={{
                            overflowY: 'auto',
                            maxHeight: 'calc(60vh - 50px)',
                        }}>
                            {selectedDay.tasks.map((task, index) => (
                                <div
                                    key={task.id}
                                    onClick={() => {
                                        setSelectedDay(null);
                                        router.push(`/tasks/${task.id}`);
                                    }}
                                    className="calendar-task-item"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-sm)',
                                        padding: 'var(--spacing-sm) var(--spacing-md)',
                                        borderBottom: index < selectedDay.tasks.length - 1 ? '1px solid var(--border-color)' : 'none',
                                        cursor: 'pointer',
                                        borderLeft: `3px solid ${priorityColors[task.priority]}`,
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: '0.8125rem',
                                            fontWeight: 500,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {task.title}
                                        </div>
                                        {task.task_id && (
                                            <div style={{
                                                fontSize: '0.65rem',
                                                fontFamily: 'monospace',
                                                color: 'var(--text-muted)',
                                            }}>
                                                #{task.task_id}
                                            </div>
                                        )}
                                    </div>
                                    <ChevronRight size={14} color="var(--text-muted)" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
