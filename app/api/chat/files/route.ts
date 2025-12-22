import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { validateFile } from '@/lib/validations';

export async function POST(request: NextRequest) {
    try {
        await requireAuth();

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json(
                { error: 'File is required' },
                { status: 400 }
            );
        }

        // Validate file
        const fileValidation = validateFile(file);
        if (!fileValidation.valid) {
            return NextResponse.json(
                { error: fileValidation.error },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), 'public', 'uploads', 'chat');
        await mkdir(uploadsDir, { recursive: true });

        // Sanitize filename
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        
        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${timestamp}-${sanitizedName}`;
        const filepath = join(uploadsDir, filename);

        // Save file
        await writeFile(filepath, buffer);

        return NextResponse.json({
            success: true,
            filepath: `/api/uploads/chat/${filename}`,
            file_type: file.type
        }, { status: 201 });

    } catch (error) {
        console.error('Chat file upload error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
