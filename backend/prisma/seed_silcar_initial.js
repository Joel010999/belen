// ====================================================================
// SILCAR INDUSTRIAL OS — SEED INICIAL PARA BASE POSTGRESQL AISLADA
// ====================================================================
// Este script inicializa los datos maestros esenciales para operar Silcar:
// 1. Máquinas por tipo de proceso (Impresión, Laminación, Refilado, Confección).
// 2. Operarios de planta.
// 3. Usuarios industriales (Admin, Vendedor, Terminales de Máquina) con hashes scrypt seguros.
// 4. Clientes y Productos iniciales.
// 5. Insumos con stock inicial en CurrentStock.
// 6. Orden de prueba #1001 con procesos planificados.
// ====================================================================

const path = require('path');
const dotenv = require('dotenv');

// Priorizar .env.local
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const rawDbUrl = process.env.DATABASE_URL || '';
const silcarDbUrl = rawDbUrl.includes('schema=')
  ? rawDbUrl
  : (rawDbUrl.includes('?') ? `${rawDbUrl}&schema=silcar` : `${rawDbUrl}?schema=silcar`);

const prisma = new PrismaClient({
  datasources: {
    db: { url: silcarDbUrl }
  }
});

// Hash seguro scrypt
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derivedKey}`;
}

async function runSeed() {
  console.log('🚀 Iniciando sembrado en base PostgreSQL de Silcar...\n');

  // 1. MÁQUINAS
  console.log('📦 1. Creando máquinas industriales...');
  const machinesData = [
    { code: 'IMP1', name: 'Impresora 1 (Flexo 8C)', type: 'IMPRESION' },
    { code: 'IMP2', name: 'Impresora 2 (Flexo 6C)', type: 'IMPRESION' },
    { code: 'LAM1', name: 'Laminadora Solventless', type: 'LAMINACION' },
    { code: 'REF1', name: 'Refiladora Alta Velocidad', type: 'REFILADO' },
    { code: 'CONF1', name: 'Confeccionadora 1', type: 'CONFECCION' }
  ];

  const machines = {};
  for (const m of machinesData) {
    machines[m.code] = await prisma.machine.upsert({
      where: { code: m.code },
      update: { name: m.name, type: m.type, active: true },
      create: m
    });
  }

  // 2. OPERARIOS
  console.log('👷 2. Creando operarios de planta...');
  const operatorsData = [
    { legajo: 'OP1', firstName: 'Tomás', lastName: 'Díaz', role: 'IMPRESION' },
    { legajo: 'OP2', firstName: 'Emanuel', lastName: 'Melero', role: 'IMPRESION' },
    { legajo: 'OP3', firstName: 'Thiago', lastName: 'Ferreira', role: 'LAMINACION' },
    { legajo: 'OP4', firstName: 'Franco', lastName: 'Castro', role: 'REFILADO' },
    { legajo: 'OP5', firstName: 'Gervasio', lastName: 'López', role: 'CONFECCION' }
  ];

  for (const op of operatorsData) {
    await prisma.operator.upsert({
      where: { legajo: op.legajo },
      update: { firstName: op.firstName, lastName: op.lastName, role: op.role, active: true },
      create: op
    });
  }

  // 3. USUARIOS INDUSTRIALES (CON HASH SCRYPT)
  console.log('🔑 3. Creando usuarios industriales con contraseñas seguras...');
  const usersData = [
    { username: 'admin', name: 'Administrador del Sistema', role: 'ADMIN', pass: 'admin123' },
    { username: 'vendedor', name: 'Vendedor / Comercial', role: 'VENDEDOR', pass: 'ventas123' },
    { username: 'impresora1', name: 'Terminal Impresora 1', role: 'MACHINE', pass: 'planta123', machineId: machines['IMP1'].id },
    { username: 'impresora2', name: 'Terminal Impresora 2', role: 'MACHINE', pass: 'planta123', machineId: machines['IMP2'].id },
    { username: 'laminadora', name: 'Terminal Laminadora', role: 'MACHINE', pass: 'planta123', machineId: machines['LAM1'].id },
    { username: 'refiladora', name: 'Terminal Refiladora', role: 'MACHINE', pass: 'planta123', machineId: machines['REF1'].id },
    { username: 'confeccion', name: 'Terminal Confeccion', role: 'MACHINE', pass: 'planta123', machineId: machines['CONF1'].id }
  ];

  for (const u of usersData) {
    const passwordHash = hashPassword(u.pass);
    await prisma.user.upsert({
      where: { username: u.username },
      update: {
        name: u.name,
        role: u.role,
        machineId: u.machineId || null,
        active: true
      },
      create: {
        username: u.username,
        passwordHash,
        name: u.name,
        role: u.role,
        machineId: u.machineId || null,
        active: true
      }
    });
  }

  // 4. CLIENTES Y PRODUCTOS
  console.log('🏷️  4. Creando clientes y productos base...');
  const clientsData = [
    { code: 'CLI-001', name: 'Alimentos del Plata S.A.' },
    { code: 'DAN-SAL', name: 'DAN-SAL Distribuciones' }
  ];

  const clients = {};
  for (const c of clientsData) {
    clients[c.code] = await prisma.client.upsert({
      where: { code: c.code },
      update: { name: c.name },
      create: c
    });
  }

  const productsData = [
    { code: 'PROD-01', name: 'Bolsa Bilaminada 20x30', unit: 'UN', price: 15.5 },
    { code: 'HAUT-01', name: 'Bobina HAUT Cloure', unit: 'KG', price: 850.0 }
  ];

  const products = {};
  for (const p of productsData) {
    products[p.code] = await prisma.product.upsert({
      where: { code: p.code },
      update: { name: p.name, unit: p.unit, price: p.price },
      create: p
    });
  }

  // 5. INSUMOS Y STOCK INICIAL
  console.log('🧪 5. Creando insumos con stock inicial...');
  const suppliesData = [
    { code: 'INS-SOLV', name: 'Solvente Acetato', type: 'SOLVENTE', unit: 'kg', price: 3.5, initStock: 500 },
    { code: 'INS-ADH', name: 'Adhesivo Poliuretánico', type: 'ADHESIVO', unit: 'kg', price: 7.2, initStock: 300 },
    { code: 'TINTA-CYAN', name: 'Tinta Flexo Cyan', type: 'TINTA', unit: 'kg', price: 12.0, initStock: 150 },
    { code: 'TINTA-MAG', name: 'Tinta Flexo Magenta', type: 'TINTA', unit: 'kg', price: 12.0, initStock: 150 },
    { code: 'TINTA-YEL', name: 'Tinta Flexo Yellow', type: 'TINTA', unit: 'kg', price: 11.5, initStock: 150 },
    { code: 'TINTA-BLK', name: 'Tinta Flexo Black', type: 'TINTA', unit: 'kg', price: 10.0, initStock: 200 }
  ];

  for (const s of suppliesData) {
    const supply = await prisma.supply.upsert({
      where: { code: s.code },
      update: { name: s.name, type: s.type, unit: s.unit, price: s.price },
      create: { code: s.code, name: s.name, type: s.type, unit: s.unit, price: s.price }
    });

    await prisma.currentStock.upsert({
      where: { supplyId: supply.id },
      update: { stockActual: s.initStock, lastUpdate: new Date() },
      create: {
        itemType: 'INSUMO',
        supplyId: supply.id,
        stockActual: s.initStock,
        minStock: 50,
        unit: s.unit,
        updateSource: 'Sembrado Inicial'
      }
    });
  }

  // 6. ORDEN DE PRUEBA #1001
  console.log('📋 6. Creando orden de prueba #1001...');
  const adminUser = await prisma.user.findUnique({ where: { username: 'admin' } });

  const testOrder = await prisma.productionOrder.upsert({
    where: { orderNumber: 'OP-1001' },
    update: {},
    create: {
      orderNumber: 'OP-1001',
      clientId: clients['CLI-001'].id,
      productId: products['PROD-01'].id,
      deliveryDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      unit: 'UN',
      plannedQty: '10000',
      status: 'Órdenes por realizar',
      creatorId: adminUser.id,
      observations: 'Orden de prueba para validación de circuito industrial'
    }
  });

  // Procesos planificados para la orden
  const plannedStages = [
    { type: 'IMPRESION', machineId: machines['IMP1'].id },
    { type: 'LAMINACION', machineId: machines['LAM1'].id },
    { type: 'REFILADO', machineId: machines['REF1'].id },
    { type: 'CONFECCION', machineId: machines['CONF1'].id }
  ];

  for (const st of plannedStages) {
    const existing = await prisma.productionProcess.findFirst({
      where: { orderId: testOrder.id, type: st.type }
    });
    if (!existing) {
      await prisma.productionProcess.create({
        data: {
          orderId: testOrder.id,
          type: st.type,
          status: 'Planificada',
          machineId: st.machineId,
          scrapKg: 0
        }
      });
    }
  }

  console.log('\n✅ Sembrado completado con éxito.');
  console.log('   Usuarios listos: admin, vendedor, impresora1, impresora2, laminadora, refiladora, confeccion');
  console.log('   Orden lista: OP-1001 con 4 etapas planificadas.\n');
}

runSeed()
  .catch((e) => {
    console.error('❌ Error durante el sembrado:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
