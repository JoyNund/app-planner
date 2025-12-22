'use client';

import { useEffect } from 'react';

export default function SettingsProvider() {
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    const settings = data.settings;

                    // Apply App Name
                    if (settings.app_name) {
                        document.title = settings.app_name;
                    }

                    // Apply Colors
                    if (settings.theme_colors) {
                        try {
                            const colors = JSON.parse(settings.theme_colors);
                            const root = document.documentElement;

                            const primary = colors.primary || '#8b5cf6';
                            const secondary = colors.secondary || '#ec4899';

                            root.style.setProperty('--accent-primary', primary);
                            root.style.setProperty('--accent-secondary', secondary);
                            // Update gradient with both colors
                            root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`);
                            // Subtle gradient for backgrounds
                            root.style.setProperty('--accent-gradient-subtle', `linear-gradient(135deg, ${primary}15 0%, ${secondary}15 100%)`);
                            // Halo effect
                            root.style.setProperty('--accent-halo', `radial-gradient(circle at center, ${primary}20 0%, transparent 70%)`);
                        } catch (e) {
                            console.error('Error parsing theme colors', e);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching settings', error);
            }
        };

        fetchSettings();
    }, []);

    return null;
}
