import { checkAndRepairSync } from './scripts/sync-checker.js';

/**
 * Daemon para sincronización cada 15 minutos durante horas laborales
 * Se ejecuta cada 15 minutos de 6:00 AM a 8:00 PM
 */
class SyncDaemon15Min {
  constructor() {
    this.interval = 15 * 60 * 1000; // 15 minutos
    this.isRunning = false;
    this.workStartHour = 6; // 6:00 AM
    this.workEndHour = 20;  // 8:00 PM
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ El daemon ya está ejecutándose');
      return;
    }

    console.log('🚀 Iniciando daemon de sincronización (15 min)...');
    console.log(`⏰ Se ejecutará cada ${this.interval / (60 * 1000)} minutos`);
    console.log(`🕐 Horario laboral: ${this.workStartHour}:00 - ${this.workEndHour}:00`);
    
    this.isRunning = true;
    
    // Ejecutar inmediatamente si estamos en horario laboral
    if (this.isWorkTime()) {
      this.runSync();
    }
    
    // Programar ejecuciones futuras
    this.timer = setInterval(() => {
      if (this.isWorkTime()) {
        this.runSync();
      } else {
        console.log(`💤 Fuera de horario laboral (${new Date().getHours()}:${new Date().getMinutes()}), saltando sincronización...`);
      }
    }, this.interval);
  }

  stop() {
    if (!this.isRunning) {
      console.log('⚠️ El daemon no está ejecutándose');
      return;
    }

    console.log('🛑 Deteniendo daemon de sincronización...');
    clearInterval(this.timer);
    this.isRunning = false;
  }

  isWorkTime() {
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour >= this.workStartHour && currentHour < this.workEndHour;
  }

  async runSync() {
    const now = new Date().toLocaleString('es-AR');
    console.log(`\n🔄 [${now}] Ejecutando sincronización automática...`);
    
    try {
      await checkAndRepairSync();
      console.log(`✅ [${now}] Sincronización completada`);
    } catch (error) {
      console.error(`❌ [${now}] Error en sincronización:`, error);
    }
  }

  // Método para cambiar horario laboral
  setWorkHours(startHour, endHour) {
    this.workStartHour = startHour;
    this.workEndHour = endHour;
    console.log(`🕐 Horario laboral actualizado: ${startHour}:00 - ${endHour}:00`);
  }
}

// Manejar señales de terminación
process.on('SIGINT', () => {
  console.log('\n🛑 Recibida señal SIGINT, deteniendo daemon...');
  if (daemon) daemon.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Recibida señal SIGTERM, deteniendo daemon...');
  if (daemon) daemon.stop();
  process.exit(0);
});

const daemon = new SyncDaemon15Min();

// Iniciar el daemon
daemon.start();

console.log('💡 Para detener el daemon: Ctrl+C');
console.log('💡 Para ver logs en tiempo real: tail -f logs/sync-15min.log');
console.log('💡 Para cambiar horario: daemon.setWorkHours(7, 19)');
