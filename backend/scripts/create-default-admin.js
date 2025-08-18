import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createDefaultAdmin() {
  try {
    // Verificar si ya existe un admin
    const existingAdmin = await prisma.admin.findFirst({
      where: {
        username: 'admin'
      }
    });

    if (existingAdmin) {
      console.log('✅ El admin por defecto ya existe');
      return;
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash('admin123', 10);

    // Crear admin por defecto
    const admin = await prisma.admin.create({
      data: {
        username: 'admin',
        email: 'admin@saloninvictus.com',
        passwordHash: passwordHash,
        firstName: 'Administrador',
        lastName: 'Salón Invictus',
        isActive: true,
        role: 'admin'
      }
    });

    console.log('✅ Admin por defecto creado exitosamente:');
    console.log(`   Username: ${admin.username}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Contraseña: admin123`);
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');

  } catch (error) {
    console.error('❌ Error al crear el admin por defecto:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDefaultAdmin();
