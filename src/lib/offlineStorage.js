// Offline Storage Service using IndexedDB
// Handles offline data storage for sales, inventory, and other critical operations

class OfflineStorageService {
  constructor() {
    this.dbName = 'KrishisethuOfflineDB';
    this.dbVersion = 1;
    this.db = null;
    this.stores = {
      sales: 'offline_sales',
      inventory: 'offline_inventory',
      customers: 'offline_customers',
      products: 'offline_products',
      settings: 'offline_settings'
    };
  }

  // Initialize IndexedDB
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('[OfflineDB] Error opening database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[OfflineDB] Database opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log('[OfflineDB] Upgrading database...');

        // Create object stores
        this.createObjectStores(db);
      };
    });
  }

  // Create object stores for different data types
  createObjectStores(db) {
    // Sales store
    if (!db.objectStoreNames.contains(this.stores.sales)) {
      const salesStore = db.createObjectStore(this.stores.sales, { keyPath: 'id' });
      salesStore.createIndex('timestamp', 'timestamp', { unique: false });
      salesStore.createIndex('customerId', 'customerId', { unique: false });
      salesStore.createIndex('synced', 'synced', { unique: false });
    }

    // Inventory updates store
    if (!db.objectStoreNames.contains(this.stores.inventory)) {
      const inventoryStore = db.createObjectStore(this.stores.inventory, { keyPath: 'id' });
      inventoryStore.createIndex('productId', 'productId', { unique: false });
      inventoryStore.createIndex('timestamp', 'timestamp', { unique: false });
      inventoryStore.createIndex('synced', 'synced', { unique: false });
    }

    // Customers store
    if (!db.objectStoreNames.contains(this.stores.customers)) {
      const customersStore = db.createObjectStore(this.stores.customers, { keyPath: 'id' });
      customersStore.createIndex('phone', 'phone', { unique: false });
      customersStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
    }

    // Products store (for offline access)
    if (!db.objectStoreNames.contains(this.stores.products)) {
      const productsStore = db.createObjectStore(this.stores.products, { keyPath: 'id' });
      productsStore.createIndex('category', 'category', { unique: false });
      productsStore.createIndex('brand', 'brand', { unique: false });
      productsStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
    }

    // Settings store
    if (!db.objectStoreNames.contains(this.stores.settings)) {
      db.createObjectStore(this.stores.settings, { keyPath: 'key' });
    }
  }

  // Generic method to add data to a store
  async addData(storeName, data) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Add timestamp and sync status
      const dataWithMeta = {
        ...data,
        timestamp: Date.now(),
        synced: false,
        lastUpdated: new Date().toISOString()
      };

      const request = store.add(dataWithMeta);

      request.onsuccess = () => {
        console.log(`[OfflineDB] Data added to ${storeName}:`, data.id);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error(`[OfflineDB] Error adding data to ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  // Generic method to update data in a store
  async updateData(storeName, data) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Update timestamp
      const dataWithMeta = {
        ...data,
        lastUpdated: new Date().toISOString()
      };

      const request = store.put(dataWithMeta);

      request.onsuccess = () => {
        console.log(`[OfflineDB] Data updated in ${storeName}:`, data.id);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error(`[OfflineDB] Error updating data in ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  // Generic method to get data from a store
  async getData(storeName, id) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error(`[OfflineDB] Error getting data from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  // Generic method to get all data from a store
  async getAllData(storeName, filter = null) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        let results = request.result;
        
        // Apply filter if provided
        if (filter) {
          results = results.filter(filter);
        }
        
        resolve(results);
      };

      request.onerror = () => {
        console.error(`[OfflineDB] Error getting all data from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  // Generic method to delete data from a store
  async deleteData(storeName, id) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log(`[OfflineDB] Data deleted from ${storeName}:`, id);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error(`[OfflineDB] Error deleting data from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  // Sales-specific methods
  async addOfflineSale(sale) {
    return this.addData(this.stores.sales, sale);
  }

  async getOfflineSales(unsyncedOnly = false) {
    const filter = unsyncedOnly ? (sale) => !sale.synced : null;
    return this.getAllData(this.stores.sales, filter);
  }

  async markSaleSynced(saleId) {
    const sale = await this.getData(this.stores.sales, saleId);
    if (sale) {
      sale.synced = true;
      sale.syncedAt = new Date().toISOString();
      return this.updateData(this.stores.sales, sale);
    }
  }

  async deleteOfflineSale(saleId) {
    return this.deleteData(this.stores.sales, saleId);
  }

  // Inventory-specific methods
  async addOfflineInventoryUpdate(update) {
    return this.addData(this.stores.inventory, update);
  }

  async getOfflineInventoryUpdates(unsyncedOnly = false) {
    const filter = unsyncedOnly ? (update) => !update.synced : null;
    return this.getAllData(this.stores.inventory, filter);
  }

  async markInventoryUpdateSynced(updateId) {
    const update = await this.getData(this.stores.inventory, updateId);
    if (update) {
      update.synced = true;
      update.syncedAt = new Date().toISOString();
      return this.updateData(this.stores.inventory, update);
    }
  }

  // Products cache methods
  async cacheProducts(products) {
    const transaction = this.db.transaction([this.stores.products], 'readwrite');
    const store = transaction.objectStore(this.stores.products);
    
    // Clear existing products
    await store.clear();
    
    // Add all products
    for (const product of products) {
      await store.add({
        ...product,
        lastUpdated: new Date().toISOString()
      });
    }
    
    console.log(`[OfflineDB] Cached ${products.length} products`);
  }

  async getCachedProducts() {
    return this.getAllData(this.stores.products);
  }

  // Network status and sync management
  async getUnsyncedData() {
    const [sales, inventory] = await Promise.all([
      this.getOfflineSales(true),
      this.getOfflineInventoryUpdates(true)
    ]);

    return {
      sales,
      inventory,
      totalUnsynced: sales.length + inventory.length
    };
  }

  // Clear all offline data (for testing or reset)
  async clearAllData() {
    if (!this.db) {
      await this.init();
    }

    const storeNames = Object.values(this.stores);
    const transaction = this.db.transaction(storeNames, 'readwrite');
    
    for (const storeName of storeNames) {
      const store = transaction.objectStore(storeName);
      await store.clear();
    }
    
    console.log('[OfflineDB] All offline data cleared');
  }

  // Get database statistics
  async getStats() {
    const stats = {};
    
    for (const [key, storeName] of Object.entries(this.stores)) {
      const data = await this.getAllData(storeName);
      stats[key] = {
        total: data.length,
        unsynced: data.filter(item => !item.synced).length
      };
    }
    
    return stats;
  }
}

// Create singleton instance
export const offlineStorage = new OfflineStorageService();

// Initialize on import
offlineStorage.init().catch(console.error);

export default offlineStorage;
