import { Router } from 'express';
import * as exportController from '../controllers/exportController';

const router = Router();

router.get('/clients', exportController.exportClients);
router.get('/stock', exportController.exportStock);
router.get('/products', exportController.exportProducts);

export default router;
