import { useState, useEffect } from "react";
import { BookingData, SalonConfig, BookingStatus } from "../types/booking";
import { configService, bookingService } from '../services/api';

interface TimeSlot {
  time: string;
  available: boolean;
  clientName?: string;
  clientPhone?: string;
}

export const useBookingData = () => {
  const [bookings, setBookings] = useState<BookingData[]>([]);
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
          const migratedBookings = migrateExistingBookings(bookingsResponse.data as BookingData[]);
          setBookings(migratedBookings);
        } else {
          // Si falla, inicializar con array vacío
          setBookings([]);
        }
        
      } catch (error) {
        console.error("Error loading data from backend:", error);
        // Si hay error, inicializar con valores por defecto
        setBookings([]);
        initializeWithDefaultConfig();
      }

      setIsLoaded(true);
    };

    loadDataFromBackend();
  }, []);



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
    const isActiveBooking = (b?: BookingData): boolean => {
      if (!b) return false;
      const s = (b.status as unknown as string | undefined)?.toString().toLowerCase();
      // Solo bloquean el slot los estados activos
      const isActive = s === 'confirmed' || s === 'in_progress' || !s; // fallback: sin status => activo
      
      // Debug: mostrar información del booking
      if (b.date === date.toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" })) {
        console.log(`Booking ${b.time}:`, {
          status: b.status,
          normalizedStatus: s,
          isActive,
          booking: b
        });
      }
      
      return isActive;
    };
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
          (b) => b.date === dateString && b.time === time && isActiveBooking(b)
        );
        return {
          time,
          available: !booking,
          clientName: booking?.client?.name || booking?.name,
          clientPhone: booking?.client?.phone || booking?.phone,
        };
      });
    }

    return availableTimeSlots.map((time) => {
      const booking = bookings.find(
        (b) => b.date === dateString && b.time === time && isActiveBooking(b)
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
  const createBooking = async (bookingData: BookingData): Promise<boolean> => {
    try {
      // Verificar si el slot ya está ocupado (solo bookings activos, excluyendo cancelados)
      const existingBooking = bookings.find(
        (b) => {
          if (b.date === bookingData.date && b.time === bookingData.time) {
            const status = (b.status as unknown as string | undefined)?.toString().toLowerCase();
            // Solo considerar ocupados los bookings que NO están cancelados
            return status !== 'cancelled';
          }
          return false;
        }
      );

      if (existingBooking) {
        console.error('Slot ya ocupado');
        return false; // Slot ya ocupado
      }

      // Verificar que la fecha no sea pasada
      const bookingDate = new Date(bookingData.date + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (bookingDate < today) {
        console.error('No se pueden hacer reservas en fechas pasadas');
        return false; // No se pueden hacer reservas en fechas pasadas
      }

      // Verificar que la fecha esté dentro del rango permitido
      const advanceBookingDays = salonConfig?.advanceBookingDays || 30;
      const maxDate = new Date(today);
      maxDate.setDate(today.getDate() + advanceBookingDays);

      if (bookingDate > maxDate) {
        console.error(`No se pueden hacer reservas más allá de ${maxDate.toLocaleDateString('es-AR')} (${advanceBookingDays} días de anticipación)`);
        return false; // No se pueden hacer reservas más allá del límite
      }

      // Asegurar que la reserva tenga estado 'confirmed' por defecto
      const bookingWithStatus = {
        ...bookingData,
        status: 'confirmed' as BookingStatus
      };

      // Hacer llamada al backend
      console.log('Enviando reserva al backend:', bookingWithStatus);
      const response = await bookingService.createBooking(bookingWithStatus);
      
      if (response.success && response.data) {
        console.log('Reserva creada exitosamente en el backend');
        // Actualizar el estado local con la nueva reserva
        setBookings((prev) => [...prev, response.data as BookingData]);
        return true;
      } else {
        console.error('Error al crear reserva en el backend:', response.error);
        return false;
      }
    } catch (error) {
      console.error('Error al crear reserva:', error);
      return false;
    }
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

  // Actualizar estado de una reserva
  const updateBookingStatus = async (bookingId: number, newStatus: string): Promise<boolean> => {
    try {
      const response = await bookingService.updateBooking(bookingId, { status: newStatus });
      
      if (response.success) {
        // Convertir el estado del backend a formato frontend
        const frontendStatus = newStatus.toLowerCase() as BookingStatus;
        setBookings((prev) => 
          prev.map((booking) => 
            booking.id === bookingId 
              ? { ...booking, status: frontendStatus }
              : booking
          )
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating booking status:', error);
      return false;
    }
  };

  // Obtener todas las reservas
  const getAllBookings = (): BookingData[] => {
    const migratedBookings = migrateExistingBookings(bookings);
    return [...migratedBookings].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare === 0) {
        return b.time.localeCompare(a.time);
      }
      return dateCompare;
    });
  };

  // Obtener reservas por fecha
  const getBookingsByDate = (date: string): BookingData[] => {
    const migratedBookings = migrateExistingBookings(bookings);
    return migratedBookings.filter((b) => b.date === date);
  };

  // Verificar si una fecha tiene disponibilidad
  const hasAvailability = (date: Date): boolean => {
    const slots = getAvailableSlots(date);
    return slots.some((slot) => slot.available);
  };


  // Actualizar configuración del salón
  const updateSalonConfig = (config: SalonConfig) => {
    setSalonConfig(config);
  };

  // Función para migrar bookings existentes que no tienen status
  const migrateExistingBookings = (bookings: BookingData[]): BookingData[] => {
    return bookings.map(booking => ({
      ...booking,
      status: booking.status || 'confirmed' as BookingStatus
    }));
  };

  return {
    bookings,
    setBookings,
    salonConfig,
    isLoaded,
    getAvailableSlots,
    createBooking,
    cancelBooking,
    updateBookingStatus,
    getAllBookings,
    getBookingsByDate,
    hasAvailability,
    updateSalonConfig,
  };
};
