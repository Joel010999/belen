import { prisma } from '../index';

async function check() {
  const products = await prisma.product.findMany({
    include: { stock: true },
    take: 5
  });
  console.log('--- Products ---');
  console.log(JSON.stringify(products, null, 2));

  const supplies = await prisma.supply.findMany({
    include: { stock: true },
    take: 5
  });
  console.log('\n--- Supplies ---');
  console.log(JSON.stringify(supplies, null, 2));
}

check().finally(() => prisma.$disconnect());
