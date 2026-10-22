import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Cloud,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  HardDrive,
  ChevronDown,
  ChevronUp,
  FileArchive,
  LogOut,
  Sparkles,
  Link2,
  ShieldCheck,
} from 'lucide-react';
import { UserBackupStatus } from '@diary/shared';
import { api } from '../services/api';

export const BackupManager: React.FC = () => {
  const [status, setStatus] = useState<UserBackupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [backupMsg, setBackupMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await api.getBackupStatus();
      setStatus(res);
    } catch (err) {
      console.error('Failed to load backup status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Check query params if redirected from Google OAuth
    const params = new URLSearchParams(window.location.search);
    const driveConnected = params.get('drive_connected');
    if (driveConnected === 'success') {
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#38BDF8', '#34D399', '#F472B6', '#FBBF24'],
      });
      setBackupMsg({
        text: 'Your personal Google Drive was connected successfully! ☁️✨',
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (driveConnected === 'error') {
      const reason = params.get('reason') || 'Could not complete Google authorization';
      setBackupMsg({
        text: `Google Drive connection failed: ${decodeURIComponent(reason)}`,
        isError: true,
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleConnectDrive = async () => {
    setIsConnecting(true);
    setBackupMsg(null);
    try {
      if (!status?.isOAuthAppConfigured) {
        setShowGuide(true);
        setBackupMsg({
          text: 'Google OAuth Client ID is not configured in backend .env yet. Follow the 2-minute setup guide below!',
          isError: true,
        });
        setIsConnecting(false);
        return;
      }

      const res = await api.getGoogleAuthUrl();
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      setBackupMsg({
        text: err.message || 'Failed to start Google Drive connection',
        isError: true,
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnectDrive = async () => {
    if (window.confirm('Disconnect your personal Google Drive from this diary account?')) {
      try {
        await api.disconnectGoogleDrive();
        await fetchStatus();
        setBackupMsg({ text: 'Google Drive disconnected' });
        setTimeout(() => setBackupMsg(null), 3000);
      } catch (err: any) {
        alert(`Failed to disconnect: ${err.message}`);
      }
    }
  };

  const handleToggleAutoBackup = async () => {
    if (!status) return;
    const nextVal = !status.autoBackupEnabled;
    try {
      await api.updateBackupSettings({ autoBackupEnabled: nextVal });
      setStatus({ ...status, autoBackupEnabled: nextVal });
    } catch (err: any) {
      alert(`Could not update settings: ${err.message}`);
    }
  };

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    setBackupMsg(null);
    try {
      const res = await api.triggerBackupNow();
      setBackupMsg({
        text: res.message || 'Personal backup completed successfully!',
      });
      await fetchStatus();
      setTimeout(() => setBackupMsg(null), 5000);
    } catch (err: any) {
      setBackupMsg({
        text: err.message || 'Failed to complete personal backup',
        isError: true,
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await api.downloadBackup();
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white/95 rounded-3xl p-6 sm:p-7 border border-pink-100 shadow-soft flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-blue-100/70 text-blue-600 rounded-2xl">
            <Cloud className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-extrabold text-glow-cocoa text-lg flex items-center gap-2">
              My Personal Cloud Backup <Sparkles className="w-4 h-4 text-amber-500" />
            </h3>
            <p className="text-xs text-glow-muted">
              Each user can connect their own Google Drive to auto-sync diary entries & voice notes
            </p>
          </div>
        </div>

        {/* Drive Status Badge */}
        <div>
          {status?.googleDriveConnected ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Connected: {status.googleDriveEmail}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-full border border-amber-200">
              <HardDrive className="w-3.5 h-3.5 text-amber-600" />
              Local Storage Mode
            </span>
          )}
        </div>
      </div>

      {/* Connected Account Card OR Connect Call-to-Action */}
      {status?.googleDriveConnected ? (
        <div className="bg-gradient-to-r from-emerald-50/70 via-teal-50/60 to-blue-50/70 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white shadow-soft flex items-center justify-center text-xl">
              ☁️
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                  Google Drive Linked
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="font-extrabold text-glow-cocoa text-sm">
                {status.googleDriveEmail}
              </p>
              <p className="text-[11px] text-emerald-700/90 mt-0.5">
                Backups save directly into your folder: <strong>Daily Glow Diary Backups 🌸</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Auto backup toggle */}
            <button
              type="button"
              onClick={handleToggleAutoBackup}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border bouncy-button ${
                status.autoBackupEnabled
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-white text-stone-500 border-stone-200'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>{status.autoBackupEnabled ? 'Nightly Sync: ON' : 'Nightly Sync: OFF'}</span>
            </button>

            {/* Disconnect */}
            <button
              type="button"
              onClick={handleDisconnectDrive}
              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-100/60 rounded-xl transition text-xs font-bold"
              title="Disconnect Drive"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-50/70 via-purple-50/60 to-pink-50/70 p-4 sm:p-5 rounded-2xl border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white shadow-soft flex items-center justify-center text-xl">
              🔗
            </div>
            <div>
              <h4 className="font-extrabold text-glow-cocoa text-sm">
                Connect your personal Google Drive
              </h4>
              <p className="text-xs text-glow-muted">
                One-click login with Google so your diary & voice notes back up to your private cloud
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isConnecting}
              onClick={handleConnectDrive}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-cute text-xs bouncy-button disabled:opacity-60 cursor-pointer"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>{isConnecting ? 'Opening Google...' : 'Connect My Google Drive'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          disabled={isBackingUp}
          onClick={handleBackupNow}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold rounded-2xl shadow-cute text-xs bouncy-button disabled:opacity-60 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-spin' : ''}`} />
          <span>
            {isBackingUp
              ? 'Creating snapshot...'
              : status?.googleDriveConnected
              ? 'Backup to My Drive Now 🚀'
              : 'Create Personal Snapshot ✨'}
          </span>
        </button>

        <button
          type="button"
          disabled={isDownloading}
          onClick={handleDownload}
          className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-pink-50 text-glow-cocoa font-bold rounded-2xl border border-pink-200 shadow-2xs text-xs bouncy-button disabled:opacity-60 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-rose-500" />
          <span>{isDownloading ? 'Preparing...' : 'Download My Data (.zip) 💾'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="text-xs text-glow-muted hover:text-blue-600 font-bold ml-auto flex items-center gap-1 underline"
        >
          <span>OAuth Setup Guide</span>
          {showGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Feedback Alert */}
      {backupMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            backupMsg.isError
              ? 'bg-rose-50 border border-rose-200 text-rose-600'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
          }`}
        >
          {backupMsg.isError ? (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          )}
          <span>{backupMsg.text}</span>
        </div>
      )}

      {/* Guide Accordion */}
      {showGuide && (
        <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200 text-xs text-stone-700 flex flex-col gap-2.5">
          <p className="font-bold text-glow-cocoa flex items-center gap-1.5">
            🔑 Cấu hình Google OAuth 2.0 Client ID (dành cho Admin / Nhà phát triển):
          </p>
          <p className="text-stone-600 leading-relaxed">
            Để cho phép bất kỳ User nào cũng có thể bấm 1 nút đăng nhập Google và liên kết Drive riêng của họ:
          </p>
          <ol className="list-decimal pl-5 flex flex-col gap-1.5 text-stone-600">
            <li>
              Vào <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold">Google Cloud Console &rarr; Credentials</a>.
            </li>
            <li>
              Bấm <strong>Create Credentials</strong> &rarr; Chọn <strong>OAuth client ID</strong> &rarr; Loại ứng dụng chọn <strong>Web application</strong>.
            </li>
            <li>
              Tại mục <strong>Authorized redirect URIs</strong>, thêm đường dẫn sau:
              <code className="block bg-white px-2 py-1 my-1 rounded border border-slate-300 font-mono text-rose-600">
                http://localhost:4000/api/backup/google/callback
              </code>
            </li>
            <li>
              Copy <strong>Client ID</strong> và <strong>Client Secret</strong> rồi dán vào file <code className="bg-white px-1.5 py-0.5 rounded border text-stone-800">packages/backend/.env</code>:
              <pre className="bg-stone-900 text-stone-100 p-2.5 rounded-xl font-mono text-[11px] overflow-x-auto mt-1">
{`GOOGLE_CLIENT_ID="your_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your_client_secret"
GOOGLE_REDIRECT_URI="http://localhost:4000/api/backup/google/callback"`}
              </pre>
            </li>
          </ol>
          <p className="text-[11px] text-stone-500 italic">
            *Sau khi điền vào .env, bất kỳ người dùng nào khi đăng nhập vào web nhật ký đều có thể liên kết tài khoản Drive cá nhân chỉ với 1 click!
          </p>
        </div>
      )}

      {/* Recent Personal Backups List */}
      <div className="flex flex-col gap-2 pt-2 border-t border-pink-100/70">
        <h4 className="font-bold text-glow-cocoa text-xs uppercase tracking-wider text-glow-muted">
          My Recent Personal Archives
        </h4>

        {status?.recentBackups && status.recentBackups.length > 0 ? (
          <div className="flex flex-col gap-2">
            {status.recentBackups.map((b, idx) => {
              const dateStr = new Date(b.createdAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-pink-50/30 hover:bg-pink-50/60 rounded-xl border border-pink-100/60 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <FileArchive className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="font-semibold text-glow-cocoa">{b.filename}</p>
                      <p className="text-[10px] text-glow-muted">{dateStr}</p>
                    </div>
                  </div>
                  <span className="font-mono text-glow-muted text-[11px] font-bold">
                    {formatSize(b.size)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-glow-muted italic">
            No personal archives created yet. Click 'Create Personal Snapshot' to create one!
          </p>
        )}
      </div>
    </div>
  );
};
