/**
 * Debug-Enhanced Inventory Service
 * 
 * This service provides comprehensive debugging and tracing to identify exactly where
 * inventory loading gets stuck or fails. It includes:
 * - Step-by-step console logging with timing
 * - Retry mechanisms for failed operations
 * - Fallback loading strategies
 * - Timeout protection with detailed error reporting
 * - Cache management with debug info
 * - Network connectivity checks
 */

import { supabase } from './supabase';

class DebugEnhancedInventoryService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.isLoading = false;
    this.loadingPromise = null;
    this.debugMode = true; // Set to false to reduce logs in production
    this.loadAttempts = 0;
    this.maxRetries = 3;
  }

  /**
   * Main inventory loading function with comprehensive debugging
   * @param {Object} profile - User profile (optional)
   * @param {Object} options - Loading options
   * @returns {Promise<Object>} Inventory data with categories and products
   */
  async fetchInventory(profile, options = {}) {
    const startTime = Date.now();
    const debugId = `fetch-${Date.now()}`;
    
    console.group(`🔍 [${debugId}] INVENTORY LOADER DEBUG`);
    console.time(`fetchInventory-${debugId}`);
    
    console.log(`🔍 DEBUG: fetchInventory called with profile:`, profile);
    console.log(`🔍 DEBUG: options:`, options);
    console.log(`🔍 DEBUG: debugId:`, debugId);

    try {
      // STEP 1: Confirm function is called
      this.debugLog("⚡ fetchInventory called", {
        hasProfile: !!profile,
        profileType: typeof profile,
        profileData: profile ? {
          id: profile.id,
          email: profile.email,
          role: profile.role || profile.account_type
        } : null,
        options,
        attempt: ++this.loadAttempts
      });

      // STEP 2: Check network connectivity
      if (!navigator.onLine) {
        this.debugLog("🚫 OFFLINE - Attempting offline fallback...");
        return await this._loadOfflineFallback();
      }

      // STEP 3: Check if loading is already in progress
      if (this.isLoading && this.loadingPromise) {
        this.debugLog("⏳ Loading already in progress, waiting for existing promise...");
        return await this.loadingPromise;
      }

      // STEP 4: Check cache first
      if (options.useCache !== false && this.isCacheValid()) {
        this.debugLog("✅ Returning cached inventory data", {
          cacheAge: Date.now() - this.cache.get('inventory').timestamp,
          cacheSize: this.cache.size
        });
        console.groupEnd();
        return this.cache.get('inventory').data;
      }

      // STEP 5: Start loading process
      this.isLoading = true;
      this.loadingPromise = this._performDebugLoad(profile, options, debugId);

      const result = await this.loadingPromise;
      
      // STEP 6: Cache successful result
      this.cache.set('inventory', {
        data: result,
        timestamp: Date.now()
      });

      const loadTime = Date.now() - startTime;
      this.debugLog("✅ Inventory loading completed successfully", {
        totalTime: `${loadTime}ms`,
        productsCount: result.products?.length || 0,
        categoriesCount: result.categories?.length || 0,
        cacheUpdated: true
      });

      console.timeEnd(`fetchInventory-${debugId}`);
      console.groupEnd();
      return result;

    } catch (error) {
      const loadTime = Date.now() - startTime;
      console.error(`❌ [${debugId}] Inventory loading failed after ${loadTime}ms:`, {
        error: error.message,
        stack: error.stack,
        attempt: this.loadAttempts,
        profile: profile ? { id: profile.id, role: profile.role } : null
      });

      // STEP 7: Attempt retry if not exceeded max attempts
      if (this.loadAttempts < this.maxRetries) {
        this.debugLog(`🔄 Retrying inventory load (${this.loadAttempts}/${this.maxRetries})...`);
        await this._delay(2000 * this.loadAttempts); // Progressive delay
        console.groupEnd();
        return this.fetchInventory(profile, { ...options, isRetry: true });
      }

      console.timeEnd(`fetchInventory-${debugId}`);
      console.groupEnd();
      throw error;
    } finally {
      this.isLoading = false;
      this.loadingPromise = null;
    }
  }

  /**
   * Perform the actual debug-enhanced loading with detailed tracing
   */
  async _performDebugLoad(profile, options, debugId) {
    const {
      timeout = 20000, // 20 seconds timeout
      progressive = true,
      includeInactive = false
    } = options;

    this.debugLog("🚀 Starting debug inventory load", {
      timeout: `${timeout}ms`,
      progressive,
      includeInactive,
      supabaseUrl: supabase.supabaseUrl,
      hasSupabaseClient: !!supabase
    });

    try {
      // Create timeout promise with detailed error info
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Inventory loading timeout after ${timeout}ms - This usually indicates network issues or slow database response`));
        }, timeout);
      });

      // Main loading promise
      const loadingPromise = progressive 
        ? this._loadProgressivelyWithDebug(includeInactive, debugId)
        : this._loadAllWithDebug(includeInactive, debugId);

      // Race against timeout
      const result = await Promise.race([loadingPromise, timeoutPromise]);
      
      this.debugLog("⚡ Main loading promise resolved successfully");
      return result;

    } catch (error) {
      this.debugLog("❌ Main loading failed, attempting fallback methods...", {
        error: error.message,
        code: error.code,
        details: error.details
      });
      
      // Try fallback methods
      return await this._loadWithDebugFallback(includeInactive, debugId);
    }
  }

  /**
   * Progressive loading with detailed debugging - categories first, then products
   */
  async _loadProgressivelyWithDebug(includeInactive, debugId) {
    this.debugLog("📋 Step 1: Loading categories first...");
    const categoriesStartTime = Date.now();
    
    try {
      const categories = await this._loadCategoriesWithDebug();
      const categoriesTime = Date.now() - categoriesStartTime;
      
      this.debugLog(`✅ Categories loaded in ${categoriesTime}ms`, {
        count: categories.length,
        categories: categories.map(c => ({ id: c.id, name: c.name }))
      });

      // Step 2: Load products
      this.debugLog("📦 Step 2: Loading products using optimized query...");
      const productsStartTime = Date.now();
      
      const products = await this._loadProductsWithDebug(includeInactive);
      const productsTime = Date.now() - productsStartTime;
      
      this.debugLog(`✅ Products loaded in ${productsTime}ms`, {
        count: products.length,
        sampleProducts: products.slice(0, 3).map(p => ({ 
          id: p.id, 
          name: p.name, 
          category_id: p.category_id 
        }))
      });

      // Step 3: Resolve category names
      this.debugLog("🔗 Step 3: Resolving category names for products...");
      const resolveStartTime = Date.now();
      
      const productsWithCategories = this._resolveCategoryNamesWithDebug(products, categories);
      const resolveTime = Date.now() - resolveStartTime;
      
      this.debugLog(`✅ Category resolution completed in ${resolveTime}ms`);

      const stats = this._calculateStats(productsWithCategories);
      this.debugLog("📊 Final stats calculated", stats);

      return {
        categories,
        products: productsWithCategories,
        stats,
        debug: {
          loadingMethod: 'progressive',
          timings: {
            categories: `${categoriesTime}ms`,
            products: `${productsTime}ms`,
            resolve: `${resolveTime}ms`
          }
        }
      };

    } catch (error) {
      this.debugLog("❌ Progressive loading failed", {
        step: "progressive_load",
        error: error.message,
        code: error.code
      });
      throw error;
    }
  }

  /**
   * Load all data in parallel with debugging
   */
  async _loadAllWithDebug(includeInactive, debugId) {
    this.debugLog("⚡ Loading all data in parallel...");
    
    try {
      const startTime = Date.now();
      const [categories, products] = await Promise.all([
        this._loadCategoriesWithDebug(),
        this._loadProductsWithDebug(includeInactive)
      ]);
      
      const parallelTime = Date.now() - startTime;
      this.debugLog(`✅ Parallel loading completed in ${parallelTime}ms`, {
        categoriesCount: categories.length,
        productsCount: products.length
      });

      const productsWithCategories = this._resolveCategoryNamesWithDebug(products, categories);
      const stats = this._calculateStats(productsWithCategories);

      return {
        categories,
        products: productsWithCategories,
        stats,
        debug: {
          loadingMethod: 'parallel',
          timings: {
            total: `${parallelTime}ms`
          }
        }
      };

    } catch (error) {
      this.debugLog("❌ Parallel loading failed", {
        error: error.message,
        code: error.code
      });
      throw error;
    }
  }

  /**
   * Load categories with comprehensive debugging
   */
  async _loadCategoriesWithDebug() {
    this.debugLog("🔍 Querying categories table...");
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, description, is_active, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        this.debugLog("❌ Categories query error", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // Fallback to default categories
        this.debugLog("🔄 Using default categories fallback");
        return this._getDefaultCategories();
      }

      if (!data || data.length === 0) {
        this.debugLog("⚠️ Categories query returned no rows, using defaults");
        return this._getDefaultCategories();
      }

      this.debugLog("✅ Categories query successful", {
        count: data.length,
        categories: data.map(c => ({ id: c.id, name: c.name }))
      });

      return data;

    } catch (exception) {
      this.debugLog("🔥 Categories query exception", {
        message: exception.message,
        stack: exception.stack
      });
      return this._getDefaultCategories();
    }
  }

  /**
   * Load products with comprehensive debugging
   */
  async _loadProductsWithDebug(includeInactive = false) {
    this.debugLog("🔍 Starting products query...", {
      includeInactive,
      table: 'products'
    });

    try {
      // Try using the optimized view first
      this.debugLog("🚀 Attempting optimized products_optimized view...");
      
      try {
        const { data: optimizedData, error: optimizedError } = await supabase
          .from('products_optimized')
          .select('*');

        if (!optimizedError && optimizedData) {
          this.debugLog("✅ Used products_optimized view successfully", {
            count: optimizedData.length
          });
          return optimizedData.map(this._transformProductWithDebug.bind(this));
        }

        this.debugLog("⚠️ Optimized view not available, using regular query", {
          error: optimizedError?.message
        });

      } catch (viewError) {
        this.debugLog("⚠️ Optimized view error", {
          error: viewError.message
        });
      }

      // Fallback to regular products table
      this.debugLog("🔄 Fallback to regular products table...");
      
      // First try a simple query to see what fields are available
      try {
        const { data: testData, error: testError } = await supabase
          .from('products')
          .select('*')
          .limit(1);
        
        if (testData && testData.length > 0) {
          this.debugLog("🔍 Available product fields:", {
            fields: Object.keys(testData[0]),
            sampleData: testData[0]
          });
        }
      } catch (testErr) {
        this.debugLog("⚠️ Test query failed", testErr.message);
      }
      
      // Use only the most basic fields that should exist in any products table
      const query = supabase
        .from('products')
        .select('id, name, category_id, quantity, is_active')
        .order('name', { ascending: true });

      if (!includeInactive) {
        query.eq('is_active', true);
      }

      this.debugLog("📋 Executing products query...", {
        includeInactive,
        expectedFields: 20
      });

      const { data, error } = await query;

      if (error) {
        this.debugLog("❌ Products query error", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      if (!data) {
        this.debugLog("⚠️ Products query returned null data");
        return [];
      }

      this.debugLog("✅ Products query successful", {
        count: data.length,
        sampleProduct: data[0] ? {
          id: data[0].id,
          name: data[0].name,
          category_id: data[0].category_id,
          fields: Object.keys(data[0])
        } : null
      });

      return data.map(this._transformProductWithDebug.bind(this));

    } catch (exception) {
      this.debugLog("🔥 Products query exception", {
        message: exception.message,
        stack: exception.stack
      });
      throw exception;
    }
  }

  /**
   * Transform product data with debugging
   */
  _transformProductWithDebug(product) {
    const transformed = {
      ...product,
      // Add computed fields if not present
      stock_status: product.stock_status || (
        product.quantity <= (product.reorder_point || 10) ? 
          (product.quantity === 0 ? 'out' : 'low') : 'normal'
      ),
      expiring_soon: product.expiring_soon || (
        product.expiry_date && 
        new Date(product.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      )
    };

    // Debug first few transformations
    if (this.debugMode && Math.random() < 0.1) { // Debug 10% of products randomly
      this.debugLog("🔄 Product transformation sample", {
        original: {
          id: product.id,
          name: product.name,
          quantity: product.quantity,
          reorder_point: product.reorder_point
        },
        transformed: {
          stock_status: transformed.stock_status,
          expiring_soon: transformed.expiring_soon
        }
      });
    }

    return transformed;
  }

  /**
   * Resolve category names with debugging
   */
  _resolveCategoryNamesWithDebug(products, categories) {
    this.debugLog("🔗 Starting category name resolution...", {
      productsCount: products.length,
      categoriesCount: categories.length
    });

    const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));
    
    let resolvedCount = 0;
    let unresolvedCount = 0;
    
    const result = products.map(product => {
      const categoryName = product.category_name || categoryMap.get(product.category_id) || 'Unknown';
      
      if (categoryName === 'Unknown') {
        unresolvedCount++;
      } else {
        resolvedCount++;
      }

      return {
        ...product,
        categoryName
      };
    });

    this.debugLog("✅ Category name resolution completed", {
      resolved: resolvedCount,
      unresolved: unresolvedCount,
      categoryMap: Array.from(categoryMap.entries())
    });

    return result;
  }

  /**
   * Fallback loading method with comprehensive debugging
   */
  async _loadWithDebugFallback(includeInactive, debugId) {
    this.debugLog("🔄 FALLBACK: Attempting minimal loading strategy...");
    
    try {
      // Very basic query with minimal fields
      this.debugLog("📋 Fallback: Loading basic products...");
      
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, category_id, quantity, is_active')
        .eq('is_active', true)
        .limit(100); // Limit results for faster loading

      this.debugLog("📋 Fallback: Loading basic categories...");
      
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, is_active')
        .eq('is_active', true);

      // Check results
      this.debugLog("📊 Fallback query results", {
        products: {
          success: !productsError,
          count: products?.length || 0,
          error: productsError?.message
        },
        categories: {
          success: !categoriesError,
          count: categories?.length || 0,
          error: categoriesError?.message
        }
      });

      if (productsError && categoriesError) {
        throw new Error('Both products and categories failed to load');
      }

      return {
        categories: categories || this._getDefaultCategories(),
        products: (products || []).map(p => ({
          ...p,
          categoryName: 'Unknown',
          stock_status: p.quantity <= 10 ? (p.quantity === 0 ? 'out' : 'low') : 'normal'
        })),
        stats: this._calculateStats(products || []),
        debug: {
          loadingMethod: 'fallback',
          fallback: true
        }
      };

    } catch (fallbackError) {
      this.debugLog("❌ Fallback loading also failed", {
        error: fallbackError.message
      });
      
      return this._getEmptyInventoryWithDebug();
    }
  }

  /**
   * Load offline fallback data
   */
  async _loadOfflineFallback() {
    this.debugLog("📱 Loading offline fallback data...");
    
    // Check if we have cached data
    if (this.cache.has('inventory')) {
      this.debugLog("✅ Using cached data for offline access");
      return this.cache.get('inventory').data;
    }
    
    // Return empty inventory with message
    return {
      categories: this._getDefaultCategories(),
      products: [],
      stats: {
        totalProducts: 0,
        totalCategories: 6,
        lowStockProducts: 0,
        outOfStockProducts: 0
      },
      offline: true,
      debug: {
        loadingMethod: 'offline'
      }
    };
  }

  /**
   * Get empty inventory as last resort with debug info
   */
  _getEmptyInventoryWithDebug() {
    this.debugLog("🏗️ Creating empty inventory fallback");
    
    return {
      categories: this._getDefaultCategories(),
      products: [],
      stats: {
        totalProducts: 0,
        totalCategories: 6,
        lowStockProducts: 0,
        outOfStockProducts: 0
      },
      empty: true,
      debug: {
        loadingMethod: 'empty_fallback',
        reason: 'All loading methods failed'
      }
    };
  }

  /**
   * Calculate statistics for products
   */
  _calculateStats(products) {
    const stats = {
      totalProducts: products.length,
      totalCategories: new Set(products.map(p => p.category_id).filter(Boolean)).size,
      lowStockProducts: products.filter(p => p.stock_status === 'low').length,
      outOfStockProducts: products.filter(p => p.stock_status === 'out').length
    };

    this.debugLog("📊 Stats calculated", stats);
    return stats;
  }

  /**
   * Get default categories if database fails
   */
  _getDefaultCategories() {
    return [
      { id: 'cat_1', name: 'Chemical Fertilizer', is_active: true, sort_order: 1 },
      { id: 'cat_2', name: 'Organic Fertilizer', is_active: true, sort_order: 2 },
      { id: 'cat_3', name: 'Bio Fertilizer', is_active: true, sort_order: 3 },
      { id: 'cat_4', name: 'Seeds', is_active: true, sort_order: 4 },
      { id: 'cat_5', name: 'Pesticides', is_active: true, sort_order: 5 },
      { id: 'cat_6', name: 'Tools & Equipment', is_active: true, sort_order: 6 }
    ];
  }

  /**
   * Check if cached data is still valid
   */
  isCacheValid() {
    const cachedData = this.cache.get('inventory');
    if (!cachedData) return false;
    
    const age = Date.now() - cachedData.timestamp;
    const isValid = age < this.cacheTimeout;
    
    this.debugLog("🗄️ Cache validation", {
      exists: !!cachedData,
      age: `${age}ms`,
      maxAge: `${this.cacheTimeout}ms`,
      isValid
    });
    
    return isValid;
  }

  /**
   * Clear the cache with debug info
   */
  clearCache() {
    const hadCache = this.cache.size > 0;
    this.cache.clear();
    this.debugLog("🧹 Cache cleared", { hadCache });
    
    // Reset load attempts
    this.loadAttempts = 0;
  }

  /**
   * Enhanced debug logging
   */
  debugLog(message, data = null) {
    if (!this.debugMode) return;
    
    try {
      const timestamp = new Date().toLocaleTimeString();
      const logMessage = `[${timestamp}] ${message}`;
      
      if (data) {
        console.log(logMessage, data);
      } else {
        console.log(logMessage);
      }
    } catch (logError) {
      // If logging fails, try basic console.log
      console.log(message, data);
    }
  }

  /**
   * Delay utility for retries
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get comprehensive debug statistics
   */
  getDebugStats() {
    const cachedData = this.cache.get('inventory');
    return {
      isCached: this.isCacheValid(),
      cacheAge: cachedData ? Date.now() - cachedData.timestamp : null,
      isLoading: this.isLoading,
      cacheSize: this.cache.size,
      loadAttempts: this.loadAttempts,
      maxRetries: this.maxRetries,
      debugMode: this.debugMode,
      networkStatus: navigator.onLine ? 'online' : 'offline',
      supabaseUrl: supabase.supabaseUrl
    };
  }

  /**
   * Test connection to Supabase
   */
  async testConnection() {
    console.group("🧪 TESTING SUPABASE CONNECTION");
    
    try {
      const startTime = Date.now();
      
      // Test simple query
      const { data, error } = await supabase
        .from('categories')
        .select('id')
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      
      console.log("✅ Connection test results", {
        success: !error,
        responseTime: `${responseTime}ms`,
        error: error?.message,
        hasData: !!data,
        networkOnline: navigator.onLine
      });

      console.groupEnd();
      return { success: !error, responseTime, error };
      
    } catch (exception) {
      console.error("❌ Connection test failed", exception);
      console.groupEnd();
      return { success: false, error: exception.message };
    }
  }
}

// Create and export singleton instance
export const debugEnhancedInventoryService = new DebugEnhancedInventoryService();
export default debugEnhancedInventoryService;
