import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import {
  generateGoogleAuthUrl,
  handleGoogleOAuthCallback,
  disconnectUserGoogleDrive,
  backupUserToPersonalDrive,
  getLatestUserBackup,
  createPerUserBackupZip,
  getUserBackupStatus,
  isOAuthAppConfigured,
} from '../services/backup.service.js';
import { prisma } from '../prisma.js';
import fs from 'fs';

// Get Google OAuth Redirect URL for the logged-in user
export async function getAuthUrl(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!isOAuthAppConfigured()) {
      res.status(400).json({
        message:
          'Google OAuth is not configured on this server. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to backend .env.',
      });
      return;
    }

    const url = generateGoogleAuthUrl(req.userId!);
    res.json({ url });
  } catch (error: any) {
    console.error('getAuthUrl error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate auth url' });
  }
}

// Google OAuth callback endpoint (Google redirects user here after consent)
export async function googleOAuthCallback(req: Request, res: Response): Promise<void> {
  try {
    const code = req.query.code as string;
    const userId = req.query.state as string;

    const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const clientUrl = rawClientUrl.replace(/\/+$/, '');

    if (!code || !userId) {
      res.redirect(`${clientUrl}/?drive_connected=error&reason=missing_code_or_user`);
      return;
    }

    await handleGoogleOAuthCallback(code, userId);
    res.redirect(`${clientUrl}/?drive_connected=success`);
  } catch (error: any) {
    console.error('googleOAuthCallback error:', error);
    const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const clientUrl = rawClientUrl.replace(/\/+$/, '');
    res.redirect(`${clientUrl}/?drive_connected=error&reason=${encodeURIComponent(error.message)}`);
  }
}

// Disconnect Google Drive
export async function disconnectDrive(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    await disconnectUserGoogleDrive(req.userId!);
    res.json({ success: true, message: 'Google Drive disconnected successfully' });
  } catch (error: any) {
    console.error('disconnectDrive error:', error);
    res.status(500).json({ message: error.message || 'Failed to disconnect Google Drive' });
  }
}

// Trigger manual backup for logged in user
export async function triggerUserBackup(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const result = await backupUserToPersonalDrive(req.userId!);
    res.json(result);
  } catch (error: any) {
    console.error('triggerUserBackup error:', error);
    res.status(500).json({ success: false, message: error.message || 'Backup failed' });
  }
}

// Download personal backup zip
export async function downloadUserBackup(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    let latest = getLatestUserBackup(req.userId!);

    if (!latest || !fs.existsSync(latest.filePath)) {
      const created = await createPerUserBackupZip(req.userId!);
      latest = created;
    }

    res.download(latest.filePath, latest.filename, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
    });
  } catch (error: any) {
    console.error('downloadUserBackup error:', error);
    res.status(500).json({ message: 'Error generating personal backup' });
  }
}

// Get user backup status
export async function getUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const status = await getUserBackupStatus(req.userId!);
    res.json(status);
  } catch (error: any) {
    console.error('getUserStatus error:', error);
    res.status(500).json({ message: 'Error getting user backup status' });
  }
}

// Update backup settings (e.g. toggle autoBackupEnabled)
export async function updateBackupSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { autoBackupEnabled } = req.body;

    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: {
        ...(typeof autoBackupEnabled === 'boolean' ? { autoBackupEnabled } : {}),
      },
    });

    res.json({
      success: true,
      autoBackupEnabled: user.autoBackupEnabled,
    });
  } catch (error: any) {
    console.error('updateBackupSettings error:', error);
    res.status(500).json({ message: 'Error updating backup settings' });
  }
}
