export type MoodType =
  | 'joyful'     // 🥰 Joyful / Happy
  | 'calm'       // 🌿 Calm / Peaceful
  | 'energetic'  // ⚡ Energetic / Motivated
  | 'grateful'   // 💖 Grateful / Blessed
  | 'reflective' // 💭 Reflective / Deep thoughts
  | 'tired'      // 🥱 Tired / Needs rest
  | 'sad';       // 🌧️ Melancholic / Sad

export interface MoodMeta {
  type: MoodType;
  emoji: string;
  label: string;
  color: string; // Tailwind color class or hex
  bgSoft: string;
  sticker: string;
  stickerGif: string;
  bubuDuduAction: string;
}

export const MOODS: Record<MoodType, MoodMeta> = {
  joyful: {
    type: 'joyful',
    emoji: '🥰',
    label: 'Joyful & Happy',
    color: '#F472B6',
    bgSoft: '#FDF2F8',
    sticker: '/bubu-dudu/mood-joyful.png',
    stickerGif: '/bubu-dudu/mood-joyful.gif',
    bubuDuduAction: 'Bubu & Dudu dancing happily cheek to cheek'
  },
  calm: {
    type: 'calm',
    emoji: '🌿',
    label: 'Calm & Peaceful',
    color: '#34D399',
    bgSoft: '#ECFDF5',
    sticker: '/bubu-dudu/mood-calm.png',
    stickerGif: '/bubu-dudu/mood-calm.gif',
    bubuDuduAction: 'Bubu & Dudu sipping hot cocoa under blanket'
  },
  energetic: {
    type: 'energetic',
    emoji: '⚡',
    label: 'Energetic & Pumped',
    color: '#FBBF24',
    bgSoft: '#FEFCE8',
    sticker: '/bubu-dudu/mood-energetic.png',
    stickerGif: '/bubu-dudu/mood-energetic.gif',
    bubuDuduAction: 'Bubu ready for adventure with hat & backpack'
  },
  grateful: {
    type: 'grateful',
    emoji: '💖',
    label: 'Heartful & Grateful',
    color: '#FB7185',
    bgSoft: '#FFF1F2',
    sticker: '/bubu-dudu/mood-grateful.png',
    stickerGif: '/bubu-dudu/mood-grateful.gif',
    bubuDuduAction: 'Bubu hugging Dudu with floating hearts'
  },
  reflective: {
    type: 'reflective',
    emoji: '💭',
    label: 'Deep & Reflective',
    color: '#818CF8',
    bgSoft: '#EEF2FF',
    sticker: '/bubu-dudu/mood-reflective.png',
    stickerGif: '/bubu-dudu/mood-reflective.gif',
    bubuDuduAction: 'Bubu & Dudu having a peaceful cozy evening'
  },
  tired: {
    type: 'tired',
    emoji: '🥱',
    label: 'Tired & Cozy',
    color: '#9CA3AF',
    bgSoft: '#F3F4F6',
    sticker: '/bubu-dudu/mood-tired.png',
    stickerGif: '/bubu-dudu/mood-tired.gif',
    bubuDuduAction: 'Bubu & Dudu sleeping soundly in pajamas'
  },
  sad: {
    type: 'sad',
    emoji: '🌧️',
    label: 'Gentle Blue / Down',
    color: '#60A5FA',
    bgSoft: '#EFF6FF',
    sticker: '/bubu-dudu/mood-sad.png',
    stickerGif: '/bubu-dudu/mood-sad.gif',
    bubuDuduAction: 'Dudu crying gentle tears needing comfort'
  }
};

export interface VocabItem {
  word: string;
  meaning: string;
  example?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  avatarEmoji?: string;
  targetDailyWords?: number;
  createdAt: string;
}

export interface DiaryEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  mood: MoodType;
  weather?: string;
  vocabList?: VocabItem[];
  gratitude?: string[];
  audioUrl?: string | null;
  audioDuration?: number | null; // in seconds
  wordCount: number;
  promptQuestion?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEntryDto {
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  mood: MoodType;
  weather?: string;
  vocabList?: VocabItem[];
  gratitude?: string[];
  audioDuration?: number | null;
  promptQuestion?: string | null;
}

export interface UpdateEntryDto extends Partial<CreateEntryDto> {
  removeAudio?: boolean;
}

export interface DaySummary {
  date: string;
  hasEntry: boolean;
  entryId?: string;
  title?: string;
  mood?: MoodType;
  hasAudio: boolean;
  wordCount: number;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalEntries: number;
  totalWords: number;
  totalAudioSeconds: number;
  thisMonthCount: number;
}

export interface EnglishPrompt {
  id: string;
  prompt: string;
  category: 'daily' | 'gratitude' | 'growth' | 'fun' | 'reflection';
  sampleStarters: string[];
}

export const ENGLISH_PROMPTS: EnglishPrompt[] = [
  {
    id: 'p1',
    category: 'daily',
    prompt: 'What was the brightest moment of your day today?',
    sampleStarters: ['Today, the best part was when...', 'I felt truly happy today because...']
  },
  {
    id: 'p2',
    category: 'gratitude',
    prompt: 'Name 3 little things that made you feel grateful today.',
    sampleStarters: ['I am thankful for...', 'A small blessing today was...']
  },
  {
    id: 'p3',
    category: 'growth',
    prompt: 'What was one new thing you learned or practiced today?',
    sampleStarters: ['Today, I discovered that...', 'I challenged myself to...']
  },
  {
    id: 'p4',
    category: 'reflection',
    prompt: 'How did your heart and mind feel as you went through your day?',
    sampleStarters: ['Emotionally, I felt...', 'My mind was occupied with...']
  },
  {
    id: 'p5',
    category: 'fun',
    prompt: 'If today was a chapter in your favorite book, what would its title be?',
    sampleStarters: ['I would name today\'s chapter...', 'Today felt like a story about...']
  },
  {
    id: 'p6',
    category: 'daily',
    prompt: 'Who did you talk to today, and what meaningful words did you share?',
    sampleStarters: ['I had a lovely conversation with...', 'Someone said something that stuck with me:']
  },
  {
    id: 'p7',
    category: 'growth',
    prompt: 'What is one kind thing you did for yourself or someone else today?',
    sampleStarters: ['To be kind to myself today, I...', 'I helped someone by...']
  }
];

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  password: string;
  name: string;
  avatarEmoji?: string;
}

export interface UserBackupStatus {
  googleDriveConnected: boolean;
  googleDriveEmail?: string | null;
  autoBackupEnabled: boolean;
  lastBackupAt?: string | null;
  isOAuthAppConfigured: boolean;
  recentBackups: { filename: string; size: number; createdAt: string }[];
}
