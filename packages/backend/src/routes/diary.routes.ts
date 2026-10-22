import { Router } from 'express';
import {
  getEntryByDate,
  saveEntry,
  deleteEntry,
  getMonthEntries,
  getStreakStats,
  getRecentEntries,
  searchEntries,
  reviewEntryWithAi,
  getAiConfigController,
  setAiKeyController,
} from '../controllers/diary.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All diary routes require authentication
router.use(authMiddleware);

router.get('/entry/:date', getEntryByDate);
router.post('/entry', saveEntry);
router.delete('/entry/:date', deleteEntry);
router.get('/month', getMonthEntries);
router.get('/streak', getStreakStats);
router.get('/recent', getRecentEntries);
router.get('/search', searchEntries);

// AI Review & Key Management
router.post('/ai/review', reviewEntryWithAi);
router.get('/ai/config', getAiConfigController);
router.post('/ai/key', setAiKeyController);

export default router;
