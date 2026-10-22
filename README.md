# 🌸 Daily Glow Diary — Personal English Journal & Voice Notes

A delightful, warm, and cute full-stack Monorepo web application designed for personal daily English journaling, in-browser voice note recording, habit streak tracking, and vocabulary growth.

![Daily Glow Diary](https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1200&q=80)

---

## ✨ Highlights & Features

- ✍️ **Daily English Journaling:**
  - Rich text editor with real-time English word counter and reading time estimate.
  - Set and track daily word goals (e.g. 80 words/day).
  - **Daily English Sparks (Prompts):** Fresh English reflection prompts every day with quick starter phrases you can insert with one click.
  - **Vocabulary Corner 📚:** Save and review new English words and definitions you learned or used today.
  - **Gratitude Sparkles 💖:** Count 3 daily blessings to maintain a positive mindset.
- 🎙️ **Voice Recording & Audio Player:**
  - Built-in browser audio recording using the MediaRecorder API.
  - Live animated waveform visualizer reacting to your voice in real time.
  - Streamed playback with HTTP Range support (seeking) and waveform scrub control.
- 📅 **Interactive Calendar & Habit Tracking:**
  - Monthly calendar showing mood stickers, audio indicators 🎙️, and word counts.
  - Streak tracking (🔥 consecutive days written, best streak record, entries this month).
- 🌸 **Cute & Pastel Aesthetic:**
  - Soft candy rose, honey butter, warm peach, and lavender pastel tones.
  - Rounded, cozy cards (`rounded-3xl`), bouncy buttons, and celebration confetti 🎉 on save.
- 🔐 **Authentication & Privacy:**
  - Secure JWT authentication with bcrypt-hashed passwords.
  - Built-in demo credentials for immediate testing.
- ☁️ **Automated Google Drive Backup & Data Safety:**
  - In-process Cron scheduler (`node-cron`) automatically backs up SQLite database + voice note audio files every night at 02:00 AM.
  - Generates portable `.zip` archives containing the complete database snapshot, audio files, and metadata.
  - Direct integration with Google Drive API via Service Account or OAuth2.
  - Instant "Backup Now" & "Download Backup (.zip)" button on the web interface.

---

## 🏗️ Monorepo Architecture

```
diary/
├── packages/
│   ├── shared/       # Shared TypeScript types, DTOs, moods, and prompts
│   ├── backend/      # Node.js + Express + Prisma ORM + SQLite + Multer
│   │   ├── prisma/   # dev.db (Zero-setup local SQLite database)
│   │   └── uploads/  # Local voice note storage
│   └── frontend/     # React 18 + Vite + Tailwind CSS + Lucide Icons
├── package.json      # Monorepo root scripts (pnpm workspaces)
└── pnpm-workspace.yaml
```

---

## 🚀 Quick Start (1 Command)

### 1. Requirements
- Node.js >= 18
- pnpm >= 9

### 2. Install dependencies
```bash
pnpm install
```

### 3. Start Frontend & Backend concurrently
```bash
pnpm dev
```

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:4000](http://localhost:4000)

---

## 🔑 Demo Account

You can either register your own account or click **"Fill Demo Account"** on the login page:
- **Username:** `owner`
- **Password:** `diary2026`

---

## ☁️ Personalized Google Drive Backup (Per-User OAuth)

Each user can connect their own Google Drive account so their diary entries and voice notes are stored safely in their private cloud folder (`Daily Glow Diary Backups 🌸`), completely isolated from other users!

### How each user connects their Drive:
1. Go to the **Milestones** tab in the web app.
2. In the **"My Personal Cloud Backup"** section, click **"Connect My Google Drive"**.
3. Sign in with your Google account and grant permission for the app to save backups (`drive.file` scope — safe and private).
4. That's it! Your private snapshots will automatically back up to your Google Drive every night at 02:00 AM, or whenever you click **"Backup to My Drive Now 🚀"**.

### Server Setup (for Admin / Developer):
To enable the Google Sign-in button for all users:
1. Go to [Google Cloud Console &rarr; Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** (Application type: *Web application*).
3. Add **Authorized redirect URI**:
   ```
   http://localhost:4000/api/backup/google/callback
   ```
4. Set the credentials in `packages/backend/.env`:
   ```env
   GOOGLE_CLIENT_ID="your_client_id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your_client_secret"
   GOOGLE_REDIRECT_URI="http://localhost:4000/api/backup/google/callback"
   ```
*(Even without Google OAuth credentials configured, every user can still export and download their personal `.zip` archive anytime via the "Download My Data (.zip)" button).*

---

## 🛠️ Helpful Commands

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Start both Backend and Frontend in development mode |
| `pnpm build` | Build all packages (`shared`, `backend`, `frontend`) |
| `pnpm db:seed` | Seed initial demo user and past diary entries |
| `pnpm db:studio` | Open Prisma Studio GUI in browser to inspect SQLite data |

---

Made with 💖 for cultivating daily English fluency.
