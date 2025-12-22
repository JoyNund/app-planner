'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Save, Loader2 } from 'lucide-react';

export default function SettingsPage() {
    const { user } = useAuth();
    const [settings, setSettings] = useState({
        app_name: 'MKT Planner',
        logo_url: '',
        theme_colors: { primary: '#8b5cf6', secondary: '#ec4899' },
        ai_prompt_master: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                let colors = { primary: '#8b5cf6', secondary: '#ec4899' };
                try {
                    const parsed = JSON.parse(data.settings.theme_colors || '{}');
                    colors = {
                        primary: parsed.primary || colors.primary,
                        secondary: parsed.secondary || colors.secondary
                    };
                } catch (e) { }

                setSettings({
                    ...data.settings,
                    theme_colors: colors,
                    ai_prompt_master: data.settings.ai_prompt_master || '',
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            if (res.ok) {
                alert('Configuración guardada. Recarga la página para ver los cambios.');
                window.location.reload();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Cargando...</div>;
    if (user?.role !== 'admin') return <div>No tienes permisos para ver esta página.</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: 'var(--spacing-xl)', display: isMobile ? 'none' : 'block' }}>Configuración del Sistema</h1>

            <div className="card">
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Nombre de la Aplicación</label>
                        <input
                            type="text"
                            value={settings.app_name}
                            onChange={e => setSettings({ ...settings, app_name: e.target.value })}
                            style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'white' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>URL del Logo</label>
                        <input
                            type="text"
                            value={settings.logo_url || ''}
                            onChange={e => setSettings({ ...settings, logo_url: e.target.value })}
                            placeholder="https://ejemplo.com/logo.png"
                            style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'white' }}
                        />
                        {settings.logo_url && <img src={settings.logo_url} alt="Logo Preview" style={{ marginTop: '10px', maxHeight: '50px' }} />}
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Color de Acento Principal</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input
                                type="color"
                                value={settings.theme_colors.primary || '#8b5cf6'}
                                onChange={e => setSettings({ ...settings, theme_colors: { ...settings.theme_colors, primary: e.target.value } })}
                                style={{ width: '60px', height: '40px', cursor: 'pointer', border: 'none', padding: 0, borderRadius: 'var(--radius-sm)' }}
                            />
                            <span>{settings.theme_colors.primary || '#8b5cf6'}</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Color principal para botones, enlaces activos y elementos destacados.
                        </p>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Color de Acento Secundario</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input
                                type="color"
                                value={settings.theme_colors.secondary || '#ec4899'}
                                onChange={e => setSettings({ ...settings, theme_colors: { ...settings.theme_colors, secondary: e.target.value } })}
                                style={{ width: '60px', height: '40px', cursor: 'pointer', border: 'none', padding: 0, borderRadius: 'var(--radius-sm)' }}
                            />
                            <span>{settings.theme_colors.secondary || '#ec4899'}</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Color secundario para crear degradados sutiles y efectos visuales modernos.
                        </p>
                        <div style={{ 
                            marginTop: '8px', 
                            height: '40px', 
                            borderRadius: 'var(--radius-md)',
                            background: `linear-gradient(135deg, ${settings.theme_colors.primary || '#8b5cf6'} 0%, ${settings.theme_colors.secondary || '#ec4899'} 100%)`,
                            border: '1px solid var(--border-color)'
                        }} />
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-lg)', marginTop: 'var(--spacing-md)' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                            Prompt Maestro del Asistente de IA
                        </label>
                        <textarea
                            value={settings.ai_prompt_master || ''}
                            onChange={e => setSettings({ ...settings, ai_prompt_master: e.target.value })}
                            placeholder="Eres un asistente creativo especializado en..."
                            rows={8}
                            style={{ 
                                width: '100%', 
                                padding: '12px', 
                                borderRadius: 'var(--radius-md)', 
                                border: '1px solid var(--border-color)', 
                                background: 'var(--bg-tertiary)', 
                                color: 'var(--text-primary)',
                                fontFamily: 'monospace',
                                fontSize: '0.875rem',
                                lineHeight: '1.5',
                                resize: 'vertical',
                            }}
                        />
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                            Define la personalidad y función del asistente de IA. Este prompt se usará como base para generar planes de acción creativos para las tareas. Si está vacío, se usará el prompt por defecto según el rubro.
                        </p>
                        <button
                            type="button"
                            onClick={() => setSettings({ ...settings, ai_prompt_master: '' })}
                            style={{
                                marginTop: '8px',
                                padding: '6px 12px',
                                background: 'transparent',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: '0.8125rem',
                            }}
                        >
                            Restaurar por defecto
                        </button>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        Guardar Cambios
                    </button>
                </form>
            </div>
        </div>
    );
}
