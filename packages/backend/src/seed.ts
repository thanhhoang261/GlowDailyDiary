import bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';

async function main() {
  console.log('Seeding initial data for Glow Diary...');

  const username = 'owner';
  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    console.log('User "owner" already exists, skipping seed.');
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('diary2026', salt);

  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
      name: 'Lovely Explorer',
      avatarEmoji: 'bubu-peace',
      targetDailyWords: 80,
    },
  });

  console.log(`Created owner user: ${user.username} (Password: diary2026)`);

  // Create entries for yesterday and today to demonstrate streak
  const now = new Date();

  // Today
  const todayStr = now.toISOString().split('T')[0];

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // 2 days ago
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

  await prisma.diaryEntry.create({
    data: {
      userId: user.id,
      date: twoDaysAgoStr,
      title: 'A serene beginning to my English diary',
      content:
        'Today, I decided to begin writing my personal diary in English every single day. The morning breeze was gentle and fragrant. I enjoyed a warm cup of jasmine tea while planning my weekly goals. Writing thoughts down in a foreign language feels refreshing—it gives me space to think slowly and choose my words with intention.',
      mood: 'calm',
      weather: 'sunny',
      vocabList: JSON.stringify([
        { word: 'serene', meaning: 'calm, peaceful, and untroubled' },
        { word: 'intention', meaning: 'a thing intended; an aim or plan' },
      ]),
      gratitude: JSON.stringify([
        'Waking up feeling well-rested',
        'Delicious jasmine green tea',
        'The motivation to practice writing in English',
      ]),
      wordCount: 68,
      promptQuestion: 'What was the brightest moment of your day today?',
    },
  });

  await prisma.diaryEntry.create({
    data: {
      userId: user.id,
      date: yesterdayStr,
      title: 'Small victories and good coffee',
      content:
        'Had a productive afternoon! Finished my pending tasks earlier than expected. In the evening, I took a peaceful stroll around the neighborhood park. The golden sunset painted the sky in soft pink and amber hues. Tomorrow, I will try recording my first voice note to practice pronunciation.',
      mood: 'joyful',
      weather: 'cloudy',
      vocabList: JSON.stringify([
        { word: 'stroll', meaning: 'a short, leisurely walk' },
        { word: 'amber', meaning: 'a warm honey-yellow color' },
      ]),
      gratitude: JSON.stringify([
        'Productive work session',
        'Sunset views in the park',
        'My supportive friends',
      ]),
      wordCount: 62,
      promptQuestion: 'Name 3 little things that made you feel grateful today.',
    },
  });

  console.log('Created sample entries. Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
