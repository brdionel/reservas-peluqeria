import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { smartLimiter } from './middleware/rateLimit.js';

// Importar rutas
import bookingRoutes from './routes/bookings.js';
import clientRoutes from './routes/clients.js';
import configRoutes from './routes/config.js';
import slotRoutes from './routes/slots.js';
import authRoutes from './routes/auth.js';
import activityRoutes from './routes/activity.js';
import syncRoutes from './routes/sync.js';
import initRoutes from './routes/init.js';
import calendarRoutes from './routes/calendars.js';
import keepAliveService from './services/keepAliveService.js';
import cronService from './services/cronService.js';

// Configuración
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// Inicializar Prisma
export const prisma = new PrismaClient();

// Middleware de seguridad
app.use(helmet());

// Rate limiting inteligente (diferentes límites para admin y clientes)
app.use(smartLimiter);

// CORS
const allowedOrigins = [
  'http://localhost:5173',
  'https://unique-lolly-3c4f22.netlify.app',
  'https://*.netlify.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps o Postman)
    if (!origin) return callback(null, true);
    
    // Verificar si el origin está en la lista de permitidos
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        return origin.includes(allowedOrigin.replace('*', ''));
      }
      return origin === allowedOrigin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/config', configRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/init', initRoutes);
app.use('/api/calendars', calendarRoutes);

// Health check endpoint para mantener la aplicación activa
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Endpoint para controlar el keep-alive
app.get('/api/keep-alive/status', (req, res) => {
  res.json(keepAliveService.getStatus());
});

app.post('/api/keep-alive/start', (req, res) => {
  keepAliveService.start();
  res.json({ message: 'Keep-alive iniciado', status: keepAliveService.getStatus() });
});

app.post('/api/keep-alive/stop', (req, res) => {
  keepAliveService.stop();
  res.json({ message: 'Keep-alive detenido', status: keepAliveService.getStatus() });
});

// Endpoints para controlar el cron service
app.get('/api/cron/status', (req, res) => {
  res.json(cronService.getStatus());
});

app.post('/api/cron/start', (req, res) => {
  cronService.start();
  res.json({ message: 'Cron service iniciado', status: cronService.getStatus() });
});

app.post('/api/cron/stop', (req, res) => {
  cronService.stop();
  res.json({ message: 'Cron service detenido', status: cronService.getStatus() });
});

app.post('/api/cron/run-now', async (req, res) => {
  try {
    await cronService.runManualSync();
    res.json({ message: 'Sincronización manual ejecutada', status: cronService.getStatus() });
  } catch (error) {
    res.status(500).json({ error: 'Error ejecutando sincronización manual', message: error.message });
  }
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de Peluquería Invictus',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      bookings: '/api/bookings',
      clients: '/api/clients',
      config: '/api/config',
      slots: '/api/slots',
      activity: '/api/activity',
      calendars: '/api/calendars',
      health: '/api/health'
    }
  });
});

// Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint no encontrado',
    path: req.originalUrl 
  });
});

// Manejo global de errores
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Algo salió mal'
  });
});

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🎯 Frontend URL: ${process.env.FRONTEND_URL}`);
  
  // Inicializar base de datos en producción
  if (process.env.NODE_ENV === 'production') {
    try {
      console.log('🔄 Inicializando base de datos de producción...');
      // La inicialización se hará manualmente desde la consola
      console.log('✅ Servidor listo. Ejecuta "npm run init:prod" para inicializar la base de datos.');
    } catch (error) {
      console.error('❌ Error inicializando base de datos:', error);
    }
  }
  
  // Iniciar keep-alive automáticamente en producción
  if (process.env.NODE_ENV === 'production') {
    console.log('🔄 Iniciando keep-alive automático...');
    keepAliveService.start();
    
    console.log('🔄 Iniciando cron service automático...');
    cronService.start();
  }
});

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🔄 Cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});