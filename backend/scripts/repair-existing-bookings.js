import { PrismaClient } from '@prisma/client';
import { createCalendarEvent } from '../src/services/googleCalendar.js';

const prisma = new PrismaClient();

/**
 * Script para reparar reservas existentes agregándolas a Google Calendar
 */
async function repairExistingBookings() {
  try {
    console.log('🔧 Reparando reservas existentes...');
    
    // Obtener todas las reservas que no tienen googleEventId
    const bookings = await prisma.booking.findMany({
      where: {
        googleEventId: null,
        status: 'CONFIRMED' // Solo reservas confirmadas
      },
      include: {
        client: true
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    });

    console.log(`📋 Encontradas ${bookings.length} reservas sin Google Event ID`);

    if (bookings.length === 0) {
      console.log('✅ Todas las reservas ya están sincronizadas');
      return;
    }

    const results = {
      total: bookings.length,
      created: 0,
      failed: 0,
      errors: []
    };

    // Procesar cada reserva
    for (const booking of bookings) {
      try {
        console.log(`\n🔄 Procesando: ${booking.client.name} - ${booking.date} ${booking.time}`);

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
          // Actualizar la reserva con el ID del evento
          await prisma.booking.update({
            where: { id: booking.id },
            data: { googleEventId: calendarResult.eventId }
          });

          results.created++;
          console.log(`✅ Creado evento en Google Calendar: ${calendarResult.eventId}`);
        } else {
          results.failed++;
          results.errors.push(`Error para ${booking.client.name}: ${calendarResult.error}`);
          console.log(`❌ Error creando evento: ${calendarResult.error}`);
        }

        // Pequeña pausa para no sobrecargar la API
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        results.failed++;
        results.errors.push(`Error procesando ${booking.client.name}: ${error.message}`);
        console.log(`💥 Error procesando ${booking.client.name}:`, error.message);
      }
    }

    // Mostrar resultados finales
    console.log('\n📊 Resultados de la reparación:');
    console.log(`   - Total procesadas: ${results.total}`);
    console.log(`   - Eventos creados: ${results.created}`);
    console.log(`   - Errores: ${results.failed}`);

    if (results.errors.length > 0) {
      console.log('\n⚠️ Errores encontrados:');
      results.errors.forEach(error => console.log(`   - ${error}`));
    }

    if (results.created > 0) {
      console.log(`\n✅ Reparación completada: ${results.created} reservas sincronizadas con Google Calendar`);
    }

  } catch (error) {
    console.error('💥 Error durante la reparación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la reparación
repairExistingBookings();
