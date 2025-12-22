import { NextRequest, NextResponse } from 'next/server';
import { taskDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

interface ChecklistItem {
    id: string;
    text: string;
    checked: boolean;
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        const { id } = await params;
        const taskId = parseInt(id);
        
        const body = await request.json();
        const { items } = body as { items: ChecklistItem[] };
        
        if (!Array.isArray(items)) {
            return NextResponse.json(
                { error: 'Items must be an array' },
                { status: 400 }
            );
        }
        
        // Get current task
        const task = await taskDb.getById(taskId);
        if (!task) {
            return NextResponse.json(
                { error: 'Task not found' },
                { status: 404 }
            );
        }
        
        // Create new description with updated checklist
        const newDescription = JSON.stringify({
            type: 'checklist',
            items: items.map(item => ({
                id: item.id,
                text: item.text,
                checked: item.checked,
            })),
        });
        
        // Update task description
        const result = await taskDb.updateDescription(taskId, newDescription);
        
        console.log('Checklist update result:', { taskId, changes: result.changes, newDescription });
        
        return NextResponse.json({ success: true, updated: result.changes > 0 });
    } catch (error) {
        console.error('Update checklist error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
