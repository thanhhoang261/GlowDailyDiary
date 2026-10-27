# 🌸 Daily Glow Diary — Personal English Journal & Voice Notes

A delightful, warm, and cute full-stack Monorepo web application designed for personal daily English journaling, in-browser voice note recording, AI grammar coaching, habit streak tracking, and end-to-end encrypted privacy.

![Daily Glow Diary](https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1200&q=80)

---

## ✨ Highlights & Features

- ✍️ **Daily English Journaling:**
  - Rich text editor with real-time English word counter and reading time estimates.
  - Set and track daily word goals (e.g., 80 words/day) with animated progress bars.
  - **Daily English Sparks (Prompts):** Fresh English reflection prompts every day with quick starter phrases you can insert with one click.
  - **Vocabulary Corner 📚:** Save and review new English words, definitions, and example sentences.
  - **Gratitude Sparkles 💖:** Count 3 daily blessings to nurture a positive, mindful perspective.

- 🎙️ **Voice Recording & Cute Audio Player:**
  - Built-in browser audio recording using the MediaRecorder API.
  - Live animated waveform visualizer reacting to your voice in real time.
  - Streamed playback with HTTP Range support (seeking) and Web Audio API duration discovery.
  - Custom pastel Bubu & Dudu player with duration scrubber and elapsed time indicator.

- 🤖 **AI Grammar & Spelling Review:**
  - Powered by OpenAI (`gpt-4o-mini`).
  - Generates a complete revised edition with side-by-side comparison while keeping your original draft **100% untouched**.
  - Detailed grammar, spelling, vocabulary, and naturalness explanations.

- 🎓 **Personalized AI English Coach:**
  - Deep multi-entry historical analysis tailored to your ongoing writing journey.
  - **Recurring Mistakes Detection:** Identifies repeated patterns (past tense drops, prepositions, articles, literal translations).
  - **Vocabulary Upgrades:** Replaces overused words with natural native collocations and idioms.
  - **Weekly Grammar Mini-Lessons:** Bite-sized rules with key takeaways and pitfalls to avoid.
  - **Today's Writing Challenge 🎯:** Actionable challenge for your next entry with 1-click starter insertion.

- 🛡️ **Military-Grade Security & Privacy:**
  - **AES-256-GCM Database Encryption:** Diary contents and AI reviews are automatically encrypted at rest using user-specific derived keys (HKDF).
  - Zero plain text in the SQLite database file (`dev.db`).
  - **Admin Privacy Protection:** The Admin Dashboard only displays system-level metadata and strictly masks personal diary entries and voice notes from unauthorized inspection.

- 📅 **Interactive Calendar & Habit Tracking:**
  - Monthly calendar showing mood stickers, audio indicators 🎙️, and word counts.
  - Streak tracking (🔥 consecutive days written, personal best records, entries this month).

- 🌸 **Cute & Pastel Aesthetic:**
  - Soft candy rose, honey butter, warm peach, and lavender pastel tones.
  - Rounded, cozy cards (`rounded-3xl`, `rounded-4xl`), bouncy buttons, and celebration confetti 🎉 upon saving.

- ☁️ **Automated Google Drive Backup & Per-User Cloud Sync:**
  - In-process Cron scheduler (`node-cron`) automatically backs up SQLite database + voice note audio files every night at 02:00 AM.
  - Generates portable `.zip` archives containing the complete database snapshot, audio files, and metadata.
  - Per-user Google Drive OAuth integration (`drive.file` scope) for private cloud snapshots.
  - Instant "Backup Now" & "Download Backup (.zip)" button on the web interface.

- ⚡ **Comprehensive Admin Dashboard:**
  - Real-time system health monitoring (RAM, CPU, Uptime, Node/OS, DB size, audio storage stats).
  - SQLite `VACUUM` maintenance and orphan audio cleanup.
  - User and entry management with privacy guardrails.

---

## 🏗️ Monorepo Architecture

```
diary/
├── packages/
│   ├── shared/       # Shared TypeScript types, DTOs, moods, prompts, and coach interfaces
│   ├── backend/      # Node.js + Express + Prisma ORM + SQLite + Multer + AES Crypto
│   │   ├── prisma/   # dev.db (Zero-setup local SQLite database)
│   │   └── uploads/  # Local voice note storage
│   └── frontend/     # React 18 + Vite + Tailwind CSS + Lucide Icons
├── package.json      # Monorepo root scripts (pnpm workspaces)
└── pnpm-workspace.yaml
```

---

## 🚀 Quick Start (Local Development)

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

- **Web Application:** [http://localhost:5173](http://localhost:5173)

---

## 🔑 Default Administrator Account

The system comes with a pre-configured administrator account:
- **Username:** `admin`
- **Password:** `1`

*(You can also register a new personal account or reset passwords directly on the login screen).*

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
   http://localhost:5173/api/backup/google/callback
   ```
4. Set the credentials in `packages/backend/.env`:
   ```env
   GOOGLE_CLIENT_ID="your_client_id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your_client_secret"
   GOOGLE_REDIRECT_URI="http://localhost:5173/api/backup/google/callback"
   ```
*(Even without Google OAuth credentials configured, every user can still export and download their personal `.zip` archive anytime via the "Download My Data (.zip)" button).*

---

## 🐳 Fast Deployment with Docker & Justfile (VPS / Self-Hosted)

The application is bundled into **a single lightweight Docker container** serving the Frontend, Backend API, and SQLite database on port `5173`, with persistent volumes ensuring zero data loss during updates!

### 1. First-time Launch on Server:
```bash
git clone git@github.com:thanhhoang261/diary.git
cd diary
just up
```
*Visit your web app at `http://your-server-ip:5173`!*

### 2. Fastest 1-Command Update:
Run a single command on your server:
```bash
just update
```
This automated command will:
1. Pull the latest code (`git pull`) from GitHub.
2. Rebuild the Docker image with optimized layer caching (~10-20 seconds).
3. Gracefully restart the container while preserving all SQLite data and audio files.
4. Clean up dangling build caches.

### 3. Convenient Justfile Commands:
| Command | Description |
| :--- | :--- |
| `just up` | Build and start the container in background mode |
| `just down` | Stop and remove the container |
| `just update` | **Fastest update**: Pull git -> rebuild image -> restart container |
| `just logs` | View live server and backup scheduler logs |
| `just status` | Check container health and memory consumption (~120MB RAM!) |
| `just backup` | Trigger an immediate database & audio snapshot archive |
| `just shell` | Open a shell terminal inside the container |

---

## 🛠️ Helpful Commands (Local Dev)

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Start both Backend and Frontend in development mode |
| `pnpm build` | Build all packages (`shared`, `backend`, `frontend`) |
| `pnpm db:seed` | Seed initial demo user and past diary entries |
| `pnpm db:studio` | Open Prisma Studio GUI in browser to inspect SQLite data |

---

Made with 💖 for cultivating daily English fluency.
