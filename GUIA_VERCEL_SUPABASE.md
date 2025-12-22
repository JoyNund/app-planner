# 🚀 Guía Completa: Deploy en Vercel + Configuración de Supabase

## 📋 Índice

1. [Configuración de Supabase](#1-configuración-de-supabase)
2. [Deploy en Vercel](#2-deploy-en-vercel)
3. [Variables de Entorno](#3-variables-de-entorno)
4. [Verificación](#4-verificación)

---

## 1. Configuración de Supabase

### Paso 1: Crear Proyecto en Supabase

1. Ve a https://supabase.com
2. Inicia sesión o crea una cuenta
3. Click en **"New Project"**
4. Completa el formulario:
   - **Name**: `mkt-planner` (o el nombre que prefieras)
   - **Database Password**: Genera una contraseña segura (guárdala)
   - **Region**: Elige la más cercana (recomendado: `South America` si está disponible)
   - **Pricing Plan**: Free tier es suficiente para empezar

5. Click en **"Create new project"**
6. Espera 2-3 minutos mientras se crea el proyecto

### Paso 2: Obtener Credenciales

Una vez creado el proyecto:

1. Ve a **Settings** → **API** (en el menú lateral)
2. Encontrarás dos valores importantes:

   **Project URL**: 
   ```
   https://xxxxx.supabase.co
   ```
   (Copia esta URL completa)

   **anon public key**:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.xxxxx
   ```
   (Copia esta key completa)

   ⚠️ **IMPORTANTE**: Usa la key que dice **"anon"** o **"public"**, NO la "service_role" key (esa es privada)

### Paso 3: Aplicar Migración SQL

1. En Supabase, ve a **SQL Editor** (en el menú lateral)
2. Click en **"New query"**
3. Abre el archivo `supabase_migration.sql` de tu proyecto
4. Copia **TODO** el contenido del archivo
5. Pégalo en el editor SQL de Supabase
6. Click en **"Run"** (o presiona Ctrl+Enter)
7. Deberías ver: **"Success. No rows returned"** o similar

### Paso 4: Verificar Tablas Creadas

1. Ve a **Table Editor** (en el menú lateral)
2. Deberías ver todas estas tablas:
   - ✅ `users`
   - ✅ `tasks`
   - ✅ `task_assignments`
   - ✅ `task_comments`
   - ✅ `task_files`
   - ✅ `task_ai_chat`
   - ✅ `chat_messages`
   - ✅ `notes`
   - ✅ `note_shares`
   - ✅ `notifications`
   - ✅ `checklist_items`
   - ✅ `checklist_history`
   - ✅ `settings`
   - ✅ `sticker_packs`
   - ✅ `stickers`
   - ✅ `task_counters`
   - ✅ `ai_prompts_by_sector`

### Paso 5: Configurar Row Level Security (RLS) - OPCIONAL

Por defecto, Supabase tiene RLS habilitado. Para este proyecto, puedes:

**Opción A: Deshabilitar RLS (Más simple para empezar)**
```sql
-- Ejecuta esto en SQL Editor para cada tabla
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments DISABLE ROW LEVEL SECURITY;
-- ... etc para todas las tablas
```

**Opción B: Configurar políticas RLS (Más seguro)**
Esto requiere configurar políticas específicas para cada tabla. Puedes hacerlo después si lo necesitas.

### Paso 6: Ejecutar Seed (Datos Iniciales)

**Opción 1: Desde tu máquina local**
```bash
# Asegúrate de tener .env.local con las variables de Supabase
npx tsx lib/seed.ts
```

**Opción 2: Desde SQL Editor de Supabase**
Puedes insertar usuarios manualmente ejecutando SQL (ver sección de Seed SQL más abajo)

---

## 2. Deploy en Vercel

### Paso 1: Conectar Repositorio

1. Ve a https://vercel.com
2. Inicia sesión con tu cuenta de GitHub
3. Click en **"Add New..."** → **"Project"**
4. Busca y selecciona el repositorio: `JoyNund/app-planner`
5. Click en **"Import"**

### Paso 2: Configuración del Proyecto

Vercel detectará automáticamente que es Next.js. Verifica:

- **Framework Preset**: `Next.js` (debe estar seleccionado automáticamente)
- **Root Directory**: `./` (raíz)
- **Build Command**: `npm run build` (automático)
- **Output Directory**: `.next` (automático)
- **Install Command**: `npm install` (automático)

**NO cambies nada**, Vercel lo detecta automáticamente.

### Paso 3: Variables de Entorno

Antes de hacer deploy, agrega las variables de entorno:

1. En la sección **"Environment Variables"**, agrega:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   ```
   (Reemplaza con tu URL real de Supabase)

   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   (Reemplaza con tu anon key real)

   ```
   TZ=America/Lima
   ```

   ```
   NODE_ENV=production
   ```

2. Para cada variable:
   - Selecciona los ambientes: **Production**, **Preview**, **Development**
   - Click en **"Add"**

### Paso 4: Deploy

1. Click en **"Deploy"**
2. Espera 2-5 minutos mientras Vercel:
   - Instala dependencias
   - Hace build del proyecto
   - Despliega la aplicación

3. Una vez completado, verás la URL de tu aplicación:
   ```
   https://app-planner.vercel.app
   ```
   (o similar)

---

## 3. Variables de Entorno

### Variables Requeridas

| Variable | Descripción | Dónde Obtenerla |
|----------|-------------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/Public key de Supabase | Supabase → Settings → API → anon public key |
| `TZ` | Zona horaria | `America/Lima` |
| `NODE_ENV` | Entorno | `production` |

### Variables Opcionales

| Variable | Descripción | Cuándo Usar |
|----------|-------------|-------------|
| `DEEPSEEK_API_KEY` | API key de DeepSeek | Solo si usas el asistente de IA |

### Configuración en Vercel

1. Ve a tu proyecto en Vercel
2. **Settings** → **Environment Variables**
3. Agrega cada variable:
   - **Key**: El nombre de la variable
   - **Value**: El valor
   - **Environments**: Selecciona Production, Preview, Development
4. Click en **"Save"**
5. **IMPORTANTE**: Después de agregar variables, haz un nuevo deploy

---

## 4. Verificación

### Verificar Supabase

1. **Tablas creadas**: Ve a Table Editor y verifica que todas las tablas existan
2. **Datos iniciales**: Ejecuta el seed para crear usuarios de prueba
3. **Conexión**: Prueba hacer una query simple en SQL Editor:
   ```sql
   SELECT * FROM users LIMIT 1;
   ```

### Verificar Vercel

1. **Deploy exitoso**: Debe mostrar "Ready" en verde
2. **URL funciona**: Abre la URL de Vercel en el navegador
3. **Login funciona**: Prueba hacer login con las credenciales del seed

### Verificar Aplicación

1. Abre la URL de Vercel
2. Deberías ver la página de login
3. Haz login con:
   - Usuario: `admin`
   - Contraseña: `admin123`
4. Deberías ver el dashboard sin errores

---

## 🔧 Troubleshooting

### Error: "Failed to fetch" o "Network error"

**Causa**: Variables de entorno no configuradas o incorrectas.

**Solución**:
1. Verifica que las variables estén en Vercel
2. Verifica que los valores sean correctos (sin espacios extra)
3. Haz un nuevo deploy después de agregar variables

### Error: "Table does not exist"

**Causa**: La migración SQL no se ejecutó correctamente.

**Solución**:
1. Ve a SQL Editor en Supabase
2. Ejecuta el archivo `supabase_migration.sql` completo
3. Verifica en Table Editor que las tablas existan

### Error: "Invalid API key"

**Causa**: Usaste la key incorrecta (service_role en lugar de anon).

**Solución**:
1. Ve a Settings → API en Supabase
2. Usa la key que dice **"anon"** o **"public"**
3. NO uses la "service_role" key

### Error: "RLS policy violation"

**Causa**: Row Level Security está bloqueando las queries.

**Solución**:
Ejecuta en SQL Editor:
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_ai_chat DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE note_shares DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE sticker_packs DISABLE ROW LEVEL SECURITY;
ALTER TABLE stickers DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_counters DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompts_by_sector DISABLE ROW LEVEL SECURITY;
```

---

## 📝 Script SQL para Seed (Opcional)

Si prefieres crear los usuarios directamente en Supabase:

```sql
-- Insertar usuarios de prueba
-- Las contraseñas están hasheadas con bcrypt
-- admin / admin123
INSERT INTO users (username, password_hash, full_name, role, avatar_color) VALUES
('admin', '$2a$10$rQ8K8K8K8K8K8K8K8K8K8u8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', 'Jefe de Marketing', 'admin', '#8B5CF6'),
('diseñador', '$2a$10$rQ8K8K8K8K8K8K8K8K8K8u8K8K8K8K8K8K8K8K8K8K8K8K8K8K', 'Diseñador Gráfico', 'designer', '#EC4899'),
('asistente', '$2a$10$rQ8K8K8K8K8K8K8K8K8K8u8K8K8K8K8K8K8K8K8K8K8K8K8K8K', 'Asistente de Marketing', 'assistant', '#10B981'),
('audiovisual', '$2a$10$rQ8K8K8K8K8K8K8K8K8K8u8K8K8K8K8K8K8K8K8K8K8K8K8K8K', 'Especialista Audiovisual', 'audiovisual', '#F59E0B');
```

**Nota**: Los hashes de arriba son ejemplos. Para generar los reales, ejecuta `npx tsx lib/seed.ts` localmente o usa un generador de bcrypt online.

---

## ✅ Checklist Final

Antes de considerar el deploy completo:

- [ ] Proyecto creado en Supabase
- [ ] Migración SQL ejecutada exitosamente
- [ ] Todas las tablas creadas (17+ tablas)
- [ ] Credenciales de Supabase copiadas (URL y anon key)
- [ ] Proyecto conectado en Vercel
- [ ] Variables de entorno agregadas en Vercel
- [ ] Deploy exitoso en Vercel
- [ ] Login funciona correctamente
- [ ] Dashboard carga sin errores
- [ ] Datos se guardan correctamente

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, tu aplicación estará:
- ✅ Desplegada en Vercel
- ✅ Conectada a Supabase
- ✅ Funcionando en producción
- ✅ Accesible desde cualquier lugar

**URL de tu aplicación**: `https://tu-proyecto.vercel.app`

---

**¿Necesitas ayuda?** Revisa la sección de Troubleshooting o comparte el error específico que estés viendo.
