# 🏗️ Prompt Detallado para Construcción Completa de MKT Planner

## 📋 DESCRIPCIÓN GENERAL DEL PROYECTO

Construye una **aplicación web completa de gestión de tareas y proyectos de marketing** llamada **MKT Planner**. Es una plataforma colaborativa diseñada para equipos de marketing que necesitan gestionar tareas, comunicarse en tiempo real, y usar inteligencia artificial para optimizar su trabajo.

**Tipo de Aplicación:** SaaS Web Application  
**Audiencia:** Equipos de marketing (diseñadores, asistentes, productores audiovisuales, administradores)  
**Idioma:** Español (interfaz y contenido)  
**Timezone:** America/Lima (Perú)

---

## 🛠️ STACK TECNOLÓGICO COMPLETO

### Frontend
- **Framework:** Next.js 16.0.10 (App Router)
- **UI Library:** React 19.2.0
- **Lenguaje:** TypeScript 5.x (strict mode)
- **Estilos:** CSS Variables (sistema de diseño personalizado, tema oscuro)
- **Iconos:** Lucide React 0.555.0
- **Markdown:** react-markdown 10.1.0 (para renderizar contenido de IA)

### Backend
- **Runtime:** Node.js 20+
- **API:** Next.js API Routes (RESTful)
- **Base de Datos:** Supabase (PostgreSQL)
- **Cliente BD:** @supabase/supabase-js 2.89.0

### Autenticación y Seguridad
- **Método:** Session-based con cookies HTTP-only
- **Hashing:** bcryptjs 3.0.3 (10 rounds)
- **Validación:** Zod 4.1.13 (schemas de validación)
- **Duración de sesión:** 7 días
- **Cookie name:** `mkt_session`

### Inteligencia Artificial
- **Proveedor:** DeepSeek API (alternativa económica a OpenAI)
- **Modelo:** deepseek-chat (multimodal - soporta imágenes y videos)
- **SDK:** Llamadas HTTP directas a `https://api.deepseek.com/v1/chat/completions`
- **API Key:** Variable de entorno `DEEPSEEK_API_KEY`

### Utilidades
- **Timezone:** cross-env para configurar TZ=America/Lima
- **Linting:** ESLint con eslint-config-next

---

## 🗄️ ESTRUCTURA DE BASE DE DATOS (PostgreSQL/Supabase)

### Tablas Principales (17 tablas)

#### 1. users
```sql
- id: SERIAL PRIMARY KEY
- username: TEXT UNIQUE NOT NULL
- password_hash: TEXT NOT NULL
- full_name: TEXT NOT NULL
- role: TEXT NOT NULL (admin, designer, assistant, audiovisual, custom)
- avatar_color: TEXT NOT NULL (hex color)
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### 2. tasks
```sql
- id: SERIAL PRIMARY KEY
- task_id: TEXT (ID personalizado: DES-2025-01-001)
- title: TEXT NOT NULL
- description: TEXT
- assigned_to: INTEGER NOT NULL (FK users)
- created_by: INTEGER NOT NULL (FK users)
- priority: TEXT CHECK('urgent', 'high', 'medium', 'low')
- category: TEXT CHECK('design', 'content', 'video', 'campaign', 'social', 'other')
- status: TEXT DEFAULT 'pending' CHECK('pending', 'in_progress', 'completed')
- admin_approved: INTEGER DEFAULT 0
- start_date: TIMESTAMP
- due_date: TIMESTAMP
- parent_task_id: INTEGER (FK tasks, para super tareas)
- is_super_task: INTEGER DEFAULT 0
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### 3. task_assignments (Asignación múltiple)
```sql
- task_id: INTEGER NOT NULL (FK tasks)
- user_id: INTEGER NOT NULL (FK users)
- assigned_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- PRIMARY KEY (task_id, user_id)
```

