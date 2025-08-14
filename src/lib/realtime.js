import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  doc
} from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS } from './firestore';

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
      const { orderBy: orderByField, orderDirection = 'desc', whereClause, limit } = options;
      
      let q = collection(db, collectionName);
      
      // Apply where clause if provided
      if (whereClause) {
        q = query(q, where(whereClause.field, whereClause.operator, whereClause.value));
      }
      
      // Apply ordering if provided
      if (orderByField) {
        q = query(q, orderBy(orderByField, orderDirection));
      }
      
      // Apply limit if provided
      if (limit) {
        q = query(q, limit(limit));
      }
      
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const data = [];
          snapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
          });
          
          console.log(`Real-time update for ${collectionName}:`, data.length, 'items');
          callback(data);
        },
        (error) => {
          console.error(`Real-time error for ${collectionName}:`, error);
          callback(null, error);
        }
      );
      
      // Store the listener for cleanup
      const listenerId = `${collectionName}_${Date.now()}`;
      this.listeners.set(listenerId, unsubscribe);
      
      return () => {
        unsubscribe();
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
      const docRef = doc(db, collectionName, docId);
      
      const unsubscribe = onSnapshot(docRef,
        (doc) => {
          if (doc.exists()) {
            const data = { id: doc.id, ...doc.data() };
            console.log(`Real-time document update for ${collectionName}/${docId}:`, data);
            callback(data);
          } else {
            console.log(`Document ${collectionName}/${docId} does not exist`);
            callback(null);
          }
        },
        (error) => {
          console.error(`Real-time document error for ${collectionName}/${docId}:`, error);
          callback(null, error);
        }
      );
      
      // Store the listener for cleanup
      const listenerId = `${collectionName}_${docId}_${Date.now()}`;
      this.listeners.set(listenerId, unsubscribe);
      
      return () => {
        unsubscribe();
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
