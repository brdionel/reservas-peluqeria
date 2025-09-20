import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

// Endpoint temporal para inicializar la base de datos
router.post('/init-database', async (req, res) => {
  try {
    console.log('🚀 Inicializando base de datos de producción...');

    // Verificar si ya existe un admin
    const existingAdmin = await prisma.admin.findFirst();
    
    if (!existingAdmin) {
      console.log('📝 Creando admin por defecto...');
      
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await prisma.admin.create({
        data: {
          username: 'admin',
          email: 'admin@peluqueria.com',
          passwordHash: hashedPassword,
          firstName: 'Administrador',
          lastName: 'Sistema',
          role: 'super_admin',
          isActive: true
        }
      });
      
      console.log('✅ Admin creado exitosamente');
    } else {
      console.log('✅ Admin ya existe, saltando creación...');
    }

    // Verificar configuración del salón
    const existingConfig = await prisma.salonConfig.findFirst();
    
    if (!existingConfig) {
      console.log('⚙️ Creando configuración por defecto del salón...');
      
      await prisma.salonConfig.create({
        data: {
          slotDuration: 30,
          advanceBookingDays: 30,
          salonName: 'Salón de Belleza',
          timezone: 'America/Argentina/Buenos_Aires',
        }
      });
      
      console.log('✅ Configuración del salón creada');
    } else {
      console.log('✅ Configuración del salón ya existe');
    }

    // Verificar horarios de trabajo
    const existingHours = await prisma.workingHours.findFirst();
    
    if (!existingHours) {
      console.log('🕐 Creando horarios de trabajo por defecto...');
      
      const defaultHours = [
        { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' }, // Lunes
        { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' }, // Martes
        { dayOfWeek: 3, startTime: '09:00', endTime: '18:00' }, // Miércoles
        { dayOfWeek: 4, startTime: '09:00', endTime: '18:00' }, // Jueves
        { dayOfWeek: 5, startTime: '09:00', endTime: '18:00' }, // Viernes
        { dayOfWeek: 6, startTime: '09:00', endTime: '16:00' }, // Sábado
        { dayOfWeek: 0, enabled: false, startTime: '00:00', endTime: '00:00' } // Domingo
      ];
      
      for (const hours of defaultHours) {
        await prisma.workingHours.create({
          data: hours
        });
      }
      
      console.log('✅ Horarios de trabajo creados');
    } else {
      console.log('✅ Horarios de trabajo ya existen');
    }

    console.log('🎉 Inicialización completada exitosamente!');
    
    res.json({ 
      success: true, 
      message: 'Base de datos inicializada correctamente',
      admin: {
        username: 'admin',
        password: 'admin123',
        email: 'admin@peluqueria.com'
      }
    });
    
  } catch (error) {
    console.error('❌ Error durante la inicialización:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