#### 4. task_comments (Timeline de tareas)
```sql
- id: SERIAL PRIMARY KEY
- task_id: INTEGER NOT NULL (FK tasks)
- user_id: INTEGER NOT NULL (FK users)
- content: TEXT NOT NULL
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### 5. task_files (Archivos adjuntos)
```sql
- id: SERIAL PRIMARY KEY
- task_id: INTEGER NOT NULL (FK tasks)
- user_id: INTEGER NOT NULL (FK users)
- filename: TEXT NOT NULL
- filepath: TEXT NOT NULL
- file_type: TEXT NOT NULL
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### 6. task_ai_chat (Chat de IA por tarea)
```sql
- id: SERIAL PRIMARY KEY
- task_id: INTEGER NOT NULL (FK tasks)
- role: TEXT CHECK('user', 'assistant', 'system')
- content: TEXT NOT NULL
- media_files: TEXT (JSON array de archivos multimedia)
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### 7. chat_messages (Chat global del equipo)
```sql
- id: SERIAL PRIMARY KEY
- user_id: INTEGER NOT NULL (FK users)
- message: TEXT
- message_type: TEXT DEFAULT 'text' ('text', 'sticker', 'image', 'voice')
- file_path: TEXT
- sticker_id: TEXT
- referenced_tasks: TEXT (JSON array de task_ids mencionados)
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### 8. notes (Notas personales y por tarea)
```sql
- id: SERIAL PRIMARY KEY
- user_id: INTEGER NOT NULL (FK users)
- task_id: INTEGER (FK tasks, nullable)
- content: TEXT NOT NULL
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### 9. note_shares (Compartir notas)
```sql
- id: SERIAL PRIMARY KEY
- note_id: INTEGER NOT NULL (FK notes)
- shared_with_user_id: INTEGER NOT NULL (FK users)
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- UNIQUE(note_id, shared_with_user_id)
```

#### 10. notifications (Notificaciones)
```sql
- id: SERIAL PRIMARY KEY
- user_id: INTEGER NOT NULL (FK users)
- type: TEXT NOT NULL
- title: TEXT NOT NULL
- message: TEXT NOT NULL
- link: TEXT
- is_read: BOOLEAN DEFAULT FALSE
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### 11. checklist_items (Checklist diario)
```sql
- id: SERIAL PRIMARY KEY
- user_id: INTEGER NOT NULL (FK users)
- content: TEXT NOT NULL
- is_completed: BOOLEAN DEFAULT FALSE
- date: TEXT NOT NULL (YYYY-MM-DD)
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### 12. checklist_history (Historial de checklists)
```sql
- id: SERIAL PRIMARY KEY
- user_id: INTEGER NOT NULL (FK users)
- date: TEXT NOT NULL (YYYY-MM-DD)
- content: TEXT NOT NULL
- completed_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### 13. settings (Configuración de la app)
```sql
- id: INTEGER PRIMARY KEY CHECK (id = 1)
- app_name: TEXT DEFAULT 'MKT Planner'
- logo_url: TEXT
- theme_colors: TEXT DEFAULT '{}' (JSON)
- ai_prompt_master: TEXT
```

#### 14. task_counters (Contadores para IDs personalizados)
```sql
- id: SERIAL PRIMARY KEY
- role_prefix: TEXT NOT NULL (ej: 'DES', 'CON', 'VID')
- year: INTEGER NOT NULL
- month: INTEGER NOT NULL
- counter: INTEGER DEFAULT 0
- UNIQUE(role_prefix, year, month)
```

#### 15. sticker_packs (Packs de stickers)
```sql
- id: SERIAL PRIMARY KEY
- name: TEXT NOT NULL
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### 16. stickers (Stickers individuales)
```sql
- id: SERIAL PRIMARY KEY
- pack_id: INTEGER NOT NULL (FK sticker_packs)
- filename: TEXT NOT NULL
- filepath: TEXT NOT NULL
```

#### 17. ai_prompts_by_sector (Prompts de IA por sector)
```sql
- id: SERIAL PRIMARY KEY
- sector: TEXT NOT NULL UNIQUE
- prompt_master: TEXT NOT NULL
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### Índices Requeridos
```sql
- idx_tasks_assigned_to ON tasks(assigned_to)
- idx_tasks_created_by ON tasks(created_by)
- idx_tasks_due_date ON tasks(due_date)
- idx_tasks_task_id ON tasks(task_id)
- idx_tasks_parent_task_id ON tasks(parent_task_id)
- idx_task_comments_task_id ON task_comments(task_id)
- idx_task_files_task_id ON task_files(task_id)
- idx_chat_messages_created_at ON chat_messages(created_at)
- idx_notifications_user_id ON notifications(user_id)
- idx_notifications_is_read ON notifications(is_read)
- idx_checklist_history_user_id ON checklist_history(user_id)
- idx_checklist_history_date ON checklist_history(date)
- idx_task_ai_chat_task_id ON task_ai_chat(task_id)
- idx_task_ai_chat_created_at ON task_ai_chat(created_at)
```

---

## 🎨 DISEÑO Y UX

### Tema Visual
- **Estilo:** Tema oscuro moderno (glassmorphism)
- **Colores principales:**
  - Background: `#0f0f23` (primary), `#1a1a2e` (secondary), `#252540` (tertiary)
  - Accent: `#8b5cf6` (púrpura), `#ec4899` (rosa)
  - Texto: `#ffffff` (primary), `#a0a0c0` (secondary), `#6b6b8f` (muted)

### Características de Diseño
- **Glassmorphism:** Efectos de vidrio con blur y transparencia
- **Gradientes:** Uso de gradientes púrpura-rosa para elementos destacados
- **Sombras:** Sistema de sombras con múltiples niveles
- **Responsive:** Diseño adaptativo para móvil y desktop
- **Animaciones:** Transiciones suaves (0.3s ease)
- **Tipografía:** Inter (Google Fonts)

### Componentes UI Principales
- Cards con efecto glassmorphism
- Badges para prioridades y categorías
- Botones con estados hover/active
- Modales con backdrop blur
- Sidebar colapsable
- Chat flotante (desktop y móvil)
- Formularios con validación visual

---

## 🔐 SISTEMA DE AUTENTICACIÓN

### Implementación
- **Método:** Session-based con cookies HTTP-only
- **Hashing:** bcryptjs con 10 rounds
- **Cookie:** `mkt_session` (httpOnly, SameSite: 'lax')
- **Duración:** 7 días
- **Contenido de sesión:** `{ id, username, full_name, role, avatar_color }`

