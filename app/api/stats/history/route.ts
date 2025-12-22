import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
    try {
        await requireAuth();

        // Get tasks from last 12 months
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('created_at, status')
            .gte('created_at', twelveMonthsAgo.toISOString());
        
        if (error) throw error;
        if (!tasks) return NextResponse.json({ stats: [] });

        // Group by month (YYYY-MM) and status
        const statsMap = new Map<string, { month: string; status: string; count: number }>();
        
        tasks.forEach(task => {
            const date = new Date(task.created_at);
            const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const key = `${month}-${task.status}`;
            
            if (!statsMap.has(key)) {
                statsMap.set(key, { month, status: task.status, count: 0 });
            }
            statsMap.get(key)!.count++;
        });

        const stats = Array.from(statsMap.values())
            .sort((a, b) => {
                if (a.month !== b.month) return a.month.localeCompare(b.month);
                return a.status.localeCompare(b.status);
            });

        return NextResponse.json({ stats });
    } catch (error) {
        console.error('Get history stats error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
