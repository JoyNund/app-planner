import { NextRequest, NextResponse } from 'next/server';
import { taskDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    
    const allTasks = await taskDb.getAll();
    const pendingCount = allTasks.filter(t => t.status === 'pending').length;
    
    return NextResponse.json({ count: pendingCount });
  } catch (error) {
    console.error('Get pending tasks count error:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}

