import { Router } from 'express';
import * as orderController from '../controllers/orderController';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware';

const router = Router();

// All order routes require a valid session token and authorized roles
router.use(authenticateToken);
router.use(requireRoles('ADMIN', 'MACHINE', 'VENDEDOR'));

// Creation, deletion and financial cost stats require ADMIN
router.post('/', requireRoles('ADMIN', 'VENDEDOR'), orderController.createOrder);
router.delete('/:id', requireRoles('ADMIN'), orderController.deleteOrder);
router.put('/:id', requireRoles('ADMIN', 'VENDEDOR'), orderController.updateOrder);
router.get('/stats/costs', requireRoles('ADMIN'), orderController.getCostStats);
router.post('/:id/reopen', requireRoles('ADMIN'), orderController.reopenFinishedOrder);

// Export and stats
router.get('/export-csv', requireRoles('ADMIN'), orderController.exportOrdersCSV);
router.get('/export-alegon/factura', requireRoles('ADMIN'), orderController.exportAlegonFacturaPalm);
router.get('/export-alegon/detalle', requireRoles('ADMIN'), orderController.exportAlegonDetallePalm);
router.get('/stats', orderController.getDashboardStats);
router.get('/', orderController.getAllOrders);

// Stage and order execution (accessible by ADMIN and MACHINE)
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
router.post('/:id/stage-action', orderController.updateStageAction);
router.post('/:id/finalize', orderController.finalizeOrder);
router.post('/:id/consumptions', orderController.registerConsumptions);
router.patch('/:id/status', orderController.changeStatus);

export default router;
