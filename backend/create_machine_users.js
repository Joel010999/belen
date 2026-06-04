const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createMachineUsers() {
  try {
    const machines = await prisma.machine.findMany();
    console.log(`Found ${machines.length} machines`);

    let createdCount = 0;
    for (const machine of machines) {
      // Check if user already exists for this machine
      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ machineId: machine.id }, { username: machine.code.toLowerCase() }] }
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            username: machine.code.toLowerCase(),
            passwordHash: 'hash', // default password
            name: `Máquina ${machine.name}`,
            role: 'MACHINE',
            machineId: machine.id,
            active: true
          }
        });
        console.log(`Created user for machine ${machine.name} (username: ${machine.code.toLowerCase()})`);
        createdCount++;
      } else {
        console.log(`User already exists for machine ${machine.name}`);
      }
    }
    console.log(`Finished. Created ${createdCount} new users.`);
  } catch (error) {
    console.error('Error creating machine users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMachineUsers();
