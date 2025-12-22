import { NextRequest, NextResponse } from 'next/server';
import { taskDb, userDb, notificationDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { taskSchema, validateRequest } from '@/lib/validations';
import { dateStringToLimaISO, getLimaISOString, getLimaDateString } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const assignedTo = searchParams.get('assigned_to');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');

    // Get only root tasks (exclude child tasks of super tasks)
    let tasks = await taskDb.getRootTasks();

    // Apply filters
    if (assignedTo) {
      tasks = tasks.filter(t => t.assigned_to === parseInt(assignedTo));
    }
    if (status) {
      tasks = tasks.filter(t => t.status === status);
    }
    if (priority) {
      tasks = tasks.filter(t => t.priority === priority);
    }
    if (category) {
      tasks = tasks.filter(t => t.category === category);
    }

    // Sort tasks by created_at DESC (most recent first) - tasks are already sorted from db, but ensure consistency
    tasks.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      if (dateA !== dateB) return dateB - dateA; // Most recent first
      // If same creation date, sort by updated_at
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    // Enrich tasks with user information
    const enrichedTasks = await Promise.all(tasks.map(async (task) => {
      const assignedUsers = await taskDb.getAssignedUsers(task.id);
      const assignedUser = task.assigned_to ? await userDb.getById(task.assigned_to) : null;
      const createdByUser = await userDb.getById(task.created_by);

      return {
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
      };
    }));

    return NextResponse.json({ tasks: enrichedTasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    // Validate request body
    const validation = await validateRequest(request, taskSchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }
    const { title, description, assigned_to, priority, category, start_date, due_date, assigned_users } = validation.data;

    // Determine primary assignee (either assigned_to or first in assigned_users)
    const primaryAssigneeId = assigned_to || (assigned_users && assigned_users.length > 0 ? assigned_users[0] : null);

    if (!primaryAssigneeId) {
      return NextResponse.json(
        { error: 'At least one user must be assigned' },
        { status: 400 }
      );
    }

    // Get assigned user to determine role for task ID
    const assignedUser = await userDb.getById(primaryAssigneeId);
    if (!assignedUser) {
      return NextResponse.json(
        { error: 'Assigned user not found' },
        { status: 400 }
      );
    }

    // Generate task ID
    const { generateTaskId, getRolePrefix } = await import('@/lib/taskId');
    const { counterDb } = await import('@/lib/db');

    // Get current date/time in Lima timezone
    const nowLima = new Date(getLimaISOString());
    const year = nowLima.getFullYear();
    const month = nowLima.getMonth();
    const rolePrefix = getRolePrefix(assignedUser.role);

    const counter = await counterDb.incrementCounter(rolePrefix, year, month);
    const task_id = generateTaskId(assignedUser.role, counter, nowLima);

    // Calculate start_date if not provided (7 days before due_date or today in Lima)
    let calculatedStartDate = start_date ? dateStringToLimaISO(start_date) : null;
    if (!calculatedStartDate && due_date) {
      // Get due_date as date string in Lima, subtract 7 days
      const dueDateStr = dateStringToLimaISO(due_date);
      if (dueDateStr) {
        const dueDate = new Date(dueDateStr);
        const startDate = new Date(dueDate);
        startDate.setDate(startDate.getDate() - 7);
        calculatedStartDate = startDate.toISOString();
      }
    } else if (!calculatedStartDate) {
      calculatedStartDate = getLimaISOString();
    }
    
    // Ensure due_date is in Lima timezone
    const limaDueDate = due_date ? dateStringToLimaISO(due_date) : null;

    const result = await taskDb.create(
      task_id,
      title,
      description || null,
      primaryAssigneeId,
      session.id,
      priority,
      category,
      calculatedStartDate,
      limaDueDate,
      assigned_users || [primaryAssigneeId]
    );

    const task = await taskDb.getById(Number(result.lastInsertRowid));

    // Create notifications for assigned users (excluding creator)
    const allAssignees = assigned_users || [primaryAssigneeId];
    const notifyUsers = allAssignees.filter(id => id !== session.id);
    
    if (notifyUsers.length > 0) {
      const creatorName = session.full_name || 'Alguien';
      await notificationDb.createForMany(
        notifyUsers,
        'task_assigned',
        'Nueva tarea asignada',
        `${creatorName} te asignó: "${title}"`,
        `/tasks/${task?.id}`
      );
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
