import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Middleware para verificar el token JWT
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Token de acceso requerido',
      message: 'Debes iniciar sesión para acceder a este recurso'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Verificar que el admin existe y está activo
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId }
    });

    if (!admin || !admin.isActive) {
      return res.status(401).json({ 
        error: 'Token inválido',
        message: 'Tu sesión ha expirado o tu cuenta ha sido desactivada'
      });
    }

    // Agregar la información del admin al request
    req.admin = admin;
    next();
  } catch (error) {
    return res.status(403).json({ 
      error: 'Token inválido',
      message: 'Tu sesión ha expirado, por favor inicia sesión nuevamente'
    });
  }
};

// Middleware para verificar roles específicos
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ 
        error: 'No autorizado',
        message: 'Debes iniciar sesión para acceder a este recurso'
      });
    }

    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({ 
        error: 'Acceso denegado',
        message: 'No tienes permisos para acceder a este recurso'
      });
    }

    next();
  };
};
