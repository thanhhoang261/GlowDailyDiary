import { Router } from 'express';
import { register, login, getMe, updateProfile, resetPassword } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword);
router.get('/me', authMiddleware, getMe);
router.patch('/profile', authMiddleware, updateProfile);

export default router;
