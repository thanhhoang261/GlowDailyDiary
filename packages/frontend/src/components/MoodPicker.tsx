import React from 'react';
import { MoodType, MOODS } from '@diary/shared';

interface MoodPickerProps {
  selectedMood: MoodType;
  onChange: (mood: MoodType) => void;
}

export const MoodPicker: React.FC<MoodPickerProps> = ({ selectedMood, onChange }) => {
  const moodList = Object.values(MOODS);

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-xs font-bold uppercase tracking-wider text-glow-muted">
        How is your heart feeling today? 💭
      </label>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {moodList.map((m) => {
          const isSelected = selectedMood === m.type;
          return (
            <button
              key={m.type}
              type="button"
              onClick={() => onChange(m.type)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all bouncy-button border ${
                isSelected
                  ? 'border-pink-300 shadow-cute scale-105 ring-2 ring-pink-200'
                  : 'border-pink-100/70 bg-pink-50/30 hover:bg-white text-glow-cocoa'
              }`}
              style={{
                backgroundColor: isSelected ? m.bgSoft : undefined,
                color: isSelected ? '#4A3E3D' : undefined,
              }}
            >
              <span className="text-base">{m.emoji}</span>
              <span>{m.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
