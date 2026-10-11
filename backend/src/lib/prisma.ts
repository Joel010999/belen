import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env.local') });
dotenv.config();

import { PrismaClient } from '@prisma/client';

function getSilcarDatabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  try {
    const parsed = new URL(rawUrl);
    if (!parsed.searchParams.has('schema')) {
      parsed.searchParams.set('schema', 'silcar');
    }
    return parsed.toString();
  } catch {
    if (rawUrl.includes('schema=')) return rawUrl;
    return rawUrl.includes('?') ? `${rawUrl}&schema=silcar` : `${rawUrl}?schema=silcar`;
  }
}

const rawDbUrl = process.env.DATABASE_URL || '';
const silcarDbUrl = getSilcarDatabaseUrl(rawDbUrl);

const basePrisma = new PrismaClient({
  datasources: {
    db: { url: silcarDbUrl }
  }
});

const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const result = await query(args);
        
        const mutations = ['create', 'update', 'delete', 'upsert', 'createMany', 'updateMany', 'deleteMany'];
        if (mutations.includes(operation) && model !== 'SystemAuditLog') {
          try {
             // Intento de extraer el userId si viene en los datos
             let extractedUserId: number | null = null;
             const dataObj: any = (args as any)?.data || {};
             if (dataObj && typeof dataObj === 'object') {
               if (dataObj.userId) extractedUserId = parseInt(dataObj.userId);
               else if (dataObj.creatorId) extractedUserId = parseInt(dataObj.creatorId);
               else if (dataObj.operatorId) extractedUserId = parseInt(dataObj.operatorId);
             }

             // Para upserts/updates, extraer del where si es posible y no se encontró en data
             if (!extractedUserId && operation === 'update' && (args as any)?.where) {
               const w: any = (args as any).where;
               if (model === 'User' && w.id) extractedUserId = parseInt(w.id);
             }

             await basePrisma.systemAuditLog.create({
               data: {
                 action: operation.toUpperCase(),
                 entity: model || 'Unknown',
                 details: JSON.stringify(args),
                 userId: extractedUserId
               }
             });
          } catch(e) {
            console.error("Failed to write to SystemAuditLog:", e);
          }
        }
        return result;
      }
    }
  }
});

// Polyfill for operations that might expect an unextended prisma in older setups or specific types
export default prisma as any;
