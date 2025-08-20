// Notification Service for Krishisethu Inventory Management
// Handles push notifications, browser notifications, and alert management

class NotificationService {
  constructor() {
    this.permission = 'default';
    this.registration = null;
    this.isSupported = 'Notification' in window;
    this.isPushSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    this.subscriptions = new Set();
    this.notificationQueue = [];
    this.settings = this.loadSettings();
  }

  // Initialize notification service
  async init() {
    console.log('[Notifications] Initializing notification service...');
    
    if (!this.isSupported) {
      console.warn('[Notifications] Browser notifications not supported');
      return false;
    }

    // Request permission
    await this.requestPermission();
    
    // Get service worker registration - handle protocol restrictions
    if (this.isPushSupported) {
      try {
        // Check if we're on a secure context
        const isSecureContext = window.location.protocol === 'https:' ||
                               window.location.hostname === 'localhost' ||
                               window.location.hostname === '127.0.0.1';

        if (isSecureContext) {
          this.registration = await navigator.serviceWorker.ready;
          console.log('[Notifications] Service worker ready for push notifications');
        } else {
          console.warn('[Notifications] Service Worker requires secure context (HTTPS or localhost)');
          console.warn('[Notifications] Current protocol:', window.location.protocol);
          console.warn('[Notifications] Push notifications will use fallback mode');
        }
      } catch (error) {
        console.error('[Notifications] Service worker not available:', error);
        if (error.message.includes('protocol') || error.message.includes('SecurityError')) {
          console.error('[Notifications] This is likely due to file:// protocol restrictions');
          console.error('[Notifications] Please use an HTTP server for full functionality');
        }
      }
    }

    // Process any queued notifications
    this.processQueue();
    
    console.log('[Notifications] Notification service initialized');
    return true;
  }

  // Request notification permission
  async requestPermission() {
    if (!this.isSupported) return false;

    try {
      this.permission = await Notification.requestPermission();
      console.log('[Notifications] Permission status:', this.permission);
      
      if (this.permission === 'granted') {
        this.showWelcomeNotification();
      }
      
      return this.permission === 'granted';
    } catch (error) {
      console.error('[Notifications] Error requesting permission:', error);
      return false;
    }
  }

  // Show welcome notification
  showWelcomeNotification() {
    this.showNotification('Krishisethu Notifications Enabled', {
      body: 'You will now receive important inventory alerts and updates.',
      icon: '/logo192.png',
      tag: 'welcome',
      requireInteraction: false
    });
  }

  // Show basic notification
  showNotification(title, options = {}) {
    if (this.permission !== 'granted') {
      console.warn('[Notifications] Permission not granted');
      this.queueNotification(title, options);
      return;
    }

    // Use service worker for persistent notifications with actions
    if (options.actions && options.actions.length > 0 && this.registration) {
      return this.showPersistentNotification(title, options);
    }

    const defaultOptions = {
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200],
      timestamp: Date.now(),
      requireInteraction: false,
      silent: false
    };

    // Remove actions from options for basic notifications
    const { actions, ...basicOptions } = options;
    const notificationOptions = { ...defaultOptions, ...basicOptions };

