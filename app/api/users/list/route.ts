import { NextResponse } from 'next/server';
import { userDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
    try {
        await requireAuth(); // Just need to be authenticated, not admin

        const users = await userDb.getAll();

        // Return only basic user info (no sensitive data)
        const userList = users.map(user => ({
            id: user.id,
            full_name: user.full_name,
            avatar_color: user.avatar_color,
            role: user.role,
        }));

        return NextResponse.json({ users: userList });
    } catch (error) {
        console.error('Get users list error:', error);
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }
}

