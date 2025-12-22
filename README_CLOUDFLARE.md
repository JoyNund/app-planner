# Configuración para Cloudflare Pages

## ⚠️ IMPORTANTE: Configuración en Cloudflare Pages Dashboard

Cloudflare Pages tiene soporte nativo para Next.js. **NO uses Wrangler** para este proyecto.

## Configuración Requerida

### 1. Framework Preset

En Cloudflare Pages → Settings → Builds & deployments:

- **Framework preset**: Selecciona `Next.js` (debe estar disponible en la lista)
- Si no aparece, selecciona `None` y configura manualmente

### 2. Build Settings

**IMPORTANTE**: El output directory correcto depende del preset:

**Si usas preset `Next.js`:**
- **Build command**: `npm run build`
- **Build output directory**: Déjalo **VACÍO** (Cloudflare lo detecta automáticamente)
- **Root directory**: `/` (raíz del proyecto)

**Si usas preset `None`:**
- **Build command**: `npm run build`
- **Build output directory**: `.vercel/output/static` o `.next` (prueba ambos)
- **Root directory**: `/` (raíz del proyecto)

### 3. Deploy Command (SI EL CAMPO ES OBLIGATORIO)

Si Cloudflare Pages **requiere** que pongas algo en "Deploy command", usa uno de estos:

**Opción 1 (Recomendada - No hace nada, el deploy es automático):**
```
echo "Deploy complete"
```

**Opción 2 (Alternativa):**
```
true
```

**Opción 3 (Si necesitas verificar el build):**
```
ls -la .next
```

**IMPORTANTE**: 
- **NO uses**: `npx wrangler deploy` (esto es para Workers, no para Pages)
- **NO uses**: `npm start` (esto inicia un servidor, no es necesario en Pages)
- El deploy en Cloudflare Pages es **automático** después del build exitoso

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
3. En "Deploy command" pon: `echo "Deploy complete"` (si el campo es obligatorio)
4. Guarda y vuelve a hacer deploy

## Notas

- Cloudflare Pages soporta Next.js nativamente desde 2024
- No necesitas `@cloudflare/next-on-pages` (está deprecado)
- No necesitas `wrangler.toml` para Pages (solo para Workers)
- El build output de Next.js se detecta automáticamente
- El deploy es automático después del build, el "Deploy command" solo se ejecuta si es obligatorio

## Troubleshooting

Si el deploy sigue fallando:

1. Verifica que el Framework preset sea `Next.js`
2. Verifica que el "Deploy command" sea `echo "Deploy complete"` (no wrangler)
3. Verifica que las variables de entorno estén configuradas
4. Revisa los logs de build en Cloudflare Pages
