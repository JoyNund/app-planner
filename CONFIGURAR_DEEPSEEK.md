# 🤖 Configurar DeepSeek API para el Chat de IA

## ✅ Cambios Realizados

1. **Cambio a DeepSeek**: El chat de IA ahora usa DeepSeek en lugar de Gemini (más económico)
2. **Botón de Limpiar Chat**: Añadido botón para limpiar el historial del chat de IA
3. **Variables de Entorno**: La API key se lee de variables de entorno

## 📝 Configuración en Vercel

### Paso 1: Obtener tu API Key de DeepSeek

1. Ve a https://platform.deepseek.com
2. Inicia sesión o crea una cuenta
3. Ve a **API Keys** o **Settings**
4. Genera una nueva API key o usa una existente
5. Copia la API key (formato: `sk-...`)

### Paso 2: Agregar Variable de Entorno en Vercel

1. Ve a tu proyecto en Vercel: https://vercel.com
2. Abre tu proyecto `app-planner`
3. Ve a **Settings** → **Environment Variables**
4. Agrega la variable:
   - **Key**: `DEEPSEEK_API_KEY`
   - **Value**: `sk-tu-api-key-aqui` (tu propia key)
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development
5. Click en **"Save"**

### Paso 3: Hacer Nuevo Deploy

Después de agregar la variable:
1. Vercel debería hacer un deploy automático
2. O puedes hacer un deploy manual desde el dashboard
3. Espera 2-3 minutos a que termine el deploy

## 🔧 Configuración Local (Opcional)

Si quieres probar localmente, agrega en tu archivo `.env.local`:

```env
DEEPSEEK_API_KEY=sk-tu-api-key-aqui
```

## ✅ Verificación

Después del deploy, el chat de IA debería funcionar:

1. Abre una tarea en tu aplicación
2. Click en el botón de **Chat de IA** (si está disponible)
3. Envía un mensaje
4. Deberías recibir una respuesta de DeepSeek

## 🧹 Limpiar Chat

Ahora puedes limpiar el historial del chat:

1. Abre el chat de IA en una tarea
2. Click en el botón **"Limpiar"** en la parte superior derecha del header
3. Confirma la acción
4. El historial se borrará y se generará un nuevo plan inicial (si aplica)

## 🛡️ Mejoras Implementadas

### 1. DeepSeek API
- ✅ Más económico que Gemini
- ✅ Buena calidad de respuestas
- ✅ Soporte para conversaciones largas
- ✅ Formato compatible con OpenAI

### 2. Botón de Limpiar
- ✅ Limpia el historial del chat de una tarea específica
- ✅ Confirmación antes de borrar
- ✅ Regenera plan inicial después de limpiar (opcional)

### 3. Manejo de Errores
- ✅ Mensajes de error más específicos
- ✅ Manejo de límites de uso
- ✅ Manejo de permisos

## 📋 Errores Comunes

### Error: "Configuración de IA no disponible"
**Causa**: La variable `DEEPSEEK_API_KEY` no está configurada en Vercel.

**Solución**: 
1. Verifica que agregaste la variable en Vercel
2. Verifica que seleccionaste todos los ambientes (Production, Preview, Development)
3. Haz un nuevo deploy después de agregar la variable

### Error: "Error de permisos con la API de IA"
**Causa**: La API key no tiene permisos o está incorrecta.

**Solución**:
1. Verifica que la API key sea correcta
2. Verifica que la API key tenga permisos para usar DeepSeek API
3. Genera una nueva API key si es necesario

### Error: "Límite de uso de IA alcanzado"
**Causa**: Has alcanzado el límite de uso de la API de DeepSeek.

**Solución**:
1. Espera un tiempo antes de intentar de nuevo
2. Verifica tu cuota en DeepSeek Platform
3. Considera actualizar tu plan si es necesario

## 🎯 Próximos Pasos

1. ✅ Agregar `DEEPSEEK_API_KEY` en Vercel
2. ✅ Esperar el deploy
3. ✅ Probar el chat de IA en una tarea
4. ✅ Probar el botón de limpiar chat

## 📝 Notas

- DeepSeek es más económico que Gemini
- La API key debe tener el formato `sk-...`
- El historial del chat se guarda por tarea
- Puedes limpiar el chat de cada tarea independientemente
