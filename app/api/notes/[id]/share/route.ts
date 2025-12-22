import { NextRequest, NextResponse } from 'next/server';
import { noteDb, notificationDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAuth();
        const { id } = await params;
        const noteId = parseInt(id);
        const { user_id } = await request.json();

        if (!user_id) {
            return NextResponse.json(
                { error: 'user_id is required' },
                { status: 400 }
            );
        }

        const note = await noteDb.getById(noteId);

        if (!note) {
            return NextResponse.json(
                { error: 'Note not found' },
                { status: 404 }
            );
        }

        // Only note owner can share
        if (note.user_id !== session.id) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }

        // Don't share with yourself
        if (user_id === session.id) {
            return NextResponse.json(
                { error: 'Cannot share with yourself' },
                { status: 400 }
            );
        }

        await noteDb.shareWithUser(noteId, user_id);
        const sharedUsers = await noteDb.getSharedUsers(noteId);

        // Send notification to the user the note was shared with
        const sharerName = session.full_name || 'Alguien';
        const notePreview = note.content.length > 30 
            ? note.content.substring(0, 30) + '...' 
            : note.content;
        
        await notificationDb.create(
            user_id,
            'note_shared',
            'Nota compartida contigo',
            `${sharerName} compartió una nota: "${notePreview}"`,
            '/notes'
        );

        return NextResponse.json({ shared_users: sharedUsers });
    } catch (error) {
        console.error('Share note error:', error);
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
        const searchParams = request.nextUrl.searchParams;
        const user_id = searchParams.get('user_id');

        if (!user_id) {
            return NextResponse.json(
                { error: 'user_id is required' },
                { status: 400 }
            );
        }

        const note = await noteDb.getById(noteId);

        if (!note) {
            return NextResponse.json(
                { error: 'Note not found' },
                { status: 404 }
            );
        }

        // Only note owner can unshare
        if (note.user_id !== session.id) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }

        await noteDb.unshareWithUser(noteId, parseInt(user_id));
        const sharedUsers = await noteDb.getSharedUsers(noteId);

        return NextResponse.json({ shared_users: sharedUsers });
    } catch (error) {
        console.error('Unshare note error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

