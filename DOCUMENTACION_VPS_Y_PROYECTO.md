# 📋 Documentación Completa: MKT Planner y Entorno VPS

**Fecha de generación:** 11 de diciembre de 2025  
**Último commit:** `93c49b00b51ac727b33b9b8c074bc6854c35a496` (11/12/2025 03:38:16 UTC+1)

---

## 📊 PARTE 1: Análisis del VPS (Visión General)

### 1.1 Servicios Activos por Tecnología

#### 🐳 Docker (via `/root/proyectos/docker-compose.yml`)

| Contenedor | Puerto Host | Puerto Interno | Servicio | Dominio |
|------------|-------------|----------------|----------|---------|
| `proyectos_radio-api_1` | **3000** | 3000 | Radio Web API (Node.js) | radio.jcsoluciones.online |
| `proyectos_radio-web_1` | **8084** | 80 | Radio Web Frontend (Nginx) | - |
| `proyectos_uptime-kuma_1` | **3001** | 3001 | Uptime Kuma (Monitoreo) | monitor.jcsoluciones.online |
| `proyectos_filebrowser_1` | **8082** | 80 | File Browser | files.jcsoluciones.online |
| `proyectos_wordpress_1` | **8086** | 80 | WordPress | vesanicoradio.jcsoluciones.online |
| `proyectos_portainer_1` | **9000** | 9000 | Portainer (Docker UI) | portainer.jcsoluciones.online |
| `azuracast` | **8081** | 8081 | AzuraCast (Radio) | miradio.jcsoluciones.online |

#### 🟢 PM2 (Node.js Apps)

| Proceso | Puerto | Estado | Directorio | Dominio |
|---------|--------|--------|------------|---------|
| **mkt-planner** | **3003** | ✅ Online | `/root/mkt-planner` | mkt.jcsoluciones.online |
| **controla-pm** | **3005** | ✅ Online | `/root/apps/controla-pm` | - |

#### 🌐 Nginx

- **Puerto 80**: Redirige a HTTPS
- **Puerto 443**: Proxy reverso con SSL para todos los subdominios

---

### 1.2 Mapa Completo de Puertos

```
PUERTOS EN USO:
├── 80      → Nginx (HTTP)
├── 443     → Nginx (HTTPS/SSL)
├── 3000    → Radio API (Docker)
├── 3001    → Uptime Kuma (Docker)
├── 3003    → MKT Planner (PM2) ⭐
├── 3005    → Controla PM (PM2)
├── 3306    → MariaDB (Docker - interno)
├── 8081    → AzuraCast (Docker)
├── 8082    → File Browser (Docker)
├── 8084    → Radio Web (Docker)
├── 8086    → WordPress (Docker)
└── 9000    → Portainer (Docker)

PUERTOS RESERVADOS (apps futuras):
├── 8090-8095 → Apps dockerizadas (/root/apps/)
├── 3002      → MKT Planner dev
└── 3004      → Controla PM dev
```

---

### 1.3 Estructura de Directorios del VPS

```
/root/
├── mkt-planner/          ⭐ PROYECTO ACTUAL
│   └── (Next.js 16 - Puerto 3003)
│
├── apps/                 📦 Apps Dockerizadas
│   ├── controla-pm/      (Next.js - Puerto 3005)
│   ├── chatbots-whatsapp/
│   ├── crm/
│   ├── juegos-mesa/
│   ├── mailer/
│   ├── portal-peliculas/
│   ├── web-personal/
│   └── docker-compose.yml (red apps_network)
│
├── proyectos/            📦 Servicios Docker Principales
│   ├── radio-web/
│   └── docker-compose.yml
│
└── .antigravity-server/  📦 Otros servicios
```

---

## 📊 PARTE 2: Análisis Detallado de MKT Planner

### 2.1 Información General

| Campo | Valor |
|-------|-------|
| **Nombre** | MKT Planner |
| **Versión** | 0.1.0 |
| **Framework** | Next.js 16.0.4 (App Router) |
| **React** | 19.2.0 |
| **TypeScript** | 5.x |
| **Base de datos** | SQLite (better-sqlite3) |
| **Puerto desarrollo** | 3002 |
| **Puerto producción** | 3003 |
| **Timezone** | America/Lima (UTC-5) |
| **Dominio** | mkt.jcsoluciones.online |
| **Tamaño BD** | ~152KB |

---

### 2.2 Stack Tecnológico Completo

