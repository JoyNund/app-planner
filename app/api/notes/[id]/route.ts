import { NextRequest, NextResponse } from 'next/server';
import { noteDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAuth();
        const { id } = await params;
        const noteId = parseInt(id);
        const { content } = await request.json();

        const note = await noteDb.getById(noteId);

        if (!note) {
            return NextResponse.json(
                { error: 'Note not found' },
                { status: 404 }
            );
        }

        // Only owner can update (shared users can view but not edit)
        if (note.user_id !== session.id) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }

        await noteDb.update(noteId, content);
        const updatedNote = await noteDb.getById(noteId);

        return NextResponse.json({ note: updatedNote });
    } catch (error) {
        console.error('Update note error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAuth();
        const { id } = await params;
        const noteId = parseInt(id);

        const note = await noteDb.getById(noteId);

        if (!note) {
            return NextResponse.json(
                { error: 'Note not found' },
                { status: 404 }
            );
        }

        if (note.user_id !== session.id) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }

        await noteDb.delete(noteId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete note error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
