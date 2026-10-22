import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { prisma } from '../prisma.js';
import { DiaryEntry, DaySummary, StreakStats, MoodType, VocabItem, AiReviewResult } from '@diary/shared';
import { reviewDiaryWithAi, saveUserApiKey, getUserAiConfig } from '../services/ai.service.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads/audio');

function countEnglishWords(text: string): number {
  if (!text) return 0;
  const cleaned = text.trim().replace(/[^\w\s'-]/g, ' ');
  const words = cleaned.split(/\s+/).filter(Boolean);
  return words.length;
}

function formatDiaryEntry(entry: any): DiaryEntry {
  let vocabList: VocabItem[] = [];
  let gratitude: string[] = [];
  let aiReview: AiReviewResult | null = null;

  if (entry.vocabList) {
    try {
      vocabList = JSON.parse(entry.vocabList);
    } catch {
      vocabList = [];
    }
  }

  if (entry.gratitude) {
    try {
      gratitude = JSON.parse(entry.gratitude);
    } catch {
      gratitude = [];
    }
  }

  if (entry.aiReview) {
    try {
      aiReview = JSON.parse(entry.aiReview);
    } catch {
      aiReview = null;
    }
  }

  return {
    id: entry.id,
    userId: entry.userId,
    date: entry.date,
    title: entry.title,
    content: entry.content,
    mood: entry.mood as MoodType,
    weather: entry.weather || 'sunny',
    vocabList,
    gratitude,
    audioUrl: entry.audioFilename ? `/api/audio/${entry.audioFilename}` : null,
    audioDuration: entry.audioDuration,
    wordCount: entry.wordCount,
    promptQuestion: entry.promptQuestion,
    aiReview,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

export async function getEntryByDate(req: AuthenticatedRequest, res: Response): Promise<void> {
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

    if (!entry) {
      res.json({ entry: null });
      return;
    }

    res.json({ entry: formatDiaryEntry(entry) });
  } catch (error) {
    console.error('getEntryByDate error:', error);
    res.status(500).json({ message: 'Error retrieving entry' });
  }
}

export async function saveEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      date,
      title,
      content,
      mood = 'joyful',
      weather = 'sunny',
      vocabList = [],
      gratitude = [],
      promptQuestion,
      aiReview,
    } = req.body;

    if (!date) {
      res.status(400).json({ message: 'Date is required' });
      return;
    }

    const trimmedTitle = (title || 'Untitled Glow').trim();
    const trimmedContent = (content || '').trim();
    const wordCount = countEnglishWords(trimmedTitle + ' ' + trimmedContent);

    const serializedVocab = JSON.stringify(vocabList);
    const serializedGratitude = JSON.stringify(gratitude);
    const serializedAiReview = aiReview ? JSON.stringify(aiReview) : null;

    const entry = await prisma.diaryEntry.upsert({
      where: {
        userId_date: {
          userId: req.userId!,
          date,
        },
      },
      update: {
        title: trimmedTitle,
        content: trimmedContent,
        mood,
        weather,
        vocabList: serializedVocab,
        gratitude: serializedGratitude,
        wordCount,
        promptQuestion: promptQuestion || null,
        ...(aiReview !== undefined ? { aiReview: serializedAiReview } : {}),
      },
      create: {
        userId: req.userId!,
        date,
        title: trimmedTitle,
        content: trimmedContent,
        mood,
        weather,
        vocabList: serializedVocab,
        gratitude: serializedGratitude,
        wordCount,
        promptQuestion: promptQuestion || null,
        aiReview: serializedAiReview,
      },
    });

    res.json({ entry: formatDiaryEntry(entry) });
  } catch (error) {
    console.error('saveEntry error:', error);
    res.status(500).json({ message: 'Error saving entry' });
  }
}

export async function deleteEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
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

    if (!entry) {
      res.status(404).json({ message: 'Entry not found' });
      return;
    }

    if (entry.audioFilename) {
      const filePath = path.join(UPLOAD_DIR, entry.audioFilename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.diaryEntry.delete({
      where: { id: entry.id },
    });

    res.json({ success: true, message: 'Entry deleted' });
  } catch (error) {
    console.error('deleteEntry error:', error);
    res.status(500).json({ message: 'Error deleting entry' });
  }
}

export async function getMonthEntries(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { year, month } = req.query; // year e.g. "2026", month e.g. "10" or "09"

    if (!year || !month) {
      res.status(400).json({ message: 'Year and month query parameters are required' });
      return;
    }

    const monthStr = month.toString().padStart(2, '0');
    const prefix = `${year}-${monthStr}`;

    const entries = await prisma.diaryEntry.findMany({
      where: {
        userId: req.userId!,
        date: {
          startsWith: prefix,
        },
      },
      orderBy: { date: 'asc' },
    });

    const summaries: DaySummary[] = entries.map((e) => ({
      date: e.date,
      hasEntry: true,
      entryId: e.id,
      title: e.title,
      mood: e.mood as MoodType,
      hasAudio: !!e.audioFilename,
      wordCount: e.wordCount,
    }));

    res.json({ summaries });
  } catch (error) {
    console.error('getMonthEntries error:', error);
    res.status(500).json({ message: 'Error fetching month summaries' });
  }
}

