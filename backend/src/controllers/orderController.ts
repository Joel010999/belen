import { Request, Response } from 'express';
import * as orderService from '../services/orderService';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const order = await orderService.createOrder(req.body);
    res.status(201).json(order);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  try {
    const order = await orderService.updateOrder(parseInt(req.params.id as string), req.body);
    res.json(order);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const machineId = req.headers['x-machine-id'] ? parseInt(req.headers['x-machine-id'] as string) : undefined;
    const orders = await orderService.getAllOrders(machineId);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await orderService.getOrderById(parseInt(req.params.id as string));
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createProcess = async (req: Request, res: Response) => {
  try {
    const process = await orderService.createProcess(req.body);
    res.status(201).json(process);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const machineId = req.headers['x-machine-id'] ? parseInt(req.headers['x-machine-id'] as string) : undefined;
    const stats = await orderService.getDashboardStats(machineId);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const finalizeOrder = async (req: Request, res: Response) => {
  try {
    const order = await orderService.finalizeOrder(parseInt(req.params.id as string));
    res.json(order);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    await orderService.deleteOrder(parseInt(req.params.id as string));
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const exportOrdersCSV = async (req: Request, res: Response) => {
  try {
    const csv = await orderService.exportOrdersCSV();
    // Prepend UTF-8 BOM for Excel
    const bom = Buffer.from('\uFEFF', 'utf-8');
    const content = Buffer.concat([bom, Buffer.from(csv, 'utf-8')]);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=ordenes_belen.csv');
    res.send(content);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
