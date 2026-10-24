import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { MoodType } from '@diary/shared';
import { createPerUserBackupZip } from '../services/backup.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(__dirname, '../../prisma/dev.db');
const UPLOADS_AUDIO_DIR = path.resolve(__dirname, '../../uploads/audio');
const BACKUPS_DIR = path.resolve(__dirname, '../../backups');

// Ensure directories exist
if (!fs.existsSync(UPLOADS_AUDIO_DIR)) {
  fs.mkdirSync(UPLOADS_AUDIO_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// ==========================================
// 1. System Overview & Health Monitoring
// ==========================================

export async function getAdminOverview(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const mem = process.memoryUsage();

    // Database stats
    let dbSizeBytes = 0;
    try {
      if (fs.existsSync(DB_PATH)) {
        dbSizeBytes = fs.statSync(DB_PATH).size;
      }
    } catch {}

    const [totalUsers, totalEntries, wordsAgg] = await Promise.all([
      prisma.user.count(),
      prisma.diaryEntry.count(),
      prisma.diaryEntry.aggregate({
        _sum: { wordCount: true },
      }),
    ]);

    // Audio storage stats
    let audioUploadsCount = 0;
    let audioUploadsSizeBytes = 0;
    try {
      if (fs.existsSync(UPLOADS_AUDIO_DIR)) {
        const files = fs.readdirSync(UPLOADS_AUDIO_DIR);
        audioUploadsCount = files.length;
        for (const file of files) {
          try {
            audioUploadsSizeBytes += fs.statSync(path.join(UPLOADS_AUDIO_DIR, file)).size;
          } catch {}
        }
      }
    } catch {}

    // Backup storage stats
    let backupsCount = 0;
    let backupsSizeBytes = 0;
    try {
      if (fs.existsSync(BACKUPS_DIR)) {
        const files = fs.readdirSync(BACKUPS_DIR);
        backupsCount = files.length;
        for (const file of files) {
          try {
            backupsSizeBytes += fs.statSync(path.join(BACKUPS_DIR, file)).size;
          } catch {}
        }
      }
    } catch {}

    res.json({
      overview: {
        server: {
          uptimeSeconds: Math.round(process.uptime()),
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          memory: {
            heapUsedMB: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
            heapTotalMB: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
            rssMB: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
          },
          port: process.env.PORT || 5173,
          nodeEnv: process.env.NODE_ENV || 'production',
        },
        database: {
          path: DB_PATH,
          sizeBytes: dbSizeBytes,
          totalUsers,
          totalEntries,
          totalWords: wordsAgg._sum.wordCount || 0,
        },
        storage: {
          audioUploadsCount,
          audioUploadsSizeBytes,
          backupsCount,
          backupsSizeBytes,
        },
        services: {
          cronSchedule: process.env.BACKUP_CRON_SCHEDULE || '0 2 * * *',
          hasServerOpenAiKey: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().startsWith('sk-')),
          hasGoogleOAuth: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        },
      },
    });
  } catch (error: any) {
    console.error('getAdminOverview error:', error);
    res.status(500).json({ message: 'Error retrieving system overview' });
  }
}

// Run VACUUM on SQLite
export async function vacuumDatabase(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const beforeSize = fs.existsSync(DB_PATH) ? fs.statSync(DB_PATH).size : 0;
    await prisma.$executeRawUnsafe('VACUUM;');
    const afterSize = fs.existsSync(DB_PATH) ? fs.statSync(DB_PATH).size : 0;

    res.json({
      success: true,
      message: 'Database vacuum completed successfully!',
      beforeSizeBytes: beforeSize,
      afterSizeBytes: afterSize,
      freedBytes: Math.max(0, beforeSize - afterSize),
    });
  } catch (error: any) {
    console.error('vacuumDatabase error:', error);
    res.status(500).json({ message: error.message || 'Error executing VACUUM' });
  }
}

// Clean orphan audio files
export async function cleanOrphanAudio(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const entries = await prisma.diaryEntry.findMany({
      where: { audioFilename: { not: null } },
      select: { audioFilename: true },
    });
    const linkedSet = new Set(entries.map((e) => e.audioFilename).filter(Boolean));

    let cleanedCount = 0;
    let cleanedBytes = 0;

    if (fs.existsSync(UPLOADS_AUDIO_DIR)) {
      const files = fs.readdirSync(UPLOADS_AUDIO_DIR);
      for (const file of files) {
        if (!linkedSet.has(file)) {
          const filePath = path.join(UPLOADS_AUDIO_DIR, file);
          try {
            const size = fs.statSync(filePath).size;
            fs.unlinkSync(filePath);
            cleanedCount++;
            cleanedBytes += size;
          } catch {}
        }
      }
    }

    res.json({
      success: true,
      message: `Đã dọn dẹp ${cleanedCount} file âm thanh rác (${(cleanedBytes / 1024 / 1024).toFixed(2)} MB).`,
      cleanedCount,
      cleanedBytes,
    });
  } catch (error: any) {
    console.error('cleanOrphanAudio error:', error);
    res.status(500).json({ message: 'Error cleaning orphan audio files' });
  }
}

