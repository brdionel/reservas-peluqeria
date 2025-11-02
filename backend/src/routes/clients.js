import express from 'express';
import { z } from 'zod';
import { prisma } from '../server.js';
import { validateRequest } from '../middleware/validation.js';
import { validatePhoneFormat } from '../utils/phoneValidation.js';

// Función para normalizar números de teléfono para comparación
const normalizePhoneForComparison = (phone) => {
  if (!phone) return '';
  
  // Remover todos los caracteres no numéricos
  const numbersOnly = phone.replace(/\D/g, '');
  
  // Si empieza con 54, mantenerlo
  if (numbersOnly.startsWith('54')) {
    return numbersOnly;
  }
  
  // Si empieza con 9, agregar 54
  if (numbersOnly.startsWith('9')) {
    return '54' + numbersOnly;
  }
  
  // Si empieza con 15, reemplazar con 9 y agregar 54
  if (numbersOnly.startsWith('15')) {
    return '549' + numbersOnly.substring(2);
  }
  
  // Si empieza con 0, remover el 0 y agregar 549
  if (numbersOnly.startsWith('0')) {
    return '549' + numbersOnly.substring(1);
  }
  
  // Para otros casos, agregar 549
  return '549' + numbersOnly;
};

// Función para normalizar números de teléfono al formato estándar (+549...)
const normalizePhoneToStandard = (phone) => {
  if (!phone) return '';
  
  // Remover todos los caracteres no numéricos
  const numbersOnly = phone.replace(/\D/g, '');
  
  // Si empieza con 54, agregar +
  if (numbersOnly.startsWith('54')) {
    return '+' + numbersOnly;
  }
  
  // Si empieza con 9, agregar +54
  if (numbersOnly.startsWith('9')) {
    return '+54' + numbersOnly;
  }
  
  // Si empieza con 15, reemplazar con 9 y agregar +54
  if (numbersOnly.startsWith('15')) {
    return '+549' + numbersOnly.substring(2);
  }
  
  // Si empieza con 0, remover el 0 y agregar +549
  if (numbersOnly.startsWith('0')) {
    return '+549' + numbersOnly.substring(1);
  }
  
  // Para otros casos, agregar +549
  return '+549' + numbersOnly;
};
import multer from 'multer';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import { Readable } from 'stream';
// No necesitamos importar rate limiting específico aquí, el smartLimiter global se encarga

const router = express.Router();

// Configuración de multer para carga de archivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se permiten archivos CSV y Excel.'), false);
    }
  }
});

