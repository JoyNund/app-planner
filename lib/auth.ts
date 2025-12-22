import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { userDb, type User } from './db';

const SESSION_COOKIE_NAME = 'mkt_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export interface SessionUser {
    id: number;
    username: string;
    full_name: string;
    role: string;
    avatar_color: string;
}

export async function createSession(user: User): Promise<void> {
    const sessionData: SessionUser = {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        avatar_color: user.avatar_color,
    };

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
        httpOnly: true,
        secure: false, // Allow HTTP for IP access
        sameSite: 'lax',
        maxAge: SESSION_DURATION / 1000,
        path: '/',
    });
}

export async function getSession(): Promise<SessionUser | null> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

        if (!sessionCookie?.value) {
            return null;
        }

        const session = JSON.parse(sessionCookie.value) as SessionUser;
        return session;
    } catch (error) {
        console.error('Error getting session:', error);
        return null;
    }
}

export async function destroySession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireAuth(): Promise<SessionUser> {
    const session = await getSession();
    if (!session) {
        throw new Error('Unauthorized');
    }
    return session;
}

export async function requireAdmin(): Promise<SessionUser> {
    const session = await requireAuth();
    if (session.role !== 'admin') {
        throw new Error('Forbidden: Admin access required');
    }
    return session;
}
