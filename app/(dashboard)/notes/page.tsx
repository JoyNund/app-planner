'use client';

import { useState, useEffect } from 'react';
import NotesWidget from '@/components/NotesWidget';

export default function NotesPage() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <div className="notes-page-container" style={{ 
            maxWidth: '800px', 
            margin: '0 auto', 
            width: '100%',
            height: 'calc(100vh - 100px)',
            minHeight: '500px',
        }}>
            <div style={{ marginBottom: 'var(--spacing-xl)', display: isMobile ? 'none' : 'block' }}>
                <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>Mis Notas</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Espacio personal para tus apuntes, ideas y recordatorios rápidos.
                    Puedes compartir tus notas con otros usuarios del equipo.
                </p>
            </div>

            <div style={{ height: 'calc(100% - 100px)', minHeight: '400px' }}>
                <NotesWidget />
            </div>
        </div>
    );
}
