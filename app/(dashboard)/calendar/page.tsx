'use client';

import { useState, useEffect } from 'react';
import Calendar from '@/components/Calendar';
import GanttView from '@/components/GanttView';
import TaskFormModal from '@/components/TaskFormModal';
import { useAuth } from '@/components/AuthProvider';
import { useTaskModal } from '@/components/TaskModalContext';
import { Calendar as CalendarIcon, BarChart3 } from 'lucide-react';

interface Task {
    id: number;
    task_id: string | null;
    title: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    category: 'design' | 'content' | 'video' | 'campaign' | 'social' | 'other';
    status: 'pending' | 'in_progress' | 'completed';
    start_date: string | null;
    due_date: string | null;
    assigned_user: {
        id: number;
        full_name: string;
        avatar_color: string;
    } | null;
}

export default function CalendarPage() {
    const { user } = useAuth();
    const { isOpen: isModalOpen, closeModal } = useTaskModal();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'calendar' | 'gantt'>('calendar');
    const [isMobile, setIsMobile] = useState(false);
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await fetch('/api/tasks');
                if (res.ok) {
                    const data = await res.json();
                    setTasks(data.tasks);
                }
            } catch (error) {
                console.error('Error fetching tasks:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/users/list');
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data.users || []);
                }
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchTasks();
        fetchUsers();
    }, []);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--text-secondary)' }}>
                Cargando calendario...
            </div>
        );
    }

    return (
        <div className="calendar-page-container" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
            <div className="calendar-page-header" style={{ 
                marginBottom: 'var(--spacing-xl)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 'var(--spacing-md)',
            }}>
                <div style={{ flex: '1 1 auto', minWidth: '200px' }}>
                    <h1 style={{ marginBottom: 'var(--spacing-sm)', display: isMobile ? 'none' : 'block' }}>
                        {view === 'calendar' ? 'Calendario' : 'Vista Gantt'}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: isMobile ? 'none' : 'block' }}>
                        {view === 'calendar'
                            ? 'Visualiza las tareas organizadas por fecha de entrega'
                            : 'Visualiza la duración y cronología de las tareas'
                        }
                    </p>
                </div>

                {/* View Toggle */}
                <div className="calendar-view-toggle" style={{ display: 'flex', gap: 'var(--spacing-sm)', flexShrink: 0 }}>
                    <button
                        onClick={() => setView('calendar')}
                        className="btn"
                        style={{
                            background: view === 'calendar' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                            color: view === 'calendar' ? 'white' : 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        <CalendarIcon size={16} color={view === 'calendar' ? 'white' : 'var(--text-secondary)'} />
                        Calendario
                    </button>
                    <button
                        onClick={() => setView('gantt')}
                        className="btn"
                        style={{
                            background: view === 'gantt' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                            color: view === 'gantt' ? 'white' : 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        <BarChart3 size={16} color={view === 'gantt' ? 'white' : 'var(--text-secondary)'} />
                        Gantt
                    </button>
                </div>
            </div>

            <div className="card">
                {view === 'calendar' ? (
                    <Calendar tasks={tasks} />
                ) : (
                    <GanttView tasks={tasks} />
                )}
            </div>

            <TaskFormModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onSave={async () => {
                    // Refresh tasks after creating a new one
                    const res = await fetch('/api/tasks');
                    if (res.ok) {
                        const data = await res.json();
                        setTasks(data.tasks);
                    }
                }}
                users={users}
            />
        </div>
    );
}
