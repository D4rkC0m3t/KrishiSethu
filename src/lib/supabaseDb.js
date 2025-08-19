import { supabase } from './supabase';

/**
 * Supabase Database Service for Krishisethu Inventory Management
 * Comprehensive service layer with field mapping and camelCase views support
 */

// Product type resolver - maps specific product names to database enum values
// Current database enum: ('Chemical', 'Organic', 'Bio', 'NPK', 'Seeds', 'Pesticide', 'Tools')
const resolveProductType = (productName, categoryName = '') => {
  const name = (productName || '').toLowerCase();
  const category = (categoryName || '').toLowerCase();

  console.log(`🔍 Resolving product type for: "${productName}" in category: "${categoryName}"`);

  // Strategy 1: Direct pattern matching on product name
  if (/npk|n.*p.*k/i.test(name)) {
    console.log('✅ Resolved to: NPK (pattern match)');
    return 'NPK';
  }

  if (/urea|dap|map|ssp|ammonium|potassium|calcium|chemical/i.test(name)) {
    console.log('✅ Resolved to: Chemical (pattern match)');
    return 'Chemical';
  }

  if (/vermi|compost|organic|manure|bone|neem|castor|poultry|seaweed|fish/i.test(name)) {
    console.log('✅ Resolved to: Organic (pattern match)');
    return 'Organic';
  }

  if (/rhizobium|bacteria|bio|azotobacter|mycorrhiza|phosphate.*solubilizing|algae/i.test(name)) {
    console.log('✅ Resolved to: Bio (pattern match)');
    return 'Bio';
  }

  if (/seeds|grain|wheat|rice|maize|cotton|groundnut|soybean|sunflower/i.test(name)) {
    console.log('✅ Resolved to: Seeds (pattern match)');
    return 'Seeds';
  }

  if (/insecticide|fungicide|herbicide|pesticide|spray|killer/i.test(name)) {
    console.log('✅ Resolved to: Pesticide (pattern match)');
    return 'Pesticide';
  }

  if (/tool|equipment|spade|hoe|sprayer|irrigation|meter/i.test(name)) {
    console.log('✅ Resolved to: Tools (pattern match)');
    return 'Tools';
  }

  // Strategy 2: Category-based mapping
  const categoryMap = {
    'seeds': 'Seeds',
    'chemical fertilizer': 'Chemical',
    'organic fertilizer': 'Organic',
    'bio fertilizer': 'Bio',
    'npk fertilizers': 'NPK',
    'pesticides': 'Pesticide',
    'pesticide': 'Pesticide',
    'tools': 'Tools',
    'tools & equipment': 'Tools'
  };

  const resolvedByCategory = categoryMap[category];
  if (resolvedByCategory) {
    console.log(`✅ Resolved to: ${resolvedByCategory} (category mapping)`);
    return resolvedByCategory;
  }

  // Default fallback
  console.log('⚠️ Using default: Chemical (fallback)');
  return 'Chemical';
};

// Collections mapping (for compatibility with existing code)
export const COLLECTIONS = {
  USERS: 'profiles', // Use profiles instead of users for consistency
  SUPPLIERS: 'suppliers',
  PRODUCTS: 'products',
  PURCHASES: 'purchases',
  SALES: 'sales',
  CUSTOMERS: 'customers',
  CATEGORIES: 'categories',
  BRANDS: 'brands',
  SETTINGS: 'settings',
  STOCK_MOVEMENTS: 'stock_movements',
  NOTIFICATIONS: 'notifications',
  SALE_ITEMS: 'sale_items',
  PURCHASE_ITEMS: 'purchase_items'
};

/**
 * Enhanced database operations with camelCase view support
 * Uses camelCase views when available, falls back to snake_case tables with field mapping
 */
