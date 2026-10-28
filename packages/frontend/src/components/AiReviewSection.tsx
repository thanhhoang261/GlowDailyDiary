import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Check,
  Copy,
  RotateCcw,
  Key,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  BookCheck,
  ShieldCheck,
  FileText,
  MessageSquare,
  Send,
  GraduationCap,
} from 'lucide-react';
import { AiReviewResult } from '@diary/shared';
import { api } from '../services/api';

interface AiReviewSectionProps {
  date: string;
  title: string;
  content: string;
  aiReview: AiReviewResult | null;
  onReviewSaved: (review: AiReviewResult) => void;
  activeView: 'original' | 'revised';
  onToggleView: (view: 'original' | 'revised') => void;
}

export const AiReviewSection: React.FC<AiReviewSectionProps> = ({
  date,
  title,
  content,
  aiReview,
  onReviewSaved,
  activeView,
  onToggleView,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showOriginalComparison, setShowOriginalComparison] = useState(false);

  // API Key Modal State
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKeyText, setShowKeyText] = useState(false);
  const [saveKeyToProfile, setSaveKeyToProfile] = useState(true);

  // Check if AI is ready on mount
  const [hasConfiguredKey, setHasConfiguredKey] = useState<boolean>(false);

  // Discussion state
  const [openChangeChatIdx, setOpenChangeChatIdx] = useState<number | null>(null);
  const [changeQuestionInputs, setChangeQuestionInputs] = useState<Record<number, string>>({});
  const [sendingChangeIdx, setSendingChangeIdx] = useState<number | null>(null);

  const [generalQuestion, setGeneralQuestion] = useState<string>('');
  const [isSendingGeneral, setIsSendingGeneral] = useState<boolean>(false);

  const handleAskAboutChange = async (idx: number, customQ?: string, e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!aiReview) return;
    const item = aiReview.changes[idx];
    if (!item) return;

    const question = (customQ || changeQuestionInputs[idx] || '').trim();
    if (!question) return;

    const targetSnippet = `"${item.original}" -> "${item.corrected}" (Giải thích: ${item.explanation})`;

    setSendingChangeIdx(idx);
    setErrorMsg(null);

    try {
      const res = await api.discussAiReview({
        date,
        question,
        targetSnippet,
        changeIndex: idx,
        apiKey: apiKeyInput || undefined,
      });

      onReviewSaved(res.updatedReview);
      setChangeQuestionInputs((prev) => ({ ...prev, [idx]: '' }));
    } catch (err: any) {
      if (err.message?.includes('NO_API_KEY')) {
        setShowKeyModal(true);
      } else {
        setErrorMsg(err.message || 'Lỗi khi gửi câu hỏi đến AI Tutor');
      }
    } finally {
      setSendingChangeIdx(null);
    }
  };

  const handleAskGeneral = async (customQ?: string, e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!aiReview) return;
    const question = (customQ || generalQuestion).trim();
    if (!question) return;

    setIsSendingGeneral(true);
    setErrorMsg(null);

    try {
      const res = await api.discussAiReview({
        date,
        question,
        apiKey: apiKeyInput || undefined,
      });

      onReviewSaved(res.updatedReview);
      setGeneralQuestion('');
    } catch (err: any) {
      if (err.message?.includes('NO_API_KEY')) {
        setShowKeyModal(true);
      } else {
        setErrorMsg(err.message || 'Lỗi khi gửi câu hỏi đến AI Tutor');
      }
    } finally {
      setIsSendingGeneral(false);
    }
  };

  useEffect(() => {
    checkAiConfig();
  }, []);

  const checkAiConfig = async () => {
    try {
      const res = await api.getAiConfig();
      setHasConfiguredKey(res.config.isReady);
    } catch {
      // fallback
    }
  };

  const handleStartReview = async (overrideKey?: string) => {
    if (!content.trim()) {
      setErrorMsg('Please write some thoughts in English first before reviewing! 🌸');
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await api.reviewWithAi({
        date,
        title,
        content,
        apiKey: overrideKey || apiKeyInput || undefined,
        saveKey: saveKeyToProfile,
      });

      onReviewSaved(res.result);
      onToggleView('revised');
      setShowKeyModal(false);
      setHasConfiguredKey(true);
    } catch (err: any) {
      if (err.message?.includes('NO_API_KEY') || err.message?.includes('API key')) {
        setShowKeyModal(true);
      } else {
        setErrorMsg(err.message || 'Failed to review entry with AI');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyRevised = () => {
    if (!aiReview) return;
    const textToCopy = `${aiReview.correctedTitle || title}\n\n${aiReview.correctedContent}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const changeTypeBadge = (type: string) => {
    switch (type) {
      case 'spelling':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800">Spelling</span>;
      case 'grammar':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-100 text-sky-800">Grammar</span>;
      case 'naturalness':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-800">Natural</span>;
      case 'vocabulary':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">Vocabulary</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-pink-100 text-pink-800">Tip</span>;
    }
  };

  const revisedWordCount = aiReview?.correctedContent
    ? aiReview.correctedContent.trim().split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div className="w-full">
      {/* Subtle Segmented Switch Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
        {/* Toggle Switch: Original vs Full Revised */}
        <div className="inline-flex p-1 bg-pink-50/70 rounded-2xl border border-pink-100/90 shadow-2xs">
          <button
            type="button"
            onClick={() => onToggleView('original')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all bouncy-button flex items-center gap-1.5 ${
              activeView === 'original'
                ? 'bg-white text-rose-600 shadow-cute scale-100'
                : 'text-glow-muted hover:text-glow-cocoa'
            }`}
          >
            <span>✍️ Bản gốc</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (aiReview) {
                onToggleView('revised');
              } else {
                handleStartReview();
              }
            }}
            disabled={isLoading}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all bouncy-button flex items-center gap-1.5 ${
              activeView === 'revised'
                ? 'bg-white text-rose-600 shadow-cute scale-100'
                : 'text-glow-muted hover:text-glow-cocoa'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {aiReview ? `✨ Bản sửa full AI (${aiReview.changes.length})` : '✨ AI Review'}
            </span>
          </button>
        </div>

        {/* Action icons / trigger */}
        <div className="flex items-center gap-2">
          {aiReview && (
            <button
              type="button"
              onClick={() => handleStartReview()}
              disabled={isLoading}
              title="Yêu cầu AI soát lỗi lại lần nữa"
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-glow-muted hover:text-rose-500 bg-pink-50/50 hover:bg-white border border-pink-100/80 transition bouncy-button flex items-center gap-1"
            >
              <RotateCcw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Soát lại</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowKeyModal(true)}
            title="Cài đặt OpenAI API Key"
            className="p-1.5 rounded-xl text-xs font-bold text-glow-muted hover:text-rose-500 bg-pink-50/50 hover:bg-white border border-pink-100/80 transition bouncy-button"
          >
            <Key className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Loading Banner */}
      {isLoading && (
        <div className="my-2 p-3.5 rounded-2xl bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50 border border-pink-200 flex items-center justify-center gap-3 animate-pulse">
          <img
            src="/bubu-dudu/mood-reflective.gif"
            alt="AI Reviewing"
            className="w-8 h-8 object-contain"
          />
          <span className="text-xs font-bold text-glow-cocoa">
            Đang tạo bản sửa hoàn chỉnh và giải thích ngữ pháp với OpenAI...
          </span>
        </div>
      )}

      {/* Error Notice */}
      {errorMsg && (
        <div className="my-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span className="flex-1">{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-rose-500 hover:text-rose-800 text-[11px]"
          >
            ✕
          </button>
        </div>
      )}

      {/* Revised View (Rendered when activeView === 'revised') */}
      {activeView === 'revised' && aiReview && (
        <div className="flex flex-col gap-4 mt-2">
          {/* Header Action Bar for Revised Mode */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gradient-to-r from-pink-50/70 via-rose-50/50 to-amber-50/50 rounded-2xl border border-pink-100">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-glow-cocoa">
                <BookCheck className="w-4 h-4 text-emerald-600" />
                <span>Bản sửa hoàn chỉnh bằng AI (Full Revised Entry)</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Bản gốc của bạn được giữ nguyên 100% – không bị thay đổi</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyRevised}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-pink-50 text-xs font-bold text-glow-cocoa border border-pink-200/80 transition bouncy-button flex items-center gap-1.5 shadow-2xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-glow-muted" />}
                <span>{copied ? 'Đã copy!' : 'Copy bản sửa full'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowOriginalComparison(!showOriginalComparison)}
                className="px-3 py-1.5 rounded-xl bg-pink-100/50 hover:bg-pink-100 text-xs font-bold text-glow-cocoa border border-pink-200/60 transition bouncy-button flex items-center gap-1"
                title="Xem lại bản gốc bạn đã viết"
              >
                <FileText className="w-3.5 h-3.5 text-rose-500" />
                <span>{showOriginalComparison ? 'Ẩn so sánh' : 'Xem bản gốc'}</span>
                {showOriginalComparison ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Quick Comparison with Original (Collapsible) */}
          {showOriginalComparison && (
            <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/70 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-amber-900">
                <span className="flex items-center gap-1.5">
                  <span>✍️ Bản gốc bạn đã viết (Original Text):</span>
                </span>
                <span className="text-[11px] text-amber-700 font-semibold">
                  (Không bị thay đổi)
                </span>
              </div>
              {title && (
                <div className="text-sm font-bold text-stone-700">
                  {title}
                </div>
              )}
              <div className="text-xs leading-relaxed text-stone-600 whitespace-pre-wrap bg-white/70 p-3 rounded-xl border border-amber-100">
                {content || '(Trống)'}
              </div>
            </div>
          )}

          {/* Full Revised Title & Content Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-pink-50/30 border border-pink-100/90 shadow-2xs flex flex-col gap-3.5">
            <div className="flex items-center justify-between border-b border-pink-100 pb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-500 flex items-center gap-1">
                <span>📖 Bản văn hoàn chỉnh sau khi trau chuốt</span>
              </span>
              <span className="text-xs font-bold text-glow-muted">
                {revisedWordCount} words
              </span>
            </div>

            {aiReview.correctedTitle && (
              <h3 className="text-xl sm:text-2xl font-black text-glow-cocoa tracking-tight">
                {aiReview.correctedTitle}
              </h3>
            )}
            <div className="text-base leading-relaxed text-glow-cocoa font-medium whitespace-pre-wrap">
              {aiReview.correctedContent}
            </div>
          </div>

          {/* Encouragement Banner */}
          {aiReview.encouragement && (
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center gap-3">
              <img
                src="/bubu-dudu/mood-joyful.gif"
                alt="Cheering"
                className="w-9 h-9 object-contain shrink-0"
              />
              <p className="text-xs font-bold text-amber-900 leading-snug">
                {aiReview.encouragement}
              </p>
            </div>
          )}

          {/* Explanations & Corrections Accordion */}
          <div className="flex flex-col gap-2.5 pt-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-glow-muted">
                Chi tiết các lỗi & Giải thích ({aiReview.changes.length})
              </h4>
            </div>

            {aiReview.changes.length === 0 ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Tuyệt vời! Không phát hiện lỗi chính tả hay ngữ pháp nào trong bài viết này. 🌸</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {aiReview.changes.map((item, idx) => {
                  const itemDiscussion = (aiReview.discussion || []).filter(
                    (m) => m.changeIndex === idx || (m.targetSnippet && m.targetSnippet.includes(item.original))
                  );

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-white border border-pink-100 shadow-2xs flex flex-col gap-2 transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        {changeTypeBadge(item.type)}
                        <div className="flex items-center gap-1.5 text-xs">
                          <del className="text-rose-500 font-semibold px-1.5 py-0.5 rounded bg-rose-50/60">
                            {item.original}
                          </del>
                          <span className="text-glow-muted font-bold">→</span>
                          <ins className="no-underline text-emerald-700 font-bold px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200/60">
                            {item.corrected}
                          </ins>
                        </div>
                      </div>

                      <p className="text-xs text-glow-cocoa font-medium bg-pink-50/40 p-2.5 rounded-xl border border-pink-100/60 leading-relaxed">
                        💡 {item.explanation}
                      </p>

                      {/* Discussion toggle button */}
                      <div className="flex items-center justify-between pt-0.5">
                        <button
                          type="button"
                          onClick={() => setOpenChangeChatIdx(openChangeChatIdx === idx ? null : idx)}
                          className="text-[11px] font-extrabold text-purple-700 hover:text-purple-900 flex items-center gap-1.5 transition px-2.5 py-1 rounded-xl bg-purple-50/70 hover:bg-purple-100 border border-purple-200/60 active:scale-95"
                        >
                          <MessageSquare className="w-3 h-3 text-purple-600" />
                          <span>{openChangeChatIdx === idx ? 'Đóng trao đổi' : 'Hỏi thêm về lỗi này'}</span>
                          {itemDiscussion.length > 0 && (
                            <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-purple-600 text-white text-[9px] font-black">
                              {itemDiscussion.length}
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Inline Discussion Area for this specific item */}
                      {openChangeChatIdx === idx && (
                        <div className="mt-1 p-3.5 rounded-2xl bg-gradient-to-br from-purple-50/60 to-pink-50/40 border border-purple-100 flex flex-col gap-2.5 animate-fadeIn">
                          {/* Quick question prompt chips */}
                          <div className="flex flex-wrap gap-1.5">
                            <span className="text-[10px] font-bold text-glow-muted self-center">Gợi ý nhanh:</span>
                            {[
                              'Giải thích sâu hơn giúp tôi',
                              'Cho tôi 2 ví dụ tự nhiên',
                              'Có từ đồng nghĩa nào hay hơn?',
                              'Tại sao câu cũ chưa tự nhiên?',
                            ].map((chip) => (
                              <button
                                key={chip}
                                type="button"
                                disabled={sendingChangeIdx === idx}
                                onClick={() => handleAskAboutChange(idx, chip)}
                                className="text-[10px] font-semibold text-purple-800 bg-white hover:bg-purple-100/80 border border-purple-200 px-2 py-0.5 rounded-lg transition active:scale-95 disabled:opacity-50 shadow-2xs"
                              >
                                {chip}
                              </button>
                            ))}
                          </div>

                          {/* Mini message thread */}
                          {itemDiscussion.length > 0 && (
                            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1 py-1">
                              {itemDiscussion.map((msg) => (
                                <div
                                  key={msg.id}
                                  className={`flex flex-col text-xs leading-relaxed ${
                                    msg.role === 'user' ? 'items-end' : 'items-start'
                                  }`}
                                >
                                  <div
                                    className={`max-w-[88%] p-2.5 rounded-2xl ${
                                      msg.role === 'user'
                                        ? 'bg-rose-500 text-white rounded-br-xs shadow-2xs'
                                        : 'bg-white border border-purple-100 text-glow-cocoa shadow-2xs rounded-bl-xs'
                                    }`}
                                  >
                                    <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Input row */}
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <input
                              type="text"
                              placeholder="Nhập câu hỏi về lỗi này... (Enter để gửi)"
                              value={changeQuestionInputs[idx] || ''}
                              onChange={(e) => setChangeQuestionInputs((prev) => ({ ...prev, [idx]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleAskAboutChange(idx);
                                }
                              }}
                              disabled={sendingChangeIdx === idx}
                              className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-xs text-glow-cocoa focus:outline-none focus:border-purple-400 placeholder:text-stone-400 shadow-2xs"
                            />
                            <button
                              type="button"
                              onClick={(e) => handleAskAboutChange(idx, undefined, e)}
                              disabled={sendingChangeIdx === idx || !(changeQuestionInputs[idx] || '').trim()}
                              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-40 transition shrink-0 shadow-2xs cursor-pointer"
                              title="Gửi câu hỏi"
                            >
                              {sendingChangeIdx === idx ? (
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* GENERAL DISCUSSION WITH AI TUTOR FOR THE WHOLE ENTRY */}
          {/* ========================================================= */}
          {(() => {
            const generalMessages = (aiReview.discussion || []).filter(
              (m) => m.changeIndex === undefined || m.changeIndex === null
            );

            return (
              <div className="mt-2 bg-gradient-to-br from-purple-50/70 via-pink-50/50 to-amber-50/60 rounded-3xl p-4 sm:p-5 border border-purple-100/90 shadow-soft flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-purple-100/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center text-purple-600 border border-purple-100 shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-glow-cocoa text-sm flex items-center gap-1.5">
                        <span>Góc Trao Đổi Với AI Tutor</span>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                          Interactive Q&A
                        </span>
                      </h4>
                      <p className="text-[11px] text-glow-muted font-medium">
                        Hỏi đáp thêm về bài viết, cách dùng từ hoặc nhờ AI gợi ý mở rộng ý
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Starter Chips */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {[
                    'Đoạn nào trong bài tôi viết tự nhiên nhất? ✨',
                    'Gợi ý cách mở rộng ý cho bài này 💡',
                    'Từ vựng nào trong bài tôi có thể nâng cấp? 📚',
                    'Viết lại bài này theo văn phong tự nhiên hơn 🌸',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      disabled={isSendingGeneral}
                      onClick={() => handleAskGeneral(chip)}
                      className="text-xs font-semibold text-purple-800 bg-white/90 hover:bg-white border border-purple-200/80 px-2.5 py-1 rounded-xl transition shadow-2xs active:scale-95 disabled:opacity-50"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Messages Thread */}
                {generalMessages.length > 0 && (
                  <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1 py-1">
                    {generalMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-2 text-xs leading-relaxed ${
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-7 h-7 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0 mt-0.5 border border-purple-200/60">
                            <GraduationCap className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div
                          className={`max-w-[85%] p-3 rounded-2xl ${
                            msg.role === 'user'
                              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-br-xs shadow-soft'
                              : 'bg-white border border-purple-100 text-glow-cocoa shadow-2xs rounded-bl-xs'
                          }`}
                        >
                          <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* General Input Form */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Hỏi AI Tutor về bài viết này... (Ví dụ: Tại sao câu này lại dùng thì quá khứ?)"
                    value={generalQuestion}
                    onChange={(e) => setGeneralQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAskGeneral();
                      }
                    }}
                    disabled={isSendingGeneral}
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-white border border-purple-200 text-xs font-medium text-glow-cocoa focus:outline-none focus:border-purple-400 placeholder:text-stone-400 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={(e) => handleAskGeneral(undefined, e)}
                    disabled={isSendingGeneral || !generalQuestion.trim()}
                    className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-soft transition bouncy-button disabled:opacity-40 shrink-0 cursor-pointer"
                  >
                    {isSendingGeneral ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Gửi</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* OpenAI API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-pink-100 shadow-cute flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-glow-cocoa text-base">
                  Cài đặt OpenAI API Key
                </h3>
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
              Nhập API Key OpenAI của bạn (bắt đầu bằng <code className="bg-pink-50 px-1 py-0.5 rounded text-rose-600 font-mono">sk-...</code>). Hệ thống sẽ dùng key này để soát lỗi ngữ pháp và tạo bản sửa hoàn chỉnh cho bạn.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-glow-muted uppercase tracking-wider">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showKeyText ? 'text' : 'password'}
                  placeholder="sk-proj-..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-2xl bg-pink-50/40 border border-pink-200 focus:outline-none focus:border-rose-400 font-mono text-xs text-glow-cocoa"
                />
                <button
                  type="button"
                  onClick={() => setShowKeyText(!showKeyText)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-glow-muted hover:text-glow-cocoa"
                >
                  {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-glow-cocoa cursor-pointer">
              <input
                type="checkbox"
                checked={saveKeyToProfile}
                onChange={(e) => setSaveKeyToProfile(e.target.checked)}
                className="rounded accent-rose-500 w-4 h-4"
              />
              <span>Lưu key này cho tài khoản của tôi</span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-glow-muted hover:bg-pink-50 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleStartReview(apiKeyInput)}
                disabled={isLoading || !apiKeyInput.trim()}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-xs shadow-cute transition bouncy-button disabled:opacity-50"
              >
                {isLoading ? 'Đang kiểm tra...' : 'Lưu & Soát lỗi AI ✨'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
