# Configuración para Cloudflare Pages

## ⚠️ IMPORTANTE: Configuración en Cloudflare Pages Dashboard

Cloudflare Pages tiene soporte nativo para Next.js. **NO uses Wrangler** para este proyecto.

## Configuración Requerida

### 1. Framework Preset

En Cloudflare Pages → Settings → Builds & deployments:

- **Framework preset**: Selecciona `Next.js` (debe estar disponible en la lista)
- Si no aparece, selecciona `None` y configura manualmente

### 2. Build Settings

Si usas preset `None`, configura:

- **Build command**: `npm run build`
- **Build output directory**: `.next` (o déjalo vacío para auto-detect)
- **Root directory**: `/` (raíz del proyecto)

### 3. Deploy Command

**IMPORTANTE**: Deja el campo "Deploy command" **VACÍO** o elimínalo completamente.

**NO uses**: `npx wrangler deploy` (esto es para Workers, no para Pages)

### 4. Variables de Entorno

En Settings → Environment Variables, agrega:

```
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
TZ=America/Lima
NODE_ENV=production
```

## Solución al Error

Si ves el error:
```
✘ [ERROR] Missing entry-point to Worker script
```

**Causa**: Cloudflare Pages está intentando usar Wrangler (Workers) en lugar del preset de Next.js.

**Solución**:
1. Ve a Settings → Builds & deployments
2. Cambia el Framework preset a `Next.js`
3. Elimina cualquier "Deploy command" que contenga `wrangler`
4. Guarda y vuelve a hacer deploy

## Notas

- Cloudflare Pages soporta Next.js nativamente desde 2024
- No necesitas `@cloudflare/next-on-pages` (está deprecado)
- No necesitas `wrangler.toml` para Pages (solo para Workers)
- El build output de Next.js se detecta automáticamente

## Troubleshooting

Si el deploy sigue fallando:

1. Verifica que el Framework preset sea `Next.js`
2. Verifica que no haya "Deploy command" configurado
3. Verifica que las variables de entorno estén configuradas
4. Revisa los logs de build en Cloudflare Pages
