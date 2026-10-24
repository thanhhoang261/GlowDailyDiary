import React, { useState } from 'react';
import { Heart, Sparkles, ArrowRight, Lock, User, KeyRound, Eye, EyeOff, ShieldCheck, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BUBU_AVATARS } from '../components/BubuAvatar';

type AuthMode = 'login' | 'register' | 'reset';

export const AuthPage: React.FC = () => {
  const { login, register, resetPassword } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [name, setName] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('bubu-peace');

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (authMode === 'register') {
        if (!name.trim()) {
          setErrorMsg('Vui lòng nhập tên của bạn');
          setLoading(false);
          return;
        }
        await register({
          username: username.trim(),
          password,
          name: name.trim(),
          avatarEmoji,
        });
      } else if (authMode === 'reset') {
        if (!username.trim() || !newPassword.trim()) {
          setErrorMsg('Vui lòng nhập tên tài khoản và mật khẩu mới');
          setLoading(false);
          return;
        }
        await resetPassword({
          username: username.trim(),
          newPassword: newPassword.trim(),
        });
        setSuccessMsg('Đặt lại mật khẩu thành công! Đang chuyển vào nhật ký...');
      } else {
        await login({
          username: username.trim(),
          password,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Thao tác không thành công');
    } finally {
      setLoading(false);
    }
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
            Daily Glow Diary <Heart className="w-4 h-4 fill-rose-400 text-rose-400 inline" />
          </h1>
          <p className="text-xs font-semibold text-glow-muted mt-1">
            {authMode === 'register' && 'Bắt đầu hành trình viết nhật ký & luyện nói tiếng Anh ấm áp'}
            {authMode === 'login' && 'Chào mừng bạn quay lại góc nhật ký thân yêu'}
            {authMode === 'reset' && 'Chỉ cần nhập tài khoản cũ và mật khẩu mới để đổi ngay'}
          </p>
        </div>

        {/* Success Notice */}
        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 text-center flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error notice */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600 text-center">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Register: Name & Avatar */}
          {authMode === 'register' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-glow-muted uppercase tracking-wider">
                  Tên của bạn (Your Name)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-pink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: Mia Blossom"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-pink-50/50 border border-pink-100 focus:outline-none focus:border-rose-400 text-sm font-semibold text-glow-cocoa"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-glow-muted uppercase tracking-wider">
                  Chọn Avatar Bubu & Dudu
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

          {/* Username Field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-glow-muted uppercase tracking-wider">
              {authMode === 'reset' ? 'Tài khoản cũ (Username)' : 'Tài khoản (Username)'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-pink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-pink-50/50 border border-pink-100 focus:outline-none focus:border-rose-400 text-sm font-semibold text-glow-cocoa"
              />
            </div>
          </div>

          {/* Normal Password Field (Login / Register) */}
          {authMode !== 'reset' && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-glow-muted uppercase tracking-wider">
                  Mật khẩu
                </label>
                {authMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('reset');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] font-bold text-rose-500 hover:text-rose-700 transition"
                  >
                    Quên mật khẩu?
                  </button>
                )}
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-pink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-pink-50/50 border border-pink-100 focus:outline-none focus:border-rose-400 text-sm font-semibold text-glow-cocoa"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-glow-muted hover:text-glow-cocoa"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Reset Password Field (Reset Mode) */}
          {authMode === 'reset' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-glow-muted uppercase tracking-wider">
                Mật khẩu mới (New Password)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-pink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  placeholder="Nhập mật khẩu mới muốn đặt..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-pink-50/50 border border-pink-100 focus:outline-none focus:border-rose-400 text-sm font-semibold text-glow-cocoa"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-glow-muted hover:text-glow-cocoa"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 rounded-2xl bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 hover:from-pink-500 hover:to-amber-500 text-white font-extrabold text-sm shadow-cute flex items-center justify-center gap-2 bouncy-button disabled:opacity-60 cursor-pointer"
          >
            <span>
              {loading
                ? 'Đang xử lý...'
                : authMode === 'register'
                ? 'Bắt đầu viết nhật ký ✨'
                : authMode === 'reset'
                ? 'Đặt lại mật khẩu & Đăng nhập ngay ✨'
                : 'Mở nhật ký của tôi ✨'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Navigation Switchers */}
        <div className="flex flex-col items-center gap-2 pt-2 border-t border-pink-100/70 text-center">
          {authMode === 'login' && (
            <div className="flex flex-col gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-rose-500 hover:text-rose-700 transition"
              >
                Lần đầu ghé thăm? Tạo tài khoản nhật ký mới
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('reset');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-glow-muted hover:text-glow-cocoa text-[11px] transition"
              >
                🔑 Quên mật khẩu? Đặt lại mật khẩu tài khoản
              </button>
            </div>
          )}

          {authMode === 'register' && (
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-xs font-bold text-rose-500 hover:text-rose-700 transition"
            >
              Đã có tài khoản? Đăng nhập tại đây
            </button>
          )}

          {authMode === 'reset' && (
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-xs font-bold text-rose-500 hover:text-rose-700 transition"
            >
              ← Quay lại trang Đăng nhập
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
