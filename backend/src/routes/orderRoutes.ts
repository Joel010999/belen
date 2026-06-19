import { Router } from 'express';
import * as orderController from '../controllers/orderController';

const router = Router();

router.post('/', orderController.createOrder);
router.get('/export-csv', orderController.exportOrdersCSV);
router.get('/stats', orderController.getDashboardStats);
router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);
router.post('/processes', orderController.createProcess);
router.post('/:id/finalize', orderController.finalizeOrder);
router.post('/:id/consumptions', orderController.registerConsumptions);
router.delete('/:id', orderController.deleteOrder);
router.put('/:id', orderController.updateOrder);

export default router;
