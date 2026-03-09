# ShelfQuest Feature Integration Phase Timeline

> Sources: `org.shelfquest.app_feedback.pdf` (Testers Community Report) + `edge-extension-ideas.md`
> Generated: 2026-02-15 | Updated: 2026-03-07 | Status: Phase 2 Complete, Phase 1.2 Complete, Phase 3 Pre-Phase Done

---

## Current State Summary

| Feedback Item                        | Status           | Notes                                                  |
|--------------------------------------|------------------|--------------------------------------------------------|
| Dynamic Walkthrough / Onboarding     | DONE             | OnboardingGuide, GamificationOnboarding, Driver.js     |
| Google Sign-In                       | DONE             | OAuth2 + account linking implemented                   |
| Dark Mode                            | DONE             | Full light/dark/system + 6 unlockable gamified themes  |
| User Feedback Mechanism              | DONE             | ContactDialog, ContactPage, in-app feedback forms      |
| Help Center / FAQ                    | DONE             | HelpFAQPage with categorized FAQ + HelpViewer          |
| Performance Monitoring               | PARTIAL          | Sentry + Prometheus metrics; no user-facing perf dash  |
| Accessibility (WCAG)                 | DONE             | Contrast audit, Lighthouse audit, theme migration, a11y tests |
| Play Store Screenshots               | NOT STARTED      | Marketing task, not code                               |
| Additional Social Logins             | NOT STARTED      | Only Google; no Facebook/Apple/Twitter                  |
| Browser Extension                    | DONE + Phase 3   | 2.1-2.4 complete; Phase 3 pre-phase (sidebar + AI rate limit) done |

---

## Phase 1 — Polish & Quick Wins (Weeks 1-3)

**Goal**: Close remaining tester feedback gaps and harden what exists.
**Status**: 🟡 In Progress — Accessibility, Onboarding & Lighthouse complete. Screenshots & Social Login pending.

### 1.1 Play Store & App Store Screenshot Overhaul
- **Source**: Feedback PDF, item 3
- **Scope**: Marketing / design (no code changes)
- **Tasks**:
  - [ ] Create feature-highlight screenshots with captions
  - [ ] Include user testimonials / ratings overlay
  - [ ] A/B test listing with new visuals
- **Effort**: ~3 days (design)

### 1.2 Accessibility Audit & Remediation ✅
- **Source**: Feedback PDF, additional recommendations
- **Scope**: Client2 frontend
- **Completed**: 2026-03-01 | Commit: `543fe9c`, `6db2c50`, `72fb4cd`
- **Tasks**:
  - [x] Fix MD3TextField — `useId()`, `<label htmlFor>`, `aria-invalid`, `aria-describedby`, `role="alert"` on error
  - [x] Fix TextField — same label/ARIA pattern
  - [x] Add skip-to-content link in AppLayout (CSS already existed in accessibility.css)
  - [x] Add `role="alert"` to error messages in Login, SignUpV2, LibraryPageV2
  - [x] NotificationPanel — `role="region"`, `aria-label`, `aria-live="polite"`, `role="status"`
  - [x] NavigationFAB — `aria-expanded`, `aria-haspopup`, `role="menu"`/`role="menuitem"`, fix invalid `rgb(var(...))` CSS
  - [x] Fix MD3Navigation `aria-selected` (invalid on button) → `aria-current="page"`
  - [x] Expand ESLint jsx-a11y to full recommended ruleset (~30 rules)
  - [x] Add vitest-axe automated a11y tests (9 tests: axe-core + label/ARIA assertions)
  - [x] Fix JSX-in-.js files (monitoring.js, crashReporting.js) → `React.createElement`
  - [x] Fix contrast ratios in all 6 themes — WCAG AA pass across 168 color pairs (`scripts/contrast-audit.mjs`)
  - [x] Full Lighthouse audit — /login: Perf 55, A11y 95, BP 96, SEO 100
  - [x] Replace ~550 hardcoded colors (`#24A8E0`, `rgb(var(...))`, `rgba(36,168,224,...)`) with theme-aware CSS vars across 55 files
- **Effort**: ~5 days (estimated) → ~1 day (actual for code tasks)

### 1.3 Additional Social Login Options
- **Source**: Feedback PDF, item 2
- **Scope**: Server2 auth routes + Client2 login UI
- **Tasks**:
  - [ ] Add Apple Sign-In (critical for iOS App Store compliance)
  - [ ] Evaluate Facebook / X (Twitter) sign-in ROI
  - [ ] Extend account-linking logic to support multiple providers