    try {
      const notification = new Notification(title, notificationOptions);

      // Handle notification events
      notification.onclick = (event) => {
        event.preventDefault();
        notification.close();

        if (options.onClick) {
          options.onClick(event);
        } else if (options.url) {
          window.open(options.url, '_blank');
        } else {
          window.focus();
        }
      };

      notification.onclose = () => {
        if (options.onClose) options.onClose();
      };

      notification.onerror = (error) => {
        console.error('[Notifications] Notification error:', error);
      };

      console.log('[Notifications] Basic notification shown:', title);
      return notification;
    } catch (error) {
      console.error('[Notifications] Error showing notification:', error);
      return null;
    }
  }

  // Show persistent notification with actions (requires service worker)
  async showPersistentNotification(title, options = {}) {
    if (!this.registration) {
      console.warn('[Notifications] Service worker not available for persistent notifications');
      // Fallback to basic notification without actions
      const { actions, ...basicOptions } = options;
      return this.showNotification(title, basicOptions);
    }

    const defaultOptions = {
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200],
      timestamp: Date.now(),
      requireInteraction: false,
      silent: false,
      data: options.data || {}
    };

    const notificationOptions = { ...defaultOptions, ...options };

    try {
      await this.registration.showNotification(title, notificationOptions);
      console.log('[Notifications] Persistent notification shown:', title);
      return true;
    } catch (error) {
      console.error('[Notifications] Error showing persistent notification:', error);
      // Fallback to basic notification
      const { actions, ...basicOptions } = options;
      return this.showNotification(title, basicOptions);
    }
  }

  // Show inventory alert notification
  showInventoryAlert(type, data) {
    const alertTypes = {
      lowStock: {
        title: '⚠️ Low Stock Alert',
        body: `${data.productName} is running low (${data.quantity} remaining)`,
        tag: `low-stock-${data.productId}`,
        requireInteraction: true,
        actions: [
          { action: 'view', title: 'View Product' },
          { action: 'reorder', title: 'Reorder' }
        ]
      },
      outOfStock: {
        title: '🚨 Out of Stock',
        body: `${data.productName} is out of stock`,
        tag: `out-of-stock-${data.productId}`,
        requireInteraction: true,
        actions: [
          { action: 'view', title: 'View Product' },
          { action: 'reorder', title: 'Reorder Now' }
        ]
      },
      expiringSoon: {
        title: '⏰ Expiring Soon',
        body: `${data.productName} expires in ${data.daysUntilExpiry} days`,
        tag: `expiring-${data.productId}`,
        requireInteraction: true,
        actions: [
          { action: 'view', title: 'View Product' },
          { action: 'discount', title: 'Apply Discount' }
        ]
      },
      expired: {
        title: '❌ Product Expired',
        body: `${data.productName} has expired`,
        tag: `expired-${data.productId}`,
        requireInteraction: true,
        actions: [
          { action: 'view', title: 'View Product' },
          { action: 'remove', title: 'Remove from Inventory' }
        ]
      }
    };

    const alertConfig = alertTypes[type];
    if (!alertConfig) {
      console.error('[Notifications] Unknown alert type:', type);
      return;
    }

    return this.showNotification(alertConfig.title, {
      ...alertConfig,
      data: { type, ...data },
      onClick: () => this.handleInventoryAlertClick(type, data)
    });
  }

  // Handle inventory alert clicks
  handleInventoryAlertClick(type, data) {
    console.log('[Notifications] Inventory alert clicked:', type, data);
    
    // Navigate to inventory page with product highlighted
    const url = `/inventory?highlight=${data.productId}`;
    
    if (window.location.pathname !== '/inventory') {
      window.location.href = url;
    } else {
      // If already on inventory page, just highlight the product
      const event = new CustomEvent('highlightProduct', { detail: data.productId });
      window.dispatchEvent(event);
    }
  }

  // Show sales notification
  showSalesNotification(saleData) {
    const title = '💰 Sale Completed';
    const body = `Sale of ₹${saleData.total} to ${saleData.customerName || 'Walk-in Customer'}`;
    
    return this.showNotification(title, {
      body,
      tag: `sale-${saleData.id}`,
      data: saleData,
      actions: [
        { action: 'view', title: 'View Receipt' },
        { action: 'print', title: 'Print Receipt' }
      ]
    });
  }

  // Show sync notification
  showSyncNotification(type, count) {
    const messages = {
      started: {
        title: '🔄 Syncing Data',
        body: 'Syncing offline data with server...'
      },
      completed: {
        title: '✅ Sync Complete',
        body: `Successfully synced ${count} items`
      },
      failed: {
        title: '❌ Sync Failed',
        body: 'Failed to sync some data. Will retry automatically.'
      }
    };

    const config = messages[type];
    if (!config) return;

    return this.showNotification(config.title, {
      body: config.body,
      tag: `sync-${type}`,
      requireInteraction: type === 'failed'
    });
  }

  // Queue notification for later (when permission is granted)
  queueNotification(title, options) {
    this.notificationQueue.push({ title, options, timestamp: Date.now() });
    
    // Limit queue size
    if (this.notificationQueue.length > 10) {
      this.notificationQueue.shift();
    }
  }

  // Process queued notifications
  processQueue() {
    if (this.permission !== 'granted' || this.notificationQueue.length === 0) {
      return;
    }

    console.log(`[Notifications] Processing ${this.notificationQueue.length} queued notifications`);
    
    while (this.notificationQueue.length > 0) {
      const { title, options } = this.notificationQueue.shift();
      this.showNotification(title, options);
    }
  }

  // Subscribe to push notifications (requires server setup)
  async subscribeToPush() {
    if (!this.isPushSupported || !this.registration) {
      console.warn('[Notifications] Push notifications not supported');
      return null;
    }

    try {
      // Check if already subscribed
      const existingSubscription = await this.registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('[Notifications] Already subscribed to push notifications');
        return existingSubscription;
      }

      // Subscribe to push notifications
      // Note: This requires a VAPID key from your server
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY || '')
      });

      console.log('[Notifications] Subscribed to push notifications');
      
      // Send subscription to server (implement this based on your backend)
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('[Notifications] Error subscribing to push notifications:', error);
      return null;
    }
  }

  // Send subscription to server
  async sendSubscriptionToServer(subscription) {
    // Implement this method to send the subscription to your backend
    console.log('[Notifications] Subscription to send to server:', subscription);
    
    // Example implementation:
    // try {
    //   await fetch('/api/push-subscription', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(subscription)
    //   });
    // } catch (error) {
    //   console.error('Failed to send subscription to server:', error);
    // }
  }

  // Utility function for VAPID key conversion
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Load notification settings
  loadSettings() {
    try {
      const saved = localStorage.getItem('notificationSettings');
      return saved ? JSON.parse(saved) : {
        enabled: true,
        lowStock: true,
        expiry: true,
        sales: true,
        sync: true
      };
    } catch (error) {
      console.error('[Notifications] Error loading settings:', error);
      return { enabled: true, lowStock: true, expiry: true, sales: true, sync: true };
    }
  }

  // Save notification settings
  saveSettings(settings) {
    try {
      this.settings = { ...this.settings, ...settings };
      localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
      console.log('[Notifications] Settings saved:', this.settings);
    } catch (error) {
      console.error('[Notifications] Error saving settings:', error);
    }
  }

  // Check if notification type is enabled
  isTypeEnabled(type) {
    return this.settings.enabled && this.settings[type];
  }

  // Get notification status
  getStatus() {
    return {
      supported: this.isSupported,
      pushSupported: this.isPushSupported,
      permission: this.permission,
      settings: this.settings,
      queueLength: this.notificationQueue.length
    };
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

// Initialize on import
notificationService.init().catch(console.error);

export default notificationService;
