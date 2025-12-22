import { NextRequest, NextResponse } from 'next/server';
import { userDb, taskDb, commentDb, chatDb } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

// ⚠️ IMPORTANTE: Esta ruta es temporal para ejecutar el seed
// Después de usarla, deberías deshabilitarla o protegerla con autenticación

export async function POST(request: NextRequest) {
    try {
        // Verificar que sea una petición autorizada (opcional pero recomendado)
        const authHeader = request.headers.get('authorization');
        const expectedToken = process.env.SEED_SECRET_TOKEN || 'temporary-seed-token-change-me';
        
        if (authHeader !== `Bearer ${expectedToken}`) {
            return NextResponse.json(
                { error: 'Unauthorized. Provide Authorization: Bearer <token>' },
                { status: 401 }
            );
        }

        console.log('🌱 Starting database seed...');

        // Create users
        const users = [
            {
                username: 'admin',
                password: 'admin123',
                full_name: 'Jefe de Marketing',
                role: 'admin',
                avatar_color: '#8B5CF6',
            },
            {
                username: 'diseñador',
                password: 'diseño123',
                full_name: 'Diseñador Gráfico',
                role: 'designer',
                avatar_color: '#EC4899',
            },
            {
                username: 'asistente',
                password: 'asist123',
                full_name: 'Asistente de Marketing',
                role: 'assistant',
                avatar_color: '#10B981',
            },
            {
                username: 'audiovisual',
                password: 'audio123',
                full_name: 'Especialista Audiovisual',
                role: 'audiovisual',
                avatar_color: '#F59E0B',
            },
        ];

        const createdUsers = [];
        for (const user of users) {
            try {
                // Verificar si el usuario ya existe
                const existing = await userDb.getByUsername(user.username);
                if (existing) {
                    console.log(`⚠️ User ${user.username} already exists, skipping...`);
                    createdUsers.push({ username: user.username, status: 'exists' });
                    continue;
                }

                const passwordHash = await hashPassword(user.password);
                await userDb.create(user.username, passwordHash, user.full_name, user.role, user.avatar_color);
                console.log(`✅ Created user: ${user.username}`);
                createdUsers.push({ username: user.username, status: 'created' });
            } catch (error: any) {
                console.error(`❌ Error creating user ${user.username}:`, error);
                createdUsers.push({ username: user.username, status: 'error', error: error.message });
            }
        }

        // Create sample tasks (solo si hay usuarios creados)
        const adminUser = await userDb.getByUsername('admin');
        if (adminUser) {
            const sampleTasks = [
                {
                    title: 'Diseño de banner para campaña de verano',
                    description: 'Crear banner promocional para redes sociales con temática de verano. Dimensiones: 1200x628px',
                    assigned_to: adminUser.id,
                    created_by: adminUser.id,
                    priority: 'high' as const,
                    category: 'design' as const,
                    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                },
            ];

            for (const task of sampleTasks) {
                try {
                    const { generateTaskId, getRolePrefix } = await import('@/lib/taskId');
                    const { counterDb } = await import('@/lib/db');

                    const assignedUser = await userDb.getById(task.assigned_to);
                    if (!assignedUser) continue;

                    const now = new Date();
                    const year = now.getFullYear();
                    const month = now.getMonth();
                    const rolePrefix = getRolePrefix(assignedUser.role);

                    const counter = await counterDb.incrementCounter(rolePrefix, year, month);
                    const task_id = generateTaskId(assignedUser.role, counter, now);

                    const dueDate = new Date(task.due_date);
                    const startDate = new Date(dueDate);
                    startDate.setDate(startDate.getDate() - 7);

                    await taskDb.create(
                        task_id,
                        task.title,
                        task.description,
                        task.assigned_to,
                        task.created_by,
                        task.priority,
                        task.category,
                        startDate.toISOString(),
                        task.due_date,
                        [task.assigned_to]
                    );
                    console.log(`✅ Created task: ${task.title}`);
                } catch (error: any) {
                    console.error(`❌ Error creating task:`, error);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Database seeded successfully',
            users: createdUsers,
        });
    } catch (error: any) {
        console.error('Seed error:', error);
        return NextResponse.json(
            { error: 'Seed failed', details: error.message },
            { status: 500 }
        );
    }
}
