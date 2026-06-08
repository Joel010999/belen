const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  try {
    const res = await p.client.deleteMany({});
    console.log('Deleted clients:', res);
  } catch (e) {
    console.error('Error deleting clients:', e);
  } finally {
    await p.$disconnect();
  }
}
run();
