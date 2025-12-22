import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Archivo requerido' },
        { status: 400 }
      );
    }

    // Validate file type (images and videos only)
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    const isValidType = validImageTypes.includes(file.type) || validVideoTypes.includes(file.type);

    if (!isValidType) {
      return NextResponse.json(
        { error: 'Solo se permiten imágenes (JPEG, PNG, GIF, WEBP) y videos (MP4, WEBM, MOV, AVI)' },
        { status: 400 }
      );
    }

    // Check file size (max 20MB)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 20MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'ai-chat');
    await mkdir(uploadsDir, { recursive: true });

    // Sanitize filename
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${sanitizedName}`;
    const filepath = join(uploadsDir, filename);

    // Save file
    await writeFile(filepath, buffer);

    // Determine file type
    const fileType = validImageTypes.includes(file.type) ? 'image' : 'video';

    return NextResponse.json({
      success: true,
      filepath: `/uploads/ai-chat/${filename}`,
      filename: file.name,
      file_type: fileType,
      mime_type: file.type,
    }, { status: 201 });

  } catch (error) {
    console.error('AI chat file upload error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

