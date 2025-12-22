import { NextRequest, NextResponse } from 'next/server';
import { commentDb, fileDb, userDb, taskDb, notificationDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { taskCommentSchema, validateFile } from '@/lib/validations';
import { z } from 'zod';

// DELETE a comment
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAuth();
        const { searchParams } = new URL(request.url);
        const commentId = searchParams.get('commentId');

        if (!commentId) {
            return NextResponse.json(
                { error: 'Comment ID is required' },
                { status: 400 }
            );
        }

        const comment = await commentDb.getById(parseInt(commentId));
        if (!comment) {
            return NextResponse.json(
                { error: 'Comment not found' },
                { status: 404 }
            );
        }

        // Check permission: only comment owner or admin can delete
        const user = await userDb.getById(session.id);
        if (comment.user_id !== session.id && user?.role !== 'admin') {
            return NextResponse.json(
                { error: 'No tienes permiso para eliminar este comentario' },
                { status: 403 }
            );
        }

        await commentDb.delete(parseInt(commentId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete comment error:', error);
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
        const content = formData.get('content') as string | null;
        const file = formData.get('file') as File | null;

        if (!content && !file) {
            return NextResponse.json(
                { error: 'Content or file is required' },
                { status: 400 }
            );
        }

        // Validate content if provided
        if (content) {
            try {
                taskCommentSchema.parse({ content });
            } catch (error) {
                if (error instanceof z.ZodError) {
                    return NextResponse.json(
                        { error: error.issues[0]?.message || 'Invalid content' },
                        { status: 400 }
                    );
                }
            }
        }

        // Create comment if there's content
        let commentId = null;
        if (content) {
            const result = await commentDb.create(taskId, session.id, content);
            commentId = Number(result.lastInsertRowid);
        }

        // Handle file upload if present
        let fileId = null;
        if (file) {
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
            const uploadsDir = join(process.cwd(), 'public', 'uploads');
            await mkdir(uploadsDir, { recursive: true });

            // Sanitize filename
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            
            // Generate unique filename
            const timestamp = Date.now();
            const filename = `${timestamp}-${sanitizedName}`;
            const filepath = join(uploadsDir, filename);

            // Save file
            await writeFile(filepath, buffer);

            // Save file record
            const fileResult = await fileDb.create(
                taskId,
                session.id,
                file.name,
                `/api/uploads/${filename}`,
                file.type
            );
            fileId = Number(fileResult.lastInsertRowid);
        }

        // Send notifications for activity
        const task = await taskDb.getById(taskId);
        if (task) {
            const actorName = session.full_name || 'Alguien';
            const activityType = file ? 'adjuntó un archivo' : 'comentó';
            
            // Get all users involved with the task
            const assignedUsers = await taskDb.getAssignedUsers(taskId);
            const involvedUserIds = new Set([task.created_by, ...assignedUsers.map(u => u.id)]);
            
            // Notify everyone except the person who made the activity
            const notifyUsers = Array.from(involvedUserIds).filter(id => id !== session.id);
            
            if (notifyUsers.length > 0) {
                await notificationDb.createForMany(
                    notifyUsers,
                    'task_activity',
                    'Nueva actividad en tarea',
                    `${actorName} ${activityType} en "${task.title}"`,
                    `/tasks/${taskId}`
                );
            }
        }

        return NextResponse.json({
            success: true,
            comment_id: commentId,
            file_id: fileId,
        }, { status: 201 });
    } catch (error) {
        console.error('Create comment error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
