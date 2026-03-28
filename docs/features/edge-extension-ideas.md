# Edge Extension Concepts for ShelfQuest and Coaching Workflows

## Developer / Coding Workflow Helpers
- **AI-Powered Dev Context Side Panel**: Sidebar that reads the active page or open GitHub PR diff and summarizes TODOs, code smells, or missing tests via an LLM; quick actions insert comments using content scripts and GitHub API.
- **Env/Secret Sniffer for Local Dev**: Context-menu action that extracts env var names from visible docs or code snippets and maps them to a local template (e.g., `env.template.js`), storing findings in Supabase so you can reconcile across projects.
- **Supabase Query Profiler**: DevTools panel that logs network calls to Supabase domains, annotates latency and row counts, and offers one-click explain/optimize suggestions using OpenAI functions.

## AI and Reading / Research Helpers (ShelfQuest-focused)
- **"Send to ShelfQuest" Web Clipper**: Context-menu or toolbar button that snapshots selected text, highlights, and article metadata, converts to markdown/PDF, and saves directly to ShelfQuest via Supabase edge function; shows save status in a popup.
- **Smart Reading Queue Overlay**: Sidebar/popup listing ShelfQuest library items with AI-prioritized next-read suggestions based on your browsing context (topics on current tab); supports quick open in a mini reader overlay via content script.
- **Citation & Notes Collector**: Content script that lets you highlight text on any page; popup aggregates highlights with source URLs and sends them to a ShelfQuest notebook; LLM proposes summary bullets and study questions.
- **AI-Powered Ebook Translator/Explainer**: When viewing PDFs/ePubs in-browser, injects a floating action that translates or simplifies selected passages using LLMs, then syncs annotated notes back to ShelfQuest.

## Productivity and UX Helpers
- **Context-Aware Tab Pairing**: Popup that groups current tab with your ShelfQuest reader tab or GitHub tab, creating quick-switch buttons; stores pairs in Supabase for later reopening.
- **Task-from-Page Quick Capture**: Context menu that converts selected text into a todo/task and pushes it to your preferred task system; AI tags and schedules based on content (meetings, docs, PRs).
- **Meeting Prep Assistant**: On calendar or video-call domains, sidebar fetches relevant ShelfQuest notes and recent commits; suggests talking points and questions.

## Coaching / Sports-Specific Tools
- **Pitch/Hit Mechanics Timestamp Annotator**: Content script on video platforms (YouTube, Hudl, Loom) to drop tagged bookmarks with cues ("hip hinge", "attack angle"), auto-storing timestamps and notes to Supabase; popup shows sortable bookmarks.
- **Side-by-Side Mechanics Comparator**: Toolbar action that lets you pick two videos/frames, captures synchronized screenshots, and overlays posture angles; AI generates a coaching summary and sends session notes to players.
- **Drill/Practice Plan Generator**: Context menu on articles or scouting reports that extracts key issues, then sidebar produces a templated practice plan (warm-up, drills, metrics) saved to ShelfQuest or emailed.

## AI-Browser Futures (Positioning)
- **Personal Agent Launcher**: Popup to trigger custom agents (reading summarizer, PR reviewer, practice-plan generator) with per-domain presets; stores runs/outputs in Supabase so history persists across browsers.
- **Adaptive Sidebar for Active Workflows**: Uses tab/domain signals to swap sidebar modules (reader for docs, code review helper for GitHub, coaching toolkit for video sites), mirroring the AI-centric browser idea of context-driven tools.

## How These Fit Edge Extension Surface Areas
- **Context menus** for text/selection clipping, task creation, and drill extraction.
- **Sidebar or popup** for AI summaries, queues, and agent launcher controls.
- **Content scripts** for in-page highlights, video timestamping, and overlays.
- **DevTools panel** for Supabase profiling and PR helper views.

Each idea is scoped to be buildable with your React/TypeScript + Supabase stack, showcases AI strengths, and can be monetized via premium AI quotas, team sharing, or coaching-specific features.