// Esquemas de validación
const createClientSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 caracteres'),
  isRegular: z.boolean().optional().default(false),
  source: z.enum(['manual', 'booking_form', 'bulk_import', 'admin_panel']).optional().default('manual'),
  sourceDetails: z.string().optional()
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
  isRegular: z.boolean().optional(),
  isVerified: z.boolean().optional()
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
    const clientsWithStats = clients.map(client => {
      const today = new Date().toISOString().split('T')[0];
      
      // Filtrar solo turnos completados (estado 'completed' y fechas pasadas)
      const completedBookings = client.bookings.filter(booking => 
        booking.date < today && booking.status === 'COMPLETED'
      );
      
      return {
        ...client,
        totalBookings: client._count.bookings, // Total incluye futuros
        completedBookings: completedBookings.length, // Solo completados
        lastVisit: completedBookings[0]?.date || null, // Última visita real
        firstVisit: completedBookings[completedBookings.length - 1]?.date || client.createdAt.toISOString().split('T')[0]
      };
    });

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

    const today = new Date().toISOString().split('T')[0];
    
    // Filtrar solo turnos completados (estado 'completed' y fechas pasadas)
    const completedBookings = client.bookings.filter(booking => 
      booking.date < today && booking.status === 'COMPLETED'
    );

    const clientWithStats = {
      ...client,
      totalBookings: client._count.bookings,
      completedBookings: completedBookings.length,
      lastVisit: completedBookings[0]?.date || null,
      firstVisit: completedBookings[completedBookings.length - 1]?.date || client.createdAt.toISOString().split('T')[0]
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
    const { name, phone, isRegular = false, source = 'manual', sourceDetails } = req.body;

    // Normalizar el teléfono al formato estándar
    const normalizedPhone = normalizePhoneToStandard(phone);

    // Verificar si ya existe un cliente (activo o eliminado) con ese teléfono
    const existingClient = await prisma.client.findUnique({
      where: { phone: normalizedPhone }
    });

    if (existingClient) {
      // Si el cliente está eliminado, reactivarlo y actualizar sus datos
      if (existingClient.isDeleted) {
        const reactivatedClient = await prisma.client.update({
          where: { id: existingClient.id },
          data: {
            name,
            isDeleted: false,
            deletedAt: null,
            source,
            sourceDetails,
            isVerified: source === 'admin_panel' || source === 'manual',
            isRegular: isRegular
          }
        });

        return res.status(200).json({
          success: true,
          data: reactivatedClient,
          message: 'Cliente reactivado exitosamente'
        });
      }

      // Si el cliente existe y está activo, retornar error
      return res.status(409).json({
        success: false,
        error: 'Ya existe un cliente con ese número de teléfono'
      });
    }

    // Si no existe ningún cliente con ese teléfono, crear uno nuevo
    const client = await prisma.client.create({
      data: {
        name,
        phone: normalizedPhone,
        isRegular,
        source,
        sourceDetails,
        isVerified: source === 'admin_panel' || source === 'manual' // Los clientes creados desde el admin o manualmente están verificados
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

    // Si se está cambiando el teléfono, normalizar y verificar que no exista otro cliente con ese número
    if (updateData.phone && updateData.phone !== existingClient.phone) {
      const normalizedPhone = normalizePhoneToStandard(updateData.phone);
      const phoneConflict = await prisma.client.findUnique({
        where: { phone: normalizedPhone }
      });

      if (phoneConflict) {
        return res.status(409).json({
          success: false,
          error: 'Ya existe otro cliente con ese número de teléfono'
        });
      }
      
      // Actualizar el teléfono normalizado
      updateData.phone = normalizedPhone;
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
    const clientsWithStats = clients.map(client => {
      const today = new Date().toISOString().split('T')[0];
      
      // Filtrar solo turnos completados (estado 'completed' y fechas pasadas)
      const completedBookings = client.bookings.filter(booking => 
        booking.date < today && booking.status === 'COMPLETED'
      );
      
      return {
        ...client,
        totalBookings: client._count.bookings, // Total incluye futuros
        completedBookings: completedBookings.length, // Solo completados
        lastVisit: completedBookings[0]?.date || null, // Última visita real
        firstVisit: completedBookings[completedBookings.length - 1]?.date || client.createdAt.toISOString().split('T')[0]
      };
    });

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

// POST /api/clients/bulk-import - Carga masiva de clientes desde CSV/Excel
router.post('/bulk-import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionó ningún archivo'
      });
    }

    const file = req.file;
    const isCSV = file.mimetype === 'text/csv';
    const isExcel = file.mimetype.includes('spreadsheet');

    if (!isCSV && !isExcel) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de archivo no soportado. Solo se permiten archivos CSV y Excel.'
      });
    }

    let clients = [];

    if (isCSV) {
      // Procesar archivo CSV
      clients = await new Promise((resolve, reject) => {
        const results = [];
        const stream = Readable.from(file.buffer.toString());
        
        stream
          .pipe(csv())
          .on('data', (data) => {
            // Normalizar nombres de columnas (case insensitive)
            const normalizedData = {};
            Object.keys(data).forEach(key => {
              const normalizedKey = key.toLowerCase().trim();
              if (normalizedKey === 'nombre' || normalizedKey === 'name') {
                normalizedData.name = data[key]?.trim();
              } else if (normalizedKey === 'telefono' || normalizedKey === 'phone' || normalizedKey === 'teléfono') {
                normalizedData.phone = data[key]?.trim();
              }
            });
            
            if (normalizedData.name && normalizedData.phone) {
              results.push(normalizedData);
            }
          })
          .on('end', () => resolve(results))
          .on('error', reject);
      });
    } else {
      // Procesar archivo Excel
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      clients = jsonData.map(row => {
        const normalizedData = {};
        Object.keys(row).forEach(key => {
          const normalizedKey = key.toLowerCase().trim();
          if (normalizedKey === 'nombre' || normalizedKey === 'name') {
            normalizedData.name = row[key]?.toString().trim();
          } else if (normalizedKey === 'telefono' || normalizedKey === 'phone' || normalizedKey === 'teléfono') {
            normalizedData.phone = row[key]?.toString().trim();
          }
        });
        return normalizedData;
      }).filter(client => client.name && client.phone);
    }

    if (clients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No se encontraron datos válidos en el archivo. Asegúrate de que tenga las columnas "Nombre" y "Teléfono".'
      });
    }

    // Normalizar teléfonos del archivo
    const normalizedClients = clients.map(client => ({
      ...client,
      normalizedPhone: normalizePhoneForComparison(client.phone)
    }));

    // Validar datos
    const validationResults = {
      valid: [],
      invalid: [],
      duplicates: []
    };

    // Obtener todos los clientes existentes para comparación
    const existingClients = await prisma.client.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true, phone: true }
    });

    // Crear mapa de teléfonos normalizados existentes
    const existingPhonesMap = new Map();
    existingClients.forEach(client => {
      const normalizedExisting = normalizePhoneForComparison(client.phone);
      existingPhonesMap.set(normalizedExisting, client);
    });

    for (const client of normalizedClients) {
      // Validar formato de teléfono
      const phoneValidation = validatePhoneFormat(client.phone);
      if (!phoneValidation.isValid) {
        validationResults.invalid.push({
          ...client,
          error: 'Formato de teléfono inválido'
        });
        continue;
      }

      // Verificar si ya existe usando teléfono normalizado
      const existingClient = existingPhonesMap.get(client.normalizedPhone);

      if (existingClient) {
        validationResults.duplicates.push({
          ...client,
          existingClient: {
            id: existingClient.id,
            name: existingClient.name,
            phone: existingClient.phone
          }
        });
        continue;
      }

      validationResults.valid.push(client);
    }

    // Crear clientes válidos (ignorar duplicados e inválidos)
    const createdClients = [];
    const skippedClients = [];
    
    for (const client of validationResults.valid) {
      try {
        const normalizedPhone = normalizePhoneToStandard(client.phone);
        const createdClient = await prisma.client.create({
          data: {
            name: client.name,
            phone: normalizedPhone,
            source: 'bulk_import',
            sourceDetails: `Importado desde ${file.originalname}`,
            isVerified: true // Los clientes importados masivamente están verificados automáticamente
          }
        });
        createdClients.push(createdClient);
      } catch (error) {
        // Si falla al crear (ej: conflicto de único), agregar a omitidos
        skippedClients.push({
          ...client,
          error: error.code === 'P2002' ? 'Ya existe en la base de datos' : error.message
        });
      }
    }

    // Preparar respuesta con resumen completo
    const response = {
      success: true,
      message: `Se procesaron ${clients.length} clientes: ${createdClients.length} creados, ${validationResults.duplicates.length} duplicados (omitidos), ${validationResults.invalid.length} inválidos`,
      data: {
        totalProcessed: clients.length,
        created: createdClients.length,
        duplicates: validationResults.duplicates.length,
        invalid: validationResults.invalid.length,
        skipped: skippedClients.length,
        clients: createdClients
      }
    };

    // Si hay duplicados o inválidos, agregar detalles
    if (validationResults.duplicates.length > 0 || validationResults.invalid.length > 0) {
      response.warnings = {
        duplicateClients: validationResults.duplicates.map(dup => ({
          name: dup.name,
          phone: dup.phone,
          existingClient: {
            name: dup.existingClient.name,
            phone: dup.existingClient.phone
          },
          message: `Ya existe como "${dup.existingClient.name}" (${dup.existingClient.phone})`
        })),
        invalidClients: validationResults.invalid.map(inv => ({
          name: inv.name,
          phone: inv.phone,
          error: inv.error
        })),
        skippedClients: skippedClients
      };
    }

    // Si no se creó ningún cliente pero había datos, retornar error
    if (createdClients.length === 0 && clients.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se pudo importar ningún cliente',
        details: {
          totalRows: clients.length,
          valid: validationResults.valid.length,
          invalid: validationResults.invalid.length,
          duplicates: validationResults.duplicates.length,
          skipped: skippedClients.length
        },
        preview: response.warnings
      });
    }

    res.json(response);

  } catch (error) {
    console.error('Error en carga masiva:', error);
    res.status(500).json({
      success: false,
      error: 'Error al procesar el archivo de carga masiva'
    });
  }
});

export default router;