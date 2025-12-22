'use client';

import { useEffect, useRef } from 'react';

interface NotificationOptions {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    requireInteraction?: boolean;
    sound?: boolean;
}

export function useNotifications() {
    const permissionRef = useRef<NotificationPermission | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const originalTitleRef = useRef<string>('');
    const notificationCountRef = useRef<number>(0);

    useEffect(() => {
        // Only run on client side
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return;
        }

        // Store original title
        originalTitleRef.current = document.title;

        // Request permission on mount
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                permissionRef.current = permission;
            });
        } else if ('Notification' in window) {
            permissionRef.current = Notification.permission;
        }

        // Create audio context for sound notifications
        const createNotificationSound = () => {
            try {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                if (!AudioContextClass) {
                    return null;
                }
                const audioContext = new AudioContextClass();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = 800;
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);

                return audioContext;
            } catch (e) {
                console.log('Could not create audio context:', e);
                return null;
            }
        };

        // Store function to create sound
        (audioRef as any).current = createNotificationSound;

        // Listen for visibility changes to update title badge
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                document.title = originalTitleRef.current;
                notificationCountRef.current = 0;
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const showNotification = (options: NotificationOptions) => {
        // Only run on client side
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return;
        }

        // Play sound notification if enabled (default: true)
        if (options.sound !== false && (audioRef as any).current) {
            try {
                (audioRef as any).current();
            } catch (err) {
                // Ignore errors (user might have blocked autoplay)
                console.log('Could not play notification sound:', err);
            }
        }

        // Update page title with notification badge
        if (document.visibilityState === 'hidden') {
            notificationCountRef.current++;
            document.title = `(${notificationCountRef.current}) ${options.title} - ${originalTitleRef.current}`;
        }

        // Show browser notification (only when tab is hidden)
        if (!('Notification' in window)) {
            return;
        }

        if (permissionRef.current !== 'granted') {
            if (Notification.permission === 'default') {
                Notification.requestPermission().then(permission => {
                    permissionRef.current = permission;
                    if (permission === 'granted' && document.visibilityState === 'hidden') {
                        new Notification(options.title, {
                            body: options.body,
                            icon: options.icon || '/favicon.ico',
                            tag: options.tag,
                            requireInteraction: options.requireInteraction || false,
                        });
                    }
                });
            }
            return;
        }

        if (permissionRef.current === 'granted' && document.visibilityState === 'hidden') {
            new Notification(options.title, {
                body: options.body,
                icon: options.icon || '/favicon.ico',
                tag: options.tag,
                requireInteraction: options.requireInteraction || false,
            });
        }
    };

    return { showNotification };
}

