import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import { adminLimiter } from '../middleware/rateLimit.js';

const router = express.Router();
const prisma = new PrismaClient();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);
router.use(adminLimiter);

// GET /api/calendars - Obtener todos los calendarios configurados
router.get('/', async (req, res) => {
  try {
    const calendars = await prisma.googleCalendar.findMany({
      orderBy: [
        { isPrimary: 'desc' },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: calendars
    });
  } catch (error) {
    console.error('Error al obtener calendarios:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los calendarios'
    });
  }
});

// GET /api/calendars/active - Obtener solo calendarios activos
router.get('/active', async (req, res) => {
  try {
    const calendars = await prisma.googleCalendar.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        { isPrimary: 'desc' },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: calendars
    });
  } catch (error) {
    console.error('Error al obtener calendarios activos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los calendarios activos'
    });
  }
});

// POST /api/calendars - Crear un nuevo calendario
router.post('/', async (req, res) => {
  try {
    const { name, calendarId, email, description, colorId } = req.body;
    const adminId = req.admin.id;

    // Validaciones básicas
    if (!name || !calendarId || !email) {
      return res.status(400).json({
        success: false,
        error: 'Nombre, ID del calendario y email son requeridos'
      });
    }

    // Verificar que el calendario no exista ya
    const existingCalendar = await prisma.googleCalendar.findUnique({
      where: { calendarId }
    });

    if (existingCalendar) {
      return res.status(409).json({
        success: false,
        error: 'Este calendario ya está configurado'
      });
    }

    // Si es el primer calendario o se marca como primario, hacer que sea primario
    const existingCalendars = await prisma.googleCalendar.count();
    const isPrimary = existingCalendars === 0 || req.body.isPrimary === true;

    // Si se marca como primario, desmarcar otros
    if (isPrimary) {
      await prisma.googleCalendar.updateMany({
        where: { isPrimary: true },
        data: { isPrimary: false }
      });
    }

    const calendar = await prisma.googleCalendar.create({
      data: {
        name,
        calendarId,
        email,
        description,
        colorId,
        isPrimary,
        updatedById: adminId
      }
    });

    res.status(201).json({
      success: true,
      data: calendar,
      message: 'Calendario creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear calendario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear el calendario'
    });
  }
});

// PUT /api/calendars/:id - Actualizar un calendario
router.put('/:id', async (req, res) => {
  try {
    const calendarId = parseInt(req.params.id, 10);
    const { name, calendarId: newCalendarId, email, description, colorId, isActive, isPrimary } = req.body;
    const adminId = req.admin.id;

    if (isNaN(calendarId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de calendario inválido'
      });
    }

    // Verificar que el calendario existe
    const existingCalendar = await prisma.googleCalendar.findUnique({
      where: { id: calendarId }
    });

    if (!existingCalendar) {
      return res.status(404).json({
        success: false,
        error: 'Calendario no encontrado'
      });
    }

    // Si se cambia el calendarId, verificar que no exista otro con el mismo ID
    if (newCalendarId && newCalendarId !== existingCalendar.calendarId) {
      const duplicateCalendar = await prisma.googleCalendar.findUnique({
        where: { calendarId: newCalendarId }
      });

      if (duplicateCalendar) {
        return res.status(409).json({
          success: false,
          error: 'Ya existe un calendario con este ID'
        });
      }
    }

    // Si se marca como primario, desmarcar otros
    if (isPrimary) {
      await prisma.googleCalendar.updateMany({
        where: { 
          isPrimary: true,
          id: { not: calendarId }
        },
        data: { isPrimary: false }
      });
    }

    const updatedCalendar = await prisma.googleCalendar.update({
      where: { id: calendarId },
      data: {
        ...(name && { name }),
        ...(newCalendarId && { calendarId: newCalendarId }),
        ...(email && { email }),
        ...(description !== undefined && { description }),
        ...(colorId !== undefined && { colorId }),
        ...(isActive !== undefined && { isActive }),
        ...(isPrimary !== undefined && { isPrimary }),
        updatedById: adminId
      }
    });

    res.json({
      success: true,
      data: updatedCalendar,
      message: 'Calendario actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar calendario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el calendario'
    });
  }
});

// DELETE /api/calendars/:id - Eliminar un calendario
router.delete('/:id', async (req, res) => {
  try {
    const calendarId = parseInt(req.params.id, 10);

    if (isNaN(calendarId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de calendario inválido'
      });
    }

    // Verificar que el calendario existe
    const existingCalendar = await prisma.googleCalendar.findUnique({
      where: { id: calendarId }
    });

    if (!existingCalendar) {
      return res.status(404).json({
        success: false,
        error: 'Calendario no encontrado'
      });
    }

    // Verificar que no sea el único calendario primario
    if (existingCalendar.isPrimary) {
      const otherCalendars = await prisma.googleCalendar.count({
        where: {
          id: { not: calendarId }
        }
      });

      if (otherCalendars > 0) {
        // Marcar otro calendario como primario
        await prisma.googleCalendar.updateMany({
          where: {
            id: { not: calendarId },
            isActive: true
          },
          data: { isPrimary: true }
        });
      }
    }

    await prisma.googleCalendar.delete({
      where: { id: calendarId }
    });

    res.json({
      success: true,
      message: 'Calendario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar calendario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar el calendario'
    });
  }
});

// POST /api/calendars/:id/set-primary - Establecer como calendario primario
router.post('/:id/set-primary', async (req, res) => {
  try {
    const calendarId = parseInt(req.params.id, 10);

    if (isNaN(calendarId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de calendario inválido'
      });
    }

    // Verificar que el calendario existe y está activo
    const calendar = await prisma.googleCalendar.findFirst({
      where: { 
        id: calendarId,
        isActive: true
      }
    });

    if (!calendar) {
      return res.status(404).json({
        success: false,
        error: 'Calendario no encontrado o inactivo'
      });
    }

    // Desmarcar otros calendarios como primarios
    await prisma.googleCalendar.updateMany({
      where: { 
        isPrimary: true,
        id: { not: calendarId }
      },
      data: { isPrimary: false }
    });

    // Marcar este calendario como primario
    const updatedCalendar = await prisma.googleCalendar.update({
      where: { id: calendarId },
      data: { 
        isPrimary: true,
        updatedById: req.admin.id
      }
    });

    res.json({
      success: true,
      data: updatedCalendar,
      message: 'Calendario establecido como primario'
    });
  } catch (error) {
    console.error('Error al establecer calendario primario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al establecer el calendario como primario'
    });
  }
});

export default router;
