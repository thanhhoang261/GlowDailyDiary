import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export async function ensureDatabaseSchema(): Promise<void> {
  const migrations = [
    'ALTER TABLE "DiaryEntry" ADD COLUMN "aiReview" TEXT;',
    'ALTER TABLE "User" ADD COLUMN "openaiApiKey" TEXT;',
    'ALTER TABLE "User" ADD COLUMN "googleDriveFolderId" TEXT;',
  ];

  for (const sql of migrations) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log(`📦 [DB Auto-Migration] Applied: ${sql}`);
    } catch {
      // Column already exists, safe to ignore
    }
  }
}
