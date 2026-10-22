import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ZipArchive } from 'archiver';
import cron from 'node-cron';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUPS_DIR = path.resolve(__dirname, '../../backups');
const UPLOAD_AUDIO_DIR = path.resolve(__dirname, '../../uploads/audio');
const DB_PATH = path.resolve(__dirname, '../../prisma/dev.db');

if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

export interface BackupResult {
  success: boolean;
  filename: string;
  size: number;
  filePath: string;
  createdAt: string;
  googleDriveUploaded: boolean;
  googleDriveFileId?: string;
  googleDriveLink?: string;
  error?: string;
}

let lastBackupInfo: BackupResult | null = null;

// Initialize Google Drive Auth Client
function getGoogleDriveClient() {
  try {
    const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
    const inlineJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

    // 1. Try Service Account Key
    if (inlineJson) {
      const credentials = JSON.parse(inlineJson);
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });
      return google.drive({ version: 'v3', auth });
    }

    if (keyPath) {
      const resolvedPath = path.isAbsolute(keyPath)
        ? keyPath
        : path.resolve(__dirname, '../../', keyPath);

      if (fs.existsSync(resolvedPath)) {
        const auth = new google.auth.GoogleAuth({
          keyFile: resolvedPath,
          scopes: ['https://www.googleapis.com/auth/drive.file'],
        });
        return google.drive({ version: 'v3', auth });
      }
    }

    // 2. Try OAuth2 Refresh Token
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (clientId && clientSecret && refreshToken) {
      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      return google.drive({ version: 'v3', auth: oauth2Client });
    }

    return null;
  } catch (error) {
    console.warn('⚠️ Google Drive client initialization failed:', error);
    return null;
  }
}

// Create a local .zip archive of SQLite DB and Audio files
export async function createLocalBackupZip(): Promise<{ filePath: string; filename: string; size: number }> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `glow-diary-backup-${timestamp}.zip`;
  const filePath = path.join(BACKUPS_DIR, filename);

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(filePath);
    const archive = new (ZipArchive as any)({ zlib: { level: 9 } });

    output.on('close', () => {
      resolve({
        filePath,
        filename,
        size: archive.pointer(),
      });
    });

    archive.on('error', (err: any) => {
      reject(err);
    });

    archive.pipe(output);

    // 1. Add SQLite Database file if exists
    if (fs.existsSync(DB_PATH)) {
      archive.file(DB_PATH, { name: 'database/dev.db' });
    }

    // 2. Add Audio Uploads folder if exists
    if (fs.existsSync(UPLOAD_AUDIO_DIR)) {
      archive.directory(UPLOAD_AUDIO_DIR, 'audio');
    }

    // 3. Add metadata info file
    const meta = {
      backupDate: new Date().toISOString(),
      appName: 'Daily Glow Diary',
      version: '1.0.0',
    };
    archive.append(JSON.stringify(meta, null, 2), { name: 'backup-info.json' });

    archive.finalize();
  });
}

// Upload zip to Google Drive
export async function uploadToGoogleDrive(
  filePath: string,
  filename: string
): Promise<{ fileId: string; webViewLink?: string }> {
  const drive = getGoogleDriveClient();
  if (!drive) {
    throw new Error('Google Drive is not configured. Please provide service account credentials.');
  }

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  const fileMetadata: any = {
    name: filename,
    mimeType: 'application/zip',
  };

  if (folderId && folderId.trim()) {
    fileMetadata.parents = [folderId.trim()];
  }

  const media = {
    mimeType: 'application/zip',
    body: fs.createReadStream(filePath),
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, name, webViewLink',
  });

  return {
    fileId: response.data.id || '',
    webViewLink: response.data.webViewLink || undefined,
  };
}

