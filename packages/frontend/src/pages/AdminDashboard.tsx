import React, { useState, useEffect } from 'react';
import {
  Server,
  Database,
  Users,
  BookOpen,
  Mic,
  HardDrive,
  Shield,
  Key,
  RefreshCw,
  Trash2,
  Edit3,
  Plus,
  Search,
  Download,
  Check,
  AlertCircle,
  Sparkles,
  Clock,
  Activity,
  Cpu,
  FileText,
  CheckCircle2,
  Volume2,
  X,
  Play,
  Pause,
  Filter,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import {
  AdminSystemOverview,
  AdminUserItem,
  AdminEntryItem,
  AdminAudioFileItem,
  AdminBackupFileItem,
  CreateUserDto,
  MOODS,
  MoodType,
} from '@diary/shared';
import { api } from '../services/api';
import { BubuAvatar, BUBU_AVATARS } from '../components/BubuAvatar';
import { CuteAudioPlayer } from '../components/CuteAudioPlayer';

type AdminTab = 'overview' | 'users' | 'entries' | 'audio' | 'backups' | 'config';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Overview State
  const [overview, setOverview] = useState<AdminSystemOverview | null>(null);
  const [isVacuuming, setIsVacuuming] = useState(false);
  const [isCleaningAudio, setIsCleaningAudio] = useState(false);
  const [testingOpenAi, setTestingOpenAi] = useState(false);
  const [openAiTestResult, setOpenAiTestResult] = useState<string | null>(null);

  // 2. Users State
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showResetPassModal, setShowResetPassModal] = useState<AdminUserItem | null>(null);
  const [showEditUserModal, setShowEditUserModal] = useState<AdminUserItem | null>(null);
  const [newPassInput, setNewPassInput] = useState('');

  // Add user form
  const [newUsername, setNewUsername] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserAvatar, setNewUserAvatar] = useState('bubu-peace');
  const [newUserAdmin, setNewUserAdmin] = useState(false);

  // 3. Entries State
  const [entries, setEntries] = useState<AdminEntryItem[]>([]);
  const [entriesTotal, setEntriesTotal] = useState(0);
  const [entrySearch, setEntrySearch] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('');
  const [previewEntry, setPreviewEntry] = useState<AdminEntryItem | null>(null);

  // 4. Audio Files State
  const [audioFiles, setAudioFiles] = useState<AdminAudioFileItem[]>([]);
  const [audioSearch, setAudioSearch] = useState('');

  // 5. Backups State
  const [backups, setBackups] = useState<AdminBackupFileItem[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  const showToast = (type: 'success' | 'error', text: string) => {
    setActionNotice({ type, text });
    setTimeout(() => setActionNotice(null), 5000);
  };

  useEffect(() => {
    loadTabContent(activeTab);
  }, [activeTab]);

  const loadTabContent = async (tab: AdminTab) => {
    setLoading(true);
    try {
      if (tab === 'overview' || tab === 'config') {
        const res = await api.getAdminOverview();
        setOverview(res.overview);
      } else if (tab === 'users') {
        const res = await api.getAdminUsers();
        setUsers(res.users);
      } else if (tab === 'entries') {
        await fetchEntries();
      } else if (tab === 'audio') {
        const res = await api.getAdminAudioFiles();
        setAudioFiles(res.files);
      } else if (tab === 'backups') {
        const res = await api.getAdminBackups();
        setBackups(res.backups);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const fetchEntries = async () => {
    try {
      const res = await api.getAdminEntries({
        q: entrySearch.trim() || undefined,
        mood: selectedMoodFilter || undefined,
        userId: selectedUserFilter || undefined,
        limit: 50,
      });
      setEntries(res.entries);
      setEntriesTotal(res.total);
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi tải bài viết');
    }
  };

  // Maintenance Handlers
  const handleVacuum = async () => {
    setIsVacuuming(true);
    try {
      const res = await api.vacuumDatabase();
      showToast('success', `${res.message} (Giải phóng ${(res.freedBytes / 1024).toFixed(1)} KB)`);
      loadTabContent('overview');
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi tối ưu database');
    } finally {
      setIsVacuuming(false);
    }
  };

  const handleCleanAudio = async () => {
    if (!window.confirm('Quét và xóa tất cả file âm thanh không còn liên kết với bài viết nào?')) return;
    setIsCleaningAudio(true);
    try {
      const res = await api.cleanOrphanAudio();
      showToast('success', res.message);
      loadTabContent('overview');
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi dọn dẹp file âm thanh');
    } finally {
      setIsCleaningAudio(false);
    }
  };

  const handleTestOpenAi = async () => {
    setTestingOpenAi(true);
    setOpenAiTestResult(null);
    try {
      const res = await api.testOpenAiAdmin();
      setOpenAiTestResult(res.message);
      showToast('success', res.message);
    } catch (err: any) {
      setOpenAiTestResult(`Thất bại: ${err.message}`);
      showToast('error', err.message || 'Lỗi test OpenAI');
    } finally {
      setTestingOpenAi(false);
    }
  };

  // User Actions
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createAdminUser({
        username: newUsername.trim(),
        password: newUserPass,
        name: newUserName.trim(),
        avatarEmoji: newUserAvatar,
        isAdmin: newUserAdmin,
      });
      showToast('success', res.message);
      setShowAddUserModal(false);
      setNewUsername('');
      setNewUserPass('');
      setNewUserName('');
      setNewUserAdmin(false);
      loadTabContent('users');
    } catch (err: any) {
      showToast('error', err.message || 'Không thể tạo user');
    }
  };

  const handleResetUserPassword = async () => {
    if (!showResetPassModal || !newPassInput.trim()) return;
    try {
      const res = await api.resetUserPasswordAdmin(showResetPassModal.id, newPassInput.trim());
      showToast('success', res.message);
      setShowResetPassModal(null);
      setNewPassInput('');
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi reset password');
    }
  };

  const handleToggleAdminRole = async (targetUser: AdminUserItem) => {
    if (targetUser.username === 'admin' || targetUser.username === 'owner') {
      alert('Tài khoản Quản trị viên chính luôn có quyền Quản trị viên cao nhất');
      return;
    }
    const nextRole = !targetUser.isAdmin;
    if (!window.confirm(`Xác nhận ${nextRole ? 'gán quyền Quản trị viên' : 'hạ quyền Quản trị viên'} cho "${targetUser.username}"?`)) return;

    try {
      const res = await api.updateAdminUser(targetUser.id, { isAdmin: nextRole });
      showToast('success', res.message);
      loadTabContent('users');
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi cập nhật quyền');
    }
  };

  const handleDeleteUser = async (targetUser: AdminUserItem) => {
    if (targetUser.username === 'admin' || targetUser.username === 'owner') {
      alert('Không thể xóa tài khoản Quản trị viên chính!');
      return;
    }
    if (!window.confirm(`CẢNH BÁO: Xóa tài khoản "${targetUser.username}" sẽ xóa sạch tất cả bài viết nhật ký và file ghi âm của người này. Bạn có chắc chắn không?`)) return;

    try {
      const res = await api.deleteAdminUser(targetUser.id);
      showToast('success', res.message);
      loadTabContent('users');
    } catch (err: any) {
      showToast('error', err.message || 'Không thể xóa user');
    }
  };

  // Entry Actions
  const handleDeleteEntry = async (entry: AdminEntryItem) => {
    if (!window.confirm(`Xác nhận xóa bài viết ngày "${entry.date}" của "${entry.username}"?`)) return;
    try {
      const res = await api.deleteAdminEntry(entry.id);
      showToast('success', res.message);
      fetchEntries();
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi xóa bài viết');
    }
  };

  // Audio Actions
  const handleDeleteAudioFile = async (file: AdminAudioFileItem) => {
    if (!window.confirm(`Xác nhận xóa file "${file.filename}" khỏi ổ cứng?`)) return;
    try {
      const res = await api.deleteAdminAudioFile(file.filename);
      showToast('success', res.message);
      loadTabContent('audio');
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi xóa file âm thanh');
    }
  };

  // Backup Actions
  const handleCreateInstantBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const res = await api.createAdminBackup();
      showToast('success', res.message);
      loadTabContent('backups');
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi tạo sao lưu');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!window.confirm(`Xác nhận xóa bản sao lưu "${filename}"?`)) return;
    try {
      const res = await api.deleteAdminBackup(filename);
      showToast('success', res.message);
      loadTabContent('backups');
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi xóa bản sao lưu');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (secs: number) => {
    const days = Math.floor(secs / 86400);
    const hours = Math.floor((secs % 86400) / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m ${secs % 60}s`;
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl w-full mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-pink-100/90 via-rose-100/80 to-amber-100/90 rounded-4xl p-6 sm:p-8 border border-pink-200 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-3xl bg-white p-1 shadow-soft overflow-hidden border border-pink-200/80 shrink-0">
            <img
              src="/bubu-dudu/bubu-dudu-snuggle.gif"
              alt="Admin Mascot"
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-2xs">
                Admin Panel
              </span>
              <span className="text-xs text-glow-muted font-bold">
                Daily Glow Engine
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-glow-cocoa tracking-tight mt-1 flex items-center gap-2">
              Bảng Điều Khiển Quản Trị Hệ Thống ⚡
            </h2>
            <p className="text-xs text-glow-muted font-semibold mt-0.5">
              Quản lý toàn bộ người dùng, nhật ký, file voice, sao lưu và bảo trì máy chủ
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadTabContent(activeTab)}
          className="px-4 py-2.5 rounded-2xl bg-white/90 hover:bg-white text-xs font-bold text-glow-cocoa border border-pink-200 shadow-2xs transition bouncy-button flex items-center gap-2 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-rose-500 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {/* Floating Action Notice Toast */}
      {actionNotice && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 shadow-cute animate-fadeIn ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionNotice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-stone-400 hover:text-stone-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white/90 backdrop-blur-md rounded-2xl border border-pink-100 shadow-soft">
        {[
          { id: 'overview' as AdminTab, label: 'Tổng quan', icon: Activity, emoji: '📊' },
          { id: 'users' as AdminTab, label: 'Người dùng', icon: Users, emoji: '👥' },
          { id: 'entries' as AdminTab, label: 'Nhật ký', icon: BookOpen, emoji: '📖' },
          { id: 'audio' as AdminTab, label: 'Âm thanh Voice', icon: Mic, emoji: '🎙️' },
          { id: 'backups' as AdminTab, label: 'Sao lưu & DB', icon: HardDrive, emoji: '💾' },
          { id: 'config' as AdminTab, label: 'Cấu hình & AI', icon: Server, emoji: '⚙️' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all bouncy-button ${
                isActive
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-cute scale-100'
                  : 'text-glow-muted hover:text-glow-cocoa hover:bg-pink-50/60'
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: OVERVIEW & MAINTENANCE */}
      {/* ========================================================= */}
      {activeTab === 'overview' && overview && (
        <div className="flex flex-col gap-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white/95 rounded-3xl p-4 border border-pink-100 shadow-soft flex flex-col items-center text-center">
              <span className="text-2xl mb-1">👥</span>
              <span className="text-2xl font-black text-rose-600">{overview.database.totalUsers}</span>
              <span className="text-[11px] font-bold text-glow-muted uppercase tracking-wider mt-0.5">Người dùng</span>
            </div>

            <div className="bg-white/95 rounded-3xl p-4 border border-pink-100 shadow-soft flex flex-col items-center text-center">
              <span className="text-2xl mb-1">📖</span>
              <span className="text-2xl font-black text-amber-600">{overview.database.totalEntries}</span>
              <span className="text-[11px] font-bold text-glow-muted uppercase tracking-wider mt-0.5">Bài nhật ký</span>
            </div>

            <div className="bg-white/95 rounded-3xl p-4 border border-pink-100 shadow-soft flex flex-col items-center text-center">
              <span className="text-2xl mb-1">✍️</span>
              <span className="text-2xl font-black text-purple-600">{overview.database.totalWords}</span>
              <span className="text-[11px] font-bold text-glow-muted uppercase tracking-wider mt-0.5">Tổng từ vựng</span>
            </div>

            <div className="bg-white/95 rounded-3xl p-4 border border-pink-100 shadow-soft flex flex-col items-center text-center">
              <span className="text-2xl mb-1">🎙️</span>
              <span className="text-2xl font-black text-emerald-600">{overview.storage.audioUploadsCount}</span>
              <span className="text-[11px] font-bold text-glow-muted uppercase tracking-wider mt-0.5">Bản ghi Voice</span>
            </div>

            <div className="bg-white/95 rounded-3xl p-4 border border-pink-100 shadow-soft flex flex-col items-center text-center">
              <span className="text-2xl mb-1">🗄️</span>
              <span className="text-2xl font-black text-sky-600">{formatBytes(overview.database.sizeBytes)}</span>
              <span className="text-[11px] font-bold text-glow-muted uppercase tracking-wider mt-0.5">Dung lượng DB</span>
            </div>

            <div className="bg-white/95 rounded-3xl p-4 border border-pink-100 shadow-soft flex flex-col items-center text-center">
              <span className="text-2xl mb-1">📦</span>
              <span className="text-2xl font-black text-indigo-600">{overview.storage.backupsCount}</span>
              <span className="text-[11px] font-bold text-glow-muted uppercase tracking-wider mt-0.5">Bản sao lưu</span>
            </div>
          </div>

          {/* Quick Maintenance Actions */}
          <div className="bg-white/95 rounded-3xl p-6 border border-pink-100 shadow-soft flex flex-col gap-4">
            <h3 className="font-extrabold text-glow-cocoa text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Thao Tác Bảo Trì Nhanh (Maintenance Toolkit)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Vacuum SQLite */}
              <button
                type="button"
                onClick={handleVacuum}
                disabled={isVacuuming}
                className="p-4 rounded-2xl bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200 transition bouncy-button flex flex-col gap-1 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">🚀</span>
                  <span className="text-[10px] font-extrabold uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                    SQLite
                  </span>
                </div>
                <span className="font-bold text-xs text-amber-900 mt-1">
                  {isVacuuming ? 'Đang tối ưu...' : 'Tối ưu hóa Database (VACUUM)'}
                </span>
                <span className="text-[11px] text-amber-700/80 leading-snug">
                  Chạy lệnh VACUUM dọn dẹp các phân mảnh và thu hồi bộ nhớ trống.
                </span>
              </button>

              {/* Clean Orphan Audio */}
              <button
                type="button"
                onClick={handleCleanAudio}
                disabled={isCleaningAudio}
                className="p-4 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200 transition bouncy-button flex flex-col gap-1 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">🧹</span>
                  <span className="text-[10px] font-extrabold uppercase bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                    Audio
                  </span>
                </div>
                <span className="font-bold text-xs text-emerald-900 mt-1">
                  {isCleaningAudio ? 'Đang quét...' : 'Dọn file Voice rác (Clean Audio)'}
                </span>
                <span className="text-[11px] text-emerald-700/80 leading-snug">
                  Xóa các file ghi âm trên ổ cứng không còn gắn với nhật ký nào.
                </span>
              </button>

              {/* Instant Backup Snapshot */}
              <button
                type="button"
                onClick={handleCreateInstantBackup}
                disabled={isCreatingBackup}
                className="p-4 rounded-2xl bg-sky-50/70 hover:bg-sky-100/80 border border-sky-200 transition bouncy-button flex flex-col gap-1 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">📦</span>
                  <span className="text-[10px] font-extrabold uppercase bg-sky-200 text-sky-900 px-2 py-0.5 rounded-full">
                    Backup
                  </span>
                </div>
                <span className="font-bold text-xs text-sky-900 mt-1">
                  {isCreatingBackup ? 'Đang tạo...' : 'Tạo bản Snapshot ngay'}
                </span>
                <span className="text-[11px] text-sky-700/80 leading-snug">
                  Chụp lại toàn bộ Database SQLite vào thư mục lưu trữ an toàn.
                </span>
              </button>

              {/* Download Live Database */}
              <button
                type="button"
                onClick={() => api.downloadLiveDatabase()}
                className="p-4 rounded-2xl bg-pink-50/70 hover:bg-pink-100/80 border border-pink-200 transition bouncy-button flex flex-col gap-1 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">💾</span>
                  <span className="text-[10px] font-extrabold uppercase bg-pink-200 text-rose-900 px-2 py-0.5 rounded-full">
                    Direct
                  </span>
                </div>
                <span className="font-bold text-xs text-rose-900 mt-1">
                  Tải trực tiếp file dev.db
                </span>
                <span className="text-[11px] text-rose-700/80 leading-snug">
                  Tải tệp database SQLite nguyên bản hiện tại về máy tính cá nhân.
                </span>
              </button>
            </div>
          </div>

          {/* Server & Runtime Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/95 rounded-3xl p-6 border border-pink-100 shadow-soft flex flex-col gap-3">
              <h4 className="font-extrabold text-glow-cocoa text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-rose-500" />
                <span>Thông số Máy chủ & Tiến trình (Server Runtime)</span>
              </h4>
              <div className="flex flex-col gap-2 text-xs font-semibold text-stone-700">
                <div className="flex justify-between py-1 border-b border-pink-50">
                  <span className="text-glow-muted">Thời gian chạy (Uptime):</span>
                  <span className="font-bold text-glow-cocoa">{formatUptime(overview.server.uptimeSeconds)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-pink-50">
                  <span className="text-glow-muted">Node.js Version:</span>
                  <span className="font-mono text-glow-cocoa">{overview.server.nodeVersion}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-pink-50">
                  <span className="text-glow-muted">Nền tảng / Kiến trúc:</span>
                  <span className="font-mono text-glow-cocoa">{overview.server.platform} ({overview.server.arch})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-pink-50">
                  <span className="text-glow-muted">Cổng mạng (Port):</span>
                  <span className="font-mono font-bold text-rose-600">{overview.server.port}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-glow-muted">Môi trường (Environment):</span>
                  <span className="font-bold text-emerald-600 uppercase">{overview.server.nodeEnv}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/95 rounded-3xl p-6 border border-pink-100 shadow-soft flex flex-col gap-3">
              <h4 className="font-extrabold text-glow-cocoa text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />
                <span>Tiêu thụ Bộ nhớ RAM & Dung lượng Lưu trữ</span>
              </h4>
              <div className="flex flex-col gap-2 text-xs font-semibold text-stone-700">
                <div className="flex justify-between py-1 border-b border-pink-50">
                  <span className="text-glow-muted">Bộ nhớ Heap (Sử dụng / Cấp phát):</span>
                  <span className="font-mono text-purple-700 font-bold">{overview.server.memory.heapUsedMB} MB / {overview.server.memory.heapTotalMB} MB</span>
                </div>
                <div className="flex justify-between py-1 border-b border-pink-50">
                  <span className="text-glow-muted">Resident Set Size (RSS):</span>
                  <span className="font-mono text-glow-cocoa">{overview.server.memory.rssMB} MB</span>
                </div>
                <div className="flex justify-between py-1 border-b border-pink-50">
                  <span className="text-glow-muted">Tổng dung lượng file Audio:</span>
                  <span className="font-mono text-emerald-700 font-bold">{formatBytes(overview.storage.audioUploadsSizeBytes)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-pink-50">
                  <span className="text-glow-muted">Tổng dung lượng các bản Backup:</span>
                  <span className="font-mono text-indigo-700 font-bold">{formatBytes(overview.storage.backupsSizeBytes)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-glow-muted">Lịch sao lưu tự động định kỳ (Cron):</span>
                  <span className="font-mono font-bold text-amber-700">[{overview.services.cronSchedule}] (2:00 AM)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: USERS MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <div className="bg-white/95 rounded-3xl p-6 border border-pink-100 shadow-soft flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-glow-cocoa text-lg flex items-center gap-2">
                <span>Quản Lý Toàn Bộ Người Dùng ({users.length})</span>
              </h3>
              <p className="text-xs text-glow-muted">
                Xem danh sách, tạo mới, đổi mật khẩu, phân quyền quản trị hoặc xóa tài khoản
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-pink-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm username hoặc tên..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-pink-50/50 border border-pink-100 text-xs font-semibold focus:outline-none focus:border-rose-400"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowAddUserModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-xs shadow-cute flex items-center gap-1.5 transition bouncy-button shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm User</span>
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto rounded-2xl border border-pink-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-pink-50/60 text-glow-muted font-bold uppercase tracking-wider text-[11px] border-b border-pink-100">
                <tr>
                  <th className="p-3.5">Người dùng</th>
                  <th className="p-3.5">Tài khoản</th>
                  <th className="p-3.5">Vai trò</th>
                  <th className="p-3.5 text-center">Nhật ký</th>
                  <th className="p-3.5 text-center">Tổng từ</th>
                  <th className="p-3.5 text-center">Voice</th>
                  <th className="p-3.5">Ngày tham gia</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50 text-glow-cocoa font-medium">
                {users
                  .filter((u) =>
                    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                    u.name.toLowerCase().includes(userSearch.toLowerCase())
                  )
                  .map((u) => (
                    <tr key={u.id} className="hover:bg-pink-50/30 transition">
                      <td className="p-3.5 flex items-center gap-2">
                        <BubuAvatar avatar={u.avatarEmoji} size="xs" />
                        <span className="font-bold">{u.name}</span>
                      </td>
                      <td className="p-3.5 font-mono text-glow-muted">{u.username}</td>
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleAdminRole(u)}
                          title="Bấm để chuyển đổi vai trò Admin / User"
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase transition bouncy-button ${
                            u.isAdmin
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-stone-100 text-stone-600 hover:bg-pink-100 hover:text-rose-700'
                          }`}
                        >
                          {u.isAdmin ? '👑 Admin' : 'User'}
                        </button>
                      </td>
                      <td className="p-3.5 text-center font-bold text-amber-600">{u.entriesCount}</td>
                      <td className="p-3.5 text-center font-bold text-purple-600">{u.totalWords}</td>
                      <td className="p-3.5 text-center font-bold text-emerald-600">{u.audioCount}</td>
                      <td className="p-3.5 text-glow-muted text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setShowResetPassModal(u);
                              setNewPassInput('');
                            }}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Reset mật khẩu người dùng này"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            disabled={u.username === 'admin' || u.username === 'owner'}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition disabled:opacity-20"
                            title={u.username === 'admin' || u.username === 'owner' ? 'Không thể xóa tài khoản Quản trị viên chính' : 'Xóa tài khoản này'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: DIARY ENTRIES MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === 'entries' && (
        <div className="bg-white/95 rounded-3xl p-6 border border-pink-100 shadow-soft flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-glow-cocoa text-lg flex items-center gap-2">
                <span>Quản Lý Toàn Bộ Nhật Ký ({entriesTotal})</span>
              </h3>
              <p className="text-xs text-glow-muted">
                Tra cứu, đọc nội dung, kiểm tra lỗi AI hoặc xóa bất kỳ bài viết nào trong hệ thống
              </p>
            </div>

            <button
              type="button"
              onClick={() => api.exportAllEntriesJson()}
              className="px-4 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-glow-cocoa font-bold text-xs border border-pink-200 transition bouncy-button flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-rose-500" />
              <span>Xuất toàn bộ JSON</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-pink-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm từ khóa trong tiêu đề hoặc nội dung..."
                value={entrySearch}
                onChange={(e) => setEntrySearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchEntries()}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-pink-50/50 border border-pink-100 text-xs font-semibold focus:outline-none focus:border-rose-400"
              />
            </div>

            <select
              value={selectedMoodFilter}
              onChange={(e) => {
                setSelectedMoodFilter(e.target.value);
              }}
              className="px-3 py-2 rounded-xl bg-pink-50/50 border border-pink-100 text-xs font-semibold text-glow-cocoa focus:outline-none"
            >
              <option value="">Tất cả tâm trạng (All Moods)</option>
              {Object.entries(MOODS).map(([k, m]) => (
                <option key={k} value={k}>
                  {m.emoji} {m.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={fetchEntries}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-xs shadow-cute transition bouncy-button"
            >
              Lọc kết quả
            </button>
          </div>

          {/* Entries Table */}
          <div className="overflow-x-auto rounded-2xl border border-pink-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-pink-50/60 text-glow-muted font-bold uppercase tracking-wider text-[11px] border-b border-pink-100">
                <tr>
                  <th className="p-3.5">Ngày & Tác giả</th>
                  <th className="p-3.5">Tiêu đề & Trích đoạn</th>
                  <th className="p-3.5 text-center">Tâm trạng</th>
                  <th className="p-3.5 text-center">Số từ</th>
                  <th className="p-3.5 text-center">Voice</th>
                  <th className="p-3.5 text-center">AI Review</th>
                  <th className="p-3.5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50 text-glow-cocoa font-medium">
                {entries.map((e) => {
                  const moodMeta = MOODS[e.mood as MoodType];
                  return (
                    <tr key={e.id} className="hover:bg-pink-50/30 transition">
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-bold text-glow-cocoa">{e.date}</div>
                        <div className="text-[11px] text-glow-muted flex items-center gap-1 mt-0.5">
                          <BubuAvatar avatar={e.userAvatar} size="xs" />
                          <span>{e.userName} (@{e.username})</span>
                        </div>
                      </td>

                      <td className="p-3.5 max-w-xs">
                        <div className="font-extrabold text-glow-cocoa truncate">{e.title || '(Chưa đặt tiêu đề)'}</div>
                        {e.isPrivateEncrypted ? (
                          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-rose-500">
                            <Lock className="w-3 h-3 text-rose-400 shrink-0" />
                            <span>Mã hoá riêng tư (Chỉ tác giả đọc được)</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">{e.content || '(Trống)'}</div>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <span className="text-base" title={moodMeta?.label}>
                          {moodMeta?.emoji || '🌸'}
                        </span>
                      </td>

                      <td className="p-3.5 text-center font-bold text-purple-700">{e.wordCount}</td>

                      <td className="p-3.5 text-center">
                        {e.audioUrl || e.hasAudio ? (
                          <span className="text-emerald-600 font-bold text-[11px]">Có voice</span>
                        ) : (
                          <span className="text-stone-300">-</span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        {e.hasAiReview ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                            Đã sửa
                          </span>
                        ) : (
                          <span className="text-stone-300">-</span>
                        )}
                      </td>

                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewEntry(e)}
                            className="px-2.5 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-glow-cocoa font-bold text-[11px] transition"
                          >
                            Xem chi tiết
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEntry(e)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                            title="Xóa bài viết này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: AUDIO STORAGE MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === 'audio' && (
        <div className="bg-white/95 rounded-3xl p-6 border border-pink-100 shadow-soft flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-glow-cocoa text-lg flex items-center gap-2">
                <span>Quản Lý Tệp Âm Thanh Voice ({audioFiles.length})</span>
              </h3>
              <p className="text-xs text-glow-muted">
                Kiểm soát dung lượng, nghe lại các đoạn ghi âm và dọn dẹp các file mồ côi
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCleanAudio}
                disabled={isCleaningAudio}
                className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition bouncy-button flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isCleaningAudio ? 'Đang dọn...' : 'Quét & Xóa file rác'}</span>
              </button>
            </div>
          </div>

          {/* Audio Files Table */}
          <div className="overflow-x-auto rounded-2xl border border-pink-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-pink-50/60 text-glow-muted font-bold uppercase tracking-wider text-[11px] border-b border-pink-100">
                <tr>
                  <th className="p-3.5">Tên file</th>
                  <th className="p-3.5">Dung lượng</th>
                  <th className="p-3.5">Liên kết nhật ký</th>
                  <th className="p-3.5">Ngày tạo</th>
                  <th className="p-3.5 w-64">Phát âm thanh</th>
                  <th className="p-3.5 text-right">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50 text-glow-cocoa font-medium">
                {audioFiles.map((f) => (
                  <tr key={f.filename} className="hover:bg-pink-50/30 transition">
                    <td className="p-3.5 font-mono text-[11px]">{f.filename}</td>
                    <td className="p-3.5 font-bold text-purple-700">{formatBytes(f.sizeBytes)}</td>
                    <td className="p-3.5">
                      {f.isLinked ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          {f.linkedUser} ({f.linkedDate})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                          File mồ côi (chưa gắn bài)
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-glow-muted text-[11px]">
                      {new Date(f.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="p-3.5">
                      <CuteAudioPlayer src={f.url} className="py-1 px-2" />
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteAudioFile(f)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        title="Xóa file này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: BACKUPS & DATABASE MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === 'backups' && (
        <div className="bg-white/95 rounded-3xl p-6 border border-pink-100 shadow-soft flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-glow-cocoa text-lg flex items-center gap-2">
                <span>Quản Lý Bản Sao Lưu & Database ({backups.length})</span>
              </h3>
              <p className="text-xs text-glow-muted">
                Tạo bản snapshot tức thì, tải file database gốc hoặc tải các file zip dự phòng
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCreateInstantBackup}
                disabled={isCreatingBackup}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-xs shadow-cute transition bouncy-button flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isCreatingBackup ? 'Đang sao lưu...' : 'Tạo Snapshot Ngay'}</span>
              </button>

              <button
                type="button"
                onClick={() => api.downloadLiveDatabase()}
                className="px-4 py-2 rounded-xl bg-pink-100/70 hover:bg-pink-100 text-glow-cocoa font-bold text-xs border border-pink-200 transition bouncy-button flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-rose-500" />
                <span>Tải Live dev.db</span>
              </button>
            </div>
          </div>

          {/* Backups Table */}
          <div className="overflow-x-auto rounded-2xl border border-pink-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-pink-50/60 text-glow-muted font-bold uppercase tracking-wider text-[11px] border-b border-pink-100">
                <tr>
                  <th className="p-3.5">Tên bản sao lưu</th>
                  <th className="p-3.5">Loại định dạng</th>
                  <th className="p-3.5">Dung lượng</th>
                  <th className="p-3.5">Thời điểm tạo</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50 text-glow-cocoa font-medium">
                {backups.map((b) => (
                  <tr key={b.filename} className="hover:bg-pink-50/30 transition">
                    <td className="p-3.5 font-mono text-[11px] font-bold text-glow-cocoa">
                      {b.filename}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        b.type === 'sqlite' ? 'bg-sky-100 text-sky-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {b.type === 'sqlite' ? 'SQLite Database' : 'ZIP Archive'}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-emerald-700">{formatBytes(b.sizeBytes)}</td>
                    <td className="p-3.5 text-glow-muted text-[11px]">
                      {new Date(b.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => api.downloadAdminBackup(b.filename)}
                          className="px-3 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-glow-cocoa font-bold text-xs flex items-center gap-1 transition bouncy-button"
                        >
                          <Download className="w-3 h-3 text-rose-500" />
                          <span>Tải về</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBackup(b.filename)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          title="Xóa bản backup này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: CONFIG & SERVICES */}
      {/* ========================================================= */}
      {activeTab === 'config' && overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* OpenAI Service Card */}
          <div className="bg-white/95 rounded-3xl p-6 border border-pink-100 shadow-soft flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-glow-cocoa text-base">OpenAI API Service</h4>
                  <p className="text-[11px] text-glow-muted">Dịch vụ sửa lỗi ngữ pháp & chính tả tiếng Anh</p>
                </div>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                overview.services.hasServerOpenAiKey
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {overview.services.hasServerOpenAiKey ? 'Đã cài đặt' : 'Chưa có key server'}
              </span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Key được cấu hình qua biến môi trường <code className="bg-pink-50 px-1 py-0.5 rounded text-rose-600 font-mono">OPENAI_API_KEY</code> hoặc cài đặt riêng theo từng tài khoản.
            </p>

            <button
              type="button"
              onClick={handleTestOpenAi}
              disabled={testingOpenAi}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs shadow-cute transition bouncy-button flex items-center justify-center gap-2"
            >
              <Activity className={`w-3.5 h-3.5 ${testingOpenAi ? 'animate-spin' : ''}`} />
              <span>{testingOpenAi ? 'Đang gửi ping test...' : 'Kiểm tra kết nối OpenAI API ngay'}</span>
            </button>

            {openAiTestResult && (
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-700">
                {openAiTestResult}
              </div>
            )}
          </div>

          {/* Google OAuth & Cloud Backup Card */}
          <div className="bg-white/95 rounded-3xl p-6 border border-pink-100 shadow-soft flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-glow-cocoa text-base">Google Cloud & Drive OAuth</h4>
                  <p className="text-[11px] text-glow-muted">Dịch vụ đồng bộ đám mây cá nhân</p>
                </div>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                overview.services.hasGoogleOAuth
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-stone-100 text-stone-600 border border-stone-200'
              }`}>
                {overview.services.hasGoogleOAuth ? 'Đã cấu hình' : 'Chưa cấu hình'}
              </span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Cấu hình qua <code className="bg-pink-50 px-1 py-0.5 rounded text-rose-600 font-mono">GOOGLE_CLIENT_ID</code> và <code className="bg-pink-50 px-1 py-0.5 rounded text-rose-600 font-mono">GOOGLE_CLIENT_SECRET</code> để người dùng tự động sao lưu nhật ký sang Google Drive cá nhân của họ.
            </p>

            <div className="p-3 rounded-2xl bg-pink-50/50 border border-pink-100 text-[11px] text-glow-cocoa font-medium">
              Redirect URI: <code className="font-mono text-rose-600">http://localhost:5173/api/backup/google/callback</code>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD USER */}
      {/* ========================================================= */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-4xl p-6 sm:p-7 max-w-md w-full border border-pink-100 shadow-cute flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-glow-cocoa text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-500" />
                <span>Tạo Người Dùng Mới</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="text-glow-muted hover:text-rose-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-glow-muted uppercase tracking-wider">Họ và Tên</label>
                <input
                  type="text"
                  required
                  placeholder="ví dụ: Mia Blossom"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="px-3.5 py-2 rounded-2xl bg-pink-50/50 border border-pink-100 text-xs font-semibold focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-glow-muted uppercase tracking-wider">Tên đăng nhập (Username)</label>
                <input
                  type="text"
                  required
                  placeholder="ví dụ: mia"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="px-3.5 py-2 rounded-2xl bg-pink-50/50 border border-pink-100 text-xs font-semibold focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-glow-muted uppercase tracking-wider">Mật khẩu ban đầu</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newUserPass}
                  onChange={(e) => setNewUserPass(e.target.value)}
                  className="px-3.5 py-2 rounded-2xl bg-pink-50/50 border border-pink-100 text-xs font-semibold focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-glow-muted uppercase tracking-wider">Chọn Avatar</label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {BUBU_AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setNewUserAvatar(av.id)}
                      className={`w-10 h-10 rounded-2xl p-1 flex items-center justify-center border transition bouncy-button shrink-0 ${
                        newUserAvatar === av.id ? 'border-rose-400 bg-rose-50 scale-110 shadow-cute' : 'border-pink-100 bg-white'
                      }`}
                    >
                      <img src={av.src} alt={av.label} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-glow-cocoa cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newUserAdmin}
                  onChange={(e) => setNewUserAdmin(e.target.checked)}
                  className="rounded accent-rose-500 w-4 h-4"
                />
                <span>Cấp quyền Quản trị viên (Admin) cho tài khoản này</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-pink-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-glow-muted hover:bg-pink-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-xs shadow-cute transition bouncy-button"
                >
                  Tạo tài khoản ✨
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: RESET PASSWORD FOR USER */}
      {/* ========================================================= */}
      {showResetPassModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-4xl p-6 sm:p-7 max-w-sm w-full border border-pink-100 shadow-cute flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-glow-cocoa text-base flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" />
                <span>Reset Mật Khẩu User</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowResetPassModal(null)}
                className="text-glow-muted hover:text-rose-500"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-glow-muted">
              Đổi mật khẩu trực tiếp cho tài khoản <strong className="text-glow-cocoa">"{showResetPassModal.username}"</strong> ({showResetPassModal.name}):
            </p>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-glow-muted uppercase tracking-wider">Mật khẩu mới</label>
              <input
                type="text"
                placeholder="Nhập mật khẩu mới muốn đặt..."
                value={newPassInput}
                onChange={(e) => setNewPassInput(e.target.value)}
                className="px-3.5 py-2.5 rounded-2xl bg-pink-50/50 border border-pink-100 text-xs font-semibold focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetPassModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-glow-muted hover:bg-pink-50 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleResetUserPassword}
                disabled={!newPassInput.trim()}
                className="px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-xs shadow-cute transition bouncy-button disabled:opacity-40"
              >
                Lưu Mật Khẩu Mới ✨
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: PREVIEW ENTRY DETAIL */}
      {/* ========================================================= */}
      {previewEntry && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-4xl p-6 sm:p-8 max-w-2xl w-full border border-pink-100 shadow-cute flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <div className="flex items-center gap-2">
                <BubuAvatar avatar={previewEntry.userAvatar} size="xs" />
                <div>
                  <h4 className="font-extrabold text-glow-cocoa text-sm">
                    {previewEntry.userName} (@{previewEntry.username})
                  </h4>
                  <span className="text-[11px] text-glow-muted font-bold">
                    Ngày {previewEntry.date} • {previewEntry.wordCount} words
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewEntry(null)}
                className="text-glow-muted hover:text-rose-500 p-1"
              >
                ✕
              </button>
            </div>

            {previewEntry.isPrivateEncrypted ? (
              <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 border border-pink-200 text-center flex flex-col items-center gap-2.5 my-2">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-soft flex items-center justify-center text-rose-500 border border-pink-100">
                  <ShieldCheck className="w-7 h-7 text-rose-500" />
                </div>
                <h4 className="font-extrabold text-glow-cocoa text-base flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-rose-500 inline" />
                  Nội Dung Được Bảo Vệ Riêng Tư
                </h4>
                <p className="text-xs text-glow-muted max-w-md leading-relaxed">
                  Nhật ký này đã được tự động mã hóa bằng thuật toán <strong>AES-256-GCM</strong> theo khóa bí mật riêng của tác giả. Để tôn trọng quyền riêng tư tuyệt đối, chỉ người viết mới có thể giải mã và đọc được toàn bộ nội dung.
                </p>
                <div className="text-[11px] font-bold text-rose-600 bg-white/80 px-3 py-1 rounded-xl border border-rose-200/60 mt-1">
                  🔒 Quyền Quản trị viên chỉ quản lý metadata & dung lượng hệ thống
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-black text-glow-cocoa">
                  {previewEntry.title || '(Chưa đặt tiêu đề)'}
                </h3>

                <div className="text-sm leading-relaxed text-glow-cocoa whitespace-pre-wrap bg-pink-50/20 p-4 rounded-2xl border border-pink-100">
                  {previewEntry.content || '(Bài viết không có nội dung văn bản)'}
                </div>

                {previewEntry.audioUrl && (
                  <div className="pt-2">
                    <label className="text-[11px] font-bold text-glow-muted uppercase tracking-wider mb-1 block">
                      Bản ghi âm giọng nói:
                    </label>
                    <CuteAudioPlayer src={previewEntry.audioUrl} initialDuration={previewEntry.audioDuration} />
                  </div>
                )}
              </>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-pink-100">
              <button
                type="button"
                onClick={() => setPreviewEntry(null)}
                className="px-5 py-2 rounded-2xl bg-pink-100 hover:bg-pink-200 text-glow-cocoa font-bold text-xs transition bouncy-button"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
