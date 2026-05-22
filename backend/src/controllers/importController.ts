import { Request, Response } from 'express';
import { importClients, importProducts, importStock } from '../services/importService';

export const uploadCSV = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { type, userId } = req.body;

    let result;
    if (type === 'CLIENTE') {
      result = await importClients(req.file.path, parseInt(userId));
    } else if (type === 'PRODUCTO' || type === 'INSUMO') {
      result = await importProducts(req.file.path, parseInt(userId));
    } else if (type === 'STOCK') {
      result = await importStock(req.file.path, parseInt(userId));
    } else {
      return res.status(400).json({ error: 'Entity type not supported yet' });
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