// Prune old backups, keeping only the 10 most recent
function pruneOldBackups() {
  try {
    const files = fs
      .readdirSync(BACKUPS_DIR)
      .filter((f) => f.startsWith('glow-diary-backup-') && f.endsWith('.zip'))
      .map((f) => ({
        name: f,
        path: path.join(BACKUPS_DIR, f),
        time: fs.statSync(path.join(BACKUPS_DIR, f)).mtimeMs,
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > 10) {
      const toRemove = files.slice(10);
      for (const item of toRemove) {
        fs.unlinkSync(item.path);
      }
    }
  } catch (e) {
    console.warn('Pruning old backups error:', e);
  }
}

// Execute a full backup (local zip + Google Drive upload if connected)
export async function runFullBackup(): Promise<BackupResult> {
  const createdAt = new Date().toISOString();
  console.log(`[Backup] Starting backup at ${createdAt}...`);

  try {
    const { filePath, filename, size } = await createLocalBackupZip();
    let googleDriveUploaded = false;
    let googleDriveFileId: string | undefined;
    let googleDriveLink: string | undefined;
    let driveError: string | undefined;

    const driveClient = getGoogleDriveClient();
    if (driveClient) {
      try {
        console.log(`[Backup] Uploading ${filename} to Google Drive...`);
        const driveRes = await uploadToGoogleDrive(filePath, filename);
        googleDriveUploaded = true;
        googleDriveFileId = driveRes.fileId;
        googleDriveLink = driveRes.webViewLink;
        console.log(`[Backup] Successfully uploaded to Google Drive! File ID: ${driveRes.fileId}`);
      } catch (err: any) {
        console.error('[Backup] Google Drive upload failed:', err.message);
        driveError = err.message;
      }
    } else {
      console.log('[Backup] Google Drive not configured. Local zip saved successfully.');
    }

    pruneOldBackups();

    const result: BackupResult = {
      success: true,
      filename,
      size,
      filePath,
      createdAt,
      googleDriveUploaded,
      googleDriveFileId,
      googleDriveLink,
      error: driveError,
    };

    lastBackupInfo = result;
    return result;
  } catch (error: any) {
    console.error('[Backup] Backup failed:', error);
    const result: BackupResult = {
      success: false,
      filename: '',
      size: 0,
      filePath: '',
      createdAt,
      googleDriveUploaded: false,
      error: error.message || 'Unknown backup error',
    };
    lastBackupInfo = result;
    throw error;
  }
}

// Get the latest backup zip file path for download
export function getLatestBackupZip(): { filePath: string; filename: string } | null {
  try {
    const files = fs
      .readdirSync(BACKUPS_DIR)
      .filter((f) => f.startsWith('glow-diary-backup-') && f.endsWith('.zip'))
      .map((f) => ({
        name: f,
        path: path.join(BACKUPS_DIR, f),
        time: fs.statSync(path.join(BACKUPS_DIR, f)).mtimeMs,
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > 0) {
      return {
        filePath: files[0].path,
        filename: files[0].name,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Get backup system status
export function getBackupStatus() {
  const isGoogleDriveConfigured = !!getGoogleDriveClient();
  const cronSchedule = process.env.BACKUP_CRON || '0 2 * * *';
  const isCronEnabled = process.env.BACKUP_ENABLED !== 'false';

  const recentBackups = fs
    .readdirSync(BACKUPS_DIR)
    .filter((f) => f.startsWith('glow-diary-backup-') && f.endsWith('.zip'))
    .map((f) => {
      const stat = fs.statSync(path.join(BACKUPS_DIR, f));
      return {
        filename: f,
        size: stat.size,
        createdAt: stat.mtime.toISOString(),
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return {
    isGoogleDriveConfigured,
    isCronEnabled,
    cronSchedule,
    lastBackup: lastBackupInfo,
    recentBackups,
  };
}

// Initialize Periodic Cron Scheduler
export function initBackupCron() {
  const isEnabled = process.env.BACKUP_ENABLED !== 'false';
  const cronExpression = process.env.BACKUP_CRON || '0 2 * * *'; // Default 02:00 AM daily

  if (!isEnabled) {
    console.log('⏰ Periodic backup is disabled in .env (BACKUP_ENABLED=false)');
    return;
  }

  if (!cron.validate(cronExpression)) {
    console.warn(`⚠️ Invalid cron expression: "${cronExpression}". Defaulting to "0 2 * * *"`);
  }

  const validExpr = cron.validate(cronExpression) ? cronExpression : '0 2 * * *';

  cron.schedule(validExpr, async () => {
    console.log(`⏰ Triggering scheduled backup job (${validExpr})...`);
    try {
      await runFullBackup();
    } catch (e) {
      console.error('Scheduled backup encountered an error:', e);
    }
  });

  console.log(`⏰ Periodic Backup scheduler active: [${validExpr}] (Runs daily at 02:00 AM)`);
}
