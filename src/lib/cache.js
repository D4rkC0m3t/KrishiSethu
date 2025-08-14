import React from 'react';

/**
 * Caching Service for Performance Optimization
 * Implements in-memory caching with TTL (Time To Live) support
 */
class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttlMap = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL
  }

  /**
   * Set a value in cache with optional TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, value, ttl = this.defaultTTL) {
    const expiryTime = Date.now() + ttl;
    this.cache.set(key, value);
    this.ttlMap.set(key, expiryTime);
    
    // Set cleanup timer
    setTimeout(() => {
      this.delete(key);
    }, ttl);
    
    console.log(`Cache SET: ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null if not found/expired
   */
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const expiryTime = this.ttlMap.get(key);
    if (expiryTime && Date.now() > expiryTime) {
      this.delete(key);
      return null;
    }

    console.log(`Cache HIT: ${key}`);
    return this.cache.get(key);
  }

  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
    this.ttlMap.delete(key);
    console.log(`Cache DELETE: ${key}`);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.ttlMap.clear();
    console.log('Cache CLEARED');
  }

  /**
   * Check if key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean} True if key exists and is valid
   */
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }

    const expiryTime = this.ttlMap.get(key);
    if (expiryTime && Date.now() > expiryTime) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get cache statistics
   * @returns {object} Cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Estimate memory usage (rough calculation)
   * @returns {string} Memory usage estimate
   */
  getMemoryUsage() {
    let totalSize = 0;
    for (const [key, value] of this.cache) {
      totalSize += JSON.stringify({ key, value }).length;
    }
    return `${(totalSize / 1024).toFixed(2)} KB`;
  }

  /**
   * Get or set pattern - if key exists return it, otherwise execute function and cache result
   * @param {string} key - Cache key
   * @param {Function} fn - Function to execute if cache miss
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Promise<any>} Cached or computed value
   */
  async getOrSet(key, fn, ttl = this.defaultTTL) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    console.log(`Cache MISS: ${key} - executing function`);
    const result = await fn();
    this.set(key, result, ttl);
    return result;
  }

  /**
   * Invalidate cache entries by pattern
   * @param {string} pattern - Pattern to match (supports wildcards with *)
   */
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
    console.log(`Cache INVALIDATED pattern: ${pattern} (${keysToDelete.length} keys)`);
  }

  /**
   * Preload data into cache
   * @param {object} data - Object with key-value pairs to preload
   * @param {number} ttl - Time to live in milliseconds
   */
  preload(data, ttl = this.defaultTTL) {
    Object.entries(data).forEach(([key, value]) => {
      this.set(key, value, ttl);
    });
    console.log(`Cache PRELOADED: ${Object.keys(data).length} items`);
  }
}

/**
 * Specific cache keys for different data types
 */
export const CACHE_KEYS = {
  CUSTOMERS: 'customers:all',
  SUPPLIERS: 'suppliers:all',
  PRODUCTS: 'products:all',
  USERS: 'users:all',
  SALES: 'sales:all',
  PURCHASES: 'purchases:all',
  CATEGORIES: 'categories:all',
  BRANDS: 'brands:all',
  DASHBOARD_STATS: 'dashboard:stats',
  LOW_STOCK_PRODUCTS: 'products:low_stock',
  RECENT_SALES: 'sales:recent',
  RECENT_PURCHASES: 'purchases:recent',
  CUSTOMER_BY_ID: (id) => `customer:${id}`,
  SUPPLIER_BY_ID: (id) => `supplier:${id}`,
  PRODUCT_BY_ID: (id) => `product:${id}`,
  USER_BY_ID: (id) => `user:${id}`,
  SALES_BY_DATE: (date) => `sales:date:${date}`,
  PURCHASES_BY_DATE: (date) => `purchases:date:${date}`
};

/**
 * Cache TTL configurations (in milliseconds)
 */
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,      // 1 minute
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 15 * 60 * 1000,      // 15 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
  STATIC: 24 * 60 * 60 * 1000 // 24 hours (for rarely changing data)
};

/**
 * React hook for cached data
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Function to fetch data
 * @param {number} ttl - Time to live
 * @returns {object} { data, loading, error, refresh }
 */
export const useCachedData = (key, fetchFn, ttl = CACHE_TTL.MEDIUM) => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const loadData = React.useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      let result;
      if (forceRefresh) {
        cacheService.delete(key);
      }

      result = await cacheService.getOrSet(key, fetchFn, ttl);
      setData(result);
    } catch (err) {
      setError(err);
      console.error(`Error loading cached data for ${key}:`, err);
    } finally {
      setLoading(false);
    }
  }, [key, fetchFn, ttl]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = React.useCallback(() => {
    loadData(true);
  }, [loadData]);

  return { data, loading, error, refresh };
};

/**
 * Debounce function for performance optimization
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function for performance optimization
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Create and export singleton instance
export const cacheService = new CacheService();
export default cacheService;
