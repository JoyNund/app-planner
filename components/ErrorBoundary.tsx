'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: 'var(--spacing-2xl)',
          textAlign: 'center',
          color: 'var(--text-primary)',
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: 'var(--spacing-md)', color: 'var(--status-urgent)' }}>
            ⚠️ Error en la Aplicación
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)', maxWidth: '600px' }}>
            {this.state.error?.message || 'Ha ocurrido un error inesperado'}
          </p>
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="btn btn-primary"
              style={{ marginRight: 'var(--spacing-md)' }}
            >
              Recargar Página
            </button>
            <button
              onClick={() => {
                window.location.href = '/login';
              }}
              className="btn btn-secondary"
            >
              Volver al Login
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              marginTop: 'var(--spacing-lg)',
              padding: 'var(--spacing-md)',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              maxWidth: '800px',
              width: '100%',
              textAlign: 'left',
            }}>
              <summary style={{ cursor: 'pointer', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                Detalles del Error (Solo en desarrollo)
              </summary>
              <pre style={{
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
