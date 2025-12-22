import { NextRequest, NextResponse } from 'next/server';
import { taskDb, userDb, notificationDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const statusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  approve: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const taskId = parseInt(id);

    const task = await taskDb.getById(taskId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validation = statusSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid status' },
        { status: 400 }
      );
    }

    const { status, approve } = validation.data;

    // All users can change status, but admin approval logic applies
    // Handle null/undefined admin_approved (for old tasks)
    let adminApproved = (task.admin_approved !== null && task.admin_approved !== undefined) ? task.admin_approved : 0;
    let newStatus = status || task.status;

    // If admin is approving a completed task
    if (session.role === 'admin' && approve === true && task.status === 'completed') {
      adminApproved = 1;
      newStatus = 'completed';
    }
    // If admin is changing to completed, auto-approve
    else if (session.role === 'admin' && status === 'completed') {
      adminApproved = 1;
      newStatus = status;
    }
    // If non-admin is changing to completed, require admin approval (set to 0)
    else if (session.role !== 'admin' && status === 'completed') {
      adminApproved = 0;
      newStatus = status;
    }
    // If changing status (not approve action)
    else if (status) {
      newStatus = status;
      // If changing from completed to another status, reset approval
      if (task.status === 'completed' && status !== 'completed') {
        adminApproved = 0;
      }
    }

    // Update status and admin_approved
    await taskDb.updateStatusWithApproval(taskId, newStatus, adminApproved);

    const updatedTask = await taskDb.getById(taskId);

    // If this task is a child of a super task, check if all children are completed
    if (task.parent_task_id) {
      const superTask = await taskDb.getById(task.parent_task_id);
      if (superTask && superTask.is_super_task) {
        const childTasks = await taskDb.getChildTasks(superTask.id);
        const allCompleted = childTasks.length > 0 && childTasks.every(child => child.status === 'completed');
        
        if (allCompleted && superTask.status !== 'completed') {
          // Auto-complete the super task
          await taskDb.updateStatusWithApproval(superTask.id, 'completed', 1); // Auto-approve super task completion
          
          // Notify super task creator and assigned users
          const superTaskAssignedUsers = await taskDb.getAssignedUsers(superTask.id);
          const notifyUsers = superTaskAssignedUsers
            .filter(u => u.id !== session.id)
            .map(u => u.id);
          
          if (notifyUsers.length > 0) {
            await notificationDb.createForMany(
              notifyUsers,
              'task_completed',
              'Super tarea completada',
              `La super tarea "${superTask.title}" se completó automáticamente (todas las tareas están completadas)`,
              `/tasks/${superTask.id}`
            );
          }
        } else if (!allCompleted && superTask.status === 'completed') {
          // If a child task is uncompleted, revert super task status
          await taskDb.updateStatusWithApproval(superTask.id, 'in_progress', 0);
        }
      }
    }

    // Send notification when task is completed
    if (newStatus === 'completed' && task.status !== 'completed') {
      const completedByUser = session.full_name || 'Alguien';
      
      // Notify task creator if different from who completed
      if (task.created_by !== session.id) {
        await notificationDb.create(
          task.created_by,
          'task_completed',
          'Tarea completada',
          `${completedByUser} completó: "${task.title}"`,
          `/tasks/${taskId}`
        );
      }
      
      // Notify other assigned users
      const assignedUsers = await taskDb.getAssignedUsers(taskId);
      const otherAssignees = assignedUsers
        .filter(u => u.id !== session.id && u.id !== task.created_by)
        .map(u => u.id);
      
      if (otherAssignees.length > 0) {
        await notificationDb.createForMany(
          otherAssignees,
          'task_completed',
          'Tarea completada',
          `${completedByUser} completó: "${task.title}"`,
          `/tasks/${taskId}`
        );
      }
    }

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