### Roles del Sistema
1. **admin** - Acceso completo, gestión de usuarios, configuración
2. **designer** - Diseñador gráfico
3. **assistant** - Asistente de marketing
4. **audiovisual** - Productor audiovisual
5. **custom** - Roles personalizados permitidos

### Middleware de Autorización
- `requireAuth()` - Valida sesión activa
- `requireAdmin()` - Requiere rol admin
- Validación en cada API route

---

## 📱 FUNCIONALIDADES PRINCIPALES

### 1. Gestión de Tareas

#### Características
- **CRUD completo:** Crear, leer, actualizar, eliminar tareas
- **IDs personalizados:** Generación automática por rol (ej: DES-2025-01-001)
  - DES = Designer
  - CON = Content/Assistant
  - VID = Audiovisual
  - CAM = Campaign
- **Asignación múltiple:** Múltiples usuarios por tarea (tabla `task_assignments`)
- **Prioridades:** urgent, high, medium, low
- **Categorías:** design, content, video, campaign, social, other
- **Estados:** pending, in_progress, completed
- **Fechas:** start_date, due_date
- **Aprobación admin:** Campo `admin_approved` para tareas completadas
- **Super Tareas:** Agrupar múltiples tareas en un contenedor
  - Campo `is_super_task` (0 o 1)
  - Campo `parent_task_id` para tareas hijas
  - Estado de super tarea se actualiza automáticamente cuando todas las hijas se completan

#### Vista de Detalle de Tarea
- Header con ID, badges de prioridad/categoría
- Tabs: Descripción, Timeline
- Timeline con comentarios y archivos
- Selector de estado fijo en la parte inferior
- Botón de aprobación (solo admin) si está pendiente
- Notas relacionadas en sidebar
- Chat de IA flotante (botón en esquina inferior derecha)

### 2. Dashboard

#### Características
- **Estadísticas en tiempo real:**
  - Total de tareas
  - Tareas pendientes
  - Tareas en progreso
  - Tareas completadas
  - Tareas por prioridad
  - Tareas por categoría
- **Filtros avanzados:**
  - Por usuario asignado
  - Por prioridad
  - Por categoría
  - Por estado
  - Búsqueda por texto
- **Vistas:**
  - General (lista de tareas)
  - Semanal
  - Diaria
  - Histórica
- **Persistencia:** Filtros guardados en localStorage
- **Cards de tareas:** Con badges, avatares, fechas

### 3. Calendario

#### Características
- **Vista mensual:** Calendario con tareas visualizadas
- **Colores por prioridad:** Diferentes colores según prioridad
- **Navegación:** Mes anterior/siguiente
- **Click en día:** Filtrar tareas de ese día
- **Responsive:** Adaptado para móvil y desktop

### 4. Vista Gantt

#### Características
- **Diagrama de Gantt:** Visualización de tareas con fechas
- **Barras horizontales:** Representan duración de tareas
- **Colores por prioridad:** Visualización rápida
- **Scroll horizontal:** Para navegar en el tiempo
- **Responsive:** Versión móvil simplificada

### 5. Chat Global de Equipo

#### Características
- **Mensajes de texto:** Chat en tiempo real
- **Stickers:** Sistema de stickers con packs
- **Imágenes:** Subida y visualización de imágenes
- **Notas de voz:** Grabación WebM, reproducción en el chat
- **Menciones de tareas:** @task_id que se convierte en link
- **Historial persistente:** Últimos 100 mensajes
- **Auto-scroll:** Scroll automático a nuevos mensajes
- **UI flotante:** Chat flotante en desktop y móvil
- **Posicionamiento:** Esquina inferior derecha, responsive

### 6. Chat de IA por Tarea

#### Características
- **Chat dedicado:** Un chat de IA por cada tarea
- **Generación automática:** Plan de acción inicial al abrir tarea sin historial
- **Multimodal:** Soporta imágenes y videos
- **Historial persistente:** Conversaciones guardadas por tarea
- **Botón de limpiar:** Limpia historial y regenera plan inicial
- **UI flotante:** Botón flotante en esquina inferior derecha (a la izquierda del chat global)
- **Integración:** DeepSeek API para respuestas

#### Flujo de Chat de IA
1. Usuario abre tarea → Si no hay historial, se genera plan inicial automáticamente
2. Usuario puede enviar mensajes de texto
3. Usuario puede adjuntar imágenes/videos
4. IA responde con markdown renderizado
5. Historial se guarda en `task_ai_chat`

### 7. Sistema de Notas

#### Características
- **Notas personales:** Notas del usuario
- **Notas por tarea:** Notas relacionadas con una tarea específica
- **Compartir notas:** Compartir notas con otros usuarios
- **Editor en tiempo real:** Edición inline
- **Widget en sidebar:** Widget de notas en vista de tarea

### 8. Checklist Diario

#### Características
- **Items diarios:** Checklist personal por usuario y fecha
- **Toggle completado:** Marcar/desmarcar items
- **Historial:** Historial de checklists completados
- **Estadísticas:** Métricas de productividad
- **Widget flotante:** Checklist flotante en dashboard
- **Persistencia:** Items guardados por fecha (YYYY-MM-DD)

### 9. Sistema de Notificaciones

