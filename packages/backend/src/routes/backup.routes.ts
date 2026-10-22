import { Router } from 'express';
import {
  getAuthUrl,
  googleOAuthCallback,
  disconnectDrive,
  triggerUserBackup,
  downloadUserBackup,
  getUserStatus,
  updateBackupSettings,
} from '../controllers/backup.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Public Google OAuth redirect callback
router.get('/google/callback', googleOAuthCallback);

// All other backup routes require user login
router.use(authMiddleware);

router.get('/google/auth-url', getAuthUrl);
router.post('/google/disconnect', disconnectDrive);
router.post('/now', triggerUserBackup);
router.get('/download', downloadUserBackup);
router.get('/status', getUserStatus);
router.patch('/settings', updateBackupSettings);

export default router;
