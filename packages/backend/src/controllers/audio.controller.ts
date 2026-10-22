import { Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { prisma } from '../prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads/audio');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `voice-${uniqueSuffix}${ext}`);
  },
});

export const uploadAudioMiddleware = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
}).single('audio');

export async function uploadAudioForEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const file = req.file;
    const { date, duration } = req.body;

    if (!file) {
      res.status(400).json({ message: 'No audio file provided' });
      return;
    }

    if (!date) {
      // Remove uploaded file if date is missing
      fs.unlinkSync(file.path);
      res.status(400).json({ message: 'Target entry date is required' });
      return;
    }

    const parsedDuration = duration ? parseFloat(duration) : null;

    // Check if an entry already exists for this date
    let entry = await prisma.diaryEntry.findUnique({
      where: {
        userId_date: {
          userId: req.userId!,
          date,
        },
      },
    });

    // If entry exists and already has an audio file, remove old one
    if (entry && entry.audioFilename) {
      const oldFilePath = path.join(UPLOAD_DIR, entry.audioFilename);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    if (entry) {
      entry = await prisma.diaryEntry.update({
        where: { id: entry.id },
        data: {
          audioFilename: file.filename,
          audioMimeType: file.mimetype || 'audio/webm',
          audioDuration: parsedDuration,
        },
      });
    } else {
      // Create a draft entry for this date if it doesn't exist yet
      entry = await prisma.diaryEntry.create({
        data: {
          userId: req.userId!,
          date,
          title: `Voice Note for ${date}`,
          content: '',
          mood: 'calm',
          audioFilename: file.filename,
          audioMimeType: file.mimetype || 'audio/webm',
          audioDuration: parsedDuration,
          wordCount: 0,
        },
      });
    }

    const audioUrl = `/api/audio/${file.filename}`;

    res.json({
      success: true,
      audioUrl,
      audioFilename: file.filename,
      audioDuration: entry.audioDuration,
      entryId: entry.id,
    });
  } catch (error) {
    console.error('Audio upload error:', error);
    res.status(500).json({ message: 'Failed to upload audio' });
  }
}

export async function streamAudio(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const filename = String(req.params.filename);
    // Sanitize filename to prevent path traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(UPLOAD_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: 'Audio file not found' });
      return;
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Detect mime type
    const ext = path.extname(safeFilename).toLowerCase();
    let contentType = 'audio/webm';
    if (ext === '.mp3') contentType = 'audio/mpeg';
    else if (ext === '.wav') contentType = 'audio/wav';
    else if (ext === '.m4a' || ext === '.aac') contentType = 'audio/mp4';
    else if (ext === '.ogg') contentType = 'audio/ogg';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
      });

      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
      });

      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Stream audio error:', error);
    res.status(500).json({ message: 'Error streaming audio' });
  }
}

export async function deleteAudioForDate(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const date = String(req.params.date);

    const entry = await prisma.diaryEntry.findUnique({
      where: {
        userId_date: {
          userId: req.userId!,
          date,
        },
      },
    });

    if (entry && entry.audioFilename) {
      const filePath = path.join(UPLOAD_DIR, entry.audioFilename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await prisma.diaryEntry.update({
        where: { id: entry.id },
        data: {
          audioFilename: null,
          audioMimeType: null,
          audioDuration: null,
        },
      });
    }

    res.json({ success: true, message: 'Audio removed' });
  } catch (error) {
    console.error('Delete audio error:', error);
    res.status(500).json({ message: 'Failed to delete audio' });
  }
}
