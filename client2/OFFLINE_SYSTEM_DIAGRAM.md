# 📊 Offline Reading System - Visual Architecture

## 🎯 System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LITERATI OFFLINE SYSTEM                            │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                          USER INTERFACE LAYER                           │ │
│  │                                                                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │ │
│  │  │ ReadBook     │  │ BookCard     │  │ Library      │  │ Offline    │ │ │
│  │  │ Enhanced     │  │ WithOffline  │  │ Page         │  │ Indicator  │ │ │
│  │  │              │  │              │  │              │  │            │ │ │
│  │  │ - Reader     │  │ - Download   │  │ - Book Grid  │  │ - Status   │ │ │
│  │  │ - Progress   │  │   Button     │  │ - Filters    │  │ - Sync     │ │ │
│  │  │ - Notes      │  │ - Badge      │  │ - Search     │  │   Count    │ │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │ │
│  │         │                  │                  │                │        │ │
│  └─────────┼──────────────────┼──────────────────┼────────────────┼────────┘ │
│            │                  │                  │                │          │
│            └──────────────────┴──────────────────┴────────────────┘          │
│                                       ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      INTEGRATION HOOKS LAYER                            │ │
│  │                                                                          │ │
│  │                    ┌───────────────────────────┐                        │ │
│  │                    │  useOfflineReading Hook   │                        │ │
│  │                    │                           │                        │ │
│  │                    │  Combines:                │                        │ │
│  │                    │  • Network Detection      │                        │ │
│  │                    │  • Book Caching           │                        │ │
│  │                    │  • Sync Queue             │                        │ │
│  │                    │  • Storage Management     │                        │ │
│  │                    └─────────┬─────────────────┘                        │ │
│  │                              │                                           │ │
│  └──────────────────────────────┼───────────────────────────────────────────┘ │
│                                 │                                             │
│     ┌───────────────────────────┼───────────────────────────┐                │
│     │                           │                           │                │
│     ▼                           ▼                           ▼                │
│  ┌────────────────┐  ┌────────────────────┐  ┌────────────────────┐        │
│  │   NETWORK      │  │   CACHE            │  │   SYNC             │        │
│  │   DETECTION    │  │   MANAGEMENT       │  │   SYSTEM           │        │
│  │   SERVICE      │  │   SERVICE          │  │                    │        │
│  │                │  │                    │  │                    │        │
│  │ ┌────────────┐ │  │ ┌────────────────┐ │  │ ┌────────────────┐ │        │
│  │ │useOffline  │ │  │ │bookCache       │ │  │ │syncQueue       │ │        │
│  │ │Detection   │ │  │ │Service         │ │  │ │                │ │        │
│  │ │            │ │  │ │                │ │  │ │- Queue actions │ │        │
│  │ │- Online    │ │  │ │- Download      │ │  │ │- Priorities    │ │        │
│  │ │  Status    │ │  │ │  Books         │ │  │ │- Retry logic   │ │        │
│  │ │- Server    │ │  │ │- LRU Eviction  │ │  │ └────────┬───────┘ │        │
│  │ │  Reachable │ │  │ │- Storage Quota │ │  │          │         │        │
│  │ │- Network   │ │  │ │- Cleanup       │ │  │ ┌────────▼───────┐ │        │
│  │ │  Quality   │ │  │ │  Expired       │ │  │ │syncManager     │ │        │
│  │ │- Events    │ │  │ └────────┬───────┘ │  │ │                │ │        │
│  │ └─────┬──────┘ │  │          │         │  │ │- Process Queue │ │        │
│  │       │        │  │          │         │  │ │- Retry Failed  │ │        │
│  │       │        │  │          │         │  │ │- Sync to API   │ │        │
│  │       │ Emit   │  │          │ Store   │  │ │- Event Driven  │ │        │
│  │       │ Events │  │          │ Blobs   │  │ └────────┬───────┘ │        │
│  └───────┼────────┘  └──────────┼─────────┘  └──────────┼─────────┘        │
│          │                      │                       │                   │
│          └──────────────────────┼───────────────────────┘                   │
│                                 │                                           │
│                                 ▼                                           │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      STORAGE LAYER (IndexedDB)                          │ │
│  │                                                                          │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │ │
│  │  │  books   │  │ reading_ │  │  notes   │  │  sync_   │  │ metadata │ │ │
│  │  │  store   │  │ progress │  │  store   │  │  queue   │  │  store   │ │ │
│  │  │          │  │  store   │  │          │  │  store   │  │          │ │ │
│  │  │ • Blobs  │  │ • Page   │  │ • Content│  │ • Actions│  │ • Cache  │ │ │
│  │  │ • Title  │  │   Number │  │ • Page   │  │ • Status │  │   Info   │ │ │
│  │  │ • Author │  │ • Percent│  │ • Pos    │  │ • Retry  │  │ • Size   │ │ │
│  │  │ • Type   │  │ • Time   │  │ • Time   │  │ • Prior  │  │ • Synced │ │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │ │
│  │                                                                          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         BACKEND API LAYER                               │ │
│  │                                                                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │ │
│  │  │   Progress   │  │    Notes     │  │  Highlights  │  │ Bookmarks  │ │ │
│  │  │   Endpoint   │  │   Endpoint   │  │   Endpoint   │  │  Endpoint  │ │ │
│  │  │              │  │              │  │              │  │            │ │ │
│  │  │ PUT /books/  │  │ POST /books/ │  │ POST /books/ │  │ PUT /books/│ │ │
│  │  │ :id/progress │  │ :id/notes    │  │ :id/highlt   │  │ :id/bmark  │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │ │
│  │                                                                          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow: Download Book for Offline

