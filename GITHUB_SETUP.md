# 📦 Configuración de GitHub para MKT Planner

## Pasos para subir el proyecto a GitHub

### 1. Crear el repositorio en GitHub

1. Ve a [GitHub](https://github.com) e inicia sesión
2. Haz clic en el botón **"+"** en la esquina superior derecha
3. Selecciona **"New repository"**
4. Configura el repositorio:
   - **Repository name:** `mkt-planner` (o el nombre que prefieras)
   - **Description:** "Aplicación web colaborativa de gestión de tareas para equipos de marketing"
   - **Visibility:** Elige **Private** (recomendado) o **Public**
   - **NO marques** "Initialize with README" (ya tenemos archivos)
   - Haz clic en **"Create repository"**

### 2. Conectar el repositorio local con GitHub

Una vez creado el repositorio, GitHub te mostrará comandos. Ejecuta estos comandos en el servidor:

```bash
cd /root/mkt-planner

# Agregar el remoto (reemplaza USERNAME con tu usuario de GitHub)
git remote add origin https://github.com/USERNAME/mkt-planner.git

# O si prefieres usar SSH (requiere configuración de SSH keys):
# git remote add origin git@github.com:USERNAME/mkt-planner.git

# Verificar que el remoto se agregó correctamente
git remote -v

# Subir el código a GitHub
git push -u origin main
```

### 3. Si el repositorio ya existe y quieres reemplazarlo

```bash
cd /root/mkt-planner

# Si ya existe un remoto, primero remuévelo
git remote remove origin

# Agrega el nuevo remoto
git remote add origin https://github.com/USERNAME/mkt-planner.git

# Fuerza el push (solo si es necesario)
git push -u origin main --force
```

### 4. Verificar la configuración

```bash
# Ver remotos configurados
git remote -v

# Ver estado
git status

# Ver commits
git log --oneline
```

## 🔐 Autenticación

### Opción A: Personal Access Token (Recomendado)

1. Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Genera un nuevo token con permisos `repo`
3. Cuando hagas `git push`, usa el token como contraseña

### Opción B: SSH Keys

1. Genera una SSH key:
```bash
ssh-keygen -t ed25519 -C "tu-email@ejemplo.com"
```

2. Copia la clave pública:
```bash
cat ~/.ssh/id_ed25519.pub
```

3. Agrega la clave en GitHub → Settings → SSH and GPG keys

## 📝 Notas Importantes

- ✅ Las bases de datos (`.db`) están excluidas del repositorio
- ✅ Los archivos `.env` están excluidos
- ✅ `node_modules` está excluido
- ✅ El build `.next` está excluido

## 🚀 Comandos Rápidos

```bash
# Ver estado
git status

# Agregar cambios
git add .

# Hacer commit
git commit -m "mensaje descriptivo"

# Subir cambios
git push

# Ver historial
git log --oneline
```

