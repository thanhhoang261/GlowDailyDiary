import { Router } from 'express';
import {
  getEntryByDate,
  saveEntry,
  deleteEntry,
  getMonthEntries,
  getStreakStats,
  getRecentEntries,
  searchEntries,
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

export default router;
