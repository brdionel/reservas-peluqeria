export type BookingStatus = 
  | 'confirmed'    // Confirmada por el cliente
  | 'in_progress'   // Cliente está en el salón
  | 'completed'     // Servicio terminado
  | 'cancelled'     // Cancelada
  | 'no_show';     // Cliente no se presentó

export interface WhatsAppStatus {
  success: boolean;
  messageId?: string | null;
  provider?: string | null;
  sentAt?: string | null;
  error?: string | null;
}

export interface BookingData {
  id?: number;
  name: string;
  phone: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  status: BookingStatus; // Estado de la reserva
  whatsappStatus?: string | WhatsAppStatus; // Puede ser string JSON o objeto parseado
  source?: 'booking_form' | 'admin_panel'; // Origen del turno
  sourceDetails?: string; // Detalles del origen
  client?: {
    id: number;
    name: string;
    phone: string;
    isRegular: boolean;
  };
}

export interface TimeSlot {
  time: string;
  available: boolean;
  clientName?: string;
  clientPhone?: string;
}

export interface Client {
  name: string;
  phone: string;
  totalBookings: number;
  lastVisit: string;
  firstVisit: string;
  isRegular: boolean;
}

export interface WorkingHours {
  id?: number;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  enabled: boolean;
  startTime: string;
  endTime: string;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
  createdAt?: string;
  updatedAt?: string;
  updatedById?: number | null;
}

export interface SalonConfig {
  id?: number;
  workingHours: WorkingHours[];
  slotDuration: number; // minutes
  advanceBookingDays: number;
  salonName?: string;
  timezone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Admin {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  role: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  admin: Admin;
  token: string;
}

export interface AdminActivityLog {
  id: number;
  adminId: number;
  action: string;
  entityType: string;
  entityId?: number;
  description: string;
  oldValues?: string;
  newValues?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  admin?: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
  };
}

export interface ActivityLogsResponse {
  logs: AdminActivityLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ActivityStats {
  totalActions: number;
  actionsByType: Array<{
    action: string;
    count: number;
  }>;
  actionsByEntity: Array<{
    entityType: string;
    count: number;
  }>;
}