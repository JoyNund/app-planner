'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import TaskCard from '@/components/TaskCard';
import SuperTaskCard from '@/components/SuperTaskCard';
import SuperTaskModal from '@/components/SuperTaskModal';
import TaskFormModal from '@/components/TaskFormModal';
import EfficiencyBar from '@/components/EfficiencyBar';
import DailyChecklist from '@/components/DailyChecklist';
import { useAuth } from '@/components/AuthProvider';
import { useTaskModal } from '@/components/TaskModalContext';
import { getWeekTasks, getDayTasks, getCurrentWeek, getCurrentDay, formatDateRange } from '@/lib/dateUtils';
import { isoToLimaDateString } from '@/lib/utils';
import { calculateUserMetrics } from '@/lib/metrics';
import { ClipboardList, Clock, TrendingUp, CheckCircle2, BarChart3, Calendar, CalendarDays, TrendingUp as TrendingUpIcon, Calendar as CalendarIcon, CheckCircle, Circle, Loader2, Search, X } from 'lucide-react';

interface Task {
    id: number;
    task_id: string | null;
    title: string;
    description: string | null;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    category: 'design' | 'content' | 'video' | 'campaign' | 'social' | 'other';
    status: 'pending' | 'in_progress' | 'completed';
    due_date: string | null;
    assigned_user: {
        id: number;
        full_name: string;
        avatar_color: string;
    } | null;
    assigned_users?: {
        id: number;
        full_name: string;
        avatar_color: string;
    }[];
    updated_at: string;
    parent_task_id?: number | null;
    is_super_task?: number;
    child_tasks?: Task[];
}

