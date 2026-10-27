import React, { useEffect, useState } from 'react';
import { Sparkles, GraduationCap, ArrowRight, Lightbulb, Target, CheckCircle2, ChevronRight } from 'lucide-react';
import { CoachReport } from '@diary/shared';
import { api } from '../services/api';

interface TodayCoachCardProps {
  onInsertStarter?: (starter: string) => void;
  onOpenCoachTab?: () => void;
}

export const TodayCoachCard: React.FC<TodayCoachCardProps> = ({
  onInsertStarter,
  onOpenCoachTab,
}) => {
  const [report, setReport] = useState<CoachReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasInserted, setHasInserted] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    const fetchCoach = async () => {
      try {
        const res = await api.getCoachReport();
        if (mounted && res?.report) {
          setReport(res.report);
        }
      } catch (err) {
        // Silently catch if not ready yet
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchCoach();
    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading || !report) {
    return null;
  }

  const challenge = report.todayChallenge;
  const tip = report.dailyTip;

  const handleUsePrompt = () => {
    if (challenge?.suggestedPrompt && onInsertStarter) {
      onInsertStarter(challenge.suggestedPrompt);
      setHasInserted(true);
      setTimeout(() => setHasInserted(false), 2500);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-50/90 via-pink-50/80 to-amber-50/80 rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-soft relative overflow-hidden transition hover:shadow-cute">
      {/* Decorative background blur */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-purple-200/20 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-purple-100/70">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-white shadow-soft flex items-center justify-center text-purple-600 border border-purple-100 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-glow-cocoa text-sm flex items-center gap-1.5">
              <span>English Coach Gợi Ý Hôm Nay</span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                Personalized
              </span>
            </h4>
            <p className="text-[11px] text-glow-muted font-medium">
              Đúc kết từ hành trình viết nhật ký cá nhân của bạn
            </p>
          </div>
        </div>

        {onOpenCoachTab && (
          <button
            type="button"
            onClick={onOpenCoachTab}
            className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 transition px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-purple-200/60 shadow-2xs shrink-0 self-end sm:self-center"
          >
            <span>Xem góc Cố vấn chi tiết</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Challenge Box */}
        {challenge && (
          <div className="bg-white/90 rounded-2xl p-3.5 border border-purple-100/80 flex flex-col justify-between gap-2.5 shadow-2xs">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-black text-purple-800 mb-1">
                <Target className="w-3.5 h-3.5 text-purple-500" />
                <span>Thử thách: {challenge.title}</span>
              </div>
              <p className="text-xs text-glow-cocoa leading-relaxed font-medium">
                {challenge.description}
              </p>
            </div>

            {challenge.suggestedPrompt && (
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-purple-50">
                <div className="text-[11px] font-semibold text-purple-950/80 italic truncate">
                  "{challenge.suggestedPrompt}"
                </div>
                {onInsertStarter && (
                  <button
                    type="button"
                    onClick={handleUsePrompt}
                    disabled={hasInserted}
                    className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-extrabold text-[11px] transition shrink-0 flex items-center gap-1 shadow-2xs"
                  >
                    {hasInserted ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                        <span>Đã chèn!</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-amber-200" />
                        <span>Chèn vào bài</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Daily Tip Box */}
        {tip && (
          <div className="bg-white/90 rounded-2xl p-3.5 border border-purple-100/80 flex flex-col justify-between gap-2 shadow-2xs">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 mb-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>Mẹo bỏ túi hôm nay</span>
              </div>
              <p className="text-xs text-glow-cocoa leading-relaxed font-medium">
                {tip}
              </p>
            </div>
            {report.recurringMistakes && report.recurringMistakes.length > 0 && (
              <div className="text-[11px] text-purple-600 font-bold flex items-center gap-1">
                <span>💡 Đã nhận diện {report.recurringMistakes.length} nhóm lỗi cần lưu ý trong quá trình viết</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
