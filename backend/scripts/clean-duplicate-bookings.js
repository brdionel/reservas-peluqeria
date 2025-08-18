import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script para limpiar reservas duplicadas
 * Elimina reservas que tienen la misma fecha y hora
 */
async function cleanDuplicateBookings() {
  try {
    console.log('🧹 Limpiando reservas duplicadas...');
    
    // Obtener todas las reservas ordenadas por fecha y hora
    const allBookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED'
      },
      include: {
        client: true
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    console.log(`📋 Encontradas ${allBookings.length} reservas confirmadas`);

    // Agrupar por fecha y hora
    const groupedBookings = {};
    allBookings.forEach(booking => {
      const key = `${booking.date}_${booking.time}`;
      if (!groupedBookings[key]) {
        groupedBookings[key] = [];
      }
      groupedBookings[key].push(booking);
    });

    // Encontrar duplicados
    const duplicates = [];
    Object.entries(groupedBookings).forEach(([key, bookings]) => {
      if (bookings.length > 1) {
        console.log(`⚠️ Encontrados ${bookings.length} turnos duplicados para ${key}:`);
        bookings.forEach(booking => {
          console.log(`   - ID: ${booking.id}, Cliente: ${booking.client.name}, Creado: ${booking.createdAt}`);
        });
        duplicates.push({
          slot: key,
          bookings: bookings
        });
      }
    });

    if (duplicates.length === 0) {
      console.log('✅ No hay reservas duplicadas');
      return;
    }

    console.log(`\n📊 Total de slots con duplicados: ${duplicates.length}`);

    // Preguntar confirmación
    console.log('\n⚠️ ¿Estás seguro de que quieres eliminar las reservas duplicadas?');
    console.log('   Se mantendrá la primera reserva de cada slot y se eliminarán las demás.');
    console.log('   Para continuar, edita el script y cambia confirmDelete a true');
    
    const confirmDelete = false; // Cambiar a true para confirmar eliminación
    
    if (!confirmDelete) {
      console.log('❌ Eliminación cancelada. Edita el script para confirmar.');
      return;
    }

    // Eliminar duplicados (mantener la primera de cada grupo)
    const results = {
      totalDuplicates: 0,
      deleted: 0,
      failed: 0,
      errors: []
    };

    for (const duplicate of duplicates) {
      const { bookings } = duplicate;
      const toKeep = bookings[0]; // Mantener la primera
      const toDelete = bookings.slice(1); // Eliminar las demás

      console.log(`\n🔄 Procesando slot ${duplicate.slot}:`);
      console.log(`   ✅ Manteniendo: ${toKeep.client.name} (ID: ${toKeep.id})`);
      
      results.totalDuplicates += toDelete.length;

      for (const booking of toDelete) {
        try {
          console.log(`   🗑️ Eliminando: ${booking.client.name} (ID: ${booking.id})`);
          
          await prisma.booking.delete({
            where: { id: booking.id }
          });
          
          results.deleted++;
          console.log(`   ✅ Eliminado: ${booking.client.name}`);
          
        } catch (error) {
          results.failed++;
          results.errors.push(`Error eliminando ${booking.client.name} (ID: ${booking.id}): ${error.message}`);
          console.log(`   ❌ Error eliminando: ${error.message}`);
        }
      }
    }

    // Mostrar resultados finales
    console.log('\n📊 Resultados de la limpieza:');
    console.log(`   - Total de duplicados: ${results.totalDuplicates}`);
    console.log(`   - Eliminados: ${results.deleted}`);
    console.log(`   - Errores: ${results.failed}`);

    if (results.errors.length > 0) {
      console.log('\n⚠️ Errores encontrados:');
      results.errors.forEach(error => console.log(`   - ${error}`));
    }

    if (results.deleted > 0) {
      console.log(`\n✅ Limpieza completada: ${results.deleted} reservas duplicadas eliminadas`);
    }

  } catch (error) {
    console.error('💥 Error durante la limpieza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la limpieza
cleanDuplicateBookings();
