/**
 * Script para mantener la aplicación activa en Render (plan gratuito)
 * Ejecuta este script en tu computadora para evitar el "spin down"
 */

const https = require('https');
const http = require('http');

// Configuración
const APP_URL = 'https://reservas-peluqeria.onrender.com'; // Tu URL de Render
const PING_INTERVAL = 14 * 60 * 1000; // 14 minutos (menos de 15 para evitar spin down)
const HEALTH_ENDPOINT = '/api/health';

console.log('🚀 Iniciando keep-alive para:', APP_URL);
console.log('⏰ Ping cada:', PING_INTERVAL / 1000 / 60, 'minutos');

function makePing() {
  const url = APP_URL + HEALTH_ENDPOINT;
  const client = url.startsWith('https') ? https : http;
  
  const req = client.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      const timestamp = new Date().toLocaleString('es-AR');
      console.log(`✅ [${timestamp}] Ping exitoso - Status: ${res.statusCode}`);
      
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
    console.log(`❌ [${timestamp}] Error en ping:`, err.message);
  });
  
  req.setTimeout(10000, () => {
    const timestamp = new Date().toLocaleString('es-AR');
    console.log(`⏰ [${timestamp}] Timeout en ping`);
    req.destroy();
  });
}

// Hacer el primer ping inmediatamente
makePing();

// Configurar ping periódico
setInterval(makePing, PING_INTERVAL);

console.log('🔄 Keep-alive iniciado. Presiona Ctrl+C para detener.');

// Manejar cierre graceful
process.on('SIGINT', () => {
  console.log('\n🛑 Deteniendo keep-alive...');
  process.exit(0);
});