#### Características
- **Notificaciones en tiempo real:** Actualización automática
- **Tipos:**
  - task_created
  - task_completed
  - task_assigned
  - task_comment
  - task_file
  - note_shared
- **Campana de notificaciones:** Icono con contador
- **Marcar como leído:** Sistema de lectura/no leído
- **Links:** Notificaciones con links a recursos

### 10. Gestión de Usuarios (Admin)

#### Características
- **CRUD de usuarios:** Crear, editar, eliminar usuarios
- **Asignación de roles:** Cambiar roles de usuarios
- **Estadísticas por usuario:** Tareas completadas, pendientes, en progreso
- **Avatares:** Colores personalizados por usuario
- **Solo admin:** Acceso restringido a administradores

### 11. Configuración (Admin)

#### Características
- **Nombre de app:** Personalizable
- **Logo:** URL del logo
- **Colores del tema:** JSON con colores personalizados
- **Prompts de IA:** Configuración de prompts maestros

---

## 🔌 API ENDPOINTS (33 endpoints)

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/session` - Obtener sesión actual

### Tareas
- `GET /api/tasks` - Listar tareas (con filtros query params)
- `POST /api/tasks` - Crear tarea
- `GET /api/tasks/[id]` - Obtener tarea específica
- `PUT /api/tasks/[id]` - Actualizar tarea
- `DELETE /api/tasks/[id]` - Eliminar tarea
- `PUT /api/tasks/[id]/status` - Cambiar estado (con aprobación opcional)
- `POST /api/tasks/super` - Crear super tarea
- `GET /api/tasks/[id]/comments` - Obtener comentarios
- `POST /api/tasks/[id]/comments` - Agregar comentario
- `GET /api/tasks/[id]/files` - Obtener archivos
- `POST /api/tasks/[id]/files` - Subir archivo
- `GET /api/tasks/[id]/checklist` - Obtener checklist de tarea
- `POST /api/tasks/[id]/checklist` - Agregar item a checklist

### Inteligencia Artificial
- `POST /api/ai/chat` - Chat con IA (soporta FormData para archivos)
- `POST /api/ai/chat/upload` - Subir archivo multimedia para IA
- `DELETE /api/ai/chat?taskId=X` - Limpiar historial de chat de IA
- `POST /api/ai/generate-plan` - Generar plan de acción inicial

### Chat Global
- `GET /api/chat` - Obtener mensajes (últimos 100)
- `POST /api/chat` - Enviar mensaje
- `POST /api/chat/files` - Subir archivo al chat
- `DELETE /api/chat/clear` - Limpiar chat global (admin)

### Usuarios
- `GET /api/users` - Listar usuarios (con estadísticas)
- `GET /api/users/list` - Lista simple de usuarios
- `GET /api/users/[id]` - Obtener usuario
- `POST /api/users` - Crear usuario (admin)
- `PUT /api/users/[id]` - Actualizar usuario (admin)
- `DELETE /api/users/[id]` - Eliminar usuario (admin)

### Notas
- `GET /api/notes` - Listar notas (con query params para task_id)
- `POST /api/notes` - Crear nota
- `GET /api/notes/[id]` - Obtener nota
- `PUT /api/notes/[id]` - Actualizar nota
- `DELETE /api/notes/[id]` - Eliminar nota
- `POST /api/notes/[id]/share` - Compartir nota

### Checklist
- `GET /api/checklist` - Obtener checklist del día (query param: date)
- `POST /api/checklist` - Crear item
- `PUT /api/checklist` - Toggle item (completar/descompletar)
- `DELETE /api/checklist` - Eliminar item
- `GET /api/checklist/history` - Historial de checklists
- `GET /api/checklist/stats` - Estadísticas de productividad

### Otros
- `GET /api/notifications` - Obtener notificaciones del usuario
- `PUT /api/notifications` - Marcar notificaciones como leídas
- `GET /api/settings` - Obtener configuración
- `PUT /api/settings` - Actualizar configuración (admin)
- `GET /api/stats/pending` - Estadísticas de tareas pendientes
- `GET /api/stats/history` - Estadísticas históricas
- `GET /api/stickers` - Listar stickers y packs
- `GET /api/uploads/[...path]` - Servir archivos estáticos

---

## 🏗️ ARQUITECTURA Y ESTRUCTURA

### Estructura de Directorios

```
app-planner/
├── app/                          # Next.js App Router
│   ├── (dashboard)/             # Rutas protegidas (layout con sidebar)
│   │   ├── layout.tsx          # Layout del dashboard (sidebar, chat, etc.)
│   │   ├── dashboard/           # Dashboard principal
│   │   │   └── page.tsx
│   │   ├── calendar/            # Vista de calendario
│   │   │   └── page.tsx
│   │   ├── chat/               # Página de chat (opcional)
│   │   │   └── page.tsx
│   │   ├── checklist-history/  # Historial de checklists
│   │   │   └── page.tsx
│   │   ├── notes/              # Notas personales
│   │   │   └── page.tsx
│   │   ├── settings/           # Configuración
│   │   │   └── page.tsx
│   │   ├── tasks/              # Gestión de tareas
│   │   │   ├── [id]/           # Vista de detalle de tarea
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx        # Lista de tareas (si existe)
│   │   └── users/              # Gestión de usuarios (admin)
│   │       └── page.tsx
│   ├── api/                     # API Routes
│   │   ├── ai/                  # Endpoints de IA
│   │   │   ├── chat/
│   │   │   │   ├── route.ts
│   │   │   │   └── upload/route.ts
│   │   │   └── generate-plan/route.ts
│   │   ├── auth/                # Autenticación
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   └── session/route.ts
│   │   ├── chat/                # Chat global
│   │   │   ├── route.ts
│   │   │   ├── clear/route.ts
│   │   │   └── files/route.ts
│   │   ├── checklist/           # Checklist
│   │   │   ├── route.ts
│   │   │   ├── history/route.ts
│   │   │   └── stats/route.ts
│   │   ├── notes/               # Notas
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── share/route.ts
│   │   ├── tasks/               # Tareas
│   │   │   ├── route.ts
│   │   │   ├── super/route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── status/route.ts
│   │   │       ├── comments/route.ts
│   │   │       ├── files/route.ts
│   │   │       └── checklist/route.ts
│   │   ├── users/               # Usuarios
│   │   │   ├── route.ts
│   │   │   ├── list/route.ts
│   │   │   └── [id]/route.ts
│   │   ├── notifications/route.ts
│   │   ├── settings/route.ts
│   │   ├── stats/
│   │   │   ├── pending/route.ts
│   │   │   └── history/route.ts
│   │   ├── stickers/route.ts
│   │   └── uploads/[...path]/route.ts
│   ├── login/                   # Página de login
│   │   └── page.tsx
│   ├── layout.tsx               # Layout raíz (AuthProvider, SettingsProvider)
│   ├── page.tsx                 # Página principal (redirect a dashboard)
│   └── globals.css               # Estilos globales y variables CSS
│
├── components/                   # Componentes React (30+ componentes)
│   ├── AuthProvider.tsx         # Context de autenticación
│   ├── SettingsProvider.tsx     # Context de configuración
│   ├── ErrorBoundary.tsx        # Manejo de errores
│   ├── Sidebar.tsx              # Barra lateral de navegación
│   ├── MobileNavbar.tsx         # Navbar para móvil
│   ├── TaskCard.tsx             # Tarjeta de tarea
│   ├── SuperTaskCard.tsx        # Tarjeta de super tarea
│   ├── TaskFormModal.tsx       # Modal de crear/editar tarea
│   ├── TaskModalContext.tsx    # Context para modales de tareas
│   ├── TaskTimeline.tsx         # Timeline de comentarios y archivos
│   ├── TaskChecklist.tsx        # Checklist dentro de tarea
│   ├── TaskAIAssistant.tsx      # Componente de chat de IA
│   ├── TaskAIChat.tsx           # Widget flotante de chat de IA
│   ├── GlobalChat.tsx           # Widget flotante de chat global
│   ├── ChatBox.tsx              # Componente de chat
│   ├── NotesWidget.tsx          # Widget de notas
│   ├── DailyChecklist.tsx       # Checklist diario
│   ├── DailyChecklistFloating.tsx # Checklist flotante
│   ├── ChecklistHistory.tsx     # Historial de checklists
│   ├── Calendar.tsx             # Calendario mensual
│   ├── CalendarMobile.tsx       # Calendario móvil
│   ├── GanttView.tsx            # Vista Gantt
│   ├── GanttViewMobile.tsx      # Vista Gantt móvil
│   ├── PriorityBadge.tsx        # Badge de prioridad
│   ├── CategoryBadge.tsx        # Badge de categoría
│   ├── UserAvatar.tsx           # Avatar de usuario
│   ├── UserFormModal.tsx       # Modal de crear/editar usuario
│   ├── UserModalContext.tsx     # Context para modales de usuarios
│   ├── NotificationBell.tsx     # Campana de notificaciones
│   ├── useNotifications.ts       # Hook de notificaciones
│   ├── StickerPicker.tsx        # Selector de stickers
│   ├── VoiceRecorder.tsx        # Grabador de voz
│   ├── TaskMentionInput.tsx     # Input con menciones de tareas
│   ├── EfficiencyBar.tsx        # Barra de eficiencia
│   └── linkify.tsx              # Componente para convertir texto en links
│
├── lib/                         # Lógica de negocio
│   ├── supabase.ts             # Cliente de Supabase y tipos
│   ├── db.ts                   # Operaciones de base de datos (wrappers de Supabase)
│   ├── auth.ts                 # Autenticación y sesiones
│   ├── validations.ts           # Schemas de validación con Zod
│   ├── taskId.ts                # Generación de IDs personalizados
│   ├── taskMentions.ts          # Procesamiento de menciones de tareas
│   ├── metrics.ts               # Cálculo de métricas
│   ├── dateUtils.ts             # Utilidades de fechas
│   ├── utils.ts                 # Utilidades generales
│   └── seed.ts                  # Script de población de datos
│
├── public/                      # Archivos estáticos
│   └── uploads/                 # Archivos subidos por usuarios
│       └── chat/                # Archivos del chat
│
├── scripts/                     # Scripts de utilidad
│   ├── seed.ts                  # Población de datos
│   ├── init-db.ts               # Inicialización de BD
│   └── ...                      # Otros scripts
│
├── supabase_migration.sql       # Migración completa de Supabase
├── package.json                 # Dependencias
├── tsconfig.json                # Configuración TypeScript
├── next.config.ts               # Configuración Next.js
└── .env.local                   # Variables de entorno (no commitear)
```

---

## 🎯 FUNCIONALIDADES DETALLADAS

### Sistema de IDs Personalizados de Tareas

**Formato:** `{PREFIX}-{YYYY}-{MM}-{NNN}`

**Prefijos por rol:**
- DES = Designer
- CON = Assistant/Content
- VID = Audiovisual
- CAM = Campaign
- SOC = Social
- OTH = Other

**Implementación:**
- Tabla `task_counters` para tracking de contadores por mes/año
- Función `generateTaskId(role, title)` en `lib/taskId.ts`
- Incremento automático del contador
- Reset mensual del contador

### Super Tareas

**Características:**
- Una tarea puede ser marcada como `is_super_task = 1`
- Otras tareas pueden tener `parent_task_id` apuntando a la super tarea
- Estado de super tarea se calcula automáticamente:
  - Si todas las hijas están completadas → super tarea completada
  - Si alguna hija está en progreso → super tarea en progreso
  - Si todas están pendientes → super tarea pendiente
- Vista especial: Solo muestra tareas hijas en tabs
- Estado de super tarea es read-only (se actualiza automáticamente)

### Sistema de Menciones en Chat

**Formato:** `@task_id` (ej: @DES-2025-01-001)

**Funcionalidad:**
- Detección automática de menciones en mensajes
- Conversión a links clickeables
- Almacenamiento en `referenced_tasks` (JSON array)
- Visualización con badge de tarea mencionada

### Sistema de Archivos

**Características:**
- Subida de archivos a `/public/uploads/`
- Validación:
  - Tipos permitidos: imágenes (jpeg, png, gif, webp), audio (webm, mp3, wav), documentos (pdf, doc, docx, xls, xlsx)
  - Tamaño máximo: 10MB
  - Sanitización de nombres de archivo
- Almacenamiento en `task_files` o `chat_messages`
- Servicio estático en `/api/uploads/[...path]`

### Sistema de Notificaciones

**Tipos de notificaciones:**
- `task_created` - Nueva tarea creada
- `task_completed` - Tarea completada
- `task_assigned` - Tarea asignada
- `task_comment` - Nuevo comentario en tarea
- `task_file` - Nuevo archivo en tarea
- `note_shared` - Nota compartida

**Características:**
- Creación automática en eventos relevantes
- Polling cada 5 segundos para actualización
- Campana con contador de no leídas
- Marcar como leído individual o masivo

---

## 🔒 SEGURIDAD Y VALIDACIONES

### Validaciones con Zod

**Schemas implementados:**
- `loginSchema` - Validación de login
- `taskSchema` - Validación de tarea
- `taskUpdateSchema` - Validación de actualización de tarea
- `taskCommentSchema` - Validación de comentario
- `userSchema` - Validación de usuario
- `chatMessageSchema` - Validación de mensaje de chat
- `noteSchema` - Validación de nota
- `checklistItemSchema` - Validación de item de checklist
- `settingsSchema` - Validación de configuración

**Helper:** `validateRequest()` para validar requests en API routes

### Validación de Archivos

**Constantes:**
- `MAX_FILE_SIZE = 10MB`
- `ALLOWED_IMAGE_TYPES`
- `ALLOWED_AUDIO_TYPES`
- `ALLOWED_DOCUMENT_TYPES`

**Función:** `validateFile(file)` retorna `{ valid: boolean, error?: string }`

### Seguridad de Cookies

- `httpOnly: true` (previene XSS)
- `sameSite: 'lax'` (previene CSRF parcialmente)
- `secure: false` en desarrollo, `true` en producción
- Expiración: 7 días

---

## 🎨 COMPONENTES UI ESPECÍFICOS

### Sidebar
- **Ancho:** 260px (variable CSS `--sidebar-width`)
- **Colapsable:** En móvil se oculta automáticamente
- **Navegación:** Links a todas las secciones
- **Usuario:** Avatar y nombre en la parte inferior
- **Logout:** Botón de cerrar sesión

### Chat Flotante (Global)
- **Posición:** Esquina inferior derecha
- **Estado:** Abierto/cerrado con botón flotante
- **Responsive:** 
  - Desktop: Ventana flotante 380-400px
  - Móvil: Pantalla completa
- **Auto-scroll:** Scroll automático a nuevos mensajes
- **Input:** Texto, stickers, imágenes, voz

### Chat de IA Flotante
- **Posición:** A la izquierda del chat global (cuando ambos cerrados)
- **Estado:** Abierto/cerrado con botón flotante
- **Header:** Botón de limpiar chat (icono Trash2)
- **Contenido:** Mensajes con markdown renderizado
- **Input:** Texto + adjuntar imágenes/videos

### Cards de Tareas
- **Información mostrada:**
  - ID de tarea (task_id)
  - Título
  - Badges de prioridad y categoría
  - Avatar del usuario asignado
  - Fecha de vencimiento
  - Estado
- **Acciones:** Click para abrir detalle

### Modal de Tarea
- **Formularios:** Crear/editar tarea
- **Campos:**
  - Título (requerido)
  - Descripción (opcional, soporta markdown)
  - Asignación múltiple (multi-select)
  - Prioridad (select)
  - Categoría (select)
  - Fecha de inicio (date picker)
  - Fecha de vencimiento (date picker)
  - Super tarea (checkbox + select de tarea padre)

---

## 📱 RESPONSIVE DESIGN

### Breakpoints
- **Mobile:** < 768px
- **Desktop:** >= 768px

### Adaptaciones Móviles
- Sidebar oculto por defecto (hamburger menu)
- Chat flotante a pantalla completa
- Calendario simplificado
- Gantt simplificado
- Formularios adaptados
- Botones más grandes para touch

---

## 🔧 CONFIGURACIÓN Y VARIABLES DE ENTORNO

### Variables Requeridas

```env
# Supabase (OBLIGATORIO)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxx
# O usar anon key legacy: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# DeepSeek API (OPCIONAL - para funcionalidad de IA)
DEEPSEEK_API_KEY=sk-xxxxx

