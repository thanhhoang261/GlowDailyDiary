import React from 'react';
import { PenLine, Calendar, BookOpen, BarChart3, LogOut, Flame, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StreakStats } from '@diary/shared';
import { BubuAvatar } from './BubuAvatar';

export type NavTab = 'today' | 'calendar' | 'journey' | 'stats';

interface CuteNavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  streakStats?: StreakStats | null;
}

export const CuteNavbar: React.FC<CuteNavbarProps> = ({
  activeTab,
  onTabChange,
  streakStats,
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'today' as NavTab, label: "Today's Glow", icon: PenLine, emoji: '✍️' },
    { id: 'calendar' as NavTab, label: 'Calendar & Track', icon: Calendar, emoji: '📅' },
    { id: 'journey' as NavTab, label: 'My Journey', icon: BookOpen, emoji: '📖' },
    { id: 'stats' as NavTab, label: 'Milestones', icon: BarChart3, emoji: '✨' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-pink-100/80 shadow-2xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div
          onClick={() => onTabChange('today')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-200 via-pink-200 to-amber-100 flex items-center justify-center p-0.5 shadow-soft group-hover:scale-105 transition duration-200 overflow-hidden border border-pink-200/50">
            <img
              src="/bubu-dudu/bubu-dudu-snuggle.gif"
              alt="Bubu & Dudu"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="font-extrabold text-glow-cocoa text-lg leading-tight tracking-tight flex items-center gap-1.5">
              Bubu & Dudu Glow <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400 inline" />
            </h1>
            <p className="text-[11px] font-semibold text-glow-muted uppercase tracking-wider">
              Daily English Diary & Voice
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs (Desktop) */}
        <nav className="hidden md:flex items-center gap-1.5 bg-pink-50/70 p-1.5 rounded-2xl border border-pink-100/80">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all bouncy-button ${
                  isActive
                    ? 'bg-white text-rose-600 shadow-cute scale-100'
                    : 'text-glow-muted hover:text-glow-cocoa hover:bg-white/50'
                }`}
              >
                <span>{item.emoji}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right side: Streak & Profile */}
        <div className="flex items-center gap-3">
          {/* Streak Badge */}
          {streakStats && (
            <div
              onClick={() => onTabChange('calendar')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200/80 rounded-2xl cursor-pointer hover:bg-amber-100/60 transition bouncy-button"
              title="Click to view streak calendar"
            >
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
              <span className="font-extrabold text-xs text-amber-800">
                {streakStats.currentStreak}{' '}
                <span className="font-medium text-amber-700/80 hidden sm:inline">
                  {streakStats.currentStreak === 1 ? 'day' : 'days'}
                </span>
              </span>
            </div>
          )}

          {/* User Avatar */}
          <div className="flex items-center gap-2 bg-pink-50/80 pl-1.5 pr-3 py-1 rounded-2xl border border-pink-100">
            <BubuAvatar avatar={user?.avatarEmoji} size="xs" />
            <span className="text-xs font-bold text-glow-cocoa hidden sm:inline max-w-[90px] truncate">
              {user?.name || user?.username}
            </span>
            <button
              onClick={logout}
              className="p-1 text-glow-muted hover:text-rose-500 transition rounded-lg hover:bg-white ml-1"
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden flex items-center justify-around bg-white border-t border-pink-100 py-2 px-3">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-1 text-[11px] font-bold p-1 rounded-xl transition ${
                isActive ? 'text-rose-600' : 'text-glow-muted'
              }`}
            >
              <span className="text-base">{item.emoji}</span>
              <span>{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
