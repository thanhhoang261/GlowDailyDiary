import React, { useEffect, useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  RefreshCw,
  Target,
  Lightbulb,
  CheckCircle2,
  XCircle,
  BookOpen,
  ArrowRight,
  Key,
  AlertCircle,
  Award,
  Layers,
  Zap,
  Bookmark,
  Check,
  ChevronRight,
  TrendingUp,
  Brain,
  HelpCircle,
} from 'lucide-react';
import { CoachReport } from '@diary/shared';
import { api } from '../services/api';

interface EnglishCoachPageProps {
  onNavigateToToday: (promptText?: string) => void;
}

export const EnglishCoachPage: React.FC<EnglishCoachPageProps> = ({ onNavigateToToday }) => {
  const [report, setReport] = useState<CoachReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // OpenAI API Key State
  const [hasAiKey, setHasAiKey] = useState<boolean>(true);
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [isSavingKey, setIsSavingKey] = useState<boolean>(false);
  const [keyToast, setKeyToast] = useState<string | null>(null);

  useEffect(() => {
    checkAiConfigAndLoad();
  }, []);

  const checkAiConfigAndLoad = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const configRes = await api.getAiConfig();
      setHasAiKey(configRes.config.isReady);

      const reportRes = await api.getCoachReport();
      setReport(reportRes.report);
    } catch (err: any) {
      if (err.message === 'NO_API_KEY' || err.code === 'NO_API_KEY') {
        setHasAiKey(false);
      } else {
        setErrorMessage(err.message || 'Không thể tải báo cáo từ Coach');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const res = await api.refreshCoachReport();
      setReport(res.report);
    } catch (err: any) {
      if (err.message === 'NO_API_KEY' || err.code === 'NO_API_KEY') {
        setHasAiKey(false);
        setShowKeyModal(true);
      } else {
        setErrorMessage(err.message || 'Lỗi khi làm mới phân tích');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;

    setIsSavingKey(true);
    try {
      await api.setAiKey(apiKeyInput.trim());
      setHasAiKey(true);
      setShowKeyModal(false);
      setKeyToast('Đã lưu OpenAI API Key thành công!');
      setTimeout(() => setKeyToast(null), 3000);

      // Trigger refresh after key saved
      handleRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi lưu API Key');
    } finally {
      setIsSavingKey(false);
    }
  };

  const formatAnalysisDate = (isoStr?: string) => {
    if (!isoStr) return 'Mới đây';
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-12">
      {/* Toast Notice */}
      {keyToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 text-center flex items-center justify-center gap-2 shadow-soft">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{keyToast}</span>
        </div>
      )}

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-4 rounded-3xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center justify-between gap-3 shadow-soft">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={checkAiConfigAndLoad}
            className="px-3 py-1 bg-white hover:bg-rose-100 text-rose-700 text-[11px] font-black rounded-xl border border-rose-200 transition"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Missing API Key Banner */}
      {!hasAiKey && (
        <div className="bg-gradient-to-r from-amber-50 to-rose-50 rounded-4xl p-6 border border-amber-200/80 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-soft flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-glow-cocoa text-sm sm:text-base">
                Cần OpenAI API Key để kích hoạt Cố Vấn Tiếng Anh
              </h4>
              <p className="text-xs text-glow-muted font-medium mt-0.5">
                Nhập key cá nhân của bạn để AI phân tích hành trình viết và đúc kết lời khuyên riêng biệt.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowKeyModal(true)}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-extrabold text-xs shadow-cute bouncy-button shrink-0"
          >
            Nhập OpenAI Key
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* HERO BANNER: BUBU & DUDU STUDYING */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-br from-purple-100/70 via-pink-50/80 to-amber-50/70 rounded-4xl p-6 sm:p-8 border border-purple-100/90 shadow-cute relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Decorative blur bubbles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-200/30 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white p-1.5 shadow-soft border border-purple-100 shrink-0 flex items-center justify-center overflow-hidden animate-floatCute">
            <img
              src="/bubu-dudu/mood-reflective.gif"
              alt="Bubu & Dudu studying English"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-600 text-white shadow-2xs">
                Personal English Coach
              </span>
              <span className="text-xs font-bold text-purple-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span>AI Học Tập Riêng Biệt</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-glow-cocoa tracking-tight">
              Góc Cố Vấn Tiếng Anh Cá Nhân Hoá
            </h2>

            <p className="text-xs sm:text-sm text-glow-muted font-medium max-w-xl leading-relaxed">
              Phân tích các bài nhật ký thực tế của bạn để tìm ra quy luật lỗi sai hay lặp lại, mở rộng vốn từ vựng tự nhiên và đưa ra thử thách viết mỗi ngày.
            </p>

            {report && (
              <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] font-bold text-glow-muted">
                <span className="flex items-center gap-1 bg-white/70 px-2.5 py-1 rounded-xl border border-purple-100">
                  <BookOpen className="w-3 h-3 text-purple-500" />
                  Đã phân tích: <strong className="text-purple-700">{report.analyzedEntriesCount} bài viết</strong>
                </span>
                <span className="flex items-center gap-1 bg-white/70 px-2.5 py-1 rounded-xl border border-purple-100">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  Cập nhật: <strong className="text-glow-cocoa">{formatAnalysisDate(report.analyzedAt)}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col gap-2 relative z-10 shrink-0 w-full md:w-auto">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-rose-500 hover:from-purple-700 hover:to-rose-600 text-white font-extrabold text-xs shadow-cute flex items-center justify-center gap-2 transition bouncy-button disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Đang phân tích bài viết...' : 'Cập nhật phân tích mới'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowKeyModal(true)}
            className="px-4 py-2 rounded-2xl bg-white/90 hover:bg-white text-glow-cocoa font-bold text-xs border border-purple-200/80 shadow-2xs flex items-center justify-center gap-1.5 transition"
          >
            <Key className="w-3.5 h-3.5 text-purple-500" />
            <span>Cài đặt OpenAI Key</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white/80 rounded-4xl p-16 text-center border border-pink-100 shadow-soft flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-3xl bg-pink-100 flex items-center justify-center animate-bounce">
            <GraduationCap className="w-8 h-8 text-pink-500" />
          </div>
          <h3 className="font-extrabold text-glow-cocoa text-base">
            Đang tổng hợp dữ liệu học tập của bạn...
          </h3>
          <p className="text-xs text-glow-muted max-w-sm">
            AI Coach đang đọc qua các bài viết gần nhất để tổng hợp báo cáo cá nhân hoá. Vui lòng chờ chút xíu nhé!
          </p>
        </div>
      ) : report ? (
        <>
          {/* ========================================================= */}
          {/* 1. OVERALL PROGRESS & STRENGTHS */}
          {/* ========================================================= */}
          <div className="bg-white/95 rounded-4xl p-6 sm:p-7 border border-pink-100 shadow-soft flex flex-col gap-4">
            <div className="flex items-center gap-2.5 border-b border-pink-100/70 pb-3">
              <div className="w-9 h-9 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-glow-cocoa text-base">
                  Đánh Giá Tổng Quan & Điểm Sáng
                </h3>
                <p className="text-xs text-glow-muted font-medium">
                  Cái nhìn chân thực và lời khích lệ từ huấn luyện viên
                </p>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-gradient-to-r from-pink-50/40 via-purple-50/30 to-amber-50/40 border border-pink-100/70 text-sm leading-relaxed text-glow-cocoa font-medium">
              {report.overallLevelSummary}
            </div>

            {report.strengths && report.strengths.length > 0 && (
              <div className="flex flex-col gap-2 pt-1">
                <label className="text-xs font-black uppercase tracking-wider text-glow-muted flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Điểm mạnh nổi bật trong các bài viết của bạn:</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {report.strengths.map((st, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100/80 text-xs font-bold text-emerald-900 flex items-start gap-2 shadow-2xs"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{st}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 2. TODAY'S WRITING CHALLENGE */}
          {/* ========================================================= */}
          {report.todayChallenge && (
            <div className="bg-gradient-to-br from-purple-600 via-rose-500 to-amber-500 rounded-4xl p-6 sm:p-7 text-white shadow-cute relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-start gap-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs">
                      Today's Challenge
                    </span>
                    <span className="text-xs font-extrabold text-amber-200">Thử thách nhật ký hôm nay</span>
                  </div>
                  <h3 className="text-xl font-black text-white">
                    {report.todayChallenge.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-purple-100 leading-relaxed font-medium max-w-xl">
                    {report.todayChallenge.description}
                  </p>
                  {report.todayChallenge.suggestedPrompt && (
                    <div className="p-3 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/20 text-xs sm:text-sm font-semibold text-white/95 mt-1 italic">
                      Gợi ý câu mở đầu: "{report.todayChallenge.suggestedPrompt}"
                    </div>
                  )}
                </div>
              </div>

              <div className="relative z-10 shrink-0 w-full md:w-auto flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateToToday(report.todayChallenge.suggestedPrompt)}
                  className="px-6 py-3 rounded-2xl bg-white hover:bg-purple-50 text-purple-900 font-black text-xs shadow-soft transition bouncy-button flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span>Viết nhật ký ngay với gợi ý này</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. RECURRING MISTAKES & HOW TO FIX THEM */}
          {/* ========================================================= */}
          <div className="bg-white/95 rounded-4xl p-6 sm:p-7 border border-pink-100 shadow-soft flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-pink-100/70 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-glow-cocoa text-base">
                    Các Lỗi Sai Thường Gặp & Cách Khắc Phục
                  </h3>
                  <p className="text-xs text-glow-muted font-medium">
                    Nhận diện từ chính các câu bạn đã viết trong các ngày qua
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200/70 shrink-0 self-start sm:self-center">
                {report.recurringMistakes?.length || 0} Nhóm Lỗi Đã Nhận Diện
              </span>
            </div>

            {report.recurringMistakes && report.recurringMistakes.length > 0 ? (
              <div className="flex flex-col gap-4">
                {report.recurringMistakes.map((mis, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-3xl bg-pink-50/25 border border-pink-100/90 hover:border-pink-200 shadow-2xs flex flex-col gap-3 transition"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-xl bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h4 className="font-extrabold text-glow-cocoa text-sm sm:text-base">
                          {mis.category}
                        </h4>
                      </div>

                      <span
                        className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          mis.frequency === 'Thường xuyên'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {mis.frequency}
                      </span>
                    </div>

                    <p className="text-xs text-glow-cocoa font-medium leading-relaxed pl-8">
                      {mis.description}
                    </p>

                    {/* Examples: Wrong vs Better */}
                    {mis.examples && mis.examples.length > 0 && (
                      <div className="flex flex-col gap-2.5 pl-0 sm:pl-8 pt-1">
                        {mis.examples.map((ex, exIdx) => (
                          <div
                            key={exIdx}
                            className="p-3.5 rounded-2xl bg-white border border-pink-100 flex flex-col gap-2 shadow-2xs text-xs"
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-rose-500 font-bold shrink-0 mt-0.5">❌ Bạn viết:</span>
                              <span className="font-mono text-glow-cocoa/90 bg-rose-50/60 px-2 py-0.5 rounded-lg border border-rose-100 line-through">
                                {ex.wrong}
                              </span>
                            </div>

                            <div className="flex items-start gap-2">
                              <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✅ Chuẩn hơn:</span>
                              <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                                {ex.better}
                              </span>
                            </div>

                            {ex.note && (
                              <div className="text-[11px] text-glow-muted pl-6 italic">
                                📌 {ex.note}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick Tip */}
                    {mis.quickTip && (
                      <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/60 text-xs font-bold text-amber-900 flex items-center gap-2 pl-3 sm:ml-8">
                        <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Mẹo nhớ nhanh: {mis.quickTip}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-glow-muted font-bold">
                Chưa phát hiện lỗi lặp lại đáng kể nào! Bạn đang viết rất tốt. Hãy tiếp tục viết thêm bài mới nhé.
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 4. VOCABULARY UPGRADES */}
          {/* ========================================================= */}
          <div className="bg-white/95 rounded-4xl p-6 sm:p-7 border border-pink-100 shadow-soft flex flex-col gap-5">
            <div className="flex items-center gap-2.5 border-b border-pink-100/70 pb-3">
              <div className="w-9 h-9 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-glow-cocoa text-base">
                  Nâng Cấp Từ Vựng & Diễn Đạt Tự Nhiên
                </h3>
                <p className="text-xs text-glow-muted font-medium">
                  Thay thế các từ bạn hay dùng lặp lại bằng từ ngữ giàu cảm xúc hơn
                </p>
              </div>
            </div>

            {report.vocabularyUpgrades && report.vocabularyUpgrades.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.vocabularyUpgrades.map((voc, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-3xl bg-gradient-to-br from-purple-50/30 to-pink-50/20 border border-purple-100 flex flex-col justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-black text-rose-500 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                          Từ hay lặp lại: "{voc.originalWord}"
                        </span>
                      </div>
                      <p className="text-xs text-glow-muted font-medium leading-relaxed mb-3">
                        {voc.reason}
                      </p>

                      <div className="flex flex-col gap-2">
                        {voc.betterAlternatives?.map((alt, aIdx) => (
                          <div
                            key={aIdx}
                            className="p-3 rounded-2xl bg-white border border-purple-100/80 flex flex-col gap-1 shadow-2xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-black text-purple-900 text-xs sm:text-sm">
                                ✨ {alt.word}
                              </span>
                              <span className="text-[11px] font-bold text-glow-muted">
                                {alt.meaning}
                              </span>
                            </div>
                            <p className="text-[11px] text-glow-cocoa/90 italic font-medium pt-0.5">
                              Ví dụ: "{alt.example}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-glow-muted font-bold">
                Vốn từ của bạn đang rất phong phú và cân đối!
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 5. GRAMMAR MINI-LESSON OF THE WEEK */}
          {/* ========================================================= */}
          {report.grammarMiniLesson && (
            <div className="bg-white/95 rounded-4xl p-6 sm:p-7 border border-pink-100 shadow-soft flex flex-col gap-4">
              <div className="flex items-center gap-2.5 border-b border-pink-100/70 pb-3">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-glow-cocoa text-base">
                    Bài Học Ngữ Pháp Bỏ Túi Tuần Này
                  </h3>
                  <p className="text-xs text-glow-muted font-medium">
                    Chủ điểm quan trọng nhất giúp nâng tầm ngữ pháp bài viết của bạn
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-pink-50/40 border border-indigo-100/80 flex flex-col gap-3">
                <h4 className="font-black text-indigo-950 text-base">
                  {report.grammarMiniLesson.title}
                </h4>

                <p className="text-xs sm:text-sm text-glow-cocoa font-medium leading-relaxed">
                  {report.grammarMiniLesson.rule}
                </p>

                {report.grammarMiniLesson.keyPoints && (
                  <div className="flex flex-col gap-1.5 pt-1">
                    {report.grammarMiniLesson.keyPoints.map((kp, kIdx) => (
                      <div key={kIdx} className="flex items-start gap-2 text-xs font-semibold text-indigo-900">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{kp}</span>
                      </div>
                    ))}
                  </div>
                )}

                {report.grammarMiniLesson.commonPitfall && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200/80 text-xs font-bold text-rose-800 flex items-center gap-2 mt-1">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Cạm bẫy cần tránh: {report.grammarMiniLesson.commonPitfall}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 6. DAILY POCKET TIP */}
          {/* ========================================================= */}
          {report.dailyTip && (
            <div className="p-5 rounded-3xl bg-amber-50/80 border border-amber-200/80 shadow-soft flex items-center gap-3 text-xs sm:text-sm font-bold text-amber-900">
              <div className="w-10 h-10 rounded-2xl bg-white shadow-soft flex items-center justify-center text-amber-600 shrink-0">
                <Lightbulb className="w-5 h-5 text-amber-500 fill-amber-400" />
              </div>
              <div className="flex-1">
                <span className="font-black text-amber-950 block text-xs uppercase tracking-wider">
                  Mẹo Vàng Của Ngày
                </span>
                <span className="font-medium text-amber-900 leading-relaxed">
                  {report.dailyTip}
                </span>
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* ========================================================= */}
      {/* MODAL: SET OPENAI API KEY */}
      {/* ========================================================= */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-4xl p-6 sm:p-8 max-w-md w-full border border-pink-100 shadow-cute flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-glow-cocoa text-base">Cài Đặt OpenAI API Key</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="text-glow-muted hover:text-rose-500 p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-glow-muted leading-relaxed">
              API Key giúp kích hoạt toàn bộ tính năng <strong>Cố Vấn Tiếng Anh (English Coach)</strong> và sửa lỗi chính tả ngữ pháp. Key được lưu trữ an toàn riêng cho tài khoản của bạn.
            </p>

            <form onSubmit={handleSaveApiKey} className="flex flex-col gap-3">
              <input
                type="password"
                placeholder="sk-..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-pink-50/50 border border-pink-100 text-xs font-mono text-glow-cocoa focus:outline-none focus:border-rose-400"
                required
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2 rounded-2xl bg-pink-50 hover:bg-pink-100 text-glow-cocoa font-bold text-xs transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingKey}
                  className="px-5 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-cute bouncy-button transition"
                >
                  {isSavingKey ? 'Đang lưu...' : 'Lưu API Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