- **Effort**: ~4 days (Apple), ~2 days per additional provider

### 1.4 Onboarding Refinements ✅
- **Source**: Feedback PDF, item 1 (already built, polish pass)
- **Scope**: Client2
- **Completed**: 2026-03-01 | Commit: `543fe9c`
- **Tasks**:
  - [x] Skip/dismiss persistence (already existed via localStorage)
  - [x] Track GamificationOnboarding analytics — `shown`, `step_viewed`, `completed`, `skipped`
  - [x] Track OnboardingSpotlight analytics — `shown`, `action_clicked`, `dismissed`
  - [x] Create `useFeatureTooltip` hook — reusable driver.js one-time tooltips with localStorage + monitoring
- **Effort**: ~2 days (estimated) → ~0.5 day (actual)

---

## Phase 2 — Edge Extension Foundation (Weeks 4-8)

**Goal**: Ship the first ShelfQuest Edge/Chrome extension with core reading features.
**Status**: Complete — Extension v1.0.0 ready for Chrome Web Store submission.

### 2.1 Extension Scaffold & Infrastructure ✅
- **Source**: edge-extension-ideas.md (all items depend on this)
- **Scope**: New `extension/` directory in monorepo
- **Completed**: 2026-03-03
- **Tasks**:
  - [x] Create Manifest V3 extension scaffold (React + Vite + CRXJS)
  - [x] Config layer: storage.js, environment.js, api.js (axios, Bearer-only auth)
  - [x] Implement auth bridge (chrome.storage.local tokens, 14-min alarm refresh)
  - [x] Build popup shell (login/authenticated states) and options page
  - [x] Background service worker with context menu, token refresh alarm, message handler
  - [x] CI/CD: `extension-ci` job in ci.yml, quality-gates updated
  - [x] Tests: 9 passing (popup render + storage wrapper), vitest + jsdom
- **Effort**: ~8 days (estimated) → ~1 day (actual)
- **Dependencies**: None

### 2.2 "Send to ShelfQuest" Web Clipper ✅
- **Source**: edge-extension-ideas.md, AI & Reading Helpers
- **Scope**: Extension (context menu + content script + Express route + client page)
- **Completed**: 2026-03-05
- **Tasks**:
  - [x] Context menu action: "Save to ShelfQuest"
  - [x] Content script captures selected text, page title, URL, OG metadata, favicon
  - [x] Turndown converts HTML selections to markdown
  - [x] `clippings` table with RLS, indexes, trigger (012_clippings.sql)
  - [x] Express CRUD route at `/api/clippings` (GET/POST/PATCH/DELETE)
  - [x] Popup status banner (pending/saved/error/unauthenticated)
  - [x] Client `/clippings` page with card grid, search, stats, edit modal
  - [x] On-demand content script injection via `chrome.scripting.executeScript`
  - [x] Tests: 16 extension (7 clipper + 9 existing), 4 server API
- **Effort**: ~6 days (estimated) → ~2 days (actual)
- **Dependencies**: 2.1

### 2.3 Citation & Notes Collector ✅
- **Source**: edge-extension-ideas.md, AI & Reading Helpers
- **Scope**: Extension content script + popup + server + client + DB migration
- **Completed**: 2026-03-06
- **Tasks**:
  - [x] Context menu "Save as Note" — captures selected text + page metadata
  - [x] QuickNote popup panel — textarea + tags + Ctrl+Enter shortcut
  - [x] Content script `CAPTURE_FOR_NOTE` message type with turndown markdown
  - [x] DB migration: `source_url`, `source_title`, `source_favicon` on notes, drop NOT NULL on `book_id`
  - [x] Server accepts source fields in POST/PUT, omits book_id when null
  - [x] Client shows source citation (favicon + hostname link) on web-captured notes
  - [x] Parent context menu "ShelfQuest" with children "Save as Clipping" / "Save as Note"
  - [ ] LLM summary bullets and study questions (deferred to Phase 3)
- **Effort**: ~7 days (estimated) → ~1 day (actual, excluding LLM features)
- **Dependencies**: 2.1, 2.2

### 2.4 Chrome Web Store Submission ✅
- **Scope**: Store listing, screenshots, privacy policy, ZIP packaging
- **Completed**: 2026-03-06
- **Tasks**:
  - [x] Extension version bumped to 1.0.0
  - [x] Store listing document (`extension/STORE_LISTING.md`)
  - [x] 5 screenshots resized to 1280×800 (popup, context menu, clippings, quicknote, notes)
  - [x] Permission justifications for store review
  - [x] Privacy policy live at shelfquest.org/legal/privacy-policy
  - [x] ZIP built and ready for upload (115 KB)

