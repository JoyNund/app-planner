'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import DailyChecklist from './DailyChecklist';
import { ClipboardList, X, ChevronLeft } from 'lucide-react';

export default function DailyChecklistFloating() {
    const pathname = usePathname();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    // Detect mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Close panel when clicking outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                handleClose();
            }
        };

        // Use setTimeout to avoid immediate trigger
        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Only show on dashboard in mobile (after all hooks)
    if (!user || pathname !== '/dashboard' || !isMobile) return null;

    const panelWidth = 320;
    const buttonWidth = 40;

    const handleOpen = () => {
        setIsOpen(true);
        setDragOffset(0);
    };

    const handleClose = () => {
        setIsOpen(false);
        setDragOffset(0);
    };

    // Touch handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        const touchX = e.touches[0].clientX;
        
        if (!isOpen) {
            // Only start drag if starting from right edge
            if (touchX > window.innerWidth - 60) {
                setIsDragging(true);
                setDragStartX(touchX);
            }
        } else {
            // When open, can drag from anywhere on panel
            setIsDragging(true);
            setDragStartX(touchX);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        
        e.preventDefault(); // Prevent scrolling
        const currentX = e.touches[0].clientX;
        const deltaX = currentX - dragStartX;

        if (isOpen) {
            // Dragging right closes (positive deltaX)
            if (deltaX > 0) {
                setDragOffset(Math.min(deltaX, panelWidth));
            }
        } else {
            // Dragging left opens (negative deltaX)
            if (deltaX < 0) {
                setDragOffset(Math.max(deltaX, -panelWidth));
            }
        }
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        
        setIsDragging(false);
        const threshold = panelWidth * 0.3;

        if (isOpen) {
            // If dragged right more than threshold, close
            if (dragOffset > threshold) {
                handleClose();
            } else {
                // Snap back
                setDragOffset(0);
            }
        } else {
            // If dragged left more than threshold, open
            if (Math.abs(dragOffset) > threshold) {
                handleOpen();
            } else {
                // Snap back
                setDragOffset(0);
            }
        }
    };

    // Mouse handlers (for testing)
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isMobile) return;
        const mouseX = e.clientX;
        
        if (!isOpen) {
            if (mouseX > window.innerWidth - 60) {
                setIsDragging(true);
                setDragStartX(mouseX);
            }
        } else {
            setIsDragging(true);
            setDragStartX(mouseX);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !isMobile) return;
        
        const currentX = e.clientX;
        const deltaX = currentX - dragStartX;

        if (isOpen) {
            if (deltaX > 0) {
                setDragOffset(Math.min(deltaX, panelWidth));
            }
        } else {
            if (deltaX < 0) {
                setDragOffset(Math.max(deltaX, -panelWidth));
            }
        }
    };

    const handleMouseUp = () => {
        if (!isMobile) return;
        handleTouchEnd();
    };

    // Calculate panel position
    // When closed: panel is off-screen to the right (translateX = panelWidth)
    // When open: panel is fully visible (translateX = 0)
    // When dragging: adjust based on dragOffset
    const panelTranslateX = isOpen 
        ? dragOffset  // When open, dragging right moves it right (positive)
        : panelWidth + dragOffset; // When closed, dragging left moves it left (negative dragOffset)

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    onClick={handleClose}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.3)',
                        zIndex: 998,
                        transition: 'opacity 0.3s ease',
                    }}
                />
            )}

            <div
                ref={containerRef}
                className="daily-checklist-floating-container"
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    width: isOpen ? `${panelWidth}px` : `${buttonWidth}px`,
                    height: '100vh',
                    zIndex: 999,
                    pointerEvents: isOpen ? 'auto' : 'none',
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Panel */}
                <div
                    ref={panelRef}
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: `${panelWidth}px`,
                        height: '100%',
                        background: 'var(--glass-bg-medium)',
                        backdropFilter: 'blur(var(--blur-amount-medium))',
                        WebkitBackdropFilter: 'blur(var(--blur-amount-medium))',
                        boxShadow: isOpen ? 'var(--shadow-xl), 0 0 40px var(--accent-halo)' : 'none',
                        borderLeft: '1px solid var(--glass-border-medium)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        transform: `translateX(${panelTranslateX}px)`,
                        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
                            flexShrink: 0,
                        }}
                    >
                        <h3 style={{ fontSize: '0.9375rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ClipboardList size={16} strokeWidth={2} />
                            Checklist
                        </h3>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleClose();
                            }}
                            style={{ 
                                padding: '4px', 
                                minWidth: 'auto', 
                                width: '28px', 
                                height: '28px',
                                cursor: 'pointer',
                                background: 'transparent',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <X size={14} strokeWidth={2} color="var(--text-secondary)" />
                        </button>
                    </div>

                    {/* Checklist Content */}
                    <div style={{ flex: 1, overflow: 'hidden', padding: 'var(--spacing-md)' }}>
                        <DailyChecklist />
                    </div>
                </div>

            {/* Small Button on Edge */}
            <div
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isOpen) {
                        handleClose();
                    } else {
                        handleOpen();
                    }
                }}
                style={{
                    position: 'absolute',
                    top: '50%',
                    right: isOpen ? `${panelTranslateX}px` : '0',
                    transform: 'translateY(-50%)',
                    width: `${buttonWidth}px`,
                    height: '80px',
                    background: 'var(--glass-bg-strong)',
                    backdropFilter: 'blur(var(--blur-amount))',
                    WebkitBackdropFilter: 'blur(var(--blur-amount))',
                    borderTopLeftRadius: 'var(--radius-md)',
                    borderBottomLeftRadius: 'var(--radius-md)',
                    borderLeft: '1px solid var(--glass-border)',
                    borderTop: '1px solid var(--glass-border)',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-md)',
                    transition: isDragging ? 'none' : 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 1000,
                    pointerEvents: 'auto', // Button always clickable
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--glass-bg-medium)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg), 0 0 20px var(--accent-halo)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--glass-bg-strong)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
            >
                <ClipboardList 
                    size={20} 
                    strokeWidth={2} 
                    color="var(--accent-primary)"
                />
            </div>

            </div>
        </>
    );
}
