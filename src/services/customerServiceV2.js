/**
 * Customer Service V2 - Enhanced with JSONB Address Support
 * 
 * This service provides backward compatibility while adding new JSONB address functionality.
 * It works alongside the existing customer service without replacing it.
 * 
 * SAFETY: This service does NOT modify existing customer service behavior.
 * It only adds new functionality that can be enabled via feature flags.
 */

import { supabase } from '../lib/supabase';
import { FEATURE_FLAGS, featureUtils } from '../config/featureFlags';

// Import existing customer service for fallback
import { customerOperations } from '../lib/supabaseDb';

/**
 * Enhanced customer data normalization with JSONB address support
 * Handles both old string addresses and new JSONB addresses
 */
const normalizeCustomerV2 = (customer) => {
  if (!customer) return null;

  // Handle JSONB address field from database
  const addressObj = customer.address || {};
  const isAddressObject = typeof addressObj === 'object' && addressObj !== null && !Array.isArray(addressObj);
  
  const normalized = {
    id: customer.id,
    name: customer.name || 'Unknown Customer',
    phone: customer.phone || '',
    email: customer.email || '',
    
    // Handle both JSONB address object and legacy string address
    address: isAddressObject ? (addressObj.street || '') : (customer.address || ''),
    city: isAddressObject ? (addressObj.city || '') : (customer.city || ''),
    state: isAddressObject ? (addressObj.state || '') : (customer.state || ''),
    pincode: isAddressObject ? (addressObj.pincode || '') : (customer.pincode || ''),
    country: isAddressObject ? (addressObj.country || 'India') : (customer.country || 'India'),
    
    // Enhanced fields with proper mapping
    gstNumber: customer.gst_number || customer.gstNumber || '',
    creditLimit: customer.credit_limit || customer.creditLimit || 0,
    outstandingAmount: customer.outstanding_amount || customer.outstandingAmount || 0,
    isActive: customer.is_active !== false && customer.isActive !== false,
    
    // Metadata
    createdAt: customer.created_at || customer.createdAt,
    updatedAt: customer.updated_at || customer.updatedAt,
    
    // Keep any additional properties for backward compatibility
    ...customer
  };

  if (FEATURE_FLAGS.ENABLE_DEBUG_LOGGING) {
    console.log('🔄 Customer normalized (V2):', {
      original: customer,
      normalized,
      addressType: isAddressObject ? 'JSONB' : 'string'
    });
  }

  return normalized;
};

/**
 * Transform form data to database format with JSONB address
 */
const transformCustomerDataForDB = (formData) => {
  const dbData = {
    name: formData.name?.trim(),
    phone: formData.phone?.trim(),
    email: formData.email?.trim(),
    
    // Transform address fields to JSONB object
    address: {
      street: formData.address?.trim() || '',
      city: formData.city?.trim() || '',
      state: formData.state?.trim() || '',
      pincode: formData.pincode?.trim() || '',
      country: formData.country?.trim() || 'India'
    },
    
    // Enhanced fields with proper database column names
    gst_number: formData.gstNumber?.trim() || null,
    credit_limit: parseFloat(formData.creditLimit) || 0,
    outstanding_amount: parseFloat(formData.outstandingAmount) || 0,
    is_active: formData.isActive !== false
  };

  if (FEATURE_FLAGS.ENABLE_DEBUG_LOGGING) {
    console.log('🔄 Customer data transformed for DB (V2):', {
      formData,
      dbData
    });
  }

  return dbData;
};

/**
 * Enhanced Customer Service V2
 * Provides new functionality while maintaining backward compatibility
 */
