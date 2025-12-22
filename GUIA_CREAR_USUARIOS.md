# 👤 Guía Rápida: Crear Usuarios en Supabase

## ✅ Opción 1: Ejecutar Seed Localmente (RECOMENDADO)

Esta opción crea todos los usuarios de prueba y datos de ejemplo.

### Pasos:

1. **Asegúrate de tener `.env.local`** con las variables de Supabase:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://npqxwbosekumdlmtcgxt.supabase.co
   # Puedes usar publishable key (recomendada) o anon key (legacy)
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Y9UWJk36erlnONAZrLfl0A_WR-9EZ4E
   ```

2. **Ejecuta el seed**:
   ```bash
   npx tsx lib/seed.ts
   ```

3. **¡Listo!** Ya puedes hacer login con:
   - Usuario: `admin` / Contraseña: `admin123`
   - Usuario: `diseñador` / Contraseña: `diseño123`
   - Usuario: `asistente` / Contraseña: `asist123`
   - Usuario: `audiovisual` / Contraseña: `audio123`

---

## ✅ Opción 2: Crear Usuarios Manualmente en Supabase

Si prefieres crear usuarios directamente en Supabase:

### Pasos:

1. **Ve a Supabase** → Tu proyecto `mkt-web-app`
2. **Abre SQL Editor** (en el menú lateral)
3. **Copia y pega** el contenido del archivo `CREAR_USUARIOS_SUPABASE.sql`
4. **Click en "Run"** (o presiona Ctrl+Enter)
5. **Verifica** que los usuarios se crearon correctamente

### Credenciales de Login:

- **Admin**: `admin` / `admin123`
- **Diseñador**: `diseñador` / `diseño123`
- **Asistente**: `asistente` / `asist123`
- **Audiovisual**: `audiovisual` / `audio123`

---

## 🎯 ¿Cuál Opción Elegir?

- **Opción 1 (Seed)**: Si quieres usuarios + tareas de ejemplo + mensajes de chat
- **Opción 2 (SQL)**: Si solo quieres crear usuarios rápidamente

---

## ✅ Verificación

Después de crear los usuarios, verifica en Supabase:

1. Ve a **Table Editor** → `users`
2. Deberías ver los 4 usuarios creados
3. Prueba hacer login en tu app de Vercel

---

## 🎉 ¡Listo!

Ya puedes hacer login en tu aplicación desplegada en Vercel.
