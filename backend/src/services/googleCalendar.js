import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar autenticación usando variable de entorno o archivo local
let auth;
if (process.env.GOOGLE_CREDENTIALS) {
  // Para producción (deploy)
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
} else {
  // Para desarrollo local
  auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../../credenciales/google-calendar-credentials.json'),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
}

/**
 * Crear un evento en múltiples calendarios de Google Calendar
 * @param {Object} bookingData - Datos de la reserva
 * @param {string} bookingData.clientName - Nombre del cliente
 * @param {string} bookingData.clientPhone - Teléfono del cliente
 * @param {string} bookingData.date - Fecha en formato YYYY-MM-DD
 * @param {string} bookingData.time - Hora en formato HH:MM
 * @param {string} bookingData.service - Servicio (opcional)
 * @param {string} bookingData.notes - Notas adicionales (opcional)
 * @param {Array} bookingData.calendarIds - Array de IDs de calendarios (opcional)
 * @returns {Promise<Object>} - Respuesta de Google Calendar API
 */
export async function createCalendarEvent(bookingData) {
  try {
    const authClient = await auth.getClient();
    const calendar = google.calendar({ version: "v3", auth: authClient });

    // Crear fecha en zona horaria de Argentina
    const argentinaTimeZone = 'America/Argentina/Buenos_Aires';
    
    // Crear la fecha directamente en hora de Argentina (sin conversión UTC)
    // Asumimos que bookingData.time ya está en hora de Argentina
    const startDateTime = new Date(`${bookingData.date}T${bookingData.time}:00-03:00`);
    const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000); // 30 min por defecto

    // Formatear fechas en formato ISO para Google Calendar
    const formatDateTimeForArgentina = (date) => {
      return date.toISOString();
    };

    // Construir descripción con información adicional
    let description = `Teléfono: ${bookingData.clientPhone}`;
    if (bookingData.service) {
      description += `\nServicio: ${bookingData.service}`;
    }
    if (bookingData.notes) {
      description += `\nNotas: ${bookingData.notes}`;
    }

    const evento = {
      summary: `Turno con ${bookingData.clientName}`,
      description: description,
      start: {
        dateTime: formatDateTimeForArgentina(startDateTime),
        timeZone: argentinaTimeZone,
      },
      end: {
        dateTime: formatDateTimeForArgentina(endDateTime),
        timeZone: argentinaTimeZone,
      },
      // Configuraciones adicionales del evento
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // Recordatorio por email 1 día antes
          { method: 'popup', minutes: 30 }, // Recordatorio popup 30 min antes
        ],
      },
    };

    // Obtener calendarios activos desde la base de datos o usar el por defecto
    let calendarIds = [];
    
    if (bookingData.calendarIds && Array.isArray(bookingData.calendarIds)) {
      calendarIds = bookingData.calendarIds;
    } else {
      // Usar calendario por defecto si no se especifican
      const defaultCalendarId = process.env.GOOGLE_CALENDAR_ID || "brunovicente32@gmail.com";
      calendarIds = [defaultCalendarId];
    }

    console.log(`🔄 Creando evento en ${calendarIds.length} calendario(s):`, calendarIds);

    // Crear evento en todos los calendarios especificados
    const results = [];
    const eventIds = [];

    for (const calendarId of calendarIds) {
      try {
        const response = await calendar.events.insert({
          calendarId,
          requestBody: evento,
        });

        results.push({
          calendarId,
          success: true,
          eventId: response.data.id,
          eventUrl: response.data.htmlLink
        });
        
        eventIds.push(response.data.id);
        console.log(`✅ Evento creado en calendario ${calendarId}:`, response.data.id);
      } catch (error) {
        console.error(`❌ Error creando evento en calendario ${calendarId}:`, error.message);
        results.push({
          calendarId,
          success: false,
          error: error.message
        });
      }
    }

    // Verificar si al menos un evento se creó exitosamente
    const successfulEvents = results.filter(r => r.success);
    
    if (successfulEvents.length > 0) {
      return {
        success: true,
        eventIds: eventIds,
        results: results,
        primaryEventId: eventIds[0], // Para compatibilidad con código existente
        primaryEventUrl: successfulEvents[0].eventUrl
      };
    } else {
      return {
        success: false,
        error: 'No se pudo crear el evento en ningún calendario',
        results: results
      };
    }

  } catch (error) {
    console.error('❌ Error al crear evento en Google Calendar:', error);
    return {
      success: false,
      error: error.message,
      details: error.errors || null
    };
  }
}