#### Dependencias de Producción
```json
{
  "bcryptjs": "^3.0.3",        // Hashing de contraseñas
  "better-sqlite3": "^12.4.6", // Base de datos SQLite
  "lucide-react": "^0.555.0",  // Iconos
  "mysql2": "^3.15.3",         // (Preparado para migración MySQL)
  "next": "16.0.4",            // Framework
  "react": "19.2.0",           // UI
  "react-dom": "19.2.0",       // DOM
  "zod": "^4.1.13"             // Validación de datos
}
```

#### Dependencias de Desarrollo
```json
{
  "@types/bcryptjs",
  "@types/better-sqlite3",
  "@types/node",
  "@types/react",
  "@types/react-dom",
  "eslint": "^9",
  "eslint-config-next": "16.0.4",
  "tsx": "^4.20.6",            // Ejecutar TypeScript
  "typescript": "^5"
}
```

---

### 2.3 Estructura del Proyecto

```
/root/mkt-planner/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # Rutas protegidas
│   │   ├── calendar/page.tsx     # Calendario mensual
│   │   ├── chat/page.tsx         # Chat de equipo
│   │   ├── dashboard/page.tsx    # Vista general
│   │   ├── notes/page.tsx        # Notas personales
│   │   ├── settings/page.tsx     # Config (admin)
│   │   ├── tasks/[id]/page.tsx   # Detalle tarea
│   │   ├── users/page.tsx        # Usuarios (admin)
│   │   └── layout.tsx            # Layout dashboard
│   ├── api/                      # API Routes (23 endpoints)
│   │   ├── auth/                 # login, logout, session
│   │   ├── chat/                 # messages, files, clear
│   │   ├── checklist/            # daily checklist
│   │   ├── notes/                # CRUD notas + compartir
│   │   ├── settings/             # configuración app
│   │   ├── stats/                # estadísticas
│   │   ├── stickers/             # sistema stickers
│   │   ├── tasks/                # CRUD tareas
│   │   ├── uploads/              # archivos estáticos
│   │   └── users/                # CRUD usuarios
│   ├── login/page.tsx            # Página login
│   ├── globals.css               # Estilos globales (~1000 líneas)
│   └── layout.tsx                # Layout raíz
│
├── components/                   # 27 Componentes React
│   ├── AuthProvider.tsx          # Context autenticación
│   ├── Calendar.tsx              # Calendario desktop
│   ├── CalendarMobile.tsx        # Calendario móvil
│   ├── CategoryBadge.tsx         # Badge categoría
│   ├── ChatBox.tsx               # Caja de chat
│   ├── DailyChecklist.tsx        # Checklist diario
│   ├── DailyChecklistFloating.tsx# Checklist flotante
│   ├── EfficiencyBar.tsx         # Barra eficiencia
│   ├── GanttView.tsx             # Vista Gantt desktop
│   ├── GanttViewMobile.tsx       # Vista Gantt móvil
│   ├── GlobalChat.tsx            # Chat global flotante
│   ├── MobileNavbar.tsx          # Navbar móvil
│   ├── NotesWidget.tsx           # Widget notas
│   ├── PriorityBadge.tsx         # Badge prioridad
│   ├── SettingsProvider.tsx      # Context configuración
│   ├── Sidebar.tsx               # Barra lateral
│   ├── StickerPicker.tsx         # Selector stickers
│   ├── TaskCard.tsx              # Tarjeta tarea
│   ├── TaskFormModal.tsx         # Modal crear/editar tarea
│   ├── TaskMentionInput.tsx      # Input con menciones
│   ├── TaskModalContext.tsx      # Context modal tareas
│   ├── TaskTimeline.tsx          # Timeline actividad
│   ├── useNotifications.ts       # Hook notificaciones
│   ├── UserAvatar.tsx            # Avatar usuario
│   ├── UserFormModal.tsx         # Modal usuario
│   ├── UserModalContext.tsx      # Context modal usuarios
│   └── VoiceRecorder.tsx         # Grabador de voz
│
├── lib/                          # Lógica de negocio
│   ├── auth.ts                   # Autenticación + sesiones
│   ├── dateUtils.ts              # Utilidades fechas
│   ├── db.ts                     # Operaciones BD (~400 líneas)
│   ├── metrics.ts                # Cálculo métricas
│   ├── migrate*.ts               # Scripts migración (v4-v10)
│   ├── schema.sql                # Schema completo (~155 líneas)
│   ├── seed.ts                   # Datos de prueba
│   ├── taskId.ts                 # Generador IDs tareas
│   ├── taskMentions.ts           # Parser menciones
│   ├── utils.ts                  # Utilidades generales
│   └── validations.ts            # Validaciones Zod
│
├── public/uploads/               # Archivos subidos
├── scripts/                      # Scripts auxiliares
│   ├── export-schema.ts          # Exportar schema
│   └── migrate-to-mysql.js       # Migración MySQL
│
├── mkt-planner.db                # Base de datos SQLite
├── package.json                  # Dependencias
├── next.config.ts                # Config Next.js
└── tsconfig.json                 # Config TypeScript
```

