import { NextRequest, NextResponse } from 'next/server';
import { userDb, taskDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        await requireAdmin();
        const { username, password, full_name, role } = await request.json();

        // Validate required fields
        if (!username || !password || !full_name || !role) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Check if username already exists
        const existingUser = await userDb.getByUsername(username);
        if (existingUser) {
            return NextResponse.json(
                { error: 'Username already exists' },
                { status: 400 }
            );
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Generate random avatar color
        const colors = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];
        const avatarColor = colors[Math.floor(Math.random() * colors.length)];

        // Create user
        const result = await userDb.create(username, passwordHash, full_name, role, avatarColor);

        return NextResponse.json({
            success: true,
            user_id: Number(result.lastInsertRowid)
        }, { status: 201 });
    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        await requireAdmin();

        const users = await userDb.getAll();

        // Get task counts for each user
        const usersWithStats = await Promise.all(users.map(async (user) => {
            const tasks = await taskDb.getByAssignedTo(user.id);
            const completedTasks = tasks.filter(t => t.status === 'completed').length;
            const pendingTasks = tasks.filter(t => t.status === 'pending').length;
            const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;

            return {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                role: user.role,
                avatar_color: user.avatar_color,
                stats: {
                    total_tasks: tasks.length,
                    completed: completedTasks,
                    pending: pendingTasks,
                    in_progress: inProgressTasks,
                },
            };
        }));

        return NextResponse.json({ users: usersWithStats });
    } catch (error) {
        console.error('Get users error:', error);
        return NextResponse.json(
            { error: 'Forbidden' },
            { status: 403 }
        );
    }
}
