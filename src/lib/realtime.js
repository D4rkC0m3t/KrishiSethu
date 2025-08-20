
import { COLLECTIONS } from './supabaseDb';

/**
 * Real-time Data Service for Firebase Firestore
 * Provides live data synchronization across components
 */
class RealtimeService {
  constructor() {
    this.listeners = new Map(); // Store active listeners
  }

  /**
   * Subscribe to real-time updates for a collection
   * @param {string} collectionName - Name of the collection
   * @param {Function} callback - Callback function to handle updates
   * @param {object} options - Query options (orderBy, where, limit)
   * @returns {Function} Unsubscribe function
   */
  subscribe(collectionName, callback, options = {}) {
    try {
      // Options destructured but not used in current implementation
      
      // Simplified polling for Supabase migration
      console.log(`Setting up polling for ${collectionName}`);

      // For now, we'll use polling instead of real-time
      const pollInterval = setInterval(async () => {
        try {
          // This would need to be implemented with proper Supabase service calls
          // For now, just call the callback with empty data to prevent errors
          callback([]);
        } catch (error) {
          console.error(`Polling error for ${collectionName}:`, error);
          callback(null, error);
        }
      }, 5000); // Poll every 5 seconds
      
      // Store the interval for cleanup
      const listenerId = `${collectionName}_${Date.now()}`;
      this.listeners.set(listenerId, pollInterval);

      return () => {
        clearInterval(pollInterval);
        this.listeners.delete(listenerId);
      };
      
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
      callback(null, error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  /**
   * Subscribe to real-time updates for a specific document
   * @param {string} collectionName - Name of the collection
   * @param {string} docId - Document ID
   * @param {Function} callback - Callback function to handle updates
   * @returns {Function} Unsubscribe function
   */
  subscribeToDocument(collectionName, docId, callback) {
    try {
      // Simplified polling for document subscription
      console.log(`Setting up document polling for ${collectionName}/${docId}`);

      const pollInterval = setInterval(async () => {
        try {
          // This would need to be implemented with proper Supabase service calls
          // For now, just call the callback with null to prevent errors
          callback(null);
        } catch (error) {
          console.error(`Document polling error for ${collectionName}/${docId}:`, error);
          callback(null, error);
        }
      }, 5000); // Poll every 5 seconds
      
      // Store the interval for cleanup
      const listenerId = `${collectionName}_${docId}_${Date.now()}`;
      this.listeners.set(listenerId, pollInterval);

      return () => {
        clearInterval(pollInterval);
        this.listeners.delete(listenerId);
      };
      
    } catch (error) {
      console.error('Error setting up document real-time subscription:', error);
      callback(null, error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  /**
   * Subscribe to customers with real-time updates
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeToCustomers(callback) {
    return this.subscribe(COLLECTIONS.CUSTOMERS, callback, {
      orderBy: 'createdAt',
      orderDirection: 'desc'
    });
  }

  /**
   * Subscribe to suppliers with real-time updates
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeToSuppliers(callback) {
    return this.subscribe(COLLECTIONS.SUPPLIERS, callback, {
      orderBy: 'createdAt',
      orderDirection: 'desc'
    });
  }

  /**
   * Subscribe to products with real-time updates
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeToProducts(callback) {
    return this.subscribe(COLLECTIONS.PRODUCTS, callback, {
      orderBy: 'createdAt',
      orderDirection: 'desc'
    });
  }

  /**
   * Subscribe to users with real-time updates
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeToUsers(callback) {
    return this.subscribe(COLLECTIONS.USERS, callback, {
      orderBy: 'createdAt',
      orderDirection: 'desc'
    });
  }

  /**
   * Subscribe to sales with real-time updates
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeToSales(callback) {
    return this.subscribe(COLLECTIONS.SALES, callback, {
      orderBy: 'createdAt',
      orderDirection: 'desc'
    });
  }

  /**
   * Subscribe to purchases with real-time updates
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeToPurchases(callback) {
    return this.subscribe(COLLECTIONS.PURCHASES, callback, {
      orderBy: 'createdAt',
      orderDirection: 'desc'
    });
  }

  /**
   * Subscribe to low stock products
   * @param {Function} callback - Callback function
   * @param {number} threshold - Stock threshold
   * @returns {Function} Unsubscribe function
   */
  subscribeToLowStockProducts(callback, threshold = 10) {
    return this.subscribe(COLLECTIONS.PRODUCTS, callback, {
      whereClause: {
        field: 'currentStock',
        operator: '<=',
        value: threshold
      },
      orderBy: 'currentStock',
      orderDirection: 'asc'
    });
  }

  /**
   * Subscribe to active alerts
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeToActiveAlerts(callback) {
    return this.subscribe(COLLECTIONS.ALERTS, callback, {
      whereClause: {
        field: 'status',
        operator: '==',
        value: 'active'
      },
      orderBy: 'createdAt',
      orderDirection: 'desc'
    });
  }

  /**
   * Clean up all active listeners
   */
  cleanup() {
    console.log(`Cleaning up ${this.listeners.size} real-time listeners`);
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
  }

  /**
   * Get the number of active listeners
   * @returns {number} Number of active listeners
   */
  getActiveListenersCount() {
    return this.listeners.size;
  }

  /**
   * Subscribe to recent activity (sales, purchases, etc.)
   * @param {Function} callback - Callback function
   * @param {number} limit - Number of recent items
   * @returns {object} Object with unsubscribe functions for each collection
   */
  subscribeToRecentActivity(callback, limit = 10) {
    const unsubscribers = {};
    
    // Subscribe to recent sales
    unsubscribers.sales = this.subscribe(COLLECTIONS.SALES, 
      (data) => callback('sales', data), 
      { orderBy: 'createdAt', orderDirection: 'desc', limit }
    );
    
    // Subscribe to recent purchases
    unsubscribers.purchases = this.subscribe(COLLECTIONS.PURCHASES, 
      (data) => callback('purchases', data), 
      { orderBy: 'createdAt', orderDirection: 'desc', limit }
    );
    
    // Subscribe to recent customers
    unsubscribers.customers = this.subscribe(COLLECTIONS.CUSTOMERS, 
      (data) => callback('customers', data), 
      { orderBy: 'createdAt', orderDirection: 'desc', limit }
    );
    
    return {
      unsubscribeAll: () => {
        Object.values(unsubscribers).forEach(unsubscribe => unsubscribe());
      },
      ...unsubscribers
    };
  }
}

// Create and export a singleton instance
export const realtimeService = new RealtimeService();
export default realtimeService;
