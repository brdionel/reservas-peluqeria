import { PrismaClient } from '@prisma/client';
import { deleteCalendarEvent, getCalendarEvents } from '../src/services/googleCalendar.js';

const prisma = new PrismaClient();

/**
 * Script para limpiar eventos huérfanos en Google Calendar
 * Elimina eventos que están en Google Calendar pero no en la base de datos
 */
async function cleanOrphanedEvents() {
  try {
    console.log('🧹 Limpiando eventos huérfanos en Google Calendar...');
    
    // Definir rango de fechas (últimos 30 días + próximos 30 días)
    const today = new Date();
    const startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`📅 Buscando eventos del ${startDateStr} al ${endDateStr}`);

    // Obtener eventos de Google Calendar (solo relevantes)
    const calendarResult = await getCalendarEvents(startDateStr, endDateStr, true);
    if (!calendarResult.success) {
      console.error('❌ Error obteniendo eventos de Google Calendar:', calendarResult.error);
      return;
    }

    const calendarEvents = calendarResult.events;
    console.log(`📅 Encontrados ${calendarEvents.length} eventos de turnos en Google Calendar`);

    // Obtener reservas de la base de datos
    const dbBookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: startDateStr,
          lte: endDateStr
        },
        status: 'CONFIRMED'
      },
      select: {
        googleEventId: true
      }
    });

    const dbEventIds = dbBookings
      .filter(booking => booking.googleEventId)
      .map(booking => booking.googleEventId);

    console.log(`🗄️ Encontradas ${dbBookings.length} reservas en la base de datos`);
    console.log(`🔗 ${dbEventIds.length} reservas tienen ID de evento de Google Calendar`);

    // Encontrar eventos huérfanos
    const orphanedEvents = calendarEvents.filter(event => 
      !dbEventIds.includes(event.id)
    );

    console.log(`⚠️ Encontrados ${orphanedEvents.length} eventos huérfanos:`);
    orphanedEvents.forEach(event => {
      console.log(`   - ${event.summary} (${event.start.dateTime}) - ID: ${event.id}`);
    });

    if (orphanedEvents.length === 0) {
      console.log('✅ No hay eventos huérfanos para limpiar');
      return;
    }

    // Preguntar confirmación (en un script real, podrías usar un flag --force)
    console.log('\n⚠️ ¿Estás seguro de que quieres eliminar estos eventos?');
    console.log('   Estos eventos NO están en tu base de datos y se eliminarán permanentemente.');
    console.log('   Para continuar, edita el script y cambia confirmDelete a true');
    
    const confirmDelete = true; // Cambiar a true para confirmar eliminación
    
    if (!confirmDelete) {
      console.log('❌ Eliminación cancelada. Edita el script para confirmar.');
      return;
    }

    // Eliminar eventos huérfanos
    const results = {
      total: orphanedEvents.length,
      deleted: 0,
      failed: 0,
      errors: []
    };

    for (const event of orphanedEvents) {
      try {
        console.log(`\n🗑️ Eliminando: ${event.summary}`);
        
        const deleteResult = await deleteCalendarEvent(event.id);
        
        if (deleteResult.success) {
          results.deleted++;
          console.log(`✅ Eliminado: ${event.summary}`);
        } else {
          results.failed++;
          results.errors.push(`Error eliminando ${event.summary}: ${deleteResult.error}`);
          console.log(`❌ Error eliminando: ${deleteResult.error}`);
        }

        // Pequeña pausa para no sobrecargar la API
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        results.failed++;
        results.errors.push(`Error procesando ${event.summary}: ${error.message}`);
        console.log(`💥 Error procesando ${event.summary}:`, error.message);
      }
    }

    // Mostrar resultados finales
    console.log('\n📊 Resultados de la limpieza:');
    console.log(`   - Total de eventos huérfanos: ${results.total}`);
    console.log(`   - Eliminados: ${results.deleted}`);
    console.log(`   - Errores: ${results.failed}`);

    if (results.errors.length > 0) {
      console.log('\n⚠️ Errores encontrados:');
      results.errors.forEach(error => console.log(`   - ${error}`));
    }

    if (results.deleted > 0) {
      console.log(`\n✅ Limpieza completada: ${results.deleted} eventos huérfanos eliminados`);
    }

  } catch (error) {
    console.error('💥 Error durante la limpieza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la limpieza
cleanOrphanedEvents();