# Timezone (OPCIONAL)
TZ=America/Lima
```

### Scripts NPM

```json
{
  "dev": "cross-env TZ=America/Lima next dev -p 3002",
  "build": "cross-env TZ=America/Lima next build",
  "start": "cross-env TZ=America/Lima next start -p 3003",
  "lint": "eslint"
}
```

---

## 🚀 DEPLOYMENT Y PRODUCCIÓN

### Requisitos de Deployment
- **Plataforma:** Vercel, Netlify, o servidor Node.js
- **Node.js:** 20+
- **Base de datos:** Supabase (PostgreSQL)
- **Storage:** Sistema de archivos local o S3 (para uploads)

### Pasos de Deployment
1. Crear proyecto en Supabase
2. Aplicar migración `supabase_migration.sql`
3. Configurar variables de entorno
4. Ejecutar `npm run build`
5. Deploy a plataforma
6. Configurar variables de entorno en plataforma
7. Ejecutar seed (opcional): `npx tsx lib/seed.ts`

### Archivos Estáticos
- Uploads se guardan en `/public/uploads/`
- En producción, considerar usar Supabase Storage o S3

---

## 📊 CARACTERÍSTICAS TÉCNICAS ESPECÍFICAS

### Generación de IDs de Tareas

**Lógica:**
1. Extraer prefijo del rol del usuario
2. Obtener año y mes actual
3. Consultar/incrementar contador en `task_counters`
4. Formatear: `{PREFIX}-{YYYY}-{MM}-{NNN}` (NNN con padding de 3 dígitos)

**Ejemplo:** Usuario con rol "designer" crea tarea en enero 2025 → `DES-2025-01-001`

### Sistema de Super Tareas

**Lógica de estado:**
```typescript
// Pseudocódigo
if (superTask.child_tasks.length === 0) {
  status = 'pending'
} else if (all child tasks are 'completed') {
  status = 'completed'
} else if (any child task is 'in_progress') {
  status = 'in_progress'
} else {
  status = 'pending'
}
```

### Chat de IA - Generación de Plan Inicial

**Prompt base:**
```
Genera un plan de acción para esta tarea: {taskTitle}
{taskDescription si existe}
```

**Flujo:**
1. Usuario abre tarea sin historial de chat
2. Se detecta que no hay mensajes
3. Se llama automáticamente a `/api/ai/chat` con `isInitialPlan: true`
4. Se genera plan y se guarda en `task_ai_chat`
5. Se muestra al usuario

### Sistema de Polling

**Endpoints con polling:**
- Dashboard: Actualiza tareas cada 5 segundos
- Vista de tarea: Actualiza comentarios/archivos cada 5 segundos
- Chat: Actualiza mensajes cada 3 segundos
- Notificaciones: Actualiza cada 5 segundos

**Optimización:** Solo polling cuando modal está cerrado

---

## 🎨 ESPECIFICACIONES DE DISEÑO

### Sistema de Colores

**Backgrounds:**
- Primary: `#0f0f23`
- Secondary: `#1a1a2e`
- Tertiary: `#252540`
- Hover: `#2d2d4a`