---

## Phase 3 — Smart Reading & AI Features (Weeks 9-14)

**Goal**: Leverage AI to differentiate the extension and deepen engagement.
**Status**: 🟡 In Progress — Pre-phase infrastructure + Task Capture complete. Smart Queue in progress.

### 3.0 Pre-Phase Infrastructure ✅
- **Scope**: Server rate limiting + Extension sidebar scaffold + messaging
- **Completed**: 2026-03-07 | Commit: `f2712da`
- **Tasks**:
  - [x] AI rate limiter (50 req/user/hour) in `rateLimitConfig.js`, mounted on `/ai` routes
  - [x] Chrome Side Panel scaffold (`sidebar/index.html`, `Sidebar.jsx`, `sidebar.css`)
  - [x] `sidePanel` permission + `side_panel` config in extension manifest
  - [x] `GET_READING_QUEUE` message handler in background worker
  - [x] "Open Reading Queue" context menu item with `chrome.sidePanel.open()`
  - [x] `SIDEBAR_STATE` and `READING_QUEUE` storage keys

### 3.1 Smart Reading Queue Overlay
- **Source**: edge-extension-ideas.md, AI & Reading Helpers
- **Scope**: Extension sidebar + Supabase queries
- **Tasks**:
  - [ ] AI-prioritized "next read" suggestions based on current tab context
  - [ ] Topic extraction from active page via LLM
  - [ ] Quick-open in mini reader overlay (content script)
  - [ ] Browsing context → reading recommendations pipeline
- **Effort**: ~8 days
- **Dependencies**: 3.0, ai-service

### 3.2 AI-Powered Ebook Translator / Explainer
- **Source**: edge-extension-ideas.md, AI & Reading Helpers
- **Scope**: Extension content script + ai-service
- **Tasks**:
  - Detect in-browser PDF/ePub viewing
  - Floating action button for translate/simplify selection
  - LLM passage translation and simplification
  - Sync annotated notes back to ShelfQuest
  - Language selection UI in popup
- **Effort**: ~10 days
- **Dependencies**: 2.1, ai-service, existing reader infrastructure

### 3.3 Task-from-Page Quick Capture ✅
- **Source**: edge-extension-ideas.md, Productivity Helpers
- **Scope**: Extension context menu + popup + server + DB + client
- **Completed**: 2026-03-08 | Commit: `7075f67`
- **Tasks**:
  - [x] Context menu: "Create Task from Selection"
  - [x] AI auto-tags and categorizes via `POST /ai/auto-tag-task` (GPT-3.5-turbo + keyword fallback)
  - [x] Push to ShelfQuest reading goals via `POST /api/gamification/goals/from-task`
  - [x] DB migration 014: `source_url`, `source_title`, `source_favicon`, `ai_category`, `ai_tags` on `user_goals`
  - [x] Task status banner in popup (pending/saved/error/unauthenticated)
  - [x] GoalSystem.jsx: source citation link + AI category badge on web-captured goals
- **Effort**: ~5 days (estimated) → ~0.5 day (actual)

---

## Phase 4 — Productivity & Workflow Integration (Weeks 15-20)

**Goal**: Extend the extension into daily workflows beyond reading.

### 4.1 Context-Aware Tab Pairing
- **Source**: edge-extension-ideas.md, Productivity Helpers
- **Scope**: Extension popup + Supabase storage
- **Tasks**:
  - Popup groups current tab with ShelfQuest reader or GitHub tab
  - Quick-switch buttons between paired tabs
  - Store/recall tab pairs in Supabase
  - Keyboard shortcuts for pair switching
- **Effort**: ~5 days

### 4.2 Meeting Prep Assistant
- **Source**: edge-extension-ideas.md, Productivity Helpers
- **Scope**: Extension sidebar + Supabase + ai-service
- **Tasks**:
  - Detect calendar/video-call domains (Google Meet, Zoom, Teams)
  - Sidebar fetches relevant ShelfQuest notes and recent activity
  - AI suggests talking points and questions from context
  - One-click copy of prep notes
- **Effort**: ~7 days

### 4.3 Adaptive Sidebar for Active Workflows
- **Source**: edge-extension-ideas.md, AI-Browser Futures
- **Scope**: Extension sidebar architecture
- **Tasks**:
  - Domain/tab signal detection system
  - Swap sidebar modules based on context:
    - Reader mode for doc/article sites
    - Notes mode for research sites
    - Dev tools mode for GitHub (Phase 5)
  - User-configurable domain → module mappings
  - Persist preferences in Supabase
