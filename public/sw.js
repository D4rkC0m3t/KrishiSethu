// Krishisethu Inventory Management - Service Worker
// Version 1.0.1

const CACHE_VERSION = '1.0.1';
const CACHE_NAME = `krishisethu-v${CACHE_VERSION}`;
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
        
        // Don't skip waiting automatically - let the app control updates
        console.log(`[SW] Service worker v${CACHE_VERSION} installed, waiting for activation`);

        // Notify clients about update availability
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'UPDATE_AVAILABLE',
              version: CACHE_VERSION,
              details: {
                version: CACHE_VERSION,
                features: [
                  'Enhanced offline capabilities',
                  'Improved barcode scanning',
                  'Better notification system',
                  'Performance improvements'
                ]
              }
            });
          });
        });
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
  console.log('[SW] Background sync triggered:', event.tag);

  switch (event.tag) {
    case 'background-sync-sales':
      event.waitUntil(syncOfflineSales());
      break;
    case 'background-sync-inventory':
      event.waitUntil(syncOfflineInventory());
      break;
    case 'background-sync-all':
      event.waitUntil(syncAllOfflineData());
      break;
    default:
      console.log('[SW] Unknown sync tag:', event.tag);
  }
});

// Sync offline sales data
async function syncOfflineSales() {
  try {
    console.log('[SW] Starting offline sales sync...');

    // Get offline sales from IndexedDB
    const offlineSales = await getOfflineData('offline_sales');

    if (offlineSales.length === 0) {
      console.log('[SW] No offline sales to sync');
      return;
    }

    console.log(`[SW] Found ${offlineSales.length} offline sales to sync`);

    let syncedCount = 0;
    let failedCount = 0;

    for (const sale of offlineSales) {
      try {
        // Attempt to sync with Firebase
        await syncSaleToFirebase(sale);

        // Mark as synced instead of removing (for audit trail)
        await markDataSynced('offline_sales', sale.id);

        syncedCount++;
        console.log(`[SW] Successfully synced sale: ${sale.id}`);
      } catch (error) {
        failedCount++;
        console.error('[SW] Failed to sync sale:', sale.id, error);

        // Don't throw here, continue with other sales
      }
    }

    console.log(`[SW] Sales sync completed: ${syncedCount} synced, ${failedCount} failed`);

    // Send notification about sync results
    if (syncedCount > 0) {
      self.registration.showNotification('Sales Synced', {
        body: `${syncedCount} offline sales have been synced to the server.`,
        icon: '/logo192.png',
        tag: 'sales-sync'
      });
    }
  } catch (error) {
    console.error('[SW] Background sales sync failed:', error);
  }
}

// Sync offline inventory updates
async function syncOfflineInventory() {
  try {
    console.log('[SW] Starting offline inventory sync...');

    const offlineUpdates = await getOfflineData('offline_inventory');

    if (offlineUpdates.length === 0) {
      console.log('[SW] No offline inventory updates to sync');
      return;
    }

    console.log(`[SW] Found ${offlineUpdates.length} offline inventory updates to sync`);

    let syncedCount = 0;
    let failedCount = 0;

    for (const update of offlineUpdates) {
      try {
        await syncInventoryToFirebase(update);

        // Mark as synced instead of removing
        await markDataSynced('offline_inventory', update.id);

        syncedCount++;
        console.log(`[SW] Successfully synced inventory update: ${update.id}`);
      } catch (error) {
        failedCount++;
        console.error('[SW] Failed to sync inventory update:', update.id, error);
      }
    }

    console.log(`[SW] Inventory sync completed: ${syncedCount} synced, ${failedCount} failed`);

    // Send notification about sync results
    if (syncedCount > 0) {
      self.registration.showNotification('Inventory Synced', {
        body: `${syncedCount} inventory updates have been synced to the server.`,
        icon: '/logo192.png',
        tag: 'inventory-sync'
      });
    }
  } catch (error) {
    console.error('[SW] Inventory sync failed:', error);
  }
}

