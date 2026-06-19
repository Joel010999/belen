import prisma from '../lib/prisma';

async function main() {
  const users = await prisma.user.findMany({
    include: { machine: true, operator: true }
  });
  console.log('--- USUARIOS ---');
  for (const u of users) {
    console.log(`  ID=${u.id} username=${u.username} role=${u.role} machine=${u.machine?.name || 'NINGUNA'} machineId=${u.machineId} active=${u.active}`);
  }

  const machines = await prisma.machine.findMany({
    include: { user: true }
  });
  console.log('\n--- MÁQUINAS ---');
  for (const m of machines) {
    console.log(`  ID=${m.id} code=${m.code} name=${m.name} type=${m.type} user=${m.user?.username || 'SIN USUARIO'}`);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
