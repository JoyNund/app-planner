export function formatDate(date: string | Date | null | undefined): string {
    if (!date) return '';

    // Convert to Lima date string first to ensure consistency
    let limaDateStr: string | null = null;
    
    if (typeof date === 'string') {
        // If it's already YYYY-MM-DD format, use it directly
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            limaDateStr = date;
        } else {
            // It's an ISO string, convert to Lima date
            limaDateStr = isoToLimaDateString(date);
        }
    } else {
        // It's a Date object
        limaDateStr = isoToLimaDateString(date.toISOString());
    }
    
    if (!limaDateStr) return '';

    // Parse the YYYY-MM-DD string and format it
    const [y, m, d] = limaDateStr.split('-').map(Number);
    // Create date at noon in Lima to avoid DST issues
        const dateObj = new Date(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T12:00:00-05:00`);
    
    return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Lima'
    }).format(dateObj);
}

export function formatDateTime(date: string | Date): string {
    const d = new Date(date);
    return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Lima'
    }).format(d);
}

export function formatTime(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Lima'
    });
}

export function getRelativeTime(date: string | Date): string {
    const d = new Date(date);
    // Get current time in Lima timezone
    const nowLima = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const dateLima = new Date(d.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const diffMs = nowLima.getTime() - dateLima.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return formatDate(d);
}

export function isOverdue(dueDate: string | null): boolean {
    if (!dueDate) return false;
    // Compare dates in Lima timezone using the helper function
    const todayLima = getLimaDateString();
    const dueDateLima = isoToLimaDateString(dueDate);
    if (!dueDateLima) return false;
    return dueDateLima < todayLima;
}

/**
 * Get current date in Lima timezone as YYYY-MM-DD string
 */
export function getLimaDateString(): string {
    const now = new Date();
    return now.toLocaleDateString('en-CA', { timeZone: 'America/Lima' }); // en-CA gives YYYY-MM-DD format
}

/**
 * Get current datetime in Lima timezone
 */
export function getLimaDateTime(): Date {
    const now = new Date();
    const limaStr = now.toLocaleString('en-US', { timeZone: 'America/Lima' });
    return new Date(limaStr);
}

/**
 * Convert a YYYY-MM-DD date string to ISO string at noon in Lima timezone
 * Using noon ensures the date doesn't change when converted to UTC
 * This ensures that dates are stored consistently regardless of server timezone
 */
export function dateStringToLimaISO(dateString: string | null | undefined): string | null {
    if (!dateString) return null;
    
    // If it's already a full ISO string, extract just the date part
    const dateOnly = dateString.split('T')[0];
    const [year, month, day] = dateOnly.split('-').map(Number);
    
    // Create date at noon in Lima timezone (UTC-5) to avoid day changes when converting to UTC
    // Noon ensures that even with UTC conversion, the date part stays the same
    const dateInLima = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00-05:00`);
    
    // Convert to ISO string - this will be stored in DB
    // Using noon ensures the date part remains correct even if server is in different timezone
    return dateInLima.toISOString();
}

/**
 * Get current date/time in Lima timezone as ISO string
 */
export function getLimaISOString(): string {
    const now = new Date();
    const limaDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    return limaDate.toISOString();
}

/**
 * Extract date part (YYYY-MM-DD) from an ISO string, considering Lima timezone
 */
export function isoToLimaDateString(isoString: string | null | undefined): string | null {
    if (!isoString) return null;
    
    try {
        const date = new Date(isoString);
        // Convert to Lima timezone and extract date part
        return date.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
    } catch {
        // If it's already YYYY-MM-DD format, return as-is
        if (/^\d{4}-\d{2}-\d{2}/.test(isoString)) {
            return isoString.split('T')[0];
        }
        return null;
    }
}

/**
 * Compare two dates considering only the date part in Lima timezone
 * Returns: -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export function compareLimaDates(date1: string | null, date2: string | null): number {
    if (!date1 && !date2) return 0;
    if (!date1) return -1;
    if (!date2) return 1;
    
    const d1 = isoToLimaDateString(date1) || '';
    const d2 = isoToLimaDateString(date2) || '';
    
    if (d1 < d2) return -1;
    if (d1 > d2) return 1;
    return 0;
}

export function getInitials(name: string): string {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
        urgent: 'Urgente',
        high: 'Alta',
        medium: 'Media',
        low: 'Baja',
    };
    return labels[priority] || priority;
}

export function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
        design: 'Diseño',
        content: 'Contenido',
        video: 'Video',
        campaign: 'Campaña',
        social: 'Redes Sociales',
        other: 'Otros',
    };
    return labels[category] || category;
}

export function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        pending: 'Pendiente',
        in_progress: 'En Progreso',
        completed: 'Completada',
    };
    return labels[status] || status;
}

export function getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
        admin: 'Jefe de Marketing',
        designer: 'Diseñador Gráfico',
        assistant: 'Asistente de Marketing',
        audiovisual: 'Audiovisual',
    };
    // If role is in labels, return label, otherwise return role as-is (custom role)
    return labels[role] || role;
}
