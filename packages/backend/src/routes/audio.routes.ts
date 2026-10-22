import { Router } from 'express';
import {
  uploadAudioMiddleware,
  uploadAudioForEntry,
  streamAudio,
  deleteAudioForDate,
} from '../controllers/audio.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Stream audio: can be accessed with token query param or public for media tags
router.get('/:filename', streamAudio);

// Upload & delete require auth
router.post('/upload', authMiddleware, uploadAudioMiddleware, uploadAudioForEntry);
router.delete('/:date', authMiddleware, deleteAudioForDate);

export default router;
