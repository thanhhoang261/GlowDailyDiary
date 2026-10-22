import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ZipArchive } from 'archiver';
import cron from 'node-cron';
import { google } from 'googleapis';
import { prisma } from '../prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUPS_DIR = path.resolve(__dirname, '../../backups');
const UPLOAD_AUDIO_DIR = path.resolve(__dirname, '../../uploads/audio');

if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

export function isOAuthAppConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_ID.trim().length > 0 &&
    process.env.GOOGLE_CLIENT_SECRET.trim().length > 0
  );
}

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/api/backup/google/callback';

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// Generate Auth URL for user to grant Drive permission
export function generateGoogleAuthUrl(userId: string): string {
  const oauth2Client = getOAuth2Client();

  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
    state: userId,
  });
}

// Handle OAuth callback when user returns from Google
export async function handleGoogleOAuthCallback(
  code: string,
  userId: string
): Promise<{ email: string }> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  if (tokens.scope && !tokens.scope.includes('drive')) {
    throw new Error('Bạn chưa tích chọn ô quyền truy cập Google Drive trên màn hình Google. Vui lòng bấm Kết nối lại và tích chọn quyền Drive.');
  }

  oauth2Client.setCredentials(tokens);

  // Retrieve user's email address
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();
  const email = userInfo.data.email || 'connected-account';

  await prisma.user.update({
    where: { id: userId },
    data: {
      googleDriveConnected: true,
      googleRefreshToken: tokens.refresh_token,
      googleDriveEmail: email,
    },
  });

  return { email };
}

// Disconnect user's Google Drive
export async function disconnectUserGoogleDrive(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      googleDriveConnected: false,
      googleRefreshToken: null,
      googleDriveEmail: null,
      googleDriveFolderId: null,
    },
  });
}

// Create authenticated Drive client for a specific user using their stored refresh token
export function getDriveClientForUser(refreshToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.drive({ version: 'v3', auth: oauth2Client });
}

// Ensure "Daily Glow Diary Backups" folder exists on user's Drive
async function ensureUserDriveFolder(drive: any, userId: string, storedFolderId?: string | null): Promise<string> {
  if (storedFolderId) {
    try {
      const res = await drive.files.get({ fileId: storedFolderId, fields: 'id, trashed' });
      if (res.data && !res.data.trashed) {
        return storedFolderId;
      }
    } catch {
      // If folder not found or deleted, create a new one
    }
  }

  // Find or create folder named "Daily Glow Diary Backups"
  const folderName = 'Daily Glow Diary Backups 🌸';
  const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const existing = await drive.files.list({ q: query, fields: 'files(id, name)' });

  if (existing.data.files && existing.data.files.length > 0) {
    const folderId = existing.data.files[0].id;
    await prisma.user.update({
      where: { id: userId },
      data: { googleDriveFolderId: folderId },
    });
    return folderId;
  }

  const created = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  });

  const newFolderId = created.data.id;
  await prisma.user.update({
    where: { id: userId },
    data: { googleDriveFolderId: newFolderId },
  });

  return newFolderId;
}

