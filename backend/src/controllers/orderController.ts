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

export const getCostStats = async (req: Request, res: Response) => {
  try {
    const stats = await orderService.getCostStats();
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
    res.setHeader('Content-Disposition', 'attachment; filename=ordenes_silcar.csv');
    res.send(content);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const changeStatus = async (req: Request, res: Response) => {
  try {
    const order = await orderService.changeStatus(parseInt(req.params.id as string), req.body.status);
    res.json(order);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getChecklists = async (req: Request, res: Response) => {
  try {
    const checklists = await orderService.getChecklists(parseInt(req.params.orderId as string));
    res.json(checklists);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const saveChecklist = async (req: Request, res: Response) => {
  try {
    const checklist = await orderService.saveChecklist(req.body);
    res.status(201).json(checklist);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getQualityControls = async (req: Request, res: Response) => {
  try {
    const controls = await orderService.getQualityControls(parseInt(req.params.orderId as string));
    res.json(controls);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const saveQualityControl = async (req: Request, res: Response) => {
  try {
    const control = await orderService.saveQualityControl(req.body);
    res.status(201).json(control);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const registerConsumptions = async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id as string);
    const result = await orderService.registerConsumptions(orderId, req.body);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
