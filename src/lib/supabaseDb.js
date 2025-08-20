import { supabase } from './supabase';

/**
 * Supabase Database Service for Krishisethu Inventory Management
 * Replaces Firebase Firestore with PostgreSQL
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
    'pesticides': 'Pesticide', // Primary: plural form
    'pesticide': 'Pesticide',  // Support singular for compatibility
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

// Field mapping utilities for camelCase <-> snake_case conversion
const fieldMappings = {
  categories: {
    // JavaScript camelCase -> SQL snake_case
    toDb: {
      sortOrder: 'sort_order',
      isActive: 'is_active',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    // SQL snake_case -> JavaScript camelCase
    fromDb: {
      sort_order: 'sortOrder',
      is_active: 'isActive',
      created_at: 'createdAt',
      updated_at: 'updatedAt'
    }
  },
  brands: {
    // JavaScript camelCase -> SQL snake_case
    toDb: {
      isActive: 'is_active',
      logoUrl: 'logo_url',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    // SQL snake_case -> JavaScript camelCase
    fromDb: {
      is_active: 'isActive',
      logo_url: 'logoUrl',
      created_at: 'createdAt',
      updated_at: 'updatedAt'
    }
  },
  products: {
    // JavaScript camelCase -> SQL snake_case
    toDb: {
      batchNo: 'batch_no',
      expiryDate: 'expiry_date',
      manufacturingDate: 'manufacturing_date',
      purchasePrice: 'purchase_price',
      salePrice: 'sale_price',
      minStockLevel: 'min_stock_level',
      maxStockLevel: 'max_stock_level',
      reorderPoint: 'reorder_point',
      supplierId: 'supplier_id',
      categoryId: 'category_id',
      brandId: 'brand_id',
      brand: 'brand_id', // Map old 'brand' field to 'brand_id' for backward compatibility
      hsn: 'hsn_code',
      hsnCode: 'hsn_code',
      gstRate: 'gst_rate',
      imageUrls: 'image_urls',
      attachments: 'attachments', // JSONB field for file attachments
      isActive: 'is_active',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    // SQL snake_case -> JavaScript camelCase
    fromDb: {
      batch_no: 'batchNo',
      expiry_date: 'expiryDate',
      manufacturing_date: 'manufacturingDate',
      purchase_price: 'purchasePrice',
      sale_price: 'salePrice',
      min_stock_level: 'minStockLevel',
      max_stock_level: 'maxStockLevel',
      reorder_point: 'reorderPoint',
      supplier_id: 'supplierId',
      category_id: 'categoryId',
      brand_id: 'brandId',
      hsn_code: 'hsn',
      gst_rate: 'gstRate',
      image_urls: 'imageUrls',
      attachments: 'attachments', // JSONB field for file attachments
      is_active: 'isActive',
      created_at: 'createdAt',
      updated_at: 'updatedAt'
    }
  },
  suppliers: {
    // JavaScript camelCase -> SQL snake_case
    toDb: {
      contactPerson: 'contact_person',
      gstNumber: 'gst_number',
      panNumber: 'pan_number',
      paymentTerms: 'payment_terms',
      creditLimit: 'credit_limit',
      outstandingAmount: 'outstanding_amount',
      isActive: 'is_active',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    // SQL snake_case -> JavaScript camelCase
    fromDb: {
      contact_person: 'contactPerson',
      gst_number: 'gstNumber',
      pan_number: 'panNumber',
      payment_terms: 'paymentTerms',
      credit_limit: 'creditLimit',
      outstanding_amount: 'outstandingAmount',
      is_active: 'isActive',
      created_at: 'createdAt',
      updated_at: 'updatedAt'
    }
  },
  purchases: {
    // JavaScript camelCase -> SQL snake_case
    toDb: {
      supplierId: 'supplier_id',
      supplierName: 'supplier_name',
      purchaseNumber: 'purchase_number',
      totalAmount: 'total_amount',
      taxAmount: 'tax_amount',
      paymentStatus: 'payment_status',
      amountPaid: 'amount_paid',
      // Removed balanceAmount mapping - column doesn't exist in database schema
      invoiceNumber: 'invoice_number',
      invoiceDate: 'invoice_date',
      purchaseDate: 'purchase_date',
      createdBy: 'created_by',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    // SQL snake_case -> JavaScript camelCase
    fromDb: {
      supplier_id: 'supplierId',
      supplier_name: 'supplierName',
      purchase_number: 'purchaseNumber',
      total_amount: 'totalAmount',
      tax_amount: 'taxAmount',
      payment_status: 'paymentStatus',
      amount_paid: 'amountPaid',
      // Removed balanceAmount mapping - column doesn't exist in database schema
      invoice_number: 'invoiceNumber',
      invoice_date: 'invoiceDate',
      purchase_date: 'purchaseDate',
      created_by: 'createdBy',
      created_at: 'createdAt',
      updated_at: 'updatedAt'
    }
  },
  customers: {
    // JavaScript camelCase -> SQL snake_case
    toDb: {
      contactPerson: 'contact_person',
      gstNumber: 'gst_number',
      panNumber: 'pan_number',
      creditLimit: 'credit_limit',
      outstandingAmount: 'outstanding_amount',
      totalPurchases: 'total_purchases',
      isActive: 'is_active',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    // SQL snake_case -> JavaScript camelCase
    fromDb: {
      contact_person: 'contactPerson',
      gst_number: 'gstNumber',
      pan_number: 'panNumber',
      credit_limit: 'creditLimit',
      outstanding_amount: 'outstandingAmount',
      total_purchases: 'totalPurchases',
      is_active: 'isActive',
      created_at: 'createdAt',
      updated_at: 'updatedAt'
    }
  },
  sales: {
    // JavaScript camelCase -> SQL snake_case
    toDb: {
      saleNumber: 'sale_number',
      customerId: 'customer_id',
      customerName: 'customer_name',
      totalAmount: 'total_amount',
      taxAmount: 'tax_amount',
      paymentMethod: 'payment_method',
      amountPaid: 'amount_paid',
      paymentStatus: 'payment_status',
      saleDate: 'sale_date',
      createdBy: 'created_by',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    // SQL snake_case -> JavaScript camelCase
    fromDb: {
      sale_number: 'saleNumber',
      customer_id: 'customerId',
      customer_name: 'customerName',
      total_amount: 'totalAmount',
      tax_amount: 'taxAmount',
      payment_method: 'paymentMethod',
      amount_paid: 'amountPaid',
      payment_status: 'paymentStatus',
      sale_date: 'saleDate',
      created_by: 'createdBy',
      created_at: 'createdAt',
      updated_at: 'updatedAt'
    }
  },
  sale_items: {
    // JavaScript camelCase -> SQL snake_case
    toDb: {
      saleId: 'sale_id',
      productId: 'product_id',
      productName: 'product_name',
      unitPrice: 'unit_price',
      totalPrice: 'total_price',
      gstRate: 'gst_rate',
      batchNo: 'batch_no',
      createdAt: 'created_at'
    },
    // SQL snake_case -> JavaScript camelCase
    fromDb: {
      sale_id: 'saleId',
      product_id: 'productId',
      product_name: 'productName',
      unit_price: 'unitPrice',
      total_price: 'totalPrice',
      gst_rate: 'gstRate',
      batch_no: 'batchNo',
      created_at: 'createdAt'
    }
  },
  purchase_items: {
    // JavaScript camelCase -> SQL snake_case
    toDb: {
      purchaseId: 'purchase_id',
      productId: 'product_id',
      productName: 'product_name',
      unitPrice: 'unit_price',
      totalPrice: 'total_price',
      gstRate: 'gst_rate',
      batchNo: 'batch_no',
      expiryDate: 'expiry_date',
      createdAt: 'created_at'
    },
    // SQL snake_case -> JavaScript camelCase
    fromDb: {
      purchase_id: 'purchaseId',
      product_id: 'productId',
      product_name: 'productName',
      unit_price: 'unitPrice',
      total_price: 'totalPrice',
      gst_rate: 'gstRate',
      batch_no: 'batchNo',
      expiry_date: 'expiryDate',
      created_at: 'createdAt'
    }
  }
};

// Utility functions for field mapping
const mapFieldsToDb = (data, collection) => {
  const mapping = fieldMappings[collection]?.toDb;
  if (!mapping) return data;

  const mapped = { ...data };
  Object.keys(mapping).forEach(jsField => {
    if (jsField in mapped) {
      mapped[mapping[jsField]] = mapped[jsField];
      delete mapped[jsField];
    }
  });
  return mapped;
};

const mapFieldsFromDb = (data, collection) => {
  const mapping = fieldMappings[collection]?.fromDb;
  if (!mapping) return data;

  const mapped = { ...data };
  Object.keys(mapping).forEach(dbField => {
    if (dbField in mapped) {
      mapped[mapping[dbField]] = mapped[dbField];
      delete mapped[dbField];
    }
  });
  return mapped;
};

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
  EINVOICES: 'einvoices',           // Dedicated E-invoice table
  EINVOICE_ITEMS: 'einvoice_items', // E-invoice line items table
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

      // Map fields from database snake_case to JavaScript camelCase
      const mappedData = (data || []).map(item => mapFieldsFromDb(item, table));
      return mappedData;
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

      // Map fields from database snake_case to JavaScript camelCase
      const mappedData = mapFieldsFromDb(data, table);
      return mappedData;
    } catch (error) {
      console.error(`Error getting ${table} by ID:`, error);
      throw error;
    }
  },

  // Create new record
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

      // Map fields from JavaScript camelCase to database snake_case
      const mappedRecord = mapFieldsToDb(processedRecord, table);
      console.log(`Creating ${table} with mapped data:`, mappedRecord);

      const { data, error } = await supabase
        .from(table)
        .insert(mappedRecord)
        .select()
        .single();

      if (error) throw error;

      // Map fields back from database snake_case to JavaScript camelCase
      const mappedData = mapFieldsFromDb(data, table);
      return mappedData;
    } catch (error) {
      console.error(`Error creating ${table}:`, error);
      throw error;
    }
  },

  // Update record
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

      // Map fields from JavaScript camelCase to database snake_case
      const mappedUpdates = mapFieldsToDb(processedUpdates, table);
      console.log(`Updating ${table} with mapped data:`, mappedUpdates);

      const { data, error } = await supabase
        .from(table)
        .update(mappedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Map fields back from database snake_case to JavaScript camelCase
      const mappedData = mapFieldsFromDb(data, table);
      return mappedData;
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
    try {
      // Enhanced query with brand and category joins
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          brands(id, name),
          categories(id, name)
        `)
        .order('name', { ascending: true });

      if (error) throw error;

      console.log('🔍 Raw product data with joins:', data?.slice(0, 2)); // Log first 2 products for debugging

      // Map the joined data to include brand and category names
      const mappedProducts = (data || []).map(product => {
        const mappedProduct = mapFieldsFromDb(product, 'products');

        // Add brand and category names from joins
        if (product.brands) {
          mappedProduct.brandName = product.brands.name;
          mappedProduct.brand = product.brands.name; // For backward compatibility
        } else {
          mappedProduct.brandName = 'No Brand';
          mappedProduct.brand = 'No Brand';
        }

        if (product.categories) {
          mappedProduct.categoryName = product.categories.name;
          mappedProduct.category = product.categories.name; // For backward compatibility
        } else {
          mappedProduct.categoryName = 'No Category';
          mappedProduct.category = 'No Category';
        }

        return mappedProduct;
      });

      console.log('✅ Mapped products with brand/category:', mappedProducts?.slice(0, 2)); // Log first 2 for debugging
      return mappedProducts;
    } catch (error) {
      console.error('Error getting products with joins:', error);
      // Fallback to basic query without joins
      return dbOperations.getAll(COLLECTIONS.PRODUCTS, {
        orderBy: { field: 'name', ascending: true }
      });
    }
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
  },

  async updateSale(id, updates) {
    return dbOperations.update(COLLECTIONS.SALES, id, updates);
  },

  async deleteSale(id) {
    return dbOperations.delete(COLLECTIONS.SALES, id);
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
      console.log(`🔄 Setting key: ${key}, value:`, value);

      // First, try to update existing setting
      const { data: existingData, error: selectError } = await supabase
        .from(COLLECTIONS.SETTINGS)
        .select('id')
        .eq('key', key)
        .single();

      let data, error;

      if (existingData) {
        // Update existing setting
        console.log(`🔄 Updating existing setting: ${key}`);
        const updateResult = await supabase
          .from(COLLECTIONS.SETTINGS)
          .update({
            value,
            description,
            updated_at: new Date().toISOString()
          })
          .eq('key', key)
          .select()
          .single();

        data = updateResult.data;
        error = updateResult.error;
      } else {
        // Insert new setting
        console.log(`🔄 Inserting new setting: ${key}`);
        const insertResult = await supabase
          .from(COLLECTIONS.SETTINGS)
          .insert({
            key,
            value,
            description,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        data = insertResult.data;
        error = insertResult.error;
      }

      if (error) {
        console.error('❌ Supabase error setting value:', error);
        throw error;
      }

      console.log(`✅ Successfully set ${key}:`, data);
      return data;
    } catch (error) {
      console.error('❌ Error setting value:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
  },

  async getAllSettings() {
    return dbOperations.getAll(COLLECTIONS.SETTINGS);
  },

  // Test database connection and settings table
  async testConnection() {
    try {
      console.log('🔄 Testing database connection...');

      // Test basic connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from(COLLECTIONS.SETTINGS)
        .select('count', { count: 'exact', head: true });

      if (connectionError) {
        console.error('❌ Database connection failed:', connectionError);
        throw connectionError;
      }

      console.log('✅ Database connection successful');
      console.log(`✅ Settings table exists with ${connectionTest?.length || 0} records`);

      // Test if we can read settings
      const settings = await this.getAllSettings();
      console.log(`✅ Can read settings: ${settings.length} records found`);

      // Test if we can write settings (with a test setting)
      const testKey = 'test.connection';
      const testValue = new Date().toISOString();
      await this.setSetting(testKey, testValue, 'Connection test');
      console.log('✅ Can write settings');

      // Clean up test setting
      try {
        await supabase
          .from(COLLECTIONS.SETTINGS)
          .delete()
          .eq('key', testKey);
        console.log('✅ Test setting cleaned up');
      } catch (cleanupError) {
        console.warn('⚠️ Could not clean up test setting:', cleanupError);
      }

      // Test the schema
      const schemaInfo = await this.getTableSchema();
      console.log('✅ Settings table schema:', schemaInfo);

      return {
        success: true,
        settingsCount: settings.length,
        schema: schemaInfo,
        message: 'Database connection and settings table working properly'
      };
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      return {
        success: false,
        error: error.message,
        message: 'Database connection or settings table has issues'
      };
    }
  },

  // Get settings table schema information
  async getTableSchema() {
    try {
      // Get table information from PostgreSQL system tables
      const { data, error } = await supabase
        .rpc('get_table_schema', { table_name: 'settings' });

      if (error) {
        console.warn('Could not get schema via RPC, trying alternative method');

        // Alternative: Try to get a sample record to see the structure
        const { data: sampleData, error: sampleError } = await supabase
          .from(COLLECTIONS.SETTINGS)
          .select('*')
          .limit(1);

        if (sampleError) throw sampleError;

        const columns = sampleData.length > 0 ? Object.keys(sampleData[0]) : [];
        return {
          method: 'sample_record',
          columns: columns,
          sample: sampleData[0] || null
        };
      }

      return {
        method: 'rpc',
        schema: data
      };
    } catch (error) {
      console.error('Could not get table schema:', error);
      return {
        method: 'error',
        error: error.message
      };
    }
  },

  // Clean up duplicate settings (keep the most recent one)
  async cleanupDuplicateSettings() {
    try {
      console.log('🔄 Checking for duplicate settings...');

      // Get all settings grouped by key
      const { data: allSettings, error } = await supabase
        .from(COLLECTIONS.SETTINGS)
        .select('*')
        .order('key', { ascending: true })
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const duplicates = [];
      const seen = new Set();
      const toDelete = [];

      allSettings.forEach(setting => {
        if (seen.has(setting.key)) {
          // This is a duplicate, mark for deletion
          toDelete.push(setting.id);
          duplicates.push(setting.key);
        } else {
          seen.add(setting.key);
        }
      });

      if (toDelete.length > 0) {
        console.log(`🔄 Found ${toDelete.length} duplicate settings to clean up:`, duplicates);

        // Delete duplicates
        const { error: deleteError } = await supabase
          .from(COLLECTIONS.SETTINGS)
          .delete()
          .in('id', toDelete);

        if (deleteError) throw deleteError;

        console.log(`✅ Cleaned up ${toDelete.length} duplicate settings`);
        return {
          success: true,
          duplicatesRemoved: toDelete.length,
          duplicateKeys: [...new Set(duplicates)]
        };
      } else {
        console.log('✅ No duplicate settings found');
        return {
          success: true,
          duplicatesRemoved: 0,
          duplicateKeys: []
        };
      }
    } catch (error) {
      console.error('❌ Error cleaning up duplicate settings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get all system settings as a structured object
  async getSystemSettings() {
    try {
      const { data, error } = await supabase
        .from(COLLECTIONS.SETTINGS)
        .select('*');

      if (error) throw error;

      // Convert array of settings to structured object
      const settings = {};
      data?.forEach(setting => {
        const keys = setting.key.split('.');
        let current = settings;

        // Create nested structure based on key path
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }

        // Set the final value
        current[keys[keys.length - 1]] = setting.value;
      });

      return settings;
    } catch (error) {
      console.error('Error getting system settings:', error);
      return {};
    }
  },

  // Update a section of settings (e.g., 'companyInfo', 'taxSettings')
  async updateSettingSection(section, data) {
    try {
      console.log(`🔄 Updating settings section: ${section}`);
      console.log(`🔄 Data to save:`, data);

      const promises = [];
      let settingCount = 0;

      // Flatten the data object and create setting keys
      const flattenObject = (obj, prefix = '') => {
        Object.keys(obj).forEach(key => {
          const value = obj[key];
          const settingKey = prefix ? `${prefix}.${key}` : key;

          if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            // Recursively flatten nested objects
            console.log(`🔄 Flattening nested object: ${settingKey}`);
            flattenObject(value, settingKey);
          } else {
            // Store the value
            console.log(`🔄 Adding setting: ${settingKey} = ${value}`);
            settingCount++;
            promises.push(
              this.setSetting(settingKey, value, `${section} setting: ${key}`)
            );
          }
        });
      };

      flattenObject(data, section);

      console.log(`🔄 Total settings to save: ${settingCount}`);
      console.log(`🔄 Executing ${promises.length} setting updates...`);

      // Execute all setting updates
      const results = await Promise.all(promises);

      console.log(`✅ Successfully saved ${results.length} settings for section: ${section}`);
      return true;
    } catch (error) {
      console.error('Error updating setting section:', error);
      throw error;
    }
  },

  // Get settings by category
  async getSettingsByCategory(category) {
    try {
      console.log(`🔍 Getting settings by category: ${category}`);

      const { data, error } = await supabase
        .from(COLLECTIONS.SETTINGS)
        .select('*')
        .eq('category', category);

      if (error) {
        console.error(`❌ Error getting settings by category ${category}:`, error);
        throw error;
      }

      console.log(`✅ Found ${data?.length || 0} settings for category ${category}`);
      return data || [];
    } catch (error) {
      console.error('❌ Error getting settings by category:', error);
      return [];
    }
  },

  // Initialize default settings if they don't exist
  async initializeDefaultSettings() {
    try {
      const defaultSettings = [
        {
          key: 'companyInfo.name',
          value: 'KrishiSethu Fertilizers',
          description: 'Company name',
          category: 'company'
        },
        {
          key: 'companyInfo.logo',
          value: '/Logo.png',
          description: 'Company logo URL',
          category: 'company'
        },
        {
          key: 'companyInfo.phone',
          value: '+91-9876543210',
          description: 'Company phone number',
          category: 'company'
        },
        {
          key: 'companyInfo.email',
          value: 'info@krishisethu.com',
          description: 'Company email',
          category: 'company'
        },
        {
          key: 'companyInfo.gstNumber',
          value: '27AAAAA0000A1Z5',
          description: 'Company GST number',
          category: 'company'
        },
        {
          key: 'companyInfo.address.street',
          value: '123 Agricultural Complex',
          description: 'Company street address',
          category: 'company'
        },
        {
          key: 'companyInfo.address.city',
          value: 'Mumbai',
          description: 'Company city',
          category: 'company'
        },
        {
          key: 'companyInfo.address.state',
          value: 'Maharashtra',
          description: 'Company state',
          category: 'company'
        },
        {
          key: 'companyInfo.address.pincode',
          value: '400001',
          description: 'Company pincode',
          category: 'company'
        }
      ];

      const promises = defaultSettings.map(setting =>
        this.setSetting(setting.key, setting.value, setting.description)
      );

      await Promise.all(promises);
      console.log('Default settings initialized');
      return true;
    } catch (error) {
      console.error('Error initializing default settings:', error);
      throw error;
    }
  }
};

/**
 * Stock movement operations
 */
