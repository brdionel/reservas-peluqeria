/**
 * Servicio de Keep-Alive interno para evitar spin down en Render
 * Se ejecuta automáticamente dentro del servidor
 */

import https from 'https';
import http from 'http';

class KeepAliveService {
  constructor() {
    this.isRunning = false;
    this.interval = null;
    this.appUrl = process.env.APP_URL || 'https://reservas-peluqeria.onrender.com';
    this.pingInterval = 14 * 60 * 1000; // 14 minutos
    this.healthEndpoint = '/api/health';
  }

  /**
   * Iniciar el servicio de keep-alive
   */
  start() {
    if (this.isRunning) {
      console.log('🔄 Keep-alive ya está ejecutándose');
      return;
    }

    console.log('🚀 Iniciando keep-alive interno para:', this.appUrl);
    console.log('⏰ Ping cada:', this.pingInterval / 1000 / 60, 'minutos');

    this.isRunning = true;
    
    // Hacer el primer ping inmediatamente
    this.makePing();
    
    // Configurar ping periódico
    this.interval = setInterval(() => {
      this.makePing();
    }, this.pingInterval);

    console.log('✅ Keep-alive interno iniciado');
  }

  /**
   * Detener el servicio de keep-alive
   */
  stop() {
    if (!this.isRunning) {
      console.log('🛑 Keep-alive no está ejecutándose');
      return;
    }

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.isRunning = false;
    console.log('🛑 Keep-alive interno detenido');
  }

  /**
   * Realizar un ping a la aplicación
   */
  makePing() {
    const url = this.appUrl + this.healthEndpoint;
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const timestamp = new Date().toLocaleString('es-AR');
        console.log(`✅ [${timestamp}] Keep-alive ping exitoso - Status: ${res.statusCode}`);
        
        try {
          const response = JSON.parse(data);
          console.log(`   📊 Uptime: ${Math.round(response.uptime / 60)} minutos`);
        } catch (e) {
          // Ignorar errores de parsing
        }
      });
    });
    
    req.on('error', (err) => {
      const timestamp = new Date().toLocaleString('es-AR');
      console.log(`❌ [${timestamp}] Error en keep-alive ping:`, err.message);
    });
    
    req.setTimeout(10000, () => {
      const timestamp = new Date().toLocaleString('es-AR');
      console.log(`⏰ [${timestamp}] Timeout en keep-alive ping`);
      req.destroy();
    });
  }

  /**
   * Obtener el estado del servicio
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      appUrl: this.appUrl,
      pingInterval: this.pingInterval,
      lastPing: this.lastPing
    };
  }
}

// Crear instancia singleton
const keepAliveService = new KeepAliveService();

export default keepAliveService;
