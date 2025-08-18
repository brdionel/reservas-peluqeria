import { useState, useEffect } from "react";
import { BookingData, Client, SalonConfig } from "../types/booking";
import { configService, bookingService } from '../services/api';

interface TimeSlot {
  time: string;
  available: boolean;
  clientName?: string;
  clientPhone?: string;
}

export const useBookingData = () => {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [predefinedClients, setPredefinedClients] = useState<Client[]>([]);
  const [salonConfig, setSalonConfig] = useState<SalonConfig | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Horarios disponibles (9:00 AM a 6:00 PM)
  const timeSlots = [
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
  ];

  // Cargar datos del backend al inicializar
  useEffect(() => {
    const loadDataFromBackend = async () => {
      try {
        // Cargar configuración del backend
        const configResponse = await configService.getConfig();
        if (configResponse.success && configResponse.data) {
          // Transformar los datos del backend al formato del frontend
          const backendData = configResponse.data as any;
          const transformedConfig: SalonConfig = {
            workingHours: backendData.workingHours || [],
            slotDuration: backendData.slotDuration || 30,
            advanceBookingDays: backendData.advanceBookingDays || 30,
            defaultServices: backendData.defaultServices || [],
            salonName: backendData.salonName || "Salón Invictus",
            timezone: backendData.timezone || "America/Argentina/Buenos_Aires"
          };
          setSalonConfig(transformedConfig);
        } else {
          // Si falla, usar configuración por defecto
          initializeWithDefaultConfig();
        }

        // Cargar reservas del backend
        const bookingsResponse = await bookingService.getBookings();
        if (bookingsResponse.success && bookingsResponse.data) {
          setBookings(bookingsResponse.data as BookingData[]);
        } else {
          // Si falla, usar datos de ejemplo
          initializeWithSampleData();
        }

        // Por ahora, usar clientes de ejemplo (puedes implementar clientService después)
        initializeWithSampleClients();
        
      } catch (error) {
        console.error("Error loading data from backend:", error);
        // Si hay error, inicializar con datos de ejemplo
        initializeWithSampleData();
        initializeWithSampleClients();
        initializeWithDefaultConfig();
      }

      setIsLoaded(true);
    };

    loadDataFromBackend();
  }, []);

  // Inicializar con datos de ejemplo
  const initializeWithSampleData = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const sampleBookings: BookingData[] = [
      // Ayer
      {
        name: "Bruno Vicente",
        phone: "+54 9 11 1234-5678",
        date: yesterday.toLocaleDateString("en-CA", {
          timeZone: "America/Argentina/Buenos_Aires"
        }),
        time: "10:00",
      },
      {
        name: "Maxi Nuñezz",
        phone: "+54 9 11 2345-6789",
        date: yesterday.toLocaleDateString("en-CA", {
          timeZone: "America/Argentina/Buenos_Aires"
        }),
        time: "14:30",
      },
      // Hoy
      {
        name: "Pipa Aramburu",
        phone: "+54 9 11 3456-7890",
        date: today.toLocaleDateString("en-CA", {
          timeZone: "America/Argentina/Buenos_Aires"
        }),
        time: "11:00",
      },
      {
        name: "Maxi Lorber",
        phone: "+54 9 11 4567-8901",
        date: today.toLocaleDateString("en-CA", {
          timeZone: "America/Argentina/Buenos_Aires"
        }),
        time: "15:30",
      },
      // Mañana
      {
        name: "Naza Leidi",
        phone: "+54 9 11 5678-9012",
        date: tomorrow.toLocaleDateString("en-CA", {
          timeZone: "America/Argentina/Buenos_Aires"
        }),
        time: "09:30",
      },
      // Próxima semana
      {
        name: "Alejo",
        phone: "+54 9 11 6789-0123",
        date: nextWeek.toLocaleDateString("en-CA", {
          timeZone: "America/Argentina/Buenos_Aires"
        }),
        time: "16:00",
      },
      // Más datos históricos
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

    setBookings(sampleBookings);
    localStorage.setItem("salon-bookings", JSON.stringify(sampleBookings));
  };

  // Inicializar con clientes de ejemplo
  const initializeWithSampleClients = () => {
    const sampleClients: Client[] = [
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

    setPredefinedClients(sampleClients);
    localStorage.setItem("salon-clients", JSON.stringify(sampleClients));
  };

  // Inicializar configuración por defecto
  const initializeWithDefaultConfig = () => {
    const defaultConfig: SalonConfig = {
      workingHours: [
        { dayOfWeek: 0, enabled: false, startTime: "09:00", endTime: "18:00" }, // Domingo
        { dayOfWeek: 1, enabled: true, startTime: "09:00", endTime: "18:00" }, // Lunes
        { dayOfWeek: 2, enabled: true, startTime: "09:00", endTime: "18:00" }, // Martes
        { dayOfWeek: 3, enabled: true, startTime: "09:00", endTime: "18:00" }, // Miércoles
        { dayOfWeek: 4, enabled: true, startTime: "09:00", endTime: "18:00" }, // Jueves
        { dayOfWeek: 5, enabled: true, startTime: "09:00", endTime: "18:00" }, // Viernes
        { dayOfWeek: 6, enabled: true, startTime: "09:00", endTime: "18:00" }, // Sábado
      ],
      slotDuration: 30,
      advanceBookingDays: 30,
      defaultServices: [
        "Corte de Cabello",
        "Lavado y Peinado",
        "Corte + Lavado",
        "Barba",
        "Corte + Barba",
        "Tratamiento Capilar",
      ],
      salonName: "Salón Invictus",
      timezone: "America/Argentina/Buenos_Aires",
    };

    setSalonConfig(defaultConfig);
    localStorage.setItem("salon-config", JSON.stringify(defaultConfig));
  };

  // Guardar en localStorage cuando cambien las reservas
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("salon-bookings", JSON.stringify(bookings));
    }
  }, [bookings, isLoaded]);

  // Guardar clientes en localStorage
  useEffect(() => {
    if (isLoaded && predefinedClients.length > 0) {
      localStorage.setItem("salon-clients", JSON.stringify(predefinedClients));
    }
  }, [predefinedClients, isLoaded]);

  // Guardar configuración en localStorage
  useEffect(() => {
    if (isLoaded && salonConfig) {
      localStorage.setItem("salon-config", JSON.stringify(salonConfig));
    }
  }, [salonConfig, isLoaded]);

  // Generar slots basado en configuración
  const generateTimeSlots = (date: Date): string[] => {
    if (!salonConfig) return timeSlots;

    const dayOfWeek = date.getDay();
    const workingDay = salonConfig.workingHours.find(
      (wh) => wh.dayOfWeek === dayOfWeek
    );

    if (!workingDay || !workingDay.enabled) {
      return [];
    }

    const slots: string[] = [];
    const startTime = workingDay.startTime;
    const endTime = workingDay.endTime;
    const slotDuration = salonConfig.slotDuration;

    let currentTime = new Date(`2000-01-01T${startTime}:00`);
    const endDateTime = new Date(`2000-01-01T${endTime}:00`);

    while (currentTime < endDateTime) {
      const timeString = currentTime.toTimeString().slice(0, 5);

      // Obtengo la hora y minutos actuales en número (ej: 15:30 -> 15*60 + 30 = 930)
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      // Obtengo los minutos de currentTime (hora + minutos)
      const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

      // Sólo si es hoy y currentTime está antes de la hora actual, salto
      if (
        date.toDateString() === now.toDateString() &&
        currentMinutes <= nowMinutes
      ) {
        currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
        continue;
      }

      // Verificar si está en horario de descanso
      if (workingDay.breakStartTime && workingDay.breakEndTime) {
        const breakStart = new Date(`2000-01-01T${workingDay.breakStartTime}:00`);
        const breakEnd = new Date(`2000-01-01T${workingDay.breakEndTime}:00`);

        if (currentTime >= breakStart && currentTime < breakEnd) {
          currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
          continue;
        }
      }

      slots.push(timeString);
      currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
    }

    return slots;
  };

  // Obtener slots disponibles para una fecha específica
  const getAvailableSlots = (date: Date): TimeSlot[] => {
    const dateString = date.toLocaleDateString("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires"
    });
    const availableTimeSlots = generateTimeSlots(date);

    // Si no hay slots configurados para este día
    if (availableTimeSlots.length === 0) {
      return [];
    }

    // No permitir reservas en fechas pasadas
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return availableTimeSlots.map((time) => {
        const booking = bookings.find(
          (b) => b.date === dateString && b.time === time
        );
        return {
          time,
          available: false,
          clientName: booking?.client?.name || booking?.name,
          clientPhone: booking?.client?.phone || booking?.phone,
        };
      });
    }

    return availableTimeSlots.map((time) => {
      const booking = bookings.find(
        (b) => b.date === dateString && b.time === time
      );
      return {
        time,
        available: !booking,
        clientName: booking?.client?.name || booking?.name,
        clientPhone: booking?.client?.phone || booking?.phone,
      };
    });
  };

  // Crear nueva reserva
  const createBooking = (bookingData: BookingData): boolean => {
    // Verificar si el slot ya está ocupado
    const existingBooking = bookings.find(
      (b) => b.date === bookingData.date && b.time === bookingData.time
    );

    if (existingBooking) {
      return false; // Slot ya ocupado
    }

    // Verificar que la fecha no sea pasada
    const bookingDate = new Date(bookingData.date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      return false; // No se pueden hacer reservas en fechas pasadas
    }

    // Verificar que no sea domingo
    if (bookingDate.getDay() === 0) {
      return false; // Domingo cerrado
    }

    setBookings((prev) => [...prev, bookingData]);
    return true;
  };

  // Cancelar reserva
  const cancelBooking = (date: string, time: string): boolean => {
    const bookingIndex = bookings.findIndex(
      (b) => b.date === date && b.time === time
    );

    if (bookingIndex === -1) {
      return false; // Reserva no encontrada
    }

    setBookings((prev) => prev.filter((_, index) => index !== bookingIndex));
    return true;
  };

  // Obtener todas las reservas
  const getAllBookings = (): BookingData[] => {
    return [...bookings].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare === 0) {
        return b.time.localeCompare(a.time);
      }
      return dateCompare;
    });
  };

  // Obtener reservas por fecha
  const getBookingsByDate = (date: string): BookingData[] => {
    return bookings.filter((b) => b.date === date);
  };

  // Verificar si una fecha tiene disponibilidad
  const hasAvailability = (date: Date): boolean => {
    const slots = getAvailableSlots(date);
    return slots.some((slot) => slot.available);
  };

  // Gestión de clientes predefinidos
  const addPredefinedClient = (
    client: Omit<Client, "totalBookings" | "lastVisit" | "firstVisit">
  ) => {
    const newClient: Client = {
      ...client,
      totalBookings: 0,
      lastVisit: "",
      firstVisit: "",
    };
    setPredefinedClients((prev) => [...prev, newClient]);
  };

  const updatePredefinedClient = (index: number, client: Client) => {
    setPredefinedClients((prev) =>
      prev.map((c, i) => (i === index ? client : c))
    );
  };

  const deletePredefinedClient = (index: number) => {
    setPredefinedClients((prev) => prev.filter((_, i) => i !== index));
  };

  // Actualizar configuración del salón
  const updateSalonConfig = (config: SalonConfig) => {
    setSalonConfig(config);
  };

  return {
    bookings,
    predefinedClients,
    salonConfig,
    isLoaded,
    getAvailableSlots,
    createBooking,
    cancelBooking,
    getAllBookings,
    getBookingsByDate,
    hasAvailability,
    addPredefinedClient,
    updatePredefinedClient,
    deletePredefinedClient,
    updateSalonConfig,
  };
};
