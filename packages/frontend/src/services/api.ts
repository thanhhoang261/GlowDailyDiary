import {
  AuthResponse,
  LoginDto,
  RegisterDto,
  UserProfile,
  DiaryEntry,
  CreateEntryDto,
  DaySummary,
  StreakStats,
  AiReviewResult,
} from '@diary/shared';

const TOKEN_KEY = 'glow_diary_token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errData = await response.json();
      errorMsg = errData.message || errorMsg;
    } catch {
      errorMsg = response.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (dto: LoginDto) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  register: (dto: RegisterDto) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  getMe: () =>
    request<{ user: UserProfile }>('/api/auth/me', {
      method: 'GET',
    }),

  updateProfile: (data: Partial<UserProfile>) =>
    request<{ user: UserProfile }>('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Diary entries
  getEntryByDate: (date: string) =>
    request<{ entry: DiaryEntry | null }>(`/api/diary/entry/${date}`, {
      method: 'GET',
    }),

  saveEntry: (data: CreateEntryDto) =>
    request<{ entry: DiaryEntry }>('/api/diary/entry', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteEntry: (date: string) =>
    request<{ success: boolean }>(`/api/diary/entry/${date}`, {
      method: 'DELETE',
    }),

  getMonthSummaries: (year: number, month: number) =>
    request<{ summaries: DaySummary[] }>(`/api/diary/month?year=${year}&month=${month}`, {
      method: 'GET',
    }),

  getStreakStats: () =>
    request<{ stats: StreakStats }>('/api/diary/streak', {
      method: 'GET',
    }),

  getRecentEntries: (page = 1, limit = 15) =>
    request<{ entries: DiaryEntry[]; total: number; page: number; totalPages: number }>(
      `/api/diary/recent?page=${page}&limit=${limit}`,
      { method: 'GET' }
    ),

  searchEntries: (q: string) =>
    request<{ entries: DiaryEntry[] }>(`/api/diary/search?q=${encodeURIComponent(q)}`, {
      method: 'GET',
    }),

  // Audio upload
  uploadAudio: (date: string, audioBlob: Blob, duration?: number) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, `voice-${date}.webm`);
    formData.append('date', date);
    if (duration) {
      formData.append('duration', duration.toString());
    }

    return request<{ success: boolean; audioUrl: string; audioFilename: string; audioDuration?: number; entryId: string }>(
      '/api/audio/upload',
      {
        method: 'POST',
        body: formData,
      }
    );
  },

  deleteAudio: (date: string) =>
    request<{ success: boolean }>(`/api/audio/${date}`, {
      method: 'DELETE',
    }),

  // Backup & Personal Cloud Sync
  getBackupStatus: () =>
    request<import('@diary/shared').UserBackupStatus>('/api/backup/status', { method: 'GET' }),

  getGoogleAuthUrl: () =>
    request<{ url: string }>('/api/backup/google/auth-url', { method: 'GET' }),

  disconnectGoogleDrive: () =>
    request<{ success: boolean; message: string }>('/api/backup/google/disconnect', {
      method: 'POST',
    }),

  updateBackupSettings: (data: { autoBackupEnabled: boolean }) =>
    request<{ success: boolean; autoBackupEnabled: boolean }>('/api/backup/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  triggerBackupNow: () =>
    request<{ success: boolean; message: string; filename: string; size: number; googleDriveUploaded: boolean; webViewLink?: string }>(
      '/api/backup/now',
      {
        method: 'POST',
      }
    ),

  downloadBackup: async () => {
    const token = tokenStorage.get();
    const res = await fetch('/api/backup/download', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to download backup');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glow-diary-personal-backup-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // AI Grammar & Spelling Review
  reviewWithAi: (data: { date?: string; title?: string; content: string; apiKey?: string; saveKey?: boolean }) =>
    request<{ result: AiReviewResult }>('/api/diary/ai/review', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAiConfig: () =>
    request<{ config: { hasCustomKey: boolean; hasEnvKey: boolean; isReady: boolean } }>('/api/diary/ai/config', {
      method: 'GET',
    }),

  setAiKey: (apiKey: string | null) =>
    request<{ success: boolean; message: string }>('/api/diary/ai/key', {
      method: 'POST',
      body: JSON.stringify({ apiKey }),
    }),
};
