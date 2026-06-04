const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedMachines() {
  try {
    const machinesToCreate = [
      { code: 'EXT-01', name: 'Extrusora 1', type: 'EXTRUSION' },
      { code: 'EXT-02', name: 'Extrusora 2', type: 'EXTRUSION' },
      { code: 'IMP-01', name: 'Impresora 1', type: 'IMPRESION' },
      { code: 'CON-01', name: 'Confeccionadora 1', type: 'CONFECCION' }
    ];

    for (const m of machinesToCreate) {
      const existing = await prisma.machine.findUnique({ where: { code: m.code } });
      if (!existing) {
        await prisma.machine.create({ data: m });
        console.log(`Created machine ${m.code}`);
      }
    }
  } catch (error) {
    console.error('Error seeding machines:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedMachines();
