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
  CheckCircle2,
  BookCheck,
} from 'lucide-react';
import { AiReviewResult } from '@diary/shared';
import { api } from '../services/api';

interface AiReviewSectionProps {
  date: string;
  title: string;
  content: string;
  aiReview: AiReviewResult | null;
  onApplyRevised: (newTitle: string, newContent: string) => void;
  onReviewSaved: (review: AiReviewResult) => void;
  activeView: 'original' | 'revised';
  onToggleView: (view: 'original' | 'revised') => void;
}

export const AiReviewSection: React.FC<AiReviewSectionProps> = ({
  date,
  title,
  content,
  aiReview,
  onApplyRevised,
  onReviewSaved,
  activeView,
  onToggleView,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);

  // API Key Modal State
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKeyText, setShowKeyText] = useState(false);
  const [saveKeyToProfile, setSaveKeyToProfile] = useState(true);

  // Check if AI is ready on mount
  const [hasConfiguredKey, setHasConfiguredKey] = useState<boolean>(false);

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
    const textToCopy = `${aiReview.correctedTitle}\n\n${aiReview.correctedContent}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleApply = () => {
    if (!aiReview) return;
    onApplyRevised(aiReview.correctedTitle, aiReview.correctedContent);
    setApplied(true);
    onToggleView('original');
    setTimeout(() => setApplied(false), 3000);
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

  return (
    <div className="w-full">
      {/* Subtle Segmented Switch Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
        {/* Toggle Switch: Original vs Revised */}
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
            <span>✍️ Original</span>
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
              {aiReview ? `Revised & Notes (${aiReview.changes.length})` : 'AI Review'}
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
              title="Re-check entry with AI"
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-glow-muted hover:text-rose-500 bg-pink-50/50 hover:bg-white border border-pink-100/80 transition bouncy-button flex items-center gap-1"
            >
              <RotateCcw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Re-check</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowKeyModal(true)}
            title="Configure OpenAI API Key"
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
            Checking spelling, grammar & natural phrasing with OpenAI...
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
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-pink-50/60 rounded-2xl border border-pink-100">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-glow-cocoa">
              <BookCheck className="w-4 h-4 text-emerald-600" />
              <span>AI Revised Entry & Explanations</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyRevised}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-pink-50 text-xs font-bold text-glow-cocoa border border-pink-200/80 transition bouncy-button flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-glow-muted" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-extrabold shadow-cute transition bouncy-button flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply to Original</span>
              </button>
            </div>
          </div>

          {/* Revised Title & Content Card */}
          <div className="p-5 rounded-2xl bg-pink-50/25 border border-pink-100 flex flex-col gap-3">
            {aiReview.correctedTitle && (
              <h3 className="text-xl font-black text-glow-cocoa">
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
                Corrections & Explanations ({aiReview.changes.length})
              </h4>
            </div>

            {aiReview.changes.length === 0 ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Splendid! No spelling or grammar errors detected in this entry. Keep it up! 🌸</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {aiReview.changes.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white border border-pink-100 shadow-2xs flex flex-col gap-1.5"
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

                    <p className="text-xs text-glow-cocoa font-medium bg-pink-50/40 p-2 rounded-xl border border-pink-100/60 mt-0.5 leading-relaxed">
                      💡 {item.explanation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
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
                  OpenAI API Key
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
              To check grammar and spelling, please provide your OpenAI API key (starts with <code className="bg-pink-50 px-1 py-0.5 rounded text-rose-600 font-mono">sk-...</code>). Your key is used directly to review your English entries.
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
              <span>Remember this key for my account</span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-glow-muted hover:bg-pink-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStartReview(apiKeyInput)}
                disabled={isLoading || !apiKeyInput.trim()}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-xs shadow-cute transition bouncy-button disabled:opacity-50"
              >
                {isLoading ? 'Checking...' : 'Save & Check English ✨'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
