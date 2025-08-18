import { verifyBookingsInCalendar, repairMissingCalendarEvents } from '../src/services/googleCalendar.js';
import { PrismaClient } from '@prisma/client';

// Crear instancia de Prisma para el script
const prisma = new PrismaClient();

/**
 * Script para verificar y reparar la sincronización con Google Calendar
 * Se puede ejecutar manualmente o programar con cron
 */
async function checkAndRepairSync() {
  try {
    console.log('🔄 Iniciando verificación de sincronización...');
    
    // Definir rango de fechas (últimos 30 días + próximos 30 días)
    const today = new Date();
    const startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 días atrás
    const endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 días adelante

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`📅 Verificando reservas del ${startDateStr} al ${endDateStr}`);

    // Verificar sincronización
    const verificationResult = await verifyBookingsInCalendar(prisma, startDateStr, endDateStr);
    
    if (!verificationResult.success) {
      console.error('❌ Error en verificación:', verificationResult.error);
      return;
    }

    const results = verificationResult.results;
    console.log('📊 Resultados de la verificación:');
    console.log(`   - Total de reservas: ${results.totalBookings}`);
    console.log(`   - En Google Calendar: ${results.inCalendar}`);
    console.log(`   - Faltan en Google Calendar: ${results.missingInCalendar}`);
    console.log(`   - Sin ID de evento: ${results.missingEventIds}`);

    // Si hay reservas que faltan, repararlas automáticamente
    if (results.details.length > 0) {
      console.log('🔧 Reparando reservas faltantes...');
      
      const repairResult = await repairMissingCalendarEvents(prisma, results.details);
      
      if (repairResult.success) {
        console.log('✅ Reparación completada:');
        console.log(`   - Eventos creados: ${repairResult.results.created}`);
        console.log(`   - Errores: ${repairResult.results.failed}`);
        
        if (repairResult.results.errors.length > 0) {
          console.log('⚠️ Errores durante la reparación:');
          repairResult.results.errors.forEach(error => console.log(`   - ${error}`));
        }
      } else {
        console.error('❌ Error en reparación:', repairResult.error);
      }
    } else {
      console.log('✅ Todas las reservas están sincronizadas correctamente');
    }

  } catch (error) {
    console.error('💥 Error inesperado:', error);
  } finally {
    // Cerrar conexión de Prisma
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  checkAndRepairSync();
}

export { checkAndRepairSync };
