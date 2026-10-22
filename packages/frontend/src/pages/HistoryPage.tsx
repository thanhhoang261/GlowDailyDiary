import React, { useState, useEffect } from 'react';
import { Search, Mic, BookOpen, Calendar, Heart, ArrowRight } from 'lucide-react';
import { DiaryEntry, MOODS, MoodType } from '@diary/shared';
import { api } from '../services/api';

interface HistoryPageProps {
  onSelectDate: (date: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onSelectDate }) => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      if (searchQuery.trim()) {
        const res = await api.searchEntries(searchQuery.trim());
        setEntries(res.entries);
        setTotalCount(res.entries.length);
      } else {
        const res = await api.getRecentEntries(1, 30);
        setEntries(res.entries);
        setTotalCount(res.total);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEntries();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header & Search Bar */}
      <div className="bg-white/95 rounded-3xl p-5 sm:p-7 border border-pink-100 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-glow-cocoa flex items-center gap-2">
            My English Journey 📖
          </h2>
          <p className="text-xs text-glow-muted">
            {totalCount} chapters written & voiced with love
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-pink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search words, titles, thoughts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-pink-50/50 hover:bg-pink-50 focus:bg-white text-xs font-semibold text-glow-cocoa border border-pink-100 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-pink-100 transition"
          />
        </div>
      </div>

      {/* Entries List */}
      {loading ? (
        <div className="bg-white/80 rounded-3xl p-12 text-center border border-pink-100 shadow-soft">
          <div className="text-3xl animate-bounce mb-2">🌸</div>
          <p className="font-bold text-glow-muted text-sm">Loading memories...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white/90 rounded-3xl p-12 text-center border border-dashed border-pink-200 shadow-soft">
          <p className="text-4xl mb-3">🌱</p>
          <h3 className="font-bold text-glow-cocoa text-base mb-1">
            {searchQuery ? 'No matching memories found' : 'No entries yet'}
          </h3>
          <p className="text-xs text-glow-muted mb-4">
            {searchQuery
              ? 'Try searching with another keyword or English word'
              : 'Start your very first English diary entry today!'}
          </p>
          <button
            onClick={() => onSelectDate(new Date().toISOString().split('T')[0])}
            className="px-5 py-2.5 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold rounded-2xl shadow-cute text-xs bouncy-button"
          >
            Write Today's Glow ✍️
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {entries.map((entry) => {
            const moodMeta = MOODS[entry.mood as MoodType];
            const dateObj = new Date(entry.date + 'T00:00:00');
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
            const monthDay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            return (
              <div
                key={entry.id}
                onClick={() => onSelectDate(entry.date)}
                className="bg-white/95 rounded-3xl p-5 sm:p-6 border border-pink-100 hover:border-pink-300 shadow-soft hover:shadow-cute transition-all cursor-pointer group flex flex-col gap-3"
              >
                {/* Entry header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-1.5 rounded-2xl bg-pink-50">
                      {moodMeta ? moodMeta.emoji : '🌸'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-glow-cocoa">
                          {monthDay}
                        </span>
                        <span className="text-[11px] font-semibold text-glow-muted">
                          ({dayName})
                        </span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
                        {moodMeta?.label || entry.mood}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {entry.audioUrl && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200/80 px-2.5 py-1 rounded-full">
                        <Mic className="w-3 h-3" /> Voice
                      </span>
                    )}
                    <span className="text-[11px] font-bold text-glow-muted bg-stone-50 px-2.5 py-1 rounded-full border border-stone-200/60">
                      {entry.wordCount} words
                    </span>
                  </div>
                </div>

                {/* Entry title */}
                <h3 className="font-extrabold text-lg text-glow-cocoa group-hover:text-rose-600 transition">
                  {entry.title || 'Untitled English Glow'}
                </h3>

                {/* Content snippet */}
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed line-clamp-3">
                  {entry.content || (entry.audioUrl ? 'Voice note recorded for this day.' : 'No text written.')}
                </p>

                {/* Inline Audio Player if audio exists */}
                {entry.audioUrl && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="pt-2"
                  >
                    <audio
                      controls
                      src={entry.audioUrl}
                      className="w-full h-8 accent-pink-500"
                    />
                  </div>
                )}

                {/* Vocab pills preview */}
                {entry.vocabList && entry.vocabList.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-bold text-purple-700 mr-1 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> Vocab:
                    </span>
                    {entry.vocabList.slice(0, 4).map((v, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded-xl bg-purple-50 text-purple-800 border border-purple-100"
                      >
                        {v.word}
                      </span>
                    ))}
                    {entry.vocabList.length > 4 && (
                      <span className="text-[10px] text-purple-500 font-bold">
                        +{entry.vocabList.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* Card footer */}
                <div className="flex items-center justify-between pt-2 border-t border-pink-100/60 text-xs">
                  <span className="text-glow-muted text-[11px]">
                    Weather: {entry.weather || 'sunny'}
                  </span>
                  <span className="text-rose-500 font-bold flex items-center gap-1 group-hover:translate-x-1 transition duration-150">
                    Open Entry <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
