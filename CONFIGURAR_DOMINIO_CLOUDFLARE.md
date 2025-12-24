# 🌐 Configurar Subdominio de Cloudflare para Vercel

## 📋 Requisitos Previos

- ✅ Tienes un dominio gestionado por Cloudflare
- ✅ Tienes un proyecto deployado en Vercel: `https://app-planner-one.vercel.app/`
- ✅ Acceso al panel de Cloudflare
- ✅ Acceso al panel de Vercel

---

## 🚀 Paso 1: Configurar el Dominio en Vercel

### 1.1 Agregar Dominio en Vercel

1. Ve a tu proyecto en Vercel: https://vercel.com
2. Abre tu proyecto `app-planner`
3. Ve a **Settings** → **Domains**
4. En el campo "Add Domain", ingresa tu subdominio completo:
   - Ejemplo: `app.tudominio.com` o `planner.tudominio.com`
5. Click en **"Add"**

### 1.2 Verificar la Configuración

Vercel te mostrará los registros DNS que necesitas configurar. Anota estos valores:
- **Tipo**: `CNAME`
- **Nombre**: Tu subdominio (ej: `app` o `planner`)
- **Valor**: `cname.vercel-dns.com` (o similar)

---

## 🔧 Paso 2: Configurar DNS en Cloudflare

### 2.1 Acceder a Cloudflare

1. Inicia sesión en Cloudflare: https://dash.cloudflare.com
2. Selecciona tu dominio
3. Ve a **DNS** → **Records**

### 2.2 Agregar Registro CNAME

1. Click en **"Add record"**
2. Configura el registro:
   - **Type**: Selecciona `CNAME`
   - **Name**: Tu subdominio (ej: `app` o `planner`)
     - ⚠️ **IMPORTANTE**: Solo el nombre del subdominio, NO incluyas el dominio completo
     - ✅ Correcto: `app`
     - ❌ Incorrecto: `app.tudominio.com`
   - **Target**: `cname.vercel-dns.com`
     - ⚠️ **NOTA**: Vercel te dará el valor exacto en el paso 1.2
   - **Proxy status**: 
     - ✅ **Recomendado**: Activa el proxy (nube naranja) para protección DDoS
     - ⚠️ **Alternativa**: Desactiva el proxy si Vercel requiere SSL directo
3. **TTL**: Déjalo en "Auto" (si el proxy está activo) o "1 hour"
4. Click en **"Save"**

### 2.3 Verificar el Registro

Deberías ver algo como:
```
Type    Name    Content                    Proxy
CNAME   app     cname.vercel-dns.com       Proxied
```

---

## 🔒 Paso 3: Configurar SSL/TLS en Cloudflare

### 3.1 Configuración SSL

1. En Cloudflare, ve a **SSL/TLS**
2. Selecciona el modo SSL:
   - **Recomendado**: `Full (strict)` - Mejor seguridad
   - **Alternativa**: `Full` - Si tienes problemas con strict
   - ⚠️ **NO uses**: `Flexible` - Menos seguro

### 3.2 Verificar Certificado

Vercel automáticamente generará un certificado SSL para tu dominio. Esto puede tardar unos minutos.

---

## ⏱️ Paso 4: Esperar la Propagación DNS

### Tiempos de Propagación

- **Con Proxy de Cloudflare**: 1-5 minutos
- **Sin Proxy**: 1-24 horas (depende del TTL)

### Verificar Propagación

Puedes verificar que el DNS está propagado usando:
- **Herramienta online**: https://dnschecker.org
- **Comando terminal**: `nslookup app.tudominio.com`

---

## ✅ Paso 5: Verificar en Vercel

### 5.1 Verificar Estado del Dominio

1. En Vercel, ve a **Settings** → **Domains**
2. Verifica que tu dominio aparezca como:
   - ✅ **"Valid Configuration"** (verde)
   - ⚠️ Si aparece "Invalid Configuration", revisa los pasos anteriores

### 5.2 Verificar Certificado SSL

Vercel automáticamente:
- Genera un certificado SSL
- Configura HTTPS
- Redirige HTTP a HTTPS

Esto puede tardar 5-10 minutos después de que el DNS esté configurado.

---

## 🧪 Paso 6: Probar el Dominio

### 6.1 Acceder al Subdominio

1. Abre tu navegador
2. Ve a: `https://app.tudominio.com` (o tu subdominio)
3. Deberías ver tu aplicación de Vercel

