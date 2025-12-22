import { NextRequest, NextResponse } from 'next/server';
import { noteDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth();
        const searchParams = request.nextUrl.searchParams;
        const taskId = searchParams.get('task_id');

        let notes;
        if (taskId) {
            notes = await noteDb.getByTask(parseInt(taskId), session.id);
        } else {
            notes = await noteDb.getByUser(session.id);
        }

        // Enrich notes with shared users info
        const enrichedNotes = await Promise.all(notes.map(async (note: any) => {
            const sharedUsers = await noteDb.getSharedUsers(note.id);
            return {
                ...note,
                shared_users: sharedUsers,
            };
        }));

        return NextResponse.json({ notes: enrichedNotes });
    } catch (error) {
        console.error('Get notes error:', error);
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth();
        const { content, task_id } = await request.json();

        if (!content) {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 }
            );
        }

        const result = await noteDb.create(session.id, content, task_id || null);
        const note = await noteDb.getById(Number(result.lastInsertRowid));

        return NextResponse.json({ note }, { status: 201 });
    } catch (error) {
        console.error('Create note error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
