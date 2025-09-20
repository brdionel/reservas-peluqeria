import { loadMockData, clearMockData } from "../data/mockData";

// Utilidades para desarrollo y testing
export const devUtils = {
  // Cargar datos de prueba
  loadMockData,
  
  // Limpiar datos de prueba
  clearMockData,
  
  // Verificar si estamos en desarrollo
  isDevelopment: import.meta.env.DEV,
  
  // Función para resetear completamente la aplicación
  resetApp: () => {
    clearMockData();
    window.location.reload();
  },
  
  // Función para mostrar información de debug
  showDebugInfo: () => {
    const bookings = localStorage.getItem("salon-bookings");
    const clients = localStorage.getItem("salon-clients");
    const config = localStorage.getItem("salon-config");
    
    console.log("🔍 Debug Info:");
    console.log("Bookings:", bookings ? JSON.parse(bookings) : "No data");
    console.log("Clients:", clients ? JSON.parse(clients) : "No data");
    console.log("Config:", config ? JSON.parse(config) : "No data");
  }
};

// Hacer disponible en window para acceso desde consola del navegador
if (typeof window !== 'undefined') {
  (window as any).devUtils = devUtils;
}
