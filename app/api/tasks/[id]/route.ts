import { NextRequest, NextResponse } from 'next/server';
import { taskDb, userDb, commentDb, fileDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { taskUpdateSchema, validateRequest } from '@/lib/validations';
import { dateStringToLimaISO } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const taskId = parseInt(id);

    const task = await taskDb.getById(taskId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const assignedUser = await userDb.getById(task.assigned_to);
    const createdByUser = await userDb.getById(task.created_by);
    const comments = await commentDb.getByTaskId(taskId);
    const files = await fileDb.getByTaskId(taskId);

    // Enrich comments with user info
    const enrichedComments = await Promise.all(comments.map(async (comment) => {
      const user = await userDb.getById(comment.user_id);
      return {
        ...comment,
        user: user ? {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          avatar_color: user.avatar_color,
        } : null,
      };
    }));

    // Enrich files with user info
    const enrichedFiles = await Promise.all(files.map(async (file) => {
      const user = await userDb.getById(file.user_id);
      return {
        ...file,
        user: user ? {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
        } : null,
      };
    }));

    // Get child tasks if this is a super task
    let childTasks: any[] = [];
    if (task.is_super_task) {
      childTasks = await taskDb.getChildTasks(task.id);
      // Enrich each child task with comments and files
      childTasks = await Promise.all(childTasks.map(async (childTask) => {
        const childComments = await commentDb.getByTaskId(childTask.id);
        const childFiles = await fileDb.getByTaskId(childTask.id);
        
        const enrichedChildComments = await Promise.all(childComments.map(async (comment) => {
          const user = await userDb.getById(comment.user_id);
          return {
            ...comment,
            user: user ? {
              id: user.id,
              username: user.username,
              full_name: user.full_name,
              avatar_color: user.avatar_color,
            } : null,
          };
        }));

        const enrichedChildFiles = await Promise.all(childFiles.map(async (file) => {
          const user = await userDb.getById(file.user_id);
          return {
            ...file,
            user: user ? {
              id: user.id,
              username: user.username,
              full_name: user.full_name,
            } : null,
          };
        }));

        const childAssignedUser = await userDb.getById(childTask.assigned_to);
        const childCreatedByUser = await userDb.getById(childTask.created_by);
        const childAssignedUsers = await taskDb.getAssignedUsers(childTask.id);

        return {
          ...childTask,
          assigned_user: childAssignedUser ? {
            id: childAssignedUser.id,
            username: childAssignedUser.username,
            full_name: childAssignedUser.full_name,
            avatar_color: childAssignedUser.avatar_color,
          } : null,
          assigned_users: childAssignedUsers.map(u => ({
            id: u.id,
            full_name: u.full_name,
            avatar_color: u.avatar_color
          })),
          created_by_user: childCreatedByUser ? {
            id: childCreatedByUser.id,
            username: childCreatedByUser.username,
            full_name: childCreatedByUser.full_name,
          } : null,
          comments: enrichedChildComments,
          files: enrichedChildFiles,
        };
      }));
    }

    const assignedUsers = await taskDb.getAssignedUsers(task.id);
    const enrichedTask = {
      ...task,
      assigned_user: assignedUser ? {
        id: assignedUser.id,
        username: assignedUser.username,
        full_name: assignedUser.full_name,
        avatar_color: assignedUser.avatar_color,
      } : null,
      assigned_users: assignedUsers.map(u => ({
        id: u.id,
        full_name: u.full_name,
        avatar_color: u.avatar_color
      })),
      created_by_user: createdByUser ? {
        id: createdByUser.id,
        username: createdByUser.username,
        full_name: createdByUser.full_name,
      } : null,
      comments: enrichedComments,
      files: enrichedFiles,
      child_tasks: childTasks.length > 0 ? childTasks : undefined,
    };

    return NextResponse.json({ task: enrichedTask });
  } catch (error) {
    console.error('Get task error:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}

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

    // Only admin, task creator, or assigned user can edit
    const assignedUsers = await taskDb.getAssignedUsers(task.id);
    const isAssigned = task.assigned_to === session.id ||
      (assignedUsers.some(u => u.id === session.id));

    if (session.role !== 'admin' && session.id !== task.created_by && !isAssigned) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Validate request body (all fields optional for update)
    const validation = await validateRequest(request, taskUpdateSchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }
    const updateData = validation.data;

    // Use existing values if not provided in update
    const title = updateData.title ?? task.title;
    const description = updateData.description !== undefined ? updateData.description : task.description;
    const priority = updateData.priority ?? task.priority;
    const category = updateData.category ?? task.category;
    const status = updateData.status ?? task.status;
    
    // Convert dates to Lima timezone if provided
    const start_date = updateData.start_date !== undefined 
      ? (typeof updateData.start_date === 'string' && updateData.start_date.includes('T') 
          ? updateData.start_date 
          : dateStringToLimaISO(updateData.start_date))
      : task.start_date;
    const due_date = updateData.due_date !== undefined 
      ? (typeof updateData.due_date === 'string' && updateData.due_date.includes('T') 
          ? updateData.due_date 
          : dateStringToLimaISO(updateData.due_date))
      : task.due_date;

    // Determine primary assignee
    const primaryAssigneeId = updateData.assigned_to ?? 
      (updateData.assigned_users && updateData.assigned_users.length > 0 ? updateData.assigned_users[0] : task.assigned_to);
    const assigned_users = updateData.assigned_users ?? task.assigned_users ?? [primaryAssigneeId];

    await taskDb.update(
      taskId,
      title,
      description,
      primaryAssigneeId,
      priority,
      category,
      status,
      start_date,
      due_date,
      assigned_users
    );

    const updatedTask = await taskDb.getById(taskId);

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Only admin can delete
    if (session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    await taskDb.delete(taskId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
