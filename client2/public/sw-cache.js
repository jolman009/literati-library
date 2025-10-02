// public/sw-cache.js
// Service Worker for advanced caching strategies

const CACHE_VERSION = 'v1.2.0';
const CACHE_NAME = `literati-cache-${CACHE_VERSION}`;

// Cache strategies for different resource types
const CACHE_STRATEGIES = {
  // Static assets - cache first with long TTL
  STATIC: {
    name: `${CACHE_NAME}-static`,
    strategy: 'CacheFirst',
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 100
  },
  
  // API responses - network first with cache fallback
  API: {
    name: `${CACHE_NAME}-api`,
    strategy: 'NetworkFirst',
    ttl: 10 * 60 * 1000, // 10 minutes
    maxEntries: 200
  },
  
  // Book covers - cache first with background sync
  COVERS: {
    name: `${CACHE_NAME}-covers`,
    strategy: 'CacheFirst',
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 1000
  },
  
  // Book files - cache only when explicitly requested
  FILES: {
    name: `${CACHE_NAME}-files`,
    strategy: 'CacheOnly',
    ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 50
  }
};

/**
 * Determine cache strategy based on request
 */
function getCacheStrategy(request) {
  const url = new URL(request.url);
  
  // API requests
  if (url.pathname.startsWith('/api/')) {
    return CACHE_STRATEGIES.API;
  }
  
  // Book covers
  if (url.pathname.includes('/covers/') || 
      url.hostname.includes('covers.openlibrary.org') ||
      url.hostname.includes('picsum.photos')) {
    return CACHE_STRATEGIES.COVERS;
  }
  
  // Book files (PDF, EPUB)
  if (url.pathname.includes('.pdf') || url.pathname.includes('.epub')) {
    return CACHE_STRATEGIES.FILES;
  }
  
  // Static assets
  if (request.destination === 'script' || 
      request.destination === 'style' ||
      request.destination === 'image' ||
      url.pathname.includes('/assets/')) {
    return CACHE_STRATEGIES.STATIC;
  }
  
  return CACHE_STRATEGIES.API; // Default fallback
}

/**
 * Cache First Strategy
 */
async function cacheFirst(request, cacheStrategy) {
  try {
    const cache = await caches.open(cacheStrategy.name);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Check if cache is still fresh
      const cacheTime = cachedResponse.headers.get('sw-cache-time');
      if (cacheTime && Date.now() - parseInt(cacheTime) < cacheStrategy.ttl) {
        console.log(`💾 Cache hit (fresh): ${request.url}`);
        return cachedResponse;
      }
    }
    
    // Fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone and cache the response
      const responseToCache = networkResponse.clone();
      responseToCache.headers.set('sw-cache-time', Date.now().toString());
      
      cache.put(request, responseToCache);
      console.log(`⚡ Network response cached: ${request.url}`);
    }
    
    return networkResponse;
    
  } catch (error) {
    // Return stale cache on network error
    const cache = await caches.open(cacheStrategy.name);
    const staleResponse = await cache.match(request);
    
    if (staleResponse) {
      console.log(`📱 Network error: returning stale cache for ${request.url}`);
      return staleResponse;
    }
    
    throw error;
  }
}

/**
 * Network First Strategy
 */
