import { supabase, supabaseQuery } from './supabase';

/**
 * Supabase Database Service for Krishisethu Inventory Management
 * Replaces Firebase Firestore with PostgreSQL
 */

// Collections mapping (for compatibility with existing code)
export const COLLECTIONS = {
  USERS: 'users',
  SUPPLIERS: 'suppliers',
  PRODUCTS: 'products',
  PURCHASES: 'purchases',
  SALES: 'sales',
  CUSTOMERS: 'customers',
  CATEGORIES: 'categories',
  BRANDS: 'brands',
  SETTINGS: 'settings',
  STOCK_MOVEMENTS: 'stock_movements',
  AUDIT_LOGS: 'audit_logs',
  REPORTS: 'reports',
  EINVOICES: 'einvoices',
  CUSTOMER_PAYMENTS: 'customer_payments',
  CUSTOMER_BALANCES: 'customer_balances',
  SALE_ITEMS: 'sale_items',
  PURCHASE_ITEMS: 'purchase_items'
};

/**
 * Generic database operations
 */
export const dbOperations = {
  // Get all records from a table
  async getAll(table, options = {}) {
    try {
      let query = supabase.from(table).select('*');
      
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
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error getting ${table} by ID:`, error);
      throw error;
    }
  },

  // Create new record
  async create(table, record) {
    try {
      const { data, error } = await supabase
        .from(table)
        .insert(record)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error creating ${table}:`, error);
      throw error;
    }
  },

  // Update record
  async update(table, id, updates) {
    try {
      const { data, error } = await supabase
        .from(table)
        .update(updates)
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
      return true;
    } catch (error) {
      console.error(`Error deleting ${table}:`, error);
      throw error;
    }
  },

  // Search records
  async search(table, column, searchTerm) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .ilike(column, `%${searchTerm}%`);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error searching ${table}:`, error);
      throw error;
    }
  }
};

/**
 * Product operations
 */
export const productOperations = {
  async getAllProducts() {
    return dbOperations.getAll(COLLECTIONS.PRODUCTS, {
      orderBy: { field: 'name', ascending: true }
    });
  },

  async getProductById(id) {
    return dbOperations.getById(COLLECTIONS.PRODUCTS, id);
  },

  async createProduct(productData) {
    return dbOperations.create(COLLECTIONS.PRODUCTS, productData);
  },

  async updateProduct(id, updates) {
    return dbOperations.update(COLLECTIONS.PRODUCTS, id, updates);
  },

  async deleteProduct(id) {
    return dbOperations.delete(COLLECTIONS.PRODUCTS, id);
  },

  async searchProducts(searchTerm) {
    return dbOperations.search(COLLECTIONS.PRODUCTS, 'name', searchTerm);
  },

  async getLowStockProducts() {
    try {
      const { data, error } = await supabase
        .from(COLLECTIONS.PRODUCTS)
        .select('*')
        .lt('quantity', supabase.raw('min_stock_level'));
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting low stock products:', error);
      throw error;
    }
  },

  async getProductsByCategory(categoryId) {
    return dbOperations.getAll(COLLECTIONS.PRODUCTS, {
      where: { category_id: categoryId }
    });
  }
};

/**
 * Sales operations
 */
export const salesOperations = {
  async getAllSales() {
    return dbOperations.getAll(COLLECTIONS.SALES, {
      orderBy: { field: 'sale_date', ascending: false }
    });
  },

  async getSaleById(id) {
    try {
      // Get sale with items
      const { data: sale, error: saleError } = await supabase
        .from(COLLECTIONS.SALES)
        .select('*')
        .eq('id', id)
        .single();
        
      if (saleError) throw saleError;
      
      const { data: items, error: itemsError } = await supabase
        .from(COLLECTIONS.SALE_ITEMS)
        .select('*')
        .eq('sale_id', id);
        
      if (itemsError) throw itemsError;
      
      return { ...sale, items: items || [] };
    } catch (error) {
      console.error('Error getting sale by ID:', error);
      throw error;
    }
  },

  async createSale(saleData) {
    try {
      // Start transaction
      const { items, ...saleInfo } = saleData;
      
      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from(COLLECTIONS.SALES)
        .insert(saleInfo)
        .select()
        .single();
        
      if (saleError) throw saleError;
      
      // Create sale items
      if (items && items.length > 0) {
        const saleItems = items.map(item => ({
          ...item,
          sale_id: sale.id
        }));
        
        const { error: itemsError } = await supabase
          .from(COLLECTIONS.SALE_ITEMS)
          .insert(saleItems);
          
        if (itemsError) throw itemsError;
      }
      
      return sale;
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  },

  async getSalesByDateRange(startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from(COLLECTIONS.SALES)
        .select('*')
        .gte('sale_date', startDate)
        .lte('sale_date', endDate)
        .order('sale_date', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting sales by date range:', error);
      throw error;
    }
  }
};

/**
 * Customer operations
 */
export const customerOperations = {
  async getAllCustomers() {
    return dbOperations.getAll(COLLECTIONS.CUSTOMERS, {
      orderBy: { field: 'name', ascending: true }
    });
  },

  async getCustomerById(id) {
    return dbOperations.getById(COLLECTIONS.CUSTOMERS, id);
  },

  async createCustomer(customerData) {
    return dbOperations.create(COLLECTIONS.CUSTOMERS, customerData);
  },

  async updateCustomer(id, updates) {
    return dbOperations.update(COLLECTIONS.CUSTOMERS, id, updates);
  },

  async deleteCustomer(id) {
    return dbOperations.delete(COLLECTIONS.CUSTOMERS, id);
  },

  async searchCustomers(searchTerm) {
    return dbOperations.search(COLLECTIONS.CUSTOMERS, 'name', searchTerm);
  }
};

/**
 * Category operations
 */
export const categoryOperations = {
  async getAllCategories() {
    return dbOperations.getAll(COLLECTIONS.CATEGORIES, {
      orderBy: { field: 'sort_order', ascending: true }
    });
  },

  async getCategoryById(id) {
    return dbOperations.getById(COLLECTIONS.CATEGORIES, id);
  },

  async createCategory(categoryData) {
    return dbOperations.create(COLLECTIONS.CATEGORIES, categoryData);
  },

  async updateCategory(id, updates) {
    return dbOperations.update(COLLECTIONS.CATEGORIES, id, updates);
  },

  async deleteCategory(id) {
    return dbOperations.delete(COLLECTIONS.CATEGORIES, id);
  }
};

/**
 * Settings operations
 */
export const settingsOperations = {
  async getSetting(key) {
    try {
      const { data, error } = await supabase
        .from(COLLECTIONS.SETTINGS)
        .select('value')
        .eq('key', key)
        .single();
        
      if (error) throw error;
      return data?.value;
    } catch (error) {
      console.error('Error getting setting:', error);
      throw error;
    }
  },

  async setSetting(key, value, description = '') {
    try {
      const { data, error } = await supabase
        .from(COLLECTIONS.SETTINGS)
        .upsert({
          key,
          value,
          description,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error setting value:', error);
      throw error;
    }
  },

  async getAllSettings() {
    return dbOperations.getAll(COLLECTIONS.SETTINGS);
  }
};

/**
 * Stock movement operations
 */
export const stockOperations = {
  async recordStockMovement(movementData) {
    return dbOperations.create(COLLECTIONS.STOCK_MOVEMENTS, movementData);
  },

  async getStockMovements(productId) {
    return dbOperations.getAll(COLLECTIONS.STOCK_MOVEMENTS, {
      where: { product_id: productId },
      orderBy: { field: 'movement_date', ascending: false }
    });
  },

  async updateProductStock(productId, newQuantity, movementType, referenceId = null) {
    try {
      // Update product quantity
      await dbOperations.update(COLLECTIONS.PRODUCTS, productId, {
        quantity: newQuantity
      });

      // Record stock movement
      await this.recordStockMovement({
        product_id: productId,
        movement_type: movementType,
        quantity: newQuantity,
        reference_id: referenceId,
        movement_date: new Date().toISOString().split('T')[0]
      });

      return true;
    } catch (error) {
      console.error('Error updating product stock:', error);
      throw error;
    }
  }
};

// Export all operations
export {
  productOperations as products,
  salesOperations as sales,
  customerOperations as customers,
  categoryOperations as categories,
  settingsOperations as settings,
  stockOperations as stock
};
