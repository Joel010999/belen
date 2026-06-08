const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.importLog.findMany({
    where: { entityType: 'STOCK' },
    orderBy: { date: 'desc' },
    take: 5
  });
  fs.writeFileSync('logs_output.json', JSON.stringify(logs, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
