import express from 'express';
import { z } from 'zod';
import { prisma } from '../server.js';
import { validateRequest } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';
import { logActivity, ACTION_TYPES, ENTITY_TYPES } from '../services/activityLogger.js';
import { configLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// Esquema de validación para configuración
const configSchema = z.object({
  slotDuration: z.number().min(15).max(120),
  advanceBookingDays: z.number().min(1).max(365),
  salonName: z.string().min(1).max(255),
  timezone: z.string(),
  defaultServices: z.array(z.string())
});

// Esquema de validación para horarios de trabajo
const workingHoursSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  enabled: z.boolean(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  breakStartTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  breakEndTime: z.string().regex(/^\d{2}:\d{2}$/).optional()
});

// Configuración por defecto
const DEFAULT_CONFIG = {
  slotDuration: 30,
  advanceBookingDays: 30,
  salonName: "Salón Invictus",
  timezone: "America/Argentina/Buenos_Aires",
  defaultServices: [
    "Corte de Cabello",
    "Lavado y Peinado", 
    "Corte + Lavado",
    "Barba",
    "Corte + Barba",
    "Tratamiento Capilar"
  ]
};

// Horarios por defecto
const DEFAULT_WORKING_HOURS = [
  { dayOfWeek: 0, enabled: false, startTime: "09:00", endTime: "18:00" }, // Domingo
  { dayOfWeek: 1, enabled: false, startTime: "09:00", endTime: "18:00" }, // Lunes
  { dayOfWeek: 2, enabled: true, startTime: "09:30", endTime: "20:00" },  // Martes
  { dayOfWeek: 3, enabled: true, startTime: "09:30", endTime: "20:00" },  // Miércoles
  { dayOfWeek: 4, enabled: true, startTime: "09:30", endTime: "20:00" },  // Jueves
  { dayOfWeek: 5, enabled: true, startTime: "09:30", endTime: "20:00" },  // Viernes
  { dayOfWeek: 6, enabled: true, startTime: "10:00", endTime: "19:00" }   // Sábado
];

// GET /api/config - Obtener configuración actual (público)
router.get('/', async (req, res) => {
  try {
    // Obtener configuración del salón
    let config = await prisma.salonConfig.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!config) {
      // Crear configuración por defecto si no existe
      config = await prisma.salonConfig.create({
        data: {
          slotDuration: DEFAULT_CONFIG.slotDuration,
          advanceBookingDays: DEFAULT_CONFIG.advanceBookingDays,
          salonName: DEFAULT_CONFIG.salonName,
          timezone: DEFAULT_CONFIG.timezone,
          defaultServices: JSON.stringify(DEFAULT_CONFIG.defaultServices)
        }
      });
    }

    // Obtener horarios de trabajo
    const workingHours = await prisma.workingHours.findMany({
      orderBy: { dayOfWeek: 'asc' }
    });

    // Si no hay horarios, crear los por defecto
    if (workingHours.length === 0) {
      for (const hour of DEFAULT_WORKING_HOURS) {
        await prisma.workingHours.create({
          data: hour
        });
      }
    }

    // Parsear JSON fields
    const parsedConfig = {
      id: config.id,
      slotDuration: config.slotDuration,
      advanceBookingDays: config.advanceBookingDays,
      salonName: config.salonName,
      timezone: config.timezone,
      defaultServices: JSON.parse(config.defaultServices),
      workingHours: workingHours.length > 0 ? workingHours : DEFAULT_WORKING_HOURS,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    };

    res.json({
      success: true,
      data: parsedConfig
    });
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la configuración'
    });
  }
});

