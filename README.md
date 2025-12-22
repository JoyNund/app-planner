# MKT Planner

Aplicación web para gestión de tareas y proyectos de marketing por áreas/departamentos.

## 🚀 Características

- **Gestión de Tareas**: Sistema completo de tareas con prioridades, categorías y estados
- **Super Tareas**: Agrupa múltiples tareas en contenedores para mejor organización
- **Chat de Equipo**: Comunicación en tiempo real entre miembros del equipo
- **Chat de IA por Tarea**: Asistente de IA integrado con Gemini para cada tarea (soporta imágenes y videos)
- **Notas**: Sistema de notas personales y compartidas
- **Checklist Diario**: Seguimiento de tareas diarias
- **Calendario**: Vista de calendario y Gantt para planificación
- **Notificaciones**: Sistema de notificaciones en tiempo real
- **Dashboard**: Vista general con estadísticas y métricas

## 🛠️ Tecnologías

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Backend**: Next.js API Routes
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Session-based con cookies
- **IA**: Google Gemini 1.5 Pro (multimodal - imágenes y videos)
- **Estilos**: CSS Variables, diseño responsive

## 📋 Requisitos Previos

- Node.js 20+
- npm o yarn
- Cuenta de Supabase
- API Key de Gemini (opcional, para funcionalidad de IA)

## 🔧 Instalación

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd mkt-planner
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
Crear archivo `.env.local` con:
```
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

4. Configurar base de datos:
- La migración SQL está en `supabase_migration.sql`
- Aplicar la migración en tu proyecto de Supabase

5. Ejecutar seed (opcional):
```bash
npx tsx lib/seed.ts
```

6. Iniciar servidor de desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3002`

## 🗄️ Base de Datos

El proyecto usa **Supabase (PostgreSQL)**. El esquema completo está en:
- `supabase_migration.sql` - Migración completa para Supabase
- `lib/schema.sql` - Esquema original (SQLite, referencia)

### Estructura Principal

- **users**: Usuarios del sistema
- **tasks**: Tareas principales
- **task_assignments**: Asignaciones múltiples de usuarios a tareas
- **task_comments**: Comentarios en tareas (timeline)
- **task_files**: Archivos adjuntos a tareas
- **task_ai_chat**: Historial de chat de IA por tarea
- **chat_messages**: Mensajes del chat global
- **notes**: Notas personales y compartidas
- **notifications**: Notificaciones del sistema
- **checklist_items**: Items del checklist diario
- **checklist_history**: Historial de checklists completados

## 📝 Scripts Disponibles

- `npm run dev` - Inicia servidor de desarrollo (puerto 3002)
- `npm run build` - Construye para producción
- `npm start` - Inicia servidor de producción (puerto 3003)
- `npm run lint` - Ejecuta el linter

## 🔐 Credenciales por Defecto (Seed)

Si ejecutas el seed, se crean estos usuarios:
- **Admin**: `admin` / `admin123`
- **Diseñador**: `diseñador` / `diseño123`
- **Asistente**: `asistente` / `asist123`
- **Audiovisual**: `audiovisual` / `audio123`

⚠️ **IMPORTANTE**: Cambiar estas contraseñas en producción.

## 📦 Estructura del Proyecto

```
mkt-planner/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Rutas del dashboard
│   └── api/                # API Routes
├── components/             # Componentes React
├── lib/                    # Utilidades y lógica
│   ├── db.ts              # Operaciones de base de datos (Supabase)
│   ├── supabase.ts        # Cliente de Supabase
│   └── schema.sql         # Esquema de referencia
├── public/                 # Archivos estáticos
├── scripts/                # Scripts de utilidad
└── supabase_migration.sql  # Migración para Supabase
```

## 🌐 Despliegue

### Variables de Entorno Requeridas

- `NEXT_PUBLIC_SUPABASE_URL`: URL de tu proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon key de Supabase

### Build de Producción

```bash
npm run build
npm start
```

## 📄 Licencia

Ver archivo LICENSE para más detalles.

## 🤝 Contribución

Este es un proyecto privado. Para contribuciones, contactar al administrador.

## 📞 Soporte

Para problemas o preguntas, crear un issue en el repositorio.