// Test OpenAI API connectivity
export async function testOpenAiConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      res.status(400).json({
        success: false,
        message: 'Chưa cài đặt OPENAI_API_KEY trong file .env hoặc biến môi trường server',
      });
      return;
    }

    const start = Date.now();
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key.trim()}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Say hello in 2 words' }],
        max_tokens: 5,
      }),
    });

    const latencyMs = Date.now() - start;

    if (!response.ok) {
      const err = await response.text();
      res.status(400).json({
        success: false,
        latencyMs,
        message: `OpenAI API returned error (${response.status}): ${err}`,
      });
      return;
    }

    const data: any = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'OK';

    res.json({
      success: true,
      latencyMs,
      message: `Kết nối thành công! Phản hồi trong ${latencyMs}ms: "${reply.trim()}"`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi gọi OpenAI API',
    });
  }
}

// ==========================================
// 2. User Management
// ==========================================

export async function getAdminUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      include: {
        entries: {
          select: {
            wordCount: true,
            audioFilename: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const userItems = users.map((u) => {
      const totalWords = u.entries.reduce((sum, e) => sum + e.wordCount, 0);
      const audioCount = u.entries.filter((e) => Boolean(e.audioFilename)).length;

      return {
        id: u.id,
        username: u.username,
        name: u.name,
        avatarEmoji: u.avatarEmoji,
        targetDailyWords: u.targetDailyWords,
        isAdmin: Boolean(u.isAdmin) || u.username === 'owner',
        entriesCount: u.entries.length,
        totalWords,
        audioCount,
        googleDriveConnected: u.googleDriveConnected,
        hasOpenaiKey: Boolean(u.openaiApiKey),
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      };
    });

    res.json({ users: userItems });
  } catch (error: any) {
    console.error('getAdminUsers error:', error);
    res.status(500).json({ message: 'Error retrieving users' });
  }
}

export async function createAdminUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { username, password, name, avatarEmoji, targetDailyWords, isAdmin } = req.body;

    if (!username || !password || !name) {
      res.status(400).json({ message: 'Tài khoản, mật khẩu và tên là bắt buộc' });
      return;
    }

    const trimmedUsername = username.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { username: trimmedUsername },
    });

    if (existing) {
      res.status(409).json({ message: 'Tên tài khoản này đã được sử dụng' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        username: trimmedUsername,
        passwordHash,
        name: name.trim(),
        avatarEmoji: avatarEmoji || 'bubu-peace',
        targetDailyWords: targetDailyWords ? Number(targetDailyWords) : 100,
        isAdmin: Boolean(isAdmin),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Tạo người dùng mới thành công!',
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        avatarEmoji: newUser.avatarEmoji,
        isAdmin: Boolean(newUser.isAdmin),
      },
    });
  } catch (error: any) {
    console.error('createAdminUser error:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
}

export async function updateAdminUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const { name, avatarEmoji, targetDailyWords, isAdmin } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ message: 'Không tìm thấy người dùng' });
      return;
    }

    // Protect owner account from losing admin
    const newIsAdmin = user.username === 'owner' ? true : (isAdmin !== undefined ? Boolean(isAdmin) : user.isAdmin);

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(avatarEmoji ? { avatarEmoji } : {}),
        ...(targetDailyWords !== undefined ? { targetDailyWords: Number(targetDailyWords) } : {}),
        isAdmin: newIsAdmin,
      },
    });

    res.json({
      success: true,
      message: 'Cập nhật thông tin người dùng thành công!',
      user: {
        id: updated.id,
        username: updated.username,
        name: updated.name,
        avatarEmoji: updated.avatarEmoji,
        targetDailyWords: updated.targetDailyWords,
        isAdmin: Boolean(updated.isAdmin) || updated.username === 'owner',
      },
    });
  } catch (error: any) {
    console.error('updateAdminUser error:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
}

export async function resetUserPasswordAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const { newPassword } = req.body;

    if (!newPassword || newPassword.trim().length < 3) {
      res.status(400).json({ message: 'Mật khẩu mới tối thiểu 3 ký tự' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    res.json({
      success: true,
      message: 'Đã đổi mật khẩu cho người dùng thành công!',
    });
  } catch (error: any) {
    console.error('resetUserPasswordAdmin error:', error);
    res.status(500).json({ message: 'Error resetting user password' });
  }
}

export async function deleteAdminUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      res.status(404).json({ message: 'Không tìm thấy người dùng' });
      return;
    }

    if (user.username === 'owner') {
      res.status(400).json({ message: 'Không thể xóa tài khoản Quản trị viên chính (owner)!' });
      return;
    }

    // Clean up audio files on disk
    const userEntries = await prisma.diaryEntry.findMany({
      where: { userId: id },
      select: { audioFilename: true },
    });

    for (const entry of userEntries) {
      if (entry.audioFilename) {
        const filePath = path.join(UPLOADS_AUDIO_DIR, entry.audioFilename);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch {}
        }
      }
    }

    // Delete user from DB (cascade deletes entries)
    await prisma.user.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: `Đã xóa tài khoản "${user.username}" cùng toàn bộ dữ liệu nhật ký!`,
    });
  } catch (error: any) {
    console.error('deleteAdminUser error:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
}

// ==========================================
// 3. Diary Entries Management
// ==========================================

export async function getAdminEntries(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { q, mood, userId, page = '1', limit = '50' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (userId) {
      where.userId = String(userId);
    }
    if (mood) {
      where.mood = String(mood);
    }
    if (q) {
      const search = String(q);
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    const [total, entries] = await Promise.all([
      prisma.diaryEntry.count({ where }),
      prisma.diaryEntry.findMany({
        where,
        include: {
          user: {
            select: {
              username: true,
              name: true,
              avatarEmoji: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    const entryItems = entries.map((e) => ({
      id: e.id,
      userId: e.userId,
      username: e.user.username,
      userName: e.user.name,
      userAvatar: e.user.avatarEmoji,
      date: e.date,
      title: e.title,
      content: e.content,
      mood: e.mood as MoodType,
      weather: e.weather || 'sunny',
      wordCount: e.wordCount,
      audioUrl: e.audioFilename ? `/api/audio/${e.audioFilename}` : null,
      audioDuration: e.audioDuration,
      hasAiReview: Boolean(e.aiReview),
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    }));

    res.json({
      total,
      page: pageNum,
      limit: limitNum,
      entries: entryItems,
    });
  } catch (error: any) {
    console.error('getAdminEntries error:', error);
    res.status(500).json({ message: 'Error retrieving entries' });
  }
}

export async function deleteAdminEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);

    const entry = await prisma.diaryEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      res.status(404).json({ message: 'Không tìm thấy bài viết' });
      return;
    }

    if (entry.audioFilename) {
      const audioPath = path.join(UPLOADS_AUDIO_DIR, entry.audioFilename);
      if (fs.existsSync(audioPath)) {
        try {
          fs.unlinkSync(audioPath);
        } catch {}
      }
    }

    await prisma.diaryEntry.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: `Đã xóa bài viết ngày ${entry.date}!`,
    });
  } catch (error: any) {
    console.error('deleteAdminEntry error:', error);
    res.status(500).json({ message: 'Error deleting entry' });
  }
}

export async function exportAllEntriesJson(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const entries = await prisma.diaryEntry.findMany({
      include: {
        user: {
          select: {
            username: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=glow-diary-all-entries-${new Date().toISOString().split('T')[0]}.json`);
    res.send(JSON.stringify(entries, null, 2));
  } catch (error: any) {
    console.error('exportAllEntriesJson error:', error);
    res.status(500).json({ message: 'Error exporting entries' });
  }
}

// ==========================================
// 4. Audio Storage Management
// ==========================================

export async function getAdminAudioFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const entries = await prisma.diaryEntry.findMany({
      where: { audioFilename: { not: null } },
      include: {
        user: {
          select: { username: true, name: true },
        },
      },
    });

    const linkedMap = new Map<string, any>();
    for (const e of entries) {
      if (e.audioFilename) {
        linkedMap.set(e.audioFilename, {
          entryId: e.id,
          username: e.user.username,
          date: e.date,
        });
      }
    }

    const items: any[] = [];
    if (fs.existsSync(UPLOADS_AUDIO_DIR)) {
      const files = fs.readdirSync(UPLOADS_AUDIO_DIR);
      for (const file of files) {
        const filePath = path.join(UPLOADS_AUDIO_DIR, file);
        try {
          const stat = fs.statSync(filePath);
          const link = linkedMap.get(file);

          items.push({
            filename: file,
            sizeBytes: stat.size,
            createdAt: stat.birthtime.toISOString(),
            url: `/api/audio/${file}`,
            isLinked: Boolean(link),
            linkedEntryId: link?.entryId,
            linkedUser: link?.username,
            linkedDate: link?.date,
          });
        } catch {}
      }
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ files: items });
  } catch (error: any) {
    console.error('getAdminAudioFiles error:', error);
    res.status(500).json({ message: 'Error retrieving audio files' });
  }
}

export async function deleteAdminAudioFile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const filename = String(req.params.filename);
    const safeFilename = path.basename(filename);
    const filePath = path.join(UPLOADS_AUDIO_DIR, safeFilename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Unlink in database if present
    await prisma.diaryEntry.updateMany({
      where: { audioFilename: safeFilename },
      data: {
        audioFilename: null,
        audioDuration: null,
        audioMimeType: null,
      },
    });

    res.json({
      success: true,
      message: `Đã xóa file âm thanh "${safeFilename}"!`,
    });
  } catch (error: any) {
    console.error('deleteAdminAudioFile error:', error);
    res.status(500).json({ message: 'Error deleting audio file' });
  }
}

// ==========================================
// 5. Backups Management
// ==========================================

export async function getAdminBackups(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const items: any[] = [];

    if (fs.existsSync(BACKUPS_DIR)) {
      const files = fs.readdirSync(BACKUPS_DIR);
      for (const file of files) {
        const filePath = path.join(BACKUPS_DIR, file);
        try {
          const stat = fs.statSync(filePath);
          items.push({
            filename: file,
            sizeBytes: stat.size,
            createdAt: stat.mtime.toISOString(),
            type: file.endsWith('.zip') ? 'zip' : file.endsWith('.db') ? 'sqlite' : 'other',
          });
        } catch {}
      }
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ backups: items });
  } catch (error: any) {
    console.error('getAdminBackups error:', error);
    res.status(500).json({ message: 'Error retrieving backups' });
  }
}

export async function createAdminBackup(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    // 1. Create a snapshot zip of the requesting admin's data or whole DB copy
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotName = `system-db-snapshot-${timestamp}.db`;
    const destPath = path.join(BACKUPS_DIR, snapshotName);

    // Atomic SQLite copy using VACUUM INTO or file copy
    if (fs.existsSync(DB_PATH)) {
      try {
        await prisma.$executeRawUnsafe(`VACUUM INTO '${destPath}';`);
      } catch {
        // Fallback to direct file copy
        fs.copyFileSync(DB_PATH, destPath);
      }
    }

    // Also trigger user archive backup
    if (req.userId) {
      await createPerUserBackupZip(req.userId);
    }

    res.json({
      success: true,
      message: 'Tạo bản sao lưu Database toàn hệ thống thành công!',
      filename: snapshotName,
    });
  } catch (error: any) {
    console.error('createAdminBackup error:', error);
    res.status(500).json({ message: error.message || 'Error creating backup' });
  }
}

export async function downloadAdminBackup(req: Request, res: Response): Promise<void> {
  try {
    const filename = String(req.params.filename);
    const safeFilename = path.basename(filename);
    const filePath = path.join(BACKUPS_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: 'Backup file not found' });
      return;
    }

    res.download(filePath, safeFilename);
  } catch (error: any) {
    console.error('downloadAdminBackup error:', error);
    res.status(500).json({ message: 'Error downloading backup' });
  }
}

export async function deleteAdminBackup(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const filename = String(req.params.filename);
    const safeFilename = path.basename(filename);
    const filePath = path.join(BACKUPS_DIR, safeFilename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: `Đã xóa bản sao lưu "${safeFilename}"!`,
    });
  } catch (error: any) {
    console.error('deleteAdminBackup error:', error);
    res.status(500).json({ message: 'Error deleting backup' });
  }
}

export async function downloadLiveDatabase(req: Request, res: Response): Promise<void> {
  try {
    if (!fs.existsSync(DB_PATH)) {
      res.status(404).json({ message: 'Database file not found' });
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    res.download(DB_PATH, `glow-diary-dev-${todayStr}.db`);
  } catch (error: any) {
    console.error('downloadLiveDatabase error:', error);
    res.status(500).json({ message: 'Error downloading database' });
  }
}