export async function getStreakStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const entries = await prisma.diaryEntry.findMany({
      where: { userId: req.userId! },
      select: {
        date: true,
        wordCount: true,
        audioDuration: true,
      },
      orderBy: { date: 'asc' },
    });

    const totalEntries = entries.length;
    let totalWords = 0;
    let totalAudioSeconds = 0;

    const dateSet = new Set<string>();
    const currentMonthPrefix = new Date().toISOString().slice(0, 7);
    let thisMonthCount = 0;

    for (const e of entries) {
      totalWords += e.wordCount;
      if (e.audioDuration) {
        totalAudioSeconds += Math.round(e.audioDuration);
      }
      dateSet.add(e.date);
      if (e.date.startsWith(currentMonthPrefix)) {
        thisMonthCount++;
      }
    }

    // Calculate streaks
    // Current streak:
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let currentStreak = 0;
    let checkDate = new Date(today);

    // If wrote today, start counting from today. If not written today, check yesterday.
    if (!dateSet.has(todayStr)) {
      if (dateSet.has(yesterdayStr)) {
        checkDate = yesterday;
      } else {
        checkDate = null as any;
      }
    }

    if (checkDate) {
      while (true) {
        const dStr = checkDate.toISOString().split('T')[0];
        if (dateSet.has(dStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Longest streak
    const sortedDates = Array.from(dateSet).sort();
    let longestStreak = 0;
    let tempStreak = 0;
    let prevTime: number | null = null;

    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    for (const dStr of sortedDates) {
      const currentTime = new Date(dStr + 'T00:00:00Z').getTime();

      if (prevTime === null) {
        tempStreak = 1;
      } else {
        const diffDays = Math.round((currentTime - prevTime) / ONE_DAY_MS);
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }

      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      prevTime = currentTime;
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    const stats: StreakStats = {
      currentStreak,
      longestStreak,
      totalEntries,
      totalWords,
      totalAudioSeconds,
      thisMonthCount,
    };

    res.json({ stats });
  } catch (error) {
    console.error('getStreakStats error:', error);
    res.status(500).json({ message: 'Error calculating streak stats' });
  }
}

export async function getRecentEntries(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      prisma.diaryEntry.findMany({
        where: { userId: req.userId! },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.diaryEntry.count({
        where: { userId: req.userId! },
      }),
    ]);

    res.json({
      entries: entries.map(formatDiaryEntry),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('getRecentEntries error:', error);
    res.status(500).json({ message: 'Error fetching recent entries' });
  }
}

export async function searchEntries(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const q = ((req.query.q as string) || '').trim().toLowerCase();

    if (!q) {
      res.json({ entries: [] });
      return;
    }

    const entries = await prisma.diaryEntry.findMany({
      where: {
        userId: req.userId!,
        OR: [
          { title: { contains: q } },
          { content: { contains: q } },
          { vocabList: { contains: q } },
          { gratitude: { contains: q } },
        ],
      },
      orderBy: { date: 'desc' },
      take: 30,
    });

    res.json({ entries: entries.map(formatDiaryEntry) });
  } catch (error) {
    console.error('searchEntries error:', error);
    res.status(500).json({ message: 'Error searching entries' });
  }
}

export async function reviewEntryWithAi(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { date, title, content, apiKey, saveKey } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ message: 'Content is empty. Please write some English words first!' });
      return;
    }

    if (saveKey && apiKey && apiKey.trim().startsWith('sk-')) {
      await saveUserApiKey(req.userId!, apiKey.trim());
    }

    const result = await reviewDiaryWithAi({
      userId: req.userId,
      title,
      content,
      apiKey,
    });

    // If date is provided, update existing entry in database with the AI review
    if (date) {
      const existing = await prisma.diaryEntry.findUnique({
        where: {
          userId_date: {
            userId: req.userId!,
            date,
          },
        },
      });
      if (existing) {
        await prisma.diaryEntry.update({
          where: { id: existing.id },
          data: { aiReview: JSON.stringify(result) },
        });
      }
    }

    res.json({ result });
  } catch (error: any) {
    console.error('AI Review error:', error);
    if (error.message === 'NO_API_KEY') {
      res.status(400).json({
        code: 'NO_API_KEY',
        message: 'Please provide your OpenAI API key to use grammar & spelling review.',
      });
      return;
    }
    res.status(500).json({ message: error.message || 'Error reviewing entry with AI' });
  }
}

export async function getAiConfigController(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const config = await getUserAiConfig(req.userId!);
    res.json({ config });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching AI config' });
  }
}

export async function setAiKeyController(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { apiKey } = req.body;
    await saveUserApiKey(req.userId!, apiKey || null);
    res.json({
      success: true,
      message: apiKey ? 'OpenAI key saved successfully!' : 'OpenAI key cleared.',
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error saving AI key' });
  }
}
