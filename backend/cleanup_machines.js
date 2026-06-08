const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function cleanMachines() {
  const idsToDelete = [2, 5, 6, 7, 8];
  try {
    for (const id of idsToDelete) {
      await p.machine.deleteMany({ where: { id } });
      console.log(`Deleted machine ${id}`);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
}
cleanMachines();
