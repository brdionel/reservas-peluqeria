import { execSync } from 'child_process';

/**
 * Script para resolver migraciones fallidas en producción
 * Este script intenta marcar la migración fallida conocida como resuelta
 * sin consultar la BD primero para evitar problemas con límites de cuota
 */
function resolveFailedMigration() {
  const migrationName = '20250920070000_add_multiple_calendars_support';
  
  console.log('🔍 Intentando resolver migración fallida:', migrationName);
  console.log('ℹ️  Nota: Si la BD tiene límites de cuota, esto puede fallar silenciosamente');
  
  // Primero intentamos marcar como aplicada (caso más común: migración falló parcialmente)
  try {
    console.log('🔧 Intentando marcar migración como aplicada...');
    execSync(`npx prisma migrate resolve --applied ${migrationName}`, {
      stdio: 'inherit',
      env: process.env
    });
    console.log('✅ Migración marcada como aplicada exitosamente');
    return;
  } catch (error) {
    console.log(`⚠️  No se pudo marcar como aplicada: ${error.message}`);
    console.log('🔄 Intentando marcar como revertida...');
    
    // Si falla, intentamos marcar como revertida para permitir reintento
    try {
      execSync(`npx prisma migrate resolve --rolled-back ${migrationName}`, {
        stdio: 'inherit',
        env: process.env
      });
      console.log('✅ Migración marcada como revertida (se reintentará)');
      return;
    } catch (rollbackError) {
      console.log(`⚠️  No se pudo marcar como revertida: ${rollbackError.message}`);
      console.log('⚠️  La migración podría no estar en estado fallido, o hay un problema de conexión');
      console.log('⚠️  Continuando con el proceso de build...');
      // No lanzar error para permitir que el build continúe
      // Prisma migrate deploy manejará el estado real de las migraciones
    }
  }
}

resolveFailedMigration();

