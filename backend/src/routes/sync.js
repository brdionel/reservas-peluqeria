import express from 'express';
import { prisma } from '../server.js';
import { verifyBookingsInCalendar, repairMissingCalendarEvents, getCalendarEvents } from '../services/googleCalendar.js';

const router = express.Router();

// GET /api/sync/verify - Verificar que las reservas estén en Google Calendar
router.get('/verify', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren startDate y endDate como query parameters (YYYY-MM-DD)'
      });
    }

    const verificationResult = await verifyBookingsInCalendar(prisma, startDate, endDate);
    
    if (verificationResult.success) {
      res.json({
        success: true,
        data: verificationResult.results,
        message: 'Verificación completada'
      });
    } else {
      res.status(500).json({
        success: false,
        error: verificationResult.error
      });
    }
  } catch (error) {
    console.error('Error en verificación:', error);
    res.status(500).json({
      success: false,
      error: 'Error durante la verificación'
    });
  }
});

// POST /api/sync/repair - Reparar reservas que no están en Google Calendar
router.post('/repair', async (req, res) => {
  try {
    const { startDate, endDate, autoRepair = false } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren startDate y endDate (formato YYYY-MM-DD)'
      });
    }

    // Primero verificar qué reservas faltan
    const verificationResult = await verifyBookingsInCalendar(prisma, startDate, endDate);
    
    if (!verificationResult.success) {
      return res.status(500).json({
        success: false,
        error: verificationResult.error
      });
    }

    const missingBookings = verificationResult.results.details;
    
    if (missingBookings.length === 0) {
      return res.json({
        success: true,
        data: {
          message: 'Todas las reservas están sincronizadas con Google Calendar',
          repaired: 0,
          total: verificationResult.results.totalBookings
        }
      });
    }

    // Si autoRepair está habilitado, reparar automáticamente
    if (autoRepair) {
      const repairResult = await repairMissingCalendarEvents(prisma, missingBookings);
      
      if (repairResult.success) {
        res.json({
          success: true,
          data: {
            ...repairResult.results,
            total: verificationResult.results.totalBookings,
            missing: missingBookings.length
          },
          message: 'Reparación automática completada'
        });
      } else {
        res.status(500).json({
          success: false,
          error: repairResult.error
        });
      }
    } else {
      // Solo devolver la lista de reservas que necesitan reparación
      res.json({
        success: true,
        data: {
          missingBookings,
          total: verificationResult.results.totalBookings,
          missing: missingBookings.length
        },
        message: 'Lista de reservas que necesitan reparación'
      });
    }
  } catch (error) {
    console.error('Error en reparación:', error);
    res.status(500).json({
      success: false,
      error: 'Error durante la reparación'
    });
  }
});

// GET /api/sync/calendar/events - Obtener eventos de Google Calendar
router.get('/calendar/events', async (req, res) => {
  try {
    const { startDate, endDate, onlyRelevant = 'false' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren startDate y endDate como query parameters'
      });
    }

    const eventsResult = await getCalendarEvents(startDate, endDate, onlyRelevant === 'true');
    
    if (eventsResult.success) {
      res.json({
        success: true,
        data: eventsResult.events,
        count: eventsResult.events.length
      });
    } else {
      res.status(500).json({
        success: false,
        error: eventsResult.error
      });
    }
  } catch (error) {
    console.error('Error obteniendo eventos de Google Calendar:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener eventos de Google Calendar'
    });
  }
});

// POST /api/sync/auto-verify - Verificación automática (últimos 30 días + próximos 30 días)
router.post('/auto-verify', async (req, res) => {
  try {
    const today = new Date();
    const startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 días atrás
    const endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 días adelante

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`🔍 Iniciando verificación automática: ${startDateStr} a ${endDateStr}`);

    const verificationResult = await verifyBookingsInCalendar(prisma, startDateStr, endDateStr);
    
    if (verificationResult.success) {
      res.json({
        success: true,
        data: {
          ...verificationResult.results,
          dateRange: {
            startDate: startDateStr,
            endDate: endDateStr
          }
        },
        message: 'Verificación automática completada'
      });
    } else {
      res.status(500).json({
        success: false,
        error: verificationResult.error
      });
    }
  } catch (error) {
    console.error('Error en verificación automática:', error);
    res.status(500).json({
      success: false,
      error: 'Error durante la verificación automática'
    });
  }
});

export default router;
