# PWA Configuration Guide

**Last Updated:** October 8, 2025

## Overview

Literati is configured as a Progressive Web App (PWA) using **vite-plugin-pwa** with Workbox. This setup provides offline functionality, app-like experience, and installability across all platforms.

`✶ Insight ─────────────────────────────────────`
**Why vite-plugin-pwa?**
- Integrates seamlessly with Vite's build process
- Uses Google's Workbox for robust caching strategies
- Automatic service worker generation with no manual coding
- TypeScript support and excellent developer experience
- Production-ready with zero configuration needed
`─────────────────────────────────────────────────`

---

## Architecture

### Single Service Worker Approach ✅

The application uses **ONLY** `vite-plugin-pwa` for service worker management. Previous implementations have been removed:

- ❌ **Removed:** `public/sw-cache.js` (355-line custom service worker)
- ❌ **Removed:** `src/utils/serviceWorkerRegistration.js` (manual registration utility)
- ✅ **Current:** vite-plugin-pwa with Workbox (configured in `vite.config.mjs`)

This eliminates:
- Duplicate cache entries
- Console log spam
- Service worker conflicts
- 404 errors for missing SW files

---

## Configuration Files

### 1. Vite PWA Plugin (`client2/vite.config.mjs`)

```javascript
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: [
    'favicon.ico',
    'literatiLOGO.png',
    'literati512.png',
    'favicon-96x96.png',
    'literatiLOGO_144x153.png'
  ],

  // Use public/manifest.json directly
  manifest: false,

  workbox: {
    // SPA routing support
    navigateFallback: '/index.html',
    navigateFallbackDenylist: [/^\/api/, /\.(pdf|epub)$/],

    // Precaching patterns
    globPatterns: [
      '**/*.{js,css,html,ico,png,svg,woff,woff2}',
      '**/manifest.json'
    ],

    // Cache management
    cleanupOutdatedCaches: true,
    skipWaiting: true,
    clientsClaim: true,

    // Runtime caching strategies (see below)
    runtimeCaching: [...]
  },

  // Disable SW in development
  devOptions: {
    enabled: false,
    type: 'module',
    navigateFallback: 'index.html',
  },
})
```

### 2. Service Worker Registration (`client2/src/main.jsx`)

```javascript
import { registerSW } from 'virtual:pwa-register';

const shouldRegisterSW = import.meta.env.PROD &&
  (import.meta.env.VITE_ENABLE_SERVICE_WORKER !== 'false');

if (shouldRegisterSW) {
  const updateSW = registerSW({
    immediate: true,

    onNeedRefresh() {
      // Prompt user to update
      if (window.confirm('New content available! Click OK to refresh.')) {
        updateSW(true);
      }
    },

    onOfflineReady() {
      console.log('[PWA] App ready to work offline');
    },

    onRegistered(registration) {
      // Check for updates every hour
      setInterval(() => {
        registration?.update();
      }, 60 * 60 * 1000);
    },
  });
}
```

### 3. Web App Manifest (`client2/public/manifest.json`)

Comprehensive manifest with:
- ✅ App metadata (name, description, theme colors)
- ✅ Multiple icon sizes (96px to 512px)
- ✅ Maskable icons for Android
- ✅ App shortcuts (Library, Upload, Dashboard)
- ✅ Screenshots for app stores
- ✅ Protocol handlers (`web+literati://`)

---

## Caching Strategies

### 1. API Calls (`NetworkFirst`)

```javascript
{
  urlPattern: /^https:\/\/library-server-m6gr\.onrender\.com\/api\/.*/i,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'literati-api-cache',
    networkTimeoutSeconds: 10,
    expiration: {
      maxEntries: 100,
      maxAgeSeconds: 60 * 60 * 24 // 24 hours
    }
  }
}
```

**How it works:**
- Tries network first with 10-second timeout
- Falls back to cache if network fails
- Perfect for API data that changes frequently

---

### 2. Book Files - PDFs & EPUBs (`CacheFirst`)

