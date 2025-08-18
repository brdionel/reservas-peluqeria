import express from 'express';
import { prisma } from '../server.js';

const router = express.Router();

// Horarios disponibles (24 horas)
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

// GET /api/slots/:date - Obtener slots disponibles para una fecha
router.get('/:date', async (req, res) => {
  try {
    const { date } = req.params;

    // Validar formato de fecha
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de fecha inválido (debe ser YYYY-MM-DD)'
      });
    }

    // Verificar que la fecha no sea pasada
    const requestedDate = new Date(date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isPastDate = requestedDate < today;

    // Obtener reservas existentes para esa fecha
    const existingBookings = await prisma.booking.findMany({
      where: {
        date,
        status: {
          in: ['CONFIRMED', 'COMPLETED']
        }
      },
      include: {
        client: {
          select: {
            name: true,
            phone: true
          }
        }
      }
    });

    // Obtener slots bloqueados para esa fecha
    const blockedSlots = await prisma.blockedSlot.findMany({
      where: { date }
    });

    // Generar información de slots
    const slots = TIME_SLOTS.map(time => {
      const booking = existingBookings.find(b => b.time === time);
      const isBlocked = blockedSlots.some(blocked => {
        if (!blocked.startTime && !blocked.endTime) {
          return true; // Todo el día bloqueado
        }
        if (blocked.startTime && blocked.endTime) {
          return time >= blocked.startTime && time <= blocked.endTime;
        }
        return false;
      });

      // Si es fecha pasada, marcar como no disponible pero mostrar información
      const available = !booking && !isBlocked && !isPastDate;

      return {
        time,
        available,
        clientName: booking?.client?.name,
        clientPhone: booking?.client?.phone,
        bookingId: booking?.id,
        status: booking?.status,
        blocked: isBlocked,
        reason: isBlocked ? blockedSlots.find(b => 
          (!b.startTime && !b.endTime) || 
          (b.startTime && b.endTime && time >= b.startTime && time <= b.endTime)
        )?.reason : null
      };
    });

    // Filtrar solo horarios con alguna actividad para fechas pasadas
    const filteredSlots = isPastDate 
      ? slots.filter(slot => !slot.available || slot.clientName)
      : slots;

    res.json({
      success: true,
      data: {
        date,
        isPastDate,
        slots: filteredSlots,
        summary: {
          total: filteredSlots.length,
          available: filteredSlots.filter(s => s.available).length,
          booked: filteredSlots.filter(s => s.clientName).length,
          blocked: filteredSlots.filter(s => s.blocked).length
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo slots:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los horarios disponibles'
    });
  }
});

// GET /api/slots - Obtener slots para múltiples fechas
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, limit = 7 } = req.query;

    if (!startDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate es requerido'
      });
    }

    // Generar fechas
    const dates = [];
    const start = new Date(startDate + 'T00:00:00');
    const end = endDate ? new Date(endDate + 'T00:00:00') : new Date(start);
    
    if (!endDate) {
      // Si no hay endDate, generar las próximas 'limit' fechas
      for (let i = 0; i < parseInt(limit); i++) {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }
    } else {
      // Generar fechas entre startDate y endDate
      const currentDate = new Date(start);
      while (currentDate <= end) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Obtener datos para todas las fechas
    const results = {};
    
    for (const date of dates) {
      const bookings = await prisma.booking.findMany({
        where: {
          date,
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        }
      });

      const blockedSlots = await prisma.blockedSlot.findMany({
        where: { date }
      });

      const availableCount = TIME_SLOTS.filter(time => {
        const hasBooking = bookings.some(b => b.time === time);
        const isBlocked = blockedSlots.some(blocked => {
          if (!blocked.startTime && !blocked.endTime) return true;
          if (blocked.startTime && blocked.endTime) {
            return time >= blocked.startTime && time <= blocked.endTime;
          }
          return false;
        });
        return !hasBooking && !isBlocked;
      }).length;

      results[date] = {
        total: TIME_SLOTS.length,
        available: availableCount,
        booked: bookings.length,
        blocked: TIME_SLOTS.length - availableCount - bookings.length,
        hasAvailability: availableCount > 0
      };
    }

    res.json({
      success: true,
      data: results,
      dateRange: {
        start: dates[0],
        end: dates[dates.length - 1],
        count: dates.length
      }
    });
  } catch (error) {
    console.error('Error obteniendo slots múltiples:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los horarios'
    });
  }
});

export default router;