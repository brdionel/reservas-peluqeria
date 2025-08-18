import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Tipos de acciones disponibles
export const ACTION_TYPES = {
  // Autenticación
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  
  // Gestión de reservas
  BOOKING_CREATE: 'BOOKING_CREATE',
  BOOKING_UPDATE: 'BOOKING_UPDATE',
  BOOKING_DELETE: 'BOOKING_DELETE',
  BOOKING_STATUS_CHANGE: 'BOOKING_STATUS_CHANGE',
  
  // Gestión de clientes
  CLIENT_CREATE: 'CLIENT_CREATE',
  CLIENT_UPDATE: 'CLIENT_UPDATE',
  CLIENT_DELETE: 'CLIENT_DELETE',
  
  // Configuración del salón
  CONFIG_UPDATE: 'CONFIG_UPDATE',
  CONFIG_RESET: 'CONFIG_RESET',
  
  // Horarios de trabajo
  WORKING_HOURS_UPDATE: 'WORKING_HOURS_UPDATE',
  
  // Gestión de admins
  ADMIN_CREATE: 'ADMIN_CREATE',
  ADMIN_UPDATE: 'ADMIN_UPDATE',
  ADMIN_DELETE: 'ADMIN_DELETE',
  ADMIN_STATUS_CHANGE: 'ADMIN_STATUS_CHANGE'
};

// Tipos de entidades
export const ENTITY_TYPES = {
  BOOKING: 'booking',
  CLIENT: 'client',
  CONFIG: 'config',
  WORKING_HOURS: 'working_hours',
  ADMIN: 'admin'
};

/**
 * Registra una actividad del admin
 * @param {Object} params - Parámetros del log
 * @param {number} params.adminId - ID del admin
 * @param {string} params.action - Tipo de acción (de ACTION_TYPES)
 * @param {string} params.entityType - Tipo de entidad (de ENTITY_TYPES)
 * @param {number} params.entityId - ID de la entidad (opcional)
 * @param {string} params.description - Descripción de la acción
 * @param {Object} params.oldValues - Valores anteriores (opcional)
 * @param {Object} params.newValues - Valores nuevos (opcional)
 * @param {string} params.ipAddress - IP del cliente (opcional)
 * @param {string} params.userAgent - User agent del cliente (opcional)
 */
export const logActivity = async ({
  adminId,
  action,
  entityType,
  entityId = null,
  description,
  oldValues = null,
  newValues = null,
  ipAddress = null,
  userAgent = null
}) => {
  try {
    await prisma.adminActivityLog.create({
      data: {
        adminId,
        action,
        entityType,
        entityId,
        description,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        ipAddress,
        userAgent
      }
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    // No lanzamos el error para no interrumpir el flujo principal
  }
};

/**
 * Obtiene los logs de actividad de un admin específico
 * @param {number} adminId - ID del admin
 * @param {Object} options - Opciones de paginación y filtros
 * @param {number} options.page - Página (por defecto 1)
 * @param {number} options.limit - Límite por página (por defecto 50)
 * @param {string} options.action - Filtrar por tipo de acción
 * @param {string} options.entityType - Filtrar por tipo de entidad
 * @param {Date} options.startDate - Fecha de inicio
 * @param {Date} options.endDate - Fecha de fin
 */
export const getAdminActivityLogs = async (adminId, options = {}) => {
  const {
    page = 1,
    limit = 50,
    action,
    entityType,
    startDate,
    endDate
  } = options;

  const skip = (page - 1) * limit;

  // Construir filtros
  const where = { adminId };

  if (action) where.action = action;
  if (entityType) where.entityType = entityType;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  try {
    const [logs, total] = await Promise.all([
      prisma.adminActivityLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.adminActivityLog.count({ where })
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error getting activity logs:', error);
    throw error;
  }
};

/**
 * Obtiene todos los logs de actividad (para super admins)
 * @param {Object} options - Opciones de paginación y filtros
 */
export const getAllActivityLogs = async (options = {}) => {
  const {
    page = 1,
    limit = 50,
    adminId,
    action,
    entityType,
    startDate,
    endDate
  } = options;

  const skip = (page - 1) * limit;

  // Construir filtros
  const where = {};

  if (adminId) where.adminId = adminId;
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  try {
    const [logs, total] = await Promise.all([
      prisma.adminActivityLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.adminActivityLog.count({ where })
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error getting all activity logs:', error);
    throw error;
  }
};

/**
 * Obtiene estadísticas de actividad
 * @param {number} adminId - ID del admin (opcional, si no se proporciona se obtienen todas)
 * @param {Date} startDate - Fecha de inicio
 * @param {Date} endDate - Fecha de fin
 */
export const getActivityStats = async (adminId = null, startDate = null, endDate = null) => {
  try {
    const where = {};
    if (adminId) where.adminId = adminId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [totalActions, actionsByType, actionsByEntity] = await Promise.all([
      // Total de acciones
      prisma.adminActivityLog.count({ where }),
      
      // Acciones por tipo
      prisma.adminActivityLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true }
      }),
      
      // Acciones por entidad
      prisma.adminActivityLog.groupBy({
        by: ['entityType'],
        where,
        _count: { entityType: true }
      })
    ]);

    return {
      totalActions,
      actionsByType: actionsByType.map(item => ({
        action: item.action,
        count: item._count.action
      })),
      actionsByEntity: actionsByEntity.map(item => ({
        entityType: item.entityType,
        count: item._count.entityType
      }))
    };
  } catch (error) {
    console.error('Error getting activity stats:', error);
    throw error;
  }
};
