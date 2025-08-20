/**
 * Database service layer for Supabase operations
 * Provides abstracted CRUD operations for all entities
 */

import { supabase, supabaseQuery } from './supabase';

// Products Service
export const productsService = {
  async getAll() {
    return await supabaseQuery.getAll('products', {
      orderBy: { field: 'created_at', ascending: false }
    });
  },

  async getById(id) {
    return await supabaseQuery.getById('products', id);
  },

  async create(productData) {
    return await supabaseQuery.insert('products', {
      ...productData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  },

  async update(id, updates) {
    return await supabaseQuery.update('products', id, {
      ...updates,
      updated_at: new Date().toISOString()
    });
  },

  async delete(id) {
    return await supabaseQuery.delete('products', id);
  },

  async search(searchTerm) {
    return await supabaseQuery.search('products', 'name', searchTerm);
  }
};

// Categories Service
export const categoriesService = {
  async getAll() {
    return await supabaseQuery.getAll('categories', {
      orderBy: { field: 'name', ascending: true }
    });
  },

  async create(categoryData) {
    return await supabaseQuery.insert('categories', {
      ...categoryData,
      created_at: new Date().toISOString()
    });
  },

  async update(id, updates) {
    return await supabaseQuery.update('categories', id, updates);
  },

  async delete(id) {
    return await supabaseQuery.delete('categories', id);
  }
};

// Suppliers Service
export const suppliersService = {
  async getAll() {
    return await supabaseQuery.getAll('suppliers', {
      orderBy: { field: 'name', ascending: true }
    });
  },

  async create(supplierData) {
    return await supabaseQuery.insert('suppliers', {
      ...supplierData,
      created_at: new Date().toISOString()
    });
  },

  async update(id, updates) {
    return await supabaseQuery.update('suppliers', id, updates);
  },

  async delete(id) {
    return await supabaseQuery.delete('suppliers', id);
  }
};

// Brands Service
export const brandsService = {
  async getAll() {
    return await supabaseQuery.getAll('brands', {
      orderBy: { field: 'name', ascending: true }
    });
  },

  async create(brandData) {
    return await supabaseQuery.insert('brands', {
      ...brandData,
      created_at: new Date().toISOString()
    });
  },

  async update(id, updates) {
    return await supabaseQuery.update('brands', id, updates);
  },

  async delete(id) {
    return await supabaseQuery.delete('brands', id);
  }
};

// Stock Movements Service
export const stockMovementsService = {
  async getAll() {
    return await supabaseQuery.getAll('stock_movements', {
      orderBy: { field: 'created_at', ascending: false }
    });
  },

  async create(movementData) {
    return await supabaseQuery.insert('stock_movements', {
      ...movementData,
      created_at: new Date().toISOString()
    });
  },

  async getByProductId(productId) {
    return await supabaseQuery.getAll('stock_movements', {
      where: { product_id: productId },
      orderBy: { field: 'created_at', ascending: false }
    });
  }
};

// Database Diagnostics
export const databaseDiagnostics = {
  async healthCheck() {
    try {
      const result = await supabaseQuery.validateConnection();
      
      // Check table access
      const tables = ['products', 'categories', 'suppliers', 'brands'];
      const tableAccess = {};
      
      for (const table of tables) {
        tableAccess[table] = await supabaseQuery.checkTableAccess(table);
      }

      // Get basic stats
      let totalRecords = 0;
      try {
        const products = await supabaseQuery.getAll('products');
        totalRecords = products.length;
      } catch (e) {
        console.warn('Could not get product count:', e.message);
      }

      return {
        timestamp: new Date().toISOString(),
        connection: {
          connected: result.connected,
          error: result.error
        },
        schema: {
          valid: Object.values(tableAccess).some(access => access === true)
        },
        data: {
          totalRecords,
          tables: tableAccess
        },
        overall: result.connected ? 
          (Object.values(tableAccess).some(access => access === true) ? 'healthy' : 'needs_data') : 
          'critical',
        errors: result.error ? [result.error] : []
      };
    } catch (error) {
      return {
        timestamp: new Date().toISOString(),
        connection: { connected: false, error: error.message },
        schema: { valid: false },
        data: { totalRecords: 0 },
        overall: 'critical',
        errors: [error.message]
      };
    }
  },

  async quickTest() {
    return await supabaseQuery.validateConnection();
  }
};

// Mock data for development/testing
export const mockDataService = {
  async seedDatabase() {
    try {
      console.log('🌱 Seeding database with mock data...');

      // Create categories
      const categories = [
        { name: 'Fertilizers', description: 'Chemical and organic fertilizers' },
        { name: 'Seeds', description: 'Various crop seeds' },
        { name: 'Pesticides', description: 'Pest control products' },
        { name: 'Tools', description: 'Farming tools and equipment' }
      ];

      const createdCategories = [];
      for (const category of categories) {
        try {
          const created = await categoriesService.create(category);
          createdCategories.push(created);
        } catch (e) {
          console.warn('Category may already exist:', category.name);
        }
      }

      // Create suppliers
      const suppliers = [
        { 
          name: 'AgriCorp India', 
          contact_person: 'Rajesh Kumar',
          phone: '+91-9876543210',
          email: 'contact@agricorp.in',
          address: 'Mumbai, Maharashtra'
        },
        { 
          name: 'FarmTech Solutions', 
          contact_person: 'Priya Sharma',
          phone: '+91-9876543211',
          email: 'info@farmtech.com',
          address: 'Delhi, India'
        }
      ];

      const createdSuppliers = [];
      for (const supplier of suppliers) {
        try {
          const created = await suppliersService.create(supplier);
          createdSuppliers.push(created);
        } catch (e) {
          console.warn('Supplier may already exist:', supplier.name);
        }
      }

      // Create brands
      const brands = [
        { name: 'IFFCO', description: 'Leading fertilizer brand' },
        { name: 'Coromandel', description: 'Premium agricultural products' },
        { name: 'UPL', description: 'Crop protection solutions' }
      ];

      const createdBrands = [];
      for (const brand of brands) {
        try {
          const created = await brandsService.create(brand);
          createdBrands.push(created);
        } catch (e) {
          console.warn('Brand may already exist:', brand.name);
        }
      }

      console.log('✅ Mock data seeded successfully');
      return {
        categories: createdCategories,
        suppliers: createdSuppliers,
        brands: createdBrands
      };

    } catch (error) {
      console.error('❌ Error seeding database:', error);
      throw error;
    }
  }
};

export default {
  productsService,
  categoriesService,
  suppliersService,
  brandsService,
  stockMovementsService,
  databaseDiagnostics,
  mockDataService
};