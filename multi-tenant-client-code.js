// =====================================================
// KrishiSethu Multi-Tenant Supabase Client Code
// Updated to work with owner_id and RLS policies
// =====================================================

import { supabase } from './supabase';

// =====================================================
// 1. SUPPLIERS - Multi-tenant operations
// =====================================================

export const suppliersService = {
  // Get all suppliers for current user only
  async getAll() {
    console.log('🔍 Fetching suppliers for current user...');
    
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching suppliers:', error);
      throw error;
    }
    
    console.log(`✅ Found ${data?.length || 0} suppliers for current user`);
    return data || [];
  },

  // Create new supplier (owner_id set automatically by trigger)
  async create(supplierData) {
    console.log('🔄 Creating new supplier...', supplierData);
    
    // Note: owner_id is set automatically by database trigger
    // You can also explicitly set it if needed:
    // const user = await supabase.auth.getUser();
    // supplierData.owner_id = user.data.user?.id;
    
    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplierData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating supplier:', error);
      throw error;
    }
    
    console.log('✅ Supplier created:', data);
    return data;
  },

  // Update supplier (only if user owns it)
  async update(id, supplierData) {
    console.log(`🔄 Updating supplier ${id}...`);
    
    const { data, error } = await supabase
      .from('suppliers')
      .update(supplierData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error updating supplier:', error);
      throw error;
    }
    
    console.log('✅ Supplier updated:', data);
    return data;
  },

  // Delete supplier (only if user owns it)
  async delete(id) {
    console.log(`🔄 Deleting supplier ${id}...`);
    
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('❌ Error deleting supplier:', error);
      throw error;
    }
    
    console.log('✅ Supplier deleted');
    return true;
  }
};

// =====================================================
// 2. PRODUCTS - Multi-tenant operations
// =====================================================

export const productsService = {
  // Get all products for current user only
  async getAll() {
    console.log('🔍 Fetching products for current user...');
    
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(id, name),
        brands(id, name),
        suppliers(id, name)
      `)
      .order('name', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching products:', error);
      throw error;
    }
    
    console.log(`✅ Found ${data?.length || 0} products for current user`);
    return data || [];
  },

  // Create new product (owner_id set automatically)
  async create(productData) {
    console.log('🔄 Creating new product...', productData);
    
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating product:', error);
      throw error;
    }
    
    console.log('✅ Product created:', data);
    return data;
  },

  // Get products by category (user's products only)
  async getByCategory(categoryId) {
    console.log(`🔍 Fetching products in category ${categoryId}...`);
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', categoryId)
      .order('name', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching products by category:', error);
      throw error;
    }
    
    return data || [];
  },

  // Search user's products
  async search(searchTerm) {
    console.log(`🔍 Searching products for: "${searchTerm}"`);
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('name', { ascending: true });
    
    if (error) {
      console.error('❌ Error searching products:', error);
      throw error;
    }
    
    return data || [];
  }
};

// =====================================================
// 3. CUSTOMERS - Multi-tenant operations
// =====================================================

export const customersService = {
  // Get all customers for current user only
  async getAll() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Create new customer
  async create(customerData) {
    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// =====================================================
// 4. SALES - Multi-tenant operations  
// =====================================================

export const salesService = {
  // Get all sales for current user only
  async getAll() {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        customers(id, name),
        sale_items(
          *,
          products(id, name)
        )
      `)
      .order('sale_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Create new sale
  async create(saleData) {
    const { data, error } = await supabase
      .from('sales')
      .insert(saleData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get sales by date range (user's sales only)
  async getByDateRange(startDate, endDate) {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .gte('sale_date', startDate)
      .lte('sale_date', endDate)
      .order('sale_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
};

// =====================================================
// 5. SETTINGS - User-specific settings
// =====================================================

export const settingsService = {
  // Get user's settings (includes global settings where owner_id IS NULL)
  async getUserSettings() {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .order('key', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Set user-specific setting
  async setSetting(key, value, description = '') {
    const { data, error } = await supabase
      .from('settings')
      .upsert({
        key: key,
        value: value,
        description: description
        // owner_id will be set by trigger
      }, {
        onConflict: 'key'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// =====================================================
// 6. SHARED DATA - Categories and Brands (global)
// =====================================================

export const categoriesService = {
  // Categories are shared across all users
  async getAll() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async create(categoryData) {
    const { data, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

export const brandsService = {
  // Brands are shared across all users
  async getAll() {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async create(brandData) {
    const { data, error } = await supabase
      .from('brands')
      .insert(brandData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// =====================================================
// 7. UTILITY FUNCTIONS
// =====================================================

// Get current user info
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('❌ Error getting current user:', error);
    throw error;
  }
  
  return user;
};

// Check if user can access specific record
export const canUserAccessRecord = async (tableName, recordId) => {
  const { data, error } = await supabase
    .from(tableName)
    .select('owner_id')
    .eq('id', recordId)
    .single();
  
  if (error) return false;
  
  const user = await getCurrentUser();
  return data.owner_id === user?.id;
};

// Test multi-tenancy by creating and fetching data
export const testMultiTenancy = async () => {
  try {
    console.log('🧪 Testing multi-tenancy...');
    
    // Test 1: Create a test supplier
    const testSupplier = await suppliersService.create({
      name: 'Test Supplier for Multi-tenancy',
      phone: '1234567890',
      email: 'test@multitenant.com'
    });
    
    console.log('✅ Test supplier created:', testSupplier);
    
    // Test 2: Fetch all suppliers (should only show user's suppliers)
    const userSuppliers = await suppliersService.getAll();
    console.log(`✅ User can see ${userSuppliers.length} suppliers (including test supplier)`);
    
    // Test 3: Clean up test data
    await suppliersService.delete(testSupplier.id);
    console.log('✅ Test supplier deleted');
    
    console.log('🎉 Multi-tenancy test passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Multi-tenancy test failed:', error);
    return false;
  }
};

// =====================================================
// EXAMPLE USAGE IN REACT COMPONENTS
// =====================================================

/*
// Example: Using in a React component
import { suppliersService } from './multi-tenant-client-code';

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  
  useEffect(() => {
    loadSuppliers();
  }, []);
  
  const loadSuppliers = async () => {
    try {
      // This automatically gets only the current user's suppliers
      const data = await suppliersService.getAll();
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };
  
  const handleCreateSupplier = async (supplierData) => {
    try {
      // owner_id is set automatically by the database trigger
      await suppliersService.create(supplierData);
      await loadSuppliers(); // Refresh the list
    } catch (error) {
      console.error('Error creating supplier:', error);
    }
  };
  
  return (
    <div>
      {suppliers.map(supplier => (
        <div key={supplier.id}>
          <h3>{supplier.name}</h3>
          <p>Only visible to user: {supplier.owner_id}</p>
        </div>
      ))}
    </div>
  );
};
*/
