// Utility functions for date filtering and task grouping
import { isoToLimaDateString } from './utils';

/**
 * Get start and end of current week in Lima timezone
 */
export function getCurrentWeek(): { start: Date; end: Date } {
  // Get current date/time in Lima timezone
  const nowLimaStr = new Date().toLocaleString('en-US', { timeZone: 'America/Lima' });
  const now = new Date(nowLimaStr);
  const dayOfWeek = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - dayOfWeek); // Sunday
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Saturday
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Get start and end of current day in Lima timezone
 */
export function getCurrentDay(): { start: Date; end: Date } {
  // Get current date/time in Lima timezone
  const nowLimaStr = new Date().toLocaleString('en-US', { timeZone: 'America/Lima' });
  const now = new Date(nowLimaStr);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Check if a date is within a range (using Lima timezone for date comparison)
 */
export function isDateInRange(date: string | null, start: Date, end: Date): boolean {
  if (!date) return false;
  
  // Convert date to Lima date string for comparison
  const dateStr = isoToLimaDateString(date);
  if (!dateStr) return false;
  
  // Convert range dates to Lima date strings
  const startStr = start.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  const endStr = end.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  
  return dateStr >= startStr && dateStr <= endStr;
}

/**
 * Filter tasks by week
 */
export function getWeekTasks<T extends { due_date: string | null; start_date?: string | null }>(
  tasks: T[],
  weekStart?: Date
): T[] {
  const { start, end } = weekStart 
    ? { start: weekStart, end: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000) }
    : getCurrentWeek();
  
  return tasks.filter(task => 
    isDateInRange(task.due_date, start, end) || 
    isDateInRange(task.start_date || null, start, end)
  );
}

/**
 * Filter tasks by day (using Lima timezone)
 */
export function getDayTasks<T extends { due_date: string | null; start_date?: string | null }>(
  tasks: T[],
  day?: Date
): T[] {
  const targetDay = day || (() => {
    const nowLimaStr = new Date().toLocaleString('en-US', { timeZone: 'America/Lima' });
    return new Date(nowLimaStr);
  })();
  const start = new Date(targetDay);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(targetDay);
  end.setHours(23, 59, 59, 999);
  
  return tasks.filter(task => 
    isDateInRange(task.due_date, start, end) || 
    isDateInRange(task.start_date || null, start, end)
  );
}

/**
 * Group tasks by date (using Lima timezone)
 */
export function groupTasksByDate<T extends { due_date: string | null }>(tasks: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  
  tasks.forEach(task => {
    if (task.due_date) {
      const dateKey = isoToLimaDateString(task.due_date) || task.due_date.split('T')[0];
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(task);
    }
  });
  
  return grouped;
}

/**
 * Calculate task duration in days
 */
export function getTaskDuration(startDate: string | null, endDate: string | null): number {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Format date range
 */
export function formatDateRange(start: Date, end: Date): string {
  const startStr = start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const endStr = end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  
  return `${startStr} - ${endStr}`;
}

/**
 * Get week number
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
