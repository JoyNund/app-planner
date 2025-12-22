'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(username, password);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-primary)',
                padding: 'var(--spacing-lg)',
            }}
        >
            <div
                className="card"
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: 'var(--spacing-2xl)',
                }}
            >
                {/* Logo */}
                <h1
                    style={{
                        background: 'var(--accent-gradient)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: '2.5rem',
                        fontWeight: 800,
                        textAlign: 'center',
                        marginBottom: 'var(--spacing-sm)',
                    }}
                >
                    MKT Planner
                </h1>
                <p
                    style={{
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        marginBottom: 'var(--spacing-2xl)',
                    }}
                >
                    Gestión colaborativa de tareas
                </p>

                {/* Login Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                    <div>
                        <label
                            htmlFor="username"
                            style={{
                                display: 'block',
                                marginBottom: 'var(--spacing-sm)',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                            }}
                        >
                            Usuario
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Ingresa tu usuario"
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            style={{
                                display: 'block',
                                marginBottom: 'var(--spacing-sm)',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                            }}
                        >
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Ingresa tu contraseña"
                            required
                        />
                    </div>

                    {error && (
                        <div
                            style={{
                                padding: 'var(--spacing-md)',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid var(--priority-urgent)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--priority-urgent)',
                                fontSize: '0.875rem',
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>

                {/* Demo Credentials */}
                <div
                    style={{
                        marginTop: 'var(--spacing-2xl)',
                        padding: 'var(--spacing-lg)',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                    }}
                >
                    {/*<div style={{ fontWeight: 600, marginBottom: 'var(--spacing-sm)', color: 'var(--text-primary)' }}>
                        Usuarios de prueba:
                    </div>
                    <div>• admin / admin123</div>
                    <div>• diseñador / diseño123</div>
                    <div>• asistente / asist123</div>
                    <div>• audiovisual / audio123</div> */}
                </div>
            </div>
        </div>
    );
}
