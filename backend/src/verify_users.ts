import prisma from './lib/prisma';

async function main() {
  const users = await prisma.user.findMany({
    select: {
      username: true,
      passwordHash: true,
      role: true
    }
  });
  console.log('--- USUARIOS EN DB ---');
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