interface User {
    id: number;
    username: string;
    full_name: string;
    role: string;
    avatar_color: string;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const { isOpen: isModalOpen, closeModal, openModal } = useTaskModal();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [allTasks, setAllTasks] = useState<Task[]>([]); // All tasks without filters for stats
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'general' | 'weekly' | 'daily' | 'history'>('general');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isMobile, setIsMobile] = useState(false);
    
    // Load filters from localStorage on mount
    const loadFiltersFromStorage = () => {
        if (typeof window === 'undefined') {
            return {
                assignedTo: '',
                priority: '',
                category: '',
                status: 'pending',
            };
        }
        try {
            const saved = localStorage.getItem('dashboard-filters');
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    assignedTo: parsed.assignedTo || '',
                    priority: parsed.priority || '',
                    category: parsed.category || '',
                    status: parsed.status || 'pending',
                };
            }
        } catch (e) {
            console.error('Error loading filters from storage:', e);
        }
        return {
            assignedTo: '',
            priority: '',
            category: '',
            status: 'pending',
        };
    };

    const [filters, setFilters] = useState(loadFiltersFromStorage);
    const [searchQuery, setSearchQuery] = useState(() => {
        if (typeof window === 'undefined') return '';
        try {
            return localStorage.getItem('dashboard-search') || '';
        } catch {
            return '';
        }
    });
    const [historyStats, setHistoryStats] = useState<{ month: string; status: string; count: number }[]>([]);
    const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
    const [dropTargetId, setDropTargetId] = useState<number | null>(null);
    const [showSuperTaskModal, setShowSuperTaskModal] = useState(false);
    const [tasksToGroup, setTasksToGroup] = useState<number[]>([]);
    const [isCreatingSuperTask, setIsCreatingSuperTask] = useState(false);

    // Fetch all tasks for stats (without filters)
    const fetchAllTasks = useCallback(async () => {
        try {
            const res = await fetch('/api/tasks');
            const data = await res.json();
            setAllTasks(data.tasks || []);
        } catch (error) {
            console.error('Error fetching all tasks:', error);
            setAllTasks([]);
        }
    }, []);

    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.assignedTo) params.append('assigned_to', filters.assignedTo);
            if (filters.priority) params.append('priority', filters.priority);
            if (filters.category) params.append('category', filters.category);
            if (filters.status) params.append('status', filters.status);

            const res = await fetch(`/api/tasks?${params}`);
            const data = await res.json();
            setTasks(data.tasks || []);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    }, [filters.assignedTo, filters.priority, filters.category, filters.status]);

    // Handle drag and drop for super tasks
    const handleDragOver = (e: React.DragEvent, targetTaskId: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedTaskId && draggedTaskId !== targetTaskId) {
            const targetTask = tasks.find(t => t.id === targetTaskId);
            if (targetTask?.is_super_task) {
                setDropTargetId(targetTaskId);
            }
        }
    };

    const handleDragLeave = () => {
        setDropTargetId(null);
    };

    const handleDrop = async (e: React.DragEvent, targetTaskId: number) => {
        e.preventDefault();
        setDropTargetId(null);
        
        if (!draggedTaskId || draggedTaskId === targetTaskId) return;

        const targetTask = tasks.find(t => t.id === targetTaskId);
        if (!targetTask?.is_super_task) {
            // If dropping on a regular task, show modal to create new super task
            const draggedTask = tasks.find(t => t.id === draggedTaskId);
            if (draggedTask && !draggedTask.is_super_task && !draggedTask.parent_task_id) {
                setTasksToGroup([draggedTaskId, targetTaskId]);
                setShowSuperTaskModal(true);
            }
            return;
        }

        // Add task to existing super task
        try {
            const res = await fetch('/api/tasks/super', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ super_task_id: targetTaskId, task_id: draggedTaskId, action: 'add' }),
            });

            if (res.ok) {
                fetchTasks();
            } else {
                const error = await res.json();
                alert(error.error || 'Error al agregar la tarea a la super tarea');
            }
        } catch (error) {
            console.error('Error adding task to super task:', error);
            alert('Error al agregar la tarea');
        }
    };

    const handleCreateSuperTask = async (title: string) => {
        if (tasksToGroup.length < 2) return;

        setIsCreatingSuperTask(true);
        try {
            const res = await fetch('/api/tasks/super', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, task_ids: tasksToGroup }),
            });

            if (res.ok) {
                setShowSuperTaskModal(false);
                setTasksToGroup([]);
                fetchTasks();
            } else {
                const error = await res.json();
                alert(error.error || 'Error al crear la super tarea');
            }
        } catch (error) {
            console.error('Error creating super task:', error);
            alert('Error al crear la super tarea');
        } finally {
            setIsCreatingSuperTask(false);
        }
    };

    const handleRemoveTaskFromSuper = (taskId: number) => {
        fetchTasks();
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users/list');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/stats/history');
            if (res.ok) {
                const data = await res.json();
                setHistoryStats(data.stats);
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Save filters to localStorage whenever they change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('dashboard-filters', JSON.stringify(filters));
            } catch (e) {
                console.error('Error saving filters to storage:', e);
            }
        }
    }, [filters]);

    // Save search query to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('dashboard-search', searchQuery);
            } catch (e) {
                console.error('Error saving search to storage:', e);
            }
        }
    }, [searchQuery]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (user) {
            fetchAllTasks(); // Always fetch all tasks for stats
            fetchUsers(); // Always fetch users to populate modal and filters
        }
    }, [user?.id, fetchAllTasks]); // Include fetchAllTasks in dependencies

    useEffect(() => {
        if (user) {
            // Only fetch filtered tasks if not in history view
            if (view !== 'history') {
                fetchTasks(); // Fetch filtered tasks for display
            }
        }
    }, [user?.id, fetchTasks, view]); // Include view in dependencies

    useEffect(() => {
        if (view === 'history' && user) {
            fetchHistory();
        }
    }, [view, user?.id]);

    // Filter tasks by view and search query
    // When searching, always search ALL tasks regardless of filters
    const filteredTasks = (() => {
        // If there's a search query, search in ALL tasks (ignore filters)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            return allTasks.filter(task => 
                task.title.toLowerCase().includes(query) ||
                (task.description && task.description.toLowerCase().includes(query)) ||
                (task.task_id && task.task_id.toLowerCase().includes(query)) ||
                (task.assigned_user?.full_name && task.assigned_user.full_name.toLowerCase().includes(query)) ||
                (task.assigned_users?.some(u => u.full_name.toLowerCase().includes(query)))
            );
        }
        
        // Otherwise, apply view filters normally
        let result: Task[];
        switch (view) {
            case 'weekly':
                result = getWeekTasks(tasks, selectedDate);
                break;
            case 'daily':
                result = getDayTasks(tasks, selectedDate);
                break;
            default:
                result = tasks;
        }
        
        return result;
    })();

    // Stats always use all tasks (not filtered)
    const stats = {
        total: allTasks.length,
        pending: allTasks.filter(t => t.status === 'pending').length,
        inProgress: allTasks.filter(t => t.status === 'in_progress').length,
        completed: allTasks.filter(t => t.status === 'completed').length,
    };

    // Calculate metrics if a user is selected
    const userMetrics = filters.assignedTo ? calculateUserMetrics(filteredTasks as any) : null;
    const selectedUser = users.find(u => u.id === Number(filters.assignedTo));

    // Helper to process history data for chart
    const getChartData = () => {
        // MOCK DATA FOR DEMO (Temporary)
        if (historyStats.length === 0) {
            return [
                { month: '2024-06', completed: 12, total: 15 },
                { month: '2024-07', completed: 18, total: 22 },
                { month: '2024-08', completed: 25, total: 30 },
                { month: '2024-09', completed: 20, total: 28 },
                { month: '2024-10', completed: 35, total: 40 },
                { month: '2024-11', completed: 28, total: 32 },
            ];
        }

        const months = [...new Set(historyStats.map(s => s.month))];
        return months.map(month => {
            const stats = historyStats.filter(s => s.month === month);
            const completed = stats.find(s => s.status === 'completed')?.count || 0;
            const total = stats.reduce((acc, curr) => acc + curr.count, 0);
            return { month, completed, total };
        });
    };

    const chartData = getChartData();
    const maxCount = Math.max(...chartData.map(d => d.total), 1);

    return (
        <div className="dashboard-page-container" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
            {/* Header */}
            <div className="dashboard-page-header" style={{ 
                marginBottom: 'var(--spacing-2xl)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 'var(--spacing-md)',
            }}>
                <div style={{ flex: '1 1 auto', minWidth: '200px' }}>
                    <h1 style={{ marginBottom: 'var(--spacing-sm)', display: isMobile ? 'none' : 'block' }}>Vista General</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: isMobile ? 'none' : 'block' }}>
                        Gestiona y da seguimiento a todas las tareas del equipo
                    </p>
                </div>
                {user?.role === 'admin' && (
                    <button
                        onClick={openModal}
                        className="btn btn-primary"
                        style={{ flexShrink: 0, display: isMobile ? 'none' : 'flex' }}
                    >
                        + Nueva Tarea
                    </button>
                )}
            </div>

            {/* Stats - Compact Row */}
            <div
                className="dashboard-stats-grid"
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 'var(--spacing-lg)',
                    marginBottom: 'var(--spacing-xl)',
                }}
            >
                <div className="card" style={{ padding: 'var(--spacing-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '4px' }}>Total Tareas</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.total}</div>
                    </div>
                    <div className="stat-icon" style={{ fontSize: '1.5rem' }}><ClipboardList size={24} strokeWidth={2} color="var(--text-secondary)" /></div>
                </div>
                <div className="card" style={{ padding: 'var(--spacing-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '4px' }}>Pendientes</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-urgent)' }}>{stats.pending}</div>
                    </div>
                    <div className="stat-icon" style={{ fontSize: '1.5rem' }}><Clock size={24} strokeWidth={2} color="var(--status-urgent)" /></div>
                </div>
                <div className="card" style={{ padding: 'var(--spacing-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '4px' }}>En Progreso</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-high)' }}>{stats.inProgress}</div>
                    </div>
                    <div className="stat-icon" style={{ fontSize: '1.5rem' }}><TrendingUp size={24} strokeWidth={2} color="var(--status-high)" /></div>
                </div>
                <div className="card" style={{ padding: 'var(--spacing-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '4px' }}>Completadas</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-completed)' }}>{stats.completed}</div>
                    </div>
                    <div className="stat-icon" style={{ fontSize: '1.5rem' }}><CheckCircle2 size={24} strokeWidth={2} color="var(--status-completed)" /></div>
                </div>
            </div>

            {/* View Tabs */}
            <div 
                className="dashboard-tabs"
                style={{
                    display: 'flex',
                    gap: 'var(--spacing-sm)',
                    marginBottom: 'var(--spacing-xl)',
                    borderBottom: '2px solid var(--border-color)',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                }}
            >
                <button
                    onClick={() => setView('general')}
                    className="btn"
                    style={{
                        background: view === 'general' ? 'var(--accent-primary)' : 'transparent',
                        color: view === 'general' ? 'white' : 'var(--text-secondary)',
                        borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                        borderBottom: view === 'general' ? '2px solid var(--accent-primary)' : 'none',
                        marginBottom: '-2px',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <BarChart3 size={16} style={{ marginRight: '6px' }} />
                    General
                </button>
                <button
                    onClick={() => setView('weekly')}
                    className="btn"
                    style={{
                        background: view === 'weekly' ? 'var(--accent-primary)' : 'transparent',
                        color: view === 'weekly' ? 'white' : 'var(--text-secondary)',
                        borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                        borderBottom: view === 'weekly' ? '2px solid var(--accent-primary)' : 'none',
                        marginBottom: '-2px',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <Calendar size={16} color={view === 'weekly' ? 'white' : 'var(--text-secondary)'} style={{ marginRight: '6px' }} />
                    Semanal
                </button>
                <button
                    onClick={() => setView('daily')}
                    className="btn"
                    style={{
                        background: view === 'daily' ? 'var(--accent-primary)' : 'transparent',
                        color: view === 'daily' ? 'white' : 'var(--text-secondary)',
                        borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                        borderBottom: view === 'daily' ? '2px solid var(--accent-primary)' : 'none',
                        marginBottom: '-2px',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <CalendarDays size={16} color={view === 'daily' ? 'white' : 'var(--text-secondary)'} style={{ marginRight: '6px' }} />
                    Diaria
                </button>
                <button
                    onClick={() => setView('history')}
                    className="btn"
                    style={{
                        background: view === 'history' ? 'var(--accent-primary)' : 'transparent',
                        color: view === 'history' ? 'white' : 'var(--text-secondary)',
                        borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                        borderBottom: view === 'history' ? '2px solid var(--accent-primary)' : 'none',
                        marginBottom: '-2px',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <TrendingUpIcon size={16} style={{ marginRight: '6px' }} />
                    Histórico
                </button>
            </div>

            {view === 'history' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <h2 style={{ marginBottom: 'var(--spacing-sm)' }}>Archivo de Tareas</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            Consulta el historial de tareas organizadas por mes
                        </p>
                    </div>

                    {chartData.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--text-secondary)' }}>
                            No hay datos históricos disponibles
                        </div>
                    ) : (
                        <div className="history-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--spacing-lg)' }}>
                            {chartData.map((data) => {
                                // Use allTasks (unfiltered) for history view
                                const monthTasks = allTasks.filter(t => {
                                    if (!t.due_date) return false;
                                    // Get date in Lima timezone and extract YYYY-MM
                                    const taskDateStr = isoToLimaDateString(t.due_date);
                                    if (!taskDateStr) return false;
                                    const taskMonth = taskDateStr.substring(0, 7); // YYYY-MM
                                    return taskMonth === data.month;
                                });

                                const completedCount = monthTasks.filter(t => t.status === 'completed').length;
                                const totalCount = monthTasks.length;
                                const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                                return (
                                    <div key={data.month} className="card" style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        height: '400px'
                                    }}>
                                        {/* Month Header */}
                                        <div style={{
                                            paddingBottom: 'var(--spacing-md)',
                                            borderBottom: '1px solid var(--border-color)',
                                            marginBottom: 'var(--spacing-md)'
                                        }}>
                                            <h3 style={{ marginBottom: 'var(--spacing-xs)' }}>{data.month}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                <span>{totalCount} tareas</span>
                                                <span>•</span>
                                                <span style={{ color: 'var(--status-completed)' }}>{completedCount} completadas ({completionRate}%)</span>
                                            </div>
                                            {/* Progress bar */}
                                            <div style={{
                                                marginTop: 'var(--spacing-sm)',
                                                height: '4px',
                                                background: 'var(--bg-tertiary)',
                                                borderRadius: '2px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${completionRate}%`,
                                                    height: '100%',
                                                    background: 'var(--status-completed)',
                                                    transition: 'width 0.3s ease'
                                                }} />
                                            </div>
                                        </div>

                                        {/* Task List - Scrollable */}
                                        <div style={{
                                            flex: '1 1 auto',
                                            overflowY: 'auto',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 'var(--spacing-xs)'
                                        }}>
                                            {monthTasks.length === 0 ? (
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                                                    No hay tareas en este mes
                                                </p>
                                            ) : (
                                                monthTasks.map(task => (
                                                    <a
                                                        key={task.id}
                                                        href={`/tasks/${task.id}`}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 'var(--spacing-sm)',
                                                            padding: 'var(--spacing-sm)',
                                                            borderRadius: 'var(--radius-sm)',
                                                            background: 'var(--bg-tertiary)',
                                                            textDecoration: 'none',
                                                            color: 'inherit',
                                                            transition: 'background 0.2s ease',
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                                    >
                                                        <span style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            opacity: task.status === 'completed' ? 0.5 : 1
                                                        }}>
                                                            {task.status === 'completed' ? (
                                                                <CheckCircle size={16} color="var(--status-completed)" />
                                                            ) : task.status === 'in_progress' ? (
                                                                <Loader2 size={16} color="var(--status-in-progress)" style={{ animation: 'spin 1s linear infinite' }} className="spin-animation" />
                                                            ) : (
                                                                <Circle size={16} color="var(--status-pending)" />
                                                            )}
                                                        </span>
                                                        <span style={{
                                                            flex: 1,
                                                            fontSize: '0.875rem',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                                                            opacity: task.status === 'completed' ? 0.6 : 1
                                                        }}>
                                                            {task.title}
                                                        </span>
                                                        <span
                                                            className="badge"
                                                            style={{
                                                                fontSize: '0.65rem',
                                                                padding: '2px 6px',
                                                                backgroundColor:
                                                                    task.status === 'completed'
                                                                        ? 'rgba(34, 197, 94, 0.2)'
                                                                        : task.status === 'in_progress'
                                                                            ? 'rgba(59, 130, 246, 0.2)'
                                                                            : 'rgba(107, 114, 128, 0.2)',
                                                                color:
                                                                    task.status === 'completed'
                                                                        ? 'var(--status-completed)'
                                                                        : task.status === 'in_progress'
                                                                            ? 'var(--status-in-progress)'
                                                                            : 'var(--status-pending)',
                                                            }}
                                                        >
                                                            {task.status === 'completed' ? 'OK' : task.status === 'in_progress' ? 'EN CURSO' : 'PEND'}
                                                        </span>
                                                    </a>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* Date Range Info */}
                    {view !== 'general' && (
                        <div className="card" style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)' }}>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                {view === 'weekly' && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <CalendarIcon size={16} color="var(--text-secondary)" />
                                        Semana: {formatDateRange(getCurrentWeek().start, getCurrentWeek().end)}
                                    </span>
                                )}
                                {view === 'daily' && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <CalendarIcon size={16} color="var(--text-secondary)" />
                                        Hoy: {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Search and Filters - Only show when not in history view */}
                    {(view === 'general' || view === 'weekly' || view === 'daily') && (
                    <div
                        className="card filter-row"
                        style={{
                            marginBottom: 'var(--spacing-xl)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--spacing-md)',
                        }}
                    >
                        {/* Search Bar */}
                        <div style={{ position: 'relative', width: '100%' }}>
                            <Search 
                                size={18} 
                                style={{ 
                                    position: 'absolute', 
                                    left: '12px', 
                                    top: '50%', 
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-muted)',
                                    pointerEvents: 'none',
                                }} 
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar tareas por título, descripción, ID o usuario asignado..."
                                style={{
                                    width: '100%',
                                    paddingLeft: '40px',
                                    paddingRight: searchQuery ? '40px' : '12px',
                                    height: '44px',
                                    fontSize: '0.9375rem',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--text-primary)',
                                    transition: 'border-color 0.2s, box-shadow 0.2s',
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    style={{
                                        position: 'absolute',
                                        right: '8px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'var(--bg-hover)',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '24px',
                                        height: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: 'var(--text-secondary)',
                                        transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                    title="Limpiar búsqueda"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Filters Row */}
                        <div style={{
                            display: 'flex',
                            gap: 'var(--spacing-md)',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                        }}>
                            <select
                                value={filters.assignedTo}
                                onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
                                style={{ flex: '1 1 180px' }}
                            >
                                <option value="">Todos los usuarios</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.full_name}</option>
                                ))}
                            </select>

                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                style={{ flex: '1 1 180px' }}
                            >
                                <option value="">Todos los estados</option>
                                <option value="pending">Pendiente</option>
                                <option value="in_progress">En Progreso</option>
                                <option value="completed">Completada</option>
                            </select>

                            <select
                                value={filters.priority}
                                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                                style={{ flex: '1 1 180px' }}
                            >
                                <option value="">Todas las prioridades</option>
                                <option value="urgent">Urgente</option>
                                <option value="high">Alta</option>
                                <option value="medium">Media</option>
                                <option value="low">Baja</option>
                            </select>

                            <select
                                value={filters.category}
                                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                style={{ flex: '1 1 180px' }}
                            >
                                <option value="">Todas las categorías</option>
                                <option value="design">Diseño</option>
                                <option value="content">Contenido</option>
                                <option value="video">Video</option>
                                <option value="campaign">Campaña</option>
                                <option value="social">Redes Sociales</option>
                                <option value="other">Otros</option>
                            </select>

                            <button
                                onClick={() => {
                                    setFilters({ assignedTo: '', priority: '', category: '', status: 'pending' });
                                    setSearchQuery('');
                                }}
                                className="btn btn-secondary"
                                style={{ flexShrink: 0 }}
                            >
                                Limpiar
                            </button>
                        </div>

                        {/* Search results indicator */}
                        {searchQuery && (
                            <div style={{ 
                                fontSize: '0.8125rem', 
                                color: 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-xs)',
                            }}>
                                <Search size={14} />
                                <span>
                                    {filteredTasks.length} resultado{filteredTasks.length !== 1 ? 's' : ''} en todas las tareas para "<strong style={{ color: 'var(--text-secondary)' }}>{searchQuery}</strong>"
                                </span>
                            </div>
                        )}
                    </div>
                    )}

                    {/* Main Content Grid */}
                    <div className="dashboard-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--spacing-xl)' }}>
                        {/* Left Column: Tasks */}
                        <div>
                            {/* Tasks Grid */}
                            {
                                loading ? (
                                    <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--text-secondary)' }}>
                                        Cargando tareas...
                                    </div>
                                ) : filteredTasks.length === 0 ? (
                                    <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                                        <p style={{ color: 'var(--text-secondary)' }}>
                                            {view === 'weekly' && 'No hay tareas para esta semana'}
                                            {view === 'daily' && 'No hay tareas para hoy'}
                                            {view === 'general' && 'No hay tareas que mostrar'}
                                        </p>
                                    </div>
                                ) : (
                                    <div 
                                        className="tasks-grid grid grid-cols-2" 
                                        style={{ gap: 'var(--spacing-lg)' }}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            e.dataTransfer.dropEffect = 'move';
                                        }}
                                        onDragLeave={handleDragLeave}
                                    >
                                        {filteredTasks.map((task) => {
                                            // Show super tasks with SuperTaskCard
                                            if (task.is_super_task) {
                                                return (
                                                    <div
                                                        key={task.id}
                                                        onDragOver={(e) => handleDragOver(e, task.id)}
                                                        onDragLeave={handleDragLeave}
                                                        onDrop={(e) => handleDrop(e, task.id)}
                                                        style={{
                                                            border: dropTargetId === task.id ? '2px dashed var(--accent-primary)' : 'none',
                                                            borderRadius: 'var(--radius-lg)',
                                                            padding: dropTargetId === task.id ? '4px' : '0',
                                                            transition: 'all 0.2s',
                                                        }}
                                                    >
                                                        <SuperTaskCard 
                                                            task={task} 
                                                            onRemoveTask={handleRemoveTaskFromSuper}
                                                        />
                                                    </div>
                                                );
                                            }
                                            // Show regular tasks with TaskCard (only if not a child task)
                                            if (!task.parent_task_id) {
                                                return (
                                                    <div
                                                        key={task.id}
                                                        onDragEnd={() => setDraggedTaskId(null)}
                                                        onDragOver={(e) => handleDragOver(e, task.id)}
                                                        onDragLeave={handleDragLeave}
                                                        onDrop={(e) => handleDrop(e, task.id)}
                                                        style={{
                                                            border: dropTargetId === task.id ? '2px dashed var(--accent-primary)' : 'none',
                                                            borderRadius: 'var(--radius-lg)',
                                                            padding: dropTargetId === task.id ? '4px' : '0',
                                                            transition: 'all 0.2s',
                                                        }}
                                                    >
                                                        <TaskCard 
                                                            task={task} 
                                                            onDragStart={(taskId) => setDraggedTaskId(taskId)}
                                                        />
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>
                                )
                            }
                        </div>

                        {/* Right Column: Sidebar */}
                        <div className="dashboard-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                            {/* Hide DailyChecklist on mobile - it will be shown as floating button */}
                            <div style={{ display: isMobile ? 'none' : 'block' }}>
                                <DailyChecklist />
                            </div>

                            {/* User Efficiency Widget (Moved to sidebar) */}
                            {userMetrics && selectedUser && (
                                <div className="card" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                                    <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-sm)' }}>
                                        Rendimiento
                                    </h3>
                                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                        <EfficiencyBar score={userMetrics.efficiencyScore} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        <span>Tasa Finalización: <strong>{userMetrics.completionRate}%</strong></span>
                                        <span>A tiempo: <strong>{userMetrics.onTimeRate}%</strong></span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            <TaskFormModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onSave={fetchTasks}
                users={users}
            />
            <SuperTaskModal
                isOpen={showSuperTaskModal}
                onClose={() => {
                    setShowSuperTaskModal(false);
                    setTasksToGroup([]);
                }}
                onConfirm={handleCreateSuperTask}
                taskCount={tasksToGroup.length}
                loading={isCreatingSuperTask}
            />
        </div >
    );
}
