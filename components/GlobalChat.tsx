'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import ChatBox from './ChatBox';
import { MessageSquare, X } from 'lucide-react';

interface GlobalChatProps {
    isMobile?: boolean;
    isOpen?: boolean;
    otherChatOpen?: boolean; // Whether TaskAIChat is open
    onToggle?: () => void;
    onClose?: () => void;
}

export default function GlobalChat({ isMobile = false, isOpen: externalIsOpen, otherChatOpen = false, onToggle: externalOnToggle, onClose: externalOnClose }: GlobalChatProps = {}) {
    const pathname = usePathname();
    const { user } = useAuth();
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false); // Placeholder for unread logic

    // Use external state if provided, otherwise use internal state
    const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
    const handleToggle = externalOnToggle || (() => setInternalIsOpen(prev => !prev));
    const handleClose = externalOnClose || (() => setInternalIsOpen(false));

    if (!user || pathname === '/chat') return null;

    // Show button logic:
    // - Always show in desktop
    // - In mobile: show if this chat is open OR if the other chat is closed (both buttons visible when both closed)
    // - When one opens, hide the other button (alternation)
    const shouldShowButton = isMobile ? (isOpen || !otherChatOpen) : true;

    // Calculate right and bottom positions based on state
    const getRightPosition = () => {
        if (isMobile) return '20px';
        
        // Desktop: always at rightmost position (20px)
        // When both are open, GlobalChat stays at right, TaskAIChat moves left
        return '20px';
    };

    const getBottomPosition = () => {
        if (isMobile) {
            // Mobile: always at bottom (20px)
            return '20px';
        }
        return '20px';
    };

    return (
        <div
            className="global-chat-container"
            style={{
                position: 'fixed',
                bottom: getBottomPosition(),
                right: getRightPosition(),
                width: isOpen ? (isMobile ? 'calc(100vw - 40px)' : otherChatOpen ? 'min(380px, calc(50vw - 100px))' : 'min(400px, calc(50vw - 60px))') : 'auto',
                height: isOpen ? (isMobile ? 'calc(100vh - 100px)' : 'min(600px, calc(100vh - 100px))') : 'auto',
                zIndex: isOpen ? 1000 : 999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: isMobile ? '8px' : '10px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
        >
            {/* Chat Window */}
            <div
                className="global-chat-widget"
                style={{
                    width: isMobile ? '100%' : otherChatOpen ? 'min(380px, calc(50vw - 100px))' : 'min(400px, calc(50vw - 60px))',
                    height: 'min(550px, calc(100vh - 100px))',
                    background: 'var(--glass-bg-medium)',
                    backdropFilter: 'blur(var(--blur-amount-medium))',
                    WebkitBackdropFilter: 'blur(var(--blur-amount-medium))',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: isOpen ? 'var(--shadow-xl), 0 0 40px var(--accent-halo)' : 'var(--shadow-lg), 0 0 20px var(--accent-halo)',
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
                    <h3 style={{ fontSize: '1rem', margin: 0 }}><MessageSquare size={18} strokeWidth={2} style={{ display: 'inline', marginRight: '8px' }} />Chat de Equipo</h3>
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
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <ChatBox currentUserId={user.id} />
                </div>
            </div>

            {/* Toggle Button */}
            {shouldShowButton && (
                <button
                    onClick={isOpen ? handleClose : handleToggle}
                    title={isOpen ? 'Cerrar chat de equipo' : 'Abrir chat de equipo'}
                    style={{
                        width: isMobile ? '48px' : '60px',
                        height: isMobile ? '48px' : '60px',
                        borderRadius: '50%',
                        background: 'var(--accent-gradient)',
                        color: 'white',
                        border: '1px solid var(--glass-border-medium)',
                        boxShadow: 'var(--shadow-lg), 0 0 30px var(--accent-halo)',
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
                        e.currentTarget.style.boxShadow = 'var(--shadow-xl), 0 0 40px var(--accent-halo)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isMobile) {
                        e.currentTarget.style.transform = isOpen ? 'rotate(90deg)' : 'scale(1)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-lg), 0 0 30px var(--accent-halo)';
                    }
                }}
            >
                    {isOpen ? <X size={isMobile ? 20 : 24} strokeWidth={2} color="white" /> : <MessageSquare size={isMobile ? 20 : 24} strokeWidth={2} color="white" />}
                </button>
            )}
        </div>
    );
}
