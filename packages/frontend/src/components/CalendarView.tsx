import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Calendar as CalendarIcon,
  Mic,
  PenTool,
  Sparkles,
} from 'lucide-react';
import { DaySummary, StreakStats, MOODS, MoodType } from '@diary/shared';
import { api } from '../services/api';

interface CalendarViewProps {
  onSelectDate: (date: string) => void;
  selectedDate: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onSelectDate,
  selectedDate,
}) => {
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1); // 1-12
  const [summaries, setSummaries] = useState<Record<string, DaySummary>>({});
  const [streakStats, setStreakStats] = useState<StreakStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMonthData = async (year: number, month: number) => {
    setLoading(true);
    try {
      const [monthRes, streakRes] = await Promise.all([
        api.getMonthSummaries(year, month),
        api.getStreakStats(),
      ]);

      const map: Record<string, DaySummary> = {};
      for (const item of monthRes.summaries) {
        map[item.date] = item;
      }
      setSummaries(map);
      setStreakStats(streakRes.stats);
    } catch (err) {
      console.error('Failed to fetch month summaries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthData(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Days in month calculation
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 is Sun

  const todayStr = new Date().toISOString().split('T')[0];

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  const weekDayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col gap-6 max-w-5xl w-full mx-auto pb-12">
      {/* Streak Hero Card */}
      {streakStats && (
        <div className="bg-gradient-to-r from-amber-100/70 via-rose-100/70 to-pink-100/70 rounded-3xl p-5 sm:p-6 border border-pink-200/70 shadow-cute flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-16 h-16 rounded-3xl bg-white shadow-soft flex items-center justify-center text-3xl animate-floatCute">
              🔥
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-amber-800 bg-amber-200/70 px-2.5 py-0.5 rounded-full">
                  Writing Streak
                </span>
                <span className="text-xs font-semibold text-glow-muted">
                  Best: {streakStats.longestStreak} days
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-glow-cocoa mt-1">
                {streakStats.currentStreak}{' '}
                <span className="text-lg font-bold text-glow-muted">
                  {streakStats.currentStreak === 1 ? 'Day Strong' : 'Days Strong'}
                </span>
              </h2>
              <p className="text-xs text-glow-muted mt-0.5">
                {streakStats.currentStreak > 0
                  ? "Every day you write in English brings you closer to effortless fluency! 🌱"
                  : "Start or continue your streak today with a little English glow ✨"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-pink-100 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-glow-muted">
                This Month
              </p>
              <p className="text-lg font-black text-rose-500">
                {streakStats.thisMonthCount} entries
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-pink-100 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-glow-muted">
                Words
              </p>
              <p className="text-lg font-black text-amber-600">
                {streakStats.totalWords}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Calendar Card */}
      <div className="bg-white/95 rounded-3xl p-5 sm:p-7 border border-pink-100 shadow-soft">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-pink-100 text-pink-600 rounded-2xl">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-glow-cocoa text-xl">
                {monthNames[currentMonth - 1]} {currentYear}
              </h3>
              <p className="text-xs text-glow-muted">
                Click any day to write or revisit your voice notes & memories
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2.5 rounded-2xl bg-pink-50 hover:bg-pink-100 text-glow-cocoa transition bouncy-button"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const now = new Date();
                setCurrentYear(now.getFullYear());
                setCurrentMonth(now.getMonth() + 1);
              }}
              className="px-3 py-1.5 rounded-2xl bg-pink-50 hover:bg-pink-100 text-xs font-bold text-glow-cocoa transition bouncy-button"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2.5 rounded-2xl bg-pink-50 hover:bg-pink-100 text-glow-cocoa transition bouncy-button"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 text-center mb-2">
          {weekDayHeaders.map((head, i) => (
            <div
              key={head}
              className={`text-xs font-bold uppercase tracking-wider py-1 ${
                i === 0 || i === 6 ? 'text-rose-400' : 'text-glow-muted'
              }`}
            >
              {head}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {daysArray.map((day, idx) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="h-24 sm:h-28 rounded-2xl bg-pink-50/20 opacity-30"
                />
              );
            }

            const dayStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const summary = summaries[dayStr];
            const isToday = dayStr === todayStr;
            const isSelected = dayStr === selectedDate;

            const moodMeta = summary?.mood ? MOODS[summary.mood as MoodType] : null;

            return (
              <div
                key={dayStr}
                onClick={() => onSelectDate(dayStr)}
                className={`h-24 sm:h-28 rounded-2xl p-2 cursor-pointer transition-all flex flex-col justify-between border relative bouncy-button group ${
                  isSelected
                    ? 'ring-2 ring-rose-400 bg-rose-50/70 border-rose-300 shadow-cute'
                    : isToday
                    ? 'border-amber-300 bg-amber-50/50 hover:bg-amber-50/80 shadow-2xs'
                    : summary
                    ? 'border-pink-100 bg-white hover:bg-pink-50/40 hover:border-pink-200 shadow-2xs'
                    : 'border-slate-100 bg-white/60 hover:bg-white hover:border-pink-100'
                }`}
              >
                {/* Date header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-extrabold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-amber-400 text-white shadow-2xs'
                        : isSelected
                        ? 'bg-rose-500 text-white'
                        : 'text-glow-cocoa'
                    }`}
                  >
                    {day}
                  </span>

                  {/* Audio badge */}
                  {summary?.hasAudio && (
                    <span
                      className="p-1 bg-rose-100 text-rose-600 rounded-lg text-[10px]"
                      title="Includes Voice Note"
                    >
                      <Mic className="w-3 h-3" />
                    </span>
                  )}
                </div>

                {/* Mood Sticker & Content preview */}
                {summary ? (
                  <div className="flex flex-col items-center justify-center my-auto">
                    {moodMeta?.sticker ? (
                      <img
                        src={moodMeta.sticker}
                        alt={moodMeta.label}
                        className="w-8 h-8 sm:w-9 sm:h-9 object-contain transform group-hover:scale-115 transition duration-150 drop-shadow-xs"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-xl sm:text-2xl transform group-hover:scale-115 transition duration-150">
                        {moodMeta ? moodMeta.emoji : '🌸'}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-glow-muted truncate max-w-full mt-0.5">
                      {summary.wordCount > 0 ? `${summary.wordCount} words` : 'Voice entry'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full opacity-0 group-hover:opacity-100 transition">
                    <span className="text-[11px] font-bold text-pink-400 flex items-center gap-0.5">
                      <PenTool className="w-2.5 h-2.5" /> Write
                    </span>
                  </div>
                )}

                {/* Little dot if written */}
                {summary && (
                  <div className="w-full flex justify-center pb-0.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: moodMeta?.color || '#FB7185' }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
