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
      const promises = [];

      // Flatten the data object and create setting keys
      const flattenObject = (obj, prefix = '') => {
        Object.keys(obj).forEach(key => {
          const value = obj[key];
          const settingKey = prefix ? `${prefix}.${key}` : key;

          if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            // Recursively flatten nested objects
            flattenObject(value, settingKey);
          } else {
            // Store the value
            promises.push(
              this.setSetting(settingKey, value, `${section} setting: ${key}`)
            );
          }
        });
      };

      flattenObject(data, section);

      // Execute all setting updates
      await Promise.all(promises);

      return true;
    } catch (error) {
      console.error('Error updating setting section:', error);
      throw error;
    }
  },

  // Get settings by category
  async getSettingsByCategory(category) {
    try {
      const { data, error } = await supabase
        .from(COLLECTIONS.SETTINGS)
        .select('*')
        .eq('category', category);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting settings by category:', error);
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

// Additional services for EInvoice functionality
export const einvoicesService = {
  async getAll() {
    return dbOperations.getAll(COLLECTIONS.SALES, {
      orderBy: { field: 'sale_date', ascending: false }
    });
  },
  async add(invoiceData) {
    return dbOperations.create(COLLECTIONS.SALES, invoiceData);
  },
  async update(id, invoiceData) {
    return dbOperations.update(COLLECTIONS.SALES, id, invoiceData);
  },
  async delete(id) {
    return dbOperations.delete(COLLECTIONS.SALES, id);
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
