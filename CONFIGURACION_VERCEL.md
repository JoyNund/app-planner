# 🚀 Configuración Rápida para Vercel

## ✅ Tu Proyecto Supabase

- **Nombre**: mkt-web-app
- **URL**: `https://npqxwbosekumdlmtcgxt.supabase.co`
- **Estado**: ✅ Activo y funcionando
- **Tablas**: ✅ 18 tablas creadas

## 📝 Pasos para Deploy en Vercel

### Paso 1: Conectar Repositorio

1. Ve a https://vercel.com
2. Inicia sesión con GitHub
3. Click en **"Add New..."** → **"Project"**
4. Busca: `JoyNund/app-planner`
5. Click en **"Import"**

### Paso 2: Configuración Automática

Vercel detectará Next.js automáticamente. **NO cambies nada**.

### Paso 3: Variables de Entorno (IMPORTANTE)

Antes de hacer deploy, agrega estas variables:

En la sección **"Environment Variables"**, agrega:

#### Variable 1:
- **Key**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://npqxwbosekumdlmtcgxt.supabase.co`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

#### Variable 2:
- **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wcXh3Ym9zZWt1bWRsbXRjZ3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyOTYyMTAsImV4cCI6MjA4MTg3MjIxMH0.NCa-uI60akA0tPGkjyqFxBoDTWHQYU8UUgjiZurQ45k`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

#### Variable 3:
- **Key**: `TZ`
- **Value**: `America/Lima`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

#### Variable 4:
- **Key**: `NODE_ENV`
- **Value**: `production`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

### Paso 4: Deploy

1. Click en **"Deploy"**
2. Espera 2-5 minutos
3. Tu app estará lista en: `https://app-planner.vercel.app`

## ✅ Verificación

Después del deploy:

1. Abre la URL de Vercel
2. Deberías ver la página de login
3. Si no hay usuarios, ejecuta el seed:
   ```bash
   npx tsx lib/seed.ts
   ```
   (Asegúrate de tener `.env.local` con las variables de Supabase)

4. Prueba login con:
   - Usuario: `admin`
   - Contraseña: `admin123`

## 🎉 ¡Listo!

Tu aplicación estará funcionando en producción.
