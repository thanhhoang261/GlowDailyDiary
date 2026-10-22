-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarEmoji" TEXT NOT NULL DEFAULT '✨',
    "targetDailyWords" INTEGER NOT NULL DEFAULT 100,
    "googleDriveConnected" BOOLEAN NOT NULL DEFAULT false,
    "googleDriveEmail" TEXT,
    "googleRefreshToken" TEXT,
    "googleDriveFolderId" TEXT,
    "autoBackupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastBackupAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DiaryEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mood" TEXT NOT NULL DEFAULT 'joyful',
    "weather" TEXT DEFAULT 'sunny',
    "vocabList" TEXT,
    "gratitude" TEXT,
    "audioFilename" TEXT,
    "audioMimeType" TEXT,
    "audioDuration" REAL,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "promptQuestion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DiaryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "DiaryEntry_userId_date_idx" ON "DiaryEntry"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DiaryEntry_userId_date_key" ON "DiaryEntry"("userId", "date");
