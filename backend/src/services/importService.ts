import fs from 'fs';
import csv from 'csv-parser';
import { prisma } from '../index';

// Configuración de códigos específicos para clasificación
// Estos códigos de 6 dígitos determinan si un artículo es Insumo o Material
const INSUMO_CODES = ['013434', '002001']; 
const MATERIAL_CODES = ['021434']; 

export const importClients = async (filePath: string, userId: number) => {
  const results: any[] = [];
  let read = 0, inserted = 0, updated = 0, errors = 0;
  let errorLog = "";

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ';', headers: ['code', 'name', 'address', 'cuit', 'col4', 'col5', 'typeIndicator', 'zip'] }))
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        read = results.length;
        
        // Reemplazo completo: borrar todos los clientes existentes
        await prisma.client.deleteMany({});
        
        for (const row of results) {
          try {
            const code = row.code?.trim();
            const name = row.name?.trim();
            if (!code || !name) continue;

            const existing = await prisma.client.findUnique({ where: { code } });
            if (existing) {
              await prisma.client.update({
                where: { code },
                data: { name }
              });
              updated++;
            } else {
              await prisma.client.create({
                data: { code, name }
              });
              inserted++;
            }
          } catch (err: any) {
            errors++;
            errorLog += `Error en fila ${row.code}: ${err.message}\n`;
          }
        }

        const log = await prisma.importLog.create({
          data: {
            userId,
            entityType: 'CLIENTE',
            fileName: filePath.split('/').pop() || 'unknown',
            readCount: read,
            insertedCount: inserted,
            updatedCount: updated,
            errorCount: errors,
            errorLog,
            status: errors > 0 ? 'CON_ERRORES' : 'EXITOSO'
          }
        });

        resolve(log);
      })
      .on('error', reject);
  });
};

export const importProducts = async (filePath: string, userId: number) => {
  const results: any[] = [];
  let read = 0, inserted = 0, updated = 0, errors = 0;
  let errorLog = "";

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ';', headers: ['code', 'group', 'name', 'groupCode', 'classification', 'indicator'] }))
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        read = results.length;

        // Reemplazo completo: borrar stock, productos e insumos existentes
        await prisma.currentStock.deleteMany({});
        await prisma.product.deleteMany({});
        await prisma.supply.deleteMany({});

        for (const row of results) {
          try {
            const code = row.code?.trim();
            const name = row.name?.trim();
            const groupCode = row.groupCode?.trim();

            if (!code || !name) continue;

            // Lógica de clasificación
            const isInsumo = INSUMO_CODES.includes(groupCode);
            const isMaterial = MATERIAL_CODES.includes(groupCode);

            if (isInsumo || isMaterial) {
              const type = isInsumo ? 'INSUMO' : 'MATERIAL';
              const existing = await prisma.supply.findUnique({ where: { code } });
              const data = { code, name, type, unit: 'UN' };
              let supply;
              if (existing) {
                supply = await prisma.supply.update({ where: { code }, data });
                updated++;
              } else {
                supply = await prisma.supply.create({ data });
                inserted++;
              }

              // Stock por defecto en cero al importar catálogo
              await prisma.currentStock.upsert({
                where: { supplyId: supply.id },
                update: { stockActual: 0, lastUpdate: new Date() },
                create: { supplyId: supply.id, stockActual: 0, itemType: type, unit: 'UN' }
              });
            } else {
              const existing = await prisma.product.findUnique({ where: { code } });
              const data = { code, name, unit: 'UN', description: row.group?.trim() };
              let product;
              if (existing) {
                product = await prisma.product.update({ where: { code }, data });
                updated++;
              } else {
                product = await prisma.product.create({ data });
                inserted++;
              }

              // Stock por defecto en cero al importar catálogo
              await prisma.currentStock.upsert({
                where: { productId: product.id },
                update: { stockActual: 0, lastUpdate: new Date() },
                create: { productId: product.id, stockActual: 0, itemType: 'PRODUCTO', unit: 'UN' }
              });
            }
          } catch (err: any) {
            errors++;
            errorLog += `Error en fila ${row.code}: ${err.message}\n`;
          }
        }

        const log = await prisma.importLog.create({
          data: {
            userId,
            entityType: 'PRODUCTO',
            fileName: filePath.split('/').pop() || 'unknown',
            readCount: read,
            insertedCount: inserted,
            updatedCount: updated,
            errorCount: errors,
            errorLog,
            status: errors > 0 ? 'CON_ERRORES' : 'EXITOSO'
          }
        });

        resolve(log);
      })
      .on('error', reject);
  });
};

export const importStock = async (filePath: string, userId: number) => {
  const results: any[] = [];
  let read = 0, inserted = 0, autoCreated = 0, errors = 0;
  let errorLog = "";

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ';', headers: ['deposito', 'code', 'stock'] }))
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        read = results.length;

        // Reemplazo completo: borrar todo el stock existente
        await prisma.currentStock.deleteMany({});

        for (const row of results) {
          try {
            const code = row.code?.trim();
            const stockActual = parseFloat(row.stock?.trim() || '0');

            if (!code) continue;

            // Buscar en Productos
            let product = await prisma.product.findUnique({ where: { code } });
            if (product) {
              await prisma.currentStock.upsert({
                where: { productId: product.id },
                update: { stockActual, lastUpdate: new Date() },
                create: { productId: product.id, stockActual, itemType: 'PRODUCTO', unit: product.unit }
              });
              inserted++;
            } else {
              // Buscar en Insumos/Materiales
              const supply = await prisma.supply.findUnique({ where: { code } });
              if (supply) {
                await prisma.currentStock.upsert({
                  where: { supplyId: supply.id },
                  update: { stockActual, lastUpdate: new Date() },
                  create: { supplyId: supply.id, stockActual, itemType: 'INSUMO', unit: supply.unit }
                });
                inserted++;
              } else {
                // No existe: crear producto automáticamente
                product = await prisma.product.create({
                  data: { code, name: `Producto ${code}`, unit: 'UN' }
                });
                await prisma.currentStock.create({
                  data: { productId: product.id, stockActual, itemType: 'PRODUCTO', unit: 'UN' }
                });
                autoCreated++;
                inserted++;
              }
            }
          } catch (err: any) {
            errors++;
            errorLog += `Error en fila ${row.code}: ${err.message}\n`;
          }
        }

        if (autoCreated > 0) {
          errorLog = `Se crearon automáticamente ${autoCreated} productos nuevos (no existían en maestros).\n${errorLog}`;
        }

        const log = await prisma.importLog.create({
          data: {
            userId,
            entityType: 'STOCK',
            fileName: filePath.split('/').pop() || 'unknown',
            readCount: read,
            insertedCount: inserted,
            updatedCount: autoCreated,
            errorCount: errors,
            errorLog,
            status: errors > 0 ? 'CON_ERRORES' : 'EXITOSO'
          }
        });

        resolve(log);
      })
      .on('error', reject);
  });
};
