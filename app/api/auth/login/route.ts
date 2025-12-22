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
            console.log(`[LOGIN] Attempting to find user: '${username}'`);
            user = await userDb.getByUsername(username);
            console.log(`[LOGIN] User lookup result:`, user ? { id: user.id, username: user.username } : 'NOT FOUND');
        } catch (dbError: any) {
            console.error('[LOGIN] Database error during login:', {
                error: dbError.message,
                code: dbError.code,
                details: dbError.details,
                hint: dbError.hint
            });
            return NextResponse.json(
                { error: 'Database connection error. Please try again later.' },
                { status: 500 }
            );
        }

        if (!user) {
            console.log(`[LOGIN] Login attempt failed: User '${username}' not found`);
            // Try a direct query to debug
            try {
                const { supabase } = await import('@/lib/supabase');
                const { data: debugData, error: debugError } = await supabase
                    .from('users')
                    .select('id, username')
                    .eq('username', username);
                console.log('[LOGIN] Debug query result:', { data: debugData, error: debugError });
            } catch (debugErr) {
                console.error('[LOGIN] Debug query failed:', debugErr);
            }
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        console.log(`[LOGIN] Verifying password for user: ${username}`);
        console.log(`[LOGIN] Password hash length: ${user.password_hash?.length || 0}`);
        
        const isValid = await verifyPassword(password, user.password_hash);
        console.log(`[LOGIN] Password verification result: ${isValid}`);

        if (!isValid) {
            console.log(`[LOGIN] Password verification failed for user: ${username}`);
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }
        
        console.log(`[LOGIN] Password verified successfully, creating session...`);

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
