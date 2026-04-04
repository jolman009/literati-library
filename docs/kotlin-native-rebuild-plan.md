# ShelfQuest Native Android Rebuild Plan

## Kotlin / Jetpack Compose -- Production Planning Document

**Version:** 1.0
**Date:** 2026-04-01
**Author:** Joel Guzman
**Status:** DRAFT -- Pending Stakeholder Review

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack](#2-technology-stack)
3. [Architecture](#3-architecture)
4. [Week-by-Week Timeline](#4-week-by-week-timeline)
5. [Dependencies List](#5-dependencies-list)
6. [Risk Assessment](#6-risk-assessment)
7. [Team Requirements](#7-team-requirements)
8. [Testing Strategy](#8-testing-strategy)

---

## 1. Executive Summary

### Why Rebuild in Kotlin

ShelfQuest currently ships as a Progressive Web App (PWA) wrapped in a Trusted Web Activity (TWA) for Android distribution. While this approach enabled rapid iteration and code reuse between web and mobile, it introduces meaningful limitations that native development resolves:

**Performance.** EPUB and PDF rendering through a WebView layer adds overhead that native rendering eliminates. Page-turn latency, annotation drawing, and pinch-to-zoom all perform measurably better with native canvas and layout APIs. Reading apps are performance-critical -- users interact with them for hours at a time.

**Platform integration.** Native Android provides direct access to MediaStore, SAF (Storage Access Framework), foreground services for reading session tracking, accurate battery-aware background sync, and rich notification channels. The TWA model limits control over navigation chrome, deep linking, and system UI integration.

**Offline reliability.** Room + WorkManager provides a battle-tested offline-first stack with deterministic conflict resolution. The current approach relies on service workers and IndexedDB, which have inconsistent behavior across Android WebView versions and OEM skins.

**Play Store quality signals.** Google's Play Store algorithms favor native apps for discoverability. Native apps also have access to Play Feature Delivery, in-app updates, and in-app reviews APIs that TWAs cannot use.

**Reader experience.** A custom EPUB renderer built on native text layout (Compose Text / Canvas) enables pixel-perfect typographic control: custom fonts, precise line spacing, hyphenation, and page transition animations that a web-based reader cannot match.

### Pros

- Full access to Android platform APIs (files, notifications, background work, sensors)
- Superior rendering performance for EPUB/PDF content
- Native Google Play Billing integration (no web-to-native bridge hacks)
- Better Play Store visibility and review potential
- Direct control over memory management and lifecycle
- Access to Jetpack libraries with first-party Google support
- True offline-first with Room + WorkManager

### Cons

- Complete frontend rewrite (20-24 weeks estimated)
- Loss of web parity -- the web app (shelfquest.org) must be maintained separately
- Kotlin/Compose learning curve if the team lacks native Android experience
- Chrome extension (web clipper, notes) remains web-only; native app must consume clipped data via API
- Single-platform investment (iOS would require a separate effort or KMP)
- Higher ongoing maintenance cost (two frontends instead of one shared codebase)

### Decision Framework

This rebuild is justified if the primary user base is Android-native and the reading experience quality is the competitive differentiator. If cross-platform reach or development velocity is prioritized, consider Kotlin Multiplatform (KMP) with Compose Multiplatform as a middle path.

---

## 2. Technology Stack

### Core

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Language | Kotlin 2.0+ | Primary language, null safety, coroutines |
| UI Framework | Jetpack Compose (BOM 2025.01+) | Declarative UI, Material Design 3 |
| Min SDK | 26 (Android 8.0) | Covers 95%+ of active devices |
| Target SDK | 35 (Android 15) | Play Store requirement |
| Build System | Gradle 8.x + AGP 8.x + Version Catalogs | Dependency management, build variants |

### Networking & API

| Library | Purpose |
|---------|---------|
| Retrofit 2.11+ | Type-safe HTTP client for Express API |
| OkHttp 4.12+ | HTTP engine, interceptors for JWT auth |
| Kotlinx Serialization 1.7+ | JSON parsing (compile-time, no reflection) |
| Supabase Kotlin SDK 3.x | Real-time subscriptions, auth helpers |

### Local Storage & Offline

| Library | Purpose |
|---------|---------|
| Room 2.7+ | Local SQLite database, offline cache |
| DataStore (Preferences) | Key-value settings, theme selection, onboarding flags |
| WorkManager 2.10+ | Background sync, deferred uploads |

### Dependency Injection

| Library | Purpose |
|---------|---------|
| Hilt 2.52+ | Compile-time DI, ViewModel injection, WorkManager injection |

### Navigation

| Library | Purpose |
|---------|---------|
| Navigation Compose 2.8+ | Type-safe navigation with serializable routes |

### EPUB Rendering

| Library | Purpose |
|---------|---------|
| Readium 3.x (readium-kotlin) | EPUB parsing, content extraction, navigation, search |
| Compose Canvas / RichText | Custom page rendering, annotation overlay |

### PDF Rendering

| Library | Purpose |
|---------|---------|
| AndroidPdfViewer (barteksc) or PdfRenderer | PDF display, zoom, scroll |
| Android Graphics PDF (android.graphics.pdf) | Native PDF page rendering to Bitmap |

### Authentication

| Library | Purpose |
|---------|---------|
| Credential Manager API | Google Sign-In (replaces deprecated GoogleSignInClient) |
| AndroidX Security Crypto | EncryptedSharedPreferences for token storage |

### Billing

| Library | Purpose |
|---------|---------|
| Google Play Billing 7.x | Subscriptions, one-time purchases, purchase verification |

### Firebase

| Library | Purpose |
|---------|---------|
| Firebase Cloud Messaging (FCM) | Push notifications |
| Firebase Analytics | Event tracking, funnel analysis |
| Firebase Crashlytics | Crash reporting |

### Image Loading

| Library | Purpose |
|---------|---------|
| Coil 3.x (Compose) | Async image loading, caching, book cover display |

### Testing

| Library | Purpose |
|---------|---------|
| JUnit 5 | Unit test framework |
| MockK 1.13+ | Kotlin-native mocking |
| Turbine 1.1+ | Flow testing |
| Compose UI Test | UI testing with semantics |
| Espresso | Integration/E2E testing |
| Hilt Testing | DI in tests |

### Tooling

| Tool | Purpose |
|------|---------|
| Detekt | Static analysis, code smells |
| Ktlint | Code formatting |
| Kover | Code coverage |
| LeakCanary | Memory leak detection (debug builds) |
| Flipper / Chucker | Network inspection (debug builds) |

---

## 3. Architecture

### Overview: Clean Architecture + MVVM

The app follows a three-layer Clean Architecture with MVVM at the presentation layer. Each layer has strict dependency rules: outer layers depend on inner layers, never the reverse.

```
+-------------------------------------------------+
|              Presentation Layer                  |
|  (Compose UI, ViewModels, UI State, Navigation)  |
+-------------------------------------------------+
         |                          ^
         v                          |
+-------------------------------------------------+
|                Domain Layer                      |
|  (Use Cases, Domain Models, Repository Interfaces)|
+-------------------------------------------------+
         |                          ^
         v                          |
+-------------------------------------------------+
|                 Data Layer                       |
|  (Repository Impls, Room DAOs, Retrofit APIs,    |
|   DataStore, Mappers, Sync Engine)               |
+-------------------------------------------------+
```

### Package Structure

```
org.shelfquest.app/
  di/                          # Hilt modules
  data/
    local/
      db/                     # Room database, DAOs, entities
      datastore/              # Preferences DataStore
    remote/
      api/                    # Retrofit service interfaces
      dto/                    # API data transfer objects
    repository/               # Repository implementations
    mapper/                   # Entity <-> Domain <-> DTO mappers
    sync/                     # Offline sync engine, WorkManager workers
  domain/
    model/                    # Domain models (Book, Note, User, etc.)
    repository/               # Repository interfaces
    usecase/
      auth/                   # LoginUseCase, RefreshTokenUseCase
      books/                  # GetBooksUseCase, UploadBookUseCase
      reader/                 # GetEpubContentUseCase, SaveAnnotationUseCase
      notes/                  # GetNotesUseCase, EnhanceNoteUseCase
      gamification/           # GetProgressUseCase, CompleteChallenge
      ai/                     # MentorDiscussUseCase, RecommendBooksUseCase
      subscription/           # CheckEntitlementUseCase, PurchaseUseCase
  presentation/
    navigation/               # NavHost, Route definitions
    theme/                    # 12 MD3 themes, ThemeManager
    common/                   # Shared composables, components
    auth/                     # Login/signup screens + ViewModels
    library/                  # Library grid/list, upload, metadata
    reader/
      epub/                   # EPUB reader screen, pagination, annotations
      pdf/                    # PDF reader screen, zoom, scroll
    notes/                    # Notes list, editor, tags, search, export
    gamification/             # Dashboard, achievements, challenges, goals
    ai/                       # Mentor chat, recommendations, enhance
    settings/                 # Settings, theme picker, account
    onboarding/               # Onboarding flow
    subscription/             # Pricing, paywall, billing
    analytics/                # Reading stats, session history
  util/                       # Extensions, constants, helpers
  worker/                     # WorkManager workers (sync, notifications)
```

### Key Patterns

**ViewModel + UI State.** Each screen has a ViewModel that exposes a single `StateFlow<ScreenUiState>` sealed class. The Composable observes this flow via `collectAsStateWithLifecycle()`. User actions dispatch events to the ViewModel.

```kotlin
// Example pattern
data class LibraryUiState(
    val books: List<BookUi> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null,
    val viewMode: ViewMode = ViewMode.GRID
)

sealed interface LibraryEvent {
    data class Search(val query: String) : LibraryEvent
    data class DeleteBook(val id: String) : LibraryEvent
    data object Refresh : LibraryEvent
}
```

**Repository pattern.** Each repository interface lives in `domain/`, implementation in `data/`. Repositories mediate between local (Room) and remote (Retrofit) sources with an offline-first strategy: read from Room, sync from API in background, update Room, emit updated Flow.

**Offline sync engine.** A `SyncManager` backed by WorkManager coordinates bi-directional sync:
- **Outbound:** Local writes are queued in a `sync_queue` Room table. A periodic WorkManager job sends pending changes to the Express API. Conflict resolution uses last-write-wins with server timestamps.
- **Inbound:** On connectivity restore, the app fetches changes since `last_sync_timestamp` from the API. Server responses include a monotonic `updated_at` used for cursor-based pagination.

**UseCase layer.** Each use case encapsulates a single business operation, injected into ViewModels via Hilt. Use cases coordinate between repositories and enforce business rules (e.g., AI rate limiting for free tier).

---

## 4. Week-by-Week Timeline

Total estimated duration: **24 weeks** (solo senior Kotlin/Android developer, full-time).

### Phase 1: Foundation (Weeks 1-4)

#### Weeks 1-2: Project Scaffold, CI/CD, Authentication

**Deliverables:**
- Android Studio project with multi-module Gradle setup (`:app`, `:data`, `:domain`)
- Version Catalog (`libs.versions.toml`) with all dependencies pinned
- GitHub Actions CI: lint (Detekt + Ktlint), unit tests, build APK
- Hilt DI setup with modules for network, database, repositories
- Credential Manager integration for Google Sign-In
- JWT token storage in EncryptedSharedPreferences
- OkHttp interceptor for automatic Bearer token injection and 401/403 refresh
- Login screen (Compose) with Google button, loading states, error handling
- Navigation shell: auth flow vs main app flow

**Acceptance criteria:**
- User can sign in with Google, receive JWT from Express `/auth/google` endpoint
- Token refresh works silently on 403 responses
- CI pipeline passes on every PR

#### Weeks 3-4: Supabase Integration, Data Models, Offline Sync

**Deliverables:**
- Room database schema: `books`, `notes`, `highlights`, `reading_sessions`, `user_goals`, `clippings`, `achievements`, `ai_usage`
- Entity classes with TypeConverters for dates, enums, JSON arrays
- Retrofit service interfaces for all Express API endpoints
- DTO classes matching API response shapes
- Mapper layer (Entity <-> Domain <-> DTO)
- Repository implementations with offline-first read strategy
- `SyncManager` with WorkManager: periodic background sync (15-min intervals when online)
- `sync_queue` table for outbound change tracking
- DataStore for user preferences (theme, reading settings, onboarding completion)
- Supabase Kotlin SDK initialization for real-time subscriptions (optional, can defer)

**Acceptance criteria:**
- App works fully offline after initial data fetch
- Changes made offline are synced when connectivity returns
- No data loss on conflict (last-write-wins with server timestamp)

### Phase 2: Core Library (Weeks 5-7)

#### Weeks 5-7: Library Management

**Deliverables:**
- Book upload: SAF file picker for EPUB/PDF, multipart upload to Express API
- Metadata extraction: title, author, cover image from EPUB (Readium) and PDF
- Library screen with Grid and List view modes (toggle)
- Book cover display with Coil (placeholder for missing covers)
- Search and filter: by title, author, genre, reading status
- Sort options: title, author, date added, last read
- Book detail bottom sheet: metadata, progress, actions (read, delete, edit)
- Pull-to-refresh with SwipeRefresh
- Empty state and loading skeleton composables
- Batch operations: multi-select, bulk delete

**Acceptance criteria:**
- User can upload EPUB and PDF files from device storage
- Library displays books with covers, supports search/filter/sort
- Grid and list views both work with smooth scrolling (LazyVerticalGrid / LazyColumn)

### Phase 3: Readers (Weeks 8-12)

#### Weeks 8-10: EPUB Reader

**Deliverables:**
- Readium 3 integration: EPUB parsing, streamer, navigator
- Paginated reading view with horizontal swipe navigation
- Table of contents (TOC) navigation drawer
- Reading progress tracking (percentage, current chapter)
- Font size, font family, and line spacing controls
- Reading themes: Light, Dark, Sepia (independent of app theme)
- Text selection with context menu: Highlight, Note, Copy, Translate, Simplify
- Highlight rendering with color picker (yellow, green, blue, pink, purple)
- Annotation overlay: highlights persist across sessions via Room
- Bookmark management: add/remove/list bookmarks per book
- Page turn animations (slide, curl, fade -- configurable)
- Reading session timer: automatic start/stop, pause on app background
- Immersive mode: hide system bars while reading

**Acceptance criteria:**
- EPUB files render with correct formatting and pagination
- Highlights and bookmarks persist locally and sync to server
- Reading sessions are tracked with accurate duration
- Reader works offline with cached content

#### Weeks 11-12: PDF Reader

**Deliverables:**
- PDF rendering using `PdfRenderer` (native) or AndroidPdfViewer
- Vertical scroll mode with smooth fling
- Pinch-to-zoom with double-tap reset
- Page indicator and jump-to-page dialog
- Text selection for highlight and annotation (where PDF supports it)
- Annotation layer: freeform highlights on rendered pages
- Bookmark support (same system as EPUB)
- Reading session tracking (same system as EPUB)
- Night mode inversion for PDF display

**Acceptance criteria:**
- PDFs render at full fidelity with responsive zoom
- Large PDFs (500+ pages) load without OOM crashes
- Annotations sync to server

### Phase 4: Notes & Gamification (Weeks 13-16)

#### Weeks 13-14: Notes & Highlights System

**Deliverables:**
- Notes list screen with search, filter by book, filter by tags
- Note editor: rich text input (bold, italic, bullet points)
- Tag management: add/remove/create tags, tag autocomplete
- Highlights list screen grouped by book
- Note/highlight detail view with source context (book title, chapter, page)
- Web clipping display: notes and clippings from Chrome extension shown with source URL/favicon
- Export: share individual notes or export all notes as Markdown/plain text
- Batch operations: multi-select, bulk delete, bulk tag
- Sort by date created, date modified, book

**Acceptance criteria:**
- Full CRUD on notes and highlights with offline support
- Tags are searchable and filterable
- Export produces well-formatted Markdown
- Web clippings from extension are visible in the notes list

#### Weeks 15-16: Gamification

**Deliverables:**
- Gamification dashboard: level progress bar, points, current streak
- Achievements grid: locked/unlocked state, progress indicators, unlock animations
- Daily challenges: fetch from API, complete actions, claim rewards
- Reading goals: create/edit/delete goals, track progress, deadline tracking
- Streak tracker: visual calendar heatmap of reading days
- Points system: earn points for reading sessions, notes, completions
- Level-up dialog with celebration animation (Lottie)
- Goal creation from web-captured tasks (display source URL, AI category badge)

**Acceptance criteria:**
- Points and levels calculate correctly and sync with server
- Streaks track consecutive reading days accurately
- Achievement unlocks trigger appropriate UI feedback
- Daily challenges refresh correctly

### Phase 5: AI Features (Weeks 17-19)

#### Weeks 17-18: AI Features

**Deliverables:**
- AI Mentor chat screen: Socratic discussion about current book
  - Chat UI with message bubbles, typing indicator
  - `POST /ai/mentor-discuss` integration
  - Conversation history (local Room storage)
- AI Quiz: comprehension quizzes generated from book content
  - Quiz UI: question, multiple choice, feedback
  - `POST /ai/mentor-quiz` integration
- AI Book Recommendations: personalized suggestions
  - Recommendation cards with match type badges
  - `POST /ai/book-recommendations` integration
  - Affiliate links (Bookshop.org, Amazon)
- AI Note Enhancement: improve note quality
  - "Enhance with AI" button on note editor
  - `POST /ai/enhance-note` integration
  - Before/after comparison view
- AI Passage Translation: translate selected text
  - Language picker dialog
  - Inline translation display in reader
- AI Passage Simplification: simplify complex text
  - Inline simplified text display in reader
- AI credit tracking: display remaining credits, usage badge
- Upgrade prompt when free tier exhausted (5 calls/month)

**Acceptance criteria:**
- All AI features work end-to-end through the Express API
- Free tier users see credit count and are gated at 5 calls/month
- Pro users have unlimited access
- AI responses display correctly with proper formatting

#### Week 19: Reading Session Tracking & Analytics

**Deliverables:**
- Reading analytics dashboard:
  - Total time read (today, this week, this month, all time)
  - Pages/chapters read over time (line chart)
  - Daily reading duration bar chart
  - Average session length
  - Books completed timeline
  - Reading speed estimate (pages per hour)
- Session history list: date, book, duration, pages
- Charts using Vico (Compose charting library) or similar
- Background session tracking: foreground service for accurate timing
- Data sync: sessions upload to Express API for cross-device analytics

**Acceptance criteria:**
- Analytics data is accurate and matches server records
- Charts render smoothly with real data
- Session tracking handles app kills and process death correctly

### Phase 6: Monetization & Polish (Weeks 20-24)

#### Week 20: Google Play Billing

**Deliverables:**
- BillingClient 7.x integration with `BillingManager` wrapper
- Product catalog: Monthly ($4.99), Annual ($39.99), Lifetime ($79.99)
- Purchase flow: pricing page, purchase dialog, success/error handling
- Subscription status verification via `POST /api/subscription/verify-play` (new server endpoint)
- Entitlement checks: `SubscriptionRepository` queries local cache + server verification
- Grace period and account hold handling
- Restore purchases flow for reinstalls
- `SubscriptionGate` composable: wraps AI features, shows upgrade prompt for free users

**Acceptance criteria:**
- All three subscription tiers purchasable in Play Store sandbox
- Subscription status persists correctly across app restarts
- Server-side receipt verification prevents client-side tampering
- Free users are properly gated; Pro users have full access

#### Weeks 21-22: Theming, Settings, Onboarding

**Deliverables:**
- 12 Material Design 3 themes ported from web:
  - Implement as `ColorScheme` objects (light + dark variants per theme)
  - Theme unlocking tied to gamification levels
  - Smooth theme transition animation
- Theme picker screen: preview grid, lock indicators, current selection
- Settings screen:
  - Account management (email, sign out, delete account)
  - Reading preferences (default font, font size, reader theme)
  - Notification preferences (push notification toggles)
  - Data & storage (cache size, clear cache, export data)
  - About (version, licenses, privacy policy, terms)
- Onboarding flow (3-5 screens):
  - Welcome / value proposition
  - Sign in with Google
  - Library setup (import books or browse empty state)
  - Quick feature tour (reading, notes, AI mentor)
  - Notification permission request (POST_NOTIFICATIONS on Android 13+)
- Push notifications via FCM:
  - Daily reading reminder (configurable time)
  - Streak at risk warning
  - New AI recommendation available
  - Achievement unlocked

**Acceptance criteria:**
- All 12 themes render correctly in light and dark modes
- Theme unlocks match gamification level thresholds
- Onboarding completes smoothly and does not re-show after completion
- Push notifications arrive reliably and deep-link to correct screens

#### Weeks 23-24: Polish, Testing, Play Store Submission

**Deliverables:**
- Comprehensive QA pass across all features
- Performance profiling and optimization:
  - Compose recomposition tracing (fix unnecessary recompositions)
  - Startup time optimization (baseline profiles)
  - Memory profiling (LeakCanary audit)
- Accessibility audit:
  - TalkBack compatibility on all screens
  - Content descriptions on images and icons
  - Minimum touch target sizes (48dp)
  - Focus ordering
- Edge case handling:
  - No network state
  - Empty states for all lists
  - Very long book titles / author names
  - Large libraries (500+ books)
  - Process death and restoration
- Play Store assets:
  - Feature graphic (1024x500)
  - Screenshots (phone + tablet, 8 screens each)
  - Short and full descriptions
  - Privacy policy URL
  - Content rating questionnaire
- Signed release AAB build
- Internal testing track upload
- Closed beta (2 weeks) before production launch

**Acceptance criteria:**
- All critical user flows pass manual QA
- No P0/P1 bugs open
- Crash-free rate above 99.5% in closed beta
- App size under 30 MB (AAB)
- Cold start under 2 seconds on mid-range devices

---

## 5. Dependencies List

All versions are specified in `gradle/libs.versions.toml` using Gradle Version Catalogs.

```toml
[versions]
kotlin = "2.0.21"
agp = "8.7.3"
compose-bom = "2025.01.01"
compose-compiler = "2.0.21"  # Matches Kotlin version (K2 compiler)
hilt = "2.52"
room = "2.7.0"
retrofit = "2.11.0"
okhttp = "4.12.0"
kotlinx-serialization = "1.7.3"
kotlinx-coroutines = "1.9.0"
navigation = "2.8.5"
lifecycle = "2.8.7"
datastore = "1.1.2"
work = "2.10.0"
coil = "3.0.4"
readium = "3.0.0"
billing = "7.1.1"
firebase-bom = "33.7.0"
credential-manager = "1.5.0"
security-crypto = "1.1.0-alpha06"
mockk = "1.13.13"
turbine = "1.1.0"
junit5 = "5.11.4"
detekt = "1.23.7"
leakcanary = "2.14"
vico = "2.0.1"
lottie = "6.6.2"
supabase-kt = "3.0.3"

[libraries]
# Compose
compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "compose-bom" }
compose-ui = { group = "androidx.compose.ui", name = "ui" }
compose-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
compose-ui-tooling = { group = "androidx.compose.ui", name = "ui-tooling" }
compose-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
compose-material3 = { group = "androidx.compose.material3", name = "material3" }
compose-material-icons = { group = "androidx.compose.material", name = "material-icons-extended" }
compose-animation = { group = "androidx.compose.animation", name = "animation" }
compose-foundation = { group = "androidx.compose.foundation", name = "foundation" }

# Lifecycle
lifecycle-runtime = { group = "androidx.lifecycle", name = "lifecycle-runtime-compose", version.ref = "lifecycle" }
lifecycle-viewmodel = { group = "androidx.lifecycle", name = "lifecycle-viewmodel-compose", version.ref = "lifecycle" }

# Navigation
navigation-compose = { group = "androidx.navigation", name = "navigation-compose", version.ref = "navigation" }

# Hilt
hilt-android = { group = "com.google.dagger", name = "hilt-android", version.ref = "hilt" }
hilt-compiler = { group = "com.google.dagger", name = "hilt-android-compiler", version.ref = "hilt" }
hilt-navigation-compose = { group = "androidx.hilt", name = "hilt-navigation-compose", version = "1.2.0" }
hilt-work = { group = "androidx.hilt", name = "hilt-work", version = "1.2.0" }

# Room
room-runtime = { group = "androidx.room", name = "room-runtime", version.ref = "room" }
room-compiler = { group = "androidx.room", name = "room-compiler", version.ref = "room" }
room-ktx = { group = "androidx.room", name = "room-ktx", version.ref = "room" }
room-paging = { group = "androidx.room", name = "room-paging", version.ref = "room" }

# Network
retrofit = { group = "com.squareup.retrofit2", name = "retrofit", version.ref = "retrofit" }
retrofit-kotlinx-serialization = { group = "com.squareup.retrofit2", name = "converter-kotlinx-serialization", version.ref = "retrofit" }
okhttp = { group = "com.squareup.okhttp3", name = "okhttp", version.ref = "okhttp" }
okhttp-logging = { group = "com.squareup.okhttp3", name = "logging-interceptor", version.ref = "okhttp" }
kotlinx-serialization-json = { group = "org.jetbrains.kotlinx", name = "kotlinx-serialization-json", version.ref = "kotlinx-serialization" }

# Coroutines
kotlinx-coroutines-core = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-core", version.ref = "kotlinx-coroutines" }
kotlinx-coroutines-android = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-android", version.ref = "kotlinx-coroutines" }

# DataStore
datastore-preferences = { group = "androidx.datastore", name = "datastore-preferences", version.ref = "datastore" }

# WorkManager
work-runtime = { group = "androidx.work", name = "work-runtime-ktx", version.ref = "work" }

# Image Loading
coil-compose = { group = "io.coil-kt.coil3", name = "coil-compose", version.ref = "coil" }
coil-network-okhttp = { group = "io.coil-kt.coil3", name = "coil-network-okhttp", version.ref = "coil" }

# EPUB
readium-shared = { group = "org.readium.kotlin-toolkit", name = "readium-shared", version.ref = "readium" }
readium-streamer = { group = "org.readium.kotlin-toolkit", name = "readium-streamer", version.ref = "readium" }
readium-navigator = { group = "org.readium.kotlin-toolkit", name = "readium-navigator", version.ref = "readium" }
readium-navigator-media = { group = "org.readium.kotlin-toolkit", name = "readium-navigator-media", version.ref = "readium" }
readium-opds = { group = "org.readium.kotlin-toolkit", name = "readium-opds", version.ref = "readium" }

# PDF (native Android)
# android.graphics.pdf.PdfRenderer is part of the Android SDK -- no extra dependency.
# For advanced PDF, use:
# bouquet (compose pdf viewer) or pdf-viewer from AcroInk

# Authentication
credential-manager = { group = "androidx.credentials", name = "credentials", version.ref = "credential-manager" }
credential-manager-play = { group = "androidx.credentials", name = "credentials-play-services-auth", version.ref = "credential-manager" }
google-id = { group = "com.google.android.libraries.identity.googleid", name = "googleid", version = "1.1.1" }

# Security
security-crypto = { group = "androidx.security", name = "security-crypto", version.ref = "security-crypto" }

# Billing
billing = { group = "com.android.billingclient", name = "billing-ktx", version.ref = "billing" }

# Firebase
firebase-bom = { group = "com.google.firebase", name = "firebase-bom", version.ref = "firebase-bom" }
firebase-messaging = { group = "com.google.firebase", name = "firebase-messaging-ktx" }
firebase-analytics = { group = "com.google.firebase", name = "firebase-analytics-ktx" }
firebase-crashlytics = { group = "com.google.firebase", name = "firebase-crashlytics-ktx" }

# Supabase
supabase-postgrest = { group = "io.github.jan-tennert.supabase", name = "postgrest-kt", version.ref = "supabase-kt" }
supabase-realtime = { group = "io.github.jan-tennert.supabase", name = "realtime-kt", version.ref = "supabase-kt" }
supabase-auth = { group = "io.github.jan-tennert.supabase", name = "auth-kt", version.ref = "supabase-kt" }

# Charts
vico-compose = { group = "com.patrykandpatrick.vico", name = "compose-m3", version.ref = "vico" }

# Animation
lottie-compose = { group = "com.airbnb.android", name = "lottie-compose", version.ref = "lottie" }

# Testing
junit5 = { group = "org.junit.jupiter", name = "junit-jupiter", version.ref = "junit5" }
mockk = { group = "io.mockk", name = "mockk", version.ref = "mockk" }
mockk-android = { group = "io.mockk", name = "mockk-android", version.ref = "mockk" }
turbine = { group = "app.cash.turbine", name = "turbine", version.ref = "turbine" }
kotlinx-coroutines-test = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-test", version.ref = "kotlinx-coroutines" }
compose-ui-test = { group = "androidx.compose.ui", name = "ui-test-junit4" }
compose-ui-test-manifest = { group = "androidx.compose.ui", name = "ui-test-manifest" }
room-testing = { group = "androidx.room", name = "room-testing", version.ref = "room" }
hilt-testing = { group = "com.google.dagger", name = "hilt-android-testing", version.ref = "hilt" }
work-testing = { group = "androidx.work", name = "work-testing", version.ref = "work" }

# Debug
leakcanary = { group = "com.squareup.leakcanary", name = "leakcanary-android", version.ref = "leakcanary" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
kotlin-serialization = { id = "org.jetbrains.kotlin.plugin.serialization", version.ref = "kotlin" }
hilt = { id = "com.google.dagger.hilt.android", version.ref = "hilt" }
ksp = { id = "com.google.devtools.ksp", version = "2.0.21-1.0.28" }
room = { id = "androidx.room", version.ref = "room" }
firebase-crashlytics = { id = "com.google.firebase.crashlytics", version = "3.0.3" }
google-services = { id = "com.google.gms.google-services", version = "4.4.2" }
detekt = { id = "io.gitlab.arturbosch.detekt", version.ref = "detekt" }
kover = { id = "org.jetbrains.kotlinx.kover", version = "0.9.0" }
```

---

## 6. Risk Assessment

### High Risk

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **EPUB rendering complexity** | Readium 3 is powerful but has a steep integration curve. Complex EPUBs (fixed layout, embedded fonts, MathML, SVG) may render incorrectly. | High | Start with reflowable EPUBs only. Defer fixed-layout support to a post-launch update. Build a test corpus of 50+ diverse EPUBs early. Budget extra time in Weeks 8-10. |
| **Offline sync conflicts** | Two-device edits to the same note or highlight can produce data loss if conflict resolution is naive. | Medium | Use server-authoritative timestamps with last-write-wins. Add a `sync_version` column for optimistic locking. Log conflicts for manual review. Consider CRDTs for notes if conflict rate is high. |
| **Play Billing edge cases** | Google Play Billing has many failure modes: pending purchases, deferred purchases, account holds, grace periods, proration, family sharing. Incorrect handling can result in lost revenue or support burden. | High | Use Google's official `BillingManager` patterns. Implement server-side receipt verification from day one. Handle all `BillingResponseCode` values explicitly. Test extensively in sandbox with test cards. |
| **Scope creep / timeline overrun** | 24 weeks is aggressive for a solo developer. Any individual phase slipping delays everything downstream. | High | Prioritize ruthlessly. The MVP must include: auth, library, EPUB reader, notes, and billing. Gamification, AI features, and PDF can be post-launch. Define a "shippable at week 16" milestone. |

### Medium Risk

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Large PDF memory pressure** | Rendering 500+ page PDFs to Bitmap can cause OOM on low-RAM devices. | Medium | Use `PdfRenderer` with page-level loading (only render visible pages). Implement bitmap recycling and LRU cache. Set `largeHeap=true` as fallback. |
| **Readium license compliance** | Readium is BSD-licensed but integrates with DRM systems. Ensure no accidental LCP/DRM dependency. | Low | Audit Readium dependencies. ShelfQuest uses DRM-free user-uploaded files only -- no LCP needed. |
| **Supabase real-time reliability** | WebSocket connections may drop on unstable mobile networks. | Medium | Use Supabase real-time as a nice-to-have optimization, not a critical path. Primary sync uses REST polling via WorkManager. Real-time only accelerates UI updates. |
| **API compatibility drift** | The Express backend was designed for a web frontend. Some endpoints may return data shapes that are awkward for native consumption. | Medium | Add a `/api/v2/` namespace for mobile-optimized endpoints as needed. Use DTO mappers to isolate the Android app from API shape changes. |
| **Compose performance in reader** | Rendering long documents with annotations in Compose may cause jank if recomposition is not carefully managed. | Medium | Profile with Compose compiler metrics. Use `@Stable` and `@Immutable` annotations. Keep annotation overlay in a separate `Canvas` layer. Use `derivedStateOf` for computed values. |

### Low Risk

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Credential Manager API fragmentation** | Older devices may not support the new Credential Manager API. | Low | The `credentials-play-services-auth` artifact provides backward compatibility via Google Play Services. Min SDK 26 covers this well. |
| **Theme migration fidelity** | The 12 MD3 themes were defined in CSS variables. Porting to Compose `ColorScheme` objects may produce slight color differences. | Low | Extract exact hex values from `md3-unified-colors.css` and `themes.css`. Use the Material Theme Builder tool to generate Compose code. Visual QA each theme side-by-side. |
| **Chrome extension data gap** | The Chrome extension saves clippings and notes to the server. The native app reads them via API. No functionality gap, but the extension itself remains web-only. | Low | This is acceptable. The extension is a desktop Chrome tool; mobile users save content directly in-app. |

---

## 7. Team Requirements

### Solo Developer Path

A single senior Android developer (3+ years Kotlin, 1+ year Compose) can execute this plan in 24 weeks. This assumes:

- Full-time dedication (40 hours/week)
- No concurrent projects
- Familiarity with Clean Architecture, Room, Retrofit, and Hilt
- Access to the existing Express API documentation and Supabase schema
- Backend developer (existing) available for API questions and new endpoint work

**Estimated cost (contractor):**
- Senior Android contractor (US): $80-150/hr x 960 hours = **$76,800 - $144,000**
- Senior Android contractor (Latin America): $40-70/hr x 960 hours = **$38,400 - $67,200**
- Senior Android contractor (Eastern Europe): $50-80/hr x 960 hours = **$48,000 - $76,800**
- Senior Android contractor (South/Southeast Asia): $25-50/hr x 960 hours = **$24,000 - $48,000**

### Two-Person Team Path (Recommended for 16-week delivery)

Splitting the work between two developers reduces timeline to approximately 16 weeks:

| Developer | Focus Areas |
|-----------|-------------|
| **Dev A (Lead)** | Architecture, auth, offline sync, EPUB reader, billing, CI/CD |
| **Dev B** | Library UI, PDF reader, notes, gamification, AI features, theming |

**Additional cost:** Project management overhead is minimal if both developers are senior. A weekly 30-minute sync is sufficient.

### Backend Support

The Express + Supabase backend remains unchanged for most features. New backend work required:

| Endpoint | Purpose | Effort |
|----------|---------|--------|
| `POST /api/subscription/verify-play` | Server-side Google Play receipt verification | 4-8 hours |
| `POST /api/auth/google-native` | Accept Google ID token (native flow differs from web OAuth) | 2-4 hours |
| `GET /api/sync/changes?since=<timestamp>` | Cursor-based change feed for offline sync | 8-16 hours |

Total backend effort: **14-28 hours** (1-2 days of backend developer time).

### Design Support

If design resources are available, invest in:

- Custom page-turn animations (Lottie files)
- Achievement badge artwork (vector)
- Onboarding illustrations
- App Store screenshots and feature graphic

Estimated design cost: **$2,000 - $5,000** (freelance illustrator/designer).

---

## 8. Testing Strategy

### Testing Pyramid

```
          /  E2E Tests  \          ~10 tests
         / (Espresso/UI) \         (critical flows)
        /------------------\
       / Integration Tests  \      ~50 tests
      / (Hilt + Room + API)  \     (repository, sync, billing)
     /------------------------\
    /      UI Tests             \  ~100 tests
   /   (Compose Test Rule)       \ (screen rendering, interactions)
  /------------------------------\
 /        Unit Tests               \ ~300+ tests
/ (JUnit5 + MockK + Turbine)        \ (ViewModels, UseCases, Mappers)
\--------------------------------------/
```

### Unit Tests (JUnit 5 + MockK + Turbine)

**Scope:** ViewModels, Use Cases, Repositories (with mocked data sources), Mappers, utility functions.

**Framework:**
- JUnit 5 for test lifecycle and assertions
- MockK for mocking interfaces (repositories, APIs)
- Turbine for testing `StateFlow` and `Flow` emissions

**Conventions:**
- Test file naming: `{ClassName}Test.kt`
- Test method naming: `should {expected behavior} when {condition}`
- Each ViewModel test covers: initial state, success, error, loading, edge cases
- Each UseCase test covers: happy path, error propagation, business rule enforcement

**Example:**
```kotlin
@ExtendWith(MockKExtension::class)
class LibraryViewModelTest {

    @MockK private lateinit var getBooksUseCase: GetBooksUseCase
    private lateinit var viewModel: LibraryViewModel

    @Test
    fun `should emit books when use case returns successfully`() = runTest {
        val books = listOf(testBook())
        coEvery { getBooksUseCase() } returns flowOf(Result.success(books))

        viewModel = LibraryViewModel(getBooksUseCase)

        viewModel.uiState.test {
            val state = awaitItem()
            assertEquals(books.map { it.toUi() }, state.books)
            assertFalse(state.isLoading)
        }
    }
}
```

**Coverage target:** 80%+ on domain and data layers, 60%+ on presentation layer (ViewModels).

### UI Tests (Compose Testing)

**Scope:** Individual screen composables, component behavior, navigation transitions.

**Framework:**
- `createComposeRule()` for isolated composable tests
- Semantics-based assertions (`onNodeWithText`, `onNodeWithContentDescription`)
- Simulated user interactions (`performClick`, `performTextInput`, `performScrollTo`)

**Key screens to test:**
- Login screen: Google button visibility, error display, loading state
- Library screen: grid/list toggle, search filtering, empty state
- Reader screen: page navigation, highlight creation, bookmark toggle
- Notes screen: CRUD operations, tag filtering, search
- Pricing screen: tier display, purchase button states

**Coverage target:** All screens have at least a render test (no crash) and a primary interaction test.

### Integration Tests

**Scope:** Repository implementations with real Room database, WorkManager sync jobs, Billing flow.

**Framework:**
- Hilt test runner (`HiltAndroidRule`)
- In-memory Room database for isolated DB tests
- OkHttp `MockWebServer` for API response simulation
- `TestWorkManagerInitializer` for WorkManager tests

**Key integration tests:**
- Offline sync: write locally, mock server response, verify sync queue drains
- Room migrations: test every schema migration path
- Auth flow: token storage, refresh interceptor, logout cleanup
- Billing: mock `BillingClient` responses, verify entitlement state transitions

### End-to-End Tests (Espresso)

**Scope:** Critical user journeys tested on real devices/emulators.

**Critical flows (10 tests):**
1. Sign in with Google -> land on library
2. Upload EPUB -> appears in library -> open reader -> read pages
3. Create highlight in reader -> verify in notes list
4. Create note -> edit -> delete
5. Complete a daily challenge -> verify points increase
6. Start reading session -> track duration -> verify analytics
7. AI Mentor discussion (mocked API) -> send message -> receive response
8. Purchase Pro subscription (sandbox) -> verify features unlock
9. Offline mode: airplane mode -> create note -> restore -> verify sync
10. Onboarding flow -> complete -> verify does not re-show

**Execution:** Run on CI via GitHub Actions with Android emulator (API 34 x86_64). Use Firebase Test Lab for device matrix testing before releases.

### Continuous Integration

**GitHub Actions pipeline:**

```yaml
# On every PR:
- Detekt static analysis
- Ktlint format check
- Unit tests (JUnit 5)
- Compose UI tests (emulator)
- Build debug APK
- Kover coverage report (fail if below threshold)

# On merge to main:
- All of the above
- Integration tests
- Build release AAB (signed)
- Upload to Play Store internal track (via Gradle Play Publisher)

# Weekly:
- E2E tests on Firebase Test Lab (5 device configs)
- Dependency update check (Renovate or Dependabot)
```

### Manual QA Checklist (Pre-Release)

- [ ] All 12 themes render correctly (light + dark)
- [ ] EPUB reader: 10 diverse books tested (reflowable, images, TOC, footnotes)
- [ ] PDF reader: large PDF (500+ pages), scanned PDF, text-selectable PDF
- [ ] Offline: airplane mode for 30 minutes, full usage, reconnect, verify sync
- [ ] Accessibility: full TalkBack walkthrough of every screen
- [ ] Memory: no leaks reported by LeakCanary after 1-hour session
- [ ] Battery: reading for 1 hour does not cause abnormal battery drain
- [ ] Process death: kill app during reading, reopen, verify state restored
- [ ] Fresh install: onboarding -> sign in -> upload book -> read -> create note
- [ ] Upgrade flow: free user -> purchase Pro -> verify immediate access
- [ ] Downgrade: Pro subscription expires -> verify graceful degradation to free tier

---

## Appendix A: Server Endpoints Referenced

The native app communicates with the existing Express server at `https://api.shelfquest.org`. Key endpoints:

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/auth/google` | Exchange Google ID token for JWT |
| GET | `/auth/profile` | Get user profile + subscription tier |
| POST | `/auth/refresh` | Refresh JWT |
| GET | `/api/books` | List user's books |
| POST | `/api/books` | Upload book (multipart) |
| DELETE | `/api/books/:id` | Delete book |
| GET/POST/PUT/DELETE | `/notes` | Notes CRUD |
| GET/POST/PATCH/DELETE | `/api/clippings` | Clippings CRUD |
| GET/POST/PUT/DELETE | `/api/gamification/goals` | Reading goals CRUD |
| GET | `/api/gamification/progress` | Gamification state |
| POST | `/ai/mentor-discuss` | AI Socratic discussion |
| POST | `/ai/mentor-quiz` | AI comprehension quiz |
| POST | `/ai/book-recommendations` | AI book recommendations |
| POST | `/ai/enhance-note` | AI note enhancement |
| POST | `/ai/summarize-notes` | AI note summarization |
| GET | `/api/subscription/status` | Subscription status |
| POST | `/api/subscription/verify-play` | Verify Play Store receipt (NEW) |
| GET | `/api/sync/changes` | Change feed for offline sync (NEW) |

## Appendix B: Room Database Schema (Draft)

```sql
-- Core entities
books(id TEXT PK, title, author, cover_url, file_path, file_type, 
      total_pages, current_page, progress REAL, status TEXT,
      genre, description, isbn, publisher, published_date,
      created_at, updated_at, synced_at, is_deleted INTEGER)

notes(id TEXT PK, book_id TEXT NULL, content, title, 
      tags TEXT, -- JSON array stored as string
      source_url, source_title, source_favicon,
      created_at, updated_at, synced_at, is_deleted INTEGER)

highlights(id TEXT PK, book_id TEXT, chapter, page INTEGER,
           start_offset INTEGER, end_offset INTEGER, 
           selected_text, color TEXT, note TEXT,
           created_at, updated_at, synced_at, is_deleted INTEGER)

bookmarks(id TEXT PK, book_id TEXT, chapter, page INTEGER,
          title, created_at, synced_at, is_deleted INTEGER)

reading_sessions(id TEXT PK, book_id TEXT, start_time INTEGER,
                 end_time INTEGER, duration_seconds INTEGER,
                 pages_read INTEGER, created_at, synced_at)

user_goals(id TEXT PK, title, description, target_value INTEGER,
           current_value INTEGER, goal_type, deadline,
           source_url, source_title, ai_category, ai_tags TEXT,
           completed INTEGER, created_at, updated_at, synced_at)

achievements(id TEXT PK, name, description, icon, 
             unlocked INTEGER, unlocked_at, progress INTEGER,
             target INTEGER, synced_at)

clippings(id TEXT PK, url, title, content, favicon,
          tags TEXT, created_at, updated_at, synced_at, is_deleted INTEGER)

ai_usage(id INTEGER PK AUTOINCREMENT, month TEXT, call_count INTEGER,
         last_reset_at, synced_at)

-- Sync management
sync_queue(id INTEGER PK AUTOINCREMENT, entity_type TEXT, entity_id TEXT,
           operation TEXT, -- INSERT, UPDATE, DELETE
           payload TEXT, -- JSON
           created_at INTEGER, retry_count INTEGER DEFAULT 0)

user_preferences(key TEXT PK, value TEXT)
```

## Appendix C: Migration Path from TWA

The transition from TWA to native can be gradual:

1. **Internal testing:** Ship native app to internal test track while TWA remains in production.
2. **Closed beta:** Invite existing users to test native app via opt-in. Run both versions in parallel for 2-4 weeks.
3. **Production cutover:** Promote native app to production track. The TWA package (`org.shelfquest.app`) is reused -- Google Play treats it as an update.
4. **Web app continuity:** `shelfquest.org` continues to serve web users. The Chrome extension continues to work. Web and native apps share the same backend and user accounts.
5. **Data migration:** No user-facing migration needed. All data lives on the server (Supabase). The native app fetches everything on first login. Local caches (Room) are populated fresh.

---

*End of document.*