```javascript
{
  urlPattern: ({ url }) => {
    return url.pathname.includes('.pdf') ||
           url.pathname.includes('.epub') ||
           url.hostname.includes('supabase.co');
  },
  handler: 'CacheFirst',
  options: {
    cacheName: 'literati-books-cache',
    expiration: {
      maxEntries: 50, // Up to 50 books offline
      maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
    }
  }
}
```

**How it works:**
- Serves from cache immediately if available
- Downloads from network only if not cached
- Stores up to 50 books for offline reading
- Perfect for large, static files

---

### 3. Book Covers & Images (`StaleWhileRevalidate`)

```javascript
{
  urlPattern: ({ request, url }) => {
    return request.destination === 'image' ||
           url.hostname.includes('covers.openlibrary.org') ||
           url.hostname.includes('picsum.photos') ||
           url.pathname.includes('/covers/');
  },
  handler: 'StaleWhileRevalidate',
  options: {
    cacheName: 'literati-images-cache',
    expiration: {
      maxEntries: 200,
      maxAgeSeconds: 60 * 60 * 24 * 14 // 14 days
    }
  }
}
```

**How it works:**
- Serves cached version immediately
- Updates cache in background
- Always shows content fast, even if slightly stale
- Perfect for images that don't change often

---

### 4. Google Fonts & Material Icons (`CacheFirst`)

```javascript
{
  urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
  handler: 'CacheFirst',
  options: {
    cacheName: 'literati-fonts-cache',
    expiration: {
      maxEntries: 30,
      maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
    }
  }
}
```

**How it works:**
- Fonts never change once loaded
- Cache for 1 year
- Instant font loading on repeat visits

---

### 5. Static Assets - JS/CSS (`StaleWhileRevalidate`)

```javascript
{
  urlPattern: ({ request }) =>
    ['style', 'script', 'worker'].includes(request.destination),
  handler: 'StaleWhileRevalidate',
  options: {
    cacheName: 'literati-assets-cache',
    expiration: {
      maxEntries: 100,
      maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
    }
  }
}
```

**How it works:**
- Similar to images: fast serve + background update
- Ensures app always loads quickly
- Updates happen transparently

---

## Build Output

When you run `pnpm run build`, the PWA plugin generates:

```
dist/
├── sw.js              # Generated service worker (6.2 KB)
├── sw.js.map          # Source map for debugging
├── workbox-*.js       # Workbox runtime library (23 KB)
├── workbox-*.js.map   # Workbox source map
└── manifest.json      # Web app manifest (copied from public/)
```

### Build Statistics (Latest Build)

```
PWA v1.0.3
mode      generateSW
precache  63 entries (6059.34 KB)
files generated
  dist/sw.js.map
  dist/sw.js
  dist/workbox-29afe8fa.js.map
  dist/workbox-29afe8fa.js
```

**Precached Resources:**
- All JS bundles (33 files)
- All CSS files
- All icons and images
- HTML files
- Manifest

---

## Testing Offline Functionality

### 1. Development Testing

Service worker is **disabled** in development to avoid cache conflicts. To test PWA features:

```bash
# Build production version
cd client2
pnpm run build

# Serve production build locally
pnpm run preview

# Open http://localhost:5174
```

### 2. Chrome DevTools Testing

1. Open DevTools → Application tab
2. Service Workers section:
   - ✅ Should show "sw.js" registered
   - ✅ Status: "activated and running"
3. Cache Storage:
   - `literati-api-cache`
   - `literati-books-cache`
   - `literati-images-cache`
   - `literati-fonts-cache`
   - `literati-assets-cache`
   - `workbox-precache-v2-https://literati.pro/`

### 3. Offline Mode Testing

1. Load the app normally
2. DevTools → Network tab → Check "Offline"
3. Refresh the page
4. ✅ App should load from cache
5. ✅ Previously viewed books should be readable
6. ✅ UI should display normally

---

## Production Deployment

### Environment Variables

Control service worker registration in production:

```bash
# .env.production
VITE_ENABLE_SERVICE_WORKER=true  # Enable PWA (default)

# To disable temporarily:
# VITE_ENABLE_SERVICE_WORKER=false
```

### Vercel Configuration

Vercel automatically serves the generated service worker:

- `sw.js` → `/sw.js`
- `manifest.json` → `/manifest.json`
- No additional configuration needed!

### HTTPS Requirement

⚠️ **Service workers ONLY work over HTTPS** (except localhost)

- ✅ Production: `https://literati.pro` (HTTPS)
- ✅ Staging: `https://staging-literati.vercel.app` (HTTPS)
- ✅ Development: `http://localhost:5173` (allowed exception)

---

## Acceptance Criteria ✅

Based on the deployment task requirements:

### ✅ Single Service Worker Approach
- Using vite-plugin-pwa exclusively
- Removed custom `sw-cache.js`
- Removed manual registration utility

### ✅ No 404 Errors
- Service worker generates correctly at build time
- No references to non-existent files
- All assets properly precached

### ✅ No Duplicate Service Workers
- Only one SW registered: `sw.js`
- No caching loops or duplicate logs
- Clean console output

### ✅ Comprehensive Manifest
- ✅ Name: "Literati - Your Digital Bookshelf"
- ✅ Icons: 96px, 144px, 192px, 512px (including maskable)
- ✅ Theme color: `#6750a4` (Material You primary)
- ✅ Background color: `#fff7fe`
- ✅ Display: `standalone`
- ✅ App shortcuts defined
- ✅ Screenshots included

### ✅ HTTPS Served
- Production: `https://literati.pro`
- Staging: Vercel HTTPS
- All environments secure

### ✅ Offline Content Loads
- **PDFs:** Cached with `CacheFirst` (up to 50 books)
- **Images:** Cached with `StaleWhileRevalidate` (up to 200 images)
- **API:** NetworkFirst with cache fallback
- **Assets:** Precached at build time

---

## Troubleshooting

### Issue: Service worker not updating

**Solution:**
```javascript
// In DevTools → Application → Service Workers
// Click "Update on reload"
// Or click "Unregister" and refresh
```

### Issue: Cache taking up too much space

**Solution:** Adjust `maxEntries` in `vite.config.mjs`:

```javascript
expiration: {
  maxEntries: 30, // Reduce from 50 for books
  maxAgeSeconds: 60 * 60 * 24 * 7 // Reduce to 7 days
}
```

### Issue: Old content showing after update

**Solution:** Service worker auto-updates every hour. Force update:

```javascript
// User clicks "Update Available" notification
updateSW(true); // Already implemented!
```

### Issue: PWA not installable

**Checklist:**
- [ ] HTTPS enabled
- [ ] `manifest.json` valid and accessible
- [ ] Icons include 192px and 512px sizes
- [ ] `display: "standalone"` in manifest
- [ ] Service worker registered successfully

---

## Future Enhancements

### 1. Background Sync

Add offline reading session sync:

```javascript
// When user reads offline, queue sessions
// Sync when network returns

workbox: {
  backgroundSync: {
    name: 'reading-sessions',
    options: {
      maxRetentionTime: 24 * 60 // 24 hours
    }
  }
}
```

### 2. Push Notifications

Notify users about:
- New books in their library
- Reading goals achieved
- Friend recommendations

```javascript
// Requires backend notification service
// Firebase Cloud Messaging integration
```

### 3. Advanced Caching

Per-book caching control:

```javascript
// Let users choose which books to keep offline
// "Download for offline reading" button
// Stores in IndexedDB + Service Worker cache
```

---

## References

- [vite-plugin-pwa Documentation](https://vite-pwa-org.netlify.app/)
- [Workbox Caching Strategies](https://developer.chrome.com/docs/workbox/modules/workbox-strategies/)
- [PWA Manifest Specification](https://www.w3.org/TR/appmanifest/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

## Summary

**Current State:** ✅ Production-ready PWA configuration

**Key Features:**
- Offline reading for cached books
- Fast loading with intelligent caching
- Automatic updates with user notification
- Installable on all platforms
- Clean, conflict-free implementation

**Performance:**
- 63 precached entries
- 5 runtime cache strategies
- Automatic cache cleanup
- Optimized for book reading experience

The PWA is now configured to provide an app-like experience with robust offline functionality, perfect for a digital library application! 📚
