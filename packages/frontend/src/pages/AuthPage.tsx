import React, { useState } from 'react';
import { Heart, Sparkles, ArrowRight, Lock, User, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BUBU_AVATARS, BubuAvatar } from '../components/BubuAvatar';

export const AuthPage: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('bubu-peace');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) {
          setErrorMsg('Please enter your name');
          setLoading(false);
          return;
        }
        await register({
          username: username.trim(),
          password,
          name: name.trim(),
          avatarEmoji,
        });
      } else {
        await login({
          username: username.trim(),
          password,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setUsername('owner');
    setPassword('diary2026');
    setIsRegister(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background cute blur bubbles */}
      <div className="fixed top-12 left-12 w-64 h-64 bg-pink-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-12 right-12 w-72 h-72 bg-amber-200/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-4xl p-6 sm:p-8 border border-pink-100 shadow-cute relative z-10 flex flex-col gap-6">
        {/* Header with mascot */}
        <div className="text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-pink-200 via-rose-100 to-amber-100 flex items-center justify-center p-1 shadow-soft mb-2 overflow-hidden border border-pink-200/60 animate-floatCute">
            <img
              src="/bubu-dudu/bubu-dudu-cozy.gif"
              alt="Bubu & Dudu Mascot"
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
          <h1 className="text-2xl font-black text-glow-cocoa tracking-tight flex items-center gap-1.5">
            Bubu & Dudu English Diary <Heart className="w-4 h-4 fill-rose-400 text-rose-400 inline" />
          </h1>
          <p className="text-xs font-semibold text-glow-muted mt-1">
            {isRegister
              ? 'Join Bubu & Dudu on your cozy English writing & speaking journey'
              : "Welcome back! Bubu & Dudu are waiting for today's story"}
          </p>
        </div>

        {/* Quick Demo Login Pill */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleDemoLogin}
            className="text-xs font-extrabold text-amber-800 bg-gradient-to-r from-amber-100 to-rose-100 hover:from-amber-200 hover:to-rose-200 px-4 py-2 rounded-2xl border border-amber-200 flex items-center gap-1.5 transition bouncy-button shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Fill Demo Account (owner / diary2026)</span>
          </button>
        </div>

        {/* Error notice */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600 text-center">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isRegister && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-glow-muted uppercase tracking-wider">
                  Your Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-pink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mia Blossom"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-pink-50/50 border border-pink-100 focus:outline-none focus:border-rose-400 text-sm font-semibold text-glow-cocoa"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-glow-muted uppercase tracking-wider">
                  Choose Bubu & Dudu Mascot
                </label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {BUBU_AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setAvatarEmoji(av.id)}
                      className={`w-11 h-11 rounded-2xl p-1 flex items-center justify-center border transition bouncy-button shrink-0 ${
                        avatarEmoji === av.id
                          ? 'border-rose-400 bg-rose-50 scale-110 shadow-cute ring-2 ring-rose-200'
                          : 'border-pink-100 bg-white/80 hover:bg-white'
                      }`}
                      title={av.label}
                    >
                      <img src={av.src} alt={av.label} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-glow-muted uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-pink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. owner"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-pink-50/50 border border-pink-100 focus:outline-none focus:border-rose-400 text-sm font-semibold text-glow-cocoa"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-glow-muted uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-pink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-pink-50/50 border border-pink-100 focus:outline-none focus:border-rose-400 text-sm font-semibold text-glow-cocoa"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 rounded-2xl bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 hover:from-pink-500 hover:to-amber-500 text-white font-extrabold text-sm shadow-cute flex items-center justify-center gap-2 bouncy-button disabled:opacity-60 cursor-pointer"
          >
            <span>{loading ? 'Entering...' : isRegister ? 'Start Writing' : 'Open My Diary'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle between Login and Register */}
        <div className="text-center pt-2 border-t border-pink-100/70">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg('');
            }}
            className="text-xs font-bold text-rose-500 hover:text-rose-700 transition"
          >
            {isRegister
              ? 'Already have an account? Sign in here'
              : 'First time here? Create your diary account'}
          </button>
        </div>
      </div>
    </div>
  );
};
