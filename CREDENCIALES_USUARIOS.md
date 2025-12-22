# 🔐 Credenciales de Usuarios - MKT Planner

## 📝 Usuarios Creados por el Seed

Estas son las credenciales **en texto plano** que se usan para crear los usuarios. Las contraseñas se hashean con bcrypt antes de guardarse en la base de datos.

### 👤 Usuario Administrador
- **Username**: `admin`
- **Contraseña**: `admin123`
- **Nombre**: Jefe de Marketing
- **Rol**: `admin`
- **Color Avatar**: #8B5CF6 (Morado)

### 🎨 Usuario Diseñador
- **Username**: `diseñador`
- **Contraseña**: `diseño123`
- **Nombre**: Diseñador Gráfico
- **Rol**: `designer`
- **Color Avatar**: #EC4899 (Rosa)

### 📋 Usuario Asistente
- **Username**: `asistente`
- **Contraseña**: `asist123`
- **Nombre**: Asistente de Marketing
- **Rol**: `assistant`
- **Color Avatar**: #10B981 (Verde)

### 🎬 Usuario Audiovisual
- **Username**: `audiovisual`
- **Contraseña**: `audio123`
- **Nombre**: Especialista Audiovisual
- **Rol**: `audiovisual`
- **Color Avatar**: #F59E0B (Ámbar)

---

## 🔍 Cómo Funciona el Hash

Cuando ejecutas el seed (`npx tsx lib/seed.ts`), el código:

1. Toma la contraseña en texto plano (ej: `admin123`)
2. La hashea con bcrypt usando 10 rounds: `hashPassword('admin123')`
3. Guarda el hash en la base de datos (ej: `$2b$10$wTqu/OtJ7V4DYucaCr/2qO...`)

**Cuando haces login:**
- Ingresas: `admin` / `admin123`
- El sistema hashea `admin123` y compara con el hash guardado
- Si coinciden → Login exitoso ✅

---

## 📋 Tabla Resumen

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `admin123` | admin |
| `diseñador` | `diseño123` | designer |
| `asistente` | `asist123` | assistant |
| `audiovisual` | `audio123` | audiovisual |

---

## ⚠️ IMPORTANTE

- **Estas contraseñas son para desarrollo/pruebas**
- **Cámbialas en producción** después de crear los usuarios
- **Nunca compartas estas credenciales públicamente**
- Las contraseñas hasheadas en la BD no se pueden "descifrar" - solo se pueden verificar

---

## 🔐 Dónde Están Documentadas

- **Script de seed**: `lib/seed.ts` (líneas 11-40)
- **Script SQL**: `CREAR_USUARIOS_SUPABASE.sql` (usa hashes pre-generados)
- **Este archivo**: `CREDENCIALES_USUARIOS.md`

---

## ✅ Verificar Usuarios en Supabase

Para ver qué usuarios existen en tu base de datos:

1. Ve a Supabase → SQL Editor
2. Ejecuta:
   ```sql
   SELECT id, username, full_name, role FROM users;
   ```

Esto mostrará los usuarios, pero **NO** las contraseñas (están hasheadas).

---

## 🎯 Para Hacer Login

Usa estas credenciales en tu app desplegada en Vercel:

- **URL**: `https://tu-app.vercel.app/login`
- **Usuario**: `admin`
- **Contraseña**: `admin123`

---

## 🔄 Cambiar Contraseñas

Si necesitas cambiar una contraseña después de crear el usuario:

1. **Opción 1**: Desde la app (si hay funcionalidad de cambio de contraseña)
2. **Opción 2**: Ejecutar SQL en Supabase:
   ```sql
   -- Generar nuevo hash (ejemplo para nueva contraseña "nueva123")
   -- Necesitas generar el hash con bcrypt primero
   UPDATE users 
   SET password_hash = '$2b$10$NUEVO_HASH_AQUI' 
   WHERE username = 'admin';
   ```

3. **Opción 3**: Eliminar y recrear el usuario con el seed
