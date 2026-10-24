import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { isEncrypted, encryptForUser } from './services/crypto.service.js';

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

    if (!userColNames.has('isAdmin')) {
      await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "isAdmin" BOOLEAN DEFAULT 0;');
      console.log('📦 [DB Auto-Migration] Added isAdmin to User');
    }

    // Ensure admin user exists with username "admin" and password "1"
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('1', salt);

    const existingAdmin = await prisma.user.findUnique({ where: { username: 'admin' } });
    const existingOwner = await prisma.user.findUnique({ where: { username: 'owner' } });

    if (existingAdmin) {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          passwordHash,
          isAdmin: true,
        },
      });
      console.log('👑 [DB Auto-Migration] Updated admin user password to 1 and isAdmin = true');
    } else if (existingOwner) {
      // Rename owner to admin so all diary entries & uploaded audio are preserved
      await prisma.user.update({
        where: { id: existingOwner.id },
        data: {
          username: 'admin',
          passwordHash,
          isAdmin: true,
        },
      });
      console.log('👑 [DB Auto-Migration] Renamed owner to admin, set password to 1, and isAdmin = true');
    } else {
      await prisma.user.create({
        data: {
          username: 'admin',
          passwordHash,
          name: 'Admin',
          avatarEmoji: 'dudu-crown',
          isAdmin: true,
        },
      });
      console.log('👑 [DB Auto-Migration] Created admin user with password 1 and isAdmin = true');
    }

    // Auto-encrypt any legacy unencrypted diary entries with AES-256-GCM
    const legacyEntries = await prisma.diaryEntry.findMany({
      select: { id: true, userId: true, content: true, aiReview: true },
    });

    let encryptedCount = 0;
    for (const entry of legacyEntries) {
      let needsUpdate = false;
      let newContent = entry.content;
      let newAiReview = entry.aiReview;

      if (entry.content && !isEncrypted(entry.content)) {
        newContent = encryptForUser(entry.userId, entry.content);
        needsUpdate = true;
      }

      if (entry.aiReview && !isEncrypted(entry.aiReview)) {
        newAiReview = encryptForUser(entry.userId, entry.aiReview);
        needsUpdate = true;
      }

      if (needsUpdate) {
        await prisma.diaryEntry.update({
          where: { id: entry.id },
          data: {
            content: newContent,
            aiReview: newAiReview,
          },
        });
        encryptedCount++;
      }
    }

    if (encryptedCount > 0) {
      console.log(`🔐 [DB Auto-Migration] Encrypted ${encryptedCount} legacy diary entries with AES-256-GCM`);
    }
  } catch (err: any) {
    console.error('Error verifying database schema:', err.message);
  }
}
