// PWA Utilities for Krishisethu Inventory Management

// Service Worker Registration
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[PWA] Service Worker registered successfully:', registration);

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker is available
            showUpdateAvailableNotification();
          }
        });
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
          console.log('[PWA] Cache updated:', event.data.payload);
        }
      });

      return registration;
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
      return null;
    }
  } else {
    console.log('[PWA] Service Worker not supported');
    return null;
  }
};

// Show update available notification
const showUpdateAvailableNotification = () => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('App Update Available', {
      body: 'A new version of Krishisethu is available. Refresh to update.',
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: 'app-update',
      requireInteraction: true,
      actions: [
        {
          action: 'update',
          title: 'Update Now'
        },
        {
          action: 'dismiss',
          title: 'Later'
        }
      ]
    });
  } else {
    // Fallback to browser notification
    const updateBanner = document.createElement('div');
    updateBanner.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #3b82f6;
        color: white;
        padding: 12px;
        text-align: center;
        z-index: 9999;
        font-family: system-ui;
      ">
        <span>New version available!</span>
        <button onclick="window.location.reload()" style="
          background: white;
          color: #3b82f6;
          border: none;
          padding: 4px 12px;
          margin-left: 12px;
          border-radius: 4px;
          cursor: pointer;
        ">Update</button>
        <button onclick="this.parentElement.remove()" style="
          background: transparent;
          color: white;
          border: 1px solid white;
          padding: 4px 12px;
          margin-left: 8px;
          border-radius: 4px;
          cursor: pointer;
        ">Later</button>
      </div>
    `;
    document.body.appendChild(updateBanner);
  }
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    console.log('[PWA] Notification permission:', permission);
    return permission === 'granted';
  }
  return false;
};

// Check if app is installed
export const isAppInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
};

// Get device information
export const getDeviceInfo = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  
  return {
    isMobile: /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent),
    isTablet: /ipad/.test(userAgent) || (platform === 'macintel' && navigator.maxTouchPoints > 1),
    isIOS: /ipad|iphone|ipod/.test(userAgent),
    isAndroid: /android/.test(userAgent),
    isStandalone: isAppInstalled(),
    hasTouch: 'ontouchstart' in window,
    orientation: window.screen?.orientation?.type || 'unknown',
    pixelRatio: window.devicePixelRatio || 1,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight
  };
};

// Handle offline/online status
export const setupNetworkStatusHandling = (onOnline, onOffline) => {
  const handleOnline = async () => {
    console.log('[PWA] Back online');
    if (onOnline) onOnline();

    // Show online notification
    showNetworkStatusNotification('online');

    // Trigger background sync if available
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;

        // Register different sync tags for different data types
        await registration.sync.register('background-sync-all');
        await registration.sync.register('background-sync-sales');
        await registration.sync.register('background-sync-inventory');

        console.log('[PWA] Background sync registered successfully');

        // Show sync notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Syncing Data', {
            body: 'Syncing offline data with server...',
            icon: '/logo192.png',
            tag: 'sync-notification'
          });
        }
      } catch (error) {
        console.error('[PWA] Failed to register background sync:', error);
      }
    }
  };

  const handleOffline = () => {
    console.log('[PWA] Gone offline');
    if (onOffline) onOffline();

    // Show offline notification
    showNetworkStatusNotification('offline');
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// Show network status notification
const showNetworkStatusNotification = (status) => {
  const isOnline = status === 'online';
  const message = isOnline ? 'Back online! Syncing data...' : 'You\'re offline. Some features may be limited.';
  const color = isOnline ? '#10b981' : '#f59e0b';
  
  // Create toast notification
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: 20px;
    background: ${color};
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-family: system-ui;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(100px);
    transition: transform 0.3s ease;
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateY(0)';
  }, 100);
  
  // Remove after delay
  setTimeout(() => {
    toast.style.transform = 'translateY(100px)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
};

// Setup background sync
export const setupBackgroundSync = () => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then(registration => {
      // Register sync events
      const syncTags = ['background-sync-sales', 'background-sync-inventory', 'background-sync-all'];

      syncTags.forEach(tag => {
        registration.sync.register(tag).catch(error => {
          console.error(`[PWA] Background sync registration failed for ${tag}:`, error);
        });
      });
    });
  }
};

// Manually trigger background sync
export const triggerBackgroundSync = async (syncType = 'all') => {
  if (!('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype)) {
    console.warn('[PWA] Background sync not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    const syncTag = syncType === 'all' ? 'background-sync-all' : `background-sync-${syncType}`;
    await registration.sync.register(syncTag);

    console.log(`[PWA] Background sync triggered: ${syncTag}`);

    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Sync Started', {
        body: `Syncing ${syncType} data...`,
        icon: '/logo192.png',
        tag: 'manual-sync'
      });
    }

    return true;
  } catch (error) {
    console.error('[PWA] Failed to trigger background sync:', error);
    return false;
  }
};

// Check for pending offline data
export const checkOfflineData = async () => {
  try {
    // Import offline storage dynamically to avoid circular dependencies
    const { default: offlineStorage } = await import('../lib/offlineStorage');

    const unsyncedData = await offlineStorage.getUnsyncedData();

    if (unsyncedData.totalUnsynced > 0) {
      console.log(`[PWA] Found ${unsyncedData.totalUnsynced} unsynced items`);

      // Show notification about pending data
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Offline Data Pending', {
          body: `${unsyncedData.totalUnsynced} items waiting to sync`,
          icon: '/logo192.png',
          tag: 'offline-data-pending',
          actions: [
            {
              action: 'sync-now',
              title: 'Sync Now'
            }
          ]
        });
      }
    }

    return unsyncedData;
  } catch (error) {
    console.error('[PWA] Error checking offline data:', error);
    return { sales: [], inventory: [], totalUnsynced: 0 };
  }
};

// Cache management
export const clearAppCache = async () => {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('[PWA] All caches cleared');
      return true;
    } catch (error) {
      console.error('[PWA] Error clearing caches:', error);
      return false;
    }
  }
  return false;
};

// Get cache storage usage
export const getCacheStorageUsage = async () => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage,
        available: estimate.quota,
        usedMB: Math.round(estimate.usage / 1024 / 1024 * 100) / 100,
        availableMB: Math.round(estimate.quota / 1024 / 1024 * 100) / 100,
        usagePercentage: Math.round((estimate.usage / estimate.quota) * 100)
      };
    } catch (error) {
      console.error('[PWA] Error getting storage estimate:', error);
      return null;
    }
  }
  return null;
};

// Handle app shortcuts
export const handleAppShortcuts = (onNavigate) => {
  // Handle URL shortcuts
  const urlParams = new URLSearchParams(window.location.search);
  const shortcut = urlParams.get('shortcut');
  
  if (shortcut && onNavigate) {
    switch (shortcut) {
      case 'pos':
        onNavigate('pos-system');
        break;
      case 'inventory':
        onNavigate('inventory');
        break;
      case 'reports':
        onNavigate('reports');
        break;
      default:
        break;
    }
    
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
};

// Setup viewport meta tag for mobile
export const setupMobileViewport = () => {
  let viewportMeta = document.querySelector('meta[name="viewport"]');
  
  if (!viewportMeta) {
    viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    document.head.appendChild(viewportMeta);
  }
  
  // Enhanced viewport settings for PWA
  viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
  
  // Add theme color meta tags
  const themeColorMeta = document.createElement('meta');
  themeColorMeta.name = 'theme-color';
  themeColorMeta.content = '#16a34a';
  document.head.appendChild(themeColorMeta);
  
  // Add apple-mobile-web-app meta tags
  const appleMobileWebAppCapable = document.createElement('meta');
  appleMobileWebAppCapable.name = 'apple-mobile-web-app-capable';
  appleMobileWebAppCapable.content = 'yes';
  document.head.appendChild(appleMobileWebAppCapable);
  
  const appleMobileWebAppStatusBarStyle = document.createElement('meta');
  appleMobileWebAppStatusBarStyle.name = 'apple-mobile-web-app-status-bar-style';
  appleMobileWebAppStatusBarStyle.content = 'default';
  document.head.appendChild(appleMobileWebAppStatusBarStyle);
  
  const appleMobileWebAppTitle = document.createElement('meta');
  appleMobileWebAppTitle.name = 'apple-mobile-web-app-title';
  appleMobileWebAppTitle.content = 'Krishisethu';
  document.head.appendChild(appleMobileWebAppTitle);
};

// Initialize PWA features
export const initializePWA = async (onNavigate) => {
  console.log('[PWA] Initializing PWA features...');

  // Setup mobile viewport
  setupMobileViewport();

  // Register service worker
  registerServiceWorker();

  // Request notification permission
  requestNotificationPermission();

  // Setup network status handling with offline data checking
  setupNetworkStatusHandling(
    async () => {
      // When coming online, check for offline data and trigger sync
      const offlineData = await checkOfflineData();
      if (offlineData.totalUnsynced > 0) {
        await triggerBackgroundSync('all');
      }
    },
    () => {
      // When going offline, just log
      console.log('[PWA] App is now offline');
    }
  );

  // Setup background sync
  setupBackgroundSync();

  // Handle app shortcuts
  handleAppShortcuts(onNavigate);

  // Check for offline data on startup
  setTimeout(async () => {
    if (navigator.onLine) {
      const offlineData = await checkOfflineData();
      if (offlineData.totalUnsynced > 0) {
        console.log('[PWA] Found offline data on startup, triggering sync...');
        await triggerBackgroundSync('all');
      }
    }
  }, 5000); // Wait 5 seconds after startup

  // Log device info
  console.log('[PWA] Device info:', getDeviceInfo());

  console.log('[PWA] PWA features initialized successfully');
};