```
┌──────────────────────────────────────────────────────────────────┐
│ Step 1: User clicks "Download for Offline"                       │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 2: useOfflineReading.downloadBook() called                  │
│         with book URL and metadata                               │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 3: bookCacheService.cacheBook()                             │
│         - Fetches book file from server (Blob)                   │
│         - Shows download progress                                │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 4: Store in IndexedDB books store                           │
│         - Book Blob                                              │
│         - Metadata (title, author, size)                         │
│         - Timestamps (cachedAt, lastAccessed)                    │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 5: Update metadata store                                    │
│         - Set isCached = true                                    │
│         - Store cache size                                       │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 6: Enforce cache limits (LRU)                               │
│         - Count cached books                                     │
│         - If > MAX_CACHED_BOOKS (10):                            │
│           Remove least recently accessed                         │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 7: Update UI                                                │
│         - Show "Available Offline" badge                         │
│         - Hide download button                                   │
│         - Show download complete message                         │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow: Create Note Offline

```
┌──────────────────────────────────────────────────────────────────┐
│ Step 1: User creates note while offline                          │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 2: useOfflineReading.saveNote() called                      │
│         with note content, page, position                        │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 3: Check network status                                     │
│         isOffline = true → Proceed with offline save             │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 4: Save to local IndexedDB notes store                      │
│         - Generate temporary note ID                             │
│         - Store note with timestamp                              │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 5: Queue sync action                                        │
│         syncQueue.queueAction(CREATE_NOTE, {                     │
│           bookId, content, page, position                        │
│         })                                                        │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 6: Store in sync_queue                                      │
│         - type: CREATE_NOTE                                      │
│         - status: pending                                        │
│         - priority: 5                                            │
│         - retryCount: 0                                          │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 7: Emit 'sync-queue-updated' event                          │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 8: Update UI                                                │
│         - Show "Note saved offline"                              │
│         - OfflineIndicator shows "1 change pending sync"         │
│         - Console: "💾 Note saved offline, will sync..."         │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow: Sync When Reconnected

