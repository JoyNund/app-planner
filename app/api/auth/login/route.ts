import { NextRequest, NextResponse } from 'next/server';
import { userDb } from '@/lib/db';
import { verifyPassword, createSession } from '@/lib/auth';
import { loginSchema, validateRequest } from '@/lib/validations';

export async function POST(request: NextRequest) {
    try {
        // Check environment variables first
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            console.error('Missing Supabase environment variables:', {
                url: !!supabaseUrl,
                key: !!supabaseKey
            });
            return NextResponse.json(
                { error: 'Server configuration error. Please contact administrator.' },
                { status: 500 }
            );
        }

        // Validate request body
        const validation = await validateRequest(request, loginSchema);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error },
                { status: validation.status }
            );
        }
        const { username, password } = validation.data;

        let user;
        try {
            user = await userDb.getByUsername(username);
        } catch (dbError: any) {
            console.error('Database error during login:', dbError);
            return NextResponse.json(
                { error: 'Database connection error. Please try again later.' },
                { status: 500 }
            );
        }

        if (!user) {
            console.log(`Login attempt failed: User '${username}' not found`);
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
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json(
            { 
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}