**Accents:**
- Primary: `#8b5cf6` (púrpura)
- Secondary: `#ec4899` (rosa)
- Gradient: `linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)`

**Prioridades:**
- Urgent: `#ef4444` (rojo)
- High: `#f97316` (naranja)
- Medium: `#eab308` (amarillo)
- Low: `#22c55e` (verde)

**Categorías:**
- Design: `#ec4899` (rosa)
- Content: `#8b5cf6` (púrpura)
- Video: `#f59e0b` (ámbar)
- Campaign: `#3b82f6` (azul)
- Social: `#10b981` (verde)
- Other: `#6b7280` (gris)

### Glassmorphism

**Efectos aplicados:**
- `backdrop-filter: blur(var(--blur-amount))`
- `background: var(--glass-bg)` (con transparencia)
- `border: 1px solid var(--glass-border)`
- Múltiples niveles: `glass-bg`, `glass-bg-medium`, `glass-bg-strong`

### Espaciado

**Sistema de spacing:**
- `--spacing-xs: 4px`
- `--spacing-sm: 8px`
- `--spacing-md: 16px`
- `--spacing-lg: 24px`
- `--spacing-xl: 32px`
- `--spacing-2xl: 48px`

### Tipografía

**Fuente:** Inter (Google Fonts)
**Tamaños:**
- H1: 1.5rem - 2rem
- H2: 1.25rem - 1.5rem
- H3: 1.125rem
- Body: 0.875rem - 1rem
- Small: 0.75rem

