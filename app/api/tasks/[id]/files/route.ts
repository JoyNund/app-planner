import { NextRequest, NextResponse } from 'next/server';
import { fileDb, userDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { validateFile } from '@/lib/validations';

// DELETE a file
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAuth();
        const { searchParams } = new URL(request.url);
        const fileId = searchParams.get('fileId');

        if (!fileId) {
            return NextResponse.json(
                { error: 'File ID is required' },
                { status: 400 }
            );
        }

        const file = await fileDb.getById(parseInt(fileId));
        if (!file) {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            );
        }

        // Check permission: only file owner or admin can delete
        const user = await userDb.getById(session.id);
        if (file.user_id !== session.id && user?.role !== 'admin') {
            return NextResponse.json(
                { error: 'No tienes permiso para eliminar este archivo' },
                { status: 403 }
            );
        }

        // Try to delete the physical file
        try {
            const filename = file.filepath.replace('/api/uploads/', '');
            const physicalPath = join(process.cwd(), 'public', 'uploads', filename);
            await unlink(physicalPath);
        } catch (e) {
            // File might not exist, continue anyway
            console.log('Could not delete physical file:', e);
        }

        // Delete from database
        await fileDb.delete(parseInt(fileId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete file error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAuth();
        const { id } = await params;
        const taskId = parseInt(id);

        const formData = await request.formData();
        const file = formData.get('file') as File;

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

        // Sanitize filename
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        
        // Create unique filename
        const timestamp = Date.now();
        const filename = `${timestamp}-${sanitizedName}`;
        const uploadsDir = join(process.cwd(), 'public', 'uploads');
        
        // Ensure uploads directory exists
        await mkdir(uploadsDir, { recursive: true });
        
        const filepath = join(uploadsDir, filename);
        await writeFile(filepath, buffer);

        // Determine file type
        const fileType = file.type.startsWith('image/') ? 'image' : 'file';

        const result = await fileDb.create(
            taskId,
            session.id,
            file.name,
            `/api/uploads/${filename}`,
            fileType
        );

        return NextResponse.json({
            success: true,
            file_id: result.lastInsertRowid,
            filepath: `/api/uploads/${filename}`
        }, { status: 201 });
    } catch (error) {
        console.error('Upload file error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
