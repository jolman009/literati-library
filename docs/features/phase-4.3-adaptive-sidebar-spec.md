# Phase 4.3 — Adaptive Sidebar for Active Workflows

> **Status**: Implementation Spec (Draft)
> **Dependencies**: Phase 3.0 (sidebar scaffold), 3.1 (smart queue), 4.1 (tab pairing), 4.2 (meeting prep)
> **Estimated effort**: ~8 days
> **Last updated**: 2026-03-30

---

## 1. Overview

The Adaptive Sidebar transforms the current single-purpose Reading Queue sidebar into a context-aware assistant that automatically swaps its UI module based on the active browser tab. When you're on a news article, it shows reading tools. When you're on Google Scholar, it shows note capture. When you're on Google Meet, it shows meeting prep. When you're on GitHub, it shows dev context.

The sidebar becomes the single surface through which all ShelfQuest extension features are accessed — unified, contextual, and intelligent.

---

## 2. Current State (What Exists)

### Sidebar Infrastructure (Phase 3.0–3.1)
- **Entry point**: `extension/src/sidebar/index.html` → `main.jsx` → `Sidebar.jsx`
- **Manifest**: `"side_panel": { "default_path": "src/sidebar/index.html" }`
- **Permissions**: `sidePanel`, `activeTab`, `storage`, `scripting`
- **Tab monitoring**: `chrome.tabs.onActivated` listener with 500ms debounce
- **Tab context**: `chrome.tabs.query({ active: true, currentWindow: true })` → `{ url, title, favIconUrl, tabId }`
- **Messaging**: Sidebar sends `GET_READING_QUEUE` to background worker, receives `{ suggested, recent, topics }`
- **Storage**: `READING_QUEUE` and `SIDEBAR_STATE` keys already defined in `storage.js`

### Content Script (Phase 2.2–2.3)
- **Page capture**: `clipper.js` → `capturePageData()` returns URL, title, description, OG tags, favicon, selection, tags
- **Message types**: `CAPTURE_PAGE_DATA`, `CAPTURE_FOR_NOTE`, `CAPTURE_FOR_TASK`, `CAPTURE_PAGE_CONTEXT`
- **Injection**: `ensureContentScript(tabId, messageType)` in background worker

### Current Limitations
- Sidebar always shows Reading Queue — no module switching
- No domain classification — all tabs treated identically
- No user preferences for sidebar behavior
- Smart queue runs on every tab switch (including `chrome://` pages)
- `SIDEBAR_STATE` storage key is defined but unused

---

## 3. Architecture

### 3.1 Module System

Each sidebar module is a self-contained React component with a standard interface:

```
extension/src/sidebar/
  ├── index.html              (existing)
  ├── main.jsx                (existing)
  ├── Sidebar.jsx             (refactored → shell + module router)
  ├── sidebar.css             (existing → shared styles)
  ├── modules/
  │   ├── ModuleRouter.jsx    (NEW — picks module based on context)
  │   ├── ReadingQueue.jsx    (EXTRACTED — from current Sidebar.jsx)
  │   ├── NotesCapture.jsx    (NEW — quick notes + citations for research sites)
  │   ├── MeetingPrep.jsx     (NEW — Phase 4.2 integration)
  │   ├── DevContext.jsx      (NEW — Phase 5.3 placeholder)
  │   └── DefaultModule.jsx   (NEW — fallback for unclassified domains)
  └── hooks/
      ├── useTabContext.js    (NEW — shared tab monitoring + domain detection)
      └── useModuleConfig.js  (NEW — user preference CRUD)
```

### 3.2 Module Interface Contract

Every module receives the same props and follows the same lifecycle:

```jsx
// Each module component signature
const ReadingQueue = ({ tabContext, user, onNavigate }) => { ... }

// tabContext shape (from useTabContext hook)
{
  url: "https://arxiv.org/abs/2401.12345",
  domain: "arxiv.org",            // extracted hostname
  title: "Attention Is All You Need",
  favIconUrl: "https://arxiv.org/favicon.ico",
  tabId: 42,
  classification: "research",     // from domain classifier
  metadata: { ... }               // page OG/meta data (lazy-loaded)
}
```

### 3.3 Domain Classification

A pure-function classifier maps domains to module types. No AI needed — pattern matching is sufficient and instant.

