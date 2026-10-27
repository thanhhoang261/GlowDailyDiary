import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { CuteNavbar, NavTab } from './components/CuteNavbar';
import { DiaryEditor } from './components/DiaryEditor';
import { CalendarView } from './components/CalendarView';
import { HistoryPage } from './pages/HistoryPage';
import { StatsPage } from './pages/StatsPage';
import { EnglishCoachPage } from './pages/EnglishCoachPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { StreakStats } from '@diary/shared';
import { api } from './services/api';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('today');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [initialStarter, setInitialStarter] = useState<string | null>(null);
  const [streakStats, setStreakStats] = useState<StreakStats | null>(null);

  const refreshStreak = async () => {
    try {
      const res = await api.getStreakStats();
      setStreakStats(res.stats);
    } catch (err) {
      console.error('Error fetching streak:', err);
    }
  };

  useEffect(() => {
    if (user) {
      refreshStreak();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <img
            src="/bubu-dudu/mood-joyful.gif"
            alt="Bubu & Dudu"
            className="w-20 h-20 object-contain drop-shadow-sm animate-floatCute"
          />
          <p className="font-bold text-glow-muted text-sm">
            Opening your daily glow...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <CuteNavbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        streakStats={streakStats}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'today' && (
          <DiaryEditor
            initialDate={selectedDate}
            initialStarter={initialStarter}
            onEntrySaved={() => refreshStreak()}
            onEntryDeleted={() => refreshStreak()}
            onOpenCoachTab={() => setActiveTab('coach')}
          />
        )}

        {activeTab === 'coach' && (
          <EnglishCoachPage
            onNavigateToToday={(promptText) => {
              if (promptText) {
                setInitialStarter(promptText);
              }
              setActiveTab('today');
            }}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            selectedDate={selectedDate}
            onSelectDate={(d) => {
              setSelectedDate(d);
              setActiveTab('today');
            }}
          />
        )}

        {activeTab === 'journey' && (
          <HistoryPage
            onSelectDate={(d) => {
              setSelectedDate(d);
              setActiveTab('today');
            }}
          />
        )}

        {activeTab === 'stats' && <StatsPage />}

        {activeTab === 'admin' && <AdminDashboard />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
