# 🔧 Configuración de Puertos y Nginx - Resumen

**Fecha:** $(date +%Y-%m-%d)

## ✅ Cambios Realizados

### 1. MKT Planner - Puerto 3002

**Archivos modificados:**
- `/root/mkt-planner/package.json` - Scripts actualizados para usar puerto 3002

**Cambios:**
```json
"scripts": {
  "dev": "next dev -p 3002",
  "start": "next start -p 3002"
}
```

**Nota:** El puerto 3000 está reservado para `radio-web` (radio-api en Docker)

---

### 2. Configuración Nginx

**Archivo:** `/etc/nginx/sites-available/sitios.conf`

#### Nuevas configuraciones agregadas:

1. **mkt.jcsoluciones.online** → `http://127.0.0.1:3002`
   - Puerto: 3002
   - SSL configurado

2. **vesanicoradio.jcsoluciones.online** → `http://127.0.0.1:8085`
   - Puerto: 8085 (WordPress)
   - SSL configurado

3. **monitor.jcsoluciones.online** → `http://127.0.0.1:3001`
   - Puerto: 3001 (Uptime Kuma)
   - SSL configurado

---

## 📋 Mapeo Completo de Puertos

| Subdominio | Puerto | Servicio | Estado |
|------------|--------|----------|--------|
| miradio.jcsoluciones.online | 8081 | AzuraCast | ✅ Configurado |
| radio.jcsoluciones.online | 3000 | Radio Web API | ✅ Configurado |
| files.jcsoluciones.online | 8082 | File Browser | ✅ Configurado |
| portainer.jcsoluciones.online | 9000 | Portainer | ✅ Configurado |
| **mkt.jcsoluciones.online** | **3002** | **MKT Planner** | ✅ **Nuevo** |
| **vesanicoradio.jcsoluciones.online** | **8085** | **WordPress** | ✅ **Nuevo** |
| **monitor.jcsoluciones.online** | **3001** | **Uptime Kuma** | ✅ **Nuevo** |

---

## 🔒 Certificados SSL

**IMPORTANTE:** Si los certificados SSL para los nuevos dominios no existen, necesitas generarlos:

```bash
# Para mkt.jcsoluciones.online
certbot certonly --nginx -d mkt.jcsoluciones.online

# Para vesanicoradio.jcsoluciones.online
certbot certonly --nginx -d vesanicoradio.jcsoluciones.online

# Para monitor.jcsoluciones.online
certbot certonly --nginx -d monitor.jcsoluciones.online
```

Después de generar los certificados, recarga nginx:
```bash
systemctl reload nginx
```

---

## 🚀 Iniciar MKT Planner

Para iniciar el MKT Planner en el puerto 3002:

```bash
cd /root/mkt-planner

# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

O con PM2 (recomendado para producción):
```bash
pm2 start npm --name "mkt-planner" -- start -- -p 3002
pm2 save
```

---

## ✅ Verificación

1. **Nginx recargado:** ✅
2. **Configuración validada:** ✅
3. **Puerto 3002 disponible:** ✅
4. **Puerto 3000 reservado para radio-web:** ✅

---

## 📝 Notas

- El puerto 3000 está siendo usado por `radio-api` (contenedor Docker de radio-web)
- Todos los servicios están correctamente mapeados en nginx
- Los certificados SSL deben ser generados para los nuevos dominios si no existen

---

**Configuración completada exitosamente** ✨

