import { useState, useEffect } from 'react';
import { authService, setAuthToken, getAuthToken, removeAuthToken, isAuthenticated } from '../services/api';

interface Admin {
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

interface AuthState {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    admin: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Verificar autenticación al cargar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setAuthState({
          admin: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        return;
      }

      const response = await authService.getCurrentAdmin();
      if (response.success && response.data?.admin) {
        setAuthState({
          admin: response.data.admin,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        // Token inválido, limpiar
        logout();
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      logout();
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await authService.login({ username, password });
      
      console.log('Login response:', response); // Debug
      
      if (response.success && response.data) {
        const { admin, token } = response.data;
        setAuthToken(token);
        
        setAuthState({
          admin,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        return { success: true };
      } else {
        const errorMessage = response.error || response.message || 'Error de autenticación';
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      // Intentar hacer logout en el servidor
      await authService.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Limpiar estado local
      removeAuthToken();
      setAuthState({
        admin: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await authService.changePassword({ currentPassword, newPassword });
      
      if (response.success) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { success: true };
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Error al cambiar contraseña',
        }));
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  return {
    ...authState,
    login,
    logout,
    changePassword,
    clearError,
    checkAuth,
  };
};
