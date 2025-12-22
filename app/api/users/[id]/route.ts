import { NextRequest, NextResponse } from 'next/server';
import { userDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAuth();
        const { id } = await params;
        const userId = parseInt(id);
        const { full_name, role, password } = await request.json();

        // Only admin can edit users
        if (session.role !== 'admin') {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }

        // Hash password if provided
        let passwordHash = undefined;
        if (password) {
            passwordHash = await bcrypt.hash(password, 10);
        }

        await userDb.update(userId, full_name, role, passwordHash);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update user error:', error);
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
        const userId = parseInt(id);

        // Only admin can delete users
        if (session.role !== 'admin') {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }

        // Prevent deleting self
        if (userId === session.id) {
            return NextResponse.json(
                { error: 'Cannot delete yourself' },
                { status: 400 }
            );
        }

        await userDb.delete(userId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
