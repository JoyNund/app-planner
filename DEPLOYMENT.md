# MKT Planner - Deployment Guide

## Preparación para Producción

### 1. Build de Producción
```bash
npm run build
```

### 2. Iniciar en Producción
```bash
npm start
```

**Diferencias clave:**
- ✅ **Sin recompilación**: Todo está pre-compilado
- ✅ **Sin icono de carga**: Next.js no muestra el indicador
- ✅ **Rendimiento óptimo**: Páginas estáticas servidas instantáneamente
- ✅ **Smooth**: Navegación fluida sin delays

### 3. Variables de Entorno (Producción)

Crea un archivo `.env.production`:

```env
NODE_ENV=production
PORT=3002
```

### 4. Deployment Options

#### Opción A: Servidor Propio (PM2)
```bash
# Instalar PM2
npm install -g pm2

# Iniciar con PM2
pm2 start npm --name "mkt-planner" -- start -- -p 3002

# Ver logs
pm2 logs mkt-planner

# Reiniciar
pm2 restart mkt-planner

# Auto-start en reboot
pm2 startup
pm2 save
```

#### Opción B: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### Opción C: Vercel (Recomendado para Next.js)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 5. Optimizaciones Adicionales

**next.config.js** (ya configurado):
- ✅ Compresión habilitada
- ✅ Imágenes optimizadas
    ```nginx
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    ```
- ✅ Turbopack en desarrollo

### 6. Checklist Pre-Deploy

- [ ] `npm run build` sin errores
- [ ] Variables de entorno configuradas
- [ ] Base de datos migrada (ejecutar `npm run seed` si es nuevo)
- [ ] Puerto configurado   - Port: 3002 (Port 3000 is used by radio.jcsoluciones.online))
- [ ] Firewall permite el puerto

### 7. Monitoreo

```bash
# Ver uso de recursos
pm2 monit

# Logs en tiempo real
pm2 logs mkt-planner --lines 100
```

---

## Notas Importantes

⚠️ **Modo Dev vs Producción:**
- `npm run dev`: Para desarrollo, recompila on-demand (lento, con icono)
- `npm start`: Para producción, sirve build pre-compilado (rápido, sin icono)

🚀 **Performance:**
- Producción es ~10x más rápido que desarrollo
- No hay compilación en tiempo real
- Todo está optimizado y minificado
