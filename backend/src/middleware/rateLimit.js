import rateLimit from 'express-rate-limit';

// Rate limiter general para toda la aplicación
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // máximo 500 requests por IP (más permisivo para clientes)
  message: {
    success: false,
    error: 'Demasiadas solicitudes',
    message: 'Has excedido el límite de solicitudes. Intenta nuevamente en 15 minutos.'
  },
  standardHeaders: true, // Retorna rate limit info en headers
  legacyHeaders: false, // No usar headers legacy
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Demasiadas solicitudes',
      message: 'Has excedido el límite de solicitudes. Intenta nuevamente en 15 minutos.'
    });
  }
});

// Rate limiter más permisivo para autenticación
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // máximo 20 intentos de login por IP (más permisivo)
  message: {
    success: false,
    error: 'Demasiados intentos de login',
    message: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Demasiados intentos de login',
      message: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.'
    });
  }
});

// Rate limiter para creación de reservas (más permisivo para clientes)
export const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 15, // máximo 15 reservas por IP por hora (más permisivo)
  message: {
    success: false,
    error: 'Demasiadas reservas',
    message: 'Has excedido el límite de reservas. Intenta nuevamente en 1 hora.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Demasiadas reservas',
      message: 'Has excedido el límite de reservas. Intenta nuevamente en 1 hora.'
    });
  }
});

// Rate limiter para endpoints de configuración (admin)
export const configLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // máximo 200 requests por IP (muy permisivo para admin)
  message: {
    success: false,
    error: 'Demasiadas solicitudes de configuración',
    message: 'Has excedido el límite de solicitudes de configuración.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Demasiadas solicitudes de configuración',
      message: 'Has excedido el límite de solicitudes de configuración.'
    });
  }
});

// Rate limiter para endpoints de sincronización
export const syncLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 20, // máximo 20 requests de sincronización por IP (más permisivo)
  message: {
    success: false,
    error: 'Demasiadas solicitudes de sincronización',
    message: 'Has excedido el límite de solicitudes de sincronización.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Demasiadas solicitudes de sincronización',
      message: 'Has excedido el límite de solicitudes de sincronización.'
    });
  }
});

// Rate limiter especial para admins (muy permisivo)
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // máximo 1000 requests por IP para admins (muy permisivo)
  message: {
    success: false,
    error: 'Demasiadas solicitudes de administrador',
    message: 'Has excedido el límite de solicitudes de administrador.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Demasiadas solicitudes de administrador',
      message: 'Has excedido el límite de solicitudes de administrador.'
    });
  }
});

// Rate limiter para clientes (más permisivo)
export const clientLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300, // máximo 300 requests por IP para clientes (más permisivo)
  message: {
    success: false,
    error: 'Demasiadas solicitudes',
    message: 'Has excedido el límite de solicitudes. Intenta nuevamente en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Demasiadas solicitudes',
      message: 'Has excedido el límite de solicitudes. Intenta nuevamente en 15 minutos.'
    });
  }
});

// Middleware inteligente que detecta si es admin y aplica diferentes límites
export const smartLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: (req) => {
    // Si tiene token de admin, límite muy alto
    const token = req.headers['authorization'];
    if (token && token.startsWith('Bearer ')) {
      return 1000; // Admin: 1000 requests
    }
    return 300; // Cliente: 300 requests (más permisivo)
  },
  message: {
    success: false,
    error: 'Demasiadas solicitudes',
    message: 'Has excedido el límite de solicitudes. Intenta nuevamente en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const token = req.headers['authorization'];
    if (token && token.startsWith('Bearer ')) {
      res.status(429).json({
        success: false,
        error: 'Demasiadas solicitudes de administrador',
        message: 'Has excedido el límite de solicitudes de administrador.'
      });
    } else {
      res.status(429).json({
        success: false,
        error: 'Demasiadas solicitudes',
        message: 'Has excedido el límite de solicitudes. Intenta nuevamente en 15 minutos.'
      });
    }
  }
});
