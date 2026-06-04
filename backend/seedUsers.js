const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding operators and machines...");
  
  // 1. Ensure basic machines exist
  const machines = [
    { code: 'IMP1', name: 'Impresora 1', type: 'IMPRESION' },
    { code: 'IMP2', name: 'Impresora 2', type: 'IMPRESION' },
    { code: 'LAM1', name: 'Laminadora', type: 'LAMINACION' },
    { code: 'REF1', name: 'Refiladora', type: 'REFILADO' }
  ];

  for (const m of machines) {
    await prisma.machine.upsert({
      where: { code: m.code },
      update: {},
      create: m
    });
  }

  // Fetch machines to get their IDs
  const imp1 = await prisma.machine.findUnique({ where: { code: 'IMP1' }});
  const lam1 = await prisma.machine.findUnique({ where: { code: 'LAM1' }});
  const ref1 = await prisma.machine.findUnique({ where: { code: 'REF1' }});

  // 2. Ensure basic operators exist
  const operators = [
    { legajo: 'OP1', firstName: 'Tomás', lastName: 'Díaz', role: 'IMPRESION' },
    { legajo: 'OP2', firstName: 'Emanuel', lastName: 'Melero', role: 'IMPRESION' },
    { legajo: 'OP3', firstName: 'Franco', lastName: 'Borghi', role: 'IMPRESION' },
    { legajo: 'OP4', firstName: 'Thiago', lastName: 'Ferreira', role: 'LAMINACION' },
    { legajo: 'OP5', firstName: 'Franco', lastName: 'Castro', role: 'REFILADO' },
    { legajo: 'OP6', firstName: 'Gervasio', lastName: 'López', role: 'CONFECCION' }
  ];

  for (const o of operators) {
    await prisma.operator.upsert({
      where: { legajo: o.legajo },
      update: {},
      create: o
    });
  }

  console.log("Seeding users...");

  // 3. Upsert Users
  const users = [
    {
      username: 'admin',
      passwordHash: 'admin123',
      name: 'Administrador del Sistema',
      role: 'ADMIN'
    },
    {
      username: 'vendedor',
      passwordHash: 'ventas123',
      name: 'Vendedor / Comercial',
      role: 'VENDEDOR'
    },
    {
      username: 'impresora1',
      passwordHash: 'planta123',
      name: 'Terminal Impresora 1',
      role: 'MACHINE',
      machineId: imp1.id
    },
    {
      username: 'laminadora',
      passwordHash: 'planta123',
      name: 'Terminal Laminadora',
      role: 'MACHINE',
      machineId: lam1.id
    },
    {
      username: 'refiladora',
      passwordHash: 'planta123',
      name: 'Terminal Refiladora',
      role: 'MACHINE',
      machineId: ref1.id
    }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {
        passwordHash: u.passwordHash,
        role: u.role,
        machineId: u.machineId || null
      },
      create: u
    });
  }

  console.log("Seeding complete!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
