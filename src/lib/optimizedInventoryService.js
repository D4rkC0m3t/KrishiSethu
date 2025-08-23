/**
 * Optimized Inventory Service
 * 
 * This service provides faster, more reliable inventory loading with:
 * - Better timeout handling
 * - Optimized database queries
 * - Intelligent caching
 * - Progressive loading
 * - Error recovery
 */

import { supabase } from './supabase';

class OptimizedInventoryService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.isLoading = false;
    this.loadingPromise = null;
  }

  /**
   * Load inventory with optimized performance
   * @param {Object} options - Loading options
   * @returns {Promise<Object>} Inventory data with categories and products
   */
  async loadInventoryOptimized(options = {}) {
    const {
      useCache = true,
      timeout = 15000, // 15 seconds timeout
      progressive = true,
      includeInactive = false
    } = options;

    console.log('🚀 [OPTIMIZED] Starting optimized inventory loading...');

    // Return cached data if available and fresh
    if (useCache && this.isCacheValid()) {
      console.log('✅ [OPTIMIZED] Returning cached inventory data');
      return this.cache.get('inventory');
    }

    // Prevent multiple simultaneous loading attempts
    if (this.isLoading && this.loadingPromise) {
      console.log('⏳ [OPTIMIZED] Loading already in progress, waiting...');
      return await this.loadingPromise;
    }

    // Start the loading process
    this.isLoading = true;
    this.loadingPromise = this._performOptimizedLoad(timeout, progressive, includeInactive);

    try {
      const result = await this.loadingPromise;
      
      // Cache the successful result
      this.cache.set('inventory', {
        data: result,
        timestamp: Date.now()
      });
      
      console.log('✅ [OPTIMIZED] Inventory loading completed successfully');
      return result;
    } catch (error) {
      console.error('❌ [OPTIMIZED] Inventory loading failed:', error);
      throw error;
    } finally {
      this.isLoading = false;
      this.loadingPromise = null;
    }
  }

  /**
   * Perform the actual optimized loading with timeout protection
   */
  async _performOptimizedLoad(timeout, progressive, includeInactive) {
    const startTime = Date.now();
    
    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Inventory loading timeout after ${timeout}ms`));
        }, timeout);
      });

      // Main loading promise
      const loadingPromise = progressive 
        ? this._loadProgressively(includeInactive)
        : this._loadAll(includeInactive);

      // Race against timeout
      const result = await Promise.race([loadingPromise, timeoutPromise]);
      
      const loadTime = Date.now() - startTime;
      console.log(`⚡ [OPTIMIZED] Inventory loaded in ${loadTime}ms`);
      
      return result;
    } catch (error) {
      const loadTime = Date.now() - startTime;
      console.error(`❌ [OPTIMIZED] Loading failed after ${loadTime}ms:`, error);
      
      // Try fallback methods
      return await this._loadWithFallback(includeInactive);
    }
  }

  /**
   * Progressive loading - categories first, then products
   */
  async _loadProgressively(includeInactive) {
    console.log('📋 [OPTIMIZED] Loading categories first...');
    
    // Step 1: Load categories quickly
    const categories = await this._loadCategories();
    console.log(`✅ [OPTIMIZED] Loaded ${categories.length} categories`);

    // Step 2: Load products using optimized view
    console.log('📦 [OPTIMIZED] Loading products using optimized query...');
    const products = await this._loadProductsOptimized(includeInactive);
    console.log(`✅ [OPTIMIZED] Loaded ${products.length} products`);

    // Step 3: Resolve category names for products
    const productsWithCategories = this._resolveCategoryNames(products, categories);

    return {
      categories,
      products: productsWithCategories,
      stats: {
        totalProducts: productsWithCategories.length,
        totalCategories: categories.length,
        lowStockProducts: productsWithCategories.filter(p => p.stock_status === 'low').length,
        outOfStockProducts: productsWithCategories.filter(p => p.stock_status === 'out').length
      }
    };
  }

  /**
   * Load all data in parallel (faster but riskier)
   */
  async _loadAll(includeInactive) {
    console.log('⚡ [OPTIMIZED] Loading all data in parallel...');
    
    const [categories, products] = await Promise.all([
      this._loadCategories(),
      this._loadProductsOptimized(includeInactive)
    ]);

    const productsWithCategories = this._resolveCategoryNames(products, categories);

    return {
      categories,
      products: productsWithCategories,
      stats: {
        totalProducts: productsWithCategories.length,
        totalCategories: categories.length,
        lowStockProducts: productsWithCategories.filter(p => p.stock_status === 'low').length,
        outOfStockProducts: productsWithCategories.filter(p => p.stock_status === 'out').length
      }
    };
  }

  /**
   * Load categories with timeout protection
   */
  async _loadCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, description, is_active, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('❌ [OPTIMIZED] Categories loading error:', error);
      // Fallback to default categories
      return this._getDefaultCategories();
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ [OPTIMIZED] No categories found, using defaults');
      return this._getDefaultCategories();
    }

    return data;
  }

  /**
   * Load products using the optimized view
   */
  async _loadProductsOptimized(includeInactive = false) {
    try {
      // Try using the optimized view first
      const { data, error } = await supabase
        .from('products_optimized')
        .select('*');

      if (!error && data) {
        console.log('✅ [OPTIMIZED] Used products_optimized view');
        return data.map(this._transformProduct);
      }

      console.warn('⚠️ [OPTIMIZED] Optimized view not available, falling back to regular query');
    } catch (viewError) {
      console.warn('⚠️ [OPTIMIZED] Optimized view error:', viewError);
    }

    // Fallback to regular products table with optimized query
    const query = supabase
      .from('products')
      .select(`
        id, name, description, sku, barcode, brand_name,
        category_id, purchase_price, sale_price, mrp, quantity, unit,
        hsn_code, gst_rate, reorder_point, batch_no,
        manufacturing_date, expiry_date, supplier_name,
        is_active, created_at, updated_at, image_urls
      `)
      .order('name', { ascending: true });

    if (!includeInactive) {
      query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ [OPTIMIZED] Products loading error:', error);
      throw error;
    }

    return (data || []).map(this._transformProduct);
  }

  /**
   * Transform product data to match expected format
   */
  _transformProduct(product) {
    return {
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
  }

  /**
   * Resolve category names for products
   */
  _resolveCategoryNames(products, categories) {
    const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));
    
    return products.map(product => ({
      ...product,
      categoryName: product.category_name || categoryMap.get(product.category_id) || 'Unknown'
    }));
  }

  /**
   * Fallback loading method with more lenient settings
   */
  async _loadWithFallback(includeInactive) {
    console.warn('🔄 [OPTIMIZED] Attempting fallback loading...');
    
    try {
      // Very basic query with minimal fields
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, brand_name, category_id, sale_price, quantity, is_active')
        .eq('is_active', true)
        .limit(100); // Limit results for faster loading

      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, is_active')
        .eq('is_active', true);

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
        stats: {
          totalProducts: (products || []).length,
          totalCategories: (categories || []).length,
          lowStockProducts: 0,
          outOfStockProducts: 0
        },
        fallback: true
      };
    } catch (fallbackError) {
      console.error('❌ [OPTIMIZED] Fallback loading also failed:', fallbackError);
      return this._getEmptyInventory();
    }
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
   * Get empty inventory as last resort
   */
  _getEmptyInventory() {
    return {
      categories: this._getDefaultCategories(),
      products: [],
      stats: {
        totalProducts: 0,
        totalCategories: 6,
        lowStockProducts: 0,
        outOfStockProducts: 0
      },
      empty: true
    };
  }

  /**
   * Check if cached data is still valid
   */
  isCacheValid() {
    const cachedData = this.cache.get('inventory');
    if (!cachedData) return false;
    
    const age = Date.now() - cachedData.timestamp;
    return age < this.cacheTimeout;
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 [OPTIMIZED] Cache cleared');
  }

  /**
   * Get loading statistics
   */
  getStats() {
    const cachedData = this.cache.get('inventory');
    return {
      isCached: this.isCacheValid(),
      cacheAge: cachedData ? Date.now() - cachedData.timestamp : null,
      isLoading: this.isLoading,
      cacheSize: this.cache.size
    };
  }

  /**
   * Load categories count for dashboard
   */
  async getCategoryStats() {
    try {
      // Try using the optimized function first
      const { data, error } = await supabase
        .rpc('get_products_count_by_category');

      if (!error && data) {
        return data;
      }

      console.warn('⚠️ [OPTIMIZED] Category stats function not available, using fallback');
    } catch (funcError) {
      console.warn('⚠️ [OPTIMIZED] Category stats function error:', funcError);
    }

    // Fallback to manual query
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
      .eq('is_active', true);

    const stats = [];
    for (const category of categories || []) {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id)
        .eq('is_active', true);

      stats.push({
        category_id: category.id,
        category_name: category.name,
        product_count: count || 0
      });
    }

    return stats;
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(threshold = 10) {
    try {
      // Try using the optimized function first
      const { data, error } = await supabase
        .rpc('get_low_stock_products', { stock_threshold: threshold });

      if (!error && data) {
        return data;
      }

      console.warn('⚠️ [OPTIMIZED] Low stock function not available, using fallback');
    } catch (funcError) {
      console.warn('⚠️ [OPTIMIZED] Low stock function error:', funcError);
    }

    // Fallback query
    const { data, error } = await supabase
      .from('products')
      .select('id, name, quantity, reorder_point, category_id')
      .eq('is_active', true)
      .lte('quantity', threshold)
      .order('quantity', { ascending: true });

    return data || [];
  }
}

// Create and export singleton instance
export const optimizedInventoryService = new OptimizedInventoryService();
export default optimizedInventoryService;
