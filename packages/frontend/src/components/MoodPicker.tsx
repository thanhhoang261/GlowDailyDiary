import React, { useState } from 'react';
import { MoodType, MOODS } from '@diary/shared';

interface MoodPickerProps {
  selectedMood: MoodType;
  onChange: (mood: MoodType) => void;
}

export const MoodPicker: React.FC<MoodPickerProps> = ({ selectedMood, onChange }) => {
  const moodList = Object.values(MOODS);
  const [hoveredMood, setHoveredMood] = useState<MoodType | null>(null);

  const activeMoodMeta = MOODS[selectedMood];

  return (
    <div className="flex flex-col gap-2.5 w-full">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-glow-muted flex items-center gap-1.5">
          <span>How is your heart feeling today?</span>
          <span className="text-pink-400 font-normal">· Bubu & Dudu Moods</span>
        </label>
        {activeMoodMeta && (
          <span className="text-[11px] font-bold text-rose-500 bg-rose-50/80 px-2 py-0.5 rounded-full border border-rose-100 hidden sm:inline-block">
            {activeMoodMeta.bubuDuduAction}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-1">
        {moodList.map((m) => {
          const isSelected = selectedMood === m.type;
          const isHovered = hoveredMood === m.type;
          const imageSrc = isSelected || isHovered ? m.stickerGif || m.sticker : m.sticker;

          return (
            <button
              key={m.type}
              type="button"
              onClick={() => onChange(m.type)}
              onMouseEnter={() => setHoveredMood(m.type)}
              onMouseLeave={() => setHoveredMood(null)}
              className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 bouncy-button border group relative ${
                isSelected
                  ? 'border-rose-400 shadow-cute scale-105 ring-2 ring-rose-200 bg-white'
                  : 'border-pink-100/80 bg-white/70 hover:bg-white hover:border-pink-300 text-glow-cocoa'
              }`}
              style={{
                backgroundColor: isSelected ? m.bgSoft : undefined,
              }}
              title={`${m.label}: ${m.bubuDuduAction}`}
            >
              {/* Authentic Bubu & Dudu Sticker */}
              <div className="w-12 h-12 flex items-center justify-center relative">
                <img
                  src={imageSrc}
                  alt={m.bubuDuduAction}
                  className={`w-11 h-11 object-contain transition-transform duration-200 ${
                    isSelected ? 'scale-110 drop-shadow-sm' : 'group-hover:scale-105'
                  }`}
                  loading="lazy"
                />
              </div>

              {/* Mood Label */}
              <span className={`text-[11px] font-bold mt-1 text-center truncate max-w-full ${
                isSelected ? 'text-rose-600 font-extrabold' : 'text-glow-cocoa'
              }`}>
                {m.label.split(' ')[0]}
              </span>

              {/* Active Indicator dot */}
              {isSelected && (
                <span
                  className="w-1.5 h-1.5 rounded-full mt-0.5"
                  style={{ backgroundColor: m.color }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
