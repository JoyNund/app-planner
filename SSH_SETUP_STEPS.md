# 🔑 Pasos para Agregar la Clave SSH en GitHub

## ✅ Paso 1: Clave SSH Generada

La clave SSH ya está generada en el servidor.

## 📋 Paso 2: Agregar la Clave en GitHub

### Tu Clave Pública SSH:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFT4s7/9f9Jqiv9ZvUOtyXD2B1zfXMdj1rTRAowE3/yr mkt-planner-server
```

### Instrucciones:

1. **Copia la clave pública de arriba** (toda la línea completa)

2. **Ve a GitHub:**
   - Abre: https://github.com/settings/ssh/new
   - O ve a: Settings → SSH and GPG keys → New SSH key

3. **Completa el formulario:**
   - **Title**: `MKT Planner Server` (o el nombre que prefieras)
   - **Key type**: `Authentication Key`
   - **Key**: Pega la clave pública que copiaste arriba
   - Haz clic en **"Add SSH key"**

4. **Confirma tu contraseña de GitHub** si te la pide

## ✅ Paso 3: Verificar la Conexión

Una vez agregada la clave en GitHub, ejecuta este comando para verificar:

```bash
ssh -T git@github.com
```

Deberías ver un mensaje como:
```
Hi JoyNund! You've successfully authenticated, but GitHub does not provide shell access.
```

## 🚀 Paso 4: Hacer Push

Una vez verificada la conexión, ejecuta:

```bash
cd /root/mkt-planner
git push -u origin main
```

---

## 📝 Nota

La clave SSH está guardada en:
- **Clave privada**: `~/.ssh/github_mkt_planner` (NO compartir)
- **Clave pública**: `~/.ssh/github_mkt_planner.pub` (esta es la que agregas en GitHub)

