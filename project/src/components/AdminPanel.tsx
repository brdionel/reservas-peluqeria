import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Trash2,
  Plus,
  Scissors,
  CheckCircle,
  AlertCircle,
  History,
  Users,
  BarChart3,
  Search,
  Filter,
  Eye,
  Settings,
  Menu,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  LogOut,
  UserPlus,
  Edit,
} from "lucide-react";
import { useBookingData } from "../hooks/useBookingData";
import { useAuth } from "../hooks/useAuth";
import { configService, bookingService, clientService } from "../services/api";
import { ConfirmModal } from "./Modal";
import { ClientModal } from "./ClientModal";
import {
  BookingData,
  WorkingHours,
  SalonConfig,
} from "../types/booking";

interface AdminPanelProps {
  onBackToClient: () => void;
}

interface ManualBookingForm {
  name: string;
  areaCode: string;
  phoneNumber: string;
  time: string;
}

type AdminView =
  | "today"
  | "weekly"
  | "history"
  | "clients"
  | "stats"
  | "config";

export const AdminPanel: React.FC<AdminPanelProps> = () => {
  const {
    getAllBookings,
    cancelBooking,
    getAvailableSlots,
    salonConfig,
    updateSalonConfig,
    setBookings,
  } = useBookingData();
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  // Estado para la vista actual con persistencia en localStorage
  const [currentView, setCurrentView] = useState<AdminView>(() => {
    const savedView = localStorage.getItem('adminCurrentView');
    return (savedView as AdminView) || "today";
  });

  // Función para actualizar la vista y guardarla en localStorage
  const updateCurrentView = (view: AdminView) => {
    setCurrentView(view);
    localStorage.setItem('adminCurrentView', view);
  };
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [manualBookingForm, setManualBookingForm] = useState<ManualBookingForm>(
    {
      name: "",
      areaCode: "",
      phoneNumber: "",
      time: "",
    }
  );
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [isDeletingClient, setIsDeletingClient] = useState(false);
  const [isCancelingBooking, setIsCancelingBooking] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Estado para el modal de confirmación de cancelación
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean;
    booking: { date: string; time: string; name?: string } | null;
  }>({
    isOpen: false,
    booking: null,
  });

  const [viewMode] = useState<"cards" | "timeline">("cards");

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Estados para gestión de clientes
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientModalMode, setClientModalMode] = useState<"add" | "edit">("add");
  const [editingClientIndex, setEditingClientIndex] = useState<number | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [deleteClientModal, setDeleteClientModal] = useState<{
    isOpen: boolean;
    client: any | null;
    clientIndex: number | null;
  }>({
    isOpen: false,
    client: null,
    clientIndex: null,
  });

  const [tempWorkingHours, setTempWorkingHours] = useState<WorkingHours[]>([]);
  const [hasWorkingHoursChanges, setHasWorkingHoursChanges] = useState(false);

  // Estado para manejar el día seleccionado en la vista de agenda
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Estado para manejar el scroll de la navegación de días

  // Inicializar horarios temporales cuando se carga la configuración
  useEffect(() => {
    if (salonConfig?.workingHours) {
      setTempWorkingHours([...salonConfig.workingHours]);
      setHasWorkingHoursChanges(false);
    }
  }, [salonConfig?.workingHours]);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const today = new Date();
  const todayString = today.toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
  // "en-CA" da formato YYYY-MM-DD
  const selectedDateString = selectedDate.toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });

  const allBookings = getAllBookings();
  const selectedDateSlots = getAvailableSlots(selectedDate);

  // Funciones auxiliares
  const formatTime = (time: string) => {
    return time;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("es-AR");
  };

  const handleCancelBooking = (booking: {
    date: string;
    time: string;
    name?: string;
    phone?: string;
  }) => {
    setCancelModal({
      isOpen: true,
      booking: {
        date: booking.date,
        time: booking.time,
        name: booking.name,
      },
    });
  };

  const confirmCancelBooking = async () => {
    if (!cancelModal.booking) return;

    // Evitar múltiples envíos
    if (isCancelingBooking) {
      return;
    }

    setIsCancelingBooking(true);

    const { date, time, name } = cancelModal.booking;
    const clientName = name || "el cliente";

    try {
      // Buscar el ID de la reserva en el backend
      const bookingsResponse = await bookingService.getBookings();
      const allBookings = bookingsResponse.data as BookingData[];
      const bookingToCancel = allBookings.find(
        (b) => b.date === date && b.time === time
      );

      if (bookingToCancel && bookingToCancel.id) {
        // Enviar al backend
        const response = await bookingService.deleteBooking(bookingToCancel.id);

        if (response.success) {
          // Actualizar estado local
          const success = cancelBooking(date, time);
          if (success) {
            // Recargar clientes para actualizar estadísticas
            await loadClients();
            
            showNotification(
              "success",
              `Turno de ${clientName} cancelado exitosamente`
            );
            setCancelModal({ isOpen: false, booking: null });
          }
        } else {
          showNotification(
            "error",
            "Error al cancelar la reserva en el servidor"
          );
        }
      } else {
        showNotification("error", "No se encontró la reserva para cancelar");
      }
    } catch (error) {
      console.error("Error canceling booking:", error);
      showNotification("error", "Error al cancelar la reserva");
    } finally {
      setIsCancelingBooking(false);
    }
  };

  const handleManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !manualBookingForm.name ||
      !manualBookingForm.areaCode ||
      !manualBookingForm.phoneNumber ||
      !manualBookingForm.time
    ) {
      showNotification("error", "Por favor completa todos los campos");
      return;
    }

    // Evitar múltiples envíos
    if (isCreatingBooking) {
      return;
    }

    setIsCreatingBooking(true);

    // Formatear el teléfono completo y normalizarlo
    const fullPhone = `+54 9 ${manualBookingForm.areaCode} ${manualBookingForm.phoneNumber}`;
    const normalizedPhone = fullPhone.replace(/\D/g, ''); // Remover todos los caracteres no numéricos
    const finalPhone = `+${normalizedPhone}`;

    const bookingData: BookingData = {
      name: manualBookingForm.name,
      phone: finalPhone,
      date: currentView === "today" ? todayString : selectedDateString,
      time: manualBookingForm.time,
    };

    try {
      // Enviar al backend
      const response = await bookingService.createBooking(bookingData);

      if (response.success) {
        // Actualizar el estado local con la nueva reserva
        if (response.data) {
          setBookings((prev) => [...prev, response.data as BookingData]);
        }

        // Recargar clientes para actualizar estadísticas
        await loadClients();
        
        // Si estamos en la vista de clientes, forzar re-render
        if (currentView === "clients") {
          // Pequeño delay para asegurar que el backend haya procesado todo
          setTimeout(() => {
            loadClients();
          }, 500);
        } else {
          // Si no estamos en la vista de clientes, cambiar a ella para mostrar el nuevo cliente
          updateCurrentView("clients");
        }

        showNotification(
          "success",
          `Turno agendado para ${manualBookingForm.name} a las ${manualBookingForm.time}. Cliente agregado automáticamente.`
        );
        setManualBookingForm({ name: "", areaCode: "", phoneNumber: "", time: "" });
        setShowManualBooking(false);
      } else {
        showNotification(
          "error",
          response.error || "Error al crear la reserva"
        );
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      showNotification("error", "Error al crear la reserva");
    } finally {
      setIsCreatingBooking(false);
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Cargar clientes del backend
  const loadClients = async () => {
    try {
      console.log("🔄 Cargando clientes del backend...");
      const response = await clientService.getClients();
      if (response.success && response.data) {
        const clientsData = Array.isArray(response.data) ? response.data : [];
        console.log("✅ Clientes cargados:", clientsData.length, "clientes");
        setClients(clientsData);
      } else {
        console.error("❌ Error cargando clientes:", response.error);
        showNotification("error", "Error al cargar los clientes");
      }
    } catch (error) {
      console.error("❌ Error cargando clientes:", error);
      showNotification("error", "Error al cargar los clientes");
    }
  };

  // Cargar clientes al montar el componente
  React.useEffect(() => {
    loadClients();
  }, []);

  const availableSlots = selectedDateSlots.filter((slot) => slot.available);
  const occupiedSlots = selectedDateSlots.filter((slot) => !slot.available);

  // Para la vista de hoy
  const todaySlots = getAvailableSlots(today);
  console.log("Today Slots:", todaySlots);
  const todayAvailableSlots = todaySlots.filter((slot) => slot.available);
  const todayOccupiedSlots = todaySlots.filter((slot) => !slot.available);

  // Generate timeline hours (9 AM to 6 PM)
  const timelineHours: {
    hour: number;
    slots: { time: string; label: string }[];
  }[] = [];
  for (let hour = 9; hour <= 18; hour++) {
    timelineHours.push({
      hour,
      slots: [
        { time: `${hour.toString().padStart(2, "0")}:00`, label: `${hour}:00` },
        { time: `${hour.toString().padStart(2, "0")}:30`, label: `${hour}:30` },
      ].filter((slot) => slot.time !== "18:30"), // Remove 6:30 PM as we close at 6 PM
    });
  }

  const getSlotStatus = (time: string) => {
    const slot = selectedDateSlots.find((s) => s.time === time);
    return slot;
  };

  // Generar todos los días (próximas 3 semanas)
  const getAllDays = () => {
    const days = [];
    const today = new Date();
    let currentDate = new Date(today);

    // Generar todos los días por 3 semanas (21 días)
    while (days.length < 21) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  const allDays = getAllDays();

  const formatDayName = (date: Date) => {
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow =
      date.toDateString() ===
      new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString();

    if (isToday) return "Hoy";
    if (isTomorrow) return "Mañana";

    return date.toLocaleDateString("es-AR", { weekday: "short" });
  };

  const formatDayDate = (date: Date) => {
    return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  };

  // Funciones para navegación con flechas
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300; // Cantidad de píxeles a scrollear
      scrollContainerRef.current.scrollBy({
        left: -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300; // Cantidad de píxeles a scrollear
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };


  const renderWeeklyView = () => (
    <div className="grid gap-8">
      <h2 className="text-2xl font-bold text-gray-800">Agenda</h2>

      {/* Navegación por todos los días */}
      <div className="bg-white rounded-xl shadow-lg p-6 w-full overflow-x-auto">
        <div className="relative">
          {/* Flecha izquierda */}
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors border border-gray-200"
            style={{ marginTop: "-8px" }}
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          {/* Contenedor de días con scroll oculto */}
          <div
            ref={scrollContainerRef}
            className="flex gap-3 overflow-x-auto overflow-y-hidden scrollbar-hide mx-10"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {allDays.map((day: Date, index: number) => {
              const isSelected =
                day.toDateString() === selectedDate.toDateString();
              const dayBookings = allBookings.filter(
                (booking) =>
                  booking.date ===
                  day.toLocaleDateString("en-CA", {
                    timeZone: "America/Argentina/Buenos_Aires",
                  })
              );
              const isWorking = isWorkingDay(day);

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(day)}
                  className={`flex-shrink-0 px-4 py-3 rounded-lg text-center min-w-[90px] transition-all duration-200 ${
                    isSelected
                      ? "bg-black text-white shadow-lg"
                      : isWorking
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200"
                  }`}
                >
                  <div className="text-sm font-medium">
                    {formatDayName(day)}
                  </div>
                  <div className="text-xs opacity-80">{formatDayDate(day)}</div>
                  {!isWorking ? (
                    <div
                      className={`text-xs mt-1 ${
                        isSelected ? "text-orange-200" : "text-orange-600"
                      }`}
                    >
                      Descanso
                    </div>
                  ) : dayBookings.length > 0 ? (
                    <div
                      className={`text-xs mt-1 ${
                        isSelected ? "text-yellow-200" : "text-blue-600"
                      }`}
                    >
                      {dayBookings.length} turnos
                    </div>
                  ) : (
                    <div
                      className={`text-xs mt-1 ${
                        isSelected ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      Libre
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Flecha derecha */}
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors border border-gray-200"
            style={{ marginTop: "-8px" }}
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Bookings del día seleccionado */}
      {viewMode == "timeline" && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
            Turnos - {formatDayName(selectedDate)}{" "}
              {formatDayDate(selectedDate)}
            </h3>

            <div className="flex items-center gap-2 text-black-600">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">{occupiedSlots.length} turnos</span>
            </div>
          </div>
          <div className={`grid gap-4 items-start`}>
            <div className="space-y-1">
              {timelineHours.map((hourGroup) => (
                <div
                  key={hourGroup.hour}
                  className="border-l-2 border-gray-200 pl-4 relative"
                >
                  {/* Hour Label */}
                  <div className="hidden absolute -left-12 top-0 text-sm font-medium text-gray-500 w-10 text-right">
                    {hourGroup.hour}:00
                  </div>

                  {/* Time Slots for this hour */}
                  <div className="space-y-2 py-2">
                    {hourGroup.slots.map((timeSlot) => {
                      const slotData = getSlotStatus(timeSlot.time);
                      const isOccupied = slotData && !slotData.available;

                      return (
                        <div
                          key={timeSlot.time}
                          className={`relative flex items-center min-h-[60px] rounded-lg border-2 transition-all duration-200 ${
                            isOccupied
                              ? "bg-blue-50 border-blue-200 hover:bg-blue-100"
                              : "bg-gray-50 border-gray-200 hover:bg-green-50 hover:border-green-300 cursor-pointer"
                          }`}
                          onClick={() => {
                            if (!isOccupied) {
                              setManualBookingForm({
                                ...manualBookingForm,
                                time: timeSlot.time,
                              });
                              setShowManualBooking(true);
                            }
                          }}
                        >
                          {/* Time Marker */}
                          <div
                            className={`absolute -left-6 w-3 h-3 rounded-full border-2 border-white ${
                              isOccupied ? "bg-blue-500" : "bg-gray-300"
                            }`}
                          ></div>

                          {/* Time Label */}
                          <div className="w-16 text-sm font-medium text-gray-600 pl-2">
                            {timeSlot.label}
                          </div>

                          {/* Content */}
                          <div className="flex-1 px-4">
                            {isOccupied ? (
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-semibold text-blue-800 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    {slotData.clientName}
                                  </div>
                                  <div className="text-sm text-blue-600 flex items-center gap-2 mt-1">
                                    <Phone className="w-3 h-3" />
                                    {slotData.clientPhone}
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelBooking({
                                      date: selectedDateString,
                                      time: timeSlot.time,
                                    });
                                  }}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Cancelar turno"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="text-gray-500 text-sm flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Disponible - Click para agendar
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode == "cards" && (
        <div
          className={`grid ${
            viewMode == "cards" ? "lg:grid-cols-[auto]" : ""
          } gap-4 items-start`}
        >
          {viewMode == "cards" && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              {!isWorkingDay(selectedDate) ? (
                // Mensaje único para días no laborales
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 1v3M10 1v3M14 1v3" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">
                    ¡Hoy no se trabaja!
                  </h3>
                  <p className="text-gray-600 text-lg mb-4">
                    Aprovecha este día para descansar y recargar energías
                  </p>
                  <div className="text-sm text-gray-500">
                    {formatDayName(selectedDate)} {formatDayDate(selectedDate)}
                  </div>
                </div>
              ) : (
                // Contenido normal para días laborales
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">
                    Turnos - {formatDayName(selectedDate)}{" "}
                      {formatDayDate(selectedDate)}
                    </h3>
                    <div className="flex items-center gap-2 text-blue-600">
                      <Calendar className="w-5 h-5" />
                      <span className="font-medium">
                        {occupiedSlots.length} turnos
                      </span>
                    </div>
                  </div>
                  
                  {occupiedSlots.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">
                        No hay turnos para{" "}
                        {formatDayName(selectedDate).toLowerCase()}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {occupiedSlots
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .map((slot, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-4 hover:bg-black-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-black-100 rounded-lg flex items-center justify-center">
                                  <Clock className="w-6 h-6 text-black-600" />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-800 text-lg">
                                    {formatTime(slot.time)}
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <User className="w-4 h-4" />
                                    <span>{slot.clientName}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Phone className="w-4 h-4" />
                                    <span>{slot.clientPhone}</span>
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() =>
                                  handleCancelBooking({
                                    date: selectedDateString,
                                    time: slot.time,
                                    name: slot.clientName,
                                  })
                                }
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Cancelar turno"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  <div className="my-6 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 text-center">
                      Horarios disponibles
                    </h3>
                  </div>

                  {/* Available Slots Grid */}
                  {availableSlots.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">
                        No hay horarios disponibles
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {availableSlots
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .map((slot) => (
                          <div
                            key={slot.time}
                            className="bg-green-50 border border-green-200 rounded-lg p-3 text-center hover:bg-green-100 transition-colors cursor-pointer"
                            onClick={() => {
                              setManualBookingForm({
                                ...manualBookingForm,
                                time: slot.time,
                              });
                              setShowManualBooking(true);
                            }}
                          >
                            <div className="font-medium text-green-800">
                              {formatTime(slot.time)}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );


  // Filtrar historial
  const getFilteredHistory = () => {
    let filtered = allBookings;

    if (searchTerm) {
      filtered = filtered.filter(
        (booking) => {
          const clientName = booking.client?.name || booking.name;
          const clientPhone = booking.client?.phone || booking.phone;
          return clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 clientPhone.includes(searchTerm);
        }
      );
    }

    if (dateFilter) {
      filtered = filtered.filter((booking) => booking.date === dateFilter);
    }

    return filtered.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare === 0) {
        return b.time.localeCompare(a.time);
      }
      return dateCompare;
    });
  };

  // Filtrar clientes
  const getFilteredClients = () => {
    if (searchTerm) {
      return clients.filter(
        (client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.phone.includes(searchTerm)
      );
    }
    return clients.sort((a, b) => {
      const aLastVisit = a.lastVisitDate || a.createdAt;
      const bLastVisit = b.lastVisitDate || b.createdAt;
      return bLastVisit.localeCompare(aLastVisit);
    });
  };


  // Estadísticas
  const getStats = () => {
    const totalBookings = allBookings.length;
    const uniqueClients = clients.length;
    const thisMonth = new Date()
      .toLocaleDateString("es-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
        year: "numeric",
        month: "2-digit",
      })
      .replace("/", "-")
      .slice(0, 7);
    const monthlyBookings = allBookings.filter((booking) =>
      booking.date.startsWith(thisMonth)
    ).length;

    // Horarios más populares
    const timeStats = allBookings.reduce((acc, booking) => {
      acc[booking.time] = (acc[booking.time] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const popularTimes = Object.entries(timeStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      totalBookings,
      uniqueClients,
      monthlyBookings,
      popularTimes,
    };
  };

  const stats = getStats();

  // Funciones para gestión de clientes
  const handleOpenAddClient = () => {
    setClientModalMode("add");
    setEditingClientIndex(null);
    setShowClientModal(true);
  };

  const handleOpenEditClient = (clientIndex: number) => {
    setClientModalMode("edit");
    setEditingClientIndex(clientIndex);
    setShowClientModal(true);
  };

  const handleCloseClientModal = () => {
    setShowClientModal(false);
    setEditingClientIndex(null);
  };

  const handleClientSubmit = async (clientData: { name: string; areaCode: string; phoneNumber: string }) => {
    // Evitar múltiples envíos
    if (isCreatingClient) {
      return;
    }

    setIsCreatingClient(true);

    const fullPhone = `+54 9 ${clientData.areaCode} ${clientData.phoneNumber}`;
    const normalizedPhone = fullPhone.replace(/\D/g, ''); // Remover todos los caracteres no numéricos
    const finalPhone = `+${normalizedPhone}`;
    
    console.log("🔍 handleClientSubmit llamado con:", { clientData, fullPhone, finalPhone, mode: clientModalMode });
    
    try {
      if (clientModalMode === "add") {
        console.log("📤 Enviando request para crear cliente...");
        const response = await clientService.createClient({
          name: clientData.name,
          phone: finalPhone,
        });

        console.log("📥 Respuesta del servidor:", response);

        if (response.success) {
          console.log("✅ Cliente creado exitosamente");
    showNotification("success", "Cliente agregado exitosamente");
          // Recargar clientes del backend
          await loadClients();
          handleCloseClientModal(); // Cerrar modal solo después del éxito
        } else {
          console.log("❌ Error del servidor:", response.error);
          showNotification("error", response.error || "Error al crear el cliente");
        }
      } else if (clientModalMode === "edit" && editingClientIndex !== null) {
        const client = getFilteredClients()[editingClientIndex];
        if (client && client.id) {
          console.log("📤 Enviando request para actualizar cliente...");
          const response = await clientService.updateClient(client.id, {
            name: clientData.name,
            phone: finalPhone,
          });

          console.log("📥 Respuesta del servidor:", response);

          if (response.success) {
            console.log("✅ Cliente actualizado exitosamente");
            showNotification("success", "Cliente actualizado exitosamente");
            // Recargar clientes del backend
            await loadClients();
            handleCloseClientModal(); // Cerrar modal solo después del éxito
          } else {
            console.log("❌ Error del servidor:", response.error);
            showNotification("error", response.error || "Error al actualizar el cliente");
          }
        }
      }
    } catch (error) {
      console.error("💥 Error en operación de cliente:", error);
      showNotification("error", "Error al procesar la solicitud");
    } finally {
      setIsCreatingClient(false);
    }
  };

  const handleDeleteClient = (clientIndex: number, client: any) => {
    setDeleteClientModal({
      isOpen: true,
      client,
      clientIndex,
    });
  };

  const confirmDeleteClient = async () => {
    if (!deleteClientModal.client || deleteClientModal.clientIndex === null) return;

    // Evitar múltiples envíos
    if (isDeletingClient) {
      return;
    }

    setIsDeletingClient(true);

    try {
      const response = await clientService.deleteClient(deleteClientModal.client.id);

      if (response.success) {
        showNotification("success", "Cliente eliminado exitosamente");
        // Recargar clientes del backend
        await loadClients();
      } else {
        showNotification("error", response.error || "Error al eliminar el cliente");
      }
    } catch (error) {
      console.error("Error eliminando cliente:", error);
      showNotification("error", "Error al eliminar el cliente");
    } finally {
      setIsDeletingClient(false);
      setDeleteClientModal({
        isOpen: false,
        client: null,
        clientIndex: null,
      });
    }
  };


  // Manejar actualización de configuración
  const handleConfigUpdate = async (newConfig: SalonConfig) => {
    try {
      // Actualizar configuración general
      const configResponse = await configService.updateConfig({
        slotDuration: newConfig.slotDuration,
        advanceBookingDays: newConfig.advanceBookingDays,
        salonName: newConfig.salonName || "Salón Invictus",
        timezone: newConfig.timezone || "America/Argentina/Buenos_Aires",
      });

      // Actualizar horarios de trabajo
      const workingHoursResponse = await configService.updateWorkingHours(
        newConfig.workingHours
      );

      if (configResponse.success && workingHoursResponse.success) {
        // Actualizar estado local
        updateSalonConfig(newConfig);
        showNotification("success", "Configuración actualizada exitosamente");
      } else {
        showNotification("error", "Error al actualizar la configuración");
      }
    } catch (error) {
      console.error("Error updating config:", error);
      showNotification("error", "Error al actualizar la configuración");
    }
  };

  const menuItems = [
    { id: "today", label: "Hoy", icon: Calendar },
    { id: "weekly", label: "Agenda Semanal", icon: Clock },
    { id: "history", label: "Historial", icon: History },
    { id: "clients", label: "Clientes", icon: Users },
    { id: "stats", label: "Estadísticas", icon: BarChart3 },
    { id: "config", label: "Configuración", icon: Settings },
  ];

  const renderSidebar = () => (
    <>
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed top-0 left-0 min-h-[100dvh] h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:shadow-none lg:border-r lg:border-gray-200 flex flex-col
      `}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-col">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-800">Admin Panel</h2>
                  <p className="text-xs text-gray-600">Salón Invictus</p>
                </div>
              </div>
              <div className="hidden items-center gap-4 justify-center py-2">
                {admin && (
                  <div className="text-sm text-gray-600">
                    Bienvenido, {admin.firstName}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="p-4 flex-1 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      updateCurrentView(item.id as AdminView);
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors
                      ${
                        currentView === item.id
                          ? "bg-blue-500 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Separador visual */}
        <div className="px-4 py-2">
          <div className="border-t border-gray-200"></div>
        </div>

        {/* Acciones del usuario */}
        <div className="mt-auto p-4 space-y-3">
          <Link
            to="/"
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Vista Cliente
          </Link>

          <button
            onClick={async () => {
              await logout();
              navigate("/admin/login");
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  );

  // Función para determinar si un día específico es laboral
  const isWorkingDay = (date: Date) => {
    if (!salonConfig?.workingHours) return false;
    
    const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    const workingDay = salonConfig.workingHours[dayOfWeek];
    
    return workingDay && workingDay.enabled;
  };

  // Función para determinar si hoy es un día laboral
  const isTodayWorkingDay = () => {
    return isWorkingDay(new Date());
  };

  const renderTodayView = () => {
    // Para la vista de hoy, siempre usar la fecha actual
    const todaySlots = getAvailableSlots(today);
    const todayAvailableSlots = todaySlots.filter((slot) => slot.available);
    const todayOccupiedSlots = todaySlots.filter((slot) => !slot.available);

    const getTodaySlotStatus = (time: string) => {
      const slot = todaySlots.find((s) => s.time === time);
      return slot;
    };

    // Si hoy no es un día laboral, mostrar mensaje de descanso
    if (!isTodayWorkingDay()) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 1v3M10 1v3M14 1v3" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              ¡Hoy no se trabaja!
            </h3>
            <p className="text-gray-600 text-lg mb-4">
              Aprovecha este día para descansar y recargar energías
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="grid gap-8">
        {/* Turnos de hoy */}

        {viewMode == "timeline" && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">
                Turnos de Hoy
              </h3>

              <div className="flex items-center gap-2 text-black-600">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">
                  {todayOccupiedSlots.length} turnos
                </span>
              </div>
            </div>
            <div className={`grid gap-4 items-start`}>
              <div className="space-y-1">
                {timelineHours.map((hourGroup) => (
                  <div
                    key={hourGroup.hour}
                    className="border-l-2 border-gray-200 pl-4 relative"
                  >
                    {/* Hour Label */}
                    <div className="hidden absolute -left-12 top-0 text-sm font-medium text-gray-500 w-10 text-right">
                      {hourGroup.hour}:00
                    </div>

                    {/* Time Slots for this hour */}
                    <div className="space-y-2 py-2">
                      {hourGroup.slots.map((timeSlot) => {
                        const slotData = getTodaySlotStatus(timeSlot.time);
                        const isOccupied = slotData && !slotData.available;

                        return (
                          <div
                            key={timeSlot.time}
                            className={`relative flex items-center min-h-[60px] rounded-lg border-2 transition-all duration-200 ${
                              isOccupied
                                ? "bg-blue-50 border-blue-200 hover:bg-blue-100"
                                : "bg-gray-50 border-gray-200 hover:bg-green-50 hover:border-green-300 cursor-pointer"
                            }`}
                            onClick={() => {
                              if (!isOccupied) {
                                setManualBookingForm({
                                  ...manualBookingForm,
                                  time: timeSlot.time,
                                });
                                setShowManualBooking(true);
                              }
                            }}
                          >
                            {/* Time Marker */}
                            <div
                              className={`absolute -left-6 w-3 h-3 rounded-full border-2 border-white ${
                                isOccupied ? "bg-blue-500" : "bg-gray-300"
                              }`}
                            ></div>

                            {/* Time Label */}
                            <div className="w-16 text-sm font-medium text-gray-600 pl-2">
                              {timeSlot.label}
                            </div>

                            {/* Content */}
                            <div className="flex-1 px-4">
                              {isOccupied ? (
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-semibold text-blue-800 flex items-center gap-2">
                                      <User className="w-4 h-4" />
                                      {slotData.clientName}
                                    </div>
                                    <div className="text-sm text-blue-600 flex items-center gap-2 mt-1">
                                      <Phone className="w-3 h-3" />
                                      {slotData.clientPhone}
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCancelBooking({
                                        date: todayString,
                                        time: timeSlot.time,
                                        name: slotData.clientName,
                                      });
                                    }}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Cancelar turno"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="text-gray-500 text-sm flex items-center gap-2">
                                  <Plus className="w-4 h-4" />
                                  Disponible - Click para agendar
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {viewMode == "cards" && (
          <div
            className={`grid ${
              viewMode == "cards" ? "lg:grid-cols-[auto_auto]" : ""
            } gap-4 items-start`}
          >
            {viewMode == "cards" && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Turnos de Hoy
                  </h3>
                  <div className="flex items-center gap-2 text-blue-600">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">
                      {todayOccupiedSlots.length} turnos
                    </span>
                  </div>
                </div>
                {todayOccupiedSlots.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">
                      No hay turnos para hoy
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayOccupiedSlots
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((slot, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-black-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-black-100 rounded-lg flex items-center justify-center">
                                <Clock className="w-6 h-6 text-black-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-800 text-lg">
                                  {formatTime(slot.time)}
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <User className="w-4 h-4" />
                                  <span>{slot.clientName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Phone className="w-4 h-4" />
                                  <span>{slot.clientPhone}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() =>
                                handleCancelBooking({
                                  date: todayString,
                                  time: slot.time,
                                  name: slot.clientName,
                                })
                              }
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Cancelar turno"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Available Slots & Manual Booking */}
            {viewMode == "cards" && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Horarios Disponibles
                  </h3>
                  {/* <button
                  onClick={() => setShowManualBooking(!showManualBooking)}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Agendar Manualmente
                </button> */}
                </div>

                {/* Available Slots Grid */}
                {todayAvailableSlots.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">
                      No hay horarios disponibles
                    </p>
                    {/* <p className="text-gray-400 text-sm">
                      Todos los turnos están ocupados
                    </p> */}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {todayAvailableSlots
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((slot) => (
                        <div
                          key={slot.time}
                          className="bg-green-50 border border-green-200 rounded-lg p-3 text-center hover:bg-green-100 transition-colors cursor-pointer"
                          onClick={() => {
                            setManualBookingForm({
                              ...manualBookingForm,
                              time: slot.time,
                            });
                            setShowManualBooking(true);
                          }}
                        >
                          <div className="font-medium text-green-800">
                            {formatTime(slot.time)}
                          </div>
                          <div className="text-xs text-green-600 mt-1">
                            Disponible
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderHistoryView = () => {
    const filteredHistory = getFilteredHistory();

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Historial de Turnos
          </h3>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
              />
            </div>
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
              />
            </div>
            {(searchTerm || dateFilter) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setDateFilter("");
                }}
                className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No se encontraron turnos</p>
            <p className="text-gray-400 text-sm">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredHistory.map((booking, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">
                        {booking.client?.name || booking.name}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-600">
                        <span>{formatDateShort(booking.date)}</span>
                        <span>{formatTime(booking.time)}</span>
                        <span>{booking.client?.phone || booking.phone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        booking.date === todayString
                          ? "bg-blue-100 text-blue-800"
                          : booking.date > todayString
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {booking.date === todayString
                        ? "Hoy"
                        : booking.date > todayString
                        ? "Próximo"
                        : "Completado"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderClientsView = () => {
    const filteredClients = getFilteredClients();

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Gestión de Clientes
          </h3>
          <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
            />
            </div>
            <button
              onClick={handleOpenAddClient}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Agregar Cliente
            </button>
          </div>
        </div>


        {filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No se encontraron clientes</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {client.name}
                      </h4>
                      <p className="text-sm text-gray-600">{client.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Total visitas:</span>
                    <span className="font-medium text-blue-600">
                      {client.totalBookings}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Última visita:</span>
                    <span>{formatDateShort(client.lastVisit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cliente desde:</span>
                    <span>{formatDateShort(client.firstVisit)}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSearchTerm(client.name);
                      updateCurrentView("history");
                    }}
                      className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                      Historial
                  </button>
            <button
                      onClick={() => handleOpenEditClient(index)}
                      className="bg-green-50 text-green-600 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClient(index, client)}
                      className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };



  const renderStatsView = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-black-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-black-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">
                {stats.totalBookings}
              </h3>
              <p className="text-gray-600">Total Turnos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">
                {stats.uniqueClients}
              </h3>
              <p className="text-gray-600">Clientes Únicos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">
                {stats.monthlyBookings}
              </h3>
              <p className="text-gray-600">Este Mes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">
                {Math.round(
                  (todayOccupiedSlots.length /
                    (todayOccupiedSlots.length + todayAvailableSlots.length)) *
                    100
                ) || 0}
                %
              </h3>
              <p className="text-gray-600">Ocupación Hoy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Times */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          Horarios Más Populares
        </h3>
        <div className="space-y-4">
          {stats.popularTimes.map(([time, count], index) => (
            <div key={time} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-black-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-medium text-black-600">
                    #{index + 1}
                  </span>
                </div>
                <span className="font-medium text-gray-800">
                  {formatTime(time)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-black h-2 rounded-full"
                    style={{
                      width: `${(count / stats.popularTimes[0][1]) * 100}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">
                  {count} turnos
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const handleWorkingHoursChange = (
    dayIndex: number,
    field: keyof WorkingHours,
    value: any
  ) => {
    console.log("Working hours change:", { dayIndex, field, value });
    const newWorkingHours = tempWorkingHours.map((wh, index) =>
      index === dayIndex ? { ...wh, [field]: value } : wh
    );
    setTempWorkingHours(newWorkingHours);
    setHasWorkingHoursChanges(true);
    console.log("hasWorkingHoursChanges set to true");
  };

  const handleSaveWorkingHours = async () => {
    try {
      const response = await configService.updateWorkingHours(tempWorkingHours);
      if (response.success) {
        // Actualizar estado local
        handleConfigUpdate({ ...salonConfig!, workingHours: tempWorkingHours });
        setHasWorkingHoursChanges(false);
        showNotification(
          "success",
          "Horarios de trabajo guardados exitosamente"
        );
      } else {
        showNotification("error", "Error al guardar los horarios");
      }
    } catch (error) {
      console.error("Error saving working hours:", error);
      showNotification("error", "Error al guardar los horarios");
    }
  };

  const handleCancelWorkingHours = () => {
    setTempWorkingHours([...salonConfig!.workingHours]);
    setHasWorkingHoursChanges(false);
  };

  const renderConfigView = () => {
    if (!salonConfig) return <div>Cargando configuración...</div>;

    const dayNames = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];

    return (
      <div className="space-y-6">
        {/* Working Hours */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">
            Horarios de Trabajo
          </h3>
          <div className="space-y-4">
            {tempWorkingHours.map((workingDay, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0 sm:w-32">
                  <input
                    type="checkbox"
                    checked={workingDay.enabled}
                    onChange={(e) =>
                      handleWorkingHoursChange(
                        index,
                        "enabled",
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-800">
                    {dayNames[workingDay.dayOfWeek]}
                  </span>
                </div>

                {workingDay.enabled && (
                  <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Inicio:</label>
                      <input
                        type="time"
                        value={workingDay.startTime}
                        onChange={(e) =>
                          handleWorkingHoursChange(
                            index,
                            "startTime",
                            e.target.value
                          )
                        }
                        className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Fin:</label>
                      <input
                        type="time"
                        value={workingDay.endTime}
                        onChange={(e) =>
                          handleWorkingHoursChange(
                            index,
                            "endTime",
                            e.target.value
                          )
                        }
                        className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="text-sm text-gray-600">Descanso:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={workingDay.breakStartTime || ""}
                          onChange={(e) =>
                            handleWorkingHoursChange(
                              index,
                              "breakStartTime",
                              e.target.value
                            )
                          }
                          className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
                          placeholder="Inicio"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                          type="time"
                          value={workingDay.breakEndTime || ""}
                          onChange={(e) =>
                            handleWorkingHoursChange(
                              index,
                              "breakEndTime",
                              e.target.value
                            )
                          }
                          className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
                          placeholder="Fin"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">
            Configuración General
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duración de cada turno (minutos)
              </label>
              <select
                value={salonConfig.slotDuration}
                onChange={(e) =>
                  handleConfigUpdate({
                    ...salonConfig,
                    slotDuration: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Días de anticipación para reservas
              </label>
              <select
                value={salonConfig.advanceBookingDays}
                onChange={(e) =>
                  handleConfigUpdate({
                    ...salonConfig,
                    advanceBookingDays: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={7}>7 días</option>
                <option value={14}>14 días</option>
                <option value={30}>30 días</option>
                <option value={60}>60 días</option>
              </select>
            </div>
          </div>
        </div>


        {/* Botones de acción */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Estado:{" "}
            {hasWorkingHoursChanges ? "Cambios pendientes" : "Sin cambios"}
          </div>
          {hasWorkingHoursChanges && (
            <>
              <button
                onClick={handleSaveWorkingHours}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Guardar Cambios
              </button>
              <button
                onClick={handleCancelWorkingHours}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </>
          )}
          <button
            onClick={() => setHasWorkingHoursChanges(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Forzar Cambios (Debug)
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex">
      {/* Sidebar */}
      {renderSidebar()}

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Notification */}
        {notification && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
              notification?.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification?.type === "success" ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{notification?.message}</span>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 max-h-[100dvh] overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Mobile Header with Menu Button */}
            <div className="lg:hidden mb-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Menu className="w-6 h-6 text-gray-700" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                    <Scissors className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-800">Admin Panel</h2>
                    <p className="text-xs text-gray-600">Salón Invictus</p>
                  </div>
                </div>
                <div className="w-10"></div> {/* Spacer for centering */}
              </div>
            </div>

            {/* Page Header */}
            {currentView === "today" && (
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      Agenda de Hoy
                    </h2>
                    <p className="text-gray-600 capitalize">
                      {formatDate(todayString)}
                    </p>
                  </div>
                  {/* View Mode Toggle */}
                  {/* <div className="flex items-center bg-gray-100 rounded-lg p-1 w-fit">
                    <button
                      onClick={() => setViewMode("cards")}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        viewMode === "cards"
                          ? "bg-white text-gray-800 shadow-sm"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Tarjetas
                    </button>
                    <button
                      onClick={() => setViewMode("timeline")}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        viewMode === "timeline"
                          ? "bg-white text-gray-800 shadow-sm"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Timeline
                    </button>
                  </div> */}
                  {/* Solo mostrar estadísticas si es un día laboral */}
                  {isTodayWorkingDay() && (
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {todayOccupiedSlots.length}
                        </div>
                        <div className="text-sm text-gray-600">Ocupados</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {todayAvailableSlots.length}
                        </div>
                        <div className="text-sm text-gray-600">Disponibles</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Content based on current view */}
            {currentView === "today" && renderTodayView()}
            {currentView === "weekly" && renderWeeklyView()}
            {currentView === "history" && renderHistoryView()}
            {currentView === "clients" && renderClientsView()}
            {currentView === "stats" && renderStatsView()}
            {currentView === "config" && renderConfigView()}
          </div>
        </main>
      </div>

      {/* Modal para Agendar Nuevo Turno */}
      {showManualBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                Agendar Nueva Turno
              </h3>
              <button
                onClick={() => setShowManualBooking(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleManualBooking} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  placeholder="Ingresa el nombre completo"
                  value={manualBookingForm.name}
                  onChange={(e) =>
                    setManualBookingForm({
                      ...manualBookingForm,
                      name: e.target.value,
                    })
                  }
                  disabled={isCreatingBooking}
                  className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                    isCreatingBooking
                      ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                      : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Teléfono
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <span className="bg-gray-100 text-gray-600 px-3 py-3 border border-r-0 border-gray-300 rounded-l-lg">
                      0
                    </span>
                <input
                      type="text"
                      placeholder="11"
                      value={manualBookingForm.areaCode}
                  onChange={(e) =>
                    setManualBookingForm({
                      ...manualBookingForm,
                          areaCode: e.target.value,
                    })
                  }
                  disabled={isCreatingBooking}
                      className={`w-24 px-3 py-3 border rounded-r-lg transition-colors ${
                        isCreatingBooking
                          ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                          : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                  required
                />
                  </div>
                  <div className="flex items-center">
                    <span className="bg-gray-100 text-gray-600 px-3 py-3 border border-r-0 border-gray-300 rounded-l-lg">
                      15
                    </span>
                    <input
                      type="text"
                      placeholder="1234-5678"
                      value={manualBookingForm.phoneNumber}
                      onChange={(e) =>
                        setManualBookingForm({
                          ...manualBookingForm,
                          phoneNumber: e.target.value,
                        })
                      }
                      disabled={isCreatingBooking}
                      className={`flex-1 px-3 py-3 border rounded-r-lg transition-colors ${
                        isCreatingBooking
                          ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                          : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horario Disponible
                </label>
                <select
                  value={manualBookingForm.time}
                  onChange={(e) =>
                    setManualBookingForm({
                      ...manualBookingForm,
                      time: e.target.value,
                    })
                  }
                  disabled={isCreatingBooking}
                  className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                    isCreatingBooking
                      ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                      : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  required
                >
                  <option value="">Seleccionar horario</option>
                  {(currentView === "today"
                    ? todayAvailableSlots
                    : availableSlots
                  ).map((slot) => (
                    <option key={slot.time} value={slot.time}>
                      {formatTime(slot.time)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 mt-4">
                <p className="text-blue-800 text-sm">
                  <strong>Fecha:</strong>{" "}
                  {formatDate(
                    currentView === "today" ? todayString : selectedDateString
                  )}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowManualBooking(false)}
                  disabled={isCreatingBooking}
                  className={`flex-1 py-3 px-4 rounded-lg transition-colors font-medium ${
                    isCreatingBooking
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingBooking}
                  className={`flex-1 py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 ${
                    isCreatingBooking
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isCreatingBooking ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creando...
                    </>
                  ) : (
                    "Confirmar Turno"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación para cancelar turnos */}
      <ConfirmModal
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ isOpen: false, booking: null })}
        onConfirm={confirmCancelBooking}
        title="Cancelar Turno"
        message={
          cancelModal.booking
            ? `¿Estás seguro de que quieres cancelar el turno de ${
                cancelModal.booking.name || "el cliente"
              } para el ${formatDate(
                cancelModal.booking.date
              )} a las ${formatTime(cancelModal.booking.time)}?`
            : "¿Estás seguro de que quieres cancelar este turno?"
        }
        confirmText="Sí, Cancelar"
        cancelText="No, Mantener"
        type="warning"
        isLoading={isCancelingBooking}
      />

      {/* Modal de confirmación para eliminar clientes */}
      <ConfirmModal
        isOpen={deleteClientModal.isOpen}
        onClose={() => setDeleteClientModal({ isOpen: false, client: null, clientIndex: null })}
        onConfirm={confirmDeleteClient}
        title="Eliminar Cliente"
        message={
          deleteClientModal.client
            ? `¿Estás seguro de que quieres eliminar permanentemente al cliente "${deleteClientModal.client.name}"?\n\nEsta acción no se puede deshacer y se eliminarán todos los datos asociados al cliente.`
            : ""
        }
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        type="error"
        isLoading={isDeletingClient}
      />

      {/* Client Modal */}
      <ClientModal
        isOpen={showClientModal}
        onClose={handleCloseClientModal}
        onSubmit={handleClientSubmit}
        client={editingClientIndex !== null ? getFilteredClients()[editingClientIndex] : null}
        mode={clientModalMode}
        isLoading={isCreatingClient}
      />
    </div>
  );
};

export default AdminPanel;
