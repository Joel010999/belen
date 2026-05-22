import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ 
  url: "file:./dev.db" 
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚀 Iniciando seeding de datos...');

  // 1. Usuarios y Máquinas
  const machines = [
    { code: 'M-01', name: 'Impresora Flexográfica 8C', type: 'IMPRESION' },
    { code: 'L-01', name: 'Laminadora Solventless', type: 'LAMINACION' },
    { code: 'R-01', name: 'Refiladora de Alta Velocidad', type: 'REFILADO' },
  ];

  const machineRecords = [];
  for (const machine of machines) {
    const m = await prisma.machine.upsert({
      where: { code: machine.code },
      update: {},
      create: machine,
    });
    machineRecords.push(m);
  }

  // Admin
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { 
      role: 'ADMIN',
      passwordHash: 'admin123' 
    },
    create: {
      username: 'admin',
      passwordHash: 'admin123',
      name: 'Supervisor General',
      role: 'ADMIN',
    },
  });

  // Machine Users
  const machineUsers = [
    { username: 'impresion', name: 'Operario Impresión', machineCode: 'M-01' },
    { username: 'laminacion', name: 'Operario Laminación', machineCode: 'L-01' },
    { username: 'refilado', name: 'Operario Refilado', machineCode: 'R-01' },
  ];

  for (const mu of machineUsers) {
    const machine = machineRecords.find(m => m.code === mu.machineCode);
    await prisma.user.upsert({
      where: { username: mu.username },
      update: { 
        role: 'MACHINE',
        machineId: machine?.id 
      },
      create: {
        username: mu.username,
        passwordHash: 'maquina123',
        name: mu.name,
        role: 'MACHINE',
        machineId: machine?.id
      },
    });
  }

  // 2. Clientes
  const clients = [
    { code: 'CLI001', name: 'Alimentos S.A.' },
    { code: 'CLI002', name: 'Bebidas Fresh' },
    { code: 'CLI003', name: 'Cosmética Plus' },
    { code: 'DAN-SAL', name: 'DAN-SAL (Juan Carlos)' },
  ];

  for (const client of clients) {
    await prisma.client.upsert({
      where: { code: client.code },
      update: {},
      create: client,
    });
  }

  // 3. Productos
  const products = [
    { code: 'PROD01', name: 'Bolsa Flexible 20x30', unit: 'UN' },
    { code: 'PROD02', name: 'Lámina PE 500mm', unit: 'KG' },
    { code: 'HAUT', name: 'HAUT CLOURE SABORIZADO', unit: 'Metros' },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { code: product.code },
      update: {},
      create: product,
    });
  }

  // 5. Operarios
  const operators = [
    { legajo: '101', firstName: 'Juan', lastName: 'Sosa', role: 'PRODUCCION' },
    { legajo: '102', firstName: 'Maria', lastName: 'Gomez', role: 'COLORES' },
    { legajo: '103', firstName: 'Ricardo', lastName: 'Perez', role: 'CALIDAD' },
  ];

  for (const op of operators) {
    await prisma.operator.upsert({
      where: { legajo: op.legajo },
      update: {},
      create: op,
    });
  }

  console.log('✅ Seeding completado con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
