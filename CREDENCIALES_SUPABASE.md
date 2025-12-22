# 🔐 Credenciales de Supabase - mkt-web-app

## ✅ Proyecto Verificado

- **Nombre**: mkt-web-app
- **ID**: `npqxwbosekumdlmtcgxt`
- **Estado**: ✅ ACTIVE_HEALTHY
- **Región**: us-west-2
- **Base de datos**: PostgreSQL 17.6.1

## 📋 Credenciales

### URL del Proyecto
```
https://npqxwbosekumdlmtcgxt.supabase.co
```

### Publishable Key (RECOMENDADA - Moderna y más segura)
```
sb_publishable_Y9UWJk36erlnONAZrLfl0A_WR-9EZ4E
```

**Ventajas de la Publishable Key:**
- ✅ Más segura y permite rotación independiente
- ✅ Formato moderno recomendado por Supabase
- ✅ Compatible con el cliente de Supabase sin cambios en el código

### Anon Public Key (Legacy - Compatible)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wcXh3Ym9zZWt1bWRsbXRjZ3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyOTYyMTAsImV4cCI6MjA4MTg3MjIxMH0.NCa-uI60akA0tPGkjyqFxBoDTWHQYU8UUgjiZurQ45k
```

**Nota:** El cliente de Supabase acepta ambas keys. Puedes usar cualquiera de las dos en `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## ✅ Estado de la Base de Datos

### Tablas Creadas (18 tablas)
- ✅ `users` (1 fila)
- ✅ `tasks` (1 fila)
- ✅ `task_assignments` (1 fila)
- ✅ `task_comments`
- ✅ `task_files`
- ✅ `task_ai_chat` (1 fila)
- ✅ `chat_messages`
- ✅ `notes`
- ✅ `note_shares`
- ✅ `notifications`
- ✅ `checklist_items`
- ✅ `checklist_history`
- ✅ `settings` (1 fila)
- ✅ `sticker_packs`
- ✅ `stickers`
- ✅ `task_counters` (1 fila)
- ✅ `ai_prompts_by_sector`
- ✅ `ai_prompts`

### Row Level Security (RLS)
- ✅ **RLS está deshabilitado** en todas las tablas (correcto para este proyecto)

## 🔧 Variables de Entorno para Vercel

Agrega estas variables en Vercel → Settings → Environment Variables:

**Opción 1: Usar Publishable Key (RECOMENDADO)**
```
NEXT_PUBLIC_SUPABASE_URL=https://npqxwbosekumdlmtcgxt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Y9UWJk36erlnONAZrLfl0A_WR-9EZ4E
TZ=America/Lima
```

**Opción 2: Usar Anon Key (Legacy - Compatible)**
```
NEXT_PUBLIC_SUPABASE_URL=https://npqxwbosekumdlmtcgxt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wcXh3Ym9zZWt1bWRsbXRjZ3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyOTYyMTAsImV4cCI6MjA4MTg3MjIxMH0.NCa-uI60akA0tPGkjyqFxBoDTWHQYU8UUgjiZurQ45k
TZ=America/Lima
```

⚠️ **IMPORTANTE**: 
- **NO agregues `NODE_ENV`** - Vercel la establece automáticamente
- Si `TZ` también da error, omítela (opcional)
- El nombre de la variable `NEXT_PUBLIC_SUPABASE_ANON_KEY` se mantiene por compatibilidad, pero acepta tanto anon como publishable keys

## ⚠️ Nota de Seguridad

Estas credenciales son públicas y seguras para usar en el frontend. La key "anon" está diseñada para ser pública.

**NO compartas** la "service_role" key si la ves, esa es privada.

## 📝 Próximos Pasos

1. ✅ Base de datos ya está configurada
2. ✅ Tablas creadas
3. ⏭️ Agregar variables de entorno en Vercel
4. ⏭️ Hacer deploy en Vercel
5. ⏭️ Ejecutar seed para crear usuarios de prueba (opcional)
