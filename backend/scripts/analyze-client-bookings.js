import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script para analizar las reservas de un cliente específico
 */
async function analyzeClientBookings() {
  try {
    console.log('🔍 Analizando reservas del cliente "Opa"...');
    
    // Buscar el cliente "Opa"
    const client = await prisma.client.findFirst({
      where: {
        name: 'Opa'
      },
      include: {
        bookings: {
          orderBy: [
            { date: 'asc' },
            { time: 'asc' }
          ]
        }
      }
    });

    if (!client) {
      console.log('❌ Cliente "Opa" no encontrado');
      return;
    }

    console.log(`\n📋 Cliente: ${client.name} (ID: ${client.id})`);
    console.log(`📞 Teléfono: ${client.phone}`);
    console.log(`📅 Total de reservas: ${client.bookings.length}`);

    if (client.bookings.length === 0) {
      console.log('✅ No tiene reservas');
      return;
    }

    console.log('\n📅 Reservas del cliente:');
    client.bookings.forEach((booking, index) => {
      console.log(`   ${index + 1}. ${booking.date} ${booking.time} - Estado: ${booking.status}`);
      console.log(`      ID: ${booking.id}, Creado: ${booking.createdAt}`);
      if (booking.googleEventId) {
        console.log(`      Google Calendar ID: ${booking.googleEventId}`);
      }
      console.log('');
    });

    // Verificar si hay reservas en el mismo slot
    const slots = {};
    client.bookings.forEach(booking => {
      const key = `${booking.date}_${booking.time}`;
      if (!slots[key]) {
        slots[key] = [];
      }
      slots[key].push(booking);
    });

    const duplicateSlots = Object.entries(slots).filter(([key, bookings]) => bookings.length > 1);
    
    if (duplicateSlots.length > 0) {
      console.log('⚠️ Slots con múltiples reservas:');
      duplicateSlots.forEach(([slot, bookings]) => {
        console.log(`   ${slot}: ${bookings.length} reservas`);
        bookings.forEach(booking => {
          console.log(`     - ID: ${booking.id}, Creado: ${booking.createdAt}`);
        });
      });
    } else {
      console.log('✅ No hay slots duplicados');
    }

  } catch (error) {
    console.error('💥 Error durante el análisis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el análisis
analyzeClientBookings();
