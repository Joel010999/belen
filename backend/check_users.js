const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findMany().then(u => {
  console.log('Users:', u);
}).catch(e => {
  console.error(e);
}).finally(() => {
  p.$disconnect();
});
