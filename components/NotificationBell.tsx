'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface Notification {
    id: number;
    user_id: number;
    type: string;
    title: string;
    message: string;
    link: string | null;
    is_read: number;
    created_at: string;
}

// Notification type icons and colors
const notificationConfig: Record<string, { icon: string; color: string }> = {
    task_created: { icon: '📋', color: 'var(--accent-primary)' },
    task_completed: { icon: '✅', color: 'var(--status-completed)' },
    task_assigned: { icon: '👤', color: 'var(--priority-high)' },
    task_pending: { icon: '⏰', color: 'var(--priority-medium)' },
    chat_message: { icon: '💬', color: 'var(--accent-secondary)' },
    task_activity: { icon: '📝', color: 'var(--priority-low)' },
    note_created: { icon: '📒', color: 'var(--accent-primary)' },
    note_shared: { icon: '🔗', color: 'var(--priority-high)' },
};

export default function NotificationBell() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const prevUnreadRef = useRef(0);

    // Play notification sound using Web Audio API
    const playSound = useCallback(() => {
        try {
            // Create audio context on demand (required by browsers)
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            
            const ctx = audioContextRef.current;
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            // Pleasant notification tone
            oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
            oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1); // C#6
            
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.3);
        } catch (error) {
            // Ignore audio errors
        }
    }, []);

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                
                // Play sound if new unread notifications
                if (data.unreadCount > prevUnreadRef.current && prevUnreadRef.current > 0) {
                    playSound();
                    
                    // Show browser notification
                    if (Notification.permission === 'granted' && data.notifications.length > 0) {
                        const latestUnread = data.notifications.find((n: Notification) => !n.is_read);
                        if (latestUnread) {
                            new Notification(latestUnread.title, {
                                body: latestUnread.message,
                                icon: '/favicon.ico',
                                tag: 'mkt-planner-notification',
                            });
                        }
                    }
                }
                
                prevUnreadRef.current = data.unreadCount;
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }, [playSound]);

    // Request notification permission
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Detect sidebar collapsed state by checking CSS variable
    useEffect(() => {
        const checkSidebarState = () => {
            const sidebarWidth = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim();
            // Sidebar is collapsed if width is 0px
            const collapsed = sidebarWidth === '0px';
            setIsSidebarCollapsed(collapsed);
        };
        
        checkSidebarState();
        
        // Check when dropdown opens
        if (isOpen) {
            checkSidebarState();
        }
        
        // Monitor CSS variable changes using MutationObserver
        const observer = new MutationObserver(() => {
            checkSidebarState();
        });
        
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['style'],
        });
        
        // Also check periodically as fallback
        const interval = setInterval(checkSidebarState, 300);
        
        return () => {
            observer.disconnect();
            clearInterval(interval);
        };
    }, [isOpen]);

    // Poll for notifications
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000); // Every 10 seconds
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Mark notification as read
    const markAsRead = async (id: number) => {
        try {
            await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            
            setNotifications(prev => 
                prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        setLoading(true);
        try {
            await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAll: true }),
            });
            
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle notification click
    const handleNotificationClick = (notification: Notification) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }
        
        if (notification.link) {
            setIsOpen(false);
            router.push(notification.link);
        }
    };

    // Format time ago
    const timeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Ahora';
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}d`;
        return formatDateTime(dateStr);
    };

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'relative',
                    background: isOpen ? 'var(--bg-tertiary)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.currentTarget.style.background = isOpen ? 'var(--bg-tertiary)' : 'transparent'}
            >
                <Bell size={20} />
                
                {/* Unread badge */}
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        background: 'var(--priority-urgent)',
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        minWidth: '16px',
                        height: '16px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px',
                    }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    // When sidebar is collapsed, show dropdown to the right (left: 0 aligns to button's left edge)
                    // When sidebar is expanded, show dropdown aligned to right (right: 0)
                    ...(isSidebarCollapsed 
                        ? { left: 0 }  // Align to left edge of button, dropdown extends to the right
                        : { right: 0 } // Align to right edge of button
                    ),
                    marginTop: '8px',
                    // Adjust width when sidebar is collapsed to ensure it doesn't overflow
                    width: isSidebarCollapsed 
                        ? 'min(360px, calc(100vw - 40px))'  // Account for button position (20px) + margin
                        : 'min(360px, calc(100vw - 32px))',
                    maxWidth: '360px',
                    maxHeight: '480px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    overflow: 'hidden',
                    zIndex: 1000,
                }}>
                    {/* Header */}
                    <div style={{
                        padding: 'var(--spacing-md)',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                            Notificaciones
                        </span>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                disabled={loading}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--accent-primary)',
                                    fontSize: '0.8125rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                }}
                            >
                                <CheckCheck size={14} />
                                Marcar todas
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div style={{
                        maxHeight: '400px',
                        overflowY: 'auto',
                    }}>
                        {notifications.length === 0 ? (
                            <div style={{
                                padding: 'var(--spacing-xl)',
                                textAlign: 'center',
                                color: 'var(--text-muted)',
                            }}>
                                <Bell size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                                <p style={{ margin: 0, fontSize: '0.875rem' }}>
                                    No hay notificaciones
                                </p>
                            </div>
                        ) : (
                            notifications.map((notification) => {
                                const config = notificationConfig[notification.type] || { icon: '📌', color: 'var(--text-muted)' };
                                
                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        style={{
                                            padding: 'var(--spacing-sm) var(--spacing-md)',
                                            borderBottom: '1px solid var(--border-color)',
                                            cursor: notification.link ? 'pointer' : 'default',
                                            background: notification.is_read ? 'transparent' : 'rgba(6, 182, 212, 0.05)',
                                            display: 'flex',
                                            gap: 'var(--spacing-sm)',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = notification.is_read ? 'transparent' : 'rgba(6, 182, 212, 0.05)'}
                                    >
                                        {/* Icon */}
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            background: `${config.color}20`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1rem',
                                            flexShrink: 0,
                                        }}>
                                            {config.icon}
                                        </div>

                                        {/* Content */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontWeight: notification.is_read ? 400 : 600,
                                                fontSize: '0.8125rem',
                                                marginBottom: '2px',
                                                color: 'var(--text-primary)',
                                            }}>
                                                {notification.title}
                                            </div>
                                            <div style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--text-secondary)',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {notification.message}
                                            </div>
                                            <div style={{
                                                fontSize: '0.7rem',
                                                color: 'var(--text-muted)',
                                                marginTop: '4px',
                                            }}>
                                                {timeAgo(notification.created_at)}
                                            </div>
                                        </div>

                                        {/* Unread dot */}
                                        {!notification.is_read && (
                                            <div style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                background: 'var(--accent-primary)',
                                                flexShrink: 0,
                                                marginTop: '4px',
                                            }} />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
