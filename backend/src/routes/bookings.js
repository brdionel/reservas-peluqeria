import express from 'express';
import { z } from 'zod';
import { prisma } from '../server.js';
import { validateRequest } from '../middleware/validation.js';
import { createCalendarEvent, deleteCalendarEvent, updateCalendarEvent } from '../services/googleCalendar.js';
import { bookingLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// Esquemas de validación
const createBookingSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().min(8, 'El teléfono debe tener al menos 8 caracteres'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)'),
  service: z.string().optional(),
  notes: z.string().optional()
});

const updateBookingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  status: z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
  service: z.string().optional(),
  notes: z.string().optional()
});

// GET /api/bookings - Obtener todas las reservas
router.get('/', async (req, res) => {
  try {
    const { date, status, limit = 100 } = req.query;
    
    const where = {};
    if (date) where.date = date;
    if (status) where.status = status;

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            isRegular: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { time: 'desc' }
      ],
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: bookings,
      count: bookings.length
    });
  } catch (error) {
    console.error('Error obteniendo reservas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las reservas'
    });
  }
});

// GET /api/bookings/:id - Obtener una reserva específica
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        client: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error obteniendo reserva:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la reserva'
    });
  }
});

// POST /api/bookings - Crear nueva reserva
router.post('/', bookingLimiter, validateRequest(createBookingSchema), async (req, res) => {
  try {
    const { name, phone, date, time, service, notes } = req.body;

    // Verificar si el slot ya está ocupado
    const existingBooking = await prisma.booking.findFirst({
      where: {
        date,
        time
      }
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        error: 'Este horario ya está ocupado'
      });
    }

    // Verificar que la fecha no sea pasada
    const bookingDate = new Date(date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      return res.status(400).json({
        success: false,
        error: 'No se pueden hacer reservas en fechas pasadas'
      });
    }

    // Buscar o crear cliente
    let client = await prisma.client.findUnique({
      where: { phone }
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          name,
          phone,
          isRegular: false
        }
      });
    } else {
      // Actualizar nombre si es diferente
      if (client.name !== name) {
        client = await prisma.client.update({
          where: { id: client.id },
          data: { name }
        });
      }
    }

    // Crear la reserva
    const booking = await prisma.booking.create({
      data: {
        clientId: client.id,
        date,
        time,
        service,
        notes,
        status: 'CONFIRMED'
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            isRegular: true
          }
        }
      }
    });

    // Crear evento en Google Calendar
    console.log('🔄 Intentando crear evento en Google Calendar para:', client.name, 'el', date, 'a las', time);
    const calendarResult = await createCalendarEvent({
      clientName: client.name,
      clientPhone: client.phone,
      date,
      time,
      service,
      notes
    });
    console.log('📊 Resultado de Google Calendar:', calendarResult);

    // Si se creó exitosamente en Google Calendar, actualizar la reserva con el ID del evento
    if (calendarResult.success) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { googleEventId: calendarResult.eventId }
      });
      
      console.log('✅ Reserva creada y sincronizada con Google Calendar');
    } else {
      console.warn('⚠️ Reserva creada pero falló la sincronización con Google Calendar:', calendarResult.error);
    }

    res.status(201).json({
      success: true,
      data: {
        ...booking,
        googleCalendar: calendarResult.success ? {
          eventId: calendarResult.eventId,
          eventUrl: calendarResult.eventUrl
        } : null
      },
      message: 'Reserva creada exitosamente' + (calendarResult.success ? ' y agregada al calendario' : '')
    });
  } catch (error) {
    console.error('Error creando reserva:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear la reserva'
    });
  }
});

// PUT /api/bookings/:id - Actualizar reserva
router.put('/:id', validateRequest(updateBookingSchema), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }
    const updateData = req.body;

    // Verificar que la reserva existe
    const existingBooking = await prisma.booking.findUnique({
      where: { id }
    });

    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }

    // Si se está cambiando fecha/hora, verificar disponibilidad
    if (updateData.date || updateData.time) {
      const newDate = updateData.date || existingBooking.date;
      const newTime = updateData.time || existingBooking.time;

      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          date: newDate,
          time: newTime,
          id: { not: id }
        }
      });

      if (conflictingBooking) {
        return res.status(409).json({
          success: false,
          error: 'El nuevo horario ya está ocupado'
        });
      }
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            isRegular: true
          }
        }
      }
    });

    // Actualizar evento en Google Calendar si existe
    let calendarResult = { success: true };
    if (existingBooking.googleEventId && (updateData.date || updateData.time || updateData.service || updateData.notes)) {
      calendarResult = await updateCalendarEvent(existingBooking.googleEventId, {
        clientName: updatedBooking.client.name,
        clientPhone: updatedBooking.client.phone,
        date: updatedBooking.date,
        time: updatedBooking.time,
        service: updatedBooking.service,
        notes: updatedBooking.notes
      });
      
      if (calendarResult.success) {
        console.log('✅ Evento actualizado en Google Calendar:', existingBooking.googleEventId);
      } else {
        console.warn('⚠️ Error al actualizar evento en Google Calendar:', calendarResult.error);
      }
    }

    res.json({
      success: true,
      data: updatedBooking,
      message: 'Reserva actualizada exitosamente' + (calendarResult.success && existingBooking.googleEventId ? ' y sincronizada con el calendario' : '')
    });
  } catch (error) {
    console.error('Error actualizando reserva:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar la reserva'
    });
  }
});

// DELETE /api/bookings/:id - Cancelar/eliminar reserva
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }

    // Eliminar evento de Google Calendar si existe
    let calendarResult = { success: true };
    if (booking.googleEventId) {
      calendarResult = await deleteCalendarEvent(booking.googleEventId);
      if (calendarResult.success) {
        console.log('✅ Evento eliminado de Google Calendar:', booking.googleEventId);
      } else {
        console.warn('⚠️ Error al eliminar evento de Google Calendar:', calendarResult.error);
      }
    }

    const deleteResult = await prisma.booking.deleteMany({
      where: { id }
    });
    
    if (deleteResult.count === 0) {
      return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
    }

    res.json({
      success: true,
      message: 'Reserva eliminada exitosamente' + (calendarResult.success && booking.googleEventId ? ' y removida del calendario' : '')
    });
  } catch (error) {
    console.error('Error eliminando reserva:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar la reserva',
      details: error?.message,
      code: error?.code
    });
  }
});

export default router;