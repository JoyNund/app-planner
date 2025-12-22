import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/components/AuthProvider';
import SettingsProvider from '@/components/SettingsProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import './globals.css';

export const metadata: Metadata = {
  title: 'MKT Planner - Gestión de Tareas de Marketing',
  description: 'Plataforma colaborativa para gestión de tareas de equipo de marketing',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <ErrorBoundary>
          <AuthProvider>
            <SettingsProvider />
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
