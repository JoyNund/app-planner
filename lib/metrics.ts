import { Task } from './db';

export interface UserMetrics {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    completionRate: number;
    onTimeRate: number;
    efficiencyScore: number;
}

export function calculateUserMetrics(tasks: Task[]): UserMetrics {
    const totalTasks = tasks.length;
    if (totalTasks === 0) {
        return {
            totalTasks: 0,
            completedTasks: 0,
            pendingTasks: 0,
            completionRate: 0,
            onTimeRate: 0,
            efficiencyScore: 0,
        };
    }

    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = (completedTasks / totalTasks) * 100;

    // Calculate on-time rate (tasks completed before or on due_date)
    // Note: We need a 'completed_at' field to be accurate, but we'll use updated_at for completed tasks as a proxy for now if completed_at doesn't exist.
    // Actually, we don't have completed_at in schema, only updated_at.
    // Let's assume updated_at is close enough for now.

    const onTimeTasks = tasks.filter(t => {
        if (t.status !== 'completed' || !t.due_date) return false;
        const dueDate = new Date(t.due_date);
        const completedDate = new Date(t.updated_at);
        // Reset time part for fair comparison if due_date is just date
        dueDate.setHours(23, 59, 59, 999);
        return completedDate <= dueDate;
    }).length;

    const onTimeRate = completedTasks > 0 ? (onTimeTasks / completedTasks) * 100 : 0;

    // Efficiency Score: Weighted average of completion rate (40%) and on-time rate (60%)
    // This rewards not just doing tasks, but doing them on time.
    const efficiencyScore = (completionRate * 0.4) + (onTimeRate * 0.6);

    return {
        totalTasks,
        completedTasks,
        pendingTasks,
        completionRate: Math.round(completionRate),
        onTimeRate: Math.round(onTimeRate),
        efficiencyScore: Math.round(efficiencyScore),
    };
}
