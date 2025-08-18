import { PrismaClient } from '@prisma/client';
import { getCalendarEvents } from './src/services/googleCalendar.js';

const prisma = new PrismaClient();

async function debugSync() {
  try {
    console.log('🔍 Debug de sincronización...');
    
    // 1. Verificar reservas en DB
    const dbBookings = await prisma.booking.findMany({
      include: { client: true }
    });
    
    console.log(`📊 Total de reservas en DB: ${dbBookings.length}`);
    
    if (dbBookings.length > 0) {
      console.log('📋 Reservas en DB:');
      dbBookings.forEach(booking => {
        console.log(`   - ${booking.client?.name || 'Sin cliente'} | ${booking.date} ${booking.time} | Google ID: ${booking.googleEventId || 'Sin ID'}`);
      });
    }
    
    // 2. Verificar eventos en Google Calendar
    const today = new Date();
    const startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    console.log(`📅 Buscando eventos del ${startDateStr} al ${endDateStr}`);
    
    const calendarResult = await getCalendarEvents(startDateStr, endDateStr, true);
    
    if (calendarResult.success) {
      console.log(`📅 Eventos en Google Calendar: ${calendarResult.events.length}`);
      
      if (calendarResult.events.length > 0) {
        console.log('📋 Eventos en Google Calendar:');
        calendarResult.events.forEach(event => {
          console.log(`   - ${event.summary} | ${event.start.dateTime} | ID: ${event.id}`);
        });
      }
    } else {
      console.error('❌ Error obteniendo eventos de Google Calendar:', calendarResult.error);
    }
    
    // 3. Comparar
    if (dbBookings.length > 0 && calendarResult.success) {
      console.log('\n🔍 Comparando...');
      
      const dbEventIds = dbBookings
        .filter(booking => booking.googleEventId)
        .map(booking => booking.googleEventId);
      
      const calendarEventIds = calendarResult.events.map(event => event.id);
      
      console.log(`📊 IDs en DB: ${dbEventIds.length}`);
      console.log(`📊 IDs en Calendar: ${calendarEventIds.length}`);
      
      // Encontrar eventos huérfanos (en Calendar pero no en DB)
      const orphanedEvents = calendarResult.events.filter(event => 
        !dbEventIds.includes(event.id)
      );
      
      if (orphanedEvents.length > 0) {
        console.log(`⚠️ Eventos huérfanos (en Calendar pero no en DB): ${orphanedEvents.length}`);
        orphanedEvents.forEach(event => {
          console.log(`   - ${event.summary} | ${event.start.dateTime} | ID: ${event.id}`);
        });
      } else {
        console.log('✅ No hay eventos huérfanos');
      }
      
      // Encontrar reservas sin evento en Calendar
      const missingEvents = dbBookings.filter(booking => 
        booking.googleEventId && !calendarEventIds.includes(booking.googleEventId)
      );
      
      if (missingEvents.length > 0) {
        console.log(`⚠️ Reservas sin evento en Calendar: ${missingEvents.length}`);
        missingEvents.forEach(booking => {
          console.log(`   - ${booking.client?.name} | ${booking.date} ${booking.time} | Google ID: ${booking.googleEventId}`);
        });
      } else {
        console.log('✅ Todas las reservas tienen su evento en Calendar');
      }
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSync();