- **Effort**: ~8 days
- **Dependencies**: 4.1, 4.2 (integrates previous sidebar work)

---

## Phase 5 — Developer Tools & Agent Platform (Weeks 21-26)

**Goal**: Build power-user and developer-facing features; establish agent framework.

### 5.1 Personal Agent Launcher
- **Source**: edge-extension-ideas.md, AI-Browser Futures
- **Scope**: Extension popup + Supabase + ai-service
- **Tasks**:
  - Popup to trigger custom agents (reading summarizer, PR reviewer, plan generator)
  - Per-domain agent presets
  - Store agent runs/outputs in Supabase for history
  - Agent output viewer in sidebar
  - Rate limiting and AI quota management
- **Effort**: ~10 days

### 5.2 Supabase Query Profiler (DevTools Panel)
- **Source**: edge-extension-ideas.md, Developer Helpers
- **Scope**: Extension DevTools panel
- **Tasks**:
  - DevTools panel logging network calls to Supabase domains
  - Annotate latency and row counts per query
  - One-click explain/optimize suggestions via OpenAI
  - Query history and performance trends
- **Effort**: ~8 days

### 5.3 AI-Powered Dev Context Side Panel
- **Source**: edge-extension-ideas.md, Developer Helpers
- **Scope**: Extension sidebar (GitHub domain)
- **Tasks**:
  - Sidebar reads active GitHub PR diff
  - Summarizes TODOs, code smells, missing tests via LLM
  - Quick actions to insert review comments via GitHub API
  - Configurable review rules/checklists
- **Effort**: ~10 days

### 5.4 Env/Secret Sniffer for Local Dev
- **Source**: edge-extension-ideas.md, Developer Helpers
- **Scope**: Extension context menu + Supabase
- **Tasks**:
  - Context menu extracts env var names from visible code/docs
  - Maps to local template (e.g., `env.template.js`)
  - Store findings in Supabase for cross-project reconciliation
  - Warning indicators for exposed secrets
- **Effort**: ~5 days

---

## Monetization Touchpoints (Cross-Phase)

| Phase | Monetization Opportunity                                           |
|-------|--------------------------------------------------------------------|
| 2-3   | **Premium AI Quota** — Free tier with N clips/summaries per month  |
| 3     | **Pro Reading Features** — Unlimited translations, smart queue     |
| 4     | **Team Sharing** — Shared tab pairs, meeting prep for teams        |
| 5     | **Developer Pro** — Query profiler, PR reviewer, agent platform    |

---

## Risk & Dependency Map

```
Phase 1 (mostly done — screenshots & social login pending)
  |
Phase 2.1 ✅ ──► 2.2 ✅ ──► 2.3 ✅ ──► 2.4 ✅ (Chrome Web Store)
  |
Phase 3.0 ✅ (AI rate limiter + sidebar scaffold)
  |
Phase 3.3 ✅, 3.1 🟡, 3.2 (depend on 3.0 + ai-service) ◄── NEXT
  |
Phase 4.1, 4.2 ──► Phase 4.3 (integrates all sidebar work)
  |
Phase 5.1, 5.2, 5.3, 5.4 (depend on 2.1; can partially parallelize with Phase 4)
```

**Key Risks**:
- **Manifest V3 limitations**: Background service worker restrictions may affect real-time features
- **Cross-browser compatibility**: Edge vs Chrome vs Firefox manifest differences
- **AI cost scaling**: LLM calls in Phases 3-5 need quota/rate limiting from day one
- **Auth session sharing**: Extension ↔ web app token bridging needs careful security review

---

## Estimated Timeline Summary

| Phase | Focus                            | Duration  | Cumulative |
|-------|----------------------------------|-----------|------------|
| 1     | Polish & Quick Wins              | 3 weeks   | Week 3     |
| 2     | Extension Foundation             | 5 weeks   | Week 8     |
| 3     | Smart Reading & AI               | 6 weeks   | Week 14    |
| 4     | Productivity & Workflow          | 6 weeks   | Week 20    |
| 5     | Developer Tools & Agent Platform | 6 weeks   | Week 26    |

**Total estimated timeline: ~26 weeks (6.5 months) for full feature set.**

> Phases 4 and 5 can be partially parallelized if team capacity allows, reducing total to ~23 weeks.
