import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

/**
 * Script para resolver migraciones fallidas en producción
 * Este script intenta marcar la migración fallida como resuelta
 */
async function resolveFailedMigration() {
  try {
    console.log('🔍 Verificando migraciones fallidas...');

    // Verificar si hay migraciones fallidas consultando directamente la tabla de Prisma
    const result = await prisma.$queryRawUnsafe(`
      SELECT migration_name, started_at, finished_at, rolled_back_at
      FROM "_prisma_migrations" 
      WHERE finished_at IS NULL 
      AND rolled_back_at IS NULL
      ORDER BY started_at DESC
      LIMIT 1
    `);

    if (result && result.length > 0) {
      const failedMigration = result[0];
      console.log(`⚠️  Migración fallida encontrada: ${failedMigration.migration_name}`);
      console.log(`   Iniciada en: ${failedMigration.started_at}`);

      // Verificar el estado actual de la base de datos
      const hasGoogleCalendarsTable = await checkTableExists('google_calendars');
      const hasGoogleEventIdsColumn = await checkColumnExists('bookings', 'google_event_ids');
      const hasGoogleEventIdColumn = await checkColumnExists('bookings', 'google_event_id');

      console.log(`📊 Estado actual de la BD:`);
      console.log(`   - Tabla google_calendars existe: ${hasGoogleCalendarsTable}`);
      console.log(`   - Columna google_event_ids existe: ${hasGoogleEventIdsColumn}`);
      console.log(`   - Columna google_event_id existe: ${hasGoogleEventIdColumn}`);

      const migrationName = failedMigration.migration_name || '20250920070000_add_multiple_calendars_support';

      // Si la migración parece estar aplicada (tabla y columna nuevas existen)
      if (hasGoogleCalendarsTable && hasGoogleEventIdsColumn && !hasGoogleEventIdColumn) {
        console.log('✅ Los cambios de la migración ya están aplicados en la BD');
        console.log('🔧 Marcando migración como aplicada...');
        
        // Marcar como aplicada usando prisma migrate resolve
        try {
          execSync(`npx prisma migrate resolve --applied ${migrationName}`, {
            stdio: 'inherit',
            env: process.env
          });
          console.log('✅ Migración marcada como aplicada exitosamente');
        } catch (error) {
          console.log('⚠️  No se pudo usar prisma migrate resolve, intentando solución manual...');
          console.log(`   Error: ${error.message}`);
          
          // Solución manual: actualizar directamente la tabla de migraciones
          try {
            await prisma.$executeRawUnsafe(`
              UPDATE "_prisma_migrations" 
              SET finished_at = NOW(), 
                  applied_steps_count = 1
              WHERE migration_name = '${migrationName.replace(/'/g, "''")}'
              AND finished_at IS NULL
            `);
            
            console.log('✅ Migración marcada como aplicada manualmente');
          } catch (manualError) {
            console.log(`⚠️  No se pudo marcar manualmente: ${manualError.message}`);
          }
        }
      } else {
        console.log('⚠️  Los cambios de la migración no están completamente aplicados');
        console.log('🔄 Marcando migración como revertida para permitir reintento...');
        
        try {
          execSync(`npx prisma migrate resolve --rolled-back ${migrationName}`, {
            stdio: 'inherit',
            env: process.env
          });
          console.log('✅ Migración marcada como revertida');
        } catch (error) {
          console.log('⚠️  No se pudo usar prisma migrate resolve, intentando solución manual...');
          console.log(`   Error: ${error.message}`);
          
          // Marcar como revertida manualmente
          try {
            await prisma.$executeRawUnsafe(`
              UPDATE "_prisma_migrations" 
              SET rolled_back_at = NOW()
              WHERE migration_name = '${migrationName.replace(/'/g, "''")}'
              AND rolled_back_at IS NULL
            `);
            
            console.log('✅ Migración marcada como revertida manualmente');
          } catch (manualError) {
            console.log(`⚠️  No se pudo marcar manualmente: ${manualError.message}`);
          }
        }
      }
    } else {
      console.log('✅ No se encontraron migraciones fallidas');
    }

  } catch (error) {
    console.error('❌ Error al resolver migración fallida:', error.message);
    console.error('   Stack:', error.stack);
    // No salir con error para permitir que el build continúe
    console.log('⚠️  Continuando con el proceso de build...');
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Verifica si una tabla existe
 */
async function checkTableExists(tableName) {
  try {
    const result = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName.replace(/'/g, "''")}'
      ) as exists
    `);
    return result[0]?.exists || false;
  } catch (error) {
    return false;
  }
}

/**
 * Verifica si una columna existe en una tabla
 */
async function checkColumnExists(tableName, columnName) {
  try {
    const result = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName.replace(/'/g, "''")}'
        AND column_name = '${columnName.replace(/'/g, "''")}'
      ) as exists
    `);
    return result[0]?.exists || false;
  } catch (error) {
    return false;
  }
}

resolveFailedMigration();

