import prisma from '../lib/prisma';

async function main() {
  const user = await prisma.user.upsert({
    where: { username: 'impresora2' },
    update: {},
    create: {
      username: 'impresora2',
      passwordHash: '123', // Asumiendo contraseña por defecto
      name: 'Impresora 2',
      role: 'MACHINE',
      machineId: 10,
    }
  });
  console.log('User created:', user);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
