'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import UserAvatar from './UserAvatar';
import NotificationBell from './NotificationBell';
import { LayoutDashboard, Calendar, MessageSquare, StickyNote, Users, LogOut, Settings as SettingsIcon, Menu, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface SidebarProps {
    isMobileOpen?: boolean;
    onMobileToggle?: () => void;
}

export default function Sidebar({ isMobileOpen: externalMobileOpen, onMobileToggle }: SidebarProps = {}) {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [settings, setSettings] = useState<{ app_name: string; logo_url: string | null }>({ app_name: 'MKT Planner', logo_url: null });
    const [pendingTasksCount, setPendingTasksCount] = useState(0);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [internalMobileOpen, setInternalMobileOpen] = useState(false);
    
    // Use external state if provided, otherwise use internal state
    const isMobileOpen = externalMobileOpen !== undefined ? externalMobileOpen : internalMobileOpen;
    const setIsMobileOpen = onMobileToggle ? () => onMobileToggle() : setInternalMobileOpen;

    // Fetch settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    setSettings({
                        app_name: data.settings.app_name || 'MKT Planner',
                        logo_url: data.settings.logo_url
                    });
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            }
        };
        fetchSettings();
    }, []);

    // Fetch pending tasks count
    useEffect(() => {
        const fetchPendingCount = async () => {
            try {
                const res = await fetch('/api/stats/pending');
                if (res.ok) {
                    const data = await res.json();
                    setPendingTasksCount(data.count || 0);
                }
            } catch (error) {
                console.error('Error fetching pending tasks count:', error);
            }
        };
        
        if (user) {
            fetchPendingCount();
            // Refresh every 30 seconds
            const interval = setInterval(fetchPendingCount, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    // Detect mobile and handle responsive behavior
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) {
                // Only close if using internal state
                if (!onMobileToggle && internalMobileOpen) {
                    setInternalMobileOpen(false);
                }
                setIsCollapsed(true);
                document.documentElement.style.setProperty('--sidebar-width', '0px');
            } else {
                const savedState = localStorage.getItem('sidebarCollapsed');
                const collapsed = savedState === 'true';
                setIsCollapsed(collapsed);
                document.documentElement.style.setProperty('--sidebar-width', collapsed ? '0px' : '260px');
            }
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []); // Empty deps - only run on mount

    // Save sidebar state to localStorage and update CSS variable (desktop only)
    useEffect(() => {
        if (!isMobile) {
            localStorage.setItem('sidebarCollapsed', String(isCollapsed));
            document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '0px' : '260px');
        }
    }, [isCollapsed, isMobile]);
    
    // Close mobile sidebar when route changes
    const prevPathnameRef = useRef(pathname);
    useEffect(() => {
        if (isMobile && isMobileOpen && prevPathnameRef.current !== pathname) {
            prevPathnameRef.current = pathname;
            if (onMobileToggle) {
                onMobileToggle();
            } else {
                setInternalMobileOpen(false);
            }
        } else if (prevPathnameRef.current !== pathname) {
            prevPathnameRef.current = pathname;
        }
    }, [pathname]); // Only depend on pathname to avoid loops


    const navItems = [
        { href: '/dashboard', label: 'Vista General', icon: LayoutDashboard },
        { href: '/calendar', label: 'Calendario', icon: Calendar },
        { href: '/chat', label: 'Chat de Equipo', icon: MessageSquare },
        { href: '/notes', label: 'Mis Notas', icon: StickyNote },
    ];

    if (user?.role === 'admin') {
        navItems.push({ href: '/users', label: 'Usuarios', icon: Users });
        navItems.push({ href: '/settings', label: 'Configuración', icon: SettingsIcon });
    }

    const handleLogout = async () => {
        await logout();
        window.location.href = '/login';
    };

    if (!user) return null;

    const handleToggle = () => {
        if (isMobile) {
            if (onMobileToggle) {
                onMobileToggle();
            } else {
                setInternalMobileOpen(!internalMobileOpen);
            }
        } else {
            setIsCollapsed(!isCollapsed);
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isMobile && isMobileOpen && (
                <div
                    onClick={() => setIsMobileOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)',
                        zIndex: 999,
                        transition: 'opacity 0.3s ease',
                    }}
                />
            )}

            {/* Desktop Top Bar - Toggle Button + Notifications */}
            {!isMobile && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    left: isCollapsed ? '20px' : '280px',
                    zIndex: 1001,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    transition: 'all 0.3s ease',
                }}>
                    <button
                        onClick={handleToggle}
                        className="btn btn-ghost"
                        style={{
                            padding: 'var(--spacing-sm)',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--glass-bg)',
                            backdropFilter: 'blur(var(--blur-amount))',
                            WebkitBackdropFilter: 'blur(var(--blur-amount))',
                            border: '1px solid var(--glass-border)',
                            boxShadow: 'var(--shadow-md), 0 0 20px var(--accent-halo)',
                        }}
                        title={isCollapsed ? 'Mostrar menú' : 'Ocultar menú'}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = 'var(--shadow-lg), 0 0 30px var(--accent-halo)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = 'var(--shadow-md), 0 0 20px var(--accent-halo)';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        {isCollapsed ? <Menu size={20} strokeWidth={2} color="var(--text-primary)" /> : <X size={20} strokeWidth={2} color="var(--text-primary)" />}
                    </button>
                    
                    {/* Notification Bell */}
                    <div style={{
                        background: 'var(--glass-bg)',
                        backdropFilter: 'blur(var(--blur-amount))',
                        WebkitBackdropFilter: 'blur(var(--blur-amount))',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-md)',
                    }}>
                        <NotificationBell />
                    </div>
                </div>
            )}

            {/* Sidebar */}
            <aside
                style={{
                    width: isMobile ? '280px' : '260px',
                    height: '100vh',
                    background: 'var(--glass-bg-strong)',
                    backdropFilter: 'blur(var(--blur-amount-strong))',
                    WebkitBackdropFilter: 'blur(var(--blur-amount-strong))',
                    borderRight: '1px solid var(--glass-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'fixed',
                    left: isMobile 
                        ? (isMobileOpen ? '0' : '-280px')
                        : (isCollapsed ? '-260px' : '0'),
                    top: 0,
                    transition: 'left 0.3s ease',
                    zIndex: isMobile && isMobileOpen ? 1003 : 1000, // Higher than navbar (1002) when open on mobile
                    overflow: 'hidden',
                    boxShadow: '2px 0 20px rgba(0, 0, 0, 0.3)',
                }}
            >
                {/* Mobile Close Button - Now handled by navbar */}

                {/* Logo */}
                <div
                    style={{
                        padding: isMobile ? 'var(--spacing-lg)' : 'var(--spacing-xl)',
                        borderBottom: '1px solid var(--glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-md)',
                        position: 'relative',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '2px',
                            background: 'var(--accent-gradient)',
                            opacity: 0.3,
                        }}
                    />
                    {settings.logo_url && (
                        <img
                            src={settings.logo_url}
                            alt="Logo"
                            style={{
                                height: '40px',
                                width: 'auto',
                                objectFit: 'contain'
                            }}
                        />
                    )}
                    <h2
                        style={{
                            background: 'var(--accent-gradient)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontSize: isMobile ? '1.25rem' : '1.5rem',
                            fontWeight: 800,
                            flex: 1,
                        }}
                    >
                        {settings.app_name}
                    </h2>
                </div>

                {/* User Info */}
                <div
                    style={{
                        padding: 'var(--spacing-lg)',
                        borderBottom: '1px solid var(--glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-md)',
                    }}
                >
                    <UserAvatar name={user.full_name} color={user.avatar_color} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                            style={{
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {user.full_name}
                        </div>
                        <div
                            style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                textTransform: 'capitalize',
                            }}
                        >
                            {user.role}
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, padding: isMobile ? 'var(--spacing-sm)' : 'var(--spacing-md)', overflowY: 'auto' }}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const isDashboard = item.href === '/dashboard';
                        const showBadge = isDashboard && pendingTasksCount > 0;
                        
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => {
                                    if (isMobile) {
                                        if (onMobileToggle) {
                                            onMobileToggle();
                                        } else {
                                            setInternalMobileOpen(false);
                                        }
                                    }
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-md)',
                                    padding: isMobile ? 'var(--spacing-sm) var(--spacing-md)' : 'var(--spacing-md)',
                                    marginBottom: 'var(--spacing-xs)',
                                    borderRadius: 'var(--radius-md)',
                                    textDecoration: 'none',
                                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    background: isActive ? 'var(--glass-bg-medium)' : 'transparent',
                                    backdropFilter: isActive ? 'blur(var(--blur-amount))' : 'none',
                                    WebkitBackdropFilter: isActive ? 'blur(var(--blur-amount))' : 'none',
                                    border: isActive ? '1px solid var(--glass-border)' : '1px solid transparent',
                                    fontWeight: isActive ? 600 : 400,
                                    transition: 'all var(--transition-base)',
                                    position: 'relative',
                                    fontSize: isMobile ? '0.875rem' : '1rem',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive && !isMobile) {
                                        e.currentTarget.style.background = 'var(--glass-bg-medium)';
                                        e.currentTarget.style.backdropFilter = 'blur(var(--blur-amount))';
                                        (e.currentTarget.style as any).WebkitBackdropFilter = 'blur(var(--blur-amount))';
                                        e.currentTarget.style.border = '1px solid var(--glass-border)';
                                        e.currentTarget.style.color = 'var(--text-primary)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive && !isMobile) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                    }
                                }}
                            >
                                <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
                                    <item.icon size={isMobile ? 18 : 20} strokeWidth={2} color="var(--text-primary)" />
                                    {showBadge && (
                                        <span
                                            style={{
                                                position: 'absolute',
                                                top: '-8px',
                                                right: '-8px',
                                                backgroundColor: 'var(--priority-urgent)',
                                                color: 'white',
                                                borderRadius: '50%',
                                                width: '18px',
                                                height: '18px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                border: '2px solid var(--bg-secondary)',
                                                minWidth: '18px',
                                            }}
                                        >
                                            {pendingTasksCount > 99 ? '99+' : pendingTasksCount}
                                        </span>
                                    )}
                                </div>
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div style={{ padding: isMobile ? 'var(--spacing-md)' : 'var(--spacing-lg)', borderTop: '1px solid var(--glass-border)' }}>
                    <button
                        onClick={handleLogout}
                        className="btn btn-ghost"
                        style={{ 
                            width: '100%', 
                            justifyContent: 'flex-start',
                            fontSize: isMobile ? '0.875rem' : '1rem',
                            padding: isMobile ? 'var(--spacing-sm)' : 'var(--spacing-md)',
                        }}
                    >
                        <LogOut size={isMobile ? 18 : 20} strokeWidth={2} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
