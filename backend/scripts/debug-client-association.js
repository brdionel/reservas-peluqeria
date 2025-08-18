import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script para debuggear la asociación de clientes con reservas
 */
async function debugClientAssociation() {
  try {
    console.log('🔍 Debuggeando asociación de clientes...');
    
    // Obtener todas las reservas con sus clientes
    const allBookings = await prisma.booking.findMany({
      include: {
        client: true
      },
      orderBy: [
        { createdAt: 'asc' }
      ]
    });

    console.log(`📋 Total de reservas: ${allBookings.length}`);

    // Agrupar por cliente
    const clientBookings = {};
    allBookings.forEach(booking => {
      const clientName = booking.client.name;
      if (!clientBookings[clientName]) {
        clientBookings[clientName] = [];
      }
      clientBookings[clientName].push(booking);
    });

    console.log('\n📊 Reservas por cliente:');
    Object.entries(clientBookings).forEach(([clientName, bookings]) => {
      console.log(`\n👤 ${clientName} (ID: ${bookings[0].client.id}):`);
      console.log(`   📞 Teléfono: ${bookings[0].client.phone}`);
      console.log(`   📅 Total reservas: ${bookings.length}`);
      
      bookings.forEach((booking, index) => {
        console.log(`   ${index + 1}. ${booking.date} ${booking.time} - ID: ${booking.id}`);
        console.log(`      Creado: ${booking.createdAt}`);
      });
    });

    // Verificar si hay clientes con el mismo teléfono
    console.log('\n🔍 Verificando clientes con el mismo teléfono...');
    const clients = await prisma.client.findMany({
      orderBy: [
        { phone: 'asc' }
      ]
    });

    const phoneGroups = {};
    clients.forEach(client => {
      if (!phoneGroups[client.phone]) {
        phoneGroups[client.phone] = [];
      }
      phoneGroups[client.phone].push(client);
    });

    const duplicatePhones = Object.entries(phoneGroups).filter(([phone, clients]) => clients.length > 1);
    
    if (duplicatePhones.length > 0) {
      console.log('⚠️ Clientes con el mismo teléfono:');
      duplicatePhones.forEach(([phone, clients]) => {
        console.log(`\n📞 Teléfono: ${phone}`);
        clients.forEach(client => {
          console.log(`   - ${client.name} (ID: ${client.id})`);
        });
      });
    } else {
      console.log('✅ No hay clientes con el mismo teléfono');
    }

    // Verificar específicamente el cliente "Opa"
    console.log('\n🔍 Análisis específico del cliente "Opa":');
    const opaClient = await prisma.client.findFirst({
      where: { name: 'Opa' },
      include: {
        bookings: {
          orderBy: [
            { createdAt: 'asc' }
          ]
        }
      }
    });

    if (opaClient) {
      console.log(`📋 Cliente: ${opaClient.name} (ID: ${opaClient.id})`);
      console.log(`📞 Teléfono: ${opaClient.phone}`);
      console.log(`📅 Total reservas: ${opaClient.bookings.length}`);

      // Verificar si hay otros clientes con el mismo teléfono
      const samePhoneClients = await prisma.client.findMany({
        where: { phone: opaClient.phone }
      });

      if (samePhoneClients.length > 1) {
        console.log(`⚠️ Hay ${samePhoneClients.length} clientes con el teléfono ${opaClient.phone}:`);
        samePhoneClients.forEach(client => {
          console.log(`   - ${client.name} (ID: ${client.id})`);
        });
      }

      // Verificar las reservas del cliente Opa
      console.log('\n📅 Reservas del cliente Opa:');
      opaClient.bookings.forEach((booking, index) => {
        console.log(`   ${index + 1}. ${booking.date} ${booking.time} - ID: ${booking.id}`);
        console.log(`      Creado: ${booking.createdAt}`);
        console.log(`      clientId: ${booking.clientId}`);
      });
    }

  } catch (error) {
    console.error('💥 Error durante el debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el debug
debugClientAssociation();
