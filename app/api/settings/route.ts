import { NextRequest, NextResponse } from 'next/server';
import { settingsDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
    try {
        const settings = await settingsDb.get();
        return NextResponse.json({ settings });
    } catch (error) {
        console.error('Get settings error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await requireAuth();

        if (session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { app_name, logo_url, theme_colors, ai_prompt_master } = await request.json();

        if (!app_name) {
            return NextResponse.json({ error: 'App name required' }, { status: 400 });
        }

        await settingsDb.update(
            app_name, 
            logo_url || null, 
            JSON.stringify(theme_colors || {}),
            ai_prompt_master || null
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update settings error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
