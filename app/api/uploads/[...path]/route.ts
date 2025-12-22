import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { stat } from 'fs/promises';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await params;
        const filePath = join(process.cwd(), 'public', 'uploads', ...path);

        // Check if file exists
        await stat(filePath);

        const file = await readFile(filePath);
        const fileName = path[path.length - 1];
        const ext = fileName.split('.').pop()?.toLowerCase() || '';

        const contentTypes: Record<string, string> = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'webm': 'audio/webm',
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };

        return new NextResponse(file, {
            headers: {
                'Content-Type': contentTypes[ext] || 'application/octet-stream',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('File serving error:', error);
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
}