---

## 🔄 FLUJOS DE USUARIO PRINCIPALES

### 1. Login
1. Usuario ingresa username y password
2. Validación con Zod
3. Verificación de password con bcrypt
4. Creación de cookie de sesión
5. Redirect a `/dashboard`

### 2. Crear Tarea
1. Click en botón "Nueva Tarea"
2. Modal con formulario
3. Validación con Zod
4. Generación de task_id automático
5. Creación en BD
6. Notificación a usuarios asignados
7. Actualización de dashboard

### 3. Abrir Tarea
1. Click en card de tarea
2. Navegación a `/tasks/[id]`
3. Carga de datos de tarea
4. Si no hay historial de IA → Generación automática de plan
5. Renderizado de timeline, archivos, notas

### 4. Chat de IA
1. Usuario abre tarea
2. Si no hay historial → Plan inicial generado automáticamente
3. Usuario puede enviar mensajes
4. Usuario puede adjuntar imágenes/videos
5. IA responde con markdown
6. Historial se guarda automáticamente

### 5. Chat Global
1. Click en botón de chat flotante
2. Carga de últimos 100 mensajes
3. Usuario puede enviar texto, stickers, imágenes, voz
4. Menciones de tareas se convierten en links
5. Auto-scroll a nuevos mensajes