export const stockOperations = {
  async recordStockMovement(movementData) {
    try {
      console.log('📝 Recording stock movement:', movementData);

      // Clean the data to only include columns that exist in the database schema
      const cleanMovementData = {
        product_id: movementData.product_id,
        movement_type: movementData.movement_type,
        quantity: movementData.quantity,
        reference_type: movementData.reference_type || null,
        reference_id: movementData.reference_id || null,
        batch_no: movementData.batch_no || null,
        notes: movementData.notes || null,
        created_by: movementData.created_by || null,
        movement_date: movementData.movement_date || new Date().toISOString().split('T')[0]
      };

      // Remove any undefined values and non-existent columns
      Object.keys(cleanMovementData).forEach(key => {
        if (cleanMovementData[key] === undefined) {
          delete cleanMovementData[key];
        }
      });

      console.log('📝 Clean movement data for database:', cleanMovementData);
      return dbOperations.create(COLLECTIONS.STOCK_MOVEMENTS, cleanMovementData);
    } catch (error) {
      console.error('❌ Error recording stock movement:', error);
      throw error;
    }
  },

  async getAll() {
    try {
      console.log('📊 Fetching stock movements with product details...');

      // Join with products table to get product names
      const { data, error } = await supabase
        .from(COLLECTIONS.STOCK_MOVEMENTS)
        .select(`
          *,
          products!inner(
            id,
            name,
            code
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching stock movements:', error);
        throw error;
      }

      // Transform data to include product names
      const transformedData = (data || []).map(movement => ({
        ...movement,
        product_name: movement.products?.name || 'Unknown Product',
        product_code: movement.products?.code || null
      }));

      console.log('✅ Stock movements with product details:', transformedData.length);
      return transformedData;
    } catch (error) {
      console.error('❌ Error in stockOperations.getAll:', error);
      // Fallback to basic query without joins
      return dbOperations.getAll(COLLECTIONS.STOCK_MOVEMENTS, {
        orderBy: { field: 'created_at', ascending: false }
      });
    }
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

// Export all operations with both naming conventions for compatibility
export {
  productOperations as products,
  salesOperations as sales,
  customerOperations as customers,
  categoryOperations as categories,
  settingsOperations as settings,
  stockOperations as stock
};

// Export with Firebase-compatible service names for easy migration
export const productsService = {
  ...productOperations,
  // Add Firebase-compatible method names
  add: productOperations.createProduct,
  getAll: productOperations.getAllProducts,
  getById: productOperations.getProductById,
  update: productOperations.updateProduct,
  delete: productOperations.deleteProduct
};
export const salesService = {
  ...salesOperations,
  // Add Firebase-compatible method names
  add: salesOperations.createSale,
  create: salesOperations.createSale,  // Add create method
  getAll: salesOperations.getAllSales,
  getById: salesOperations.getSaleById,
  update: salesOperations.updateSale,
  delete: salesOperations.deleteSale
};
export const customersService = {
  ...customerOperations,
  // Add Firebase-compatible method names
  add: customerOperations.createCustomer,
  create: customerOperations.createCustomer,  // Add create method
  getAll: customerOperations.getAllCustomers,
  getById: customerOperations.getCustomerById,
  update: customerOperations.updateCustomer,
  delete: customerOperations.deleteCustomer
};
export const suppliersService = {
  async getAll() {
    return dbOperations.getAll(COLLECTIONS.SUPPLIERS, {
      orderBy: { field: 'name', ascending: true }
    });
  },
  async add(supplierData) {
    return dbOperations.create(COLLECTIONS.SUPPLIERS, supplierData);
  },
  async create(supplierData) {
    // Alias for add method for compatibility
    return this.add(supplierData);
  },
  async update(id, supplierData) {
    return dbOperations.update(COLLECTIONS.SUPPLIERS, id, supplierData);
  },
  async delete(id) {
    return dbOperations.delete(COLLECTIONS.SUPPLIERS, id);
  },
  async getById(id) {
    return dbOperations.getById(COLLECTIONS.SUPPLIERS, id);
  }
};
export const brandsService = {
  async getAll() {
    return dbOperations.getAll(COLLECTIONS.BRANDS, {
      orderBy: { field: 'name', ascending: true }
    });
  },
  async add(brandData) {
    return dbOperations.create(COLLECTIONS.BRANDS, brandData);
  },
  async update(id, brandData) {
    return dbOperations.update(COLLECTIONS.BRANDS, id, brandData);
  },
  async delete(id) {
    return dbOperations.delete(COLLECTIONS.BRANDS, id);
  },
  async getById(id) {
    return dbOperations.getById(COLLECTIONS.BRANDS, id);
  }
};

// Categories Service - using categoryOperations for compatibility
export const categoriesService = {
  async getAll() {
    return categoryOperations.getAllCategories();
  },
  async add(categoryData) {
    return categoryOperations.createCategory(categoryData);
  },
  async update(id, categoryData) {
    return categoryOperations.updateCategory(id, categoryData);
  },
  async delete(id) {
    return categoryOperations.deleteCategory(id);
  },
  async getById(id) {
    return categoryOperations.getCategoryById(id);
  }
};

export const usersService = {
  async getAll() {
    try {
      console.log('🔍 Attempting to fetch users from table:', COLLECTIONS.USERS);
      const result = await dbOperations.getAll(COLLECTIONS.USERS, {
        orderBy: { field: 'created_at', ascending: false }
      });
      console.log('✅ Users fetched successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      console.error('Error details:', error.message);
      throw error;
    }
  },

  async create(userData) {
    try {
      console.log('🔍 Attempting to create user via Supabase Auth:', userData);

      // Check if this is a direct database insert (legacy) or proper auth creation
      if (userData.id && !userData.password) {
        // This is a legacy direct insert - will fail with foreign key constraint
        console.warn('⚠️ Attempting direct database insert - this will fail due to foreign key constraint');
        console.warn('⚠️ Use createUserWithAuth() method instead for proper user creation');

        // Try the direct insert but expect it to fail
        const result = await dbOperations.create(COLLECTIONS.USERS, userData);
        console.log('✅ User created successfully (direct insert):', result);
        return result;
      } else {
        throw new Error('Use createUserWithAuth() method for proper user creation with authentication');
      }
    } catch (error) {
      console.error('❌ Error creating user:', error);
      console.error('Error details:', error.message);

      // If it's a foreign key constraint error, provide helpful guidance
      if (error.message.includes('foreign key constraint') || error.message.includes('users_id_fkey')) {
        console.error('🔧 SOLUTION: This error occurs because the user ID doesn\'t exist in auth.users table.');
        console.error('🔧 Use createUserWithAuth() method instead, or run the fix-user-foreign-key-constraint.sql script.');
      }

      throw error;
    }
  },

  async createUserWithAuth(userData) {
    try {
      console.log('🔍 Creating user with Supabase Auth:', userData);

      // Create user through Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password || 'TempPassword123!', // Temporary password
        options: {
          data: {
            name: userData.name,
            role: userData.role || 'staff',
            phone: userData.phone
          }
        }
      });

      if (authError) {
        console.error('❌ Auth creation failed:', authError);
        throw authError;
      }

      console.log('✅ User created in auth.users:', authData.user?.id);

      // The trigger should automatically create the public.users record
      // Wait a moment and then fetch the created user
      await new Promise(resolve => setTimeout(resolve, 1000));

      const publicUser = await this.getById(authData.user.id);
      console.log('✅ Public user record created:', publicUser);

      return publicUser;
    } catch (error) {
      console.error('❌ Error creating user with auth:', error);
      throw error;
    }
  },

  async update(id, userData) {
    return dbOperations.update(COLLECTIONS.USERS, id, userData);
  },
  async delete(id) {
    return dbOperations.delete(COLLECTIONS.USERS, id);
  },
  async getById(id) {
    return dbOperations.getById(COLLECTIONS.USERS, id);
  }
};
export const purchasesService = {
  async getAll() {
    return dbOperations.getAll(COLLECTIONS.PURCHASES, {
      orderBy: { field: 'purchase_date', ascending: false }
    });
  },
  async add(purchaseData) {
    return dbOperations.create(COLLECTIONS.PURCHASES, purchaseData);
  },
  async update(id, purchaseData) {
    return dbOperations.update(COLLECTIONS.PURCHASES, id, purchaseData);
  },
  async delete(id) {
    return dbOperations.delete(COLLECTIONS.PURCHASES, id);
  }
};

// Comprehensive E-Invoice service for dedicated einvoices table
export const einvoicesService = {
  // Get all E-invoices with optional filtering
  async getAll(filters = {}) {
    try {
      // Try einvoices table first, fallback to sales table
      let query;
      let tableName = 'einvoices';

      try {
        query = supabase
          .from('einvoices')
          .select(`
            *,
            customer:customers(id, name, phone, email, address, gst_number)
          `)
          .order('created_at', { ascending: false });
      } catch (error) {
        console.log('📋 E-invoices table not found, using sales table as fallback');
        tableName = 'sales';
        query = supabase
          .from('sales')
          .select(`
            *,
            customer:customers(id, name, phone, email, address, gst_number)
          `)
          .order('created_at', { ascending: false });
      }

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }
      if (filters.date_from) {
        query = query.gte('invoice_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('invoice_date', filters.date_to);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching E-invoices:', error);
      throw error;
    }
  },

  // Get single E-invoice with items
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('einvoices')
        .select(`
          *,
          customer:customers(id, name, phone, email, address, gst_number),
          items:einvoice_items(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching E-invoice:', error);
      throw error;
    }
  },

  // Create new E-invoice with items
  async create(invoiceData, items = []) {
    try {
      let invoice;

      // Try einvoices table first, fallback to sales table
      try {
        const { data, error } = await supabase
          .from('einvoices')
          .insert([invoiceData])
          .select()
          .single();

        if (error) throw error;
        invoice = data;

        console.log('✅ E-invoice saved to einvoices table');
      } catch (error) {
        console.log('📋 E-invoices table not available, using sales table as fallback');

        // Map E-invoice data to sales table format
        const salesData = {
          sale_number: invoiceData.invoice_number,
          customer_id: invoiceData.customer_id,
          customer_name: invoiceData.buyer_name,
          subtotal: invoiceData.subtotal,
          tax_amount: invoiceData.total_tax_amount,
          total_amount: invoiceData.total_amount,
          payment_method: invoiceData.payment_method,
          amount_paid: invoiceData.amount_paid,
          payment_status: invoiceData.payment_status,
          status: invoiceData.status,
          sale_date: invoiceData.invoice_date,
          notes: `E-Invoice: ${invoiceData.invoice_number}\nBuyer GSTIN: ${invoiceData.buyer_gstin || 'N/A'}\nIRN: ${invoiceData.irn || 'Pending'}\nQR Data: ${invoiceData.qr_code_data || 'N/A'}`,
          created_by: invoiceData.created_by
        };

        const { data, error: salesError } = await supabase
          .from('sales')
          .insert([salesData])
          .select()
          .single();

        if (salesError) throw salesError;
        invoice = data;

        console.log('✅ E-invoice saved to sales table as fallback');
      }

      // Insert items if provided
      if (items.length > 0) {
        try {
          // Try einvoice_items table first
          const itemsWithInvoiceId = items.map(item => ({
            ...item,
            einvoice_id: invoice.id
          }));

          const { error: itemsError } = await supabase
            .from('einvoice_items')
            .insert(itemsWithInvoiceId);

          if (itemsError) throw itemsError;
          console.log('✅ E-invoice items saved to einvoice_items table');
        } catch (error) {
          console.log('📋 E-invoice items table not available, using sale_items as fallback');

          // Map to sale_items format
          const saleItems = items.map(item => ({
            sale_id: invoice.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_amount,
            gst_rate: item.gst_rate,
            hsn_code: item.hsn_code
          }));

          const { error: saleItemsError } = await supabase
            .from('sale_items')
            .insert(saleItems);

          if (saleItemsError) {
            console.warn('Could not save items to sale_items table:', saleItemsError);
          } else {
            console.log('✅ E-invoice items saved to sale_items table as fallback');
          }
        }
      }

      return invoice;
    } catch (error) {
      console.error('Error creating E-invoice:', error);
      throw error;
    }
  },

  // Update E-invoice
  async update(id, invoiceData) {
    try {
      const { data, error } = await supabase
        .from('einvoices')
        .update({
          ...invoiceData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating E-invoice:', error);
      throw error;
    }
  },

  // Delete E-invoice (cascade will delete items)
  async delete(id) {
    try {
      const { error } = await supabase
        .from('einvoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting E-invoice:', error);
      throw error;
    }
  },

  // Generate IRN and update E-invoice status
  async generateIRN(id, irnData) {
    try {
      const { data, error } = await supabase
        .from('einvoices')
        .update({
          irn: irnData.irn,
          ack_number: irnData.ack_number,
          ack_date: irnData.ack_date,
          qr_code_data: irnData.qr_code_data,
          signed_invoice: irnData.signed_invoice,
          status: 'generated',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating IRN:', error);
      throw error;
    }
  },

  // Cancel E-invoice
  async cancel(id, reason) {
    try {
      const { data, error } = await supabase
        .from('einvoices')
        .update({
          status: 'cancelled',
          notes: `Cancelled: ${reason}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error cancelling E-invoice:', error);
      throw error;
    }
  },

  // Get E-invoice statistics
  async getStats(dateRange = {}) {
    try {
      let query = supabase
        .from('einvoices')
        .select('status, total_amount, invoice_date');

      if (dateRange.from) {
        query = query.gte('invoice_date', dateRange.from);
      }
      if (dateRange.to) {
        query = query.lte('invoice_date', dateRange.to);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Calculate statistics
      const stats = {
        total_count: data.length,
        draft_count: data.filter(inv => inv.status === 'draft').length,
        generated_count: data.filter(inv => inv.status === 'generated').length,
        cancelled_count: data.filter(inv => inv.status === 'cancelled').length,
        total_value: data.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0),
        average_value: data.length > 0 ? data.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0) / data.length : 0
      };

      return stats;
    } catch (error) {
      console.error('Error fetching E-invoice stats:', error);
      throw error;
    }
  }
};

// E-Invoice Items service
export const einvoiceItemsService = {
  // Get items for a specific E-invoice
  async getByInvoiceId(einvoiceId) {
    try {
      const { data, error } = await supabase
        .from('einvoice_items')
        .select(`
          *,
          product:products(id, name, code, hsn_code, gst_rate)
        `)
        .eq('einvoice_id', einvoiceId)
        .order('item_serial_number');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching E-invoice items:', error);
      throw error;
    }
  },

  // Add items to E-invoice
  async addItems(einvoiceId, items) {
    try {
      const itemsWithInvoiceId = items.map((item, index) => ({
        ...item,
        einvoice_id: einvoiceId,
        item_serial_number: index + 1
      }));

      const { data, error } = await supabase
        .from('einvoice_items')
        .insert(itemsWithInvoiceId)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding E-invoice items:', error);
      throw error;
    }
  },

  // Update E-invoice item
  async updateItem(itemId, itemData) {
    try {
      const { data, error } = await supabase
        .from('einvoice_items')
        .update(itemData)
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating E-invoice item:', error);
      throw error;
    }
  },

  // Delete E-invoice item
  async deleteItem(itemId) {
    try {
      const { error } = await supabase
        .from('einvoice_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting E-invoice item:', error);
      throw error;
    }
  },

  // Replace all items for an E-invoice
  async replaceItems(einvoiceId, newItems) {
    try {
      // Delete existing items
      await supabase
        .from('einvoice_items')
        .delete()
        .eq('einvoice_id', einvoiceId);

      // Add new items
      if (newItems.length > 0) {
        return await this.addItems(einvoiceId, newItems);
      }
      return [];
    } catch (error) {
      console.error('Error replacing E-invoice items:', error);
      throw error;
    }
  }
};

export const customerBalanceService = {
  async getBalance(customerId) {
    // Get customer balance from sales records
    const sales = await dbOperations.getAll(COLLECTIONS.SALES, {
      filters: [{ field: 'customer_id', operator: 'eq', value: customerId }]
    });

    let balance = 0;
    sales.forEach(sale => {
      if (sale.payment_status === 'pending') {
        balance += sale.total_amount || 0;
      }
    });

    return { balance };
  },
  async updateBalance(customerId, amount) {
    // This would typically update a customer balance record
    // For now, we'll just return success
    return { success: true };
  }
};

export const customerPaymentsService = {
  async getAll() {
    return dbOperations.getAll(COLLECTIONS.SALES, {
      filters: [{ field: 'payment_status', operator: 'eq', value: 'paid' }],
      orderBy: { field: 'sale_date', ascending: false }
    });
  },
  async add(paymentData) {
    return dbOperations.create(COLLECTIONS.SALES, paymentData);
  },
  async update(id, paymentData) {
    return dbOperations.update(COLLECTIONS.SALES, id, paymentData);
  }
};

export const utilityService = {
  generateInvoiceNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `INV-${timestamp}-${random}`;
  },
  generateEInvoiceNumber() {
    // Generate E-Invoice number with specific format
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `EINV-${year}${month}-${timestamp}-${random}`;
  },
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  },
  calculateGST(amount, rate) {
    return (amount * rate) / 100;
  },
  generateIRN() {
    // Generate a mock IRN (Invoice Reference Number) for E-Invoice
    // In real implementation, this would come from GST portal
    const chars = 'abcdef0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  generateAckNo() {
    // Generate acknowledgment number for E-Invoice
    return Math.floor(100000000000000 + Math.random() * 900000000000000).toString();
  }
};