```
┌──────────────────────────────────────────────────────────────────┐
│ Event: Network comes back online                                 │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 1: 'online' event detected                                  │
│         useOfflineDetection fires 'network-online' custom event  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 2: syncManager receives 'network-online' event              │
│         Triggers processQueue()                                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 3: Check if already syncing                                 │
│         if (isSyncing) return;                                   │
│         isSyncing = true;                                        │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 4: Get pending and retryable actions from queue             │
│         - getPendingActions()                                    │
│         - getRetryableActions()                                  │
│         - Combine and sort by priority                           │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 5: Process each action sequentially                         │
│                                                                   │
│   FOR EACH action:                                               │
│     5.1: markActionSyncing(action.id)                            │
│     5.2: executeAction(action)                                   │
│          ├─ CREATE_NOTE → syncCreateNote()                       │
│          │                → API.post('/books/:id/notes')         │
│          ├─ UPDATE_PROGRESS → syncReadingProgress()              │
│          │                   → API.put('/books/:id/progress')    │
│          └─ ... (other action types)                             │
│                                                                   │
│     5.3: If SUCCESS:                                             │
│          markActionCompleted(action.id)                          │
│          DELETE from sync_queue                                  │
│                                                                   │
│     5.4: If FAILURE:                                             │
│          markActionFailed(action.id, error)                      │
│          retryCount++                                            │
│          if (retryCount >= maxRetries):                          │
│            emit 'sync-action-failed-permanently'                 │
│          else:                                                   │
│            Keep in queue with status='pending'                   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 6: Update sync statistics                                   │
│         successCount, failCount                                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 7: Notify listeners                                         │
│         syncManager.notifyListeners({                            │
│           status: 'completed',                                   │
│           message: 'Synced 3 actions, 0 failed',                 │
│           successCount: 3,                                       │
│           failCount: 0                                           │
│         })                                                        │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 8: Update UI                                                │
│         - OfflineIndicator: "All changes synced" (green)         │
│         - Console: "✅ Synced 3 actions"                         │
│         - Hide pending count                                     │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 9: Set isSyncing = false                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ IndexedDB Structure

```
LiteratiOfflineDB (Database)
│
├── books (Object Store)
│   ├── keyPath: 'id'
│   ├── indexes:
│   │   ├── bookId (non-unique)
│   │   └── lastAccessed (non-unique)
│   └── Structure:
│       {
│         id: 'book_123',
│         bookId: '123',
│         blob: Blob(5242880 bytes),
│         title: 'The Great Gatsby',
│         author: 'F. Scott Fitzgerald',
│         fileType: 'application/pdf',
│         fileSize: 5242880,
│         cachedAt: 1696723200000,
│         lastAccessed: 1696809600000
│       }
│
├── reading_progress (Object Store)
│   ├── keyPath: 'id'
│   ├── indexes:
│   │   └── bookId (non-unique)
│   └── Structure:
│       {
│         id: 'progress_123',
│         bookId: '123',
│         currentPage: 42,
│         totalPages: 200,
│         percentage: 21,
│         timestamp: 1696809600000
│       }
│
├── notes (Object Store)
│   ├── keyPath: 'id'
│   ├── indexes:
│   │   └── bookId (non-unique)
│   └── Structure:
│       {
│         id: 'note_456',
│         bookId: '123',
│         content: 'This is an interesting quote',
│         page: 42,
│         position: { x: 100, y: 200 },
│         timestamp: 1696809600000
│       }
│
├── sync_queue (Object Store)
│   ├── keyPath: 'id'
│   ├── indexes:
│   │   ├── status (non-unique)
│   │   └── timestamp (non-unique)
│   └── Structure:
│       {
│         id: 'sync_789',
│         type: 'CREATE_NOTE',
│         payload: {
│           bookId: '123',
│           content: 'My note',
│           page: 42,
│           position: { x: 100, y: 200 }
│         },
│         status: 'pending',
│         timestamp: 1696809600000,
│         retryCount: 0,
│         maxRetries: 3,
│         priority: 5
│       }
│
└── metadata (Object Store)
    ├── keyPath: 'id'
    └── Structure:
        {
          id: 'meta_123',
          bookId: '123',
          isCached: true,
          cacheSize: 5242880,
          lastSynced: 1696809600000
        }
