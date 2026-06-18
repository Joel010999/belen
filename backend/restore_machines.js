const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function restoreMachines() {
  const machines = [
    { code: 'IMP1', name: 'Impresora 1', type: 'IMPRESION' },
    { code: 'IMP2', name: 'Impresora 2', type: 'IMPRESION' },
    { code: 'LAM1', name: 'Laminadora', type: 'LAMINACION' },
    { code: 'REF1', name: 'Refiladora', type: 'REFILADO' },
    { code: 'CON-01', name: 'Confeccionadora 1', type: 'CONFECCION' },
    { code: 'RAP-01', name: 'Rapar', type: 'RAPAR' } // Adding Rapar
  ];

  try {
    for (const m of machines) {
      await p.machine.upsert({
        where: { code: m.code },
        update: { name: m.name, type: m.type, active: true },
        create: { code: m.code, name: m.name, type: m.type, active: true }
      });
      console.log(`Restaurada: ${m.name}`);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
}
restoreMachines();
