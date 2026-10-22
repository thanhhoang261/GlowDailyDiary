import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import {
  runFullBackup,
  getLatestBackupZip,
  getBackupStatus,
  createLocalBackupZip,
} from '../services/backup.service.js';
import fs from 'fs';

export async function triggerBackup(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const result = await runFullBackup();
    res.json({
      success: true,
      message: result.googleDriveUploaded
        ? 'Backup created and uploaded to Google Drive successfully! ☁️'
        : 'Local backup created successfully! (Google Drive credentials not configured)',
      backup: result,
    });
  } catch (error: any) {
    console.error('Trigger backup error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete backup',
    });
  }
}

export async function downloadLatestBackup(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    let latest = getLatestBackupZip();

    // If no backup exists yet, create one on the fly
    if (!latest || !fs.existsSync(latest.filePath)) {
      const created = await createLocalBackupZip();
      latest = created;
    }

    res.download(latest.filePath, latest.filename, (err) => {
      if (err) {
        console.error('Error downloading backup:', err);
      }
    });
  } catch (error: any) {
    console.error('Download backup error:', error);
    res.status(500).json({ message: 'Error generating or downloading backup' });
  }
}

export async function getStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const status = getBackupStatus();
    res.json(status);
  } catch (error: any) {
    console.error('Get backup status error:', error);
    res.status(500).json({ message: 'Error retrieving backup status' });
  }
}
