# Backend - Sistema de Reservas Peluquería

Backend API para el sistema de reservas de la Peluquería Invictus.

## 🚀 Tecnologías

- **Node.js** + **Express** - Servidor web
- **Prisma** - ORM para base de datos
- **SQLite** - Base de datos (desarrollo)
- **Zod** - Validación de datos
- **JWT** - Autenticación (futuro)

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Configurar base de datos
npm run db:generate
npm run db:push

# Iniciar servidor de desarrollo
npm run dev
```

## 🗄️ Base de Datos

### Modelos principales:

- **Client**: Información de clientes
- **Booking**: Reservas de turnos
- **SalonConfig**: Configuración del salón
- **BlockedSlot**: Horarios bloqueados

### Comandos útiles:

```bash
# Generar cliente Prisma
npm run db:generate

# Aplicar cambios al schema
npm run db:push

# Abrir Prisma Studio
npm run db:studio
```

## 🛠️ API Endpoints

### Reservas (`/api/bookings`)
- `GET /` - Listar reservas
- `POST /` - Crear reserva
- `GET /:id` - Obtener reserva
- `PUT /:id` - Actualizar reserva
- `DELETE /:id` - Eliminar reserva

### Clientes (`/api/clients`)
- `GET /` - Listar clientes
- `POST /` - Crear cliente
- `GET /:id` - Obtener cliente
- `PUT /:id` - Actualizar cliente
- `DELETE /:id` - Eliminar cliente

### Horarios (`/api/slots`)
- `GET /:date` - Slots disponibles por fecha
- `GET /` - Slots para múltiples fechas

### Configuración (`/api/config`)
- `GET /` - Obtener configuración
- `PUT /` - Actualizar configuración
- `POST /reset` - Resetear configuración

## 🔧 Variables de Entorno

Copia `.env.example` a `.env` y configura:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="tu_jwt_secret"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

## 📝 Ejemplo de Uso

```javascript
// Crear una reserva
const response = await fetch('http://localhost:3001/api/bookings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Juan Pérez',
    phone: '+54 9 11 1234-5678',
    date: '2024-01-15',
    time: '10:30',
    service: 'Corte de Cabello'
  })
});

const booking = await response.json();
```

## 🚦 Estados de Reserva

- `CONFIRMED` - Confirmada
- `CANCELLED` - Cancelada
- `COMPLETED` - Completada
- `NO_SHOW` - No se presentó

## 📊 Desarrollo

```bash
# Modo desarrollo con auto-reload
npm run dev

# Verificar salud de la API
curl http://localhost:3001/api/health
```

El servidor estará disponible en `http://localhost:3001`