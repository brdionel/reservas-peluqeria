import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { 
  getAdminActivityLogs, 
  getAllActivityLogs, 
  getActivityStats 
} from '../services/activityLogger.js';

const router = express.Router();

// GET /api/activity/my-logs - Obtener logs del admin actual
router.get('/my-logs', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      entityType,
      startDate,
      endDate
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      action,
      entityType,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    };

    const result = await getAdminActivityLogs(req.admin.id, options);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error obteniendo logs del admin:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los logs de actividad'
    });
  }
});

// GET /api/activity/all-logs - Obtener todos los logs (solo super admins)
router.get('/all-logs', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      adminId,
      action,
      entityType,
      startDate,
      endDate
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      adminId: adminId ? parseInt(adminId) : null,
      action,
      entityType,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    };

    const result = await getAllActivityLogs(options);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error obteniendo todos los logs:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los logs de actividad'
    });
  }
});

// GET /api/activity/stats - Obtener estadísticas de actividad
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const {
      adminId,
      startDate,
      endDate
    } = req.query;

    // Solo super admins pueden ver estadísticas de otros admins
    const targetAdminId = adminId && req.admin.role === 'super_admin' 
      ? parseInt(adminId) 
      : req.admin.id;

    const stats = await getActivityStats(
      targetAdminId,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las estadísticas de actividad'
    });
  }
});

// GET /api/activity/export - Exportar logs (solo super admins)
router.get('/export', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  try {
    const {
      adminId,
      action,
      entityType,
      startDate,
      endDate,
      format = 'json'
    } = req.query;

    const options = {
      page: 1,
      limit: 1000, // Máximo 1000 registros para exportar
      adminId: adminId ? parseInt(adminId) : null,
      action,
      entityType,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    };

    const result = await getAllActivityLogs(options);

    if (format === 'csv') {
      // Convertir a CSV
      const csvHeaders = [
        'ID',
        'Admin',
        'Acción',
        'Tipo de Entidad',
        'ID de Entidad',
        'Descripción',
        'Valores Anteriores',
        'Valores Nuevos',
        'IP',
        'User Agent',
        'Fecha'
      ];

      const csvRows = result.logs.map(log => [
        log.id,
        `${log.admin.firstName} ${log.admin.lastName}`,
        log.action,
        log.entityType,
        log.entityId || '',
        log.description,
        log.oldValues || '',
        log.newValues || '',
        log.ipAddress || '',
        log.userAgent || '',
        log.createdAt
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=activity-logs-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvContent);
    } else {
      // JSON por defecto
      res.json({
        success: true,
        data: result.logs,
        exportInfo: {
          total: result.pagination.total,
          exported: result.logs.length,
          date: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Error exportando logs:', error);
    res.status(500).json({
      success: false,
      error: 'Error al exportar los logs de actividad'
    });
  }
});

export default router;
