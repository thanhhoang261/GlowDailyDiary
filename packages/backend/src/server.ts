import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.routes.js';
import diaryRoutes from './routes/diary.routes.js';
import audioRoutes from './routes/audio.routes.js';
import backupRoutes from './routes/backup.routes.js';
import { initBackupCron } from './services/backup.service.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static audio files
const uploadsPath = path.resolve(__dirname, '../uploads/audio');
app.use('/uploads/audio', express.static(uploadsPath));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Daily Glow Diary Backend is blooming! 🌸',
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/backup', backupRoutes);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    message: err.message || 'Something went wrong on the server',
  });
});

app.listen(PORT, () => {
  console.log(`✨ Glow Diary Server listening on http://localhost:${PORT}`);
  initBackupCron();
});
