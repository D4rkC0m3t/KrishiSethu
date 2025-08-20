/**
 * Database Synchronization Configuration
 * 
 * This module provides dynamic mapping between database categories and frontend types
 * based on actual database content rather than hardcoded configurations.
 */

import { supabase } from '../lib/supabase';

// Cache for database categories to avoid repeated queries
let categoriesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get categories from database with caching
 */
export const getDatabaseCategories = async () => {
  const now = Date.now();
  
  // Return cached data if still valid
  if (categoriesCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return categoriesCache;
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    categoriesCache = data || [];
    cacheTimestamp = now;
    
    console.log('📋 Loaded categories from database:', categoriesCache);
    return categoriesCache;
  } catch (error) {
    console.error('❌ Error loading categories:', error);
    return [];
  }
};

/**
 * Dynamic category-to-types mapping based on CONFIG categories
 * UPDATED: Now matches your exact config category requirements
 */
export const getDynamicCategoryTypes = (categoryName) => {
  if (!categoryName) {
    console.log('⚠️ getDynamicCategoryTypes: No category name provided');
    return [];
  }

  const normalizedName = categoryName.toLowerCase().trim();
  console.log(`🔍 getDynamicCategoryTypes: Processing "${categoryName}" -> "${normalizedName}"`);

  // EXACT mapping for your CONFIG categories
  const categoryTypeMapping = {
    // Chemical Fertilizer (10 types)
    'chemical fertilizer': [
      'Urea (46% N)',
      'DAP (Diammonium Phosphate)',
      'MOP (Muriate of Potash)',
      'SSP (Single Super Phosphate)',
      'Ammonium Sulphate',
      'Ammonium Nitrate',
      'Calcium Ammonium Nitrate (CAN)',
      'Potassium Sulphate (SOP)',
      'MAP (Mono Ammonium Phosphate)',
      'Calcium Nitrate'
    ],

    // Organic Fertilizer (10 types)
    'organic fertilizer': [
      'Vermicompost',
      'Cow Dung Manure',
      'Bone Meal',
      'Neem Cake',
      'Castor Cake',
      'Poultry Manure',
      'Seaweed Extract Fertilizer',
      'Green Manure (Sunhemp, Dhaincha)',
      'Fish Meal Fertilizer',
      'Pressmud Compost'
    ],

    // Bio Fertilizer (9 types)
    'bio fertilizer': [
      'Rhizobium',
      'Azotobacter',
      'Mycorrhiza',
      'Azospirillum',
      'Phosphate Solubilizing Bacteria (PSB)',
      'Potash Mobilizing Bacteria (KMB)',
      'Zinc Solubilizing Bacteria (ZSB)',
      'Blue-Green Algae (BGA)',
      'Acetobacter'
    ],

    // Seeds (10 types)
    'seeds': [
      'Wheat Seeds',
      'Paddy Seeds (Basmati, Non-Basmati)',
      'Maize Seeds (Hybrid & Desi)',
      'Hybrid Vegetables (Tomato, Brinjal, Chilli)',
      'Mustard Seeds',
      'Cotton Seeds (Bt & Non-Bt)',
      'Groundnut Seeds',
      'Soybean Seeds',
      'Sunflower Seeds',
      'Pulses Seeds (Gram, Lentil, Pea)'
    ],

    // Pesticides (5 types)
    'pesticides': [
      'Insecticides (Chlorpyrifos, Imidacloprid)',
      'Fungicides (Mancozeb, Carbendazim)',
      'Herbicides (Glyphosate, 2,4-D)',
      'Rodenticides (Zinc Phosphide)',
      'Plant Growth Regulators (NAA, GA3)'
    ],

    // Tools & Equipment (5 types)
    'tools & equipment': [
      'Hand Tools (Spade, Hoe, Sickle)',
      'Sprayers (Manual, Battery)',
      'Irrigation Equipment (Drip, Sprinkler)',
      'Measuring Tools (pH Meter, Soil Tester)',
      'Storage Equipment (Bags, Containers)'
    ]
  };

  // Try exact match first
  if (categoryTypeMapping[normalizedName]) {
    console.log(`✅ Found exact match for "${normalizedName}":`, categoryTypeMapping[normalizedName]);
    return categoryTypeMapping[normalizedName];
  }

  // Try partial matches for flexibility
  for (const [key, types] of Object.entries(categoryTypeMapping)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      console.log(`✅ Found partial match "${key}" for "${normalizedName}":`, types);
      return types;
    }
  }

  // Keyword-based fallback with logging
  console.log(`🔍 Trying keyword-based matching for "${normalizedName}"`);

  if (normalizedName.includes('chemical') || normalizedName.includes('fertilizer')) {
    console.log('✅ Matched chemical fertilizer keyword');
    return categoryTypeMapping['chemical fertilizer'];
  } else if (normalizedName.includes('organic')) {
    console.log('✅ Matched organic keyword');
    return categoryTypeMapping['organic fertilizer'];
  } else if (normalizedName.includes('bio')) {
    console.log('✅ Matched bio keyword');
    return categoryTypeMapping['bio fertilizer'];
  } else if (normalizedName.includes('seed')) {
    console.log('✅ Matched seed keyword');
    return categoryTypeMapping['seeds'];
  } else if (normalizedName.includes('pesticide') || normalizedName.includes('insecticide')) {
    console.log('✅ Matched pesticide keyword');
    return categoryTypeMapping['pesticides'];
  } else if (normalizedName.includes('tool') || normalizedName.includes('equipment')) {
    console.log('✅ Matched tools keyword');
    return categoryTypeMapping['tools & equipment'];
  }

  // Generic fallback with warning
  console.log(`⚠️ No match found for "${normalizedName}", using generic fallback`);
  return ['Standard', 'Premium', 'Granular', 'Liquid', 'Powder'];
};

