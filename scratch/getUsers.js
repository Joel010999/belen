const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '..', 'backend', 'node_modules', '@prisma', 'client'));
const p = new PrismaClient();

async function main() {
  const users = await p.user.findMany({
    select: { id: true, username: true, name: true, role: true, passwordHash: true, active: true, machineId: true, machine: { select: { code: true, name: true } } }
  });
  console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => p['$disconnect']());
