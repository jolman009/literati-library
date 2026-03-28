# ShelfQuest Repository Architecture

## Overview

ShelfQuest is a **monorepo** managed with **pnpm workspaces**. All services live in a single `literati-library/` repository, enabling coordinated changes, shared tooling, and unified CI/CD.

## Directory Structure

```
literati-library/
├── client2/          # React 19 web app (PWA)
├── server2/          # Express.js API backend
├── extension/        # Chrome browser extension (Manifest v3)
├── android/          # Native Android app (TWA + Capacitor)
├── database/         # Database schemas and migrations
├── docs/             # Documentation (organized by topic)
├── monitoring/       # Prometheus, Grafana, alerting configs
├── scripts/          # Utility and migration scripts
├── config/           # Shared configuration
├── security-audit/   # Security scanning and audit reports
├── app-store-assets/ # Store listing screenshots and metadata
├── legal/            # Legal documents
├── package.json      # Root monorepo config (pnpm workspaces)
├── pnpm-workspace.yaml
├── docker-compose.yml
├── docker-compose.production.yml
└── render.yaml       # Render deployment config
```

## Services

### Client (`client2/`)
- **Stack**: React 19, React Router v7, Vite 7, Tailwind CSS, Material Design 3
- **Features**: EPUB/PDF reader with text selection, TTS, AI summaries, offline PWA, gamification
- **Deploy**: Vercel (auto-deploy from main)
- **Dev**: `pnpm run dev` (port 5173)

### Server (`server2/`)
- **Stack**: Express.js, Supabase (PostgreSQL), JWT auth, OpenAI (gpt-4o-mini)
- **Features**: REST API, book storage, notes, reading sessions, AI service, push notifications
- **Deploy**: Render / Railway (Docker)
- **Dev**: `pnpm run dev` (port 5000)

### Browser Extension (`extension/`)
- **Stack**: React 19, Vite, CRXJS plugin, Manifest v3
- **Features**: Save web content to library, markdown conversion (Turndown)
- **Deploy**: Chrome Web Store

### Android App (`android/`)
- **Stack**: Android (Java/Kotlin), Material Design, Gradle, Capacitor
- **Features**: TWA wrapping the PWA, native Android integration
- **Deploy**: Google Play Store

### Database (`database/`)
- **Tables**: users, books, notes, reading_sessions, achievements, goals
- **Provider**: Supabase (hosted PostgreSQL with Row Level Security)
- **Migrations**: SQL files in `database/consolidated/`

## Architecture Diagram

```
┌──────────────────────────────────────────────────────┐
│                    literati-library (monorepo)        │
│                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  client2     │  │  server2    │  │  extension   │  │
│  │  React PWA   │──│  Express API│  │  Chrome Ext  │  │
│  │  → Vercel    │  │  → Render   │  │  → Web Store │  │
│  └─────────────┘  └──────┬──────┘  └─────────────┘  │
│         │                │                           │
│  ┌──────┴──────┐  ┌──────┴──────┐                    │
│  │  android     │  │  Supabase   │                    │
│  │  TWA App     │  │  PostgreSQL │                    │
│  │  → Play Store│  │  + Storage  │                    │
│  └─────────────┘  └──────┬──────┘                    │
│                          │                           │
│                   ┌──────┴──────┐                    │
│                   │  OpenAI     │                    │
│                   │  gpt-4o-mini│                    │
│                   └─────────────┘                    │
└──────────────────────────────────────────────────────┘
```

## Development

### Prerequisites
- Node.js 20.16.0+
- pnpm 8.15.6+ (enforced — npm/yarn will not work)

### Commands (from repo root)
```bash
pnpm install              # Install all workspace dependencies
pnpm run dev              # Start client + server concurrently
pnpm run build            # Build client + server for production
pnpm run test:all         # Run all tests across services
pnpm run lint             # Lint all workspaces
```

### Deployment
| Service    | Platform     | Trigger            |
|------------|-------------|-------------------|
| Client     | Vercel       | Push to main       |
| Server     | Render       | Push to main       |
| Extension  | Chrome Store | Manual upload      |
| Android    | Play Store   | Manual AAB upload  |

## Key Design Decisions

- **Monorepo over multi-repo**: Coordinated changes across client/server, shared linting, single PR for cross-cutting features
- **pnpm workspaces**: Fast installs, strict dependency isolation, disk-efficient
- **Supabase**: Managed PostgreSQL with built-in auth, storage, and RLS — no separate DB infra to maintain
- **OpenAI on server**: AI calls are server-side only (gated behind auth + subscription), not exposed to client

---

*Last updated: March 2026*
