# 🚀 Guía de Deploy - Sistema de Reservas

Esta guía te ayudará a desplegar el sistema completo en Railway (backend) y Netlify (frontend).

## 📋 Prerrequisitos

1. **Cuenta en GitHub** - Para el repositorio
2. **Cuenta en Railway** - Para el backend y base de datos
3. **Cuenta en Netlify** - Para el frontend
4. **Cuenta en Google Cloud** - Para Google Calendar API

## 🔄 Paso 1: Preparar el Repositorio

### 1.1 Inicializar Git (si no está inicializado)
```bash
git init
git add .
git commit -m "Initial commit: Sistema de reservas completo"
```

### 1.2 Crear repositorio en GitHub
1. Ve a [GitHub](https://github.com) y crea un nuevo repositorio
2. Sigue las instrucciones para subir tu código:
```bash
git remote add origin https://github.com/tu-usuario/tu-repositorio.git
git branch -M main
git push -u origin main
```

## 🗄️ Paso 2: Configurar Base de Datos PostgreSQL

### 2.1 Crear base de datos en Railway
1. Ve a [Railway](https://railway.app)
2. Crea una nueva cuenta o inicia sesión
3. Haz clic en "New Project"
4. Selecciona "Provision PostgreSQL"
5. Anota la URL de conexión que te proporciona Railway

### 2.2 Configurar variables de entorno
En Railway, ve a tu proyecto y configura las variables de entorno:

```env
DATABASE_URL="postgresql://user:password@host:port/database"
JWT_SECRET="tu-jwt-secret-super-seguro-cambiar-en-produccion"
NODE_ENV="production"
PORT="3001"
```

## 🔧 Paso 3: Configurar Google Calendar API

### 3.1 Crear proyecto en Google Cloud
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto
3. Habilita la Google Calendar API
4. Crea credenciales OAuth 2.0
5. Configura las URLs autorizadas:
   - `http://localhost:3001` (desarrollo)
   - `https://tu-backend.railway.app` (producción)

### 3.2 Obtener credenciales
Anota el Client ID y Client Secret que te proporciona Google.

## 🚀 Paso 4: Deploy del Backend en Railway

### 4.1 Conectar repositorio
1. En Railway, haz clic en "New Service"
2. Selecciona "GitHub Repo"
3. Conecta tu repositorio de GitHub
4. Selecciona la carpeta `backend`

### 4.2 Configurar variables de entorno
Agrega estas variables en Railway:

```env
DATABASE_URL="postgresql://user:password@host:port/database"
JWT_SECRET="tu-jwt-secret-super-seguro-cambiar-en-produccion"
GOOGLE_CLIENT_ID="tu-google-client-id"
GOOGLE_CLIENT_SECRET="tu-google-client-secret"
GOOGLE_REDIRECT_URI="https://tu-backend.railway.app/api/auth/google/callback"
NODE_ENV="production"
PORT="3001"
FRONTEND_URL="https://tu-frontend.netlify.app"
```

### 4.3 Configurar build
Railway detectará automáticamente el `package.json` y ejecutará:
- `npm install`
- `npm run build` (que incluye `npm run db:generate && npm run db:migrate`)

### 4.4 Inicializar la base de datos
Una vez que el deploy esté completo, ejecuta:
```bash
# En Railway, ve a la pestaña "Deployments" y ejecuta:
npm run init:prod
```

## 🌐 Paso 5: Deploy del Frontend en Netlify

### 5.1 Conectar repositorio
1. Ve a [Netlify](https://netlify.com)
2. Crea una cuenta o inicia sesión
3. Haz clic en "New site from Git"
4. Conecta tu repositorio de GitHub

### 5.2 Configurar build settings
Configura estos valores en Netlify:

- **Base directory**: `project`
- **Build command**: `npm run build`
- **Publish directory**: `dist`

### 5.3 Configurar variables de entorno
En Netlify, ve a "Site settings" > "Environment variables" y agrega:

```env
VITE_API_URL=https://tu-backend.railway.app/api
VITE_GOOGLE_CLIENT_ID=tu-google-client-id
```

### 5.4 Configurar redirects
En Netlify, crea un archivo `_redirects` en la carpeta `project/public`:

```
/*    /index.html   200
```

## 🔄 Paso 6: Migrar datos existentes (opcional)

Si tienes datos en SQLite que quieres migrar:

### 6.1 Localmente
```bash
cd backend
# Configura DATABASE_URL para PostgreSQL
npm run migrate:to-postgres
```

### 6.2 En Railway
1. Sube tu archivo `dev.db` a Railway
2. Ejecuta el script de migración desde la consola de Railway

## ✅ Paso 7: Verificar el Deploy

### 7.1 Verificar Backend
- URL: `https://tu-backend.railway.app`
- Endpoint de prueba: `https://tu-backend.railway.app/api/config`

### 7.2 Verificar Frontend
- URL: `https://tu-frontend.netlify.app`
- Debería cargar correctamente y conectarse al backend

### 7.3 Verificar Base de Datos
- Accede a Prisma Studio: `https://tu-backend.railway.app/api/db-studio`
- O usa el comando: `npm run db:studio`

## 🔧 Paso 8: Configuración Final

### 8.1 Actualizar URLs en Google Cloud
1. Ve a Google Cloud Console
2. Actualiza las URLs autorizadas con tu dominio de producción
3. Agrega: `https://tu-frontend.netlify.app`

### 8.2 Configurar dominio personalizado (opcional)
- En Railway: Configura un dominio personalizado para el backend
- En Netlify: Configura un dominio personalizado para el frontend

### 8.3 Configurar SSL
Tanto Railway como Netlify proporcionan SSL automático.

## 🚨 Troubleshooting

### Problemas comunes:

1. **Error de conexión a la base de datos**
   - Verifica que `DATABASE_URL` esté correcta
   - Asegúrate de que la base de datos esté activa en Railway

2. **Error de CORS**
   - Verifica que `FRONTEND_URL` esté configurada correctamente
   - Asegúrate de que el frontend esté usando la URL correcta del backend

3. **Error de Google Calendar**
   - Verifica las credenciales de Google
   - Asegúrate de que las URLs estén autorizadas

4. **Error de build**
   - Verifica que todas las dependencias estén en `package.json`
   - Revisa los logs de build en Railway/Netlify

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Railway y Netlify
2. Verifica las variables de entorno
3. Asegúrate de que todos los servicios estén funcionando
4. Crea un issue en el repositorio

## 🎉 ¡Listo!

Tu sistema de reservas está ahora desplegado y funcionando en:
- **Backend**: Railway con PostgreSQL
- **Frontend**: Netlify
- **Base de datos**: PostgreSQL en Railway

¡Disfruta de tu sistema de reservas en producción! 🚀
