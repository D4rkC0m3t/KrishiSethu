// Krishisethu Inventory Management - Service Worker
// Version 1.0.0

const CACHE_NAME = 'krishisethu-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Resources to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/Logo_Horizontal_sidebar.png',
  OFFLINE_URL
];

// API endpoints to cache
const API_CACHE_URLS = [
  // Firebase endpoints will be cached dynamically
];

// Runtime cache configuration
const RUNTIME_CACHE = {
  images: {
    cacheName: 'krishisethu-images',
    maxEntries: 50,
    maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
  },
  api: {
    cacheName: 'krishisethu-api',
    maxEntries: 100,
    maxAgeSeconds: 5 * 60 // 5 minutes
  },
  fonts: {
    cacheName: 'krishisethu-fonts',
    maxEntries: 10,
    maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
  }
};

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log('[SW] Caching static resources');
        await cache.addAll(STATIC_CACHE_URLS);
        
        // Force activation of new service worker
        await self.skipWaiting();
      } catch (error) {
        console.error('[SW] Failed to cache static resources:', error);
      }
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  
  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        const deletePromises = cacheNames
          .filter(name => name !== CACHE_NAME && !name.startsWith('krishisethu-'))
          .map(name => caches.delete(name));
        
        await Promise.all(deletePromises);
        
        // Take control of all clients
        await self.clients.claim();
        
        console.log('[SW] Service worker activated and ready');
      } catch (error) {
        console.error('[SW] Activation failed:', error);
      }
    })()
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  event.respondWith(handleFetch(request));
});

// Handle fetch requests with different strategies
async function handleFetch(request) {
  const url = new URL(request.url);
  
  try {
    // Strategy 1: Network First for API calls (Firebase)
    if (url.hostname.includes('firebaseio.com') || 
        url.hostname.includes('googleapis.com') ||
        url.hostname.includes('firestore.googleapis.com')) {
      return await networkFirstStrategy(request, RUNTIME_CACHE.api);
    }
    
    // Strategy 2: Cache First for images
    if (request.destination === 'image') {
      return await cacheFirstStrategy(request, RUNTIME_CACHE.images);
    }
    
    // Strategy 3: Cache First for fonts
    if (url.pathname.includes('/fonts/') || request.destination === 'font') {
      return await cacheFirstStrategy(request, RUNTIME_CACHE.fonts);
    }
    
    // Strategy 4: Stale While Revalidate for static assets
    if (request.destination === 'script' || 
        request.destination === 'style' ||
        url.pathname.includes('/static/')) {
      return await staleWhileRevalidateStrategy(request);
    }
    
    // Strategy 5: Network First with offline fallback for navigation
    if (request.mode === 'navigate') {
      return await networkFirstWithOfflineFallback(request);
    }
    
    // Default: Network First
    return await networkFirstStrategy(request);
    
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const cache = await caches.open(CACHE_NAME);
      return await cache.match(OFFLINE_URL);
    }
    
    // Return a basic response for other requests
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Network First Strategy - try network, fallback to cache
async function networkFirstStrategy(request, cacheConfig = null) {
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok && cacheConfig) {
      const cache = await caches.open(cacheConfig.cacheName);
      cache.put(request, response.clone());
      
      // Clean up old entries
      await cleanupCache(cacheConfig.cacheName, cacheConfig.maxEntries);
    }
    
    return response;
  } catch (error) {
    // Fallback to cache
    const cache = await caches.open(cacheConfig?.cacheName || CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Cache First Strategy - try cache, fallback to network
async function cacheFirstStrategy(request, cacheConfig) {
  const cache = await caches.open(cacheConfig.cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Check if cache is expired
    const cacheDate = new Date(cachedResponse.headers.get('date') || 0);
    const now = new Date();
    const age = (now - cacheDate) / 1000;
    
    if (age < cacheConfig.maxAgeSeconds) {
      return cachedResponse;
    }
  }
  
  // Fetch from network and update cache
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
      await cleanupCache(cacheConfig.cacheName, cacheConfig.maxEntries);
    }
    
    return response;
  } catch (error) {
    // Return cached version even if expired
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Fetch in background to update cache
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    // Ignore network errors for background updates
  });
  
  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Wait for network if no cache
  return await fetchPromise;
}

// Network First with Offline Fallback for navigation
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    
    // Cache successful navigation responses
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Try cache first
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return await cache.match(OFFLINE_URL);
  }
}

// Clean up cache entries to maintain size limits
async function cleanupCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxEntries) {
    const keysToDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync-sales') {
    event.waitUntil(syncOfflineSales());
  } else if (event.tag === 'background-sync-inventory') {
    event.waitUntil(syncOfflineInventory());
  }
});

// Sync offline sales data
async function syncOfflineSales() {
  try {
    // Get offline sales from IndexedDB
    const offlineSales = await getOfflineData('sales');
    
    for (const sale of offlineSales) {
      try {
        // Attempt to sync with Firebase
        await syncSaleToFirebase(sale);
        await removeOfflineData('sales', sale.id);
      } catch (error) {
        console.error('[SW] Failed to sync sale:', sale.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Sync offline inventory updates
async function syncOfflineInventory() {
  try {
    const offlineUpdates = await getOfflineData('inventory');
    
    for (const update of offlineUpdates) {
      try {
        await syncInventoryToFirebase(update);
        await removeOfflineData('inventory', update.id);
      } catch (error) {
        console.error('[SW] Failed to sync inventory:', update.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Inventory sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from Krishisethu',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/logo192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/logo192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Krishisethu Inventory', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper functions for IndexedDB operations
async function getOfflineData(storeName) {
  // Implementation would use IndexedDB to get offline data
  return [];
}

async function removeOfflineData(storeName, id) {
  // Implementation would remove data from IndexedDB
}

async function syncSaleToFirebase(sale) {
  // Implementation would sync sale data to Firebase
}

async function syncInventoryToFirebase(update) {
  // Implementation would sync inventory update to Firebase
}

console.log('[SW] Service Worker loaded successfully');