// Sync all offline data
async function syncAllOfflineData() {
  try {
    console.log('[SW] Starting complete offline data sync...');

    await Promise.all([
      syncOfflineSales(),
      syncOfflineInventory()
    ]);

    console.log('[SW] Complete offline data sync finished');
  } catch (error) {
    console.error('[SW] Complete sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  let notificationData = {
    title: 'Krishisethu Inventory',
    body: 'New notification from Krishisethu',
    type: 'general'
  };

  // Parse push data if available
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (error) {
      console.warn('[SW] Failed to parse push data, using text:', error);
      notificationData.body = event.data.text();
    }
  }

  // Configure notification based on type
  const options = {
    body: notificationData.body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
    requireInteraction: notificationData.requireInteraction || false,
    silent: notificationData.silent || false,
    tag: notificationData.tag || 'general',
    data: {
      ...notificationData,
      dateOfArrival: Date.now(),
      url: notificationData.url || '/'
    }
  };

  // Add actions based on notification type
  switch (notificationData.type) {
    case 'lowStock':
    case 'outOfStock':
      options.actions = [
        { action: 'view-inventory', title: 'View Inventory', icon: '/logo192.png' },
        { action: 'reorder', title: 'Reorder', icon: '/logo192.png' },
        { action: 'dismiss', title: 'Dismiss', icon: '/logo192.png' }
      ];
      options.requireInteraction = true;
      break;

    case 'expiring':
    case 'expired':
      options.actions = [
        { action: 'view-product', title: 'View Product', icon: '/logo192.png' },
        { action: 'apply-discount', title: 'Apply Discount', icon: '/logo192.png' },
        { action: 'dismiss', title: 'Dismiss', icon: '/logo192.png' }
      ];
      options.requireInteraction = true;
      break;

    case 'sale':
      options.actions = [
        { action: 'view-receipt', title: 'View Receipt', icon: '/logo192.png' },
        { action: 'print-receipt', title: 'Print', icon: '/logo192.png' },
        { action: 'dismiss', title: 'Dismiss', icon: '/logo192.png' }
      ];
      break;

    case 'sync':
      options.actions = [
        { action: 'open-app', title: 'Open App', icon: '/logo192.png' },
        { action: 'dismiss', title: 'Dismiss', icon: '/logo192.png' }
      ];
      break;

    default:
      options.actions = [
        { action: 'open-app', title: 'Open App', icon: '/logo192.png' },
        { action: 'dismiss', title: 'Dismiss', icon: '/logo192.png' }
      ];
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event);

  event.notification.close();

  const notificationData = event.notification.data || {};
  const action = event.action;

  // Handle different actions
  let targetUrl = '/';

  switch (action) {
    case 'view-inventory':
      targetUrl = '/inventory';
      if (notificationData.productId) {
        targetUrl += `?highlight=${notificationData.productId}`;
      }
      break;

    case 'view-product':
      if (notificationData.productId) {
        targetUrl = `/inventory?highlight=${notificationData.productId}`;
      } else {
        targetUrl = '/inventory';
      }
      break;

    case 'reorder':
      targetUrl = '/inventory';
      // Could add reorder functionality here
      break;

    case 'apply-discount':
      targetUrl = '/pos';
      // Could pre-populate discount for the product
      break;

    case 'view-receipt':
      if (notificationData.saleId) {
        targetUrl = `/sales?receipt=${notificationData.saleId}`;
      } else {
        targetUrl = '/sales';
      }
      break;

    case 'print-receipt':
      // Handle print action
      targetUrl = '/pos';
      break;

    case 'open-app':
    case 'explore':
      targetUrl = notificationData.url || '/';
      break;

    case 'dismiss':
      // Just close the notification, don't open anything
      return;

    default:
      // Default click (not on action button)
      targetUrl = notificationData.url || '/';
  }

  // Open the target URL
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          // Focus existing window and navigate
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            action: action,
            data: notificationData,
            targetUrl: targetUrl
          });
          return;
        }
      }

      // Open new window if app is not open
      return clients.openWindow(targetUrl);
    })
  );
});

// IndexedDB helper functions for offline storage
class ServiceWorkerOfflineDB {
  constructor() {
    this.dbName = 'KrishisethuOfflineDB';
    this.dbVersion = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getOfflineData(storeName) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        // Return only unsynced data
        const unsyncedData = request.result.filter(item => !item.synced);
        resolve(unsyncedData);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async removeOfflineData(storeName, id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async markDataSynced(storeName, id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      // Get the item first
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.synced = true;
          item.syncedAt = new Date().toISOString();

          const putRequest = store.put(item);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve(); // Item not found, consider it handled
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }
}

// Create instance for service worker
const swOfflineDB = new ServiceWorkerOfflineDB();

// Helper functions for IndexedDB operations
async function getOfflineData(storeName) {
  try {
    return await swOfflineDB.getOfflineData(storeName);
  } catch (error) {
    console.error('[SW] Error getting offline data:', error);
    return [];
  }
}

async function removeOfflineData(storeName, id) {
  try {
    await swOfflineDB.removeOfflineData(storeName, id);
  } catch (error) {
    console.error('[SW] Error removing offline data:', error);
  }
}

async function markDataSynced(storeName, id) {
  try {
    await swOfflineDB.markDataSynced(storeName, id);
  } catch (error) {
    console.error('[SW] Error marking data as synced:', error);
  }
}

async function syncSaleToFirebase(sale) {
  try {
    // Simulate Firebase API call
    const response = await fetch('/api/sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sale)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('[SW] Sale synced to Firebase:', sale.id);
    return true;
  } catch (error) {
    console.error('[SW] Error syncing sale to Firebase:', error);
    throw error;
  }
}

async function syncInventoryToFirebase(update) {
  try {
    // Simulate Firebase API call
    const response = await fetch('/api/inventory', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(update)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('[SW] Inventory update synced to Firebase:', update.id);
    return true;
  } catch (error) {
    console.error('[SW] Error syncing inventory to Firebase:', error);
    throw error;
  }
}

// Message handling for app updates and communication
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    // Skip waiting and activate the new service worker
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CHECK_FOR_UPDATES') {
    // Check for updates (could trigger update check logic)
    console.log('[SW] Update check requested');

    // For now, just respond that we're the current version
    event.ports[0]?.postMessage({
      type: 'UPDATE_CHECK_COMPLETE',
      version: CACHE_VERSION
    });
  }
});

console.log('[SW] Service Worker loaded successfully');
