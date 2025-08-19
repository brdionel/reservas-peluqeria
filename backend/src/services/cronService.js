/**
 * Servicio de Cron Jobs para ejecutar scripts automáticamente
 * Ejecuta tareas programadas dentro del servidor
 */

import { PrismaClient } from '@prisma/client';
import { verifyBookingsInCalendar, repairMissingCalendarEvents } from './googleCalendar.js';

class CronService {
  constructor() {
    this.isRunning = false;
    this.intervals = new Map();
    this.prisma = new PrismaClient();
    
    // Configuración de horarios
    this.config = {
      syncInterval: 30 * 60 * 1000, // 30 minutos
      startHour: 7, // 7:00 AM
      endHour: 3,   // 3:00 AM (del día siguiente)
      timezone: 'America/Argentina/Buenos_Aires'
    };
  }

  /**
   * Verificar si estamos en horario de trabajo
   */
  isWorkingHours() {
    // Obtener hora actual en Argentina (UTC-3)
    const now = new Date();
    const argentinaTime = new Date(now.getTime() - (3 * 60 * 60 * 1000)); // UTC-3
    const currentHour = argentinaTime.getHours();
    
    console.log(`🕐 [CRON] Hora UTC: ${now.getHours()}:${now.getMinutes()}`);
    console.log(`🕐 [CRON] Hora Argentina: ${currentHour}:${argentinaTime.getMinutes()}`);
    
    // Si estamos entre 7 AM y 3 AM del día siguiente
    if (currentHour >= this.config.startHour || currentHour < this.config.endHour) {
      return true;
    }
    
    return false;
  }

  /**
   * Ejecutar verificación de sincronización
   */
  async runSyncChecker() {
    try {
      console.log('🔍 [CRON] Ejecutando verificación de sincronización...');
      
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7); // Últimos 7 días
      const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30); // Próximos 30 días
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const verificationResult = await verifyBookingsInCalendar(this.prisma, startDateStr, endDateStr);
      
      if (verificationResult.success) {
        const results = verificationResult.results;
        console.log(`✅ [CRON] Verificación completada:`);
        console.log(`   📊 Total reservas: ${results.totalBookings}`);
        console.log(`   ✅ En calendario: ${results.inCalendar}`);
        console.log(`   ❌ Faltantes: ${results.missingInCalendar}`);
        console.log(`   🔧 Sin ID: ${results.missingEventIds}`);
        
        // Si hay reservas que faltan, ejecutar reparación automáticamente
        if (results.missingInCalendar > 0 || results.missingEventIds > 0) {
          console.log('🔧 [CRON] Ejecutando reparación automática...');
          await this.runRepairBookings(results.details);
        }
      } else {
        console.error('❌ [CRON] Error en verificación:', verificationResult.error);
      }
      
    } catch (error) {
      console.error('❌ [CRON] Error ejecutando sync-checker:', error);
    }
  }

  /**
   * Ejecutar reparación de reservas
   */
  async runRepairBookings(missingBookings = null) {
    try {
      console.log('🔧 [CRON] Ejecutando reparación de reservas...');
      
      let bookingsToRepair = missingBookings;
      
      // Si no se proporcionan reservas específicas, buscar todas las que necesitan reparación
      if (!bookingsToRepair) {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
        const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        const verificationResult = await verifyBookingsInCalendar(this.prisma, startDateStr, endDateStr);
        
        if (verificationResult.success) {
          bookingsToRepair = verificationResult.results.details.filter(
            detail => detail.action === 'create_event' || detail.action === 'recreate_event'
          );
        }
      }
      
      if (bookingsToRepair && bookingsToRepair.length > 0) {
        const repairResult = await repairMissingCalendarEvents(this.prisma, bookingsToRepair);
        
        if (repairResult.success) {
          const results = repairResult.results;
          console.log(`✅ [CRON] Reparación completada:`);
          console.log(`   ✅ Creados: ${results.created}`);
          console.log(`   ❌ Fallidos: ${results.failed}`);
          
          if (results.errors.length > 0) {
            console.log('   ⚠️ Errores:', results.errors.slice(0, 3)); // Mostrar solo los primeros 3 errores
          }
        } else {
          console.error('❌ [CRON] Error en reparación:', repairResult.error);
        }
      } else {
        console.log('✅ [CRON] No hay reservas que necesiten reparación');
      }
      
    } catch (error) {
      console.error('❌ [CRON] Error ejecutando repair-bookings:', error);
    }
  }

  /**
   * Tarea principal que se ejecuta cada 30 minutos
   */
  async runScheduledTasks() {
    if (!this.isWorkingHours()) {
      console.log('😴 [CRON] Fuera de horario de trabajo, saltando tareas...');
      return;
    }
    
    console.log('🚀 [CRON] Ejecutando tareas programadas...');
    
    // Ejecutar verificación de sincronización
    await this.runSyncChecker();
    
    console.log('✅ [CRON] Tareas programadas completadas');
  }

  /**
   * Iniciar el servicio de cron
   */
  start() {
    if (this.isRunning) {
      console.log('🔄 [CRON] Servicio ya está ejecutándose');
      return;
    }

    console.log('🚀 [CRON] Iniciando servicio de tareas programadas...');
    console.log(`⏰ [CRON] Intervalo: ${this.config.syncInterval / 1000 / 60} minutos`);
    console.log(`🕐 [CRON] Horario: ${this.config.startHour}:00 - ${this.config.endHour}:00`);
    
    this.isRunning = true;
    
    // Ejecutar la primera tarea inmediatamente
    this.runScheduledTasks();
    
    // Configurar ejecución periódica
    const interval = setInterval(() => {
      this.runScheduledTasks();
    }, this.config.syncInterval);
    
    this.intervals.set('main', interval);
    
    console.log('✅ [CRON] Servicio de tareas programadas iniciado');
  }

  /**
   * Detener el servicio de cron
   */
  stop() {
    if (!this.isRunning) {
      console.log('🛑 [CRON] Servicio no está ejecutándose');
      return;
    }

    console.log('🛑 [CRON] Deteniendo servicio de tareas programadas...');
    
    // Limpiar todos los intervalos
    for (const [name, interval] of this.intervals) {
      clearInterval(interval);
      console.log(`   🛑 Detenido: ${name}`);
    }
    
    this.intervals.clear();
    this.isRunning = false;
    
    console.log('✅ [CRON] Servicio de tareas programadas detenido');
  }

  /**
   * Ejecutar tareas manualmente
   */
  async runManualSync() {
    console.log('🔧 [CRON] Ejecutando sincronización manual...');
    await this.runScheduledTasks();
  }

  /**
   * Obtener estado del servicio
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isWorkingHours: this.isWorkingHours(),
      config: this.config,
      activeIntervals: Array.from(this.intervals.keys())
    };
  }
}

// Crear instancia singleton
const cronService = new CronService();

export default cronService;
