import { Router } from 'express';
import * as exportController from '../controllers/exportController';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);
router.use(requireRoles('ADMIN'));

router.get('/clients', exportController.exportClients);
router.get('/stock', exportController.exportStock);
router.get('/products', exportController.exportProducts);

export default router;