export const customerServiceV2 = {
  /**
   * Get all customers with enhanced normalization
   */
  async getAllCustomers() {
    try {
      if (FEATURE_FLAGS.ENABLE_DEBUG_LOGGING) {
        console.log('📋 Getting all customers (V2)...');
      }

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const normalizedCustomers = (data || []).map(normalizeCustomerV2);

      if (FEATURE_FLAGS.ENABLE_DEBUG_LOGGING) {
        console.log('✅ Customers loaded (V2):', normalizedCustomers.length);
      }

      return normalizedCustomers;
    } catch (error) {
      console.error('❌ Error getting customers (V2):', error);
      throw error;
    }
  },

  /**
   * Get customer by ID with enhanced normalization
   */
  async getCustomerById(id) {
    try {
      if (FEATURE_FLAGS.ENABLE_DEBUG_LOGGING) {
        console.log('🔍 Getting customer by ID (V2):', id);
      }

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const normalizedCustomer = normalizeCustomerV2(data);

      if (FEATURE_FLAGS.ENABLE_DEBUG_LOGGING) {
        console.log('✅ Customer loaded (V2):', normalizedCustomer);
      }

      return normalizedCustomer;
    } catch (error) {
      console.error('❌ Error getting customer by ID (V2):', error);
      throw error;
    }
  },

  /**
   * Create customer with JSONB address support
   */
  async createCustomer(formData) {
    try {
      if (FEATURE_FLAGS.ENABLE_DEBUG_LOGGING) {
        console.log('➕ Creating customer (V2):', formData);
      }

      // Transform form data to database format
      const dbData = transformCustomerDataForDB(formData);

      const { data, error } = await supabase
        .from('customers')
        .insert(dbData)
        .select()
        .single();

      if (error) throw error;

      if (!data || !data.id) {
        throw new Error('Database did not return a valid customer record');
      }

      const normalizedCustomer = normalizeCustomerV2(data);

      if (FEATURE_FLAGS.ENABLE_DEBUG_LOGGING) {
        console.log('✅ Customer created (V2):', normalizedCustomer);
      }

      return normalizedCustomer;
    } catch (error) {
      console.error('❌ Error creating customer (V2):', error);
      throw error;
    }
  },

  /**
   * Update customer with JSONB address support
   */
  async updateCustomer(id, formData) {
    try {
      if (FEATURE_FLAGS.ENABLE_DEBUG_LOGGING) {
        console.log('📝 Updating customer (V2):', { id, formData });
      }

      // Transform form data to database format
      const dbData = transformCustomerDataForDB(formData);

      const { data, error } = await supabase
        .from('customers')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!data || !data.id) {
        throw new Error('Database did not return a valid updated customer record');
      }

      const normalizedCustomer = normalizeCustomerV2(data);

      if (FEATURE_FLAGS.ENABLE_DEBUG_LOGGING) {
        console.log('✅ Customer updated (V2):', normalizedCustomer);
      }

      return normalizedCustomer;
    } catch (error) {
      console.error('❌ Error updating customer (V2):', error);
      throw error;
    }
  },

  /**
   * Delete customer (same as V1, no changes needed)
   */
  async deleteCustomer(id) {
    try {
      if (FEATURE_FLAGS.ENABLE_DEBUG_LOGGING) {
        console.log('🗑️ Deleting customer (V2):', id);
      }

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (FEATURE_FLAGS.ENABLE_DEBUG_LOGGING) {
        console.log('✅ Customer deleted (V2):', id);
      }

      return true;
    } catch (error) {
      console.error('❌ Error deleting customer (V2):', error);
      throw error;
    }
  },

  /**
   * Search customers with enhanced normalization
   */
  async searchCustomers(searchTerm) {
    try {
      if (FEATURE_FLAGS.ENABLE_DEBUG_LOGGING) {
        console.log('🔍 Searching customers (V2):', searchTerm);
      }

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('name', { ascending: true });

      if (error) throw error;

      const normalizedCustomers = (data || []).map(normalizeCustomerV2);

      if (FEATURE_FLAGS.ENABLE_DEBUG_LOGGING) {
        console.log('✅ Customers search results (V2):', normalizedCustomers.length);
      }

      return normalizedCustomers;
    } catch (error) {
      console.error('❌ Error searching customers (V2):', error);
      throw error;
    }
  }
};

/**
 * Smart Customer Service - Automatically chooses V1 or V2 based on feature flags
 * This provides a seamless transition without breaking existing code
 */
export const smartCustomerService = {
  async getAllCustomers() {
    if (FEATURE_FLAGS.USE_NEW_CUSTOMER_ADDRESS) {
      return await customerServiceV2.getAllCustomers();
    } else {
      return await customerOperations.getAllCustomers();
    }
  },

  async getCustomerById(id) {
    if (FEATURE_FLAGS.USE_NEW_CUSTOMER_ADDRESS) {
      return await customerServiceV2.getCustomerById(id);
    } else {
      return await customerOperations.getCustomerById(id);
    }
  },

  async createCustomer(formData) {
    if (FEATURE_FLAGS.USE_NEW_CUSTOMER_ADDRESS) {
      return await customerServiceV2.createCustomer(formData);
    } else {
      return await customerOperations.createCustomer(formData);
    }
  },

  async updateCustomer(id, formData) {
    if (FEATURE_FLAGS.USE_NEW_CUSTOMER_ADDRESS) {
      return await customerServiceV2.updateCustomer(id, formData);
    } else {
      return await customerOperations.updateCustomer(id, formData);
    }
  },

  async deleteCustomer(id) {
    if (FEATURE_FLAGS.USE_NEW_CUSTOMER_ADDRESS) {
      return await customerServiceV2.deleteCustomer(id);
    } else {
      return await customerOperations.deleteCustomer(id);
    }
  },

  async searchCustomers(searchTerm) {
    if (FEATURE_FLAGS.USE_NEW_CUSTOMER_ADDRESS) {
      return await customerServiceV2.searchCustomers(searchTerm);
    } else {
      return await customerOperations.searchCustomers(searchTerm);
    }
  }
};

// Export both services for flexibility
export default smartCustomerService;

/**
 * Usage Examples:
 * 
 * // Use smart service (automatically chooses V1 or V2)
 * import customerService from './services/customerServiceV2';
 * const customers = await customerService.getAllCustomers();
 * 
 * // Use V2 explicitly
 * import { customerServiceV2 } from './services/customerServiceV2';
 * const customer = await customerServiceV2.createCustomer(formData);
 * 
 * // Feature flag control
 * // Set REACT_APP_USE_NEW_CUSTOMER_ADDRESS=true to enable V2
 * // Set REACT_APP_USE_NEW_CUSTOMER_ADDRESS=false to use V1
 * // Set REACT_APP_EMERGENCY_ROLLBACK=true to force V1
 */
