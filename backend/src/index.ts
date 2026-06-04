import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './lib/prisma';
import importRoutes from './routes/importRoutes';
import orderRoutes from './routes/orderRoutes';
import authRoutes from './routes/authRoutes';
import exportRoutes from './routes/exportRoutes';

dotenv.config();

const app = express();


const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/import', importRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/export', exportRoutes);

// Master Data Routes
app.get('/api/clients', async (req, res) => res.json(await prisma.client.findMany()));
app.get('/api/products', async (req, res) => res.json(await prisma.product.findMany({ include: { stock: true } })));
app.get('/api/machines', async (req, res) => res.json(await prisma.machine.findMany()));
app.get('/api/operators', async (req, res) => res.json(await prisma.operator.findMany()));
app.get('/api/supplies', async (req, res) => res.json(await prisma.supply.findMany({ include: { stock: true } })));

app.put('/api/stock/config', async (req, res) => {
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
app.listen(port, () => {
  console.log(`Belen Backend running on port ${port}`);
});

export { prisma };