---

### 2.4 Base de Datos (SQLite)

#### Tablas Principales

| Tabla | Descripción | Campos Clave |
|-------|-------------|--------------|
| `users` | Usuarios del sistema | id, username, password_hash, full_name, role, avatar_color |
| `tasks` | Tareas | id, task_id, title, description, assigned_to, created_by, priority, category, status, admin_approved, start_date, due_date |
| `task_assignments` | Asignación múltiple | task_id, user_id |
| `task_comments` | Timeline/comentarios | task_id, user_id, content |
| `task_files` | Archivos de tareas | task_id, filename, filepath, file_type |
| `chat_messages` | Chat de equipo | user_id, message, message_type, file_path, sticker_id, referenced_tasks |
| `notes` | Notas personales | user_id, task_id, content |
| `note_shares` | Notas compartidas | note_id, shared_with_user_id |
| `checklist_items` | Checklist diario | user_id, content, is_completed, date |
| `task_counters` | IDs personalizados | role_prefix, year, month, counter |
| `settings` | Configuración app | app_name, logo_url, theme_colors |
| `sticker_packs` | Packs de stickers | name |
| `stickers` | Stickers | pack_id, filename, filepath |

#### Índices para Performance
- `idx_tasks_assigned_to`
- `idx_tasks_created_by`
- `idx_tasks_due_date`
- `idx_tasks_task_id`
- `idx_task_comments_task_id`
- `idx_task_files_task_id`
- `idx_chat_messages_created_at`

---

### 2.5 API Endpoints (23 rutas)

#### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/session` | Obtener sesión actual |

#### Tareas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/api/tasks` | Listar/Crear tareas |
| GET/PUT/DELETE | `/api/tasks/[id]` | CRUD tarea específica |
| PUT | `/api/tasks/[id]/status` | Cambiar estado |
| GET/POST | `/api/tasks/[id]/comments` | Comentarios/timeline |
| GET/POST | `/api/tasks/[id]/files` | Archivos de tarea |

#### Chat
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/api/chat` | Mensajes de chat |
| POST | `/api/chat/files` | Subir archivo al chat |
| DELETE | `/api/chat/clear` | Limpiar chat (admin) |

#### Notas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/api/notes` | Listar/Crear notas |
| GET/PUT/DELETE | `/api/notes/[id]` | CRUD nota específica |
| POST | `/api/notes/[id]/share` | Compartir nota |

#### Usuarios
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/api/users` | Listar/Crear usuarios |
| GET | `/api/users/list` | Lista simplificada |
| GET/PUT/DELETE | `/api/users/[id]` | CRUD usuario específico |

#### Otros
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/PUT | `/api/settings` | Configuración app |
| GET/POST/PUT/DELETE | `/api/checklist` | Checklist diario |
| GET | `/api/stats/pending` | Tareas pendientes |
| GET | `/api/stats/history` | Historial estadísticas |
| GET | `/api/stickers` | Lista de stickers |
| GET | `/api/uploads/[...path]` | Servir archivos |

---

### 2.6 Sistema de Autenticación

#### Roles Disponibles
- `admin` - Acceso completo, gestión usuarios, configuración
- `designer` - Diseñador gráfico
- `assistant` - Asistente de marketing
- `audiovisual` - Producción audiovisual
- *(Roles personalizables)*

#### Características de Seguridad
- ✅ Passwords hasheados con bcrypt (10 rounds)
- ✅ Cookies httpOnly (previene XSS)
- ✅ SameSite: 'lax' (previene CSRF)
- ✅ Sesiones con expiración (7 días)
- ✅ Validación con Zod en todos los endpoints
- ✅ Validación de archivos (tipo MIME, tamaño 10MB max)
- ✅ Sanitización de nombres de archivo

#### Credenciales de Prueba (seed.ts)
| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | Jefe de Marketing |
| diseñador | diseño123 | Diseñador Gráfico |
| asistente | asist123 | Asistente de Marketing |
| audiovisual | audio123 | Audiovisual |

---

### 2.7 Funcionalidades Principales

#### ✅ Implementadas
1. **Dashboard** - Vista general con estadísticas y filtros
2. **Calendario** - Vista mensual de tareas
3. **Vista Gantt** - Diagrama de tareas con fechas
4. **Gestión de Tareas** - CRUD completo con:
   - IDs personalizados (ej: DIS-2024-12-001)
   - Asignación múltiple de usuarios
   - Prioridades (urgent, high, medium, low)
   - Categorías (design, content, video, campaign, social, other)
   - Estados (pending, in_progress, completed)
   - Aprobación de admin
   - Timeline de actividad
   - Archivos adjuntos
5. **Chat de Equipo** - Con:
   - Mensajes de texto
   - Stickers
   - Imágenes
   - Notas de voz
   - Menciones de tareas
6. **Sistema de Notas** - Personales y por tarea, compartibles
7. **Checklist Diario** - Por usuario
8. **Gestión de Usuarios** (admin)
9. **Configuración de App** (admin) - Nombre, logo, tema

#### 🎨 UI/UX
- Tema oscuro moderno con glassmorphism
- Diseño responsive (móvil optimizado)
- Sidebar colapsable
- Animaciones suaves
- Timezone configurado para Lima (UTC-5)

---

### 2.8 Configuración de Despliegue

#### PM2 (Actual)
```bash
# Estado actual
pm2 show mkt-planner

