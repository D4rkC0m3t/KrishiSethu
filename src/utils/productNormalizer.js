// Product data normalizer - handles backend schema changes gracefully
// This prevents localStorage corruption when API response format changes

export const PRODUCT_SCHEMA_VERSION = "1.0.0";

// Expected product structure after normalization
export const DEFAULT_PRODUCT = {
  id: null,
  name: '',
  brand: 'No Brand',
  brandName: 'No Brand',
  category: 'No Category',
  categoryName: 'No Category',
  type: 'Chemical',
  quantity: 0,
  unit: 'kg',
  purchasePrice: 0,
  salePrice: 0,
  mrp: 0,
  batchNo: '',
  expiryDate: null,
  manufacturingDate: null,
  description: '',
  composition: null,
  hsnCode: '',
  gstRate: 0,
  imageUrls: [],
  isActive: true,
  createdAt: null,
  updatedAt: null,
  // Computed fields
  stockStatus: 'unknown',
  expiryStatus: 'no-expiry'
};

// Normalize API product data to consistent format
export function normalizeProduct(apiProduct) {
  if (!apiProduct || typeof apiProduct !== 'object') {
    console.warn('🔴 Invalid product data received:', apiProduct);
    return { ...DEFAULT_PRODUCT, id: Date.now().toString() };
  }

  try {
    const normalized = {
      // Core fields with fallbacks
      id: apiProduct.id || Date.now().toString(),
      name: apiProduct.name || apiProduct.title || apiProduct.product_name || 'Unnamed Product',
      
      // Brand handling - multiple possible field names
      brand: getBrandName(apiProduct),
      brandName: getBrandName(apiProduct),
      
      // Category handling - multiple possible field names  
      category: getCategoryName(apiProduct),
      categoryName: getCategoryName(apiProduct),
      
      // Product type with validation
      type: validateProductType(apiProduct.type),
      
      // Quantities and pricing
      quantity: parseNumber(apiProduct.quantity, 0),
      unit: apiProduct.unit || 'kg',
      purchasePrice: parseNumber(apiProduct.purchase_price || apiProduct.purchasePrice || apiProduct.cost_price, 0),
      salePrice: parseNumber(apiProduct.sale_price || apiProduct.salePrice || apiProduct.selling_price || apiProduct.price, 0),
      mrp: parseNumber(apiProduct.mrp || apiProduct.max_retail_price, 0),
      
      // Batch and dates
      batchNo: apiProduct.batch_no || apiProduct.batchNo || '',
      expiryDate: parseDate(apiProduct.expiry_date || apiProduct.expiryDate),
      manufacturingDate: parseDate(apiProduct.manufacturing_date || apiProduct.manufacturingDate),
      
      // Additional details
      description: apiProduct.description || '',
      composition: apiProduct.composition || null,
      
      // Tax and regulatory
      hsnCode: apiProduct.hsn_code || apiProduct.hsnCode || apiProduct.hsn || '',
      gstRate: parseNumber(apiProduct.gst_rate || apiProduct.gstRate || apiProduct.tax_rate, 0),
      
      // Media
      imageUrls: normalizeImageUrls(apiProduct.image_urls || apiProduct.imageUrls || apiProduct.images),
      
      // Status
      isActive: apiProduct.is_active !== false && apiProduct.isActive !== false,
      
      // Timestamps
      createdAt: parseDate(apiProduct.created_at || apiProduct.createdAt),
      updatedAt: parseDate(apiProduct.updated_at || apiProduct.updatedAt),
      
      // Store original API data for debugging (only in development)
      ...(process.env.NODE_ENV === 'development' && { _originalApiData: apiProduct })
    };

    // Add computed fields
    normalized.stockStatus = calculateStockStatus(normalized.quantity);
    normalized.expiryStatus = calculateExpiryStatus(normalized.expiryDate);

    return normalized;
  } catch (error) {
    console.error('🔴 Error normalizing product:', error, apiProduct);
    return {
      ...DEFAULT_PRODUCT,
      id: apiProduct.id || Date.now().toString(),
      name: apiProduct.name || 'Error Loading Product'
    };
  }
}

// Helper functions for field extraction

function getBrandName(product) {
  // Handle different brand field structures
  if (product.brands && typeof product.brands === 'object') {
    return product.brands.name || 'No Brand';
  }
  return product.brand_name || product.brandName || product.brand || 'No Brand';
}

function getCategoryName(product) {
  // Handle different category field structures
  if (product.categories && typeof product.categories === 'object') {
    return product.categories.name || 'No Category';
  }
  return product.category_name || product.categoryName || product.category || 'No Category';
}

function validateProductType(type) {
  const validTypes = ['Chemical', 'Organic', 'Bio', 'NPK', 'Seeds', 'Pesticide', 'Tools'];
  if (validTypes.includes(type)) {
    return type;
  }
  
  // Try to map common variations
  const typeMap = {
    'chemical': 'Chemical',
    'organic': 'Organic', 
    'bio': 'Bio',
    'biofertilizer': 'Bio',
    'bio-fertilizer': 'Bio',
    'npk': 'NPK',
    'seed': 'Seeds',
    'seeds': 'Seeds',
    'pesticide': 'Pesticide',
    'pesticides': 'Pesticide',
    'tool': 'Tools',
    'tools': 'Tools'
  };
  
  const lowerType = String(type || '').toLowerCase();
  return typeMap[lowerType] || 'Chemical';
}

function parseNumber(value, defaultValue = 0) {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

function parseDate(value) {
  if (!value) return null;
  
  try {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date.toISOString();
  } catch (error) {
    console.warn('🔴 Invalid date format:', value);
    return null;
  }
}

function normalizeImageUrls(images) {
  if (!images) return [];
  
  if (Array.isArray(images)) {
    return images.filter(url => typeof url === 'string' && url.length > 0);
  }
  
  if (typeof images === 'string') {
    return [images];
  }
  
  return [];
}

function calculateStockStatus(quantity) {
  const qty = Number(quantity) || 0;
  
  if (qty === 0) return 'out-of-stock';
  if (qty <= 10) return 'low-stock';
  return 'in-stock';
}

function calculateExpiryStatus(expiryDate) {
  if (!expiryDate) return 'no-expiry';
  
  try {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'expired';
    if (diffDays <= 7) return 'critical';
    if (diffDays <= 30) return 'warning';
    return 'good';
  } catch (error) {
    return 'no-expiry';
  }
}

// Batch normalize products array
export function normalizeProductsArray(apiProducts) {
  if (!Array.isArray(apiProducts)) {
    console.warn('🔴 Expected array of products, got:', typeof apiProducts);
    return [];
  }
  
  return apiProducts
    .map(normalizeProduct)
    .filter(product => product.id); // Remove products without valid IDs
}

// Validate normalized product has required fields
export function validateNormalizedProduct(product) {
  const required = ['id', 'name'];
  const missing = required.filter(field => !product[field]);
  
  if (missing.length > 0) {
    console.warn(`🔴 Product missing required fields: ${missing.join(', ')}`, product);
    return false;
  }
  
  return true;
}
