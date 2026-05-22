import prisma from '../lib/prisma';

export const exportClientsCSV = async () => {
  const clients = await prisma.client.findMany({
    orderBy: { name: 'asc' }
  });

  const header = ['Código', 'Nombre', 'Dirección', 'CUIT'].join(';');
  const rows = clients.map(c => [
    c.code,
    c.name,
    '', // address not in schema yet but in import?
    ''  // cuit not in schema yet
  ].map(val => `"${val || ''}"`).join(';'));

  return [header, ...rows].join('\n');
};

export const exportStockCSV = async () => {
  const stock = await prisma.currentStock.findMany({
    include: {
      product: true,
      supply: true
    }
  });

  const header = ['Tipo', 'Código', 'Nombre', 'Stock Actual', 'Unidad', 'Última Actualización'].join(';');
  const rows = stock.map(s => {
    const item = s.product || s.supply;
    return [
      s.itemType,
      item?.code || '',
      item?.name || '',
      s.stockActual,
      s.unit,
      s.lastUpdate.toLocaleString()
    ].map(val => `"${val}"`).join(';');
  });

  return [header, ...rows].join('\n');
};

export const exportProductsCSV = async () => {
  const products = await prisma.product.findMany({
    include: { stock: true }
  });
  const supplies = await prisma.supply.findMany({
    include: { stock: true }
  });

  const header = ['Tipo', 'Código', 'Nombre', 'Descripción', 'Unidad', 'Stock'].join(';');
  
  const pRows = products.map(p => [
    'PRODUCTO',
    p.code,
    p.name,
    p.description || '',
    p.unit,
    p.stock?.stockActual || 0
  ].map(val => `"${val}"`).join(';'));

  const sRows = supplies.map(s => [
    s.type,
    s.code,
    s.name,
    '',
    s.unit,
    s.stock?.stockActual || 0
  ].map(val => `"${val}"`).join(';'));

  return [header, ...pRows, ...sRows].join('\n');
};
