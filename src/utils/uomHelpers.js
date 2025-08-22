/**
 * UOM Helper Functions for Improved Product Management
 * Based on piece-based inventory tracking approach
 */

import { UNITS, PRODUCT_NAMING_EXAMPLES, UOM_BEST_PRACTICES } from '../config/fertilizerConfig';

/**
 * Generate suggested product name based on inputs
 * @param {Object} productData - Product information
 * @returns {string} Suggested product name
 */
export const generateSuggestedProductName = (productData) => {
  const { name, type, concentration, packSize, packUnit } = productData;
  
  if (!name) return '';
  
  let suggestedName = name;
  
  // Add concentration if provided (for fertilizers, pesticides)
  if (concentration && concentration.trim()) {
    suggestedName += ` @${concentration}%`;
  }
  
  // Add pack size and unit if provided
  if (packSize && packUnit) {
    suggestedName += ` - ${packSize}${packUnit}`;
  } else if (packSize) {
    suggestedName += ` - ${packSize}`;
  }
  
  return suggestedName;
};

/**
 * Validate product name format
 * @param {string} productName - Product name to validate
 * @returns {Object} Validation result with isValid and suggestions
 */
export const validateProductName = (productName) => {
  if (!productName || productName.trim().length < 3) {
    return {
      isValid: false,
      message: 'Product name must be at least 3 characters long',
      suggestions: []
    };
  }
  
  const name = productName.trim();
  const suggestions = [];
  
  // Check if name includes concentration for chemical products
  const hasConcentration = /@\d+%/.test(name);
  
  // Check if name includes pack size
  const hasPackSize = /- \d+\w+/.test(name);
  
  if (!hasConcentration && (name.toLowerCase().includes('fertilizer') || 
      name.toLowerCase().includes('pesticide') || 
      name.toLowerCase().includes('nutrient'))) {
    suggestions.push('Consider adding concentration (e.g., "@12%") for fertilizers/pesticides');
  }
  
  if (!hasPackSize) {
    suggestions.push('Consider adding pack size (e.g., "- 250ml" or "- 50kg")');
  }
  
  return {
    isValid: true,
    message: suggestions.length > 0 ? 'Name is valid but could be improved' : 'Good product name format',
    suggestions
  };
};

/**
 * Get recommended unit based on product category and type
 * @param {string} category - Product category
 * @param {string} productName - Product name for context
 * @returns {string} Recommended unit
 */
export const getRecommendedUnit = (category, productName = '') => {
  const name = productName.toLowerCase();
  
  // For liquid products (bottles, containers)
  if (name.includes('liquid') || name.includes('ml') || name.includes('liter')) {
    return 'pcs'; // Count bottles/containers as pieces
  }
  
  // For granular products in bags
  if (name.includes('bag') || name.includes('kg')) {
    return 'pcs'; // Count bags as pieces
  }
  
  // For seeds in packets
  if (category === 'Seeds' || name.includes('seed')) {
    return 'pcs'; // Count seed packets as pieces
  }
  
  // For tools and equipment
  if (category === 'Tools') {
    return 'pcs'; // Count tools as pieces
  }
  
  // For loose products sold by weight (rare cases)
  if (name.includes('loose') || name.includes('bulk')) {
    return 'kg';
  }
  
  // Default recommendation
  return 'pcs';
};

/**
 * Format price display with per-unit clarification
 * @param {number} price - Price value
 * @param {string} unit - Unit of measurement
 * @returns {string} Formatted price string
 */
export const formatPriceWithUnit = (price, unit) => {
  const formattedPrice = `₹${Number(price).toFixed(2)}`;
  
  if (unit === 'pcs') {
    return `${formattedPrice} per piece`;
  }
  
  return `${formattedPrice} per ${unit}`;
};

/**
 * Calculate total value and provide unit clarity
 * @param {number} quantity - Quantity
 * @param {number} rate - Rate per unit
 * @param {string} unit - Unit of measurement
 * @returns {Object} Calculation result with formatted strings
 */
export const calculateInventoryValue = (quantity, rate, unit) => {
  const qty = Number(quantity) || 0;
  const price = Number(rate) || 0;
  const totalValue = qty * price;
  
  return {
    quantity: qty,
    rate: price,
    totalValue: totalValue,
    formatted: {
      quantity: `${qty} ${unit}`,
      rate: formatPriceWithUnit(price, unit),
      totalValue: `₹${totalValue.toFixed(2)}`,
      perUnit: unit === 'pcs' ? 'per piece' : `per ${unit}`
    }
  };
};