/**
 * Eliminar un evento de múltiples calendarios de Google Calendar
 * @param {string|Array} eventIds - ID del evento o array de IDs de eventos en Google Calendar
 * @param {Array} calendarIds - Array de IDs de calendarios (opcional)
 * @returns {Promise<Object>} - Resultado de la eliminación
 */
export async function deleteCalendarEvent(eventIds, calendarIds = null) {
  try {
    const authClient = await auth.getClient();
    const calendar = google.calendar({ version: "v3", auth: authClient });

    // Normalizar eventIds a array
    const eventIdArray = Array.isArray(eventIds) ? eventIds : [eventIds];
    
    // Obtener calendarios
    let targetCalendarIds = calendarIds;
    if (!targetCalendarIds || !Array.isArray(targetCalendarIds)) {
      const defaultCalendarId = process.env.GOOGLE_CALENDAR_ID || "brunovicente32@gmail.com";
      targetCalendarIds = [defaultCalendarId];
    }

    console.log(`🔄 Eliminando ${eventIdArray.length} evento(s) de ${targetCalendarIds.length} calendario(s)`);

    const results = [];
    let successCount = 0;

    // Intentar eliminar cada evento de cada calendario
    for (const calendarId of targetCalendarIds) {
      for (const eventId of eventIdArray) {
        try {
          await calendar.events.delete({
            calendarId,
            eventId: eventId,
          });

          results.push({
            calendarId,
            eventId,
            success: true
          });
          successCount++;
          console.log(`✅ Evento ${eventId} eliminado del calendario ${calendarId}`);
        } catch (error) {
          results.push({
            calendarId,
            eventId,
            success: false,
            error: error.message
          });
          console.error(`❌ Error eliminando evento ${eventId} del calendario ${calendarId}:`, error.message);
        }
      }
    }

    return {
      success: successCount > 0,
      successCount,
      totalAttempts: eventIdArray.length * targetCalendarIds.length,
      results
    };

  } catch (error) {
    console.error('❌ Error al eliminar evento de Google Calendar:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Actualizar un evento en múltiples calendarios de Google Calendar
 * @param {string|Array} eventIds - ID del evento o array de IDs de eventos en Google Calendar
 * @param {Object} bookingData - Nuevos datos de la reserva
 * @param {Array} calendarIds - Array de IDs de calendarios (opcional)
 * @returns {Promise<Object>} - Resultado de la actualización
 */
export async function updateCalendarEvent(eventIds, bookingData, calendarIds = null) {
  try {
    const authClient = await auth.getClient();
    const calendar = google.calendar({ version: "v3", auth: authClient });

    // Crear fecha en zona horaria de Argentina
    const argentinaTimeZone = 'America/Argentina/Buenos_Aires';
    
    // Crear la fecha directamente en hora de Argentina (sin conversión UTC)
    // Asumimos que bookingData.time ya está en hora de Argentina
    const startDateTime = new Date(`${bookingData.date}T${bookingData.time}:00-03:00`);
    const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000);

    // Formatear fechas en formato ISO para Google Calendar
    const formatDateTimeForArgentina = (date) => {
      return date.toISOString();
    };

    let description = `Teléfono: ${bookingData.clientPhone}`;
    if (bookingData.service) {
      description += `\nServicio: ${bookingData.service}`;
    }
    if (bookingData.notes) {
      description += `\nNotas: ${bookingData.notes}`;
    }

    const evento = {
      summary: `Turno con ${bookingData.clientName}`,
      description: description,
      start: {
        dateTime: formatDateTimeForArgentina(startDateTime),
        timeZone: argentinaTimeZone,
      },
      end: {
        dateTime: formatDateTimeForArgentina(endDateTime),
        timeZone: argentinaTimeZone,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    // Normalizar eventIds a array
    const eventIdArray = Array.isArray(eventIds) ? eventIds : [eventIds];
    
    // Obtener calendarios
    let targetCalendarIds = calendarIds;
    if (!targetCalendarIds || !Array.isArray(targetCalendarIds)) {
      const defaultCalendarId = process.env.GOOGLE_CALENDAR_ID || "brunovicente32@gmail.com";
      targetCalendarIds = [defaultCalendarId];
    }

    console.log(`🔄 Actualizando ${eventIdArray.length} evento(s) en ${targetCalendarIds.length} calendario(s)`);

    const results = [];
    const updatedEventIds = [];
    let successCount = 0;

    // Actualizar cada evento en cada calendario
    for (const calendarId of targetCalendarIds) {
      for (const eventId of eventIdArray) {
        try {
          const response = await calendar.events.update({
            calendarId,
            eventId: eventId,
            requestBody: evento,
          });

          results.push({
            calendarId,
            eventId,
            success: true,
            newEventId: response.data.id,
            eventUrl: response.data.htmlLink
          });
          
          updatedEventIds.push(response.data.id);
          successCount++;
          console.log(`✅ Evento ${eventId} actualizado en calendario ${calendarId}`);
        } catch (error) {
          results.push({
            calendarId,
            eventId,
            success: false,
            error: error.message
          });
          console.error(`❌ Error actualizando evento ${eventId} en calendario ${calendarId}:`, error.message);
        }
      }
    }

    // Verificar si al menos un evento se actualizó exitosamente
    if (successCount > 0) {
      return {
        success: true,
        eventIds: updatedEventIds,
        results: results,
        primaryEventId: updatedEventIds[0], // Para compatibilidad con código existente
        primaryEventUrl: results.find(r => r.success)?.eventUrl
      };
    } else {
      return {
        success: false,
        error: 'No se pudo actualizar el evento en ningún calendario',
        results: results
      };
    }

  } catch (error) {
    console.error('❌ Error al actualizar evento en Google Calendar:', error);
    return {
      success: false,
      error: error.message,
      details: error.errors || null
    };
  }
}

/**
 * Obtener todos los eventos de Google Calendar para un rango de fechas
 * @param {string} startDate - Fecha de inicio (YYYY-MM-DD)
 * @param {string} endDate - Fecha de fin (YYYY-MM-DD)
 * @param {boolean} onlyRelevant - Si es true, solo devuelve eventos de turnos
 * @returns {Promise<Object>} - Lista de eventos
 */
export async function getCalendarEvents(startDate, endDate, onlyRelevant = false) {
  try {
    const authClient = await auth.getClient();
    const calendar = google.calendar({ version: "v3", auth: authClient });

    const calendarId = process.env.GOOGLE_CALENDAR_ID || "brunovicente32@gmail.com";

    const response = await calendar.events.list({
      calendarId,
      timeMin: new Date(startDate + 'T00:00:00').toISOString(),
      timeMax: new Date(endDate + 'T23:59:59').toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    let events = response.data.items || [];
    
    // Filtrar solo eventos relevantes si se solicita
    if (onlyRelevant) {
      events = events.filter(event => 
        event.summary && event.summary.startsWith('Turno con ')
      );
      console.log(`🎯 Filtrados ${events.length} eventos de turnos de ${response.data.items?.length || 0} eventos totales`);
    }

    return {
      success: true,
      events: events
    };

  } catch (error) {
    console.error('❌ Error al obtener eventos de Google Calendar:', error);
    return {
      success: false,
      error: error.message,
      events: []
    };
  }
}

/**
 * Verificar que las reservas de la base de datos estén en Google Calendar
 * @param {Object} prisma - Instancia de Prisma
 * @param {string} startDate - Fecha de inicio (YYYY-MM-DD)
 * @param {string} endDate - Fecha de fin (YYYY-MM-DD)
 * @returns {Promise<Object>} - Resultado de la verificación
 */
export async function verifyBookingsInCalendar(prisma, startDate, endDate) {
  try {
    console.log('🔍 Verificando que las reservas estén en Google Calendar...');
    
    // Obtener eventos de Google Calendar
    const calendarResult = await getCalendarEvents(startDate, endDate);
    if (!calendarResult.success) {
      return { success: false, error: calendarResult.error };
    }

    const calendarEvents = calendarResult.events;
    console.log(`📅 Encontrados ${calendarEvents.length} eventos en Google Calendar`);

    // Filtrar solo eventos de turnos (que empiecen con "Turno con ")
    const relevantEvents = calendarEvents.filter(event => 
      event.summary && event.summary.startsWith('Turno con ')
    );
    console.log(`🎯 Encontrados ${relevantEvents.length} eventos de turnos relevantes`);

    // Obtener reservas de la base de datos
    const dbBookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        },
        status: 'CONFIRMED' // Solo reservas confirmadas
      },
      include: {
        client: true
      }
    });

    console.log(`🗄️ Encontradas ${dbBookings.length} reservas confirmadas en la base de datos`);

    const verificationResults = {
      totalBookings: dbBookings.length,
      inCalendar: 0,
      missingInCalendar: 0,
      missingEventIds: 0,
      details: []
    };

    // Verificar cada reserva
    for (const booking of dbBookings) {
      if (booking.googleEventId) {
        // Buscar el evento en Google Calendar por ID (solo en eventos relevantes)
        const hasCalendarEvent = relevantEvents.some(event => 
          event.id === booking.googleEventId
        );

        if (hasCalendarEvent) {
          verificationResults.inCalendar++;
        } else {
          verificationResults.missingInCalendar++;
          verificationResults.details.push({
            type: 'missing_in_calendar',
            bookingId: booking.id,
            clientName: booking.client.name,
            clientPhone: booking.client.phone,
            date: booking.date,
            time: booking.time,
            service: booking.service,
            notes: booking.notes,
            googleEventId: booking.googleEventId,
            action: 'recreate_event'
          });
          console.log(`⚠️ Reserva sin evento en Google Calendar: ${booking.client.name} - ${booking.date} ${booking.time}`);
        }
      } else {
        verificationResults.missingEventIds++;
        verificationResults.details.push({
          type: 'missing_event_id',
          bookingId: booking.id,
          clientName: booking.client.name,
          clientPhone: booking.client.phone,
          date: booking.date,
          time: booking.time,
          service: booking.service,
          notes: booking.notes,
          action: 'create_event'
        });
        console.log(`⚠️ Reserva sin ID de evento: ${booking.client.name} - ${booking.date} ${booking.time}`);
      }
    }

    // Detectar eventos de turnos en Google Calendar que no están en la base de datos
    const calendarEventIds = relevantEvents.map(event => event.id);
    const dbEventIds = dbBookings
      .filter(booking => booking.googleEventId)
      .map(booking => booking.googleEventId);

    const orphanedEvents = relevantEvents.filter(event => 
      !dbEventIds.includes(event.id)
    );

    if (orphanedEvents.length > 0) {
      console.log(`⚠️ Encontrados ${orphanedEvents.length} eventos de turnos en Google Calendar sin correspondencia en la base de datos:`);
      orphanedEvents.forEach(event => {
        console.log(`   - ${event.summary} (${event.start.dateTime})`);
      });
      
      verificationResults.orphanedEvents = orphanedEvents.length;
      verificationResults.orphanedDetails = orphanedEvents.map(event => ({
        type: 'orphaned_in_calendar',
        eventId: event.id,
        eventSummary: event.summary,
        eventStart: event.start.dateTime,
        action: 'review_manually'
      }));
    }

    console.log('✅ Verificación completada:', verificationResults);
    return {
      success: true,
      results: verificationResults
    };

  } catch (error) {
    console.error('❌ Error en verificación:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Reparar reservas que no están en Google Calendar
 * @param {Object} prisma - Instancia de Prisma
 * @param {Array} missingBookings - Lista de reservas que faltan en Google Calendar
 * @returns {Promise<Object>} - Resultado de la reparación
 */
export async function repairMissingCalendarEvents(prisma, missingBookings) {
  try {
    console.log('🔧 Reparando eventos faltantes en Google Calendar...');
    
    const repairResults = {
      created: 0,
      failed: 0,
      errors: []
    };

    for (const booking of missingBookings) {
      try {
        // Determinar el nombre y teléfono del cliente
        // Manejar tanto la estructura de verifyBookingsInCalendar como la estructura original de la BD
        const clientName = booking.clientName || (booking.client && booking.client.name);
        const clientPhone = booking.clientPhone || (booking.client && booking.client.phone) || '';
        
        if (!clientName) {
          throw new Error('No se pudo obtener el nombre del cliente');
        }
        
        // Crear evento en Google Calendar
        const calendarResult = await createCalendarEvent({
          clientName: clientName,
          clientPhone: clientPhone,
          date: booking.date,
          time: booking.time,
          service: booking.service || '',
          notes: booking.notes || ''
        });

        if (calendarResult.success) {
          // Actualizar la reserva con el nuevo ID del evento
          await prisma.booking.update({
            where: { id: booking.bookingId },
            data: { googleEventId: calendarResult.eventId }
          });
          
          repairResults.created++;
          console.log(`✅ Reparado: ${clientName} - ${booking.date} ${booking.time}`);
        } else {
          repairResults.failed++;
          repairResults.errors.push(`Error creando evento para ${clientName}: ${calendarResult.error}`);
        }
      } catch (error) {
        repairResults.failed++;
        const errorClientName = booking.clientName || (booking.client && booking.client.name) || 'Cliente desconocido';
        repairResults.errors.push(`Error procesando ${errorClientName}: ${error.message}`);
      }
    }

    console.log('✅ Reparación completada:', repairResults);
    return {
      success: true,
      results: repairResults
    };

  } catch (error) {
    console.error('❌ Error en reparación:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