// Create a personalized backup archive (.zip) containing ONLY this user's data
export async function createPerUserBackupZip(
  userId: string
): Promise<{ filePath: string; filename: string; size: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      entries: {
        orderBy: { date: 'asc' },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const userBackupsDir = path.join(BACKUPS_DIR, `user-${user.id}`);
  if (!fs.existsSync(userBackupsDir)) {
    fs.mkdirSync(userBackupsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const safeUsername = user.username.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `glow-diary-${safeUsername}-${timestamp}.zip`;
  const filePath = path.join(userBackupsDir, filename);

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

    // 1. User Profile file
    const profile = {
      id: user.id,
      username: user.username,
      name: user.name,
      avatarEmoji: user.avatarEmoji,
      targetDailyWords: user.targetDailyWords,
      backupExportedAt: new Date().toISOString(),
    };
    archive.append(JSON.stringify(profile, null, 2), { name: 'profile.json' });

    // 2. Entries file
    const entriesData = user.entries.map((e) => {
      let vocabList = [];
      let gratitude = [];
      try {
        if (e.vocabList) vocabList = JSON.parse(e.vocabList);
      } catch {}
      try {
        if (e.gratitude) gratitude = JSON.parse(e.gratitude);
      } catch {}

      return {
        id: e.id,
        date: e.date,
        title: e.title,
        content: e.content,
        mood: e.mood,
        weather: e.weather,
        vocabList,
        gratitude,
        wordCount: e.wordCount,
        audioFilename: e.audioFilename,
        audioDuration: e.audioDuration,
        promptQuestion: e.promptQuestion,
        createdAt: e.createdAt,
      };
    });
    archive.append(JSON.stringify(entriesData, null, 2), { name: 'entries.json' });

    // 3. Audio Voice Notes belonging to this user
    for (const entry of user.entries) {
      if (entry.audioFilename) {
        const audioPath = path.join(UPLOAD_AUDIO_DIR, entry.audioFilename);
        if (fs.existsSync(audioPath)) {
          archive.file(audioPath, { name: `audio/${entry.audioFilename}` });
        }
      }
    }

    // 4. Metadata
    const meta = {
      appName: 'Daily Glow Diary',
      totalEntries: user.entries.length,
      totalWords: user.entries.reduce((acc, curr) => acc + curr.wordCount, 0),
      backupDate: new Date().toISOString(),
      ownerUsername: user.username,
    };
    archive.append(JSON.stringify(meta, null, 2), { name: 'backup-info.json' });

    archive.finalize();
  });
}

// Prune old backups for a specific user, keeping only 7 latest
function pruneUserBackups(userId: string) {
  try {
    const userBackupsDir = path.join(BACKUPS_DIR, `user-${userId}`);
    if (!fs.existsSync(userBackupsDir)) return;

    const files = fs
      .readdirSync(userBackupsDir)
      .filter((f) => f.endsWith('.zip'))
      .map((f) => ({
        path: path.join(userBackupsDir, f),
        time: fs.statSync(path.join(userBackupsDir, f)).mtimeMs,
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > 7) {
      const toRemove = files.slice(7);
      for (const item of toRemove) {
        fs.unlinkSync(item.path);
      }
    }
  } catch (e) {
    console.warn('Pruning user backups error:', e);
  }
}

// Backup a specific user's data to their own personal Google Drive
export async function backupUserToPersonalDrive(userId: string): Promise<{
  success: boolean;
  filename: string;
  size: number;
  googleDriveUploaded: boolean;
  fileId?: string;
  webViewLink?: string;
  message?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // 1. Create personal zip archive
  const { filePath, filename, size } = await createPerUserBackupZip(userId);

  // 2. If user has Google Drive connected, upload to their Drive
  if (user.googleDriveConnected && user.googleRefreshToken) {
    try {
      const drive = getDriveClientForUser(user.googleRefreshToken);
      const folderId = await ensureUserDriveFolder(drive, userId, user.googleDriveFolderId);

      const fileMetadata = {
        name: filename,
        parents: [folderId],
        mimeType: 'application/zip',
      };

      const media = {
        mimeType: 'application/zip',
        body: fs.createReadStream(filePath),
      };

      const res = await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id, name, webViewLink',
      });

      await prisma.user.update({
        where: { id: userId },
        data: { lastBackupAt: new Date() },
      });

      pruneUserBackups(userId);

      return {
        success: true,
        filename,
        size,
        googleDriveUploaded: true,
        fileId: res.data.id || '',
        webViewLink: res.data.webViewLink || undefined,
        message: 'Personal backup successfully uploaded to your Google Drive! ☁️✨',
      };
    } catch (err: any) {
      console.error(`Google Drive upload error for user ${user.username}:`, err.message);
      return {
        success: false,
        filename,
        size,
        googleDriveUploaded: false,
        message: `Local archive created, but Google Drive upload failed: ${err.message}`,
      };
    }
  }

  pruneUserBackups(userId);

  return {
    success: true,
    filename,
    size,
    googleDriveUploaded: false,
    message: 'Local personal archive created successfully! (Connect Google Drive to auto-upload to your cloud)',
  };
}

// Get latest backup for a user
export function getLatestUserBackup(userId: string): { filePath: string; filename: string } | null {
  try {
    const userBackupsDir = path.join(BACKUPS_DIR, `user-${userId}`);
    if (!fs.existsSync(userBackupsDir)) return null;

    const files = fs
      .readdirSync(userBackupsDir)
      .filter((f) => f.endsWith('.zip'))
      .map((f) => ({
        path: path.join(userBackupsDir, f),
        name: f,
        time: fs.statSync(path.join(userBackupsDir, f)).mtimeMs,
      }))
      .sort((a, b) => b.time - a.time);

    return files.length > 0 ? { filePath: files[0].path, filename: files[0].name } : null;
  } catch {
    return null;
  }
}

// Get user backup status
export async function getUserBackupStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      googleDriveConnected: true,
      googleDriveEmail: true,
      googleDriveFolderId: true,
      autoBackupEnabled: true,
      lastBackupAt: true,
    },
  });

  const userBackupsDir = path.join(BACKUPS_DIR, `user-${userId}`);
  let recentBackups: { filename: string; size: number; createdAt: string }[] = [];

  if (fs.existsSync(userBackupsDir)) {
    recentBackups = fs
      .readdirSync(userBackupsDir)
      .filter((f) => f.endsWith('.zip'))
      .map((f) => {
        const stat = fs.statSync(path.join(userBackupsDir, f));
        return {
          filename: f,
          size: stat.size,
          createdAt: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }

  return {
    googleDriveConnected: user?.googleDriveConnected || false,
    googleDriveEmail: user?.googleDriveEmail || null,
    googleDriveFolderId: user?.googleDriveFolderId || null,
    autoBackupEnabled: user?.autoBackupEnabled ?? true,
    lastBackupAt: user?.lastBackupAt ? user.lastBackupAt.toISOString() : null,
    isOAuthAppConfigured: isOAuthAppConfigured(),
    recentBackups,
  };
}

// Cron Scheduler: Backs up each connected user periodically
export function initBackupCron() {
  const isEnabled = process.env.BACKUP_ENABLED !== 'false';
  const cronExpression = process.env.BACKUP_CRON || '0 2 * * *'; // Default 02:00 AM daily

  if (!isEnabled) {
    console.log('⏰ Periodic backup is disabled in .env (BACKUP_ENABLED=false)');
    return;
  }

  const validExpr = cron.validate(cronExpression) ? cronExpression : '0 2 * * *';

  cron.schedule(validExpr, async () => {
    console.log(`⏰ [Cron] Running nightly personal backup check (${validExpr})...`);
    try {
      // Find all users who have connected their personal Google Drive and enabled auto-backup
      const connectedUsers = await prisma.user.findMany({
        where: {
          googleDriveConnected: true,
          autoBackupEnabled: true,
          googleRefreshToken: { not: null },
        },
      });

      console.log(`⏰ [Cron] Found ${connectedUsers.length} user(s) with personal Drive sync active.`);

      for (const u of connectedUsers) {
        try {
          console.log(`⏰ [Cron] Backing up data for user: ${u.username}...`);
          await backupUserToPersonalDrive(u.id);
        } catch (err: any) {
          console.error(`⏰ [Cron] Backup failed for user ${u.username}:`, err.message);
        }
      }
    } catch (e) {
      console.error('Scheduled cron backup error:', e);
    }
  });

  console.log(`⏰ Periodic Backup scheduler active: [${validExpr}] (Runs daily at 02:00 AM)`);
}
