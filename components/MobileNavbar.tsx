'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { Menu, X, Plus, UserPlus } from 'lucide-react';
import { useTaskModal } from './TaskModalContext';
import { useUserModal } from './UserModalContext';
import NotificationBell from './NotificationBell';

interface MobileNavbarProps {
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
}

export default function MobileNavbar({ isSidebarOpen, onToggleSidebar }: MobileNavbarProps) {
    const pathname = usePathname();
    const { user } = useAuth();
    const [isMobile, setIsMobile] = useState(false);
    const { openModal: openTaskModal } = useTaskModal();
    const { openModal: openUserModal } = useUserModal();
    
    // Show + button only on dashboard and calendar pages
    const showNewTaskButton = (pathname === '/dashboard' || pathname === '/calendar') && user?.role === 'admin';
    // Show user+ button only on users page
    const showNewUserButton = pathname === '/users' && user?.role === 'admin';

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (!user || !isMobile) return null;

    // Get page title based on pathname
    const getPageTitle = () => {
        switch (pathname) {
            case '/dashboard':
                return 'Vista General';
            case '/calendar':
                return 'Calendario';
            case '/chat':
                return 'Chat';
            case '/notes':
                return 'Notas';
            case '/users':
                return 'Usuarios';
            case '/settings':
                return 'Configuración';
            default:
                if (pathname.startsWith('/tasks/')) {
                    return 'Detalle de Tarea';
                }
                return 'MKT Planner';
        }
    };

    return (
        <nav
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '56px',
                background: 'var(--glass-bg-strong)',
                backdropFilter: 'blur(var(--blur-amount-strong))',
                WebkitBackdropFilter: 'blur(var(--blur-amount-strong))',
                borderBottom: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 var(--spacing-md)',
                zIndex: 1002,
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            }}
        >
            {/* Hamburger Button */}
            <button
                onClick={onToggleSidebar}
                className="btn btn-ghost"
                style={{
                    padding: '6px',
                    borderRadius: 'var(--radius-md)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                }}
                title={isSidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
                {isSidebarOpen ? (
                    <X size={20} strokeWidth={2} color="var(--text-primary)" />
                ) : (
                    <Menu size={20} strokeWidth={2} color="var(--text-primary)" />
                )}
            </button>

            {/* Page Title */}
            <h1
                style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    margin: 0,
                    color: 'var(--text-primary)',
                    flex: 1,
                    textAlign: 'center',
                    padding: '0 var(--spacing-md)',
                }}
            >
                {getPageTitle()}
            </h1>

            {/* Right side: Notifications + Action button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                <NotificationBell />
                
                {showNewTaskButton ? (
                    <button
                        onClick={openTaskModal}
                        className="btn btn-primary"
                        style={{
                            padding: '6px',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--accent-gradient)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            minWidth: '36px',
                            boxShadow: 'var(--shadow-md), 0 0 20px var(--accent-halo)',
                        }}
                        title="Nueva Tarea"
                    >
                        <Plus size={20} strokeWidth={2.5} color="white" />
                    </button>
                ) : showNewUserButton ? (
                    <button
                        onClick={openUserModal}
                        className="btn btn-primary"
                        style={{
                            padding: '6px',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--accent-gradient)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            minWidth: '36px',
                            boxShadow: 'var(--shadow-md), 0 0 20px var(--accent-halo)',
                        }}
                        title="Nuevo Usuario"
                    >
                        <UserPlus size={20} strokeWidth={2.5} color="white" />
                    </button>
                ) : null}
            </div>
        </nav>
    );
}

