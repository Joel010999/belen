import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './lib/prisma';
import importRoutes from './routes/importRoutes';
import orderRoutes from './routes/orderRoutes';
import authRoutes from './routes/authRoutes';
import exportRoutes from './routes/exportRoutes';
import clientSheetRoutes from './routes/clientSheetRoutes';
import { getCurrentUsdExchangeRate, saveManualUsdExchangeRate } from './services/exchangeRateService';
import { authenticateToken, requireRoles } from './middleware/authMiddleware';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env.local') });
dotenv.config();

const app = express();


const port = process.env.PORT || 3001;

// Configuración de CORS: En producción limita estrictamente a CORS_ORIGIN
const allowedCorsOrigin = process.env.CORS_ORIGIN;
app.use(cors({
  origin: process.env.NODE_ENV === 'production' && allowedCorsOrigin
    ? allowedCorsOrigin.split(',').map(o => o.trim())
    : true,
  credentials: true
}));

app.use(express.json());

// Health check seguro: no expone credenciales, hosts ni detalles de base de datos
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'silcar-backend', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/import', importRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/client-sheets', clientSheetRoutes);

// Master Data Routes (Authenticated users can read basic client list)
app.get('/api/clients', authenticateToken, async (req, res) => res.json(await prisma.client.findMany()));

// Ficha Tecnica por Cliente (Persistencia mediante SystemSetting aislada)
app.get('/api/clients/:id/technical-sheet', authenticateToken, async (req, res) => {
  const clientId = parseInt(String(req.params.id));
  if (isNaN(clientId)) return res.status(400).json({ error: 'ID de cliente inválido' });
  try {
    const key = `client_technical_sheet_${clientId}`;
    const setting = await prisma.systemSetting.findUnique({ where: { key } });
    if (!setting) {
      return res.json({ clientId, content: '', updatedAt: null });
    }
    const parsed = JSON.parse(setting.value);
    res.json({ clientId, content: parsed.content || '', updatedAt: setting.updatedAt });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/clients/:id/technical-sheet', authenticateToken, requireRoles('ADMIN', 'VENDEDOR'), async (req, res) => {
  const clientId = parseInt(String(req.params.id));
  if (isNaN(clientId)) return res.status(400).json({ error: 'ID de cliente inválido' });
  const { content } = req.body;
  try {
    const key = `client_technical_sheet_${clientId}`;
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: JSON.stringify({ content: String(content || '') }) },
      create: { key, value: JSON.stringify({ content: String(content || '') }) }
    });
    res.json({ clientId, content: String(content || ''), updatedAt: setting.updatedAt });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
app.get('/api/products', authenticateToken, requireRoles('ADMIN', 'MACHINE', 'VENDEDOR'), async (req, res) => res.json(await prisma.product.findMany({ include: { stock: true } })));
app.get('/api/machines', authenticateToken, requireRoles('ADMIN', 'MACHINE', 'VENDEDOR'), async (req, res) => res.json(await prisma.machine.findMany()));
app.get('/api/operators', authenticateToken, requireRoles('ADMIN', 'MACHINE', 'VENDEDOR'), async (req, res) => res.json(await prisma.operator.findMany()));
app.get('/api/supplies', authenticateToken, requireRoles('ADMIN', 'MACHINE', 'VENDEDOR'), async (req, res) => res.json(await prisma.supply.findMany({ include: { stock: true } })));

app.get('/api/exchange-rate/usd-official', authenticateToken, async (req, res) => {
  try {
    res.json(await getCurrentUsdExchangeRate());
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/exchange-rate/usd-official', authenticateToken, requireRoles('ADMIN'), async (req, res) => {
  try {
    res.json(await saveManualUsdExchangeRate(req.body?.rate));
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/stock/config', authenticateToken, requireRoles('ADMIN'), async (req, res) => {
  const { productId, supplyId, itemType, unit, minStock } = req.body;
  try {
    const updated = await prisma.currentStock.upsert({
      where: productId ? { productId: parseInt(productId) } : { supplyId: parseInt(supplyId) },
      update: { minStock: parseFloat(minStock) },
      create: {
        productId: productId ? parseInt(productId) : null,
        supplyId: supplyId ? parseInt(supplyId) : null,
        itemType,
        unit,
        minStock: parseFloat(minStock),
        stockActual: 0
      }
    });
    res.json(updated);
  } catch(e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/stock/price', authenticateToken, requireRoles('ADMIN'), async (req, res) => {
  const { productId, supplyId, price } = req.body;
  try {
    const parsedPrice = price === '' || price === null || price === undefined
      ? null
      : parseFloat(String(price).replace(',', '.'));

    if (parsedPrice !== null && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
      return res.status(400).json({ error: 'El precio debe ser cero o mayor' });
    }

    if (productId) {
      return res.json(await prisma.product.update({
        where: { id: parseInt(productId) },
        data: { price: parsedPrice }
      }));
    }

    if (supplyId) {
      return res.json(await prisma.supply.update({
        where: { id: parseInt(supplyId) },
        data: { price: parsedPrice }
      }));
    }

    res.status(400).json({ error: 'Debe indicar producto o insumo' });
  } catch(e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/audit', authenticateToken, requireRoles('ADMIN', 'ENCARGADO_PLANTA'), async (req: any, res) => {
  try {
    const isEncargado = (req.user?.role || '').toUpperCase() === 'ENCARGADO_PLANTA';
    const where = isEncargado ? { entity: { in: ['ClientSheet', 'ClientSheetBody'] } } : {};
    const logs = await prisma.systemAuditLog.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 1000 // limit to last 1000 for performance
    });
    res.json(logs);
  } catch(e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/audit/export', authenticateToken, requireRoles('ADMIN'), async (req, res) => {
  try {
    const logs = await prisma.systemAuditLog.findMany({
      orderBy: { date: 'desc' }
    });
    
    const header = 'Fecha;Accion;Entidad;Usuario ID;Detalles\n';
    const rows = logs.map(l => {
      const dateStr = l.date.toISOString();
      const detailsStr = l.details ? String(l.details).replace(/;/g, ',').replace(/\n/g, ' ') : '';
      return `${dateStr};${l.action};${l.entity};${l.userId || l.userStr || 'Sistema'};${detailsStr}`;
    }).join('\n');
    
    const bom = Buffer.from('\uFEFF', 'utf-8');
    const content = Buffer.concat([bom, Buffer.from(header + rows, 'utf-8')]);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=auditoria_silcar.csv');
    res.send(content);
  } catch(e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/audit', authenticateToken, requireRoles('ADMIN'), async (req, res) => {
  try {
    await prisma.systemAuditLog.deleteMany({});
    res.json({ message: 'Historial de auditoría vaciado' });
  } catch(e: any) {
    res.status(500).json({ error: e.message });
  }
});
app.listen(port, () => {
  console.log(`Silcar Backend running on port ${port}`);
});

export { prisma };
