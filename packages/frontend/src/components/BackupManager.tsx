import React, { useState, useEffect } from 'react';
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
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api';

export const BackupManager: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
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
  }, []);

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    setBackupMsg(null);
    try {
      const res = await api.triggerBackupNow();
      setBackupMsg({
        text: res.message || 'Backup completed successfully!',
      });
      fetchStatus();
      setTimeout(() => setBackupMsg(null), 5000);
    } catch (err: any) {
      setBackupMsg({
        text: err.message || 'Failed to complete backup',
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
              Cloud Backup & Data Safety
            </h3>
            <p className="text-xs text-glow-muted">
              Auto-backup SQLite database and voice notes to Google Drive
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {status?.isGoogleDriveConfigured ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Drive Connected ☁️
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-full border border-amber-200">
              <HardDrive className="w-3.5 h-3.5 text-amber-600" />
              Local Storage Mode
            </span>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50/60 via-purple-50/50 to-pink-50/60 p-4 rounded-2xl border border-blue-100/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-glow-cocoa font-semibold">
          <Clock className="w-4 h-4 text-blue-500" />
          <span>
            Scheduled Auto-Backup:{' '}
            <strong className="text-blue-700">Daily at 02:00 AM</strong> (
            {status?.cronSchedule || '0 2 * * *'})
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 text-[11px] underline"
        >
          <span>Setup Google Drive API Guide</span>
          {showGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Google Drive Setup Guide (Collapsible) */}
      {showGuide && (
        <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200 text-xs text-stone-700 flex flex-col gap-2">
          <p className="font-bold text-glow-cocoa">
            📘 Hướng dẫn 3 bước kết nối Google Drive (Service Account):
          </p>
          <ol className="list-decimal pl-4 flex flex-col gap-1.5 text-stone-600">
            <li>
              Vào <strong>Google Cloud Console</strong> &rarr; Tạo 1 project &rarr; Bật{' '}
              <strong>Google Drive API</strong>.
            </li>
            <li>
              Tạo một <strong>Service Account</strong> &rarr; Tải key file dạng JSON về &rarr; Đổi tên thành{' '}
              <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-rose-600">
                packages/backend/service-account.json
              </code>
              .
            </li>
            <li>
              Tạo thư mục trên Google Drive của bạn (ví dụ: <em>Diary Backups</em>) &rarr; Bấm{' '}
              <strong>Share</strong> thư mục đó cho email của Service Account với quyền{' '}
              <strong>Editor</strong>. Lấy Folder ID dán vào{' '}
              <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-rose-600">
                GOOGLE_DRIVE_FOLDER_ID
              </code>{' '}
              trong file <code className="bg-white px-1.5 py-0.5 rounded border">.env</code>.
            </li>
          </ol>
          <p className="text-[11px] text-stone-500 italic mt-1">
            *Dù chưa cấu hình Google Drive, ứng dụng vẫn luôn lưu bản sao lưu an toàn trong máy và bạn có thể tải về máy bất cứ lúc nào!
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={isBackingUp}
          onClick={handleBackupNow}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold rounded-2xl shadow-soft text-xs bouncy-button disabled:opacity-60 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-spin' : ''}`} />
          <span>{isBackingUp ? 'Backing up...' : 'Backup Now 🚀'}</span>
        </button>

        <button
          type="button"
          disabled={isDownloading}
          onClick={handleDownload}
          className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-pink-50 text-glow-cocoa font-bold rounded-2xl border border-pink-200 shadow-2xs text-xs bouncy-button disabled:opacity-60 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-rose-500" />
          <span>{isDownloading ? 'Preparing...' : 'Download Backup (.zip) 💾'}</span>
        </button>
      </div>

      {/* Feedback Message */}
      {backupMsg && (
        <div
          className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            backupMsg.isError
              ? 'bg-rose-50 border border-rose-200 text-rose-600'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
          }`}
        >
          {backupMsg.isError ? (
            <AlertCircle className="w-4 h-4 text-rose-500" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          )}
          <span>{backupMsg.text}</span>
        </div>
      )}

      {/* Recent Backups List */}
      <div className="flex flex-col gap-2 pt-2 border-t border-pink-100/70">
        <h4 className="font-bold text-glow-cocoa text-xs uppercase tracking-wider text-glow-muted">
          Recent Backup Archives (Last 5 snapshots)
        </h4>

        {status?.recentBackups && status.recentBackups.length > 0 ? (
          <div className="flex flex-col gap-2">
            {status.recentBackups.map((b: any, idx: number) => {
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
            No backups generated yet. Click 'Backup Now' to create your first archive!
          </p>
        )}
      </div>
    </div>
  );
};
