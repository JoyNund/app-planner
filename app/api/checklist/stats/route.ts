import { NextRequest, NextResponse } from 'next/server';
import { checklistHistoryDb } from '@/lib/db';
import { cookies } from 'next/headers';

// Get checklist statistics
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('mkt_session');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const userId = session.id;

    const { searchParams } = new URL(request.url);
    const daysParam = parseInt(searchParams.get('days') || '30');

    const stats = await checklistHistoryDb.getStats(userId, daysParam);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching checklist stats:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}

