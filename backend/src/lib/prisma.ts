import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

// For local development on this machine, we use the SQLite adapter
const adapter = new PrismaBetterSqlite3({ 
  url: "file:./dev.db" 
});

// For production/PostgreSQL, we would use a standard PrismaClient without adapter
// const prisma = new PrismaClient();

const prisma = new PrismaClient({ adapter });

export default prisma;
