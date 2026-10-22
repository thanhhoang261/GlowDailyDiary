import { Router } from 'express';
import {
  triggerBackup,
  downloadLatestBackup,
  getStatus,
} from '../controllers/backup.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Protected with JWT auth
router.use(authMiddleware);

router.post('/now', triggerBackup);
router.get('/download', downloadLatestBackup);
router.get('/status', getStatus);

export default router;
