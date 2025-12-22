# ✅ Variables de Entorno para Vercel (CORREGIDAS)

## ⚠️ Problema Resuelto

Vercel reserva ciertas variables de entorno. **NO agregues `NODE_ENV`** - Vercel la establece automáticamente.

## 📝 Variables a Agregar en Vercel

Solo agrega estas **2 variables obligatorias**:

### Variable 1: NEXT_PUBLIC_SUPABASE_URL
- **Key**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://npqxwbosekumdlmtcgxt.supabase.co`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

### Variable 2: NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wcXh3Ym9zZWt1bWRsbXRjZ3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyOTYyMTAsImV4cCI6MjA4MTg3MjIxMH0.NCa-uI60akA0tPGkjyqFxBoDTWHQYU8UUgjiZurQ45k`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

### Variable 3: TZ (OPCIONAL)
- **Key**: `TZ`
- **Value**: `America/Lima`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

⚠️ **Si `TZ` también da error de "reservada"**, simplemente omítela. La aplicación funcionará igual.

## ❌ Variables que NO debes agregar

- ❌ `NODE_ENV` - Vercel la establece automáticamente como `production` en producción
- ❌ Cualquier variable que empiece con `VERCEL_` - Reservadas por Vercel

## ✅ Pasos

1. Ve a Vercel → Tu Proyecto → Settings → Environment Variables
2. Agrega solo las 2 variables obligatorias (o 3 si `TZ` funciona)
3. Selecciona todos los ambientes (Production, Preview, Development)
4. Click en "Save"
5. Haz un nuevo deploy

## 🎉 ¡Listo!

Con estas variables, tu aplicación debería funcionar correctamente en Vercel.