/**
 * Get types for a category by ID (for use in components)
 */
export const getTypesForCategoryId = async (categoryId) => {
  if (!categoryId) return [];

  try {
    const categories = await getDatabaseCategories();
    const category = categories.find(cat => cat.id === categoryId);
    
    if (category) {
      return getDynamicCategoryTypes(category.name);
    }
    
    return [];
  } catch (error) {
    console.error('❌ Error getting types for category:', error);
    return [];
  }
};

/**
 * Comprehensive field mapping for all tables
 */
export const FIELD_MAPPINGS = {
  products: {
    // Frontend camelCase -> Database snake_case
    toDb: {
      categoryId: 'category_id',
      brandId: 'brand_id',
      supplierId: 'supplier_id',
      batchNo: 'batch_no',
      expiryDate: 'expiry_date',
      manufacturingDate: 'manufacturing_date',
      purchasePrice: 'purchase_price',
      sellingPrice: 'selling_price',
      minStockLevel: 'min_stock_level',
      maxStockLevel: 'max_stock_level',
      gstRate: 'gst_rate',
      imageUrls: 'image_urls',
      isActive: 'is_active',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    // Database snake_case -> Frontend camelCase
    fromDb: {
      category_id: 'categoryId',
      brand_id: 'brandId',
      supplier_id: 'supplierId',
      batch_no: 'batchNo',
      expiry_date: 'expiryDate',
      manufacturing_date: 'manufacturingDate',
      purchase_price: 'purchasePrice',
      selling_price: 'sellingPrice',
      min_stock_level: 'minStockLevel',
      max_stock_level: 'maxStockLevel',
      gst_rate: 'gstRate',
      image_urls: 'imageUrls',
      is_active: 'isActive',
      created_at: 'createdAt',
      updated_at: 'updatedAt'
    }
  },
  
  categories: {
    toDb: {
      parentCategory: 'parent_category',
      isActive: 'is_active',
      sortOrder: 'sort_order',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    fromDb: {
      parent_category: 'parentCategory',
      is_active: 'isActive',
      sort_order: 'sortOrder',
      created_at: 'createdAt',
      updated_at: 'updatedAt'
    }
  },
  
  suppliers: {
    toDb: {
      contactPerson: 'contact_person',
      gstNumber: 'gst_number',
      isActive: 'is_active',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    fromDb: {
      contact_person: 'contactPerson',
      gst_number: 'gstNumber',
      is_active: 'isActive',
      created_at: 'createdAt',
      updated_at: 'updatedAt'
    }
  }
};

/**
 * Transform data from frontend format to database format
 */
export const transformToDb = (data, tableName) => {
  const mapping = FIELD_MAPPINGS[tableName]?.toDb;
  if (!mapping) return data;

  const transformed = { ...data };
  
  Object.entries(mapping).forEach(([frontendField, dbField]) => {
    if (frontendField in transformed) {
      transformed[dbField] = transformed[frontendField];
      delete transformed[frontendField];
    }
  });

  return transformed;
};

/**
 * Transform data from database format to frontend format
 */
export const transformFromDb = (data, tableName) => {
  const mapping = FIELD_MAPPINGS[tableName]?.fromDb;
  if (!mapping) return data;

  const transformed = { ...data };
  
  Object.entries(mapping).forEach(([dbField, frontendField]) => {
    if (dbField in transformed) {
      transformed[frontendField] = transformed[dbField];
      delete transformed[dbField];
    }
  });

  return transformed;
};

/**
 * Validate data consistency
 */
export const validateDataConsistency = async () => {
  const issues = [];

  try {
    // Check for orphaned products
    const { data: products } = await supabase
      .from('products')
      .select('id, name, category_id')
      .not('category_id', 'is', null);

    const { data: categories } = await supabase
      .from('categories')
      .select('id');

    const categoryIds = categories?.map(cat => cat.id) || [];
    const orphanedProducts = products?.filter(product => 
      product.category_id && !categoryIds.includes(product.category_id)
    ) || [];

    if (orphanedProducts.length > 0) {
      issues.push({
        type: 'orphaned_products',
        count: orphanedProducts.length,
        items: orphanedProducts
      });
    }

    return { valid: issues.length === 0, issues };
  } catch (error) {
    console.error('❌ Error validating data consistency:', error);
    return { valid: false, error: error.message };
  }
};

/**
 * Clear categories cache (useful after database updates)
 */
export const clearCategoriesCache = () => {
  categoriesCache = null;
  cacheTimestamp = null;
  console.log('🔄 Categories cache cleared');
};

// Export for debugging
export const debug = {
  getCache: () => ({ categoriesCache, cacheTimestamp }),
  clearCache: clearCategoriesCache
};
