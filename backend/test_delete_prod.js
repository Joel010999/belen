const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  try {
    const stockDel = await p.currentStock.deleteMany({});
    console.log('Deleted stock:', stockDel);
    const prodDel = await p.product.deleteMany({});
    console.log('Deleted products:', prodDel);
    const supplyDel = await p.supply.deleteMany({});
    console.log('Deleted supplies:', supplyDel);
  } catch (e) {
    console.error('Error deleting products:', e);
  } finally {
    await p.$disconnect();
  }
}
run();