---

## 🧪 DATOS DE PRUEBA (Seed)

### Usuarios por Defecto

```typescript
[
  {
    username: 'admin',
    password: 'admin123',
    full_name: 'Jefe de Marketing',
    role: 'admin',
    avatar_color: '#8B5CF6'
  },
  {
    username: 'diseñador',
    password: 'diseño123',
    full_name: 'Diseñador Gráfico',
    role: 'designer',
    avatar_color: '#EC4899'
  },
  {
    username: 'asistente',
    password: 'asist123',
    full_name: 'Asistente de Marketing',
    role: 'assistant',
    avatar_color: '#3B82F6'
  },
  {
    username: 'audiovisual',
    password: 'audio123',
    full_name: 'Productor Audiovisual',
    role: 'audiovisual',
    avatar_color: '#F59E0B'
  }
]
```

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### 1. Timezone
- **Configuración:** `TZ=America/Lima` en todos los scripts
- **Fechas:** Todas las fechas se manejan en timezone de Lima
- **Helper:** `getLimaDateTime()` en `lib/supabase.ts`

### 2. Validaciones
- **Todas las API routes** deben validar con Zod antes de procesar
- **Archivos** deben validarse con `validateFile()` antes de guardar
- **Autenticación** requerida en todas las rutas excepto login

### 3. Manejo de Errores
- **Try-catch** en todas las operaciones async
- **Error boundaries** en componentes React
- **Mensajes de error** claros para el usuario
- **Logging** en consola para debugging

### 4. Performance
- **Paginación:** Considerar para listas grandes (chat, tareas)
- **Caching:** Considerar React Cache para datos frecuentes
- **Optimización de imágenes:** Considerar compresión automática

### 5. Seguridad
- **Nunca** exponer API keys en el código
- **Siempre** validar inputs del usuario
- **Siempre** verificar autenticación y autorización
- **Sanitizar** nombres de archivos antes de guardar

---

## 📝 NOTAS FINALES

### Estado Actual del Proyecto
- ✅ Completamente funcional
- ✅ Migrado a Supabase (PostgreSQL)
- ✅ Validaciones con Zod implementadas
- ✅ Sin errores de linting
- ✅ Listo para producción (con mejoras sugeridas)

### Mejoras Futuras Sugeridas
- Rate limiting en endpoints críticos
- Paginación en listas grandes
- Tests unitarios e integración
- Optimización de imágenes
- Sistema de logging estructurado
- Documentación de API (Swagger)

---

## 🎯 INSTRUCCIONES FINALES PARA LA IA

**Construye esta aplicación completa siguiendo estas especificaciones:**

1. **Estructura:** Sigue exactamente la estructura de directorios descrita
2. **Base de datos:** Aplica la migración SQL completa a Supabase
3. **API Routes:** Implementa los 33 endpoints descritos con validaciones Zod
4. **Componentes:** Crea todos los componentes React mencionados
5. **Diseño:** Implementa el sistema de diseño con CSS Variables y glassmorphism
6. **Funcionalidades:** Implementa todas las funcionalidades descritas
7. **Seguridad:** Implementa autenticación, validaciones y sanitización
8. **Responsive:** Asegura que funcione en móvil y desktop
9. **Testing:** Prueba todos los flujos de usuario
10. **Documentación:** Incluye README con instrucciones de setup

**El resultado debe ser una aplicación completamente funcional, lista para deployment en producción, con todas las características descritas implementadas y funcionando correctamente.**

---

**Este prompt contiene toda la información necesaria para reconstruir la aplicación MKT Planner desde cero. Úsalo como especificación completa del proyecto.**

