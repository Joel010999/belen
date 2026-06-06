import { Request, Response } from 'express';
import * as exportService from '../services/exportService';

const sendCSV = (res: Response, csv: string, filename: string) => {
  const bom = Buffer.from('\uFEFF', 'utf-8');
  const content = Buffer.concat([bom, Buffer.from(csv, 'utf-8')]);
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(content);
};

export const exportClients = async (req: Request, res: Response) => {
  try {
    const csv = await exportService.exportClientsCSV();
    sendCSV(res, csv, 'clientes_silcar.csv');
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const exportStock = async (req: Request, res: Response) => {
  try {
    const csv = await exportService.exportStockCSV();
    sendCSV(res, csv, 'stock_silcar.csv');
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const exportProducts = async (req: Request, res: Response) => {
  try {
    const csv = await exportService.exportProductsCSV();
    sendCSV(res, csv, 'productos_precios_silcar.csv');
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
