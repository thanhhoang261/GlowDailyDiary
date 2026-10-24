import { Router } from 'express';
import { adminMiddleware } from '../middleware/auth.js';
import {
  getAdminOverview,
  vacuumDatabase,
  cleanOrphanAudio,
  testOpenAiConnection,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  resetUserPasswordAdmin,
  deleteAdminUser,
  getAdminEntries,
  deleteAdminEntry,
  exportAllEntriesJson,
  getAdminAudioFiles,
  deleteAdminAudioFile,
  getAdminBackups,
  createAdminBackup,
  downloadAdminBackup,
  deleteAdminBackup,
  downloadLiveDatabase,
} from '../controllers/admin.controller.js';

const router = Router();

// Protect all admin endpoints with adminMiddleware
router.use(adminMiddleware);

// 1. Overview & Maintenance
router.get('/overview', getAdminOverview);
router.post('/maintenance/vacuum', vacuumDatabase);
router.post('/maintenance/clean-audio', cleanOrphanAudio);
router.post('/test-openai', testOpenAiConnection);

// 2. User Management
router.get('/users', getAdminUsers);
router.post('/users', createAdminUser);
router.patch('/users/:id', updateAdminUser);
router.post('/users/:id/reset-password', resetUserPasswordAdmin);
router.delete('/users/:id', deleteAdminUser);

// 3. Entries Management
router.get('/entries', getAdminEntries);
router.delete('/entries/:id', deleteAdminEntry);
router.get('/entries/export', exportAllEntriesJson);

// 4. Audio Management
router.get('/audio-files', getAdminAudioFiles);
router.delete('/audio-files/:filename', deleteAdminAudioFile);

// 5. Backups & Database Management
router.get('/backups', getAdminBackups);
router.post('/backups/create', createAdminBackup);
router.get('/backups/download/:filename', downloadAdminBackup);
router.delete('/backups/:filename', deleteAdminBackup);
router.get('/database/download', downloadLiveDatabase);

export default router;
