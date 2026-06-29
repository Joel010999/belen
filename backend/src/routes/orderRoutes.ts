import { Router } from 'express';
import * as orderController from '../controllers/orderController';

const router = Router();

router.post('/', orderController.createOrder);
router.get('/export-csv', orderController.exportOrdersCSV);
router.get('/stats', orderController.getDashboardStats);
router.get('/stats/costs', orderController.getCostStats);
router.get('/', orderController.getAllOrders);
router.get('/:orderId/checklists', orderController.getChecklists);
router.post('/:orderId/checklists', orderController.saveChecklist);
router.get('/:orderId/quality-controls', orderController.getQualityControls);
router.post('/:orderId/quality-controls', orderController.saveQualityControl);
router.get('/:orderId/time-logs', orderController.getProcessTimeLogs);
router.post('/:orderId/time-logs', orderController.saveProcessTimeLog);
router.get('/:orderId/final-inspections', orderController.getFinalInspections);
router.post('/:orderId/final-inspections', orderController.saveFinalInspection);
router.get('/:id', orderController.getOrderById);
router.post('/processes', orderController.createProcess);
router.post('/:id/finalize', orderController.finalizeOrder);
router.post('/:id/consumptions', orderController.registerConsumptions);
router.delete('/:id', orderController.deleteOrder);
router.put('/:id', orderController.updateOrder);

export default router;
