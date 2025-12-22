# 🤖 Configurar Gemini API para el Chat de IA

## ✅ Cambios Realizados

1. **SDK Oficial de Google**: El código ahora usa el SDK oficial `@google/genai` en lugar de llamadas HTTP directas
2. **Variables de Entorno**: La API key se lee de variables de entorno (más seguro)
3. **Manejo de Historial**: Usa `chats.create()` para manejar el historial de conversación correctamente
4. **Modelos Actualizados**: Usa modelos Gemini 2.0 (gemini-1.5-pro fue deprecado)

## 📝 Configuración en Vercel

### Paso 1: Obtener tu API Key de Gemini

1. Ve a https://aistudio.google.com/apikey
2. Inicia sesión con tu cuenta de Google
3. Click en **"Create API Key"** o usa una existente
4. Copia la API key (formato: `AIzaSy...`)

### Paso 2: Agregar Variables de Entorno en Vercel

1. Ve a tu proyecto en Vercel: https://vercel.com
2. Abre tu proyecto `app-planner`
3. Ve a **Settings** → **Environment Variables**
4. Agrega las siguientes variables:

   **Variable 1: GEMINI_API_KEY**
   - **Key**: `GEMINI_API_KEY`
   - **Value**: `AIzaSyBUukU6ziuqvUcKv-hbewAaJFjqMCjacTI` (o tu propia key)
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development

   **Variable 2: GEMINI_MODEL (Opcional)**
   - **Key**: `GEMINI_MODEL`
   - **Value**: `gemini-2.0-flash` (por defecto)
   - **Opciones disponibles**:
     - `gemini-2.0-flash` - Rápido y eficiente (recomendado)
     - `gemini-2.0-flash-lite` - Más económico
     - `gemini-2.0-pro-exp` - Mejor calidad para tareas complejas
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
GEMINI_API_KEY=AIzaSyBUukU6ziuqvUcKv-hbewAaJFjqMCjacTI
# Opcional: elegir modelo (por defecto: gemini-2.0-flash)
GEMINI_MODEL=gemini-2.0-flash
```

## 📋 Modelos Disponibles

### Gemini 2.0 Flash (Recomendado - Por Defecto)
- **Modelo**: `gemini-2.0-flash`
- **Características**: Rápido, eficiente, 1M tokens de contexto
- **Ideal para**: Uso general, respuestas rápidas

### Gemini 2.0 Flash-Lite
- **Modelo**: `gemini-2.0-flash-lite`
- **Características**: Más económico, 1M tokens de contexto
- **Ideal para**: Aplicaciones con alto volumen

### Gemini 2.0 Pro Experimental
- **Modelo**: `gemini-2.0-pro-exp`
- **Características**: Mejor calidad, 2M tokens de contexto
- **Ideal para**: Tareas complejas, mejor rendimiento en código

⚠️ **Nota**: Los modelos `gemini-1.5-pro` y `gemini-1.5-flash` fueron deprecados en septiembre 2025.

## ✅ Verificación

Después del deploy, el chat de IA debería funcionar:

1. Abre una tarea en tu aplicación
2. Click en el botón de **Chat de IA** (si está disponible)
3. Envía un mensaje
4. Deberías recibir una respuesta de Gemini

## 🛡️ Mejoras Implementadas

### 1. Variables de Entorno
- ✅ API key ahora se lee de `GEMINI_API_KEY`
- ✅ Más seguro (no hardcodeada en el código)
- ✅ Fácil de cambiar sin modificar código

### 2. Manejo de Errores Mejorado
- ✅ Mensajes de error más específicos
- ✅ Manejo de errores de seguridad (safety blocks)
- ✅ Manejo de límites de uso
- ✅ Manejo de permisos

### 3. Safety Settings
- ✅ Configuración de seguridad de Gemini
- ✅ Bloqueo de contenido inapropiado
- ✅ Mensajes claros cuando el contenido es bloqueado

## 📋 Errores Comunes

### Error: "models/gemini-1.5-pro is not found"
**Causa**: El modelo `gemini-1.5-pro` fue deprecado en septiembre 2025.

**Solución**: 
1. El código ahora usa `gemini-2.0-flash` por defecto
2. Si aún ves este error, verifica que `GEMINI_MODEL` esté configurado correctamente en Vercel
3. Asegúrate de que el deploy más reciente esté activo
4. Haz un nuevo deploy si es necesario

### Error: "Configuración de IA no disponible"
**Causa**: La variable `GEMINI_API_KEY` no está configurada en Vercel.

**Solución**: 
1. Verifica que agregaste la variable en Vercel
2. Verifica que seleccionaste todos los ambientes (Production, Preview, Development)
3. Haz un nuevo deploy después de agregar la variable

### Error: "Error de permisos con la API de IA"
**Causa**: La API key no tiene permisos o está incorrecta.

**Solución**:
1. Verifica que la API key sea correcta
2. Verifica que la API key tenga permisos para usar Gemini API
3. Genera una nueva API key si es necesario

### Error: "Límite de uso de IA alcanzado"
**Causa**: Has alcanzado el límite de uso de la API de Gemini.

**Solución**:
1. Espera un tiempo antes de intentar de nuevo
2. Verifica tu cuota en Google AI Studio
3. Considera actualizar tu plan si es necesario

## 🎯 Próximos Pasos

1. ✅ Agregar `GEMINI_API_KEY` en Vercel
2. ✅ Esperar el deploy
3. ✅ Probar el chat de IA en una tarea
4. ✅ Verificar que funciona correctamente

## 📝 Notas

- La API key actual en el código es temporal y debería ser reemplazada por tu propia key
- Para producción, considera usar diferentes keys para diferentes ambientes
- Revisa los logs de Vercel si hay problemas para ver errores específicos