/**
 * Get UOM best practices for display in UI
 * @returns {Object} Best practices object
 */
export const getUOMBestPractices = () => {
  return UOM_BEST_PRACTICES;
};

/**
 * Get product naming examples for a category
 * @param {string} category - Product category
 * @returns {Array} Array of naming examples
 */
export const getProductNamingExamples = (category) => {
  // Map categories to example types
  const categoryMap = {
    'Chemical Fertilizer': 'Granular Products',
    'Organic Fertilizer': 'Granular Products',
    'Bio Fertilizer': 'Liquid Products',
    'NPK Fertilizers': 'Granular Products',
    'Pesticides': 'Liquid Products',
    'Seeds': 'Seeds',
    'Tools': 'Tools'
  };
  
  const exampleType = categoryMap[category] || 'Liquid Products';
  return PRODUCT_NAMING_EXAMPLES[exampleType] || [];
};

/**
 * Validate quantity entry for piece-based system
 * @param {string} quantity - Quantity input
 * @param {string} unit - Unit of measurement
 * @returns {Object} Validation result
 */
export const validateQuantity = (quantity, unit) => {
  const qty = Number(quantity);
  
  if (isNaN(qty) || qty < 0) {
    return {
      isValid: false,
      message: 'Quantity must be a valid positive number'
    };
  }
  
  if (unit === 'pcs' && !Number.isInteger(qty)) {
    return {
      isValid: false,
      message: 'Quantity must be a whole number for pieces'
    };
  }
  
  if (qty === 0) {
    return {
      isValid: true,
      message: 'Warning: Zero quantity will mark product as out of stock',
      isWarning: true
    };
  }
  
  return {
    isValid: true,
    message: `Valid quantity: ${qty} ${unit}`
  };
};

/**
 * Get unit display name with explanation
 * @param {string} unit - Unit code
 * @returns {Object} Unit display information
 */
export const getUnitDisplayInfo = (unit) => {
  const unitInfo = {
    'pcs': {
      display: 'Pieces (pcs)',
      description: 'Recommended for countable items like bottles, packets, bags',
      icon: '📦'
    },
    'kg': {
      display: 'Kilograms (kg)',
      description: 'For products sold by weight',
      icon: '⚖️'
    },
    'liters': {
      display: 'Liters (L)',
      description: 'For liquid products sold by volume',
      icon: '🥤'
    },
    'bags': {
      display: 'Bags',
      description: 'Use only if selling complete bags (not individual items from bags)',
      icon: '🛍️'
    },
    'tons': {
      display: 'Tons',
      description: 'For bulk products',
      icon: '🚛'
    },
    'grams': {
      display: 'Grams (g)',
      description: 'For small quantities',
      icon: '⚖️'
    },
    'ml': {
      display: 'Milliliters (ml)',
      description: 'For small liquid quantities',
      icon: '🥤'
    }
  };
  
  return unitInfo[unit] || {
    display: unit,
    description: '',
    icon: '📋'
  };
};

/**
 * Generate product entry tips based on category
 * @param {string} category - Product category
 * @returns {Array} Array of tips
 */
export const getProductEntryTips = (category) => {
  const generalTips = [
    "Use 'pcs' as unit for countable items (bottles, packets, bags)",
    "Include concentration/grade and pack size in product name",
    "Enter purchase price per individual item, not per box/case",
    "Set minimum stock level based on your sales pattern"
  ];
  
  const categorySpecificTips = {
    'Chemical Fertilizer': [
      "Include NPK values or concentration in product name",
      "Specify bag size (e.g., '50kg Bag')",
      "Track batch numbers for quality control"
    ],
    'Pesticides': [
      "Always include concentration percentage",
      "Specify container size (250ml, 500ml, 1L)",
      "Pay attention to expiry dates"
    ],
    'Seeds': [
      "Include variety/type information",
      "Specify packet weight (100gm, 500gm, 1kg)",
      "Track season and expiry information"
    ],
    'Tools': [
      "Include capacity or size specifications",
      "Use descriptive names for easy identification",
      "Consider warranty information in description"
    ]
  };
  
  const specificTips = categorySpecificTips[category] || [];
  return [...generalTips, ...specificTips];
};

export default {
  generateSuggestedProductName,
  validateProductName,
  getRecommendedUnit,
  formatPriceWithUnit,
  calculateInventoryValue,
  getUOMBestPractices,
  getProductNamingExamples,
  validateQuantity,
  getUnitDisplayInfo,
  getProductEntryTips
};
