import { checkAndRepairSync } from './scripts/sync-checker.js';

/**
 * Daemon para sincronización automática con Google Calendar
 * Se ejecuta cada 24 horas (86400000 ms)
 */
class SyncDaemon {
  constructor() {
    this.interval = 24 * 60 * 60 * 1000; // 24 horas
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ El daemon ya está ejecutándose');
      return;
    }

    console.log('🚀 Iniciando daemon de sincronización...');
    console.log(`⏰ Se ejecutará cada ${this.interval / (60 * 60 * 1000)} horas`);
    
    this.isRunning = true;
    
    // Ejecutar inmediatamente
    this.runSync();
    
    // Programar ejecuciones futuras
    this.timer = setInterval(() => {
      this.runSync();
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

const daemon = new SyncDaemon();

// Iniciar el daemon
daemon.start();

console.log('💡 Para detener el daemon: Ctrl+C');
console.log('💡 Para ver logs en tiempo real, ejecutar en otra terminal: tail -f logs/sync.log');
