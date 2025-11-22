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
  Check,
  X as XIcon,
  ChevronDown,
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
  BookingStatus,
} from "../types/booking";

// Componente para el logo de Google Calendar
const GoogleCalendarIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Estructura del calendario */}
    <rect
      x="4"
      y="5"
      width="16"
      height="14"
      rx="2"
      fill="#ffffff"
      stroke="#dadce0"
      strokeWidth="1"
    />
    {/* Espiral superior */}
    <path
      d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"
      fill="#4285F4"
    />
    {/* Líneas de la cuadrícula */}
    <line x1="8" y1="9" x2="8" y2="19" stroke="#dadce0" strokeWidth="0.5" />
    <line x1="12" y1="9" x2="12" y2="19" stroke="#dadce0" strokeWidth="0.5" />
    <line x1="16" y1="9" x2="16" y2="19" stroke="#dadce0" strokeWidth="0.5" />
    <line x1="4" y1="13" x2="20" y2="13" stroke="#dadce0" strokeWidth="0.5" />
    <line x1="4" y1="17" x2="20" y2="17" stroke="#dadce0" strokeWidth="0.5" />
    {/* Colores característicos de Google Calendar */}
    <rect x="6" y="11" width="2" height="1" fill="#34A853" />
    <rect x="10" y="11" width="2" height="1" fill="#FBBC04" />
    <rect x="14" y="11" width="2" height="1" fill="#EA4335" />
    <rect x="6" y="15" width="2" height="1" fill="#34A853" />
    <rect x="10" y="15" width="2" height="1" fill="#FBBC04" />
    <rect x="14" y="15" width="2" height="1" fill="#EA4335" />
  </svg>
);

// Componente para el logo de WhatsApp
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"
      fill="#25D366"
    />
  </svg>
);

interface AdminPanelProps {
  onBackToClient: () => void;
}

