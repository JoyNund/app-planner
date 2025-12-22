import { NextRequest, NextResponse } from 'next/server';
import { chatDb, userDb, notificationDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
    try {
        await requireAuth();

        const messages = await chatDb.getRecent(100);

        // Enrich messages with user info
        const enrichedMessages = await Promise.all(messages.map(async (msg) => {
            const user = await userDb.getById(msg.user_id);
            return {
                ...msg,
                referenced_tasks: msg.referenced_tasks ? JSON.parse(msg.referenced_tasks) : [],
                user: user ? {
                    id: user.id,
                    username: user.username,
                    full_name: user.full_name,
                    avatar_color: user.avatar_color,
                } : null,
            };
        }));

        return NextResponse.json({ messages: enrichedMessages });
    } catch (error) {
        console.error('Get chat messages error:', error);
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth();
        const { message, type, file_path, sticker_id, referenced_tasks } = await request.json();

        if (!message && !sticker_id && !file_path) {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 }
            );
        }

        const result = await chatDb.create(
            session.id,
            message || null,
            type || 'text',
            file_path || null,
            sticker_id || null,
            referenced_tasks || []
        );

        // Send notifications to all other users
        const allUsers = await userDb.getAll();
        const otherUsers = allUsers.filter(u => u.id !== session.id).map(u => u.id);
        
        if (otherUsers.length > 0) {
            const senderName = session.full_name || 'Alguien';
            let messagePreview = message || '';
            
            if (type === 'image' || file_path?.includes('image')) {
                messagePreview = '📷 Imagen compartida';
            } else if (type === 'voice') {
                messagePreview = '🎤 Nota de voz';
            } else if (sticker_id) {
                messagePreview = '🎨 Sticker';
            } else if (messagePreview.length > 50) {
                messagePreview = messagePreview.substring(0, 50) + '...';
            }
            
            await notificationDb.createForMany(
                otherUsers,
                'chat_message',
                `Mensaje de ${senderName}`,
                messagePreview,
                '/chat'
            );
        }

        return NextResponse.json({
            success: true,
            message_id: result.lastInsertRowid
        }, { status: 201 });
    } catch (error) {
        console.error('Send chat message error:', error);
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            error: error
        });
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
            { status: 500 }
        );
    }
}
