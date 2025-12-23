# 🚀 Comandos para Subir Cambios a GitHub

## 📋 Resumen de Cambios

Se han eliminado archivos y dependencias obsoletas:
- ✅ Dependencias: `better-sqlite3`, `mysql2`, `@types/better-sqlite3`
- ✅ Archivos: 15 archivos legacy de SQLite (migraciones, schemas, backups)

## 🔧 Pasos para Subir a GitHub

### Opción 1: Si Git está instalado pero no en PATH

Abre PowerShell o CMD y ejecuta estos comandos uno por uno:

```powershell
# Navegar al directorio del proyecto
cd "C:\Users\ofima\OneDrive\OBSOLETO\Escritorio\gits\app-planner"

# Verificar estado (si git está disponible)
git status

# Agregar todos los cambios
git add .

# Hacer commit
git commit -m "chore: eliminar dependencias y archivos legacy de SQLite

- Eliminar dependencias: better-sqlite3, mysql2, @types/better-sqlite3
- Eliminar archivos de migración SQLite obsoletos (migrate_v*.ts, migrate.ts)
- Eliminar schemas SQLite obsoletos (schema.sql, schema-mysql.sql, schema_actual.sql)
- Eliminar backups SQLite obsoletos (db.sqlite.backup.ts, migration_v2.sql)
- Proyecto ahora usa exclusivamente Supabase (PostgreSQL)"

# Verificar remoto (según documentación: https://github.com/JoyNund/mkt-planner.git)
git remote -v

# Si no hay remoto, agregarlo:
# git remote add origin https://github.com/JoyNund/mkt-planner.git

# Subir cambios
git push origin main
# O si es la primera vez:
# git push -u origin main
```

### Opción 2: Usar GitHub Desktop

1. Abre GitHub Desktop
2. Abre el repositorio: `C:\Users\ofima\OneDrive\OBSOLETO\Escritorio\gits\app-planner`
3. Verás los cambios en la pestaña "Changes"
4. Escribe el mensaje de commit: "chore: eliminar dependencias y archivos legacy de SQLite"
5. Haz clic en "Commit to main"
6. Haz clic en "Push origin"

### Opción 3: Instalar Git y configurarlo

Si Git no está instalado:

1. Descarga Git desde: https://git-scm.com/download/win
2. Instálalo con las opciones por defecto
3. Reinicia PowerShell/CMD
4. Ejecuta los comandos de la Opción 1

## 📝 Mensaje de Commit Sugerido

```
chore: eliminar dependencias y archivos legacy de SQLite

- Eliminar dependencias: better-sqlite3, mysql2, @types/better-sqlite3
- Eliminar archivos de migración SQLite obsoletos (migrate_v*.ts, migrate.ts)
- Eliminar schemas SQLite obsoletos (schema.sql, schema-mysql.sql, schema_actual.sql)
- Eliminar backups SQLite obsoletos (db.sqlite.backup.ts, migration_v2.sql)
- Proyecto ahora usa exclusivamente Supabase (PostgreSQL)
```

## ✅ Verificación

Después de hacer push, verifica en GitHub:
- https://github.com/JoyNund/mkt-planner

Deberías ver:
- ✅ El commit con el mensaje de limpieza
- ✅ `package.json` sin las dependencias obsoletas
- ✅ Carpeta `lib/` sin los archivos legacy

## 🔐 Autenticación

Si te pide credenciales:
- **Usuario**: `JoyNund` (o tu usuario de GitHub)
- **Contraseña**: Usa un **Personal Access Token** (no tu contraseña)
  - Crea uno en: GitHub → Settings → Developer settings → Personal access tokens

