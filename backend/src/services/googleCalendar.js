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
    keyFile: path.join(__dirname, '../../credenciales/appturnos-service-account.json'),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
}

/**
 * Crear un evento en Google Calendar
 * @param {Object} bookingData - Datos de la reserva
 * @param {string} bookingData.clientName - Nombre del cliente
 * @param {string} bookingData.clientPhone - Teléfono del cliente
 * @param {string} bookingData.date - Fecha en formato YYYY-MM-DD
 * @param {string} bookingData.time - Hora en formato HH:MM
 * @param {string} bookingData.service - Servicio (opcional)
 * @param {string} bookingData.notes - Notas adicionales (opcional)
 * @returns {Promise<Object>} - Respuesta de Google Calendar API
 */
export async function createCalendarEvent(bookingData) {
  try {
    const authClient = await auth.getClient();
    const calendar = google.calendar({ version: "v3", auth: authClient });

    const startDateTime = new Date(`${bookingData.date}T${bookingData.time}`);
    const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000); // 30 min por defecto

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
        dateTime: startDateTime.toISOString(),
        timeZone: "America/Argentina/Buenos_Aires",
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: "America/Argentina/Buenos_Aires",
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

    const calendarId = process.env.GOOGLE_CALENDAR_ID || "brunovicente32@gmail.com";

    const response = await calendar.events.insert({
      calendarId,
      requestBody: evento,
    });

    console.log('✅ Evento creado en Google Calendar:', response.data.id);
    return {
      success: true,
      eventId: response.data.id,
      eventUrl: response.data.htmlLink,
      data: response.data
    };

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
 * Eliminar un evento de Google Calendar
 * @param {string} eventId - ID del evento en Google Calendar
 * @returns {Promise<Object>} - Resultado de la eliminación
 */
export async function deleteCalendarEvent(eventId) {
  try {
    const authClient = await auth.getClient();
    const calendar = google.calendar({ version: "v3", auth: authClient });

    const calendarId = process.env.GOOGLE_CALENDAR_ID || "brunovicente32@gmail.com";

    await calendar.events.delete({
      calendarId,
      eventId: eventId,
    });

    console.log('✅ Evento eliminado de Google Calendar:', eventId);
    return { success: true };

  } catch (error) {
    console.error('❌ Error al eliminar evento de Google Calendar:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Actualizar un evento en Google Calendar
 * @param {string} eventId - ID del evento en Google Calendar
 * @param {Object} bookingData - Nuevos datos de la reserva
 * @returns {Promise<Object>} - Resultado de la actualización
 */
export async function updateCalendarEvent(eventId, bookingData) {
  try {
    const authClient = await auth.getClient();
    const calendar = google.calendar({ version: "v3", auth: authClient });

    const startDateTime = new Date(`${bookingData.date}T${bookingData.time}`);
    const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000);

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
        dateTime: startDateTime.toISOString(),
        timeZone: "America/Argentina/Buenos_Aires",
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: "America/Argentina/Buenos_Aires",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    const calendarId = process.env.GOOGLE_CALENDAR_ID || "brunovicente32@gmail.com";

    const response = await calendar.events.update({
      calendarId,
      eventId: eventId,
      requestBody: evento,
    });

    console.log('✅ Evento actualizado en Google Calendar:', eventId);
    return {
      success: true,
      eventId: response.data.id,
      eventUrl: response.data.htmlLink,
      data: response.data
    };

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
            date: booking.date,
            time: booking.time,
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
          date: booking.date,
          time: booking.time,
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
        // Crear evento en Google Calendar
        const calendarResult = await createCalendarEvent({
          clientName: booking.client.name,
          clientPhone: booking.client.phone,
          date: booking.date,
          time: booking.time,
          service: booking.service,
          notes: booking.notes
        });

        if (calendarResult.success) {
          // Actualizar la reserva con el nuevo ID del evento
          await prisma.booking.update({
            where: { id: booking.bookingId },
            data: { googleEventId: calendarResult.eventId }
          });
          
          repairResults.created++;
          console.log(`✅ Reparado: ${booking.clientName} - ${booking.date} ${booking.time}`);
        } else {
          repairResults.failed++;
          repairResults.errors.push(`Error creando evento para ${booking.clientName}: ${calendarResult.error}`);
        }
      } catch (error) {
        repairResults.failed++;
        repairResults.errors.push(`Error procesando ${booking.clientName}: ${error.message}`);
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
