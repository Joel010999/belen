import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing to avoid duplicates or simply use upsert
  
  // Upsert Operators
  const ops = [
    { firstName: 'Tomás', lastName: 'Díaz', code: 'OP001' },
    { firstName: 'Emanuel', lastName: 'Melero', code: 'OP002' },
    { firstName: 'Franco', lastName: 'Borghi', code: 'OP003' },
    { firstName: 'Thiago', lastName: 'Ferreira', code: 'OP004' },
    { firstName: 'Franco', lastName: 'Castro', code: 'OP005' },
    { firstName: 'Gervasio', lastName: '', code: 'OP006' }
  ];

  for (const op of ops) {
    const existing = await prisma.operator.findFirst({ where: { firstName: op.firstName, lastName: op.lastName }});
    if (!existing) {
      await prisma.operator.create({ data: { firstName: op.firstName, lastName: op.lastName, active: true, legajo: op.code, role: 'OPERATOR' } });
    }
  }

  // Upsert Machines
  const machines = [
    { name: 'Impresora 1', type: 'IMPRESION', code: 'IMP1' },
    { name: 'Impresora 2', type: 'IMPRESION', code: 'IMP2' },
    { name: 'Laminadora', type: 'LAMINACION', code: 'LAM1' },
    { name: 'Refiladora', type: 'REFILADO', code: 'REF1' },
    { name: 'Confeccionadora 1', type: 'CONFECCION', code: 'CONF1' },
    { name: 'Rapar', type: 'RAPAR', code: 'RAP1' }
  ];

  for (const m of machines) {
    const existing = await prisma.machine.findFirst({ where: { name: m.name } });
    if (!existing) {
      await prisma.machine.create({ data: m });
    }
  }

  console.log('Database updated with requested operators and machines.');
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