```

---

## 🔄 LRU Cache Eviction Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ Trigger: New book download OR enforceBookCacheLimit() called     │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 1: Get all cached books from IndexedDB                      │
│         const books = await getAllCachedBooks();                 │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 2: Check count                                              │
│         if (books.length <= MAX_CACHED_BOOKS) return;            │
└────────────────────────────┬─────────────────────────────────────┘
                             │ Count > 10
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 3: Sort by lastAccessed (ascending)                         │
│         books.sort((a, b) => a.lastAccessed - b.lastAccessed)    │
│                                                                   │
│         Result:                                                   │
│         [0] lastAccessed: 1696723200000 ← Oldest                 │
│         [1] lastAccessed: 1696723300000                          │
│         [2] lastAccessed: 1696723400000                          │
│         ...                                                       │
│         [10] lastAccessed: 1696809600000 ← Newest                │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 4: Calculate how many to remove                             │
│         toRemove = books.length - MAX_CACHED_BOOKS               │
│         Example: 11 - 10 = 1                                     │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 5: Select books to remove (from beginning of sorted array)  │
│         booksToRemove = books.slice(0, toRemove)                 │
│         → [ book with lastAccessed: 1696723200000 ]              │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 6: Remove each book                                         │
│         FOR EACH book in booksToRemove:                          │
│           - Delete from books store                              │
│           - Delete from metadata store                           │
│           - Revoke Blob URL if exists                            │
│           - Log removal                                          │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 7: Update cache statistics                                  │
│         console.log('🗑️ Removed 1 book(s) to enforce limit')    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🎨 UI State Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     OfflineIndicator States                      │
└─────────────────────────────────────────────────────────────────┘

   ┌──────────────┐
   │   INITIAL    │
   │   (Hidden)   │
   └──────┬───────┘
          │
          ├─ Network goes offline
          │
          ▼
   ┌──────────────────────────┐
   │      OFFLINE             │
   │  🔴 Orange indicator     │
   │  "Offline - Changes      │
   │   will sync..."          │
   └──────┬───────────────────┘
          │
          ├─ User creates note/progress
          │
          ▼
   ┌──────────────────────────┐
   │  OFFLINE + PENDING       │
   │  🔴 Orange indicator     │
   │  "Offline - 3 changes    │
   │   pending sync"          │
   │  [Manual sync disabled]  │
   └──────┬───────────────────┘
          │
          ├─ Network comes online
          │
          ▼
   ┌──────────────────────────┐
   │      SYNCING             │
   │  🔵 Blue indicator       │
   │  "Syncing 3 items..."    │
   │  [Progress animation]    │
   └──────┬───────────────────┘
          │
          ├─ Sync completes (success)
          │
          ▼
   ┌──────────────────────────┐
   │   ONLINE + SYNCED        │
   │  🟢 Green indicator      │
   │  "All changes synced"    │
   │  [Auto-hide after 3s]    │
   └──────┬───────────────────┘
          │
          ├─ New offline action OR network goes offline
          │
          └─► Back to appropriate state
```

---

## 🔐 Security & Privacy Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    Data Isolation Layers                         │
└─────────────────────────────────────────────────────────────────┘

Browser Level:
┌──────────────────────────────────────────────────────────────┐
│  chrome://settings/content/cookies                            │
│  ├─ Origin: https://literati.app                             │
│  │  └─ IndexedDB: LiteratiOfflineDB                          │
│  │     ├─ User A session (localStorage: token_user_a)        │
│  │     │  └─ Can only access User A's books                  │
│  │     └─ User B session (localStorage: token_user_b)        │
│  │        └─ Can only access User B's books                  │
│  └─ Origin: https://evil.com                                 │
│     └─ No access to Literati data (Same-Origin Policy)       │
└──────────────────────────────────────────────────────────────┘

Auth Token Flow:
┌──────────────────────────────────────────────────────────────┐
│  1. User logs in → Server returns JWT token                  │
│  2. Token stored in localStorage: 'literati_token'           │
│  3. All API calls include: Authorization: Bearer <token>     │
│  4. syncManager reads token: localStorage.getItem('...')     │
│  5. Token validates user identity on backend                 │
│  6. Backend enforces: user can only access own data          │
└──────────────────────────────────────────────────────────────┘

File Validation:
┌──────────────────────────────────────────────────────────────┐
│  Before caching:                                              │
│  1. Validate file type (PDF/EPUB only)                       │
│  2. Check file size (prevent DoS)                            │
│  3. Verify URL origin (same-origin or CORS-allowed)          │
│  4. Scan for malicious content (if applicable)               │
└──────────────────────────────────────────────────────────────┘
```

---

**This visual guide complements the technical documentation and provides a clear understanding of the offline reading system architecture.** 📊✨
