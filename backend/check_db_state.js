const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const logs = await p.importLog.findMany({
    orderBy: { date: 'desc' },
    take: 10
  });
  console.log(JSON.stringify(logs.map(l => ({
    id: l.id,
    entityType: l.entityType, 
    readCount: l.readCount,
    insertedCount: l.insertedCount,
    updatedCount: l.updatedCount,
    errorCount: l.errorCount,
    status: l.status,
    date: l.date
  })), null, 2));
}

main().catch(e => console.error(e)).finally(() => p.$disconnect());
