import express from 'express';
import { z } from 'zod';
import { prisma } from '../server.js';
import { validateRequest } from '../middleware/validation.js';
import { createCalendarEvent, deleteCalendarEvent, updateCalendarEvent } from '../services/googleCalendar.js';
import { whatsappService } from '../services/whatsappService.js';
import { bookingLimiter } from '../middleware/rateLimit.js';
import { validatePhoneFormat } from '../utils/phoneValidation.js';

const router = express.Router();

// Esquemas de validación
const createBookingSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 caracteres'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)'),
  service: z.string().optional(),
  notes: z.string().optional(),
  source: z.enum(['booking_form', 'admin_panel']).optional().default('booking_form'),
  sourceDetails: z.string().optional()
}).refine((data) => {
  const phoneValidation = validatePhoneFormat(data.phone);
  return phoneValidation.isValid;
}, {
  message: "Formato de teléfono argentino inválido",
  path: ["phone"]
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
    const { name, phone, date, time, service, notes, source = 'booking_form', sourceDetails } = req.body;

    // Verificar si el slot ya está ocupado (excluyendo cancelados)
    const existingBooking = await prisma.booking.findFirst({
      where: {
        date,
        time,
        status: { not: 'CANCELLED' } // Los turnos cancelados no bloquean el slot
      }
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        error: 'Este horario ya está ocupado'
      });
    }

    // Verificar si hay un turno cancelado en este slot que podamos reactivar
    const cancelledBooking = await prisma.booking.findFirst({
      where: {
        date,
        time,
        status: 'CANCELLED'
      },
      include: {
        client: true
      }
    });

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

    // Buscar cliente activo (no eliminado)
    let client = await prisma.client.findFirst({
      where: { 
        phone,
        isDeleted: false
      }
    });

    if (!client) {
      // Buscar si existe un cliente eliminado con el mismo teléfono
      const deletedClient = await prisma.client.findFirst({
        where: { 
          phone,
          isDeleted: true
        }
      });

      if (deletedClient) {
        // Reactivar cliente eliminado
        client = await prisma.client.update({
          where: { id: deletedClient.id },
          data: {
            name,
            isDeleted: false,
            deletedAt: null,
            source: source,
            sourceDetails: sourceDetails || (source === 'admin_panel' ? 'Cliente reactivado desde panel de administración' : 'Cliente reactivado desde formulario de reserva'),
            isVerified: source === 'admin_panel' ? true : deletedClient.isVerified // Si viene del admin, verificar; si no, mantener el estado anterior
          }
        });
      } else {
        // Crear nuevo cliente
        client = await prisma.client.create({
          data: {
            name,
            phone,
            isRegular: false,
            source: source,
            sourceDetails: sourceDetails || (source === 'admin_panel' ? 'Cliente creado desde panel de administración' : 'Cliente creado desde formulario de reserva'),
            isVerified: source === 'admin_panel' // Los clientes creados desde el admin están verificados automáticamente
          }
        });
      }
    } else {
      // Actualizar nombre si es diferente
      if (client.name !== name) {
        client = await prisma.client.update({
          where: { id: client.id },
          data: { name }
        });
      }
    }

    // Si hay un turno cancelado en este slot, reactivarlo en lugar de crear uno nuevo
    let booking;
    if (cancelledBooking) {
      console.log('🔄 Reactivando turno cancelado existente');
      // Actualizar el turno cancelado con los nuevos datos
      booking = await prisma.booking.update({
        where: { id: cancelledBooking.id },
        data: {
          clientId: client.id,
          service,
          notes,
          status: 'CONFIRMED',
          source: source,
          sourceDetails: sourceDetails,
          googleEventIds: null // Limpiar eventos antiguos, se crearán nuevos
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
    } else {
      // Crear la reserva nueva
      booking = await prisma.booking.create({
        data: {
          clientId: client.id,
          date,
          time,
          service,
          notes,
          status: 'CONFIRMED',
          source: source,
          sourceDetails: sourceDetails
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
    }

    // Obtener calendarios activos para crear eventos
    const activeCalendars = await prisma.googleCalendar.findMany({
      where: { isActive: true },
      select: { calendarId: true }
    });

    const calendarIds = activeCalendars.map(cal => cal.calendarId);

    // Crear evento en múltiples calendarios de Google Calendar
    console.log('🔄 Intentando crear evento en Google Calendar para:', client.name, 'el', date, 'a las', time);
    console.log('📅 Calendarios activos:', calendarIds);
    
    const calendarResult = await createCalendarEvent({
      clientName: client.name,
      clientPhone: client.phone,
      date,
      time,
      service,
      notes,
      calendarIds
    });
    console.log('📊 Resultado de Google Calendar:', calendarResult);

    // Si se creó exitosamente en Google Calendar, actualizar la reserva con los IDs de los eventos
    if (calendarResult.success) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { 
          googleEventIds: JSON.stringify(calendarResult.eventIds)
        }
      });
      
      console.log('✅ Reserva creada y sincronizada con Google Calendar en', calendarResult.eventIds.length, 'calendario(s)');
    } else {
      console.warn('⚠️ Reserva creada pero falló la sincronización con Google Calendar:', calendarResult.error);
    }

    // Enviar WhatsApp de confirmación solo si viene de la vista cliente
    let whatsappResult = { success: false, error: 'WhatsApp no configurado' };
    if (source === 'booking_form' && whatsappService.isConfigured()) {
      try {
        console.log('📱 Enviando WhatsApp de confirmación a:', client.phone);
        whatsappResult = await whatsappService.sendBookingConfirmation({
          client,
          date,
          time,
          service,
          notes
        });
        
        if (whatsappResult.success) {
          console.log('✅ WhatsApp enviado exitosamente:', whatsappResult.messageId);
        } else {
          console.warn('⚠️ Error enviando WhatsApp:', whatsappResult.error);
        }
      } catch (error) {
        console.error('❌ Error enviando WhatsApp:', error);
        whatsappResult = { success: false, error: error.message };
      }
    } else if (source === 'booking_form' && !whatsappService.isConfigured()) {
      console.log('ℹ️ WhatsApp no configurado, saltando envío de confirmación');
      whatsappResult = { success: false, error: 'WhatsApp no configurado' };
    } else {
      console.log('ℹ️ Booking creado desde admin panel, saltando envío de WhatsApp');
    }

    // Guardar estado de WhatsApp en la base de datos
    if (whatsappResult.success || whatsappResult.error) {
      const whatsappStatusData = {
        success: whatsappResult.success,
        messageId: whatsappResult.messageId || null,
        provider: whatsappResult.provider || null,
        sentAt: whatsappResult.success ? new Date().toISOString() : null,
        error: whatsappResult.error || null
      };

      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          whatsappStatus: JSON.stringify(whatsappStatusData)
        }
      });

      console.log('💾 Estado de WhatsApp guardado en base de datos');
    }

    res.status(201).json({
      success: true,
      data: {
        ...booking,
        googleCalendar: calendarResult.success ? {
          eventIds: calendarResult.eventIds,
          primaryEventId: calendarResult.primaryEventId,
          primaryEventUrl: calendarResult.primaryEventUrl,
          results: calendarResult.results
        } : null,
        whatsapp: whatsappResult.success ? {
          messageId: whatsappResult.messageId,
          sent: true
        } : {
          sent: false,
          error: whatsappResult.error
        }
      },
      message: 'Reserva creada exitosamente' + 
        (calendarResult.success ? ' y agregada al calendario' : '') +
        (whatsappResult.success ? ' y WhatsApp enviado' : '')
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
          id: { not: id },
          status: { not: 'CANCELLED' } // Los turnos cancelados no bloquean el slot
        }
      });

      if (conflictingBooking) {
        return res.status(409).json({
          success: false,
          error: 'El nuevo horario ya está ocupado'
        });
      }
    }

    // Verificar si se está cancelando el turno
    const isCancelling = updateData.status === 'CANCELLED' && existingBooking.status !== 'CANCELLED';
    
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

    // Si se está cancelando, eliminar eventos de Google Calendar
    let calendarResult = { success: true };
    if (isCancelling && existingBooking.googleEventIds) {
      try {
        const eventIds = JSON.parse(existingBooking.googleEventIds);
        
        // Obtener calendarios activos para saber en qué calendarios eliminar
        const activeCalendars = await prisma.googleCalendar.findMany({
          where: { isActive: true },
          select: { calendarId: true }
        });
        const calendarIds = activeCalendars.map(cal => cal.calendarId);
        
        calendarResult = await deleteCalendarEvent(eventIds, calendarIds);
        
        if (calendarResult.success) {
          console.log('✅ Evento eliminado de Google Calendar:', eventIds);
          // Limpiar los IDs de eventos del booking
          await prisma.booking.update({
            where: { id },
            data: { googleEventIds: null }
          });
        } else {
          console.warn('⚠️ Error al eliminar evento de Google Calendar:', calendarResult.error);
        }
      } catch (error) {
        console.error('❌ Error procesando eliminación de evento:', error);
        calendarResult = { success: false, error: error.message };
      }
    }
    // Actualizar evento en Google Calendar si existe y no se está cancelando
    else if (existingBooking.googleEventIds && (updateData.date || updateData.time || updateData.service || updateData.notes) && !isCancelling) {
      const eventIds = JSON.parse(existingBooking.googleEventIds);
      
      // Obtener calendarios activos
      const activeCalendars = await prisma.googleCalendar.findMany({
        where: { isActive: true },
        select: { calendarId: true }
      });
      const calendarIds = activeCalendars.map(cal => cal.calendarId);
      
      calendarResult = await updateCalendarEvent(eventIds, {
        clientName: updatedBooking.client.name,
        clientPhone: updatedBooking.client.phone,
        date: updatedBooking.date,
        time: updatedBooking.time,
        service: updatedBooking.service,
        notes: updatedBooking.notes
      }, calendarIds);
      
      if (calendarResult.success) {
        console.log('✅ Evento actualizado en Google Calendar:', eventIds);
        // Actualizar los IDs de los eventos si cambiaron
        if (calendarResult.eventIds) {
          await prisma.booking.update({
            where: { id },
            data: { googleEventIds: JSON.stringify(calendarResult.eventIds) }
          });
        }
      } else {
        console.warn('⚠️ Error al actualizar evento en Google Calendar:', calendarResult.error);
      }
    }

    let message = 'Reserva actualizada exitosamente';
    if (isCancelling && calendarResult.success) {
      message += ' y evento eliminado del calendario';
    } else if (calendarResult.success && existingBooking.googleEventIds && !isCancelling) {
      message += ' y sincronizada con el calendario';
    }

    res.json({
      success: true,
      data: updatedBooking,
      message: message
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
    if (booking.googleEventIds) {
      const eventIds = JSON.parse(booking.googleEventIds);
      
      // Obtener calendarios activos
      const activeCalendars = await prisma.googleCalendar.findMany({
        where: { isActive: true },
        select: { calendarId: true }
      });
      const calendarIds = activeCalendars.map(cal => cal.calendarId);
      
      calendarResult = await deleteCalendarEvent(eventIds, calendarIds);
      if (calendarResult.success) {
        console.log('✅ Evento eliminado de Google Calendar:', eventIds);
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
      message: 'Reserva eliminada exitosamente' + (calendarResult.success && booking.googleEventIds ? ' y removida del calendario' : '')
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

// POST /api/bookings/send-reminder/:id - Enviar recordatorio por WhatsApp
router.post('/send-reminder/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener la reserva
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
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

    // Verificar si WhatsApp está configurado
    if (!whatsappService.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp no está configurado'
      });
    }

    // Enviar recordatorio
    const whatsappResult = await whatsappService.sendBookingReminder(booking);

    if (whatsappResult.success) {
      res.json({
        success: true,
        message: 'Recordatorio enviado exitosamente',
        data: {
          messageId: whatsappResult.messageId
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: whatsappResult.error
      });
    }
  } catch (error) {
    console.error('Error enviando recordatorio:', error);
    res.status(500).json({
      success: false,
      error: 'Error al enviar el recordatorio'
    });
  }
});

export default router;