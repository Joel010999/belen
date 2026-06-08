import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      username: true,
      name: true,
      role: true,
      passwordHash: true // Solo para fines de recuperación si el administrador lo pide, aunque normalmente esto es privado. Lo incluyo para dar la info al owner.
    }
  });
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
