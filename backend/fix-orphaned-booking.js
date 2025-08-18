import { PrismaClient } from '@prisma/client';
import { createCalendarEvent } from './src/services/googleCalendar.js';

const prisma = new PrismaClient();

async function fixOrphanedBooking() {
  try {
    console.log('🔧 Reparando reserva huérfana...');
    
    // Buscar la reserva de Boa que perdió su evento
    const orphanedBooking = await prisma.booking.findFirst({
      where: {
        client: {
          name: 'Boa'
        },
        date: '2025-08-21',
        time: '19:30'
      },
      include: {
        client: true
      }
    });
    
    if (!orphanedBooking) {
      console.log('❌ No se encontró la reserva de Boa');
      return;
    }
    
    console.log(`📋 Encontrada reserva: ${orphanedBooking.client.name} | ${orphanedBooking.date} ${orphanedBooking.time}`);
    console.log(`🔍 Google Event ID actual: ${orphanedBooking.googleEventId}`);
    
    // Crear nuevo evento en Google Calendar
    console.log('🔄 Creando nuevo evento en Google Calendar...');
    
    const calendarResult = await createCalendarEvent({
      clientName: orphanedBooking.client.name,
      clientPhone: orphanedBooking.client.phone,
      date: orphanedBooking.date,
      time: orphanedBooking.time,
      service: orphanedBooking.service,
      notes: orphanedBooking.notes
    });
    
    if (calendarResult.success) {
      // Actualizar la reserva con el nuevo ID del evento
      await prisma.booking.update({
        where: { id: orphanedBooking.id },
        data: { googleEventId: calendarResult.eventId }
      });
      
      console.log('✅ Reparación completada:');
      console.log(`   - Nuevo Google Event ID: ${calendarResult.eventId}`);
      console.log(`   - Evento URL: ${calendarResult.eventUrl}`);
    } else {
      console.error('❌ Error creando evento:', calendarResult.error);
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOrphanedBooking();
