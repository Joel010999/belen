import path from 'path';
import { importClients, importProducts, importStock } from '../services/importService';
import { prisma } from '../index';

async function run() {
  console.log('🚀 Iniciando importación manual de datos de SilCar...');
  
  const userId = 1; // Admin user
  const basePath = path.join(__dirname, '../../..', 'import_data');

  try {
    // 1. Clientes
    console.log('--- Importando Clientes ---');
    const clientFile = path.join(basePath, 'cliente.TXT');
    const clientResult = await importClients(clientFile, userId);
    console.log('Resultado Clientes:', clientResult);

    // 2. Productos y Precios
    console.log('\n--- Importando Productos/Precios ---');
    const productFile = path.join(basePath, 'Precios_Web.TXT');
    const productResult = await importProducts(productFile, userId);
    console.log('Resultado Productos:', productResult);

    // 3. Stock
    console.log('\n--- Importando Stock ---');
    const stockFile = path.join(basePath, 'stock_Web.TXT');
    const stockResult = await importStock(stockFile, userId);
    console.log('Resultado Stock:', stockResult);

    console.log('\n✅ Importación completada con éxito.');
  } catch (error) {
    console.error('\n❌ Error durante la importación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
