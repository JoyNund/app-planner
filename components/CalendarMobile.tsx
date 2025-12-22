'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate, isoToLimaDateString, getLimaDateString } from '@/lib/utils';
import { X } from 'lucide-react';

interface Task {
    id: number;
    title: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    due_date: string | null;
    task_id?: string | null;
    created_at?: string;
    updated_at?: string;
}

interface CalendarMobileProps {
    tasks: Task[];
}

export default function CalendarMobile({ tasks }: CalendarMobileProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedDayTasks, setSelectedDayTasks] = useState<Task[]>([]);

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

    const getTasksForDay = (day: number): Task[] => {
        const date = new Date(year, month, day);
        const dateStr = date.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
        return tasks.filter(task => {
            if (!task.due_date) return false;
            const taskDate = isoToLimaDateString(task.due_date);
            return taskDate === dateStr;
        });
    };

    const getMostCommonPriority = (dayTasks: Task[]): 'urgent' | 'high' | 'medium' | 'low' | null => {
        if (dayTasks.length === 0) return null;
        
        const priorityCounts = {
            urgent: 0,
            high: 0,
            medium: 0,
            low: 0,
        };
        
        dayTasks.forEach(task => {
            priorityCounts[task.priority]++;
        });
        
        const maxCount = Math.max(...Object.values(priorityCounts));
        if (maxCount === 0) return null;
        
        return (Object.keys(priorityCounts).find(
            key => priorityCounts[key as keyof typeof priorityCounts] === maxCount
        ) || 'medium') as 'urgent' | 'high' | 'medium' | 'low';
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'var(--priority-urgent)';
            case 'high': return 'var(--priority-high)';
            case 'medium': return 'var(--priority-medium)';
            case 'low': return 'var(--priority-low)';
            default: return 'var(--text-muted)';
        }
    };

    const handleDayClick = (day: number) => {
        const dayTasks = getTasksForDay(day);
        if (dayTasks.length > 0) {
            const date = new Date(year, month, day);
            setSelectedDate(date);
            setSelectedDayTasks(dayTasks);
        }
    };

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(<div key={`empty-${i}`} className="calendar-mobile-day-empty" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayTasks = getTasksForDay(day);
        const todayLima = getLimaDateString();
        const dayDate = new Date(year, month, day);
        const dayDateLima = dayDate.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
        const isToday = todayLima === dayDateLima;
        const hasTasks = dayTasks.length > 0;
        const mostCommonPriority = getMostCommonPriority(dayTasks);
        const indicatorColor = mostCommonPriority ? getPriorityColor(mostCommonPriority) : null;

        days.push(
            <button
                key={day}
                onClick={() => handleDayClick(day)}
                className="calendar-mobile-day"
                style={{
                    aspectRatio: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isToday 
                        ? 'var(--bg-tertiary)' 
                        : hasTasks && indicatorColor
                            ? `${indicatorColor}15`
                            : 'var(--bg-secondary)',
                    border: isToday 
                        ? `2px solid var(--accent-primary)` 
                        : hasTasks 
                            ? `2px solid ${indicatorColor || 'var(--border-color)'}`
                            : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: isToday ? 'var(--accent-primary)' : 'var(--text-primary)',
                    fontWeight: isToday ? 700 : hasTasks ? 600 : 400,
                    fontSize: '0.875rem',
                    cursor: hasTasks ? 'pointer' : 'default',
                    position: 'relative',
                    transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                    if (hasTasks) {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (hasTasks) {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                    }
                }}
            >
                <span>{day}</span>
                {hasTasks && (
                    <span
                        className="calendar-mobile-badge"
                        style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            backgroundColor: indicatorColor || 'var(--accent-primary)',
                            color: 'white',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            border: '2px solid var(--bg-secondary)',
                        }}
                    >
                        {dayTasks.length > 99 ? '99+' : dayTasks.length}
                    </span>
                )}
            </button>
        );
    }

    return (
        <>
            <div style={{ width: '100%' }}>
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 'var(--spacing-lg)',
                    }}
                >
                    <button onClick={previousMonth} className="btn btn-secondary btn-sm">
                        ← Anterior
                    </button>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                        {monthNames[month]} {year}
                    </h2>
                    <button onClick={nextMonth} className="btn btn-secondary btn-sm">
                        Siguiente →
                    </button>
                </div>

                {/* Day names */}
                <div
                    className="calendar-mobile-day-names"
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
                            style={{
                                textAlign: 'center',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)',
                                padding: 'var(--spacing-xs)',
                            }}
                        >
                            {name}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div
                    className="calendar-mobile-grid"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: 'var(--spacing-xs)',
                    }}
                >
                    {days}
                </div>
            </div>

            {/* Modal for selected day tasks */}
            {selectedDate && selectedDayTasks.length > 0 && (
                <div
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
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: 'var(--spacing-md)',
                    }}
                    onClick={() => {
                        setSelectedDate(null);
                        setSelectedDayTasks([]);
                    }}
                >
                    <div
                        className="card-glass"
                        style={{
                            width: '100%',
                            maxWidth: '500px',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            position: 'relative',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 'var(--spacing-lg)',
                                paddingBottom: 'var(--spacing-md)',
                                borderBottom: '1px solid var(--border-color)',
                            }}
                        >
                            <div>
                                <h3 style={{ marginBottom: 'var(--spacing-xs)' }}>
                                    {formatDate(selectedDate.toISOString())}
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    {selectedDayTasks.length} {selectedDayTasks.length === 1 ? 'tarea' : 'tareas'}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedDate(null);
                                    setSelectedDayTasks([]);
                                }}
                                className="btn btn-ghost"
                                style={{ padding: 'var(--spacing-xs)' }}
                            >
                                <X size={20} strokeWidth={2} />
                            </button>
                        </div>

                        {/* Tasks List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            {selectedDayTasks.map(task => {
                                const priorityColors = {
                                    urgent: 'var(--priority-urgent)',
                                    high: 'var(--priority-high)',
                                    medium: 'var(--priority-medium)',
                                    low: 'var(--priority-low)',
                                };
                                const color = priorityColors[task.priority];

                                return (
                                    <Link
                                        key={task.id}
                                        href={`/tasks/${task.id}`}
                                        onClick={() => {
                                            setSelectedDate(null);
                                            setSelectedDayTasks([]);
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-md)',
                                            padding: 'var(--spacing-md)',
                                            background: 'var(--glass-bg-medium)',
                                            backdropFilter: 'blur(var(--blur-amount))',
                                            WebkitBackdropFilter: 'blur(var(--blur-amount))',
                                            border: `1px solid ${color}40`,
                                            borderLeft: `4px solid ${color}`,
                                            borderRadius: 'var(--radius-md)',
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateX(4px)';
                                            e.currentTarget.style.boxShadow = `0 4px 12px ${color}30`;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateX(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '12px',
                                                height: '12px',
                                                borderRadius: '50%',
                                                backgroundColor: color,
                                                flexShrink: 0,
                                            }}
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div
                                                style={{
                                                    fontWeight: 600,
                                                    fontSize: '0.9375rem',
                                                    marginBottom: 'var(--spacing-xs)',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {task.title}
                                            </div>
                                            {task.task_id && (
                                                <div
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        fontFamily: 'monospace',
                                                        color: 'var(--text-muted)',
                                                    }}
                                                >
                                                    #{task.task_id}
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

