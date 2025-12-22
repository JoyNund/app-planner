import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
    try {
        await requireAuth();

        // Fetch packs
        const { data: packs, error: packsError } = await supabase
            .from('sticker_packs')
            .select('*')
            .order('name', { ascending: true });
        
        if (packsError) throw packsError;
        if (!packs) return NextResponse.json({ packs: [] });

        // Fetch stickers for each pack
        const packsWithStickers = await Promise.all(packs.map(async (pack) => {
            const { data: stickers, error: stickersError } = await supabase
                .from('stickers')
                .select('*')
                .eq('pack_id', pack.id);
            
            if (stickersError) throw stickersError;
            
            return {
                ...pack,
                stickers: stickers || []
            };
        }));

        return NextResponse.json({ packs: packsWithStickers });
    } catch (error) {
        console.error('Get stickers error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
