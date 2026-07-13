# 🌌 AniVerse (Bankai-Tv)

AniVerse is a premium, high-performance anime streaming and catalog tracking platform built with a modern React + Vite frontend and a secure Express + Prisma backend. Featuring a visually stunning, glassmorphic dark-theme UI, AniVerse connects local catalog indexing with on-demand API syncing to deliver a seamless streaming experience.

---

## 🚀 Key Features

* **🎥 Advanced Theater Player Layout:** 
  * Responsive 2-column widescreen player layout.
  * Interactive playback settings: Autoplay, Auto-Next, Auto-Skip, and Light/Dim (Lights-Off) mode.
  * Multi-server streaming selections supporting SUB and DUB translations.
  * Vertically aligned episode index cards stretching to match player height.
  * Horizontal, scrollable related anime recommendation cards with hover-scaling (`scale(1.05)`) and rating badges.
* **⚡ On-Demand AniList Syncing:**
  * When a user searches for or visits a missing catalog item, the backend automatically imports complete metadata from the AniList API on-demand.
  * Auto-generates local mock stream nodes and stores them in the Prisma DB for seamless catalog streaming.
* **✨ HD Hero Spotlight Banner Carousel:**
  * Displays high-definition curated highlights.
  * Side-blur fallback background layers for containing non-widescreen banners.
  * Custom catalog index styling (`#1 Spotlight`, `#2 Spotlight`, etc.) with One Piece prioritized in index 0.
* **🔒 Authentication & List Management:**
  * Secured JWT-based login & signup.
  * Custom watchlists to track user request/report activities.

---

## 🛠️ Technology Stack

### Frontend
* **Core:** React 19, TypeScript 6, Vite 8
* **Styling:** Vanilla CSS design system (HSL Tailored Colors, Sleek Dark Mode, glassmorphism, responsive grid layouts).
* **Icons:** Lucide React
* **Routing:** React Router Dom v7
* **API Client:** Axios

### Backend
* **Runtime & Framework:** Node.js, Express, TypeScript (run with `ts-node-dev`)
* **ORM:** Prisma ORM v5
* **Database:** Relational database support
* **Security:** JWT (JSON Web Tokens), Bcrypt.js password hashing
* **External APIs:** AniList GraphQL API integrations

---

## 📦 Directory Structure

```text
AniVerse/
├── backend/            # Express TypeScript API & Prisma Database
│   ├── src/
│   │   ├── controllers/# Route controller logic (Anime catalog, importing, watch-sessions)
│   │   ├── routes/     # Express Router declarations
│   │   └── index.ts    # Entry-point Server
│   └── prisma/         # Prisma Schema, migrations, and seed scripts
└── frontend/           # Vite React TypeScript client
    ├── src/
    │   ├── components/ # HeroSlider, Navbar, layout units
    │   ├── pages/      # Home, Anime Catalog, Watch Page
    │   └── App.tsx     # Root Router configurations
```

---

## ⚙️ Local Development Setup

### Prerequisite Checklist
1. Node.js (v18+)
2. NPM or Yarn

### Step 1: Database Initialization
Navigate to the `backend/` directory, set up your connection string inside a `.env` file, and initialize Prisma:
```bash
cd backend
npm install

# Run database migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Seed initial anime database catalog
npm run prisma:seed
```

### Step 2: Running the Servers
Launch both the backend API and client server in separate terminal windows:

**Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Client runs on http://localhost:5173
```

---

## 📡 Key Endpoints & Controllers
* **Anime catalog details:** `GET /api/anime/:slug` (checks database, calls AniList GraphQL on fallback, imports data, and returns the seeded anime profile).
* **Episode streaming source mappings:** `GET /api/anime/:slug/episodes/:episodeNumber` (verifies playback translation configurations and returns server-embedded video frame links).
* **Search / Catalog lookup:** `GET /api/anime/catalog/search` (supports full-text local index queries + external query importing fallback).
