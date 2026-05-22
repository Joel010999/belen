import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Users:', users);
  
  const machines = await prisma.machine.findMany();
  console.log('Machines count:', machines.length);
  
  const operators = await prisma.operator.findMany();
  console.log('Operators count:', operators.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
