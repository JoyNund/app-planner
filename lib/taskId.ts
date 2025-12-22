// Task ID generation utilities

interface RoleMapping {
    [key: string]: string;
}

const ROLE_PREFIXES: RoleMapping = {
    admin: 'JM',        // Jefe de Marketing
    designer: 'DG',     // Diseñador Gráfico
    assistant: 'AM',    // Asistente de Marketing
    audiovisual: 'AV',  // Audiovisual
};

const MONTH_ABBR: { [key: number]: string } = {
    0: 'ene',
    1: 'feb',
    2: 'mar',
    3: 'abr',
    4: 'may',
    5: 'jun',
    6: 'jul',
    7: 'ago',
    8: 'sep',
    9: 'oct',
    10: 'nov',
    11: 'dic',
};

/**
 * Get role prefix for task ID
 * @param role - User role (admin, designer, assistant, audiovisual)
 * @returns Two-letter prefix
 */
export function getRolePrefix(role: string): string {
    return ROLE_PREFIXES[role] || 'XX';
}

/**
 * Get month abbreviation in Spanish
 * @param month - Month number (0-11)
 * @returns Three-letter month abbreviation
 */
export function getMonthAbbr(month: number): string {
    return MONTH_ABBR[month] || 'xxx';
}

/**
 * Get month number from abbreviation
 * @param abbr - Three-letter month abbreviation
 * @returns Month number (0-11) or -1 if not found
 */
export function getMonthFromAbbr(abbr: string): number {
    const entries = Object.entries(MONTH_ABBR);
    const found = entries.find(([_, value]) => value === abbr.toLowerCase());
    return found ? parseInt(found[0]) : -1;
}

/**
 * Parse task ID to extract components
 * @param taskId - Task ID string (e.g., "DGnov00125")
 * @returns Object with role prefix, month, counter, and year
 */
export function parseTaskId(taskId: string): {
    rolePrefix: string;
    month: string;
    counter: number;
    year: number;
} | null {
    // Format: DGnov00125 (2 letters + 3 letters + 3 digits + 2 digits)
    const match = taskId.match(/^([A-Z]{2})([a-z]{3})(\d{3})(\d{2})$/);

    if (!match) return null;

    return {
        rolePrefix: match[1],
        month: match[2],
        counter: parseInt(match[3]),
        year: 2000 + parseInt(match[4]),
    };
}

/**
 * Generate task ID
 * @param role - User role
 * @param counter - Task counter for this role/month/year
 * @param date - Date for the task (defaults to now)
 * @returns Task ID string (e.g., "DGnov00125")
 */
export function generateTaskId(
    role: string,
    counter: number,
    date: Date = new Date()
): string {
    const rolePrefix = getRolePrefix(role);
    const month = getMonthAbbr(date.getMonth());
    const year = date.getFullYear() % 100; // Last 2 digits
    const counterStr = counter.toString().padStart(3, '0');

    return `${rolePrefix}${month}${counterStr}${year}`;
}

/**
 * Validate task ID format
 * @param taskId - Task ID to validate
 * @returns true if valid format
 */
export function isValidTaskId(taskId: string): boolean {
    return /^[A-Z]{2}[a-z]{3}\d{3}\d{2}$/.test(taskId);
}

/**
 * Get user-friendly description of task ID
 * @param taskId - Task ID to describe
 * @returns Human-readable description
 */
export function describeTaskId(taskId: string): string {
    const parsed = parseTaskId(taskId);
    if (!parsed) return 'ID inválido';

    const roleNames: RoleMapping = {
        JM: 'Jefe de Marketing',
        DG: 'Diseñador Gráfico',
        AM: 'Asistente de Marketing',
        AV: 'Audiovisual',
    };

    const roleName = roleNames[parsed.rolePrefix] || 'Desconocido';
    const monthNum = getMonthFromAbbr(parsed.month);
    const monthName = monthNum >= 0 ? new Date(2000, monthNum).toLocaleDateString('es-ES', { month: 'long' }) : 'mes desconocido';

    return `${roleName} - ${monthName} ${parsed.year} - Tarea #${parsed.counter}`;
}
