'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Sidebar from '@/components/Sidebar';
import GlobalChat from '@/components/GlobalChat';
import TaskAIChat from '@/components/TaskAIChat';
import DailyChecklistFloating from '@/components/DailyChecklistFloating';
import MobileNavbar from '@/components/MobileNavbar';
import { TaskModalProvider } from '@/components/TaskModalContext';
import { UserModalProvider } from '@/components/UserModalContext';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [isMobile, setIsMobile] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAIChatOpen, setIsAIChatOpen] = useState(false);
    const [isGlobalChatOpen, setIsGlobalChatOpen] = useState(false);

    const handleSidebarToggle = useCallback(() => {
        setIsSidebarOpen(prev => !prev);
    }, []);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile && isSidebarOpen) {
                setIsSidebarOpen(false);
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []); // Only run once on mount

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                color: 'var(--text-secondary)'
            }}>
                Cargando...
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <TaskModalProvider>
            <UserModalProvider>
                <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
                    <Sidebar isMobileOpen={isSidebarOpen} onMobileToggle={handleSidebarToggle} />
                    <MobileNavbar isSidebarOpen={isSidebarOpen} onToggleSidebar={handleSidebarToggle} />
                    <main
                        style={{
                            flex: 1,
                            marginLeft: isMobile ? '0' : 'var(--sidebar-width, 260px)',
                            padding: isMobile ? 'var(--spacing-lg)' : 'var(--spacing-2xl)',
                            paddingTop: isMobile ? 'calc(56px + var(--spacing-lg))' : 'var(--spacing-2xl)',
                            background: 'var(--bg-primary)',
                            backgroundImage: 'var(--accent-gradient-subtle)',
                            transition: 'margin-left 0.3s ease, padding 0.3s ease',
                            position: 'relative',
                            zIndex: 1,
                            width: '100%',
                            minHeight: '100vh',
                        }}
                        className="main-content"
                    >
                        {children}
                    </main>
                    <GlobalChat 
                        isMobile={isMobile}
                        isOpen={isMobile ? (isGlobalChatOpen && !isAIChatOpen) : isGlobalChatOpen}
                        otherChatOpen={isMobile ? isAIChatOpen : isAIChatOpen}
                        onToggle={() => {
                            if (isMobile) {
                                setIsGlobalChatOpen(true);
                                setIsAIChatOpen(false);
                            } else {
                                // Desktop: allow both to be open simultaneously
                                setIsGlobalChatOpen(prev => !prev);
                            }
                        }}
                        onClose={() => setIsGlobalChatOpen(false)}
                    />
                    <TaskAIChat
                        isMobile={isMobile}
                        isOpen={isMobile ? (isAIChatOpen && !isGlobalChatOpen) : isAIChatOpen}
                        otherChatOpen={isMobile ? isGlobalChatOpen : isGlobalChatOpen}
                        onToggle={() => {
                            if (isMobile) {
                                setIsAIChatOpen(true);
                                setIsGlobalChatOpen(false);
                            } else {
                                // Desktop: allow both to be open simultaneously
                                setIsAIChatOpen(prev => !prev);
                            }
                        }}
                        onClose={() => setIsAIChatOpen(false)}
                    />
                    <DailyChecklistFloating />
                </div>
            </UserModalProvider>
        </TaskModalProvider>
    );
}
