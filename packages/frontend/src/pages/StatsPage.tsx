import React, { useState, useEffect } from 'react';
import { Flame, Sparkles, Trophy, Mic, BookOpen, Heart, User, Check } from 'lucide-react';
import { StreakStats } from '@diary/shared';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BackupManager } from '../components/BackupManager';
import { BUBU_AVATARS, BubuAvatar } from '../components/BubuAvatar';

export const StatsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [stats, setStats] = useState<StreakStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile edit state
  const [name, setName] = useState(user?.name || '');
  const [avatarEmoji, setAvatarEmoji] = useState(user?.avatarEmoji || '🌸');
  const [targetWords, setTargetWords] = useState(user?.targetDailyWords || 80);
  const [saveMsg, setSaveMsg] = useState(false);
  const [aiConfig, setAiConfig] = useState<{ hasCustomKey: boolean; hasEnvKey: boolean; isReady: boolean } | null>(null);
  const [openaiKeyInput, setOpenaiKeyInput] = useState('');
  const [keySavedMsg, setKeySavedMsg] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchAiConfig();
  }, []);

  const fetchAiConfig = async () => {
    try {
      const res = await api.getAiConfig();
      setAiConfig(res.config);
    } catch {
      // ignore
    }
  };

  const handleSaveAiKey = async () => {
    try {
      await api.setAiKey(openaiKeyInput.trim() || null);
      setOpenaiKeyInput('');
      setKeySavedMsg(true);
      await fetchAiConfig();
      setTimeout(() => setKeySavedMsg(false), 3000);
    } catch (err: any) {
      alert(`Failed to save OpenAI key: ${err.message}`);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.getStreakStats();
      setStats(res.stats);
    } catch (err) {
      console.error('Error fetching streak stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        name,
        avatarEmoji,
        targetDailyWords: Number(targetWords),
      });
      setSaveMsg(true);
      setTimeout(() => setSaveMsg(false), 3000);
    } catch (err: any) {
      alert(`Failed to update profile: ${err.message}`);
    }
  };

  const totalAudioMinutes = stats ? Math.round(stats.totalAudioSeconds / 60) : 0;

  return (
    <div className="flex flex-col gap-6 max-w-5xl w-full mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-pink-100/80 via-amber-100/70 to-rose-100/80 rounded-3xl p-6 sm:p-8 border border-pink-200 shadow-soft text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-white shadow-soft flex items-center justify-center p-2 border border-pink-100">
            <BubuAvatar avatar={user?.avatarEmoji} size="xl" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-rose-600 bg-white/80 px-3 py-1 rounded-full border border-pink-200">
              Personal English Journey
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-glow-cocoa mt-1.5">
              {user?.name || user?.username}'s Diary
            </h2>
            <p className="text-xs text-glow-muted mt-1">
              Cultivating the habit of writing & speaking English every single day
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/90 px-5 py-3 rounded-2xl shadow-soft text-center">
            <p className="text-xs font-bold text-glow-muted uppercase tracking-wider">
              Goal / Day
            </p>
            <p className="text-xl font-black text-rose-500">
              {user?.targetDailyWords || 80} words
            </p>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="bg-white/95 rounded-3xl p-5 border border-amber-200 shadow-soft flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl mb-2">
            🔥
          </div>
          <span className="text-xs font-bold text-glow-muted uppercase tracking-wider">
            Current Streak
          </span>
          <span className="text-2xl font-black text-amber-700 mt-1">
            {stats?.currentStreak || 0} Days
          </span>
          <span className="text-[11px] text-amber-600/90 font-semibold mt-0.5">
            Best: {stats?.longestStreak || 0} days
          </span>
        </div>

        {/* Total Entries */}
        <div className="bg-white/95 rounded-3xl p-5 border border-rose-200 shadow-soft flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-2xl mb-2">
            📝
          </div>
          <span className="text-xs font-bold text-glow-muted uppercase tracking-wider">
            Total Entries
          </span>
          <span className="text-2xl font-black text-rose-600 mt-1">
            {stats?.totalEntries || 0}
          </span>
          <span className="text-[11px] text-rose-500 font-semibold mt-0.5">
            {stats?.thisMonthCount || 0} this month
          </span>
        </div>

        {/* Total English Words */}
        <div className="bg-white/95 rounded-3xl p-5 border border-purple-200 shadow-soft flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center text-2xl mb-2">
            📚
          </div>
          <span className="text-xs font-bold text-glow-muted uppercase tracking-wider">
            Words Written
          </span>
          <span className="text-2xl font-black text-purple-700 mt-1">
            {stats?.totalWords || 0}
          </span>
          <span className="text-[11px] text-purple-600/90 font-semibold mt-0.5">
            ~{Math.round((stats?.totalWords || 0) / 250)} pages
          </span>
        </div>

        {/* Total Audio Voice Notes */}
        <div className="bg-white/95 rounded-3xl p-5 border border-emerald-200 shadow-soft flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mb-2">
            🎙️
          </div>
          <span className="text-xs font-bold text-glow-muted uppercase tracking-wider">
            Voice Time
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-1">
            {totalAudioMinutes} mins
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            English spoken
          </span>
        </div>
      </div>

      {/* Profile & Target Settings Form */}
      <div className="bg-white/95 rounded-3xl p-6 sm:p-7 border border-pink-100 shadow-soft">
        <div className="flex items-center gap-2.5 mb-5">
          <span className="p-2 bg-pink-100 text-pink-600 rounded-2xl">
            <User className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-extrabold text-glow-cocoa text-lg">
              Personal Settings & Goals
            </h3>
            <p className="text-xs text-glow-muted">
              Customize your profile name, mascot emoji, and daily English word target
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="flex flex-col gap-5 max-w-lg">
          {/* Display Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-glow-muted uppercase tracking-wider">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-4 py-2.5 rounded-2xl bg-pink-50/50 border border-pink-100 focus:outline-none focus:border-rose-400 text-sm font-bold text-glow-cocoa"
            />
          </div>

          {/* Avatar Mascot */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-glow-muted uppercase tracking-wider">
              Choose your Mascot Emoji
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {BUBU_AVATARS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setAvatarEmoji(av.id)}
                  className={`w-12 h-12 rounded-2xl p-1.5 flex items-center justify-center transition bouncy-button border shrink-0 ${
                    avatarEmoji === av.id
                      ? 'border-rose-400 bg-rose-50 scale-110 shadow-cute ring-2 ring-rose-200'
                      : 'border-pink-100 bg-white/80 hover:bg-white'
                  }`}
                  title={av.label}
                >
                  <img src={av.src} alt={av.label} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          </div>

          {/* Daily Word Target */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-glow-muted uppercase tracking-wider">
                Daily Word Target
              </label>
              <span className="text-xs font-black text-rose-500">
                {targetWords} words
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="300"
              step="10"
              value={targetWords}
              onChange={(e) => setTargetWords(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-pink-100 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <p className="text-[11px] text-glow-muted">
              Aim for 60–100 words/day to keep it fun and stress-free!
            </p>
          </div>

          {/* OpenAI Key Configuration */}
          <div className="flex flex-col gap-1.5 pt-3 border-t border-pink-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-glow-muted uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>OpenAI API Key (Grammar Review)</span>
              </label>
              {aiConfig?.isReady && (
                <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {aiConfig.hasCustomKey ? 'Custom key active' : 'Server key active'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="password"
                placeholder={aiConfig?.hasCustomKey ? 'sk-••••••••••••••••' : 'Paste sk-... key to enable AI review'}
                value={openaiKeyInput}
                onChange={(e) => setOpenaiKeyInput(e.target.value)}
                className="flex-1 px-4 py-2 rounded-2xl bg-pink-50/50 border border-pink-100 focus:outline-none focus:border-rose-400 font-mono text-xs text-glow-cocoa"
              />
              <button
                type="button"
                onClick={handleSaveAiKey}
                disabled={!openaiKeyInput.trim() && !aiConfig?.hasCustomKey}
                className="px-4 py-2 rounded-2xl bg-pink-100/80 hover:bg-pink-200 text-glow-cocoa text-xs font-bold transition bouncy-button disabled:opacity-40"
              >
                {openaiKeyInput.trim() ? 'Save Key' : 'Clear'}
              </button>
            </div>
            {keySavedMsg && (
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-500" /> OpenAI key updated!
              </span>
            )}
            <p className="text-[11px] text-glow-muted">
              Used strictly to check spelling and grammar for your English journal entries.
            </p>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-bold rounded-2xl shadow-cute text-xs bouncy-button"
            >
              Save Preferences
            </button>
            {saveMsg && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <Check className="w-4 h-4 text-emerald-500" /> Saved!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Cloud & Local Backup Manager */}
      <BackupManager />
    </div>
  );
};