// PUT /api/config - Actualizar configuración (requiere autenticación)
router.put('/', authenticateToken, configLimiter, validateRequest(configSchema), async (req, res) => {
  try {
    const { slotDuration, advanceBookingDays, salonName, timezone, defaultServices } = req.body;

    // Buscar configuración existente
    let config = await prisma.salonConfig.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    const configData = {
      slotDuration,
      advanceBookingDays,
      salonName,
      timezone,
      defaultServices: JSON.stringify(defaultServices),
      updatedById: req.admin.id
    };

    if (config) {
      // Actualizar configuración existente
      config = await prisma.salonConfig.update({
        where: { id: config.id },
        data: configData
      });
    } else {
      // Crear nueva configuración
      config = await prisma.salonConfig.create({
        data: configData
      });
    }

    // Log de actividad
    await logActivity({
      adminId: req.admin.id,
      action: ACTION_TYPES.CONFIG_UPDATE,
      entityType: ENTITY_TYPES.CONFIG,
      entityId: config.id,
      description: `Admin ${req.admin.username} actualizó la configuración del salón`,
      newValues: {
        slotDuration,
        advanceBookingDays,
        salonName,
        timezone,
        defaultServices
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Parsear JSON fields para la respuesta
    const parsedConfig = {
      id: config.id,
      slotDuration: config.slotDuration,
      advanceBookingDays: config.advanceBookingDays,
      salonName: config.salonName,
      timezone: config.timezone,
      defaultServices: JSON.parse(config.defaultServices),
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    };

    res.json({
      success: true,
      data: parsedConfig,
      message: 'Configuración actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando configuración:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar la configuración'
    });
  }
});

// PUT /api/config/working-hours - Actualizar horarios de trabajo (requiere autenticación)
router.put('/working-hours', authenticateToken, configLimiter, async (req, res) => {
  try {
    const { workingHours } = req.body;

    if (!Array.isArray(workingHours)) {
      return res.status(400).json({
        success: false,
        error: 'workingHours debe ser un array'
      });
    }

    // Actualizar cada horario
    const updatedHours = [];
    for (const hour of workingHours) {
      const updated = await prisma.workingHours.upsert({
        where: { dayOfWeek: hour.dayOfWeek },
        update: {
          enabled: hour.enabled,
          startTime: hour.startTime,
          endTime: hour.endTime,
          breakStartTime: hour.breakStartTime,
          breakEndTime: hour.breakEndTime
        },
        create: {
          dayOfWeek: hour.dayOfWeek,
          enabled: hour.enabled,
          startTime: hour.startTime,
          endTime: hour.endTime,
          breakStartTime: hour.breakStartTime,
          breakEndTime: hour.breakEndTime
        }
      });
      updatedHours.push(updated);
    }

    // Log de actividad
    await logActivity({
      adminId: req.admin.id,
      action: ACTION_TYPES.WORKING_HOURS_UPDATE,
      entityType: ENTITY_TYPES.WORKING_HOURS,
      description: `Admin ${req.admin.username} actualizó los horarios de trabajo`,
      newValues: { workingHours },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: updatedHours,
      message: 'Horarios de trabajo actualizados exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando horarios:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar los horarios de trabajo'
    });
  }
});

// POST /api/config/reset - Resetear a configuración por defecto (requiere autenticación)
router.post('/reset', authenticateToken, async (req, res) => {
  try {
    // Eliminar configuración existente
    await prisma.salonConfig.deleteMany();
    await prisma.workingHours.deleteMany();

    // Crear nueva configuración por defecto
    const config = await prisma.salonConfig.create({
      data: {
        slotDuration: DEFAULT_CONFIG.slotDuration,
        advanceBookingDays: DEFAULT_CONFIG.advanceBookingDays,
        salonName: DEFAULT_CONFIG.salonName,
        timezone: DEFAULT_CONFIG.timezone,
        defaultServices: JSON.stringify(DEFAULT_CONFIG.defaultServices),
        updatedById: req.admin.id
      }
    });

    // Crear horarios por defecto
    for (const hour of DEFAULT_WORKING_HOURS) {
      await prisma.workingHours.create({
        data: hour
      });
    }

    const parsedConfig = {
      id: config.id,
      slotDuration: config.slotDuration,
      advanceBookingDays: config.advanceBookingDays,
      salonName: config.salonName,
      timezone: config.timezone,
      defaultServices: JSON.parse(config.defaultServices),
      workingHours: DEFAULT_WORKING_HOURS,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    };

    // Log de actividad
    await logActivity({
      adminId: req.admin.id,
      action: ACTION_TYPES.CONFIG_RESET,
      entityType: ENTITY_TYPES.CONFIG,
      description: `Admin ${req.admin.username} restableció la configuración a valores por defecto`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: parsedConfig,
      message: 'Configuración restablecida a valores por defecto'
    });
  } catch (error) {
    console.error('Error restableciendo configuración:', error);
    res.status(500).json({
      success: false,
      error: 'Error al restablecer la configuración'
    });
  }
});

export default router;