```
Domain Classifier Pipeline:

  tab.url
    ↓
  Extract hostname (new URL(url).hostname)
    ↓
  Check user overrides (chrome.storage → SIDEBAR_MODULE_OVERRIDES)
    ↓  (if no override)
  Check built-in domain rules (domainRules.js)
    ↓  (if no match)
  Fallback: "default"
```

#### Built-in Domain Rules

| Classification | Domains | Module |
|---|---|---|
| `reading` | medium.com, substack.com, dev.to, nytimes.com, theguardian.com, longform.org, aeon.co, nautil.us, news.ycombinator.com, *.wordpress.com | **ReadingQueue** |
| `research` | scholar.google.com, arxiv.org, jstor.org, pubmed.ncbi.nlm.nih.gov, semanticscholar.org, researchgate.net, academia.edu, sciencedirect.com, springer.com, libgen.*, gutenberg.org, openlibrary.org | **NotesCapture** |
| `video-call` | meet.google.com, zoom.us, teams.microsoft.com, teams.live.com | **MeetingPrep** |
| `dev` | github.com, gitlab.com, bitbucket.org | **DevContext** |
| `bookstore` | amazon.com/*/dp/*, goodreads.com, bookshop.org, librarything.com | **ReadingQueue** (book-focused variant) |
| `reference` | wikipedia.org, britannica.com, stackexchange.com, stackoverflow.com | **NotesCapture** |
| `system` | chrome://, chrome-extension://, about:, edge://, moz-extension:// | **(suppress — don't refresh)** |
| `default` | everything else | **DefaultModule** |

#### Rule Matching Logic

```javascript
// domainRules.js — pure function, no side effects
const rules = [
  // System pages — suppress sidebar refresh entirely
  { pattern: /^(chrome|chrome-extension|about|edge|moz-extension):/, classification: 'system' },

  // Exact domain matches
  { domain: 'meet.google.com', classification: 'video-call' },
  { domain: 'zoom.us', classification: 'video-call' },
  { domain: 'teams.microsoft.com', classification: 'video-call' },

  // Domain suffix matches
  { suffix: 'medium.com', classification: 'reading' },
  { suffix: 'substack.com', classification: 'reading' },
  { suffix: 'github.com', classification: 'dev' },

  // Path-aware matches (e.g., Amazon book pages vs Amazon homepage)
  { domain: 'amazon.com', pathPattern: /\/dp\/|\/gp\/product\//, classification: 'bookstore' },
  { domain: 'amazon.com', classification: 'default' }, // non-book Amazon pages

  // Wildcard suffix matches
  { suffix: 'wordpress.com', classification: 'reading' },
];

export function classifyDomain(url) {
  // 1. Parse URL
  // 2. Walk rules in order, return first match
  // 3. Return 'default' if no match
}
```

### 3.4 Data Flow

```
User switches browser tab
         ↓
useTabContext hook fires (chrome.tabs.onActivated, 500ms debounce)
         ↓
chrome.tabs.query() → raw tab info
         ↓
classifyDomain(tab.url) → classification string
         ↓
Check user overrides in storage (SIDEBAR_MODULE_OVERRIDES)
         ↓
Build tabContext object { url, domain, title, favIconUrl, tabId, classification }
         ↓
ModuleRouter receives tabContext
         ↓
Skip refresh if classification === 'system'
         ↓
ModuleRouter renders the matching module component:
  'reading' | 'bookstore' → <ReadingQueue />
  'research' | 'reference' → <NotesCapture />
  'video-call' → <MeetingPrep />
  'dev' → <DevContext />
  'default' → <DefaultModule />
         ↓
Module fetches its own data (each module owns its API calls)
         ↓
Module renders contextual UI
```

### 3.5 State Architecture

```
chrome.storage.local
  ├── SIDEBAR_STATE: {
  │     activeModule: 'reading',        // current module ID
  │     lastClassification: 'research', // for comparison
  │     lastTabId: 42,
  │     lastRefresh: 1711800000000      // timestamp
  │   }
  ├── SIDEBAR_MODULE_OVERRIDES: {
  │     'notion.so': 'research',        // user override: always show NotesCapture on Notion
  │     'reddit.com': 'reading',        // user override: treat Reddit as reading
  │   }
  ├── READING_QUEUE: { ... }            // existing — cached by ReadingQueue module
  └── NOTES_DRAFT: { ... }             // NEW — unsaved note content in NotesCapture
```

---

## 4. Module Specifications

### 4.1 ReadingQueue (existing → extracted)

**When shown**: `reading`, `bookstore` domains, or user override

**Behavior**: Identical to current Sidebar.jsx — AI-powered book suggestions based on page context, topic pills, suggested + recent sections.

**Changes from current**:
- Extract queue logic from Sidebar.jsx into `modules/ReadingQueue.jsx`
- Receive `tabContext` as prop instead of managing tab detection internally
- On `bookstore` classification, add a "Add to Library" quick-action if the page is a book product page

**Data**: `GET_READING_QUEUE` message to background (existing flow)

### 4.2 NotesCapture (new)

**When shown**: `research`, `reference` domains

**Behavior**: Optimized for capturing information from research and reference sites.

**UI Layout**:
```
┌──────────────────────────┐
│ 📝 Notes — arxiv.org     │  ← header with domain
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │ Quick Note           │ │  ← textarea, auto-populated with selection
│ │                      │ │
│ │                      │ │
│ └──────────────────────┘ │
│ [Tags: ___________] [+]  │  ← tag input
│                          │
│ ☑ Include source citation │  ← toggle (default: on)
│                          │
│ [Save Note]  [Save as    │  ← primary actions
│              Clipping]   │
├──────────────────────────┤
│ Recent notes from this   │
│ domain:                  │
│ ┌──────────────────────┐ │
│ │ "Transformer arch…"  │ │  ← existing notes matching this domain
│ │ arxiv.org · 2 hrs    │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ "Self-attention…"    │ │
│ │ arxiv.org · yesterday│ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

**Features**:
- Auto-captures selected text when sidebar opens (via `CAPTURE_PAGE_DATA`)
- Shows existing notes from the same domain (new API: `GET /notes?source_domain=arxiv.org`)
- One-click "Save Note" with automatic source citation (url, title, favicon)
- One-click "Save as Clipping" for full-page saves
- Unsaved draft persisted to `NOTES_DRAFT` storage key
- Tag input with autocomplete from existing tags

**Data flow**:
- Selection capture: `CAPTURE_PAGE_DATA` → content script
- Save: `SAVE_QUICK_NOTE` → background worker → `POST /notes`
- Domain notes: New `GET_DOMAIN_NOTES` message → background → `GET /notes?source_domain=...`

**New background handler needed**:
```javascript
case 'GET_DOMAIN_NOTES':
  const domain = new URL(payload.url).hostname;
  const { data } = await API.get(`/notes?source_domain=${domain}&limit=10`);
  sendResponse({ success: true, data });
```

**New server endpoint needed**:
- `GET /notes?source_domain=arxiv.org` — filter notes by `source_url` domain match
- Uses existing `notes.js` route, add query param filter

### 4.3 MeetingPrep (new — Phase 4.2 integration)

**When shown**: `video-call` domains (Google Meet, Zoom, Teams)

**Behavior**: Surfaces relevant ShelfQuest content for the meeting context.

**UI Layout**:
```
┌──────────────────────────┐
│ 📋 Meeting Prep          │
│ meet.google.com          │
├──────────────────────────┤
│ Meeting: "Book Club Wed" │  ← extracted from page title
│                          │
│ 📚 Related Books         │
│ ┌──────────────────────┐ │
│ │ Currently Reading (2) │ │  ← books with recent activity
│ │ • Handbook of NT…     │ │
│ │ • Deep Work           │ │
│ └──────────────────────┘ │
│                          │
│ 📝 Recent Notes          │
│ ┌──────────────────────┐ │
│ │ 3 notes from today   │ │  ← recent notes (last 24h)
│ │ 5 notes this week    │ │
│ └──────────────────────┘ │
│                          │
│ 💡 Talking Points        │
│ ┌──────────────────────┐ │
│ │ • Ch. 3 themes on…   │ │  ← AI-generated from recent notes
│ │ • Compare with…      │ │
│ │ [Copy All]            │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

**Features**:
- Extract meeting name from page title (Google Meet: "Meeting Name - Google Meet")
- Show currently-reading books with recent activity
- Show recent notes (last 24-48h)
- AI-generated talking points from recent notes (optional, uses `/ai/mentor-discuss` with a "meeting prep" system prompt)
- One-click "Copy All" for talking points
- Falls back gracefully if no relevant content found

**Data flow**:
- Books: `GET /api/books?status=reading`
- Notes: `GET /notes?since=48h&limit=10`
- AI talking points: `POST /ai/mentor-discuss` with `{ prompt: "Generate 3-5 talking points from these notes: ...", mode: "meeting-prep" }`

### 4.4 DevContext (placeholder — Phase 5.3)

**When shown**: `dev` domains (GitHub, GitLab, Bitbucket)

**Behavior (v1 — minimal placeholder)**:
- Show a "Developer Tools coming soon" message
- Link to open ShelfQuest web app
- Show any clippings/notes saved from the current repo domain

**Behavior (v2 — Phase 5.3 full implementation)**:
- Read active GitHub PR diff via GitHub API
- Summarize TODOs, code smells, missing tests via LLM
- Quick-action review comments

### 4.5 DefaultModule (new)

**When shown**: Any domain not matching other classifications

**Behavior**: A general-purpose ShelfQuest quick-access panel.

**UI Layout**:
```
┌──────────────────────────┐
│ 📖 ShelfQuest            │
│ example.com              │
├──────────────────────────┤
│ Quick Actions            │
│ [📋 Save Clipping]       │
│ [📝 Quick Note]          │
│ [✅ Create Task]          │
│                          │
│ Currently Reading        │
│ ┌──────────────────────┐ │
│ │ • Handbook of NT…    │ │
│ │   62% · 2h today     │ │
│ └──────────────────────┘ │
│                          │
│ Today's Stats            │
│ 🔥 Streak: 5 days       │
│ 📖 Read: 45 min today   │
│ ⭐ Points: 9,772         │
└──────────────────────────┘
```

**Features**:
- Quick-action buttons for clipping, notes, task creation (reuses existing message types)
- Currently-reading summary (from `/api/books?status=reading`)
- Daily stats from gamification
- Compact, non-intrusive — doesn't try to be contextually relevant

---

## 5. User Override System

Users can override domain → module mappings via a settings panel in the sidebar.

### 5.1 Override UI

Accessed via a gear icon in the sidebar header:

```
┌──────────────────────────┐
│ ⚙ Sidebar Settings       │
├──────────────────────────┤
│ Current page: notion.so  │
│ Auto-detected: default   │
│                          │
│ Override for this domain: │
│ [▼ Notes Capture      ]  │  ← dropdown: Auto / Reading / Notes / Meeting / Dev / Default
│                          │
│ ─────────────────────── │
│ Custom Rules:            │
│ notion.so → Notes     [✕]│
│ reddit.com → Reading  [✕]│
│                          │
│ [Reset All Overrides]    │
└──────────────────────────┘
```

### 5.2 Storage

```javascript
// In chrome.storage.local
SIDEBAR_MODULE_OVERRIDES: {
  'notion.so': 'research',      // user chose "Notes Capture" for Notion
  'reddit.com': 'reading',      // user chose "Reading Queue" for Reddit
}
```

### 5.3 Override Sync (Future)

Overrides are local-only initially. In a future iteration, sync to Supabase via:
- `POST /api/user/preferences` with `{ sidebar_overrides: {...} }`
- Loaded on login, merged with local overrides

---

## 6. Sidebar Shell Refactor

### 6.1 Current Sidebar.jsx (257 lines)

Currently contains everything: auth check, tab monitoring, queue fetching, UI rendering. Needs to be split into:

1. **Sidebar.jsx** (shell) — auth gate, header, module router, settings panel
2. **useTabContext.js** (hook) — tab monitoring, domain classification, debouncing
3. **ModuleRouter.jsx** — maps classification → module component
4. **Individual modules** — each owns its own data fetching and UI

### 6.2 Refactored Sidebar.jsx (shell)

```jsx
// Simplified shell — delegates everything to modules
const Sidebar = () => {
  const { user, loading: authLoading } = useAuth();
  const tabContext = useTabContext();           // tab monitoring + classification
  const [showSettings, setShowSettings] = useState(false);

  if (authLoading) return <LoadingSpinner />;
  if (!user) return <LoginForm />;

  return (
    <div className="sidebar">
      <SidebarHeader
        tabContext={tabContext}
        onSettingsClick={() => setShowSettings(!showSettings)}
      />
      {showSettings ? (
        <ModuleSettings tabContext={tabContext} />
      ) : (
        <ModuleRouter tabContext={tabContext} user={user} />
      )}
      <SidebarFooter />
    </div>
  );
};
```

### 6.3 ModuleRouter.jsx

```jsx
const MODULE_MAP = {
  'reading':    ReadingQueue,
  'bookstore':  ReadingQueue,
  'research':   NotesCapture,
  'reference':  NotesCapture,
  'video-call': MeetingPrep,
  'dev':        DevContext,
  'default':    DefaultModule,
  'system':     null,  // render nothing, don't refresh
};

const ModuleRouter = ({ tabContext, user }) => {
  const Module = MODULE_MAP[tabContext.classification] || DefaultModule;

  if (!Module) return null; // system pages

  return <Module tabContext={tabContext} user={user} />;
};
```

---

## 7. Performance Considerations

### 7.1 Avoid Unnecessary Refreshes

```javascript
// In useTabContext hook
const shouldRefresh = (prevContext, newContext) => {
  // Don't refresh if same tab
  if (prevContext.tabId === newContext.tabId) return false;
  // Don't refresh for system pages
  if (newContext.classification === 'system') return false;
  // Don't refresh if same domain + same module
  if (prevContext.domain === newContext.domain) return false;
  return true;
};
```

### 7.2 Module-Level Caching

Each module manages its own cache:

| Module | Cache Key | TTL | Invalidation |
|---|---|---|---|
| ReadingQueue | `READING_QUEUE` | 5 min | Tab domain change |
| NotesCapture | `DOMAIN_NOTES_{domain}` | 2 min | After saving a note |
| MeetingPrep | `MEETING_PREP_{domain}` | 10 min | Manual refresh |
| DefaultModule | `QUICK_STATS` | 5 min | None (background refresh) |

### 7.3 Lazy Loading

Modules not needed on initial render can be lazy-loaded:

```jsx
const MeetingPrep = React.lazy(() => import('./modules/MeetingPrep'));
const DevContext = React.lazy(() => import('./modules/DevContext'));
```

Note: Static imports preferred for ReadingQueue and DefaultModule (most common). Use dynamic `import()` only in sidebar context (not background worker) — sidebar has full DOM access, so Vite's `__vitePreload` helper works fine here.

---

## 8. Server-Side Changes

### 8.1 New Endpoint: Filter Notes by Source Domain

```javascript
// In server2/src/routes/notes.js — add query param to existing GET /notes
// GET /notes?source_domain=arxiv.org&limit=10

if (req.query.source_domain) {
  query = query.ilike('source_url', `%${req.query.source_domain}%`);
}
```

### 8.2 New Endpoint: Meeting Prep Talking Points (Phase 4.2)

```javascript
// In server2/src/routes/ai.js
// POST /ai/meeting-prep
// Body: { notes: [...], books: [...] }
// Returns: { talkingPoints: ["...", "..."] }
```

### 8.3 New Endpoint: Quick Stats (for DefaultModule)

```javascript
// In server2/src/routes/gamification.js (or existing route)
// GET /api/gamification/quick-stats
// Returns: { streak, todayMinutes, totalPoints, currentlyReading: count }
```

---

## 9. Migration Plan

### Step 1: Extract & Refactor (no behavior change)
1. Extract `ReadingQueue.jsx` from current `Sidebar.jsx`
2. Create `useTabContext.js` hook (extract tab monitoring from Sidebar.jsx)
3. Create `ModuleRouter.jsx` with only `ReadingQueue` and `DefaultModule`
4. Create `DefaultModule.jsx` (simple quick-actions panel)
5. Create `domainRules.js` classifier
6. Refactor `Sidebar.jsx` to shell
7. **Test**: Sidebar works identically to before — Reading Queue shows on all pages

### Step 2: Domain Classification (new behavior)
1. Wire domain classifier into `useTabContext`
2. Add `system` classification to suppress refreshes on chrome:// pages
3. `DefaultModule` shows on unclassified domains
4. `ReadingQueue` shows on `reading` + `bookstore` domains
5. **Test**: Sidebar switches between ReadingQueue and DefaultModule based on domain

### Step 3: NotesCapture Module
1. Build `NotesCapture.jsx`
2. Add `GET_DOMAIN_NOTES` background handler
3. Add `source_domain` filter to server `GET /notes`
4. Wire up save actions (reuse existing `SAVE_QUICK_NOTE` flow)
5. **Test**: NotesCapture shows on research/reference domains, saves notes with citations

### Step 4: User Overrides
1. Build `ModuleSettings.jsx` panel
2. Add `SIDEBAR_MODULE_OVERRIDES` to storage.js
3. Wire overrides into `useTabContext` (check before built-in rules)
4. **Test**: User can override domain → module mapping, overrides persist

### Step 5: MeetingPrep Module (Phase 4.2)
1. Build `MeetingPrep.jsx`
2. Add `meeting-prep` endpoint on server
3. Wire up talking points generation
4. **Test**: MeetingPrep shows on video-call domains

### Step 6: DevContext Placeholder (Phase 5.3 prep)
1. Build minimal `DevContext.jsx` with "coming soon" message
2. Show domain notes from GitHub/GitLab
3. **Test**: Placeholder shows on dev domains

---

## 10. Testing Strategy

### Unit Tests
- `domainRules.test.js` — classify 30+ URLs correctly, edge cases (subdomains, paths, ports)
- `useTabContext.test.js` — debouncing, system page suppression, override precedence
- `ModuleRouter.test.js` — correct component rendered for each classification

### Integration Tests
- Tab switch → correct module loads
- Save note in NotesCapture → appears in domain notes list
- Override domain → module switches immediately
- System page (chrome://settings) → no refresh, no errors

### Manual Testing Checklist
- [ ] Switch between 5+ tabs of different types — correct modules load
- [ ] Override a domain, close/reopen sidebar — override persists
- [ ] Save a note on arxiv.org → note appears in domain notes
- [ ] Open Google Meet → MeetingPrep shows currently-reading books
- [ ] Open chrome://extensions → sidebar doesn't crash or refresh
- [ ] Rapid tab switching (10 tabs in 3 seconds) → no race conditions

---

## 11. File Summary

### New Files
| File | Purpose | Lines (est.) |
|---|---|---|
| `sidebar/modules/ModuleRouter.jsx` | Routes classification → component | ~30 |
| `sidebar/modules/ReadingQueue.jsx` | Extracted from Sidebar.jsx | ~180 |
| `sidebar/modules/NotesCapture.jsx` | Research/reference note capture | ~150 |
| `sidebar/modules/MeetingPrep.jsx` | Video-call meeting prep | ~120 |
| `sidebar/modules/DevContext.jsx` | GitHub placeholder | ~40 |
| `sidebar/modules/DefaultModule.jsx` | Quick-actions + stats | ~80 |
| `sidebar/modules/ModuleSettings.jsx` | Override management UI | ~100 |
| `sidebar/hooks/useTabContext.js` | Tab monitoring + classification | ~80 |
| `sidebar/hooks/useModuleConfig.js` | Override CRUD | ~40 |
| `background/domainRules.js` | Domain → classification mapping | ~80 |
| **Total new** | | **~900 lines** |

### Modified Files
| File | Change |
|---|---|
| `sidebar/Sidebar.jsx` | Refactor to shell (257 → ~50 lines) |
| `background/worker.js` | Add `GET_DOMAIN_NOTES` handler |
| `config/storage.js` | Add `SIDEBAR_MODULE_OVERRIDES`, `NOTES_DRAFT`, `QUICK_STATS` keys |
| `server2/src/routes/notes.js` | Add `source_domain` query filter |
| `server2/src/routes/ai.js` | Add `/ai/meeting-prep` endpoint (Phase 4.2) |

---

## 12. Open Questions

1. **Should modules animate on transition?** A subtle crossfade (150ms) would feel polished but adds complexity.
2. **Should the sidebar remember the last module per domain?** e.g., if you manually switch to NotesCapture on github.com, should it remember that as an implicit override?
3. **Rate limiting**: Should domain notes queries share the existing AI rate limiter, or have their own? (They're not AI calls, so probably separate.)
4. **Supabase sync for overrides**: Worth building now, or defer until user base justifies it?
5. **Module badges**: Should the sidebar header show a badge/icon indicating which module is active, with a manual module switcher dropdown for power users?
