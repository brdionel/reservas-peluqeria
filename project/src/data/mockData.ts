import { BookingData, Client } from "../types/booking";

// Datos de prueba para reservas
export const mockBookings: BookingData[] = [
  // Ayer
  {
    name: "Bruno Vicente",
    phone: "+54 9 11 1234-5678",
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires"
    }),
    time: "10:00",
  },
  {
    name: "Maxi Nuñezz",
    phone: "+54 9 11 2345-6789",
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires"
    }),
    time: "14:30",
  },
  // Hoy
  {
    name: "Pipa Aramburu",
    phone: "+54 9 11 3456-7890",
    date: new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires"
    }),
    time: "11:00",
  },
  {
    name: "Maxi Lorber",
    phone: "+54 9 11 4567-8901",
    date: new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires"
    }),
    time: "15:30",
  },
  // Mañana
  {
    name: "Naza Leidi",
    phone: "+54 9 11 5678-9012",
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires"
    }),
    time: "09:30",
  },
  // Próxima semana
  {
    name: "Alejo",
    phone: "+54 9 11 6789-0123",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires"
    }),
    time: "16:00",
  },
  // Datos históricos
  {
    name: "Bruno Vicente",
    phone: "+54 9 11 1234-5678",
    date: "2024-12-15",
    time: "11:30",
  },
  {
    name: "Pipa Aramburu",
    phone: "+54 9 11 3456-7890",
    date: "2024-12-10",
    time: "14:00",
  },
  {
    name: "Maxi Nuñezz",
    phone: "+54 9 11 2345-6789",
    date: "2024-12-08",
    time: "10:30",
  },
  {
    name: "Maxi Lorber",
    phone: "+54 9 11 4567-8901",
    date: "2024-12-05",
    time: "16:30",
  },
];

// Datos de prueba para clientes
export const mockClients: Client[] = [
  {
    name: "Pipa Aramburu",
    phone: "+54 9 11 1234-5678",
    totalBookings: 8,
    lastVisit: "2024-12-20",
    firstVisit: "2024-06-15",
    isRegular: true,
  },
  {
    name: "Maxi Nuñez",
    phone: "+54 9 11 2345-6789",
    totalBookings: 12,
    lastVisit: "2024-12-18",
    firstVisit: "2024-03-10",
    isRegular: true,
  },
  {
    name: "Maxi Lorber",
    phone: "+54 9 11 3456-7890",
    totalBookings: 6,
    lastVisit: "2024-12-22",
    firstVisit: "2024-08-05",
    isRegular: true,
  },
  {
    name: "Bruno Vicente",
    phone: "+54 9 11 8901-2345",
    totalBookings: 7,
    lastVisit: "2024-12-10",
    firstVisit: "2024-07-22",
    isRegular: true,
  },
];

// Función para cargar datos de prueba (solo para desarrollo)
export const loadMockData = () => {
  if (import.meta.env.DEV) {
    localStorage.setItem("salon-bookings", JSON.stringify(mockBookings));
    localStorage.setItem("salon-clients", JSON.stringify(mockClients));
    console.log("📊 Datos de prueba cargados");
  }
};

// Función para limpiar datos de prueba
export const clearMockData = () => {
  localStorage.removeItem("salon-bookings");
  localStorage.removeItem("salon-clients");
  localStorage.removeItem("salon-config");
  console.log("🗑️ Datos de prueba eliminados");
};
