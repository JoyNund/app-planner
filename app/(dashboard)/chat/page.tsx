'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import ChatBox from '@/components/ChatBox';

export default function ChatPage() {
    const { user } = useAuth();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (!user) return null;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', height: 'calc(100vh - 4rem)' }}>
            <div style={{ marginBottom: 'var(--spacing-xl)', display: isMobile ? 'none' : 'block' }}>
                <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>Chat de Equipo</h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Comunícate con tu equipo en tiempo real
                </p>
            </div>

            <div style={{ height: 'calc(100% - 100px)' }}>
                <ChatBox currentUserId={user.id} currentUserRole={user.role} />
            </div>
        </div>
    );
}
