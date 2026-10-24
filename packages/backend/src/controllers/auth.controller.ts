import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { UserProfile } from '@diary/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'glow_diary_super_cute_and_secret_key_2026_daily_joy';

function formatUser(user: { id: string; username: string; name: string; avatarEmoji: string; targetDailyWords: number; isAdmin?: boolean; createdAt: Date }): UserProfile {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    avatarEmoji: user.avatarEmoji,
    targetDailyWords: user.targetDailyWords,
    isAdmin: Boolean(user.isAdmin) || user.username === 'admin' || user.username === 'owner',
    createdAt: user.createdAt.toISOString(),
  };
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { username, password, name, avatarEmoji } = req.body;

    if (!username || !password || !name) {
      res.status(400).json({ message: 'Username, password and name are required' });
      return;
    }

    const trimmedUsername = username.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { username: trimmedUsername },
    });

    if (existing) {
      res.status(409).json({ message: 'Username is already taken' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        username: trimmedUsername,
        passwordHash,
        name: name.trim(),
        avatarEmoji: avatarEmoji || 'bubu-peace',
      },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error during registration' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: 'Username and password are required' });
      return;
    }

    const trimmedUsername = username.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { username: trimmedUsername },
    });

    if (!user) {
      res.status(401).json({ message: 'Invalid username or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid username or password' });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login' });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ user: formatUser(user) });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { name, avatarEmoji, targetDailyWords } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(avatarEmoji ? { avatarEmoji } : {}),
        ...(typeof targetDailyWords === 'number' ? { targetDailyWords } : {}),
      },
    });

    res.json({ user: formatUser(updated) });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error updating profile' });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { username, newPassword } = req.body;

    if (!username || !newPassword) {
      res.status(400).json({ message: 'Tài khoản và mật khẩu mới là bắt buộc' });
      return;
    }

    const trimmedUsername = username.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { username: trimmedUsername },
    });

    if (!user) {
      res.status(404).json({ message: 'Không tìm thấy tài khoản này trong hệ thống' });
      return;
    }

    if (newPassword.trim().length < 1) {
      res.status(400).json({ message: 'Mật khẩu mới không được để trống' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    const token = jwt.sign({ userId: updatedUser.id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công! ✨',
      token,
      user: formatUser(updatedUser),
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi đặt lại mật khẩu' });
  }
}
