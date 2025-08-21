import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import { logActivity, ACTION_TYPES, ENTITY_TYPES } from '../services/activityLogger.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/auth/login - Iniciar sesión
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validar campos requeridos
    if (!username || !password) {
      return res.status(400).json({
        error: 'Campos requeridos',
        message: 'Username y password son requeridos'
      });
    }

    // Buscar admin por username
    const admin = await prisma.admin.findUnique({
      where: { username }
    });

    if (!admin) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Username o password incorrectos'
      });
    }

    // Verificar si el admin está activo
    if (!admin.isActive) {
      return res.status(401).json({
        error: 'Cuenta desactivada',
        message: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
      });
    }

    // Verificar password
    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Username o password incorrectos'
      });
    }

    // Actualizar último login
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() }
    });

    // Generar token JWT
    const token = jwt.sign(
      { 
        adminId: admin.id, 
        username: admin.username,
        role: admin.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Log de actividad
    await logActivity({
      adminId: admin.id,
      action: ACTION_TYPES.LOGIN,
      entityType: ENTITY_TYPES.ADMIN,
      entityId: admin.id,
      description: `Admin ${admin.username} inició sesión`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Enviar respuesta sin password
    const { passwordHash, ...adminWithoutPassword } = admin;

    res.json({
      message: 'Login exitoso',
      admin: adminWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al procesar tu solicitud'
    });
  }
});

// GET /api/auth/me - Obtener información del admin actual
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { passwordHash, ...adminWithoutPassword } = req.admin;
    
    res.json({
      admin: adminWithoutPassword
    });
  } catch (error) {
    console.error('Error al obtener admin:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al procesar tu solicitud'
    });
  }
});

// POST /api/auth/logout - Cerrar sesión (opcional, el frontend puede manejar esto)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Log de actividad
    await logActivity({
      adminId: req.admin.id,
      action: ACTION_TYPES.LOGOUT,
      entityType: ENTITY_TYPES.ADMIN,
      entityId: req.admin.id,
      description: `Admin ${req.admin.username} cerró sesión`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // En una implementación más robusta, podrías invalidar el token
    // Por ahora, solo enviamos una respuesta exitosa
    res.json({
      message: 'Logout exitoso'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al procesar tu solicitud'
    });
  }
});

// POST /api/auth/change-password - Cambiar contraseña
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validar campos requeridos
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Campos requeridos',
        message: 'Current password y new password son requeridos'
      });
    }

    // Verificar password actual
    const isValidPassword = await bcrypt.compare(currentPassword, req.admin.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Password incorrecto',
        message: 'El password actual es incorrecto'
      });
    }

    // Hash del nuevo password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Actualizar password
    await prisma.admin.update({
      where: { id: req.admin.id },
      data: { passwordHash: newPasswordHash }
    });

    // Log de actividad
    await logActivity({
      adminId: req.admin.id,
      action: ACTION_TYPES.PASSWORD_CHANGE,
      entityType: ENTITY_TYPES.ADMIN,
      entityId: req.admin.id,
      description: `Admin ${req.admin.username} cambió su contraseña`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Password actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error al cambiar password:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al procesar tu solicitud'
    });
  }
});

export default router;
