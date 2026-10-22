import React, { useState } from 'react';
import { Sparkles, Shuffle, ArrowRight } from 'lucide-react';
import { ENGLISH_PROMPTS, EnglishPrompt } from '@diary/shared';

interface EnglishPromptBannerProps {
  currentPrompt?: string | null;
  onSelectPrompt: (promptText: string) => void;
  onInsertStarter?: (starter: string) => void;
}

export const EnglishPromptBanner: React.FC<EnglishPromptBannerProps> = ({
  currentPrompt,
  onSelectPrompt,
  onInsertStarter,
}) => {
  const [activePrompt, setActivePrompt] = useState<EnglishPrompt>(() => {
    if (currentPrompt) {
      const found = ENGLISH_PROMPTS.find((p) => p.prompt === currentPrompt);
      if (found) return found;
    }
    // Pick based on day of month as daily seed
    const day = new Date().getDate();
    return ENGLISH_PROMPTS[day % ENGLISH_PROMPTS.length];
  });

  const handleShuffle = () => {
    const remaining = ENGLISH_PROMPTS.filter((p) => p.id !== activePrompt.id);
    const random = remaining[Math.floor(Math.random() * remaining.length)];
    setActivePrompt(random);
    onSelectPrompt(random.prompt);
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 via-rose-50 to-pink-50 rounded-3xl p-4 sm:p-5 border border-pink-100 shadow-soft relative overflow-hidden">
      <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 w-20 h-20 bg-pink-200/30 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-pink-100/80 text-pink-700 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-pink-500" />
            Daily English Spark
          </span>
          <span className="text-xs text-glow-muted capitalize">
            • {activePrompt.category}
          </span>
        </div>

        <button
          type="button"
          onClick={handleShuffle}
          className="flex items-center gap-1 text-xs font-bold text-glow-muted hover:text-pink-600 bg-white/80 hover:bg-white px-3 py-1.5 rounded-full border border-pink-100 transition shadow-sm bouncy-button"
        >
          <Shuffle className="w-3 h-3" />
          <span>Shuffle prompt</span>
        </button>
      </div>

      <h3 className="font-bold text-glow-cocoa text-base sm:text-lg mb-3 leading-snug">
        “{activePrompt.prompt}”
      </h3>

      {/* Sentence starters */}
      {activePrompt.sampleStarters && activePrompt.sampleStarters.length > 0 && onInsertStarter && (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-pink-100/70">
          <span className="text-xs font-semibold text-glow-muted">
            Starter ideas:
          </span>
          {activePrompt.sampleStarters.map((starter, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onInsertStarter(starter)}
              className="text-xs bg-white/90 hover:bg-pink-100/60 text-pink-800 font-medium px-3 py-1 rounded-xl border border-pink-100 flex items-center gap-1 transition shadow-2xs bouncy-button"
              title="Click to insert into your entry"
            >
              <span>{starter}</span>
              <ArrowRight className="w-2.5 h-2.5 text-pink-400" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
