# 🚀 Instrucciones para Subir el Código a GitHub

El repositorio remoto ya está configurado, pero necesitas autenticarte para hacer push.

## ✅ Estado Actual

- ✅ Repositorio remoto configurado: `https://github.com/JoyNund/mkt-planner.git`
- ✅ Licencia MIT agregada
- ✅ 4 commits listos para subir
- ⚠️ Necesita autenticación para hacer push

## 🔐 Opción 1: Personal Access Token (Recomendado)

### Paso 1: Crear un Personal Access Token en GitHub

1. Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Haz clic en **"Generate new token (classic)"**
3. Configura el token:
   - **Note**: "MKT Planner - Server Access"
   - **Expiration**: Elige una duración (90 días, 1 año, o sin expiración)
   - **Scopes**: Marca `repo` (todos los permisos de repositorio)
4. Haz clic en **"Generate token"**
5. **¡IMPORTANTE!** Copia el token inmediatamente (solo se muestra una vez)

### Paso 2: Hacer Push con el Token

Ejecuta este comando (reemplaza `TU_TOKEN` con el token que copiaste):

```bash
cd /root/mkt-planner
git push -u origin main
```

Cuando te pida credenciales:
- **Username**: `JoyNund`
- **Password**: Pega el **Personal Access Token** (no tu contraseña de GitHub)

### Paso 3: Guardar Credenciales (Opcional)

Para no tener que ingresar el token cada vez:

```bash
# Configurar git credential helper
git config --global credential.helper store

# O usar cache (válido por 15 minutos)
git config --global credential.helper 'cache --timeout=900'
```

---

## 🔐 Opción 2: SSH Keys (Más Seguro a Largo Plazo)

### Paso 1: Generar SSH Key

```bash
ssh-keygen -t ed25519 -C "tu-email@ejemplo.com" -f ~/.ssh/github_mkt_planner
```

Presiona Enter para aceptar la ubicación y deja la passphrase vacía (o pon una si prefieres).

### Paso 2: Agregar la Clave a GitHub

```bash
# Mostrar la clave pública
cat ~/.ssh/github_mkt_planner.pub
```

1. Copia toda la salida del comando anterior
2. Ve a GitHub → Settings → SSH and GPG keys
3. Haz clic en **"New SSH key"**
4. **Title**: "MKT Planner Server"
5. **Key**: Pega la clave pública
6. Haz clic en **"Add SSH key"**

### Paso 3: Configurar Git para Usar SSH

```bash
cd /root/mkt-planner
git remote set-url origin git@github.com:JoyNund/mkt-planner.git
git push -u origin main
```

---

## 📋 Comandos Rápidos

### Verificar configuración:
```bash
cd /root/mkt-planner
git remote -v
git status
git log --oneline -5
```

### Hacer push:
```bash
git push -u origin main
```

### Si hay conflictos:
```bash
git pull origin main --rebase
git push -u origin main
```

---

## ✅ Commits Listos para Subir

1. `c2dae4b` - Agregar licencia MIT
2. `1fd46aa` - Remover bases de datos del tracking
3. `4cf8f99` - Actualizar .gitignore
4. `fb66dee` - funcional - antes de responsive

---

## 🆘 Solución de Problemas

### Error: "Authentication failed"
- Verifica que el token tenga permisos `repo`
- Asegúrate de usar el token, no tu contraseña

### Error: "Repository not found"
- Verifica que el repositorio exista en GitHub
- Verifica que tengas permisos de escritura

### Error: "Permission denied (publickey)"
- Si usas SSH, verifica que la clave esté agregada en GitHub
- Verifica la URL del remoto: `git remote -v`

---

¿Necesitas ayuda con algún paso? Puedo guiarte a través del proceso.