export const dbOperations = {
  // Get all records from a table
  async getAll(table, options = {}) {
    try {
      // Try camelCase view first, fallback to snake_case table
      const viewName = `${table}_cc`;
      let query = supabase.from(viewName).select('*');
      
      // If view doesn't exist, fallback to original table
      const { error: viewError } = await supabase.from(viewName).select('id').limit(1);
      if (viewError) {
        console.log(`📋 Using table ${table} (view ${viewName} not available)`);
        query = supabase.from(table).select('*');
      } else {
        console.log(`📋 Using camelCase view ${viewName}`);
      }
      
      // Apply filters
      if (options.where) {
        Object.entries(options.where).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      // Apply ordering
      if (options.orderBy) {
        const { field, ascending = true } = options.orderBy;
        query = query.order(field, { ascending });
      }
      
      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error(`Error getting all ${table}:`, error);
      throw error;
    }
  },

  // Get record by ID
  async getById(table, id) {
    try {
      // Try camelCase view first
      const viewName = `${table}_cc`;
      let query = supabase.from(viewName).select('*').eq('id', id).single();
      
      const { data, error } = await query;
      
      // If view doesn't exist, fallback to original table
      if (error && error.code === 'PGRST106') {
        console.log(`📋 Fallback to table ${table} for ID ${id}`);
        const fallbackQuery = supabase.from(table).select('*').eq('id', id).single();
        const { data: fallbackData, error: fallbackError } = await fallbackQuery;
        
        if (fallbackError) throw fallbackError;
        return fallbackData;
      }
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error getting ${table} by ID:`, error);
      throw error;
    }
  },

  // Create new record (always uses snake_case table)
  async create(table, record) {
    try {
      let processedRecord = { ...record };

      // Special handling for products table - resolve product type enum
      if (table === 'products' && processedRecord.type) {
        const originalType = processedRecord.type;
        const categoryName = processedRecord.category || processedRecord.categoryName || '';
        processedRecord.type = resolveProductType(originalType, categoryName);
        console.log(`🔄 Product type resolved: "${originalType}" → "${processedRecord.type}"`);
      }

      // Convert camelCase to snake_case for database insertion
      const mappedRecord = convertToSnakeCase(processedRecord);
      console.log(`Creating ${table} with mapped data:`, mappedRecord);

      const { data, error } = await supabase
        .from(table)
        .insert(mappedRecord)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error creating ${table}:`, error);
      throw error;
    }
  },

  // Update record (always uses snake_case table)
  async update(table, id, updates) {
    try {
      let processedUpdates = { ...updates };

      // Special handling for products table - resolve product type enum
      if (table === 'products' && processedUpdates.type) {
        const originalType = processedUpdates.type;
        const categoryName = processedUpdates.category || processedUpdates.categoryName || '';
        processedUpdates.type = resolveProductType(originalType, categoryName);
        console.log(`🔄 Product type resolved: "${originalType}" → "${processedUpdates.type}"`);
      }

      // Convert camelCase to snake_case for database update
      const mappedUpdates = convertToSnakeCase(processedUpdates);
      console.log(`Updating ${table} with mapped data:`, mappedUpdates);

      const { data, error } = await supabase
        .from(table)
        .update(mappedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      throw error;
    }
  },

  // Delete record
  async delete(table, id) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error(`Error deleting ${table}:`, error);
      throw error;
    }
  },

  // Search records
  async search(table, column, searchTerm) {
    try {
      const viewName = `${table}_cc`;
      let query = supabase.from(viewName).select('*').ilike(column, `%${searchTerm}%`);
      
      const { data, error } = await query;
      
      // If view doesn't exist, fallback to original table
      if (error && error.code === 'PGRST106') {
        const fallbackQuery = supabase.from(table).select('*').ilike(column, `%${searchTerm}%`);
        const { data: fallbackData, error: fallbackError } = await fallbackQuery;
        
        if (fallbackError) throw fallbackError;
        return fallbackData || [];
      }
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error searching ${table}:`, error);
      throw error;
    }
  }
};

// Utility function to convert camelCase to snake_case
const convertToSnakeCase = (obj) => {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
};

// Utility function to convert snake_case to camelCase
const convertToCamelCase = (obj) => {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result;
};

/**
 * Service layer for each entity
 */

// Products Service
export const productsService = {
  async getAll() {
    return dbOperations.getAll('products', { 
      orderBy: { field: 'name', ascending: true } 
    });
  },

  async getById(id) {
    return dbOperations.getById('products', id);
  },

  async create(productData) {
    return dbOperations.create('products', productData);
  },

  async update(id, updates) {
    return dbOperations.update('products', id, updates);
  },

  async delete(id) {
    return dbOperations.delete('products', id);
  },

  async search(searchTerm) {
    return dbOperations.search('products', 'name', searchTerm);
  },

  async getWithRelations() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(id, name),
          suppliers(id, name),
          brands(id, name)
        `);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting products with relations:', error);
      throw error;
    }
  }
};

// Categories Service
export const categoriesService = {
  async getAll() {
    return dbOperations.getAll('categories', { 
      orderBy: { field: 'name', ascending: true } 
    });
  },

  async create(categoryData) {
    return dbOperations.create('categories', categoryData);
  },

  async update(id, updates) {
    return dbOperations.update('categories', id, updates);
  },

  async delete(id) {
    return dbOperations.delete('categories', id);
  }
};

// Suppliers Service
export const suppliersService = {
  async getAll() {
    return dbOperations.getAll('suppliers', { 
      orderBy: { field: 'name', ascending: true } 
    });
  },

  async create(supplierData) {
    return dbOperations.create('suppliers', supplierData);
  },

  async update(id, updates) {
    return dbOperations.update('suppliers', id, updates);
  },

  async delete(id) {
    return dbOperations.delete('suppliers', id);
  }
};

// Customers Service
export const customersService = {
  async getAll() {
    return dbOperations.getAll('customers', { 
      orderBy: { field: 'name', ascending: true } 
    });
  },

  async create(customerData) {
    return dbOperations.create('customers', customerData);
  },

  async update(id, updates) {
    return dbOperations.update('customers', id, updates);
  },

  async delete(id) {
    return dbOperations.delete('customers', id);
  }
};

