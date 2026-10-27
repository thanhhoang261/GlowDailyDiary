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
  CoachReport,
  AdminSystemOverview,
  AdminUserItem,
  AdminEntryItem,
  AdminAudioFileItem,
  AdminBackupFileItem,
  CreateUserDto,
  UpdateUserAdminDto,
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

  resetPassword: (dto: { username: string; newPassword: string }) =>
    request<AuthResponse & { message: string }>('/api/auth/reset-password', {
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

  // AI Personalized English Coach
  getCoachReport: () =>
    request<{ report: CoachReport }>('/api/diary/coach', { method: 'GET' }),

  refreshCoachReport: (apiKey?: string) =>
    request<{ report: CoachReport; success: boolean; message: string }>('/api/diary/coach/refresh', {
      method: 'POST',
      body: JSON.stringify({ apiKey }),
    }),

  // ==========================================
  // Admin Management API
  // ==========================================
  getAdminOverview: () =>
    request<{ overview: AdminSystemOverview }>('/api/admin/overview', { method: 'GET' }),

  vacuumDatabase: () =>
    request<{ success: boolean; message: string; beforeSizeBytes: number; afterSizeBytes: number; freedBytes: number }>(
      '/api/admin/maintenance/vacuum',
      { method: 'POST' }
    ),

  cleanOrphanAudio: () =>
    request<{ success: boolean; message: string; cleanedCount: number; cleanedBytes: number }>(
      '/api/admin/maintenance/clean-audio',
      { method: 'POST' }
    ),

  testOpenAiAdmin: () =>
    request<{ success: boolean; latencyMs?: number; message: string }>(
      '/api/admin/test-openai',
      { method: 'POST' }
    ),

  getAdminUsers: () =>
    request<{ users: AdminUserItem[] }>('/api/admin/users', { method: 'GET' }),

  createAdminUser: (dto: CreateUserDto) =>
    request<{ success: boolean; message: string; user: any }>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  updateAdminUser: (id: string, dto: UpdateUserAdminDto) =>
    request<{ success: boolean; message: string; user: any }>(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  resetUserPasswordAdmin: (id: string, newPassword: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),

  deleteAdminUser: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/users/${id}`, {
      method: 'DELETE',
    }),

  getAdminEntries: (params?: { q?: string; mood?: string; userId?: string; page?: number; limit?: number }) => {
    const sp = new URLSearchParams();
    if (params?.q) sp.set('q', params.q);
    if (params?.mood) sp.set('mood', params.mood);
    if (params?.userId) sp.set('userId', params.userId);
    if (params?.page) sp.set('page', String(params.page));
    if (params?.limit) sp.set('limit', String(params.limit));
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return request<{ total: number; page: number; limit: number; entries: AdminEntryItem[] }>(
      `/api/admin/entries${qs}`,
      { method: 'GET' }
    );
  },

  deleteAdminEntry: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/entries/${id}`, {
      method: 'DELETE',
    }),

  exportAllEntriesJson: async () => {
    const token = tokenStorage.get();
    const res = await fetch('/api/admin/entries/export', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glow-diary-all-entries-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  getAdminAudioFiles: () =>
    request<{ files: AdminAudioFileItem[] }>('/api/admin/audio-files', { method: 'GET' }),

  deleteAdminAudioFile: (filename: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/audio-files/${filename}`, {
      method: 'DELETE',
    }),

  getAdminBackups: () =>
    request<{ backups: AdminBackupFileItem[] }>('/api/admin/backups', { method: 'GET' }),

  createAdminBackup: () =>
    request<{ success: boolean; message: string; filename: string }>('/api/admin/backups/create', {
      method: 'POST',
    }),

  deleteAdminBackup: (filename: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/backups/${filename}`, {
      method: 'DELETE',
    }),

  downloadAdminBackup: (filename: string) => {
    const token = tokenStorage.get();
    window.open(`/api/admin/backups/download/${filename}?token=${token || ''}`, '_blank');
  },

  downloadLiveDatabase: () => {
    const token = tokenStorage.get();
    window.open(`/api/admin/database/download?token=${token || ''}`, '_blank');
  },
};
