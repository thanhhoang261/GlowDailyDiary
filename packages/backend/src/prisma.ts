import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export async function ensureDatabaseSchema(): Promise<void> {
  try {
    const diaryCols: any[] = await prisma.$queryRawUnsafe('PRAGMA table_info("DiaryEntry");');
    const diaryColNames = new Set(diaryCols.map((c) => c.name));

    if (!diaryColNames.has('aiReview')) {
      await prisma.$executeRawUnsafe('ALTER TABLE "DiaryEntry" ADD COLUMN "aiReview" TEXT;');
      console.log('📦 [DB Auto-Migration] Added aiReview to DiaryEntry');
    }

    const userCols: any[] = await prisma.$queryRawUnsafe('PRAGMA table_info("User");');
    const userColNames = new Set(userCols.map((c) => c.name));

    if (!userColNames.has('openaiApiKey')) {
      await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "openaiApiKey" TEXT;');
      console.log('📦 [DB Auto-Migration] Added openaiApiKey to User');
    }

    if (!userColNames.has('googleDriveFolderId')) {
      await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "googleDriveFolderId" TEXT;');
      console.log('📦 [DB Auto-Migration] Added googleDriveFolderId to User');
    }
  } catch (err: any) {
    console.error('Error verifying database schema:', err.message);
  }
}
