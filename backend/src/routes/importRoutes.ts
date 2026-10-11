import { Router } from 'express';
import multer from 'multer';
import { uploadCSV } from '../controllers/importController';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', authenticateToken, requireRoles('ADMIN'), upload.single('file'), uploadCSV);

export default router;
