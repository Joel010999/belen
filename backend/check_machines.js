const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.machine.findMany({ include: { user: true, processes: true, ordersCreated: true } })
  .then(m => console.log(JSON.stringify(m, null, 2)))
  .catch(console.error)
  .finally(() => p.$disconnect());