### 6.2 Verificar HTTPS

- ✅ La URL debe mostrar `https://` (no `http://`)
- ✅ El navegador debe mostrar el candado de seguridad
- ✅ No debe haber advertencias de certificado

---

## 🔄 Paso 7: Configurar Redirección (Opcional)

Si quieres que el dominio principal también apunte a Vercel:

### Opción A: Redirección en Cloudflare

1. En Cloudflare, ve a **Rules** → **Page Rules**
2. Crea una regla:
   - **URL**: `tudominio.com/*`
   - **Setting**: `Forwarding URL` → `301 Permanent Redirect`
   - **Destination**: `https://app.tudominio.com/$1`

### Opción B: Redirección en Vercel

1. En Vercel, agrega también el dominio raíz (`tudominio.com`)
2. Configura una redirección en `vercel.json`:

```json
{
  "redirects": [
    {
      "source": "/",
      "destination": "https://app.tudominio.com",
      "permanent": true
    }
  ]
}
```

---

## 🛠️ Solución de Problemas

### Problema: "Invalid Configuration" en Vercel

**Causas posibles:**
1. El registro CNAME no está configurado correctamente
2. El proxy de Cloudflare está interfiriendo
3. El DNS aún no se ha propagado

**Soluciones:**
1. Verifica que el CNAME apunte exactamente a `cname.vercel-dns.com`
2. Intenta desactivar temporalmente el proxy de Cloudflare
3. Espera 10-15 minutos y verifica de nuevo

### Problema: Certificado SSL no funciona

**Causas posibles:**
1. El modo SSL en Cloudflare no es compatible
2. El certificado aún no se ha generado

**Soluciones:**
1. Cambia el modo SSL a `Full` (no `Flexible`)
2. Espera 10-15 minutos para que Vercel genere el certificado
3. Verifica en Vercel → Settings → Domains que el certificado esté activo

### Problema: El dominio no carga

**Causas posibles:**
1. DNS no propagado
2. Configuración incorrecta

**Soluciones:**
1. Verifica con `nslookup` o herramientas online
2. Limpia la caché DNS de tu navegador
3. Verifica que el CNAME esté correcto en Cloudflare

---

## 📝 Ejemplo Completo

### Configuración Ejemplo

**Dominio**: `ejemplo.com`  
**Subdominio deseado**: `app.ejemplo.com`

**En Vercel:**
- Agregar dominio: `app.ejemplo.com`
- Vercel muestra: `CNAME app -> cname.vercel-dns.com`

**En Cloudflare:**
```
Type: CNAME
Name: app
Target: cname.vercel-dns.com
Proxy: Proxied (nube naranja)
TTL: Auto
```

**Resultado:**
- `https://app.ejemplo.com` → Redirige a tu app en Vercel
- SSL automático
- Protección DDoS de Cloudflare

---

## ✅ Checklist Final

- [ ] Dominio agregado en Vercel
- [ ] Registro CNAME creado en Cloudflare
- [ ] Proxy de Cloudflare configurado (opcional pero recomendado)
- [ ] SSL/TLS configurado en Cloudflare (Full o Full strict)
- [ ] DNS propagado (verificado con herramienta)
- [ ] Certificado SSL generado en Vercel
- [ ] Dominio accesible vía HTTPS
- [ ] Sin errores en Vercel → Settings → Domains

---

## 🎯 Notas Importantes

1. **Proxy de Cloudflare**: 
   - ✅ Actívalo para protección DDoS y mejor rendimiento
   - ⚠️ Si tienes problemas, desactívalo temporalmente

2. **SSL/TLS**:
   - ✅ Usa `Full (strict)` para máxima seguridad
   - ⚠️ Si tienes problemas, prueba `Full`

3. **Tiempos**:
   - DNS: 1-5 minutos (con proxy) o 1-24 horas (sin proxy)
   - SSL: 5-10 minutos después de DNS

4. **Múltiples Subdominios**:
   - Puedes agregar múltiples subdominios siguiendo el mismo proceso
   - Cada uno necesita su propio registro CNAME

---

## 📚 Recursos Adicionales

- **Documentación de Vercel**: https://vercel.com/docs/concepts/projects/domains
- **Documentación de Cloudflare**: https://developers.cloudflare.com/dns/
- **Verificar DNS**: https://dnschecker.org

---

¡Listo! Tu subdominio debería estar funcionando y apuntando a tu deploy de Vercel. 🎉