# Reiniciar
pm2 restart mkt-planner

# Ver logs
pm2 logs mkt-planner

# Rebuild
cd /root/mkt-planner
npm run build
pm2 restart mkt-planner
```

#### Scripts package.json
```json
{
  "dev": "TZ=America/Lima next dev -p 3002",
  "build": "TZ=America/Lima next build",
  "start": "TZ=America/Lima next start -p 3003",
  "lint": "eslint"
}
```

#### Nginx Config
```nginx
server {
    listen 443 ssl http2;
    server_name mkt.jcsoluciones.online;
    
    ssl_certificate /etc/letsencrypt/live/mkt.jcsoluciones.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mkt.jcsoluciones.online/privkey.pem;
    
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
    }
}
```

---

## 📊 PARTE 3: Independencia y No-Conflictos

### 3.1 MKT Planner NO tiene conflictos con:

| Servicio | Puerto | Razón |
|----------|--------|-------|
| Radio API | 3000 | Puerto diferente |
| Uptime Kuma | 3001 | Puerto diferente |
| Controla PM | 3005 | Puerto diferente, mismo stack pero BD independiente |
| Docker services | 8081-9000 | Rango de puertos diferente |

### 3.2 Recursos Independientes

- ✅ Base de datos propia: `/root/mkt-planner/mkt-planner.db`
- ✅ Puerto exclusivo: 3003 (producción), 3002 (desarrollo)
- ✅ Directorio independiente: `/root/mkt-planner/`
- ✅ Proceso PM2 separado
- ✅ Uploads propios: `/root/mkt-planner/public/uploads/`

### 3.3 Similitudes con Controla PM (referencia)

Ambos proyectos comparten:
- Next.js 16 + React 19
- better-sqlite3 + Zod
- Estructura de carpetas similar
- Mismo timezone (America/Lima)

**Son proyectos independientes**, cada uno con su propia BD y funcionalidad.

---

## 📊 PARTE 4: Comandos Útiles

### Gestión de MKT Planner
```bash
# Ver estado
pm2 show mkt-planner
pm2 logs mkt-planner --lines 50

# Reiniciar
pm2 restart mkt-planner

# Rebuild completo
cd /root/mkt-planner
npm run build
pm2 restart mkt-planner

# Desarrollo local
npm run dev  # Puerto 3002
```

### Ver puertos en uso
```bash
ss -tlnp | grep -E ":(3[0-9]{3}|8[0-9]{3})"
```

### Docker (otros servicios)
```bash
cd /root/proyectos
docker-compose ps
docker-compose logs -f radio-api
```

### Nginx
```bash
nginx -t                    # Validar config
systemctl reload nginx      # Recargar
```

---

## 📊 PARTE 5: Resumen Ejecutivo

### ✅ Estado Actual
- **MKT Planner está funcionando correctamente** en producción
- Puerto 3003 con PM2, accesible via mkt.jcsoluciones.online
- Base de datos SQLite de ~152KB
- Sin conflictos con otros servicios del VPS

### 🔧 Puertos Reservados para MKT Planner
- **3002** - Desarrollo
- **3003** - Producción

### 📌 Archivos Críticos
- `/root/mkt-planner/mkt-planner.db` - Base de datos
- `/root/mkt-planner/public/uploads/` - Archivos subidos
- `/etc/nginx/sites-available/sitios.conf` - Config nginx
- `~/.pm2/logs/mkt-planner-*.log` - Logs PM2

---

**Documentación generada:** 11 de diciembre de 2025  
**Próxima revisión recomendada:** Al hacer cambios significativos

