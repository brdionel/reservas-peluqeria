import { PrismaClient } from '@prisma/client';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const prisma = new PrismaClient();

async function migrateToPostgres() {
  try {
    console.log('🔄 Iniciando migración de SQLite a PostgreSQL...');

    // Abrir base de datos SQLite
    const sqliteDb = await open({
      filename: './dev.db',
      driver: sqlite3.Database
    });

    // Migrar Admins
    console.log('👤 Migrando administradores...');
    const admins = await sqliteDb.all('SELECT * FROM admins');
    for (const admin of admins) {
      await prisma.admin.upsert({
        where: { id: admin.id },
        update: {},
        create: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          passwordHash: admin.password_hash,
          firstName: admin.first_name,
          lastName: admin.last_name,
          isActive: admin.is_active === 1,
          role: admin.role,
          lastLogin: admin.last_login ? new Date(admin.last_login) : null,
          createdAt: new Date(admin.created_at),
          updatedAt: new Date(admin.updated_at)
        }
      });
    }
    console.log(`✅ ${admins.length} administradores migrados`);

    // Migrar Clientes
    console.log('👥 Migrando clientes...');
    const clients = await sqliteDb.all('SELECT * FROM clients');
    for (const client of clients) {
      await prisma.client.upsert({
        where: { id: client.id },
        update: {},
        create: {
          id: client.id,
          name: client.name,
          phone: client.phone,
          isRegular: client.is_regular === 1,
          totalBookings: client.total_bookings,
          firstVisitDate: client.first_visit_date,
          lastVisitDate: client.last_visit_date,
          createdAt: new Date(client.created_at),
          updatedAt: new Date(client.updated_at)
        }
      });
    }
    console.log(`✅ ${clients.length} clientes migrados`);

    // Migrar Configuración del Salón
    console.log('⚙️ Migrando configuración del salón...');
    const configs = await sqliteDb.all('SELECT * FROM salon_config');
    for (const config of configs) {
      await prisma.salonConfig.upsert({
        where: { id: config.id },
        update: {},
        create: {
          id: config.id,
          slotDuration: config.slot_duration,
          advanceBookingDays: config.advance_booking_days,
          salonName: config.salon_name,
          timezone: config.timezone,
          defaultServices: config.default_services,
          createdAt: new Date(config.created_at),
          updatedAt: new Date(config.updated_at),
          updatedById: config.updated_by_id
        }
      });
    }
    console.log(`✅ ${configs.length} configuraciones migradas`);

    // Migrar Horarios de Trabajo
    console.log('🕐 Migrando horarios de trabajo...');
    const workingHours = await sqliteDb.all('SELECT * FROM working_hours');
    for (const hours of workingHours) {
      await prisma.workingHours.upsert({
        where: { id: hours.id },
        update: {},
        create: {
          id: hours.id,
          dayOfWeek: hours.day_of_week,
          enabled: hours.enabled === 1,
          startTime: hours.start_time,
          endTime: hours.end_time,
          breakStartTime: hours.break_start_time,
          breakEndTime: hours.break_end_time,
          createdAt: new Date(hours.created_at),
          updatedAt: new Date(hours.updated_at),
          updatedById: hours.updated_by_id
        }
      });
    }
    console.log(`✅ ${workingHours.length} horarios migrados`);

    // Migrar Reservas
    console.log('📅 Migrando reservas...');
    const bookings = await sqliteDb.all('SELECT * FROM bookings');
    for (const booking of bookings) {
      await prisma.booking.upsert({
        where: { id: booking.id },
        update: {},
        create: {
          id: booking.id,
          date: booking.date,
          time: booking.time,
          status: booking.status,
          service: booking.service,
          notes: booking.notes,
          googleEventId: booking.google_event_id,
          createdAt: new Date(booking.created_at),
          updatedAt: new Date(booking.updated_at),
          clientId: booking.client_id,
          createdById: booking.created_by_id
        }
      });
    }
    console.log(`✅ ${bookings.length} reservas migradas`);

    // Migrar Logs de Actividad
    console.log('📝 Migrando logs de actividad...');
    const activityLogs = await sqliteDb.all('SELECT * FROM admin_activity_logs');
    for (const log of activityLogs) {
      await prisma.adminActivityLog.upsert({
        where: { id: log.id },
        update: {},
        create: {
          id: log.id,
          adminId: log.admin_id,
          action: log.action,
          entityType: log.entity_type,
          entityId: log.entity_id,
          description: log.description,
          oldValues: log.old_values,
          newValues: log.new_values,
          ipAddress: log.ip_address,
          userAgent: log.user_agent,
          createdAt: new Date(log.created_at)
        }
      });
    }
    console.log(`✅ ${activityLogs.length} logs migrados`);

    await sqliteDb.close();
    console.log('🎉 Migración completada exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateToPostgres();
