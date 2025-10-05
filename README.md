# Sistema de Reservas - Peluquería

Sistema completo de gestión de reservas para peluquería con frontend en React/TypeScript y backend en Node.js/Express.

## 🏗️ Estructura del Proyecto

```
Peluqueria/
├── backend/          # API REST con Node.js/Express
├── project/          # Frontend React/TypeScript
└── README.md         # Este archivo
```

## 🚀 Tecnologías

### Backend
- **Node.js** con Express
- **Prisma ORM** con PostgreSQL
- **JWT** para autenticación
- **Google Calendar API** para sincronización
- **Render** para deploy

### Frontend
- **React 18** con TypeScript
- **Vite** como bundler
- **Tailwind CSS** para estilos
- **React Router** para navegación
- **Netlify** para deploy

## 📋 Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Cuenta en Render (para backend)
- Cuenta en Netlify (para frontend)
- Base de datos PostgreSQL

## 🛠️ Instalación Local

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Configurar variables de entorno
npm run dev
```

### Frontend

```bash
cd project
npm install
cp .env.example .env
# Configurar variables de entorno
npm run dev
```

## 🔧 Variables de Entorno

### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# JWT
JWT_SECRET="tu-jwt-secret-super-seguro"

# Google Calendar
GOOGLE_CLIENT_ID="tu-google-client-id"
GOOGLE_CLIENT_SECRET="tu-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3001/api/auth/google/callback"

# Server
PORT=3001
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
VITE_GOOGLE_CLIENT_ID=tu-google-client-id
```

## 🚀 Deploy

### Backend en Render

1. Conectar repositorio a Render
2. Configurar variables de entorno en Render
3. Render detectará automáticamente el `package.json` y hará deploy

### Frontend en Netlify

1. Conectar repositorio a Netlify
2. Configurar build settings:
   - Build command: `cd project && npm run build`
   - Publish directory: `project/dist`
3. Configurar variables de entorno en Netlify

## 📊 Base de Datos

El proyecto usa PostgreSQL con Prisma ORM. Las migraciones se ejecutan automáticamente en Render.

### Comandos útiles de Prisma:

```bash
# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Sincronizar esquema (desarrollo)
npm run db:push

# Abrir Prisma Studio
npm run db:studio
```

## 🔄 Sincronización con Google Calendar

El sistema incluye sincronización automática con Google Calendar:

- Las reservas se crean automáticamente en Google Calendar
- Sincronización cada 15 minutos
- Manejo de conflictos y duplicados

## 📝 Scripts Disponibles

### Backend
- `npm run dev` - Desarrollo con nodemon
- `npm start` - Producción
- `npm run db:generate` - Generar cliente Prisma
- `npm run db:migrate` - Ejecutar migraciones
- `npm run sync:daemon` - Iniciar daemon de sincronización

### Frontend
- `npm run dev` - Desarrollo con Vite
- `npm run build` - Build para producción
- `npm run preview` - Preview del build

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Si tienes problemas o preguntas, crea un issue en el repositorio.
