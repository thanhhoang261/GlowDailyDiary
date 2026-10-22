import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Calendar,
  Save,
  Trash2,
  Plus,
  X,
  Sparkles,
  CheckCircle2,
  Clock,
  Heart,
  CloudSun,
} from 'lucide-react';
import { MoodType, DiaryEntry } from '@diary/shared';
import { api } from '../services/api';
import { MoodPicker } from './MoodPicker';
import { EnglishPromptBanner } from './EnglishPromptBanner';
import { AudioRecorder } from './AudioRecorder';
import { useAuth } from '../context/AuthContext';

interface DiaryEditorProps {
  initialDate: string;
  onEntrySaved?: (entry: DiaryEntry) => void;
  onEntryDeleted?: (date: string) => void;
}

const WEATHERS = [
  { id: 'sunny', emoji: '☀️', label: 'Sunny' },
  { id: 'partly-cloudy', emoji: '⛅', label: 'Partly Cloudy' },
  { id: 'rainy', emoji: '🌧️', label: 'Rainy' },
  { id: 'cozy-night', emoji: '🌙', label: 'Cozy Night' },
  { id: 'crisp-breeze', emoji: '🍃', label: 'Crisp Breeze' },
];

function countWords(str: string): number {
  if (!str) return 0;
  const cleaned = str.trim().replace(/[^\w\s'-]/g, ' ');
  return cleaned.split(/\s+/).filter(Boolean).length;
}

export const DiaryEditor: React.FC<DiaryEditorProps> = ({
  initialDate,
  onEntrySaved,
  onEntryDeleted,
}) => {
  const { user } = useAuth();
  const [date, setDate] = useState<string>(initialDate);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [mood, setMood] = useState<MoodType>('joyful');
  const [weather, setWeather] = useState<string>('sunny');
  const [promptQuestion, setPromptQuestion] = useState<string | null>(null);

  // Gratitude list
  const [gratitudeList, setGratitudeList] = useState<string[]>([]);
  const [newGratitude, setNewGratitude] = useState('');

  // Audio state
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const pendingAudioBlobRef = useRef<{ blob: Blob; duration: number } | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [hasExistingEntry, setHasExistingEntry] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const targetWords = user?.targetDailyWords || 80;
  const currentWordCount = countWords(`${title} ${content}`);
  const wordProgress = Math.min(100, Math.round((currentWordCount / targetWords) * 100));

  // Load entry whenever date changes
  useEffect(() => {
    loadDateEntry(date);
  }, [date]);

  const loadDateEntry = async (targetDate: string) => {
    setIsLoading(true);
    setSaveSuccess(false);
    pendingAudioBlobRef.current = null;

    try {
      const res = await api.getEntryByDate(targetDate);
      if (res.entry) {
        setTitle(res.entry.title || '');
        setContent(res.entry.content || '');
        setMood(res.entry.mood || 'joyful');
        setWeather(res.entry.weather || 'sunny');
        setGratitudeList(res.entry.gratitude || []);
        setAudioUrl(res.entry.audioUrl || null);
        setAudioDuration(res.entry.audioDuration || null);
        setPromptQuestion(res.entry.promptQuestion || null);
        setHasExistingEntry(true);
      } else {
        // Reset for empty new entry
        setTitle('');
        setContent('');
        setMood('joyful');
        setWeather('sunny');
        setGratitudeList([]);
        setAudioUrl(null);
        setAudioDuration(null);
        setPromptQuestion(null);
        setHasExistingEntry(false);
      }
    } catch (err) {
      console.error('Error loading entry for date:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioReady = (blob: Blob, duration: number) => {
    pendingAudioBlobRef.current = { blob, duration };
    setAudioDuration(duration);
  };

  const handleAudioDelete = async () => {
    pendingAudioBlobRef.current = null;
    setAudioUrl(null);
    setAudioDuration(null);
    try {
      await api.deleteAudio(date);
    } catch (err) {
      console.error('Error deleting audio:', err);
    }
  };

  const handleInsertStarter = (starter: string) => {
    setContent((prev) => {
      const separator = prev.length > 0 && !prev.endsWith('\n') ? '\n\n' : '';
      return `${prev}${separator}${starter} `;
    });
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleAddGratitude = () => {
    if (!newGratitude.trim()) return;
    setGratitudeList((prev) => [...prev, newGratitude.trim()]);
    setNewGratitude('');
  };

  const handleRemoveGratitude = (index: number) => {
    setGratitudeList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // 1. Save entry content
      const entryRes = await api.saveEntry({
        date,
        title: title || 'A Beautiful English Day',
        content,
        mood,
        weather,
        vocabList: [],
        gratitude: gratitudeList,
        promptQuestion,
      });

      // 2. Upload audio if freshly recorded
      if (pendingAudioBlobRef.current) {
        const audioRes = await api.uploadAudio(
          date,
          pendingAudioBlobRef.current.blob,
          pendingAudioBlobRef.current.duration
        );
        entryRes.entry.audioUrl = audioRes.audioUrl;
        entryRes.entry.audioDuration = audioRes.audioDuration;
        setAudioUrl(audioRes.audioUrl);
        pendingAudioBlobRef.current = null;
      }

      setHasExistingEntry(true);
      setSaveSuccess(true);

      // Trigger confetti celebration!
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#F472B6', '#FBBF24', '#34D399', '#818CF8', '#FB7185'],
      });

      if (onEntrySaved) {
        onEntrySaved(entryRes.entry);
      }

      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      alert(`Could not save entry: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (window.confirm(`Are you sure you want to delete the entry for ${date}?`)) {
      try {
        await api.deleteEntry(date);
        setHasExistingEntry(false);
        setTitle('');
        setContent('');
        setGratitudeList([]);
        setAudioUrl(null);
        if (onEntryDeleted) {
          onEntryDeleted(date);
        }
      } catch (err: any) {
        alert(`Failed to delete: ${err.message}`);
      }
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="flex flex-col gap-6 max-w-5xl w-full mx-auto pb-12">
      {/* Top Date Toolbar */}
      <div className="bg-white/95 rounded-3xl p-4 sm:p-5 border border-pink-100 shadow-soft flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="p-2.5 bg-rose-100/70 text-rose-600 rounded-2xl">
            <Calendar className="w-5 h-5" />
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="font-bold text-glow-cocoa bg-pink-50/60 hover:bg-pink-100/60 px-3.5 py-1.5 rounded-2xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm transition"
            />
            {date === todayStr && (
              <span className="text-[11px] font-extrabold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                Today 🌸
              </span>
            )}
          </div>
        </div>

        {/* Quick actions & Save */}
        <div className="flex items-center gap-2">
          {date !== todayStr && (
            <button
              type="button"
              onClick={() => setDate(todayStr)}
              className="text-xs font-bold text-glow-muted hover:text-rose-600 bg-pink-50/60 hover:bg-pink-100/60 px-3 py-1.5 rounded-2xl transition bouncy-button"
            >
              Jump to Today
            </button>
          )}

          {/* Delete button if entry exists */}
          {hasExistingEntry && (
            <button
              type="button"
              onClick={handleDeleteEntry}
              className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition"
              title="Delete this day's entry"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white font-bold text-xs rounded-2xl shadow-cute bouncy-button disabled:opacity-60 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Day ✨'}</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white/80 rounded-3xl p-12 text-center border border-pink-100 shadow-soft">
          <div className="text-3xl animate-bounce mb-2">🌸</div>
          <p className="font-bold text-glow-muted text-sm">
            Fetching your thoughts and memories...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          {/* Daily English Prompt */}
          <EnglishPromptBanner
            currentPrompt={promptQuestion}
            onSelectPrompt={(p) => setPromptQuestion(p)}
            onInsertStarter={handleInsertStarter}
          />

          {/* Mood & Weather Selection */}
          <div className="bg-white/95 rounded-3xl p-5 sm:p-6 border border-pink-100 shadow-soft flex flex-col gap-4">
            {/* Mood section */}
            <MoodPicker selectedMood={mood} onChange={setMood} />

            {/* Weather section */}
            <div className="border-t border-pink-100/70 pt-3 flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-glow-muted flex items-center gap-1.5">
                <CloudSun className="w-4 h-4 text-amber-500" />
                <span>Weather today</span>
              </label>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {WEATHERS.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setWeather(w.id)}
                    className={`px-3 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 border bouncy-button ${
                      weather === w.id
                        ? 'border-amber-300 bg-amber-50 text-amber-900 shadow-2xs ring-2 ring-amber-200'
                        : 'border-pink-100/70 bg-pink-50/30 hover:bg-white text-glow-cocoa'
                    }`}
                  >
                    <span className="text-sm">{w.emoji}</span>
                    <span>{w.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Title & Main Textarea */}
          <div className="bg-white/95 rounded-3xl p-5 sm:p-7 border border-pink-100 shadow-soft flex flex-col gap-4">
            {/* Title Input */}
            <input
              type="text"
              placeholder="Give today's story a title in English... 🌸"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl sm:text-2xl font-black text-glow-cocoa placeholder:text-pink-300/80 bg-transparent border-b border-pink-100 pb-2 focus:outline-none focus:border-rose-400 transition"
            />

            {/* Content Textarea */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                rows={10}
                placeholder="Write your day freely in English... What happened? How did it make you feel? What did you discover? Every word is a step forward! ✍️"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-4 rounded-2xl bg-pink-50/20 hover:bg-pink-50/40 focus:bg-white text-base leading-relaxed text-glow-cocoa placeholder:text-stone-400/80 border border-pink-100/80 focus:border-rose-300 focus:ring-4 focus:ring-pink-100 focus:outline-none transition resize-y font-medium"
              />
            </div>

            {/* English Word Counter & Target Progress */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-pink-100/70">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 text-xs font-bold text-glow-cocoa">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span>{currentWordCount} words written</span>
                </div>
                <span className="text-xs text-glow-muted">
                  • ~{Math.max(1, Math.ceil(currentWordCount / 130))} min read
                </span>
              </div>

              {/* Progress bar to target */}
              <div className="flex items-center gap-2 w-full sm:w-56">
                <div className="flex-1 bg-pink-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full transition-all duration-300"
                    style={{ width: `${wordProgress}%` }}
                  />
                </div>
                <span className="text-xs font-extrabold text-glow-muted whitespace-nowrap">
                  {currentWordCount}/{targetWords}
                </span>
              </div>
            </div>
          </div>

          {/* Voice Note Recorder Section */}
          <AudioRecorder
            existingAudioUrl={audioUrl}
            existingDuration={audioDuration}
            onAudioReady={handleAudioReady}
            onAudioDelete={handleAudioDelete}
            isSaving={isSaving}
          />

          {/* Gratitude Notes */}
          <div className="bg-white/95 rounded-3xl p-5 border border-pink-100 shadow-soft flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-rose-100 text-rose-600 rounded-2xl">
                <Heart className="w-4 h-4 fill-rose-500" />
              </span>
              <div>
                <h4 className="font-bold text-glow-cocoa text-sm">
                  3 Things I'm Grateful For 💖
                </h4>
                <p className="text-[11px] text-glow-muted">
                  Little moments of warmth and happiness
                </p>
              </div>
            </div>

            {/* Add gratitude input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. My mom's warm smile, sunny weather..."
                value={newGratitude}
                onChange={(e) => setNewGratitude(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddGratitude();
                  }
                }}
                className="flex-1 text-xs px-3 py-2 rounded-xl bg-rose-50/40 border border-rose-100 focus:outline-none focus:border-rose-300"
              />
              <button
                type="button"
                onClick={handleAddGratitude}
                className="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition bouncy-button"
                title="Add Gratitude"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Gratitude list */}
            <div className="flex flex-col gap-1.5 mt-1">
              {gratitudeList.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-2xl bg-rose-50/70 border border-rose-100/70 text-xs text-rose-900 shadow-2xs"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-rose-400" />
                    {item}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveGratitude(i)}
                    className="text-rose-400 hover:text-rose-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {gratitudeList.length === 0 && (
                <p className="text-xs text-glow-muted italic">
                  Count your small blessings for today!
                </p>
              )}
            </div>
          </div>

          {/* Bottom Save Action Bar */}
          <div className="bg-white/95 p-5 rounded-3xl border border-pink-100 shadow-soft flex flex-wrap items-center justify-between gap-4 mt-2">
            <div className="flex items-center gap-2">
              {saveSuccess && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 animate-bounce">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Entry & voice saved beautifully! 🌸</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white font-extrabold text-sm shadow-cute bouncy-button disabled:opacity-60 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Memory...' : 'Save My Day ✨'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
