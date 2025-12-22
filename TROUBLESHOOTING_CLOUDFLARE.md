# Troubleshooting: "Hello World" en Cloudflare Pages

## Problema

Después del deploy exitoso, solo ves "Hello World" en lugar de tu aplicación Next.js.

## Causas Posibles

1. **Output directory incorrecto** - Cloudflare no encuentra los archivos build
2. **Preset incorrecto** - No está usando el preset de Next.js correctamente
3. **Variables de entorno faltantes** - La app no puede conectarse a Supabase

## Soluciones

### Solución 1: Verificar Output Directory

En Cloudflare Pages → Settings → Builds & deployments:

1. **Si usas preset `Next.js`**:
   - Build output directory: **DÉJALO VACÍO** (auto-detect)

2. **Si usas preset `None`**:
   - Prueba estos output directories en orden:
     - `.next` (primero)
     - `.vercel/output/static` (segundo)
     - `out` (tercero, solo si usas `output: 'export'`)

### Solución 2: Verificar Build Logs

En Cloudflare Pages → Deployments → [Tu último deploy] → View build log:

Busca estas líneas:
```
✓ Compiled successfully
✓ Generating static pages
Route (app)
```

Si ves estas líneas, el build fue exitoso. El problema es el output directory.

### Solución 3: Verificar Variables de Entorno

Asegúrate de tener estas variables configuradas:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
TZ=America/Lima
NODE_ENV=production
```

**IMPORTANTE**: Las variables `NEXT_PUBLIC_*` son necesarias para que la app funcione.

### Solución 4: Verificar que el Preset sea Next.js

1. Ve a Settings → Builds & deployments
2. Verifica que el Framework preset sea `Next.js`
3. Si no está disponible, selecciona `None` y configura manualmente

### Solución 5: Revisar Archivos Build

Si tienes acceso a los logs, verifica que se generaron estos archivos:
- `.next/static/`
- `.next/server/`
- Archivos HTML en `.next/`

## Configuración Recomendada

```
Framework preset: Next.js
Build command: npm run build
Build output directory: (vacío - auto-detect)
Root directory: /
Deploy command (producción): echo "Deploy complete"
Deploy command (preview): echo "Deploy complete"
```

## Si Nada Funciona

1. **Verifica los logs de build** - Busca errores
2. **Prueba con output directory vacío** - Deja que Cloudflare lo detecte
3. **Verifica que las variables de entorno estén configuradas**
4. **Haz un nuevo deploy** después de cambiar la configuración

## Nota sobre API Routes

Si tu app usa API Routes (`/api/*`), Cloudflare Pages puede tener limitaciones. Considera:
- Usar Cloudflare Workers para API routes
- O usar un servidor separado para las APIs