interface ManualBookingForm {
  name: string;
  areaCode: string;
  phoneNumber: string;
  time: string;
  selectedClientId?: string | null;
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
    updateBookingStatus,
    refreshBookings,
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
      selectedClientId: null,
    }
  );
  
  // Estados para búsqueda de cliente en modal de agendar
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [showNewClientFields, setShowNewClientFields] = useState(false);
  const [showClientSearchResults, setShowClientSearchResults] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  
  // Estado para polling de sincronización de Google Calendar
  const [pollingBookingId, setPollingBookingId] = useState<string | null>(null);
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
  
  // Estados separados para búsqueda en historial
  const [historySearchName, setHistorySearchName] = useState("");
  const [historySearchPhone, setHistorySearchPhone] = useState("");

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

  // Estados para carga masiva
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkImportFile, setBulkImportFile] = useState<File | null>(null);
  const [bulkImportPreview, setBulkImportPreview] = useState<any>(null);
  const [isProcessingBulkImport, setIsProcessingBulkImport] = useState(false);

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
    if (!dateString) return 'Sin fecha';
    
    try {
      const date = new Date(dateString + "T00:00:00");
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      return date.toLocaleDateString("es-AR");
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Función para obtener el booking completo por tiempo
  const getBookingByTime = (time: string) => {
    return selectedDateBookings.find(booking => booking.time === time);
  };

  // Función para determinar el estado de sincronización con Google Calendar
  const getCalendarSyncStatus = (booking: any) => {
    if (!booking || !booking.googleEventIds) {
      return { status: 'not_synced', icon: XIcon, color: 'text-red-500', tooltip: 'No sincronizado con Google Calendar' };
    }
    
    try {
      const eventIds = JSON.parse(booking.googleEventIds);
      if (Array.isArray(eventIds) && eventIds.length > 0) {
        return { status: 'synced', icon: Check, color: 'text-green-500', tooltip: 'Sincronizado con Google Calendar' };
      }
    } catch (error) {
      console.error('Error parsing googleEventIds:', error);
    }
    
    return { status: 'error', icon: XIcon, color: 'text-red-500', tooltip: 'Error en sincronización con Google Calendar' };
  };


  // Función para determinar si un cliente es nuevo (sin visitas completadas)
  const isNewClient = (client: any) => {
    // Un cliente es nuevo si no tiene visitas completadas
    return !client.lastVisitDate || client.completedBookings === 0;
  };

  // Función para determinar si un cliente requiere atención especial
  const clientRequiresAttention = (client: any) => {
    // Un cliente requiere atención si:
    // 1. Es nuevo (sin visitas completadas) Y
    // 2. Fue creado desde el formulario público Y
    // 3. NO ha sido verificado por un admin
    return isNewClient(client) && client.source === 'booking_form' && !client.isVerified;
  };

  // Función para determinar si un turno requiere atención especial
  // Solo resaltar turnos creados desde la vista cliente (booking_form) que sean de clientes nuevos
  const requiresAttention = (booking: any) => {
    // Si no hay booking, no requiere atención
    if (!booking) {
      return false;
    }
    
    // Solo aplicar a turnos creados desde el formulario público
    if (booking.source !== 'booking_form') {
      return false;
    }

    // Obtener el teléfono del booking (puede venir de booking.phone o booking.client?.phone)
    const bookingPhone = booking.phone || booking.client?.phone;
    if (!bookingPhone) {
      return false;
    }

    const client = clients.find(c => {
      // Comparar teléfonos normalizados (sin espacios, sin +, etc.)
      const clientPhoneClean = c.phone.replace(/\D/g, '');
      const bookingPhoneClean = bookingPhone.replace(/\D/g, '');
      return clientPhoneClean === bookingPhoneClean;
    });
    
    // Si no encontramos el cliente en la base de datos, es un cliente completamente nuevo
    if (!client) {
      return true;
    }

    // Si encontramos el cliente, verificar si requiere atención (nuevo Y no verificado)
    return clientRequiresAttention(client);
  };

  // Función para determinar el estado de WhatsApp de un turno específico
  const getWhatsAppStatus = (booking: BookingData | undefined) => {
    if (!booking || !booking.whatsappStatus) {
      // Si el turno fue creado desde el admin, mostrar "No enviado" en lugar de error
      const isFromAdmin = booking?.source === 'admin_panel';
      return { 
        status: isFromAdmin ? 'not_sent' : 'not_synced', 
        icon: XIcon, 
        color: 'text-gray-500', 
        tooltip: 'WhatsApp no enviado' 
      };
    }

    // Parsear whatsappStatus si viene como string JSON
    let whatsappData: any = null;
    try {
      if (typeof booking.whatsappStatus === 'string') {
        whatsappData = JSON.parse(booking.whatsappStatus);
      } else {
        whatsappData = booking.whatsappStatus;
      }
    } catch (e) {
      // Si no es JSON válido, tratar como string simple (compatibilidad con formato antiguo)
      const statusString = booking.whatsappStatus as string;
      switch (statusString) {
        case 'sent':
          return { status: 'synced', icon: Check, color: 'text-green-500', tooltip: 'WhatsApp enviado exitosamente' };
        case 'pending':
          return { status: 'not_synced', icon: Clock, color: 'text-yellow-500', tooltip: 'WhatsApp pendiente de envío' };
        case 'failed':
          // Si es de admin, mostrar como "no enviado" en lugar de error
          const isFromAdmin = booking?.source === 'admin_panel';
          return { 
            status: isFromAdmin ? 'not_sent' : 'error', 
            icon: XIcon, 
            color: 'text-gray-500', 
            tooltip: isFromAdmin ? 'WhatsApp no enviado (turno creado desde admin)' : 'Error al enviar WhatsApp' 
          };
        case 'not_sent':
          return { status: 'not_sent', icon: XIcon, color: 'text-gray-500', tooltip: 'WhatsApp no enviado' };
        default:
          return { status: 'not_synced', icon: XIcon, color: 'text-gray-500', tooltip: 'Estado desconocido' };
      }
    }

    // Si es un objeto con la estructura nueva
    if (whatsappData && typeof whatsappData === 'object') {
      if (whatsappData.success === true) {
        return { 
          status: 'synced', 
          icon: Check, 
          color: 'text-green-500', 
          tooltip: `WhatsApp enviado exitosamente${whatsappData.provider ? ` (${whatsappData.provider})` : ''}${whatsappData.messageId ? ` - ID: ${whatsappData.messageId}` : ''}` 
        };
      } else if (whatsappData.success === false) {
        // Si es de admin, mostrar como "no enviado" en lugar de error
        const isFromAdmin = booking?.source === 'admin_panel';
        const errorMessage = whatsappData.error || 'Error desconocido';
        const isNotConfigured = errorMessage.includes('no configurado') || errorMessage.includes('no enviado');
        
        if (isFromAdmin || isNotConfigured) {
          return { 
            status: 'not_sent', 
            icon: XIcon, 
            color: 'text-gray-500', 
            tooltip: 'WhatsApp no enviado' 
          };
        } else {
          return { 
            status: 'error', 
            icon: AlertCircle, 
            color: 'text-red-500', 
            tooltip: `Error al enviar WhatsApp: ${errorMessage}` 
          };
        }
      }
    }

    // Fallback
    return { status: 'not_synced', icon: XIcon, color: 'text-gray-500', tooltip: 'Estado desconocido' };
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

    // Establecer el estado de carga ANTES de cualquier operación asíncrona
    setIsCancelingBooking(true);
    console.log('🔄 Iniciando cancelación, isCancelingBooking:', true);

    // Pequeño delay para asegurar que React renderice el cambio de estado
    await new Promise(resolve => setTimeout(resolve, 100));

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
          // No cerrar el modal si hay error, para que el usuario vea el mensaje
        }
      } else {
        showNotification("error", "No se encontró la reserva para cancelar");
        // No cerrar el modal si hay error
      }
    } catch (error) {
      console.error("Error canceling booking:", error);
      showNotification("error", "Error al cancelar la reserva");
      // No cerrar el modal si hay error
    } finally {
      setIsCancelingBooking(false);
      console.log('✅ Finalizando cancelación, isCancelingBooking:', false);
    }
  };

  // Función para determinar si un turno ya pasó
  const isBookingPast = (booking: BookingData): boolean => {
    const bookingDateTime = new Date(`${booking.date}T${booking.time}:00`);
    const now = new Date();
    return bookingDateTime < now;
  };

  // Función para obtener información del estado de la reserva
  const getBookingStatusInfo = (status?: BookingStatus) => {
    // Normalizar el estado (backend puede enviar en mayúsculas)
    const normalizedStatus = status?.toLowerCase() as BookingStatus || 'confirmed';
    
    switch (normalizedStatus) {
      case 'confirmed':
        return { 
          label: 'Confirmada', 
          color: 'bg-blue-100 text-blue-800', 
          icon: CheckCircle 
        };
      case 'in_progress':
        return { 
          label: 'En Progreso', 
          color: 'bg-yellow-100 text-yellow-800', 
          icon: Clock 
        };
      case 'completed':
        return { 
          label: 'Completada', 
          color: 'bg-green-100 text-green-800', 
          icon: CheckCircle 
        };
      case 'cancelled':
        return { 
          label: 'Cancelada', 
          color: 'bg-red-100 text-red-800', 
          icon: X 
        };
      case 'no_show':
        return { 
          label: 'No se Presentó', 
          color: 'bg-gray-100 text-gray-800', 
          icon: AlertCircle 
        };
      default:
        return { 
          label: 'Confirmada', 
          color: 'bg-blue-100 text-blue-800', 
          icon: CheckCircle 
        };
    }
  };

  // Función para convertir estado a formato del backend
  const convertStatusToBackend = (status: BookingStatus): string => {
    const statusMap: Record<BookingStatus, string> = {
      'confirmed': 'CONFIRMED',
      'in_progress': 'IN_PROGRESS',
      'completed': 'COMPLETED',
      'cancelled': 'CANCELLED',
      'no_show': 'NO_SHOW'
    };
    return statusMap[status] || 'CONFIRMED';
  };

  // Función para cambiar el estado de una reserva
  const handleStatusChange = async (booking: BookingData, newStatus: BookingStatus) => {
    if (!booking.id) {
      showNotification("error", "No se puede cambiar el estado de esta reserva");
      return;
    }

    const backendStatus = convertStatusToBackend(newStatus);
    const success = await updateBookingStatus(booking.id, backendStatus);
    if (success) {
      const statusLabels = {
        confirmed: "confirmado",
        in_progress: "en progreso",
        completed: "completado",
        cancelled: "cancelado",
        no_show: "marcado como no se presentó"
      };
      
      showNotification(
        "success",
        `Turno de ${booking.client?.name || booking.name || 'el cliente'} ${statusLabels[newStatus]}`
      );
    } else {
      showNotification("error", "Error al cambiar el estado de la reserva");
    }
  };

  // Componente para menú unificado de acciones de reserva
  const BookingActionsMenu: React.FC<{ booking: BookingData; allowDelete?: boolean }> = ({ booking, allowDelete = true }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [isCanceling, setIsCanceling] = useState(false);
    const [dropdownUp, setDropdownUp] = useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);
    const isPast = isBookingPast(booking);
    // Normalizar el estado para las comparaciones
    const normalizedStatus = booking.status?.toLowerCase() as BookingStatus || 'confirmed';

    // Cerrar dropdown al hacer clic fuera
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    const handleAction = (action: string) => {
      switch (action) {
        case 'completed':
          handleStatusChange(booking, 'completed');
          break;
        case 'cancelled':
          setShowCancelConfirm(true);
          break;
        case 'no_show':
          handleStatusChange(booking, 'no_show');
          break;
        case 'delete':
          setShowDeleteConfirm(true);
          break;
      }
      setIsOpen(false);
    };

    const confirmDelete = () => {
      handleCancelBooking({
        date: booking.date,
        time: booking.time,
        name: booking.name,
        phone: booking.phone
      });
      setShowDeleteConfirm(false);
    };

    const confirmCancel = async () => {
      // Evitar múltiples envíos
      if (isCanceling) {
        return;
      }

      setIsCanceling(true);
      console.log('🔄 Iniciando cancelación desde modal inline, isCanceling:', true);

      try {
        await handleStatusChange(booking, 'cancelled');
        setShowCancelConfirm(false);
      } catch (error) {
        console.error('Error canceling booking:', error);
        showNotification("error", "Error al cancelar la reserva");
      } finally {
        setIsCanceling(false);
        console.log('✅ Finalizando cancelación desde modal inline, isCanceling:', false);
      }
    };

    // Determinar si hay acciones disponibles
    const hasActions = normalizedStatus === 'confirmed';
    const statusInfo = getBookingStatusInfo(booking.status);
    const StatusIcon = statusInfo.icon;

    return (
      <div className="relative" ref={menuRef}>
        {/* Mostrar estado siempre */}
        <div className="mb-2 px-1">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
            <StatusIcon className="w-3 h-3" />
            {statusInfo.label}
          </span>
        </div>

        {/* Mostrar botón de acciones solo si hay acciones disponibles */}
        {hasActions && (
          <button
            onClick={(e) => {
              // Detectar si el botón está cerca del borde inferior
              const button = e.currentTarget;
              const rect = button.getBoundingClientRect();
              const viewportHeight = window.innerHeight;
              const spaceBelow = viewportHeight - rect.bottom;
              const spaceAbove = rect.top;
              
              // Buscar el contenedor scrollable más cercano (puede tener overflow-y-auto o overflow-y-scroll)
              let scrollableContainer: HTMLElement | null = null;
              let currentElement: HTMLElement | null = button.parentElement;
              
              // Buscar hacia arriba en el DOM hasta encontrar un contenedor con scroll
              while (currentElement && !scrollableContainer) {
                const style = window.getComputedStyle(currentElement);
                const overflowY = style.overflowY;
                if (overflowY === 'auto' || overflowY === 'scroll') {
                  scrollableContainer = currentElement;
                  break;
                }
                currentElement = currentElement.parentElement;
              }
              
              // Si hay un contenedor scrollable, considerar su espacio también
              if (scrollableContainer) {
                const containerRect = scrollableContainer.getBoundingClientRect();
                const containerSpaceBelow = containerRect.bottom - rect.bottom;
                const containerSpaceAbove = rect.top - containerRect.top;
                
                // Estimar altura del dropdown (aproximadamente 150px)
                const dropdownHeight = 150;
                
                // Si hay menos espacio abajo que la altura del dropdown y hay más espacio arriba, abrir hacia arriba
                if (containerSpaceBelow < dropdownHeight && containerSpaceAbove > dropdownHeight) {
                  setDropdownUp(true);
                } else if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
                  // Fallback: usar el viewport si el contenedor no es relevante
                  setDropdownUp(true);
                } else {
                  setDropdownUp(false);
                }
              } else {
                // Sin contenedor scrollable, usar solo el viewport
                const dropdownHeight = 150;
                if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
                  setDropdownUp(true);
                } else {
                  setDropdownUp(false);
                }
              }
              
              setIsOpen(!isOpen);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
          >
            <Settings className="w-4 h-4" />
            Acciones
            <ChevronDown className="w-3 h-3" />
          </button>
        )}

        {isOpen && (
          <div className={`absolute ${dropdownUp ? 'bottom-full mb-1' : 'top-full mt-1'} right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[220px]`}>
            <div className="py-1">
              {/* Acciones de estado */}
              <div className="py-1">
                {/* Si está confirmado, mostrar opciones según contexto */}
                {normalizedStatus === 'confirmed' && (
                  <>
                    {/* En historial: solo completada y no_show */}
                    {isPast && (
                      <>
                        <button
                          onClick={() => handleAction('completed')}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-green-50 transition-colors text-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">Marcar como Completada</span>
                        </button>
                        <button
                          onClick={() => handleAction('no_show')}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors text-gray-700"
                        >
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">No se Presentó</span>
                        </button>
                      </>
                    )}
                    
                    {/* En Hoy/Agenda: solo cancelar */}
                    {!isPast && (
                      <button
                        onClick={() => handleAction('cancelled')}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-red-50 transition-colors text-red-700"
                      >
                        <X className="w-4 h-4" />
                        <span className="text-sm">Cancelar Turno</span>
                      </button>
                    )}
                  </>
                )}

                {/* Si ya está completada, cancelada o no_show, no mostrar acciones de estado */}
                {normalizedStatus !== 'confirmed' && (
                  <div className="px-3 py-2 text-sm text-gray-500 text-center">
                    Estado final - Sin acciones disponibles
                  </div>
                )}
              </div>

              {/* Separador */}
              <div className="border-t border-gray-100 my-1"></div>

              {/* Acción destructiva */}
              {allowDelete && (
                <button
                  onClick={() => handleAction('delete')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-red-50 transition-colors text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">Eliminar Reserva</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal de confirmación para eliminar */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Eliminar Reserva
                  </h3>
                  <p className="text-sm text-gray-600">
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">
                  <strong>Cliente:</strong> {booking.client?.name || booking.name}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Fecha:</strong> {formatDate(booking.date)}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Hora:</strong> {formatTime(booking.time)}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación para cancelar */}
        {showCancelConfirm && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={(e) => {
              // Prevenir cierre si está cargando
              if (!isCanceling && e.target === e.currentTarget) {
                setShowCancelConfirm(false);
              }
            }}
          >
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <X className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Cancelar Turno
                  </h3>
                  <p className="text-sm text-gray-600">
                    El turno quedará marcado como cancelado
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">
                  <strong>Cliente:</strong> {booking.client?.name || booking.name || 'el cliente'}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Fecha:</strong> {formatDate(booking.date)}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Hora:</strong> {formatTime(booking.time)}
                </p>
              </div>

              <div className="space-y-4">

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (!isCanceling) {
                        setShowCancelConfirm(false);
                      }
                    }}
                    disabled={isCanceling}
                    className={`flex-1 py-2 px-4 rounded-lg transition-colors font-medium ${
                      isCanceling
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    No Cancelar
                  </button>
                  <button
                    onClick={confirmCancel}
                    disabled={isCanceling}
                    className={`flex-1 py-2 px-4 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 ${
                      isCanceling
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-orange-600 text-white hover:bg-orange-700"
                    }`}
                  >
                    {isCanceling ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Cancelando...
                      </>
                    ) : (
                      "Sí, Cancelar"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación diferente según si hay cliente seleccionado o es nuevo
    if (manualBookingForm.selectedClientId) {
      // Cliente existente seleccionado
      if (!manualBookingForm.time) {
        showNotification("error", "Por favor selecciona un horario");
        return;
      }
    } else {
      // Nuevo cliente - validar todos los campos
      if (
        !manualBookingForm.name ||
        !manualBookingForm.areaCode ||
        !manualBookingForm.phoneNumber ||
        !manualBookingForm.time
      ) {
        showNotification("error", "Por favor completa todos los campos");
        return;
      }
    }

    // Evitar múltiples envíos
    if (isCreatingBooking) {
      return;
    }

    setIsCreatingBooking(true);

    let finalPhone: string;
    
    if (manualBookingForm.selectedClientId) {
      // Usar teléfono del cliente seleccionado
      const selectedClient = clients.find(c => c.id === manualBookingForm.selectedClientId);
      if (!selectedClient) {
        showNotification("error", "Cliente no encontrado");
        setIsCreatingBooking(false);
        return;
      }
      finalPhone = selectedClient.phone;
    } else {
      // Formatear el teléfono completo y normalizarlo
      const fullPhone = `+54 9 ${manualBookingForm.areaCode} ${manualBookingForm.phoneNumber}`;
      const normalizedPhone = fullPhone.replace(/\D/g, ''); // Remover todos los caracteres no numéricos
      finalPhone = `+${normalizedPhone}`;
    }

    const bookingData: BookingData = {
      name: manualBookingForm.name,
      phone: finalPhone,
      date: currentView === "today" ? todayString : selectedDateString,
      time: manualBookingForm.time,
      status: 'confirmed' as BookingStatus,
      source: 'admin_panel', // Indicar que viene del admin panel
      sourceDetails: 'Turno creado desde panel de administración'
    };

    try {
      // Enviar al backend
      const response = await bookingService.createBooking(bookingData);

      if (response.success) {
        // Actualizar el estado local con la nueva reserva
        if (response.data) {
          const newBooking = response.data as BookingData;
          setBookings((prev) => [...prev, newBooking]);
          
          // Si el booking no tiene googleEventIds, iniciar polling
          if (!(newBooking as any).googleEventIds && newBooking.id) {
            setPollingBookingId(String(newBooking.id));
          }
        }

        // Recargar clientes para actualizar estadísticas
        await loadClients();
        
        // Recargar clientes para actualizar estadísticas, pero mantener la vista actual
        setTimeout(() => {
          loadClients();
        }, 500);

        const clientMessage = manualBookingForm.selectedClientId 
          ? `Turno agendado para ${manualBookingForm.name} a las ${manualBookingForm.time}.`
          : `Turno agendado para ${manualBookingForm.name} a las ${manualBookingForm.time}. Cliente agregado automáticamente.`;

        showNotification("success", clientMessage);
        
        // Resetear formulario
        setManualBookingForm({ name: "", areaCode: "", phoneNumber: "", time: "", selectedClientId: null });
        setClientSearchQuery("");
        setShowNewClientFields(false);
        setShowClientSearchResults(false);
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

  // Filtrar clientes para búsqueda en modal de agendar
  const getFilteredClientsForBooking = () => {
    if (!clientSearchQuery.trim()) {
      return [];
    }
    const query = clientSearchQuery.toLowerCase().trim();
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        client.phone.includes(query)
    ).slice(0, 5); // Limitar a 5 resultados
  };

  // Seleccionar cliente del resultado de búsqueda
  const handleSelectClient = (client: any) => {
    setManualBookingForm({
      ...manualBookingForm,
      name: client.name,
      selectedClientId: client.id,
      // No necesitamos areaCode ni phoneNumber si es cliente existente
    });
    setClientSearchQuery(client.name);
    setShowClientSearchResults(false);
    setShowNewClientFields(false);
  };

  // Manejar cambio en búsqueda de cliente
  const handleClientSearchChange = (value: string) => {
    setClientSearchQuery(value);
    
    // Si hay texto, mostrar resultados
    if (value.trim()) {
      setShowClientSearchResults(true);
      setShowNewClientFields(false);
    } else {
      setShowClientSearchResults(false);
      // Si limpió el campo, resetear cliente seleccionado
      setManualBookingForm({
        ...manualBookingForm,
        selectedClientId: null,
        name: "",
      });
    }
  };

  // Resetear formulario cuando se cierra el modal
  const handleCloseManualBooking = () => {
    setShowManualBooking(false);
    setManualBookingForm({ name: "", areaCode: "", phoneNumber: "", time: "", selectedClientId: null });
    setClientSearchQuery("");
    setShowNewClientFields(false);
    setShowClientSearchResults(false);
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

  // Refrescar datos cuando cambia la vista
  React.useEffect(() => {
    const refreshData = async () => {
      console.log(`🔄 Refrescando datos para la vista: ${currentView}`);
      
      // Refrescar bookings
      try {
        await refreshBookings();
        console.log('✅ Bookings refrescados');
      } catch (error) {
        console.error('❌ Error refrescando bookings:', error);
      }

      // Refrescar clientes (especialmente importante para las vistas de clientes, stats, etc.)
      if (currentView === 'clients' || currentView === 'stats' || currentView === 'history') {
        try {
          await loadClients();
          console.log('✅ Clientes refrescados');
        } catch (error) {
          console.error('❌ Error refrescando clientes:', error);
        }
      }
    };

    // Solo refrescar si el componente ya está montado (evitar doble carga inicial)
    if (currentView) {
      refreshData();
    }
  }, [currentView]);

  // Polling para verificar sincronización con Google Calendar
  React.useEffect(() => {
    if (!pollingBookingId) return;

    let pollCount = 0;
    const maxPolls = 10; // Máximo 10 intentos (10 segundos)
    const pollInterval = 1000; // Cada 1 segundo

    const pollSyncStatus = async () => {
      try {
        // Obtener todos los bookings para encontrar el actualizado
        const response = await bookingService.getBookings();
        
        if (response.success && response.data) {
          const bookings = Array.isArray(response.data) ? response.data : [];
          const updatedBooking = bookings.find((b: BookingData) => String(b.id) === pollingBookingId);
          
          if (updatedBooking && (updatedBooking as any).googleEventIds) {
            // Booking sincronizado, actualizar en el estado
            setBookings((prev) =>
              prev.map((b) => (String(b.id) === pollingBookingId ? updatedBooking : b))
            );
            setPollingBookingId(null); // Detener polling
            return;
          }
        }

        pollCount++;
        if (pollCount >= maxPolls) {
          // Detener polling después de max intentos
          setPollingBookingId(null);
        }
      } catch (error) {
        console.error("Error polling sync status:", error);
        setPollingBookingId(null); // Detener polling en caso de error
      }
    };

    // Iniciar polling inmediatamente y luego cada intervalo
    pollSyncStatus();
    const intervalId = setInterval(pollSyncStatus, pollInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [pollingBookingId]);

  const availableSlots = selectedDateSlots.filter((slot) => slot.available);
  // Filtrar turnos ocupados para mostrar solo los que no han pasado
  const occupiedSlots = selectedDateSlots.filter((slot) => {
    if (slot.available) return false;
    
    // Buscar el booking correspondiente
    const booking = allBookings.find(b => b.date === selectedDateString && b.time === slot.time);
    if (!booking) return false;
    
    // Solo mostrar si no ha pasado la hora
    return !isBookingPast(booking);
  });
  
  // Obtener bookings completos para la fecha seleccionada
  const selectedDateBookings = allBookings.filter(booking => booking.date === selectedDateString);

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
      {/* Loading while config is not ready to avoid false "Descanso" */}
      {!salonConfig ? (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Cargando agenda semanal...
            </h3>
            <p className="text-gray-600 text-lg">
              Obteniendo configuración y turnos
            </p>
          </div>
        </div>
      ) : null}
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
                                    {(() => {
                                      const booking = allBookings.find(b => b.date === selectedDateString && b.time === timeSlot.time);
                                      const client = clients.find(c => c.phone === slotData.clientPhone);
                                      
                                      if (requiresAttention(booking)) {
                                        return (
                                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                                            ⚠️ VERIFICAR
                                          </span>
                                        );
                                      }
                                      
                                      if (client && clientRequiresAttention(client)) {
                                        return (
                                          <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                                            ⚠️ REQUIERE ATENCIÓN
                                          </span>
                                        );
                                      }
                                      
                                      return null;
                                    })()}
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
                    ¡No se trabaja!
                  </h3>
                  <p className="text-gray-600 text-lg mb-4">
                    Aprovecha este día para descansar
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
                                    {(() => {
                                      const booking = allBookings.find(b => b.date === selectedDateString && b.time === slot.time);
                                      const client = clients.find(c => c.phone === slot.clientPhone);
                                      
                                      if (requiresAttention(booking)) {
                                        return (
                                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                                            ⚠️ VERIFICAR
                                          </span>
                                        );
                                      }
                                      
                                      if (client && clientRequiresAttention(client)) {
                                        return (
                                          <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                                            ⚠️ REQUIERE ATENCIÓN
                                          </span>
                                        );
                                      }
                                      
                                      return null;
                                    })()}
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Phone className="w-4 h-4" />
                                    <span>{slot.clientPhone}</span>
                                  </div>
                                  {/* Indicador de sincronización con Google Calendar */}
                                  {(() => {
                                    const booking = getBookingByTime(slot.time);
                                    const syncStatus = getCalendarSyncStatus(booking);
                                    const IconComponent = syncStatus.icon;
                                    return (
                                      <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-gray-600">
                                          <GoogleCalendarIcon className="w-4 h-4" />
                                          <div className="flex items-center gap-1">
                                            <IconComponent className={`w-4 h-4 ${syncStatus.color}`} />
                                            <span className="text-xs text-gray-500">
                                              {syncStatus.status === 'synced' ? 'Sincronizado' : 
                                               syncStatus.status === 'not_synced' ? 'No sincronizado' : 'Error'}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                          <WhatsAppIcon className="w-4 h-4" />
                                        <div className="flex items-center gap-1">
                                          {(() => {
                                            const whatsappStatus = getWhatsAppStatus(booking);
                                            const WhatsAppIconComponent = whatsappStatus.icon;
                                            return (
                                              <>
                                                <WhatsAppIconComponent className={`w-4 h-4 ${whatsappStatus.color}`} />
                                                <span className="text-xs text-gray-500">
                                                  {whatsappStatus.status === 'synced' ? 'Enviado' : 
                                                   whatsappStatus.status === 'not_synced' ? 'Pendiente' : 
                                                   whatsappStatus.status === 'not_sent' ? 'No enviado' : 'Error'}
                                                </span>
                                              </>
                                            );
                                          })()}
                                        </div>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Menú unificado de acciones */}
                                {(() => {
                                  const booking = allBookings.find(b => b.date === selectedDateString && b.time === slot.time);
                                  return booking ? (
                                    <BookingActionsMenu booking={booking} allowDelete={false} />
                                  ) : null;
                                })()}
                              </div>
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

    // Filtrar por nombre
    if (historySearchName) {
      filtered = filtered.filter((booking) => {
        const clientName = booking.client?.name || booking.name || "";
        return clientName.toLowerCase().includes(historySearchName.toLowerCase());
      });
    }

    // Filtrar por teléfono
    if (historySearchPhone) {
      filtered = filtered.filter((booking) => {
        const clientPhone = booking.client?.phone || booking.phone || "";
        return clientPhone.includes(historySearchPhone);
      });
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

    // Contar turnos por estado
    const cancelledBookings = allBookings.filter(
      (booking) => booking.status?.toLowerCase() === 'cancelled'
    ).length;
    const completedBookings = allBookings.filter(
      (booking) => booking.status?.toLowerCase() === 'completed'
    ).length;
    const confirmedBookings = allBookings.filter(
      (booking) => booking.status?.toLowerCase() === 'confirmed'
    ).length;
    const noShowBookings = allBookings.filter(
      (booking) => booking.status?.toLowerCase() === 'no_show'
    ).length;

    // Horarios más populares (excluyendo cancelados y no_show)
    const timeStats = allBookings
      .filter((booking) => {
        const status = booking.status?.toLowerCase();
        return status !== 'cancelled' && status !== 'no_show';
      })
      .reduce((acc, booking) => {
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
      cancelledBookings,
      completedBookings,
      confirmedBookings,
      noShowBookings,
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

  // Funciones para carga masiva
  const handleOpenBulkImport = () => {
    setShowBulkImportModal(true);
    setBulkImportFile(null);
    setBulkImportPreview(null);
  };

  const handleCloseBulkImport = () => {
    setShowBulkImportModal(false);
    setBulkImportFile(null);
    setBulkImportPreview(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBulkImportFile(file);
      // Aquí podrías agregar una función para hacer preview del archivo
    }
  };

  const handleBulkImport = async () => {
    if (!bulkImportFile) return;

    setIsProcessingBulkImport(true);
    try {
      const result = await clientService.bulkImportClients(bulkImportFile);

      if (result.success) {
        setNotification({
          type: 'success',
          message: result.message || 'Clientes importados exitosamente'
        });
        handleCloseBulkImport();
        // Recargar la lista de clientes
        loadClients();
      } else {
        if (result.preview) {
          // Mostrar preview de errores
          setBulkImportPreview(result.preview);
        } else {
          setNotification({
            type: 'error',
            message: result.error || 'Error al importar clientes'
          });
        }
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Error al procesar el archivo'
      });
    } finally {
      setIsProcessingBulkImport(false);
    }
  };

  const handleClientSubmit = async (clientData: { name: string; areaCode: string; phoneNumber: string; isVerified?: boolean }) => {
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
          source: 'admin_panel' // Marcar que viene del admin para que se verifique automáticamente
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
          const updateData: { name: string; phone: string; isVerified?: boolean } = {
            name: clientData.name,
            phone: finalPhone,
          };

          // Si se envió isVerified, incluirlo en la actualización
          if (clientData.isVerified !== undefined) {
            updateData.isVerified = clientData.isVerified;
          }

          const response = await clientService.updateClient(client.id, updateData);

          console.log("📥 Respuesta del servidor:", response);

          if (response.success) {
            console.log("✅ Cliente actualizado exitosamente");
            const message = clientData.isVerified !== undefined && clientData.isVerified
              ? "Cliente actualizado y verificado exitosamente"
              : "Cliente actualizado exitosamente";
            showNotification("success", message);
            // Recargar clientes del backend para actualizar el estado
            await loadClients();
            // Forzar re-render del componente esperando un tick
            await new Promise(resolve => setTimeout(resolve, 100));
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
    // Filtrar turnos ocupados para mostrar solo los que no han pasado
    const todayOccupiedSlots = todaySlots.filter((slot) => {
      if (slot.available) return false;
      
      // Buscar el booking correspondiente
      const booking = allBookings.find(b => b.date === todayString && b.time === slot.time);
      if (!booking) return false;
      
      // Solo mostrar si no ha pasado la hora
      return !isBookingPast(booking);
    });

    const getTodaySlotStatus = (time: string) => {
      const slot = todaySlots.find((s) => s.time === time);
      return slot;
    };

    // Si los datos aún no están cargados, mostrar loading
    if (!salonConfig) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Cargando agenda...
            </h3>
            <p className="text-gray-600 text-lg">
              Obteniendo información de turnos
            </p>
          </div>
        </div>
      );
    }

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
              Aprovecha este día para descansar
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
                                      {(() => {
                                        const booking = allBookings.find(b => b.date === todayString && b.time === timeSlot.time);
                                        const client = clients.find(c => c.phone === slotData.clientPhone);
                                        
                                        if (requiresAttention(booking)) {
                                          return (
                                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                                              ⚠️ VERIFICAR
                                            </span>
                                          );
                                        }
                                        
                                        if (client && clientRequiresAttention(client)) {
                                          return (
                                            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                                              ⚠️ REQUIERE ATENCIÓN
                                            </span>
                                          );
                                        }
                                        
                                        return null;
                                      })()}
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
                                  {(() => {
                                    const booking = allBookings.find(b => b.date === todayString && b.time === slot.time);
                                    const client = clients.find(c => c.phone === slot.clientPhone);
                                    
                                    if (requiresAttention(booking)) {
                                      return (
                                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                                          ⚠️ VERIFICAR
                                        </span>
                                      );
                                    }
                                    
                                    if (client && clientRequiresAttention(client)) {
                                      return (
                                        <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                                          ⚠️ REQUIERE ATENCIÓN
                                        </span>
                                      );
                                    }
                                    
                                    return null;
                                  })()}
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Phone className="w-4 h-4" />
                                  <span>{slot.clientPhone}</span>
                                </div>
                                {/* Indicador de sincronización con Google Calendar */}
                                {(() => {
                                  const booking = allBookings.find(b => b.date === todayString && b.time === slot.time);
                                  const syncStatus = getCalendarSyncStatus(booking);
                                  const IconComponent = syncStatus.icon;
                                  return (
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-2 text-gray-600">
                                        <GoogleCalendarIcon className="w-4 h-4" />
                                        <div className="flex items-center gap-1">
                                          <IconComponent className={`w-4 h-4 ${syncStatus.color}`} />
                                          <span className="text-xs text-gray-500">
                                            {syncStatus.status === 'synced' ? 'Sincronizado' : 
                                             syncStatus.status === 'not_synced' ? 'No sincronizado' : 'Error'}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 text-gray-600">
                                        <WhatsAppIcon className="w-4 h-4" />
                                        <div className="flex items-center gap-1">
                                          {(() => {
                                            const whatsappStatus = getWhatsAppStatus(booking);
                                            const WhatsAppIconComponent = whatsappStatus.icon;
                                            return (
                                              <>
                                                <WhatsAppIconComponent className={`w-4 h-4 ${whatsappStatus.color}`} />
                                                <span className="text-xs text-gray-500">
                                                  {whatsappStatus.status === 'synced' ? 'Enviado' : 
                                                   whatsappStatus.status === 'not_synced' ? 'Pendiente' : 
                                                   whatsappStatus.status === 'not_sent' ? 'No enviado' : 'Error'}
                                                </span>
                                              </>
                                            );
                                          })()}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Menú unificado de acciones */}
                              {(() => {
                                const booking = allBookings.find(b => b.date === todayString && b.time === slot.time);
                                return booking ? (
                                  <BookingActionsMenu booking={booking} allowDelete={false} />
                                ) : null;
                              })()}
                            </div>
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
      <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col" style={{ maxHeight: 'calc(100vh - 75px)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-800">
            Historial de Turnos
          </h3>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={historySearchName}
                onChange={(e) => setHistorySearchName(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
              />
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por teléfono..."
                value={historySearchPhone}
                onChange={(e) => setHistorySearchPhone(e.target.value)}
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
            {(historySearchName || historySearchPhone || dateFilter) && (
              <button
                onClick={() => {
                  setHistorySearchName("");
                  setHistorySearchPhone("");
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
          <div className="space-y-3 overflow-y-auto pb-2 flex-1 min-h-0">
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
                      <div className="font-semibold text-gray-800 flex items-center gap-2">
                        {booking.client?.name || booking.name}
                        {(() => {
                          const client = clients.find(c => c.phone === (booking.client?.phone || booking.phone));
                          return client && clientRequiresAttention(client) ? (
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                              ⚠️ REQUIERE ATENCIÓN
                            </span>
                          ) : null;
                        })()}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-600">
                        <span>{formatDateShort(booking.date)}</span>
                        <span>{formatTime(booking.time)}</span>
                        <span>{booking.client?.phone || booking.phone}</span>
                        {/* Indicador de sincronización con Google Calendar */}
                        {(() => {
                          const syncStatus = getCalendarSyncStatus(booking);
                          const IconComponent = syncStatus.icon;
                          return (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <GoogleCalendarIcon className="w-4 h-4" />
                                <IconComponent className={`w-4 h-4 ${syncStatus.color}`} />
                                <span className="text-xs text-gray-500">
                                  {syncStatus.status === 'synced' ? 'Sincronizado' : 
                                   syncStatus.status === 'not_synced' ? 'No sincronizado' : 'Error'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <WhatsAppIcon className="w-4 h-4" />
                                {(() => {
                                  const whatsappStatus = getWhatsAppStatus(booking);
                                  const WhatsAppIconComponent = whatsappStatus.icon;
                                  return (
                                    <>
                                      <WhatsAppIconComponent className={`w-4 h-4 ${whatsappStatus.color}`} />
                                      <span className="text-xs text-gray-500">
                                        {whatsappStatus.status === 'synced' ? 'Enviado' : 
                                         whatsappStatus.status === 'not_synced' ? 'Pendiente' : 'Error'}
                                      </span>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    {/* Mostrar siempre el componente, internamente decide si mostrar el botón */}
                    <BookingActionsMenu booking={booking} allowDelete={false} />
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
            <button
              onClick={handleOpenBulkImport}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Carga Masiva
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
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                        {client.name}
                        {clientRequiresAttention(client) && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                            ⚠️ REQUIERE ATENCIÓN
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600">{client.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Total turnos:</span>
                    <span className="font-medium text-blue-600">
                      {client.totalBookings}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Visitas completadas:</span>
                    <span className="font-medium text-green-600">
                      {client.completedBookings || 0}
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
                  <div className="flex justify-between">
                    <span>Origen:</span>
                    <span className="font-medium">
                      {client.source === 'manual' && 'Manual'}
                      {client.source === 'booking_form' && 'Formulario'}
                      {client.source === 'bulk_import' && 'Carga Masiva'}
                      {client.source === 'admin_panel' && 'Panel Admin'}
                    </span>
                  </div>
                  {client.sourceDetails && (
                    <div className="flex justify-between">
                      <span>Detalles:</span>
                      <span className="text-xs text-gray-500 max-w-32 truncate" title={client.sourceDetails}>
                        {client.sourceDetails}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Pre-llenar ambos campos de búsqueda con nombre y teléfono
                      setHistorySearchName(client.name);
                      setHistorySearchPhone(client.phone);
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

      {/* Estadísticas de Estados */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">
                {stats.completedBookings}
              </h3>
              <p className="text-gray-600">Completados</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">
                {stats.confirmedBookings}
              </h3>
              <p className="text-gray-600">Confirmados</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">
                {stats.cancelledBookings}
              </h3>
              <p className="text-gray-600">Cancelados</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">
                {stats.noShowBookings}
              </h3>
              <p className="text-gray-600">No se Presentó</p>
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
                onClick={handleCloseManualBooking}
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
              {/* Mostrar cliente seleccionado */}
              {manualBookingForm.selectedClientId ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800">{manualBookingForm.name}</div>
                      <div className="text-sm text-gray-600">
                        {clients.find(c => c.id === manualBookingForm.selectedClientId)?.phone}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setManualBookingForm({
                          ...manualBookingForm,
                          selectedClientId: null,
                          name: "",
                        });
                        setClientSearchQuery("");
                        setShowNewClientFields(false);
                        setShowClientSearchResults(false);
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Cambiar
                    </button>
                  </div>
                </div>
              ) : showNewClientFields ? (
                /* Campos para nuevo cliente */
                <>
                  <div className="flex items-center justify-between mb-2">
                  
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewClientFields(false);
                        setClientSearchQuery("");
                        setManualBookingForm({
                          ...manualBookingForm,
                          name: "",
                          areaCode: "",
                          phoneNumber: "",
                        });
                      }}
                      className="flex gap-2 items-center text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Search className="w-4 h-4" />
                      Buscar cliente existente
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Cliente *
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
                      Número de Teléfono *
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
                </>
              ) : (
                /* Búsqueda de Cliente */
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar Cliente
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o teléfono..."
                      value={clientSearchQuery}
                      onChange={(e) => handleClientSearchChange(e.target.value)}
                      disabled={isCreatingBooking}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-colors ${
                        isCreatingBooking
                          ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                          : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                    />
                  </div>

                  {/* Resultados de búsqueda */}
                  {showClientSearchResults && clientSearchQuery.trim() && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {getFilteredClientsForBooking().length > 0 ? (
                        getFilteredClientsForBooking().map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => handleSelectClient(client)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-800">{client.name}</div>
                            <div className="text-sm text-gray-600">{client.phone}</div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3">
                          <div className="text-sm text-gray-600 mb-2">No se encontraron clientes</div>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewClientFields(true);
                              setShowClientSearchResults(false);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            + Nuevo Cliente
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Botón para nuevo cliente cuando no hay búsqueda activa */}
                  {!clientSearchQuery.trim() && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewClientFields(true);
                          setShowClientSearchResults(false);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        <UserPlus className="w-4 h-4" />
                        Nuevo Cliente
                      </button>
                    </div>
                  )}
                </div>
              )}

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
                  onClick={handleCloseManualBooking}
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
        clientRequiresAttention={clientRequiresAttention}
      />

      {/* Modal de Carga Masiva */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Carga Masiva de Clientes</h3>
              <button
                onClick={handleCloseBulkImport}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar archivo (CSV o Excel)
                </label>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  El archivo debe tener las columnas: "Nombre" y "Teléfono"
                </p>
              </div>

              {bulkImportFile && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Archivo seleccionado:</strong> {bulkImportFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Tamaño: {(bulkImportFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}

              {bulkImportPreview && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Preview de Importación</h4>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <p>Total de filas: {bulkImportPreview.totalRows}</p>
                    <p>Válidos: {bulkImportPreview.valid}</p>
                    <p>Inválidos: {bulkImportPreview.invalid}</p>
                    <p>Duplicados: {bulkImportPreview.duplicates}</p>
                  </div>
                  
                  {bulkImportPreview.invalidClients && bulkImportPreview.invalidClients.length > 0 && (
                    <div className="mt-3">
                      <p className="font-medium text-red-700">Clientes con errores:</p>
                      <ul className="text-sm text-red-600 list-disc list-inside">
                        {bulkImportPreview.invalidClients.slice(0, 5).map((client: any, index: number) => (
                          <li key={index}>
                            {client.name} - {client.phone} ({client.error})
                          </li>
                        ))}
                        {bulkImportPreview.invalidClients.length > 5 && (
                          <li>... y {bulkImportPreview.invalidClients.length - 5} más</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {bulkImportPreview.duplicateClients && bulkImportPreview.duplicateClients.length > 0 && (
                    <div className="mt-3">
                      <p className="font-medium text-orange-700">Clientes duplicados:</p>
                      <ul className="text-sm text-orange-600 list-disc list-inside">
                        {bulkImportPreview.duplicateClients.slice(0, 5).map((client: any, index: number) => (
                          <li key={index}>
                            <strong>{client.name}</strong> - {client.message}
                          </li>
                        ))}
                        {bulkImportPreview.duplicateClients.length > 5 && (
                          <li>... y {bulkImportPreview.duplicateClients.length - 5} más</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseBulkImport}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleBulkImport}
                  disabled={!bulkImportFile || isProcessingBulkImport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isProcessingBulkImport ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      Importar Clientes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
