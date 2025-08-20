// Configuración de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Tipos de respuesta
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Cliente HTTP personalizado
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Método genérico para hacer requests
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };

      // Agregar token de autenticación si existe
      const token = localStorage.getItem('admin-token');
      if (token) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`,
        };
      }

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}`);
      }

      // Convertir la respuesta del backend al formato esperado por el frontend
      return this.transformResponse(data);
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  // Transformar respuesta del backend al formato del frontend
  private transformResponse(data: any): ApiResponse<any> {
    // Si la respuesta ya tiene el formato correcto, devolverla tal como está
    if (data.success !== undefined) {
      return data;
    }

    // Transformar respuesta de login
    if (data.message === "Login exitoso" && data.admin && data.token) {
      return {
        success: true,
        data: {
          admin: data.admin,
          token: data.token
        },
        message: data.message
      };
    }

    // Transformar otras respuestas exitosas
    if (data.message && !data.error) {
      return {
        success: true,
        data: data,
        message: data.message
      };
    }

    // Respuesta por defecto
    return {
      success: true,
      data: data
    };
  }

  // GET request
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Instancia del cliente API
export const apiClient = new ApiClient(API_BASE_URL);

// Servicios específicos
export const authService = {
  // Login
  async login(credentials: { username: string; password: string }) {
    return apiClient.post<{ admin: any; token: string }>('/api/auth/login', credentials);
  },

  // Obtener admin actual
  async getCurrentAdmin() {
    return apiClient.get<{ admin: any }>('/api/auth/me');
  },

  // Logout
  async logout() {
    return apiClient.post('/api/auth/logout');
  },

  // Cambiar contraseña
  async changePassword(passwords: { currentPassword: string; newPassword: string }) {
    return apiClient.post('/api/auth/change-password', passwords);
  },
};

export const configService = {
  // Obtener configuración
  async getConfig() {
    return apiClient.get('/api/config');
  },

  // Actualizar configuración
  async updateConfig(config: any) {
    return apiClient.put('/api/config', config);
  },

  // Actualizar horarios
  async updateWorkingHours(workingHours: any[]) {
    return apiClient.put('/api/config/working-hours', { workingHours });
  },

  // Resetear configuración
  async resetConfig() {
    return apiClient.post('/api/config/reset');
  },
};

export const bookingService = {
  // Obtener reservas
  async getBookings() {
    return apiClient.get('/api/bookings');
  },

  // Crear reserva
  async createBooking(booking: any) {
    return apiClient.post('/api/bookings', booking);
  },

  // Actualizar reserva
  async updateBooking(id: number, booking: any) {
    return apiClient.put(`/api/bookings/${id}`, booking);
  },

  // Eliminar reserva
  async deleteBooking(id: number) {
    return apiClient.delete(`/api/bookings/${id}`);
  },
};

export const clientService = {
  // Obtener clientes
  async getClients() {
    return apiClient.get('/api/clients');
  },

  // Crear cliente
  async createClient(client: any) {
    return apiClient.post('/api/clients', client);
  },

  // Actualizar cliente
  async updateClient(id: number, client: any) {
    return apiClient.put(`/api/clients/${id}`, client);
  },

  // Eliminar cliente
  async deleteClient(id: number) {
    return apiClient.delete(`/api/clients/${id}`);
  },
};

export const activityService = {
  // Obtener logs del admin actual
  async getMyLogs(options?: any) {
    const params = new URLSearchParams(options).toString();
    return apiClient.get(`/api/activity/my-logs?${params}`);
  },

  // Obtener estadísticas
  async getStats(options?: any) {
    const params = new URLSearchParams(options).toString();
    return apiClient.get(`/api/activity/stats?${params}`);
  },
};

// Utilidades
export const setAuthToken = (token: string) => {
  localStorage.setItem('admin-token', token);
};

export const getAuthToken = () => {
  return localStorage.getItem('admin-token');
};

export const removeAuthToken = () => {
  localStorage.removeItem('admin-token');
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};