// Sales Service
export const salesService = {
  async getAll() {
    return dbOperations.getAll('sales', { 
      orderBy: { field: 'sale_date', ascending: false } 
    });
  },

  async create(saleData) {
    return dbOperations.create('sales', saleData);
  },

  async update(id, updates) {
    return dbOperations.update('sales', id, updates);
  },

  async delete(id) {
    return dbOperations.delete('sales', id);
  },

  async getWithItems(saleId) {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items(*)
        `)
        .eq('id', saleId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting sale with items:', error);
      throw error;
    }
  }
};

// Purchases Service
export const purchasesService = {
  async getAll() {
    return dbOperations.getAll('purchases', { 
      orderBy: { field: 'purchase_date', ascending: false } 
    });
  },

  async create(purchaseData) {
    return dbOperations.create('purchases', purchaseData);
  },

  async update(id, updates) {
    return dbOperations.update('purchases', id, updates);
  },

  async delete(id) {
    return dbOperations.delete('purchases', id);
  }
};

// Brands Service
export const brandsService = {
  async getAll() {
    return dbOperations.getAll('brands', { 
      orderBy: { field: 'name', ascending: true } 
    });
  },

  async create(brandData) {
    return dbOperations.create('brands', brandData);
  },

  async update(id, updates) {
    return dbOperations.update('brands', id, updates);
  },

  async delete(id) {
    return dbOperations.delete('brands', id);
  }
};

// Stock Movements Service
export const stockMovementsService = {
  async getAll() {
    return dbOperations.getAll('stock_movements', { 
      orderBy: { field: 'created_at', ascending: false } 
    });
  },

  async create(movementData) {
    return dbOperations.create('stock_movements', movementData);
  },

  async getByProduct(productId) {
    return dbOperations.getAll('stock_movements', {
      where: { product_id: productId },
      orderBy: { field: 'created_at', ascending: false }
    });
  }
};

// Notifications Service
export const notificationsService = {
  async getAll(userId = null) {
    const options = { 
      orderBy: { field: 'created_at', ascending: false } 
    };
    
    if (userId) {
      options.where = { user_id: userId };
    }
    
    return dbOperations.getAll('notifications', options);
  },

  async create(notificationData) {
    return dbOperations.create('notifications', notificationData);
  },

  async markAsRead(id) {
    return dbOperations.update('notifications', id, { is_read: true });
  },

  async delete(id) {
    return dbOperations.delete('notifications', id);
  }
};

// Database health and diagnostics
export const databaseDiagnostics = {
  async getTableCounts() {
    try {
      const tables = ['products', 'categories', 'suppliers', 'customers', 'sales', 'purchases', 'brands', 'stock_movements', 'profiles'];
      const counts = {};

      for (const table of tables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

          if (error) {
            console.warn(`Could not get count for ${table}:`, error);
            counts[table] = 'N/A';
          } else {
            counts[table] = count || 0;
          }
        } catch (err) {
          console.warn(`Error counting ${table}:`, err);
          counts[table] = 'Error';
        }
      }

      return counts;
    } catch (error) {
      console.error('Error getting table counts:', error);
      throw error;
    }
  },

  async checkViewsExist() {
    try {
      const views = ['products_cc', 'sales_cc', 'categories_cc', 'suppliers_cc'];
      const viewStatus = {};

      for (const view of views) {
        try {
          const { error } = await supabase.from(view).select('id').limit(1);
          viewStatus[view] = !error;
        } catch (err) {
          viewStatus[view] = false;
        }
      }

      return viewStatus;
    } catch (error) {
      console.error('Error checking views:', error);
      throw error;
    }
  },

  async healthCheck() {
    try {
      const [tableCounts, viewStatus] = await Promise.all([
        this.getTableCounts(),
        this.checkViewsExist()
      ]);

      const totalRecords = Object.values(tableCounts)
        .filter(count => typeof count === 'number')
        .reduce((sum, count) => sum + count, 0);

      const viewsAvailable = Object.values(viewStatus).filter(Boolean).length;
      const totalViews = Object.keys(viewStatus).length;

      return {
        timestamp: new Date().toISOString(),
        tableCounts,
        viewStatus,
        totalRecords,
        viewsAvailable: `${viewsAvailable}/${totalViews}`,
        overall: totalRecords > 0 ? 'healthy' : 'needs_data'
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        timestamp: new Date().toISOString(),
        overall: 'error',
        error: error.message
      };
    }
  }
};

export default {
  COLLECTIONS,
  dbOperations,
  productsService,
  categoriesService,
  suppliersService,
  customersService,
  salesService,
  purchasesService,
  brandsService,
  stockMovementsService,
  notificationsService,
  databaseDiagnostics
};