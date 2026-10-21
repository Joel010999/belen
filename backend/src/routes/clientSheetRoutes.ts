import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware';
import * as controller from '../controllers/clientSheetController';

const router = Router();

// Todas las rutas de hojas de clientes requieren token autenticado y rol ADMIN o ENCARGADO_PLANTA
router.use(authenticateToken);
router.use(requireRoles('ADMIN', 'ENCARGADO_PLANTA'));

// Resumen de clientes con conteo de hojas (para la pantalla principal)
router.get('/clients-summary', controller.getClientsSummary);

// Historial de auditoría específico de hojas técnicas
router.get('/audit', controller.getClientSheetAudit);

// Listado de hojas con filtros
router.get('/', controller.getClientSheets);

// Detalle por ID
router.get('/:id', controller.getClientSheetById);

// Alta de nueva hoja técnica
router.post('/', controller.createClientSheet);

// Edición de hoja técnica
router.put('/:id', controller.updateClientSheet);

// Duplicar hoja técnica como base
router.post('/:id/duplicate', controller.duplicateClientSheet);

// Archivado seguro
router.delete('/:id', controller.archiveClientSheet);
router.patch('/:id/archive', controller.archiveClientSheet);

export default router;
