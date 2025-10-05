import express from 'express';
import { z } from 'zod';
import { prisma } from '../server.js';
import { validateRequest } from '../middleware/validation.js';
import { validatePhoneFormat } from '../utils/phoneValidation.js';
// No necesitamos importar rate limiting específico aquí, el smartLimiter global se encarga

const router = express.Router();

// Esquemas de validación
const createClientSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 caracteres'),
  isRegular: z.boolean().optional().default(false)
}).refine((data) => {
  const phoneValidation = validatePhoneFormat(data.phone);
  return phoneValidation.isValid;
}, {
  message: "Formato de teléfono argentino inválido",
  path: ["phone"]
});

const updateClientSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  isRegular: z.boolean().optional()
}).refine((data) => {
  if (data.phone) {
    const phoneValidation = validatePhoneFormat(data.phone);
    return phoneValidation.isValid;
  }
  return true;
}, {
  message: "Formato de teléfono argentino inválido",
  path: ["phone"]
});

// GET /api/clients - Obtener todos los clientes
router.get('/', async (req, res) => {
  try {
    const { search, regular, limit = 100 } = req.query;
    
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ];
    }
    
    if (regular !== undefined) {
      where.isRegular = regular === 'true';
    }

    // Agregar filtro para excluir clientes eliminados
    where.isDeleted = false;
    
    const clients = await prisma.client.findMany({
      where,
      include: {
        bookings: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: { bookings: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    // Calcular estadísticas adicionales
    const clientsWithStats = clients.map(client => ({
      ...client,
      totalBookings: client._count.bookings,
      lastVisit: client.bookings[0]?.date || null,
      firstVisit: client.bookings[client.bookings.length - 1]?.date || client.createdAt.toISOString().split('T')[0]
    }));

    res.json({
      success: true,
      data: clientsWithStats,
      count: clientsWithStats.length
    });
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los clientes'
    });
  }
});

// GET /api/clients/:id - Obtener un cliente específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = parseInt(id, 10);
    
    // Validar que el ID es un número válido
    if (isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de cliente inválido'
      });
    }

    const client = await prisma.client.findFirst({
      where: { 
        id: clientId,
        isDeleted: false
      },
      include: {
        bookings: {
          orderBy: { date: 'desc' }
        },
        _count: {
          select: { bookings: true }
        }
      }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    const clientWithStats = {
      ...client,
      totalBookings: client._count.bookings,
      lastVisit: client.bookings[0]?.date || null,
      firstVisit: client.bookings[client.bookings.length - 1]?.date || client.createdAt.toISOString().split('T')[0]
    };

    res.json({
      success: true,
      data: clientWithStats
    });
  } catch (error) {
    console.error('Error obteniendo cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el cliente'
    });
  }
});

// POST /api/clients - Crear nuevo cliente
router.post('/', async (req, res) => {
  // Validación manual para mejor manejo de errores
  const validation = createClientSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: 'Datos de validación inválidos',
      details: validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
    });
  }
  try {
    const { name, phone, isRegular = false } = req.body;

    // Verificar si ya existe un cliente con ese teléfono
    const existingClient = await prisma.client.findUnique({
      where: { phone }
    });

    if (existingClient) {
      return res.status(409).json({
        success: false,
        error: 'Ya existe un cliente con ese número de teléfono'
      });
    }

    const client = await prisma.client.create({
      data: {
        name,
        phone,
        isRegular
      }
    });

    res.status(201).json({
      success: true,
      data: client,
      message: 'Cliente creado exitosamente'
    });
  } catch (error) {
    console.error('Error creando cliente:', error);
    
    // Manejar errores específicos de Prisma
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Ya existe un cliente con ese número de teléfono'
      });
    }
    
    // Error genérico con más detalles
    res.status(500).json({
      success: false,
      error: error.message || 'Error al crear el cliente',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// PUT /api/clients/:id - Actualizar cliente
router.put('/:id', async (req, res) => {
  // Validación manual para mejor manejo de errores
  const validation = updateClientSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: 'Datos de validación inválidos',
      details: validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
    });
  }
  
  try {
    const { id } = req.params;
    const clientId = parseInt(id, 10);
    
    // Validar que el ID es un número válido
    if (isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de cliente inválido'
      });
    }
    
    const updateData = req.body;

    // Verificar que el cliente existe y no está eliminado
    const existingClient = await prisma.client.findFirst({
      where: { 
        id: clientId,
        isDeleted: false
      }
    });

    if (!existingClient) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    // Si se está cambiando el teléfono, verificar que no exista otro cliente con ese número
    if (updateData.phone && updateData.phone !== existingClient.phone) {
      const phoneConflict = await prisma.client.findUnique({
        where: { phone: updateData.phone }
      });

      if (phoneConflict) {
        return res.status(409).json({
          success: false,
          error: 'Ya existe otro cliente con ese número de teléfono'
        });
      }
    }

    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: updateData
    });

    res.json({
      success: true,
      data: updatedClient,
      message: 'Cliente actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    
    // Manejar errores específicos de Prisma
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Ya existe otro cliente con ese número de teléfono'
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }
    
    // Error genérico con más detalles
    res.status(500).json({
      success: false,
      error: error.message || 'Error al actualizar el cliente',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// DELETE /api/clients/:id - Eliminar cliente
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = parseInt(id, 10);
    
    // Validar que el ID es un número válido
    if (isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de cliente inválido'
      });
    }

    const client = await prisma.client.findFirst({
      where: { 
        id: clientId,
        isDeleted: false
      },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    // Verificar si tiene reservas activas
    const activeBookings = await prisma.booking.count({
      where: {
        clientId: clientId,
        status: 'CONFIRMED',
        date: {
          gte: new Date().toISOString().split('T')[0]
        }
      }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar un cliente con reservas activas'
      });
    }

    // Soft delete: marcar como eliminado en lugar de eliminar físicamente
    await prisma.client.update({
      where: { id: clientId },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar el cliente'
    });
  }
});

// PUT /api/clients/:id/restore - Reactivar cliente eliminado
router.put('/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = parseInt(id, 10);
    
    // Validar que el ID es un número válido
    if (isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de cliente inválido'
      });
    }

    // Verificar que el cliente existe y está eliminado
    const client = await prisma.client.findFirst({
      where: { 
        id: clientId,
        isDeleted: true
      }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente eliminado no encontrado'
      });
    }

    // Reactivar el cliente
    const restoredClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        isDeleted: false,
        deletedAt: null
      }
    });

    res.json({
      success: true,
      data: restoredClient,
      message: 'Cliente reactivado exitosamente'
    });
  } catch (error) {
    console.error('Error reactivando cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error al reactivar el cliente'
    });
  }
});

// GET /api/clients/deleted - Obtener clientes eliminados
router.get('/deleted', async (req, res) => {
  try {
    const { search, limit = 100 } = req.query;
    
    const where = {
      isDeleted: true
    };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        bookings: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: { bookings: true }
        }
      },
      orderBy: { deletedAt: 'desc' },
      take: parseInt(limit)
    });

    // Calcular estadísticas adicionales
    const clientsWithStats = clients.map(client => ({
      ...client,
      totalBookings: client._count.bookings,
      lastVisit: client.bookings[0]?.date || null,
      firstVisit: client.bookings[client.bookings.length - 1]?.date || client.createdAt.toISOString().split('T')[0]
    }));

    res.json({
      success: true,
      data: clientsWithStats,
      count: clientsWithStats.length
    });
  } catch (error) {
    console.error('Error obteniendo clientes eliminados:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los clientes eliminados'
    });
  }
});

export default router;