async function networkFirst(request, cacheStrategy) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(cacheStrategy.name);
      const responseToCache = networkResponse.clone();
      responseToCache.headers.set('sw-cache-time', Date.now().toString());
      
      cache.put(request, responseToCache);
      console.log(`⚡ API response cached: ${request.url}`);
    }
    
    return networkResponse;
    
  } catch (error) {
    // Fallback to cache
    const cache = await caches.open(cacheStrategy.name);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log(`📱 Network error: using cached response for ${request.url}`);
      return cachedResponse;
    }
    
    // Return offline response for API requests
    if (request.url.includes('/api/')) {
      return new Response(JSON.stringify({
        error: 'Network unavailable',
        offline: true,
        message: 'This data is not available offline'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

/**
 * Cache management and cleanup
 */
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => 
    name.startsWith('literati-cache-') && name !== CACHE_NAME
  );
  
  await Promise.all(oldCaches.map(name => caches.delete(name)));
  console.log(`🗑️ Cleaned up ${oldCaches.length} old caches`);
}

/**
 * Enforce cache size limits
 */
async function enforceCacheLimits() {
  for (const [key, strategy] of Object.entries(CACHE_STRATEGIES)) {
    try {
      const cache = await caches.open(strategy.name);
      const keys = await cache.keys();
      
      if (keys.length > strategy.maxEntries) {
        // Sort by cache time and remove oldest entries
        const keyPromises = keys.map(async (request) => {
          const response = await cache.match(request);
          const cacheTime = response?.headers.get('sw-cache-time') || '0';
          return { request, cacheTime: parseInt(cacheTime) };
        });
        
        const keysWithTime = await Promise.all(keyPromises);
        keysWithTime.sort((a, b) => a.cacheTime - b.cacheTime);
        
        const toDelete = keysWithTime.slice(0, keys.length - strategy.maxEntries);
        await Promise.all(toDelete.map(item => cache.delete(item.request)));
        
        console.log(`🗑️ Cleaned ${toDelete.length} entries from ${strategy.name}`);
      }
    } catch (error) {
      console.error(`Cache cleanup failed for ${key}:`, error);
    }
  }
}

/**
 * Background sync for offline actions
 */
async function handleBackgroundSync(event) {
  if (event.tag === 'reading-session-sync') {
    try {
      // Get queued reading sessions from IndexedDB
      const db = await openDB();
      const tx = db.transaction(['sync_queue'], 'readonly');
      const queue = await tx.objectStore('sync_queue').getAll();
      
      for (const item of queue) {
        try {
          await fetch('/api/reading/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data)
          });
          
          // Remove from queue after successful sync
          const deleteTx = db.transaction(['sync_queue'], 'readwrite');
          await deleteTx.objectStore('sync_queue').delete(item.id);
          
        } catch (error) {
          console.error('Background sync failed for item:', item.id, error);
        }
      }
    } catch (error) {
      console.error('Background sync error:', error);
    }
  }
}

/**
 * Open IndexedDB for offline sync
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LiteratiSync', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Service Worker Event Handlers
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Pre-cache critical resources
      caches.open(CACHE_STRATEGIES.STATIC.name).then(cache => {
        return cache.addAll([
          '/',
          '/manifest.json',
          // Add other critical assets
        ]);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      cleanupOldCaches(),
      
      // Claim all clients
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests for caching
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip requests with cache-control: no-cache
  if (event.request.headers.get('cache-control') === 'no-cache') {
    return;
  }
  
  const cacheStrategy = getCacheStrategy(event.request);
  
  event.respondWith(
    (async () => {
      try {
        switch (cacheStrategy.strategy) {
          case 'CacheFirst':
            return await cacheFirst(event.request, cacheStrategy);
          
          case 'NetworkFirst':
            return await networkFirst(event.request, cacheStrategy);
          
          case 'CacheOnly':
            const cache = await caches.open(cacheStrategy.name);
            return await cache.match(event.request) || 
                   new Response('Not cached', { status: 404 });
          
          default:
            return fetch(event.request);
        }
      } catch (error) {
        console.error('Fetch handler error:', error);
        return new Response('Service Unavailable', { status: 503 });
      }
    })()
  );
});

self.addEventListener('backgroundsync', (event) => {
  event.waitUntil(handleBackgroundSync(event));
});

// Periodic cache cleanup
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEANUP_CACHES') {
    event.waitUntil(
      Promise.all([
        cleanupOldCaches(),
        enforceCacheLimits()
      ])
    );
  }
});

// Cleanup every hour
setInterval(() => {
  enforceCacheLimits();
}, 60 * 60 * 1000);