import { userDb, taskDb, commentDb, chatDb } from './db';
import { hashPassword } from './auth';

async function seed() {
    console.log('🌱 Seeding database...');

    // Database schema is already created in Supabase
    console.log('✅ Database schema already exists in Supabase');

    // Create users
    const users = [
        {
            username: 'admin',
            password: 'admin123',
            full_name: 'Jefe de Marketing',
            role: 'admin',
            avatar_color: '#8B5CF6', // Purple
        },
        {
            username: 'diseñador',
            password: 'diseño123',
            full_name: 'Diseñador Gráfico',
            role: 'designer',
            avatar_color: '#EC4899', // Pink
        },
        {
            username: 'asistente',
            password: 'asist123',
            full_name: 'Asistente de Marketing',
            role: 'assistant',
            avatar_color: '#10B981', // Green
        },
        {
            username: 'audiovisual',
            password: 'audio123',
            full_name: 'Especialista Audiovisual',
            role: 'audiovisual',
            avatar_color: '#F59E0B', // Amber
        },
    ];

    for (const user of users) {
        const passwordHash = await hashPassword(user.password);
        await userDb.create(user.username, passwordHash, user.full_name, user.role, user.avatar_color);
        console.log(`✅ Created user: ${user.username}`);
    }

    // Create sample tasks
    const sampleTasks = [
        {
            title: 'Diseño de banner para campaña de verano',
            description: 'Crear banner promocional para redes sociales con temática de verano. Dimensiones: 1200x628px',
            assigned_to: 2, // Diseñador
            created_by: 1, // Admin
            priority: 'high',
            category: 'design',
            due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        },
        {
            title: 'Video promocional de producto nuevo',
            description: 'Producir video de 30 segundos para lanzamiento de producto. Incluir música y efectos.',
            assigned_to: 4, // Audiovisual
            created_by: 1,
            priority: 'urgent',
            category: 'video',
            due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        },
        {
            title: 'Calendario de contenido para redes sociales',
            description: 'Planificar y crear calendario de publicaciones para el próximo mes',
            assigned_to: 3, // Asistente
            created_by: 1,
            priority: 'medium',
            category: 'content',
            due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        },
        {
            title: 'Análisis de métricas de campaña anterior',
            description: 'Revisar KPIs y preparar informe de resultados',
            assigned_to: 3, // Asistente
            created_by: 1,
            priority: 'low',
            category: 'campaign',
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        },
        {
            title: 'Actualizar identidad visual de marca',
            description: 'Revisar y actualizar guía de estilo corporativa',
            assigned_to: 2, // Diseñador
            created_by: 1,
            priority: 'medium',
            category: 'design',
            due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
        },
    ];

    for (const task of sampleTasks) {
        // Generate task ID
        const { generateTaskId, getRolePrefix } = await import('./taskId');
        const { counterDb } = await import('./db');

        const assignedUser = await userDb.getById(task.assigned_to);
        if (!assignedUser) continue;

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const rolePrefix = getRolePrefix(assignedUser.role);

        const counter = await counterDb.incrementCounter(rolePrefix, year, month);
        const task_id = generateTaskId(assignedUser.role, counter, now);

        // Calculate start_date (7 days before due_date)
        const dueDate = new Date(task.due_date);
        const startDate = new Date(dueDate);
        startDate.setDate(startDate.getDate() - 7);

        const result = await taskDb.create(
            task_id,
            task.title,
            task.description,
            task.assigned_to,
            task.created_by,
            task.priority,
            task.category,
            startDate.toISOString(),
            task.due_date,
            [task.assigned_to] // assigned_users array
        );
        console.log(`✅ Created task: ${task.title}`);

        // Add a sample comment to first task
        if (result.lastInsertRowid === 1) {
            await commentDb.create(
                Number(result.lastInsertRowid),
                1,
                '¡Empecemos con este proyecto! Por favor confirma los detalles antes de comenzar.'
            );
        }
    }

    // Create sample chat messages
    const sampleMessages = [
        { user_id: 1, message: '¡Bienvenidos al equipo de marketing! 🎉' },
        { user_id: 2, message: 'Hola a todos, listo para trabajar en los diseños' },
        { user_id: 3, message: '¡Hola equipo! Emocionada de colaborar' },
        { user_id: 4, message: 'Saludos, equipo audiovisual reportándose' },
    ];

    for (const msg of sampleMessages) {
        await chatDb.create(msg.user_id, msg.message);
    }
    console.log('✅ Created sample chat messages');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Admin: admin / admin123');
    console.log('   Diseñador: diseñador / diseño123');
    console.log('   Asistente: asistente / asist123');
    console.log('   Audiovisual: audiovisual / audio123');
}

seed().catch(console.error);
