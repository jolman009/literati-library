# 📚 Offline Reading & Sync - Implementation Guide

## 🎯 Overview

This guide documents the complete offline reading and synchronization system for the Literati PWA. The system enables users to download books for offline access, take notes while offline, and automatically sync all changes when reconnected.

---

## 🏗️ Architecture

### Core Components

1. **IndexedDB Storage** (`src/utils/indexedDB.js`)
   - Database name: `LiteratiOfflineDB`
   - 5 object stores: books, reading_progress, notes, sync_queue, metadata
   - Supports gigabytes of data (vs localStorage's 5-10MB)

2. **Network Detection** (`src/hooks/useOfflineDetection.js`)
   - Real-time online/offline status
   - Server reachability checks
   - Network quality metrics (connection type, speed, latency)

3. **Sync Queue** (`src/services/syncQueue.js`)
   - Queues offline actions with priorities
   - Retry logic with exponential backoff
   - Max retry limits to prevent infinite loops

4. **Sync Manager** (`src/services/syncManager.js`)
   - Processes sync queue automatically
   - Syncs with Supabase backend
   - Event-driven architecture

5. **Book Caching** (`src/services/bookCacheService.js`)
   - LRU (Least Recently Used) cache eviction
   - Configurable cache limits (default: 10 books)
   - Automatic cleanup of expired books (30 days)

6. **UI Components**
   - `OfflineIndicator`: Shows sync status and pending actions
   - `OfflineFallback`: Error page for uncached content
   - Enhanced reader with download controls

---

## 📁 File Structure

```
client2/src/
├── utils/
│   ├── indexedDB.js              # IndexedDB wrapper
│   └── offlineInit.js            # Initialization functions
├── hooks/
│   ├── useOfflineDetection.js    # Network status hooks
│   └── useOfflineReading.js      # Main integration hook
├── services/
│   ├── syncQueue.js              # Queue management
│   ├── syncManager.js            # Backend sync
│   └── bookCacheService.js       # Book caching
├── components/
│   ├── OfflineIndicator.jsx      # Status indicator UI
│   └── OfflineFallback.jsx       # Offline error page
└── pages/
    ├── ReadBook.jsx              # Original reader
    └── ReadBookEnhanced.jsx      # Reader with offline support
```

---

## 🚀 Quick Start

### 1. System is Auto-Initialized

The offline reading system initializes automatically when the app starts. Check [App.jsx:243-256](client2/src/App.jsx#L243-L256):

```javascript
useEffect(() => {
  initOfflineReading().then(result => {
    if (result.success) {
      console.log('📚 Offline reading initialized successfully');
      console.log('💾 Storage available:', result.storage);
    }
  });
}, []);
```

### 2. Using in Components

```javascript
import { useOfflineReading } from '../hooks/useOfflineReading';

function MyReadingComponent({ bookId }) {
  const {
    bookData,        // Cached book data
    isCached,        // Is book available offline?
    isOnline,        // Network status
    downloadBook,    // Download for offline
    removeOfflineBook, // Remove from cache
    saveProgress,    // Save reading progress (works offline)
    saveNote,        // Save note (works offline)
  } = useOfflineReading(bookId);

  // Download book for offline
  const handleDownload = async () => {
    await downloadBook(bookUrl, {
      title: 'Book Title',
      author: 'Author Name',
      coverUrl: 'cover.jpg',
      fileType: 'application/pdf',
    });
  };

  // Save progress (automatically queues if offline)
  const handleProgressUpdate = async () => {
    await saveProgress({
      currentPage: 42,
      totalPages: 200,
      percentage: 21,
    });
  };

  return <div>...</div>;
}
```

---

## 🧪 Testing Guide

### Test Scenario 1: Download Book for Offline

**Steps:**
1. Open Literati app while **online**
2. Navigate to Library
3. Open any book
4. Click "Download for Offline" button (top-right)
5. Wait for download to complete
6. Verify "Available Offline" badge appears

**Expected Results:**
- Download progress shown
- Success message appears
- Book badge shows "Available Offline"
- Network tab shows file downloaded

### Test Scenario 2: Read Offline

**Steps:**
1. Complete Test Scenario 1 (download a book)
2. **Disconnect from internet** (airplane mode or disable WiFi)
3. Refresh the app
4. Navigate to Library
5. Open the downloaded book
6. Verify book loads and is readable

**Expected Results:**
- "Offline" indicator appears (top-right)
- Book loads from cache (no network requests)
- All pages are accessible
- Reader functions normally

### Test Scenario 3: Take Notes Offline

**Steps:**
1. While offline (from Test Scenario 2)
2. Open the floating notepad
3. Write a note: "This is an offline test note"
4. Save the note
5. Check bottom indicator shows "X changes pending sync"

**Expected Results:**
- Note saves successfully
- No error messages
- "Pending sync" counter increases
- Console shows: "💾 Note saved offline, will sync when online"

### Test Scenario 4: Sync When Reconnected

**Steps:**
1. Complete Test Scenario 3 (create offline notes)
2. **Reconnect to internet**
3. Wait 5-10 seconds
4. Watch the offline indicator

**Expected Results:**
- Indicator changes to "Syncing X items..."
- After completion: "All changes synced"
- Console shows: "✅ Synced 1 actions"
- Check Supabase database - note should appear

### Test Scenario 5: Progress Tracking Offline

**Steps:**
1. While offline, read a book
2. Navigate to page 50
3. Close the book
4. Reopen the same book
5. Verify it opens at page 50
6. Reconnect to internet
7. Check Supabase `reading_progress` table

**Expected Results:**
- Progress saved locally while offline
- Book reopens at correct page
- Progress syncs to backend when online
- Database shows correct page number

### Test Scenario 6: LRU Cache Eviction

**Steps:**
1. Download 11 books for offline (exceeds MAX_CACHED_BOOKS = 10)
2. Check which book was removed

**Expected Results:**
- Oldest/least recently accessed book removed automatically
- Most recently used 10 books remain cached
- Console shows: "🗑️ Removed 1 book(s) to enforce cache limit"

### Test Scenario 7: Server Unreachable

**Steps:**
1. Be online but block Supabase domain (use browser DevTools)
2. Try to access a non-cached book
3. Verify fallback behavior

**Expected Results:**
- Shows error: "Cannot connect to server"
- Suggests downloading books for offline
- No app crash

---

## 🔧 Configuration

### Cache Limits

Edit [bookCacheService.js:7-8](client2/src/services/bookCacheService.js#L7-L8):

```javascript
const MAX_CACHED_BOOKS = 10;        // Change to adjust cache size
const CACHE_EXPIRY_DAYS = 30;       // Change expiration period
```

### Sync Retry Settings

Edit [syncQueue.js:29](client2/src/services/syncQueue.js#L29):

```javascript
maxRetries: options.maxRetries || 3,  // Max retry attempts
```

### Sync Interval

Edit [syncManager.js:38](client2/src/services/syncManager.js#L38):

```javascript
}, 30000);  // Change from 30s to desired interval (milliseconds)
```

---

## 📊 Storage Estimates

### Typical Storage Usage

| Content Type | Size per Item | 10 Books | 50 Books |
|--------------|---------------|----------|----------|
| **PDF Book** | 5-20 MB | 50-200 MB | 250 MB - 1 GB |
| **EPUB Book** | 1-5 MB | 10-50 MB | 50-250 MB |
| **Notes** | 1-10 KB | ~10 KB | ~50 KB |
| **Progress** | 1 KB | ~10 KB | ~50 KB |
| **Metadata** | 5 KB | ~50 KB | ~250 KB |

### Check Available Storage

```javascript
import { getStorageEstimate } from './utils/indexedDB';

const estimate = await getStorageEstimate();
console.log('Storage:', estimate);
// Output: { usageInMB: 150, quotaInMB: 10000, percentage: 1.5 }
```

---

## 🐛 Troubleshooting

### Issue: "Storage not available"

**Cause:** Private browsing mode or IndexedDB disabled

**Solution:**
- Disable private browsing
- Check browser settings for IndexedDB
- Try different browser

### Issue: Book won't download

**Cause:** File too large or quota exceeded

**Solution:**
```javascript
const estimate = await getStorageEstimate();
if (estimate.percentage > 80) {
  // Remove old books
  await cleanupExpiredBooks();
}
```

### Issue: Sync not happening

**Cause:** Sync manager not started

**Solution:**
Check console for: "🔄 Sync Manager started"

If missing, manually start:
```javascript
import { syncManager } from './services/syncManager';
syncManager.start();
```

### Issue: Notes not syncing

**Cause:** Action failed permanently (max retries exceeded)

**Solution:**
Listen for permanent failures:
```javascript
window.addEventListener('sync-action-failed-permanently', (event) => {
  console.error('Failed action:', event.detail);
  // Show UI notification to user
});
```

### Issue: Cached book shows old version

**Cause:** Book updated on server but cache not invalidated

**Solution:**
Remove and re-download:
```javascript
await removeOfflineBook(bookId);
await downloadBook(bookUrl, metadata);
```

---

## 🔐 Security Considerations

### 1. User Data Isolation

IndexedDB is isolated per-origin and per-user profile. Books cached by one user cannot be accessed by another user on the same device.

### 2. File Validation

Before caching, validate file types:
```javascript
const allowedTypes = ['application/pdf', 'application/epub+zip'];
if (!allowedTypes.includes(fileType)) {
  throw new Error('Invalid file type');
}
```

### 3. Storage Limits

Enforce limits to prevent storage abuse:
- MAX_CACHED_BOOKS prevents unlimited downloads
- CACHE_EXPIRY_DAYS removes old content
- Storage quota checks prevent device fill-up

---

## 📈 Performance Optimization

### 1. Lazy Loading Books

Books are only downloaded when user clicks "Download for Offline", not automatically.

### 2. Background Preloading

Use `preloadBook()` for background caching during idle time:

```javascript
import { preloadBook } from './services/bookCacheService';

// Preload next book in reading list
preloadBook(nextBookId, bookData);
```

### 3. Chunk Processing

For batch operations, use concurrent limits:

```javascript
import { batchCacheBooks } from './services/bookCacheService';

await batchCacheBooks(books, {
  maxConcurrent: 2,  // Download 2 books at a time
  onProgress: (progress) => console.log(`${progress}% complete`),
});
```

---

## 🎯 Sync Queue Actions

### Available Action Types

From [syncQueue.js:5-11](client2/src/services/syncQueue.js#L5-L11):

```javascript
UPDATE_PROGRESS     // Reading progress updates
CREATE_NOTE         // New notes
UPDATE_NOTE         // Note edits
DELETE_NOTE         // Note deletions
CREATE_HIGHLIGHT    // Text highlights
DELETE_HIGHLIGHT    // Highlight removals
UPDATE_BOOKMARK     // Bookmark changes
```

### Queue Action Manually

```javascript
import { queueAction, SYNC_ACTIONS } from './services/syncQueue';

await queueAction(SYNC_ACTIONS.CREATE_NOTE, {
  bookId: '123',
  content: 'My note',
  page: 42,
}, {
  priority: 8,      // Higher = more important (1-10)
  maxRetries: 5,    // Override default retry count
});
```

---

## 🌐 Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| IndexedDB | ✅ | ✅ | ✅ | ✅ |
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Network Information API | ✅ | ❌ | ❌ | ✅ |
| Storage Estimate API | ✅ | ✅ | ✅ | ✅ |

**Note:** Network Information API gracefully degrades - basic online/offline detection works everywhere.

---

## 📚 Additional Resources

### Code References

- **IndexedDB API**: [indexedDB.js:11-39](client2/src/utils/indexedDB.js#L11-L39)
- **Sync Logic**: [syncManager.js:67-124](client2/src/services/syncManager.js#L67-L124)
- **Cache Management**: [bookCacheService.js:84-110](client2/src/services/bookCacheService.js#L84-L110)
- **Integration Hook**: [useOfflineReading.js:9-190](client2/src/hooks/useOfflineReading.js#L9-L190)

### Next Steps

1. **Service Worker Enhancement**: Add Background Sync API
2. **Compression**: Implement file compression for cached books
3. **Streaming**: Support progressive/streaming downloads
4. **Search**: Enable full-text search in offline books
5. **Analytics**: Track offline usage patterns

---

## ✅ Success Criteria

After implementation, verify:

- ✅ Books can be downloaded for offline access
- ✅ Downloaded books load without internet
- ✅ Notes can be created while offline
- ✅ Reading progress tracked offline
- ✅ All offline actions sync when reconnected
- ✅ Sync conflicts handled gracefully
- ✅ Cache automatically manages storage limits
- ✅ UI clearly indicates offline status
- ✅ No data loss during offline sessions
- ✅ Performance remains smooth with cached content

---

## 🎉 Deployment Checklist

Before deploying to production:

- [ ] Test all scenarios from Testing Guide
- [ ] Verify Supabase tables accept synced data
- [ ] Check storage quota on target devices
- [ ] Test on slow/unstable connections
- [ ] Verify service worker caching configured
- [ ] Add user documentation for offline feature
- [ ] Set up error monitoring for sync failures
- [ ] Test cache eviction under storage pressure
- [ ] Verify offline indicator is visible
- [ ] Check accessibility of offline UI

---

**Last Updated:** October 8, 2025
**Version:** 1.0
**Status:** ✅ Ready for Testing
