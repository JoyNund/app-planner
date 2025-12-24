'use client';

import { useState, useEffect } from 'react';
import { usePathname, useParams } from 'next/navigation';
import { useAuth } from './AuthProvider';
import TaskAIAssistant from './TaskAIAssistant';
import { Sparkles, X } from 'lucide-react';

interface TaskAIChatProps {
    isMobile?: boolean;
    isOpen: boolean;
    otherChatOpen?: boolean; // Whether GlobalChat is open
    onToggle: () => void;
    onClose?: () => void;
}

export default function TaskAIChat({ isMobile = false, isOpen, otherChatOpen = false, onToggle, onClose }: TaskAIChatProps) {
    const pathname = usePathname();
    const params = useParams();
    const { user } = useAuth();
    const [taskId, setTaskId] = useState<number | null>(null);
    const [taskTitle, setTaskTitle] = useState<string>('');
    const [taskDescription, setTaskDescription] = useState<string | null>(null);

    // Extract task ID from pathname if we're on a task detail page
    useEffect(() => {
        if (pathname?.startsWith('/tasks/')) {
            const taskIdFromPath = pathname.split('/tasks/')[1];
            if (taskIdFromPath && !isNaN(Number(taskIdFromPath))) {
                setTaskId(Number(taskIdFromPath));
                // Fetch task details
                fetch(`/api/tasks/${taskIdFromPath}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.task) {
                            setTaskTitle(data.task.title);
                            setTaskDescription(data.task.description);
                        }
                    })
                    .catch(err => console.error('Error fetching task:', err));
            }
        } else {
            setTaskId(null);
        }
    }, [pathname]);

    // Don't show if no user or if we're on chat page
    if (!user || pathname === '/chat') return null;

    // Don't show if not on a task detail page
    if (!taskId) return null;

    // Show button logic:
    // - Always show in desktop
    // - In mobile: show if this chat is open OR if GlobalChat is closed (both buttons visible when both closed)
    // - When one opens, hide the other button (alternation)
    const shouldShowButton = isMobile ? (isOpen || !otherChatOpen) : true;

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            onToggle();
        }
    };

    // Calculate right and bottom positions based on state
    const getRightPosition = () => {
        if (isMobile) return '20px';
        
        // Desktop positioning logic
        const buttonWidth = 60;
        const gap = 12;
        
        if (isOpen && otherChatOpen) {
            // Both chats open: TaskAIChat on the left, GlobalChat on the right
            const chatWidth = 380;
            return `calc(20px + ${chatWidth}px + ${gap}px)`;
        }
        
        if (isOpen && !otherChatOpen) {
            // Only TaskAIChat open: use GlobalChat's position
            return '20px';
        }
        
        if (!isOpen && otherChatOpen) {
            // Only GlobalChat open: position button to the left of GlobalChat window
            const chatWidth = 400;
            return `calc(20px + ${chatWidth}px + ${gap}px)`;
        }
        
        // Both closed: TaskAIChat button to the left of GlobalChat button
        return `calc(20px + ${buttonWidth}px + ${gap}px)`;
    };

    const getBottomPosition = () => {
        if (isMobile) {
            // Mobile: always at bottom, but adjust when both are closed
            if (isOpen) {
                return '20px';
            }
            // When closed and GlobalChat is also closed, position above
            if (!otherChatOpen) {
                const buttonHeight = 48;
                const gap = 8;
                return `calc(20px + ${buttonHeight}px + ${gap}px)`;
            }
            return '20px';
        }
        return '20px';
    };

    return (
        <div
            className="task-ai-chat-container"
            style={{
                position: 'fixed',
                bottom: getBottomPosition(),
                right: getRightPosition(),
                width: isOpen ? (isMobile ? 'calc(100vw - 40px)' : otherChatOpen ? 'min(380px, calc(50vw - 80px))' : 'min(400px, calc(50vw - 60px))') : 'auto',
                height: isOpen ? (isMobile ? 'calc(100vh - 100px)' : 'min(600px, calc(100vh - 100px))') : 'auto',
                zIndex: 1001, // Above GlobalChat
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: isMobile ? '8px' : '10px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
        >
            {/* Chat Window */}
            <div
                className="task-ai-chat-widget"
                style={{
                    width: isMobile ? '100%' : otherChatOpen ? 'min(380px, calc(50vw - 100px))' : 'min(400px, calc(50vw - 60px))',
                    height: isMobile ? '100%' : 'min(550px, calc(100vh - 100px))',
                    background: 'var(--glass-bg-medium)',
                    backdropFilter: 'blur(var(--blur-amount-medium))',
                    WebkitBackdropFilter: 'blur(var(--blur-amount-medium))',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: isOpen ? 'var(--shadow-xl), 0 0 40px rgba(139, 92, 246, 0.3)' : 'var(--shadow-lg), 0 0 20px rgba(139, 92, 246, 0.2)',
                    border: '1px solid var(--glass-border-medium)',
                    display: isOpen ? 'flex' : 'none',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transformOrigin: 'bottom right',
                    opacity: isOpen ? 1 : 0,
                    pointerEvents: isOpen ? 'auto' : 'none',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: 'var(--spacing-md)',
                        borderBottom: '1px solid var(--glass-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'var(--glass-bg)',
                        backdropFilter: 'blur(var(--blur-amount))',
                        WebkitBackdropFilter: 'blur(var(--blur-amount))',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={18} strokeWidth={2} color="var(--accent-primary)" />
                        <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--text-primary)' }}>
                            Asistente de IA
                        </h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="btn btn-ghost btn-sm"
                        title="Cerrar chat"
                        style={{ padding: '4px 8px' }}
                    >
                        <X size={16} strokeWidth={2} color="var(--text-secondary)" />
                    </button>
                </div>

                {/* Chat Content */}
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <TaskAIAssistant
                        taskTitle={taskTitle}
                        taskDescription={taskDescription}
                        taskId={taskId || undefined}
                    />
                </div>
            </div>

            {/* Toggle Button */}
            {shouldShowButton && (
                <button
                    onClick={isOpen ? handleClose : onToggle}
                    title={isOpen ? 'Cerrar chat de IA' : 'Abrir chat de IA'}
                    style={{
                        width: isMobile ? '48px' : '60px',
                        height: isMobile ? '48px' : '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9), rgba(168, 85, 247, 0.9))',
                        color: 'white',
                        border: '1px solid var(--glass-border-medium)',
                        boxShadow: 'var(--shadow-lg), 0 0 30px rgba(139, 92, 246, 0.4)',
                        backdropFilter: 'blur(var(--blur-amount))',
                        WebkitBackdropFilter: 'blur(var(--blur-amount))',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        transition: 'all 0.3s ease',
                        transform: isOpen ? 'rotate(90deg)' : 'none',
                    }}
                onMouseEnter={(e) => {
                    if (!isMobile) {
                        e.currentTarget.style.transform = isOpen ? 'rotate(90deg) scale(1.1)' : 'scale(1.1)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-xl), 0 0 40px rgba(139, 92, 246, 0.5)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isMobile) {
                        e.currentTarget.style.transform = isOpen ? 'rotate(90deg)' : 'scale(1)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-lg), 0 0 30px rgba(139, 92, 246, 0.4)';
                    }
                }}
            >
                    {isOpen ? <X size={isMobile ? 20 : 24} strokeWidth={2} color="white" /> : <Sparkles size={isMobile ? 20 : 24} strokeWidth={2} color="white" />}
                </button>
            )}
        </div>
    );
}

