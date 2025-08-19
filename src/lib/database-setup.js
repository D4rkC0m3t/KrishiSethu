import { supabase } from './supabase';

/**
 * Database Setup and Initialization Utilities
 * Handles schema validation, view creation, and database health checks
 */

export const databaseSetup = {
  /**
   * Initialize database with required views and constraints
   */
  async initializeDatabase() {
    console.log('🔧 Initializing database...');
    const results = {
      success: true,
      errors: [],
      operations: []
    };

    try {
      // Create camelCase views for better frontend integration
      await this.createCamelCaseViews();
      results.operations.push('Created camelCase views');

      // Create notifications table if it doesn't exist
      await this.createNotificationsTable();
      results.operations.push('Ensured notifications table exists');

      // Validate schema
      const schemaValidation = await this.validateSchema();
      if (!schemaValidation.valid) {
        results.errors.push(...schemaValidation.errors);
        results.success = false;
      }

      console.log('✅ Database initialization completed');
      return results;
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      results.success = false;
      results.errors.push(error.message);
      return results;
    }
  },

  /**
   * Create camelCase views for all major tables
   */
  async createCamelCaseViews() {
    console.log('📋 Creating camelCase views...');

    const viewDefinitions = {
      products_cc: `
        CREATE OR REPLACE VIEW public.products_cc AS
        SELECT
          id, name, code, type,
          category_id   as "categoryId",
          brand_id      as "brandId",
          supplier_id   as "supplierId",
          description, composition, quantity, unit,
          min_stock_level as "minStockLevel",
          reorder_point   as "reorderPoint",
          purchase_price  as "purchasePrice",
          sale_price      as "salePrice",
          mrp, batch_no as "batchNo",
          expiry_date as "expiryDate",
          manufacturing_date as "manufacturingDate",
          hsn_code as "hsnCode",
          gst_rate as "gstRate",
          barcode, location, image_urls as "imageUrls",
          is_active as "isActive",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM public.products;
      `,

      sales_cc: `
        CREATE OR REPLACE VIEW public.sales_cc AS
        SELECT
          id,
          sale_number     as "saleNumber",
          customer_id     as "customerId",
          customer_name   as "customerName",
          total_amount    as "totalAmount",
          tax_amount      as "taxAmount",
          payment_method  as "paymentMethod",
          amount_paid     as "amountPaid",
          payment_status  as "paymentStatus",
          sale_date       as "saleDate",
          created_at      as "createdAt",
          updated_at      as "updatedAt"
        FROM public.sales;
      `,

      categories_cc: `
        CREATE OR REPLACE VIEW public.categories_cc AS
        SELECT
          id, name, description,
          is_active as "isActive",
          sort_order as "sortOrder",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM public.categories;
      `,

      suppliers_cc: `
        CREATE OR REPLACE VIEW public.suppliers_cc AS
        SELECT
          id, name,
          contact_person as "contactPerson",
          phone, email, address,
          gst_number as "gstNumber",
          payment_terms as "paymentTerms",
          credit_limit as "creditLimit",
          outstanding_amount as "outstandingAmount",
          is_active as "isActive",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM public.suppliers;
      `,

      customers_cc: `
        CREATE OR REPLACE VIEW public.customers_cc AS
        SELECT
          id, name,
          contact_person as "contactPerson",
          phone, email, address,
          gst_number as "gstNumber",
          credit_limit as "creditLimit",
          outstanding_amount as "outstandingAmount",
          total_purchases as "totalPurchases",
          is_active as "isActive",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM public.customers;
      `,

      purchases_cc: `
        CREATE OR REPLACE VIEW public.purchases_cc AS
        SELECT
          id,
          supplier_id as "supplierId",
          supplier_name as "supplierName",
          purchase_number as "purchaseNumber",
          total_amount as "totalAmount",
          tax_amount as "taxAmount",
          payment_status as "paymentStatus",
          amount_paid as "amountPaid",
          invoice_number as "invoiceNumber",
          invoice_date as "invoiceDate",
          purchase_date as "purchaseDate",
          created_by as "createdBy",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM public.purchases;
      `,

      brands_cc: `
        CREATE OR REPLACE VIEW public.brands_cc AS
        SELECT
          id, name, description,
          logo_url as "logoUrl",
          is_active as "isActive",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM public.brands;
      `,

      stock_movements_cc: `
        CREATE OR REPLACE VIEW public.stock_movements_cc AS
        SELECT
          id,
          product_id as "productId",
          movement_type as "movementType",
          quantity,
          reference_type as "referenceType",
          reference_id as "referenceId",
          notes,
          created_by as "createdBy",
          created_at as "createdAt"
        FROM public.stock_movements;
      `
    };

    // Create each view
    for (const [viewName, sql] of Object.entries(viewDefinitions)) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql });
        if (error) {
          console.warn(`⚠️ Could not create view ${viewName}:`, error.message);
          // Continue with other views even if one fails
        } else {
          console.log(`✅ Created view: ${viewName}`);
        }
      } catch (err) {
        console.warn(`⚠️ Error creating view ${viewName}:`, err.message);
      }
    }
  },

  /**
   * Create notifications table if it doesn't exist
   */
  async createNotificationsTable() {
    console.log('📬 Ensuring notifications table exists...');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.notifications (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
        title text NOT NULL,
        body text,
        level text CHECK (level IN ('info','warning','error')) DEFAULT 'info',
        is_read boolean DEFAULT false,
        created_at timestamptz DEFAULT now()
      );

      -- Create index for better query performance
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
    `;

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      if (error) {
        console.warn('⚠️ Could not create notifications table:', error.message);
      } else {
        console.log('✅ Notifications table ready');
      }
    } catch (err) {
      console.warn('⚠️ Error with notifications table:', err.message);
    }
  },

  /**
   * Validate database schema and connectivity
   */
  async validateSchema() {
    console.log('🔍 Validating database schema...');
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      tables: {},
      views: {}
    };

    try {
      // Check required tables exist
      const requiredTables = [
        'products', 'categories', 'suppliers', 'customers', 
        'sales', 'purchases', 'brands', 'stock_movements', 'profiles'
      ];

      for (const table of requiredTables) {
        try {
          const { error } = await supabase.from(table).select('id').limit(1);
          validation.tables[table] = !error;
          
          if (error) {
            validation.errors.push(`Table ${table} is not accessible: ${error.message}`);
            validation.valid = false;
          }
        } catch (err) {
          validation.tables[table] = false;
          validation.errors.push(`Table ${table} check failed: ${err.message}`);
          validation.valid = false;
        }
      }

      // Check camelCase views
      const expectedViews = [
        'products_cc', 'sales_cc', 'categories_cc', 'suppliers_cc'
      ];

      for (const view of expectedViews) {
        try {
          const { error } = await supabase.from(view).select('id').limit(1);
          validation.views[view] = !error;
          
          if (error) {
            validation.warnings.push(`CamelCase view ${view} not available`);
          }
        } catch (err) {
          validation.views[view] = false;
          validation.warnings.push(`View ${view} check failed: ${err.message}`);
        }
      }

      // Check notifications table specifically
      try {
        const { error } = await supabase.from('notifications').select('id').limit(1);
        validation.tables['notifications'] = !error;
        
        if (error) {
          validation.warnings.push('Notifications table not available - will be created');
        }
      } catch (err) {
        validation.tables['notifications'] = false;
        validation.warnings.push('Notifications table check failed');
      }

      console.log('📊 Schema validation completed:', {
        valid: validation.valid,
        errors: validation.errors.length,
        warnings: validation.warnings.length
      });

      return validation;
    } catch (error) {
      console.error('❌ Schema validation failed:', error);
      validation.valid = false;
      validation.errors.push(`Schema validation error: ${error.message}`);
      return validation;
    }
  },

  /**
   * Get comprehensive database statistics
   */
  async getDatabaseStats() {
    console.log('📈 Gathering database statistics...');

    try {
      const stats = {
        timestamp: new Date().toISOString(),
        tables: {},
        views: {},
        totalRecords: 0,
        health: 'unknown'
      };

      // Get table counts
      const tables = ['products', 'categories', 'suppliers', 'customers', 'sales', 'purchases', 'brands', 'stock_movements', 'profiles', 'notifications'];
      
      for (const table of tables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

          if (error) {
            stats.tables[table] = { count: 'N/A', error: error.message };
          } else {
            const tableCount = count || 0;
            stats.tables[table] = { count: tableCount };
            stats.totalRecords += tableCount;
          }
        } catch (err) {
          stats.tables[table] = { count: 'Error', error: err.message };
        }
      }

      // Check views
      const views = ['products_cc', 'sales_cc', 'categories_cc', 'suppliers_cc'];
      for (const view of views) {
        try {
          const { error } = await supabase.from(view).select('id').limit(1);
          stats.views[view] = { available: !error };
        } catch (err) {
          stats.views[view] = { available: false, error: err.message };
        }
      }

      // Determine overall health
      const hasData = stats.totalRecords > 0;
      const tablesAccessible = Object.values(stats.tables).every(t => t.count !== 'Error');
      
      if (hasData && tablesAccessible) {
        stats.health = 'healthy';
      } else if (tablesAccessible) {
        stats.health = 'needs_data';
      } else {
        stats.health = 'error';
      }

      console.log('📊 Database stats:', {
        totalRecords: stats.totalRecords,
        health: stats.health
      });

      return stats;
    } catch (error) {
      console.error('❌ Failed to get database stats:', error);
      return {
        timestamp: new Date().toISOString(),
        health: 'error',
        error: error.message
      };
    }
  }
};

/**
 * Enhanced Supabase diagnostics
 */
export const supabaseDiagnostics = {
  /**
   * Quick connectivity test
   */
  async quickTest() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      return {
        success: !error,
        timestamp: new Date().toISOString(),
        error: error?.message || null
      };
    } catch (error) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  },

  /**
   * Comprehensive health check
   */
  async healthCheck() {
    console.log('🏥 Running comprehensive health check...');

    try {
      const [connectivity, stats, schema] = await Promise.all([
        this.quickTest(),
        databaseSetup.getDatabaseStats(),
        databaseSetup.validateSchema()
      ]);

      const health = {
        timestamp: new Date().toISOString(),
        connection: {
          connected: connectivity.success,
          error: connectivity.error
        },
        schema: {
          valid: schema.valid,
          errors: schema.errors,
          warnings: schema.warnings
        },
        data: {
          totalRecords: stats.totalRecords,
          tables: stats.tables,
          views: stats.views
        },
        overall: 'unknown',
        errors: [],
        recommendations: []
      };

      // Determine overall health
      if (!connectivity.success) {
        health.overall = 'critical';
        health.errors.push('Database connection failed');
      } else if (!schema.valid) {
        health.overall = 'error';
        health.errors.push(...schema.errors);
      } else if (stats.totalRecords === 0) {
        health.overall = 'needs_data';
        health.recommendations.push('Database is empty - consider adding sample data');
      } else {
        health.overall = 'healthy';
      }

      // Add recommendations based on findings
      if (schema.warnings.length > 0) {
        health.recommendations.push('Some camelCase views are missing - run database initialization');
      }

      if (stats.tables.notifications?.count === 'N/A') {
        health.recommendations.push('Notifications table is missing - will be created automatically');
      }

      console.log('🏥 Health check completed:', {
        overall: health.overall,
        errors: health.errors.length,
        recommendations: health.recommendations.length
      });

      return health;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return {
        timestamp: new Date().toISOString(),
        overall: 'critical',
        errors: [error.message],
        connection: { connected: false, error: error.message }
      };
    }
  },

  /**
   * Validate database connection and permissions
   */
  async validateConnection() {
    try {
      // Test basic read access
      const { error: readError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (readError) {
        return {
          valid: false,
          error: `Read access failed: ${readError.message}`,
          permissions: { read: false, write: false }
        };
      }

      // Test write access (try to insert a test record and immediately delete it)
      const testRecord = {
        email: `test_${Date.now()}@example.com`,
        full_name: 'Test User',
        role: 'staff'
      };

      const { data: insertData, error: insertError } = await supabase
        .from('profiles')
        .insert(testRecord)
        .select()
        .single();

      let writeAccess = false;
      if (!insertError && insertData) {
        writeAccess = true;
        // Clean up test record
        await supabase.from('profiles').delete().eq('id', insertData.id);
      }

      return {
        valid: true,
        permissions: {
          read: true,
          write: writeAccess
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        permissions: { read: false, write: false }
      };
    }
  }
};

export default {
  databaseSetup,
  supabaseDiagnostics
};