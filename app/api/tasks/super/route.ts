import { NextRequest, NextResponse } from 'next/server';
import { taskDb, notificationDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// Create a super task by grouping multiple tasks
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { title, task_ids } = body;

    if (!title || !task_ids || !Array.isArray(task_ids) || task_ids.length < 2) {
      return NextResponse.json(
        { error: 'Se requieren un título y al menos 2 tareas para crear una super tarea' },
        { status: 400 }
      );
    }

    // Verify all tasks exist and are not already in a super task
    for (const taskId of task_ids) {
      const task = await taskDb.getById(taskId);
      if (!task) {
        return NextResponse.json(
          { error: `Tarea con ID ${taskId} no encontrada` },
          { status: 404 }
        );
      }
      if (task.parent_task_id) {
        return NextResponse.json(
          { error: `La tarea ${taskId} ya está en una super tarea` },
          { status: 400 }
        );
      }
      if (task.is_super_task) {
        return NextResponse.json(
          { error: `La tarea ${taskId} es una super tarea y no puede ser agrupada` },
          { status: 400 }
        );
      }
    }

    // Create the super task
    const result = await taskDb.createSuperTask(title, session.id, task_ids);

    const superTask = await taskDb.getById(Number(result.lastInsertRowid));

    // Create notifications for users assigned to the tasks
    const allUserIds = new Set<number>();
    for (const taskId of task_ids) {
      const task = await taskDb.getById(taskId);
      if (task) {
        const assignedUsers = await taskDb.getAssignedUsers(task.id);
        assignedUsers.forEach(u => allUserIds.add(u.id));
      }
    }

    if (allUserIds.size > 0) {
      const notifyUsers = Array.from(allUserIds).filter(id => id !== session.id);
      if (notifyUsers.length > 0) {
        await notificationDb.createForMany(
          notifyUsers,
          'task_created',
          'Super tarea creada',
          `${session.full_name || 'Alguien'} creó la super tarea "${title}" con ${task_ids.length} tareas`,
          `/tasks/${superTask?.id}`
        );
      }
    }

    return NextResponse.json({ superTask }, { status: 201 });
  } catch (error: any) {
    console.error('Create super task error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear super tarea' },
      { status: 500 }
    );
  }
}

// Add a task to an existing super task
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { super_task_id, task_id, action } = body;

    if (action === 'add') {
      if (!super_task_id || !task_id) {
        return NextResponse.json(
          { error: 'Se requieren super_task_id y task_id' },
          { status: 400 }
        );
      }

      // Verify super task exists
      const superTask = await taskDb.getById(super_task_id);
      if (!superTask || !superTask.is_super_task) {
        return NextResponse.json(
          { error: 'Super tarea no encontrada' },
          { status: 404 }
        );
      }

      // Verify task exists and is not already in a super task
      const task = await taskDb.getById(task_id);
      if (!task) {
        return NextResponse.json(
          { error: 'Tarea no encontrada' },
          { status: 404 }
        );
      }
      if (task.parent_task_id) {
        return NextResponse.json(
          { error: 'La tarea ya está en una super tarea' },
          { status: 400 }
        );
      }
      if (task.is_super_task) {
        return NextResponse.json(
          { error: 'No se puede agregar una super tarea a otra super tarea' },
          { status: 400 }
        );
      }

      await taskDb.addTaskToSuperTask(super_task_id, task_id);

      // Create notification
      const assignedUsers = await taskDb.getAssignedUsers(task_id);
      const notifyUsers = assignedUsers.map(u => u.id).filter(id => id !== session.id);
      if (notifyUsers.length > 0) {
        await notificationDb.createForMany(
          notifyUsers,
          'task_activity',
          'Tarea agregada a super tarea',
          `${session.full_name || 'Alguien'} agregó "${task.title}" a la super tarea "${superTask.title}"`,
          `/tasks/${super_task_id}`
        );
      }

      return NextResponse.json({ success: true });
    } else if (action === 'remove') {
      if (!task_id) {
        return NextResponse.json(
          { error: 'Se requiere task_id' },
          { status: 400 }
        );
      }

      // Verify task exists and is in a super task
      const task = await taskDb.getById(task_id);
      if (!task) {
        return NextResponse.json(
          { error: 'Tarea no encontrada' },
          { status: 404 }
        );
      }
      if (!task.parent_task_id) {
        return NextResponse.json(
          { error: 'La tarea no está en una super tarea' },
          { status: 400 }
        );
      }

      await taskDb.removeTaskFromSuperTask(task_id);

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Acción no válida. Use "add" o "remove"' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Super task operation error:', error);
    return NextResponse.json(
      { error: error.message || 'Error en la operación' },
      { status: 500 }
    );
  }
}

