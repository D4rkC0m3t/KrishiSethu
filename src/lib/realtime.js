
import { COLLECTIONS } from './supabaseDb';
import { supabase } from './supabase';

/**
 * Real-time Data Service using Supabase Realtime
 * Provides live data synchronization across components
 */
class RealtimeService {
  constructor() {
    this.listeners = new Map(); // Store active listeners
  }

  /**
   * Subscribe to real-time updates for a collection using Supabase Realtime
   * @param {string} collectionName - Name of the collection
   * @param {Function} callback - Callback function to handle updates
   * @param {object} options - Query options (orderBy, where, limit)
   * @returns {Function} Unsubscribe function
   */
  subscribe(collectionName, callback, options = {}) {
    try {
      console.log(`🔔 Setting up Supabase Realtime subscription for ${collectionName}`);

      // Create a channel for this subscription
      const channel = supabase
        .channel(`realtime-${collectionName}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: collectionName 
          }, 
          (payload) => {
            console.log(`🔄 Realtime update for ${collectionName}:`, payload);
            
            // Handle different types of changes
            switch (payload.eventType) {
              case 'INSERT':
                console.log(`➕ New ${collectionName} added:`, payload.new);
                break;
              case 'UPDATE':
                console.log(`📝 ${collectionName} updated:`, payload.new);
                break;
              case 'DELETE':
                console.log(`🗑️ ${collectionName} deleted:`, payload.old);
                break;
              default:
                console.log(`🔄 ${collectionName} change:`, payload);
            }
            
            // Trigger callback with the change data
            callback(payload);
          }
        )
        .subscribe((status) => {
          console.log(`📡 Realtime status for ${collectionName}:`, status);
        });
      
      // Store the channel for cleanup
      const listenerId = `${collectionName}_${Date.now()}`;
      this.listeners.set(listenerId, channel);

      return () => {
        console.log(`🔌 Unsubscribing from ${collectionName} realtime updates`);
        supabase.removeChannel(channel);
        this.listeners.delete(listenerId);
      };
      
    } catch (error) {
      console.error('❌ Error setting up Supabase Realtime subscription:', error);
      callback(null, error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  /**
   * Subscribe to real-time updates for a specific document using Supabase Realtime
   * @param {string} collectionName - Name of the collection
   * @param {string} docId - Document ID
   * @param {Function} callback - Callback function to handle updates
   * @returns {Function} Unsubscribe function
   */
  subscribeToDocument(collectionName, docId, callback) {
    try {
      console.log(`🔔 Setting up Supabase Realtime document subscription for ${collectionName}/${docId}`);

      // Create a channel for this specific document
      const channel = supabase
        .channel(`realtime-${collectionName}-${docId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: collectionName,
            filter: `id=eq.${docId}`
          }, 
          (payload) => {
            console.log(`📝 Document update for ${collectionName}/${docId}:`, payload);
            
            // Handle different types of changes
            switch (payload.eventType) {
              case 'UPDATE':
                console.log(`📝 Document updated:`, payload.new);
                callback(payload.new);
                break;
              case 'DELETE':
                console.log(`🗑️ Document deleted:`, payload.old);
                callback(null); // Document no longer exists
                break;
              default:
                console.log(`🔄 Document change:`, payload);
                callback(payload.new || payload.old);
            }
          }
        )
        .subscribe((status) => {
          console.log(`📡 Document realtime status for ${collectionName}/${docId}:`, status);
        });
      
      // Store the channel for cleanup
      const listenerId = `${collectionName}_${docId}_${Date.now()}`;
      this.listeners.set(listenerId, channel);

      return () => {
        console.log(`🔌 Unsubscribing from ${collectionName}/${docId} document updates`);
        supabase.removeChannel(channel);
        this.listeners.delete(listenerId);
      };
      
    } catch (error) {
      console.error('❌ Error setting up document Supabase Realtime subscription:', error);
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
