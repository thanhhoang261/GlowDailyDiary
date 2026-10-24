import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'glow_diary_super_cute_and_secret_key_2026_daily_joy';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  isAdmin?: boolean;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
    return;
  }
}

export async function adminMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = payload.userId;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, username: true, isAdmin: true },
    });

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    if (user.username === 'owner' || user.isAdmin) {
      req.isAdmin = true;
      next();
    } else {
      res.status(403).json({ message: 'Quyền truy cập bị từ chối: Yêu cầu quyền Quản trị viên (Admin)' });
      return;
    }
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
    return;
  }
}
