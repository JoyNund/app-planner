import { NextRequest, NextResponse } from 'next/server';
import { notificationDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET - Get notifications for current user
export async function GET() {
    try {
        const session = await requireAuth();
        
        const notifications = await notificationDb.getByUserId(session.id);
        const unreadCount = await notificationDb.getUnreadCount(session.id);
        
        return NextResponse.json({ 
            notifications,
            unreadCount,
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT - Mark notifications as read
export async function PUT(request: NextRequest) {
    try {
        const session = await requireAuth();
        const body = await request.json();
        
        if (body.markAll) {
            // Mark all as read
            await notificationDb.markAllAsRead(session.id);
        } else if (body.id) {
            // Mark single notification as read
            await notificationDb.markAsRead(body.id);
        }
        
        const unreadCount = await notificationDb.getUnreadCount(session.id);
        
        return NextResponse.json({ 
            success: true,
            unreadCount,
        });
    } catch (error) {
        console.error('Update notifications error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
