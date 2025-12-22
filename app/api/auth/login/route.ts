import { NextRequest, NextResponse } from 'next/server';
import { userDb } from '@/lib/db';
import { verifyPassword, createSession } from '@/lib/auth';
import { loginSchema, validateRequest } from '@/lib/validations';

export async function POST(request: NextRequest) {
    try {
        // Validate request body
        const validation = await validateRequest(request, loginSchema);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error },
                { status: validation.status }
            );
        }
        const { username, password } = validation.data;

        const user = await userDb.getByUsername(username);

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const isValid = await verifyPassword(password, user.password_hash);

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        await createSession(user);

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                role: user.role,
                avatar_color: user.avatar_color,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
