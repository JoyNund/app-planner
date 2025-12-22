# 🌱 Cómo Ejecutar el Seed en Vercel

## ✅ Opción 1: Ejecutar desde tu Máquina Local (MÁS FÁCIL)

Esta es la forma más simple y recomendada:

1. **Asegúrate de tener `.env.local`** con las variables de Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://npqxwbosekumdlmtcgxt.supabase.co
   # Puedes usar publishable key (recomendada) o anon key (legacy)
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Y9UWJk36erlnONAZrLfl0A_WR-9EZ4E
   ```

2. **Ejecuta el seed**:
   ```bash
   npx tsx lib/seed.ts
   ```

3. **¡Listo!** Los usuarios se crearán directamente en Supabase.

---

## ✅ Opción 2: Usar API Route en Vercel

He creado un endpoint API temporal para ejecutar el seed desde Vercel.

### Paso 1: Agregar Token de Seguridad

1. Ve a **Vercel** → Tu Proyecto → **Settings** → **Environment Variables**
2. Agrega una nueva variable:
   - **Key**: `SEED_SECRET_TOKEN`
   - **Value**: `tu-token-secreto-aqui` (elige un token seguro)
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development

### Paso 2: Ejecutar el Seed

**Opción A: Desde el navegador (más fácil)**

1. Abre tu app en Vercel: `https://tu-app.vercel.app`
2. Abre la consola del navegador (F12)
3. Ejecuta:
   ```javascript
   fetch('/api/seed', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer tu-token-secreto-aqui',
       'Content-Type': 'application/json'
     }
   })
   .then(r => r.json())
   .then(console.log)
   .catch(console.error);
   ```

**Opción B: Desde terminal con curl**

```bash
curl -X POST https://tu-app.vercel.app/api/seed \
  -H "Authorization: Bearer tu-token-secreto-aqui" \
  -H "Content-Type: application/json"
```

**Opción C: Desde Postman o Insomnia**

- **URL**: `https://tu-app.vercel.app/api/seed`
- **Method**: `POST`
- **Headers**:
  - `Authorization`: `Bearer tu-token-secreto-aqui`
  - `Content-Type`: `application/json`

### Paso 3: Verificar Resultado

Deberías recibir una respuesta como:
```json
{
  "success": true,
  "message": "Database seeded successfully",
  "users": [
    { "username": "admin", "status": "created" },
    { "username": "diseñador", "status": "created" },
    ...
  ]
}
```

### Paso 4: Deshabilitar el Endpoint (IMPORTANTE)

Después de ejecutar el seed, **deberías deshabilitar o proteger mejor este endpoint**:

1. Elimina el archivo `app/api/seed/route.ts`, O
2. Agrega autenticación más robusta, O
3. Comenta el código para que no se ejecute

---

## ✅ Opción 3: Usar Vercel CLI (Avanzado)

Si tienes Vercel CLI instalado:

```bash
# Instalar Vercel CLI (si no lo tienes)
npm i -g vercel

# Login
vercel login

# Ejecutar comando en el entorno de producción
vercel env pull .env.production
npx tsx lib/seed.ts
```

---

## 🎯 Recomendación

**Usa la Opción 1** (ejecutar desde tu máquina local). Es:
- ✅ Más simple
- ✅ Más seguro
- ✅ No requiere configurar tokens
- ✅ Funciona inmediatamente

La Opción 2 (API Route) es útil si necesitas ejecutar el seed desde producción, pero requiere más configuración.

---

## ⚠️ Seguridad

- **NUNCA** dejes el endpoint `/api/seed` sin protección en producción
- **SIEMPRE** usa un token secreto fuerte
- **DESHABILITA** el endpoint después de usarlo

---

## 📝 Credenciales Creadas

Después de ejecutar el seed, podrás hacer login con:

- **Admin**: `admin` / `admin123`
- **Diseñador**: `diseñador` / `diseño123`
- **Asistente**: `asistente` / `asist123`
- **Audiovisual**: `audiovisual` / `audio123`
