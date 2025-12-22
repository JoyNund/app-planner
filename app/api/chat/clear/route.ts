import { NextRequest, NextResponse } from 'next/server';
import { chatDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
    try {
        await requireAdmin();

        // Delete all messages
        // Note: We need to add a clear method to chatDb or use raw query
        // Since chatDb doesn't have clear(), we'll add it to lib/db.ts first
        // But for now, let's assume we'll add it.
        // Actually, let's check lib/db.ts content again or just use db directly if exported?
        // db is default exported from lib/db.ts

        // Let's modify lib/db.ts to add clear() method first.
        // Wait, I can't modify lib/db.ts in this tool call.
        // I will write this file assuming chatDb.clear() exists, and then update lib/db.ts

        await chatDb.clear();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Clear chat error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
