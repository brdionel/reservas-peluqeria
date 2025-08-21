import express from 'express';
import { z } from 'zod';
import { prisma } from '../server.js';
import { validateRequest } from '../middleware/validation.js';
// No necesitamos importar rate limiting específico aquí, el smartLimiter global se encarga

const router = express.Router();

// Esquemas de validación
const createClientSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().min(8, 'El teléfono debe tener al menos 8 caracteres'),
  email: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional()
});

const updateClientSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(8).optional(),
  email: z.string().email().optional().or(z.literal('')),
  isRegular: z.boolean().optional(),
  notes: z.string().optional()
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

    const client = await prisma.client.findUnique({
      where: { id },
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
router.post('/', validateRequest(createClientSchema), async (req, res) => {
  try {
    const { name, phone, email, notes } = req.body;

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
        email: email || null,
        notes,
        isRegular: false
      }
    });

    res.status(201).json({
      success: true,
      data: client,
      message: 'Cliente creado exitosamente'
    });
  } catch (error) {
    console.error('Error creando cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear el cliente'
    });
  }
});

// PUT /api/clients/:id - Actualizar cliente
router.put('/:id', validateRequest(updateClientSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verificar que el cliente existe
    const existingClient = await prisma.client.findUnique({
      where: { id }
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
      where: { id },
      data: {
        ...updateData,
        email: updateData.email === '' ? null : updateData.email
      }
    });

    res.json({
      success: true,
      data: updatedClient,
      message: 'Cliente actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el cliente'
    });
  }
});

// DELETE /api/clients/:id - Eliminar cliente
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const client = await prisma.client.findUnique({
      where: { id },
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
        clientId: id,
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

    await prisma.client.delete({
      where: { id }
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

export default router;