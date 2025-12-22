# Configuración para Cloudflare Pages

## Problema Resuelto

El proyecto estaba fallando en Cloudflare Pages porque intentaba usar Wrangler (para Workers) en lugar del adaptador de Next.js.

## Solución Implementada

1. **Instalado `@cloudflare/next-on-pages`**: Adaptador oficial de Next.js para Cloudflare Pages
2. **Creado script `build:cloudflare`**: Build específico para Cloudflare
3. **Configurado `wrangler.toml`**: Configuración para Cloudflare Pages
4. **Agregados archivos de configuración**: `_headers` y `_redirects` para Cloudflare Pages

## Configuración en Cloudflare Pages

### Build Settings

1. **Framework preset**: `Next.js` (si está disponible) o `None`
2. **Build command**: `npm run build:cloudflare`
3. **Build output directory**: `.vercel/output/static`
4. **Root directory**: `/` (raíz del proyecto)

### Variables de Entorno

Agregar en Cloudflare Pages → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
TZ=America/Lima
```

### Deploy Command (Opcional)

Si Cloudflare Pages tiene un campo "Deploy command", dejarlo vacío o usar:
```
npx @cloudflare/next-on-pages@1
```

## Notas Importantes

- El proyecto usa Supabase, asegúrate de configurar las variables de entorno
- `better-sqlite3` no funcionará en Cloudflare Pages (usa Supabase)
- Los archivos en `public/uploads/` se servirán desde Cloudflare Pages

## Troubleshooting

Si el deploy sigue fallando:

1. Verificar que `@cloudflare/next-on-pages` esté instalado
2. Verificar que el build command sea `npm run build:cloudflare`
3. Verificar que las variables de entorno estén configuradas
4. Revisar los logs de build en Cloudflare Pages
