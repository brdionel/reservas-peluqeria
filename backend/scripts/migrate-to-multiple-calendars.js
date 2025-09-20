import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateToMultipleCalendars() {
  try {
    console.log('🔄 Iniciando migración a múltiples calendarios...');

    // 1. Obtener todas las reservas con google_event_id
    const bookingsWithEvents = await prisma.booking.findMany({
      where: {
        googleEventId: {
          not: null
        }
      },
      select: {
        id: true,
        googleEventId: true
      }
    });

    console.log(`📊 Encontradas ${bookingsWithEvents.length} reservas con eventos de Google Calendar`);

    // 2. Migrar los datos existentes
    for (const booking of bookingsWithEvents) {
      // Convertir google_event_id a google_event_ids (array JSON)
      const eventIdsArray = [booking.googleEventId];
      const eventIdsJson = JSON.stringify(eventIdsArray);

      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          googleEventIds: eventIdsJson
        }
      });

      console.log(`✅ Migrado booking ${booking.id}: ${booking.googleEventId} -> ${eventIdsJson}`);
    }

    // 3. Crear un calendario por defecto si no existe
    const defaultCalendar = await prisma.googleCalendar.findFirst({
      where: { isPrimary: true }
    });

    if (!defaultCalendar) {
      const newDefaultCalendar = await prisma.googleCalendar.create({
        data: {
          name: 'Calendario Principal',
          calendarId: process.env.GOOGLE_CALENDAR_ID || 'brunovicente32@gmail.com',
          email: process.env.GOOGLE_CALENDAR_ID || 'brunovicente32@gmail.com',
          isActive: true,
          isPrimary: true,
          description: 'Calendario principal del salón'
        }
      });
      console.log(`✅ Creado calendario por defecto: ${newDefaultCalendar.name}`);
    }

    console.log('🎉 Migración completada exitosamente');
    console.log('\n📋 Próximos pasos:');
    console.log('1. Ejecutar la migración de Prisma: npx prisma migrate dev --name add_multiple_calendars_support');
    console.log('2. Regenerar el cliente de Prisma: npx prisma generate');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateToMultipleCalendars();
