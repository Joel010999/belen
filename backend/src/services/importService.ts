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

              // Si hay valor en la columna 5 (classification), lo tomamos como stock inicial
              const initialStock = parseFloat(row.classification?.trim() || '0');
              if (initialStock > 0) {
                await prisma.currentStock.upsert({
                  where: { supplyId: supply.id },
                  update: { stockActual: initialStock, lastUpdate: new Date() },
                  create: { supplyId: supply.id, stockActual: initialStock, itemType: 'INSUMO', unit: 'UN' }
                });
              }
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

              // Stock inicial desde la columna 5
              const initialStock = parseFloat(row.classification?.trim() || '0');
              if (initialStock > 0) {
                await prisma.currentStock.upsert({
                  where: { productId: product.id },
                  update: { stockActual: initialStock, lastUpdate: new Date() },
                  create: { productId: product.id, stockActual: initialStock, itemType: 'PRODUCTO', unit: 'UN' }
                });
              }
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
  let read = 0, updated = 0, errors = 0;
  let errorLog = "";

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ';', headers: ['deposito', 'code', 'stock'] }))
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        read = results.length;
        for (const row of results) {
          try {
            const code = row.code?.trim();
            const stockActual = parseFloat(row.stock?.trim() || '0');

            if (!code) continue;

            // Buscar en Productos
            const product = await prisma.product.findUnique({ where: { code } });
            if (product) {
              await prisma.currentStock.upsert({
                where: { productId: product.id },
                update: { stockActual, lastUpdate: new Date() },
                create: { productId: product.id, stockActual, itemType: 'PRODUCTO', unit: product.unit }
              });
              updated++;
            } else {
              // Buscar en Insumos/Materiales
              const supply = await prisma.supply.findUnique({ where: { code } });
              if (supply) {
                await prisma.currentStock.upsert({
                  where: { supplyId: supply.id },
                  update: { stockActual, lastUpdate: new Date() },
                  create: { supplyId: supply.id, stockActual, itemType: 'INSUMO', unit: supply.unit }
                });
                updated++;
              } else {
                // No existe ni como producto ni como insumo
                errorLog += `Código ${code} no encontrado en maestros de productos ni insumos.\n`;
                errors++;
              }
            }
          } catch (err: any) {
            errors++;
            errorLog += `Error en fila ${row.code}: ${err.message}\n`;
          }
        }

        const log = await prisma.importLog.create({
          data: {
            userId,
            entityType: 'STOCK',
            fileName: filePath.split('/').pop() || 'unknown',
            readCount: read,
            insertedCount: 0,
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
