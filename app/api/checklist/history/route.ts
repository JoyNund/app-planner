import { NextRequest, NextResponse } from 'next/server';
import { checklistHistoryDb } from '@/lib/db';
import { cookies } from 'next/headers';

// Get checklist history (grouped by days)
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
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '30');

    if (date) {
      // Get items for specific date
      const items = await checklistHistoryDb.getByDate(userId, date);
      return NextResponse.json({ items });
    } else {
      // Get all days with completed items
      const days = await checklistHistoryDb.getByUserId(userId, limit);
      return NextResponse.json({ days });
    }
  } catch (error) {
    console.error('Error fetching checklist history:', error);
    return NextResponse.json({ error: 'Error al obtener historial' }, { status: 500 });
  }
}

// Create checklist history entry (single completed item)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('mkt_session');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const userId = session.id;

    const body = await request.json();
    const { date, content } = body;

    if (!date || !content) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const result = await checklistHistoryDb.create(userId, date, content);

    return NextResponse.json({ 
      success: true, 
      id: result.lastInsertRowid,
      message: 'Item archivado' 
    });
  } catch (error) {
    console.error('Error creating checklist history:', error);
    return NextResponse.json({ error: 'Error al archivar item' }, { status: 500 });
  }
}

// Delete checklist history entry or entire day
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('mkt_session');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const userId = session.id;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const date = searchParams.get('date');

    if (date) {
      // Delete entire day
      await checklistHistoryDb.deleteDay(userId, date);
      return NextResponse.json({ success: true, message: 'Día eliminado' });
    } else if (id) {
      // Delete single item
      await checklistHistoryDb.delete(parseInt(id));
      return NextResponse.json({ success: true, message: 'Item eliminado' });
    } else {
      return NextResponse.json({ error: 'ID o fecha requerido' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error deleting checklist history:', error);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}

