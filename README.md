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

## 🛠️ Helpful Commands

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Start both Backend and Frontend in development mode |
| `pnpm build` | Build all packages (`shared`, `backend`, `frontend`) |
| `pnpm db:seed` | Seed initial demo user and past diary entries |
| `pnpm db:studio` | Open Prisma Studio GUI in browser to inspect SQLite data |

---

Made with 💖 for cultivating daily English fluency.
