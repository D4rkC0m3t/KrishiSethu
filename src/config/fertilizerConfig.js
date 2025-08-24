// Comprehensive Fertilizer Types and Categories Configuration
// Based on agricultural industry standards for inventory management

export const FERTILIZER_CATEGORIES = {
  'Chemical Fertilizer': [
    'Urea (46% N)',
    'DAP (Diammonium Phosphate)',
    'MOP (Muriate of Potash)',
    'SSP (Single Super Phosphate)',
    'Ammonium Sulphate',
    'Ammonium Nitrate',
    'Calcium Ammonium Nitrate (CAN)',
    'Potassium Sulphate (SOP)',
    'MAP (Mono Ammonium Phosphate)',
    'Calcium Nitrate',
    'Custom/Other'
  ],
  'Organic Fertilizer': [
    'Vermicompost',
    'Cow Dung Manure',
    'Bone Meal',
    'Neem Cake',
    'Castor Cake',
    'Poultry Manure',
    'Seaweed Extract Fertilizer',
    'Green Manure (Sunhemp, Dhaincha)',
    'Fish Meal Fertilizer',
    'Pressmud Compost',
    'Custom/Other'
  ],
  'Bio Fertilizer': [
    'Rhizobium',
    'Azotobacter',
    'Mycorrhiza',
    'Azospirillum',
    'Phosphate Solubilizing Bacteria (PSB)',
    'Potash Mobilizing Bacteria (KMB)',
    'Zinc Solubilizing Bacteria (ZSB)',
    'Blue-Green Algae (BGA)',
    'Acetobacter',
    'Custom/Other'
  ],
  'Seeds': [
    'Wheat Seeds',
    'Paddy Seeds (Basmati, Non-Basmati)',
    'Maize Seeds (Hybrid & Desi)',
    'Hybrid Vegetables (Tomato, Brinjal, Chilli)',
    'Mustard Seeds',
    'Cotton Seeds (Bt & Non-Bt)',
    'Groundnut Seeds',
    'Soybean Seeds',
    'Sunflower Seeds',
    'Pulses Seeds (Gram, Lentil, Pea)',
    'Custom/Other'
  ],
  'NPK Fertilizers': [
    'NPK 20:20:0',
    'NPK 10:26:26',
    'NPK 12:32:16',
    'NPK 15:15:15',
    'NPK 19:19:19',
    'NPK 14:35:14',
    'NPK 13:40:13',
    'NPK 16:20:0',
    'NPK 28:28:0',
    'Custom/Other'
  ],
  'Pesticides': [
    'Insecticide',
    'Fungicide',
    'Herbicide',
    'Bactericide',
    'Nematicide',
    'Acaricide',
    'Rodenticide',
    'Plant Growth Regulator',
    'Bio-Pesticide',
    'Organic Pesticide',
    'Custom/Other'
  ],
  'Tools': [
    'Hand Tools',
    'Sprayers',
    'Irrigation Equipment',
    'Measuring Tools',
    'Storage Equipment',
    'Safety Equipment',
    'Garden Tools',
    'Farm Machinery Parts',
    'Fertilizer Spreaders',
    'Soil Testing Kits',
    'Custom/Other'
  ]
};

// All categories as a flat array
export const CATEGORIES = Object.keys(FERTILIZER_CATEGORIES);

// All types as a flat array (all subcategories combined)
export const FERTILIZER_TYPES = Object.values(FERTILIZER_CATEGORIES).flat();

// Units optimized for piece-based inventory tracking
// Primary recommendation: Use 'pcs' for most products to avoid UOM confusion
export const UNITS = [
  'pcs',     // Recommended: pieces/items (bottles, packets, tools, etc.)
  'kg',      // For loose products sold by weight
  'liters',  // For liquid products sold by volume
  'bags',    // Only if selling complete bags (not individual items from bags)
  'bottles', // Deprecated: use 'pcs' instead
  'packets', // Deprecated: use 'pcs' instead  
  'boxes',   // Deprecated: use 'pcs' instead
  'pieces',  // Deprecated: use 'pcs' instead
  'tons',    // For bulk products
  'grams',   // For small quantities
  'ml'       // For small liquid quantities
];

// Product naming convention examples
export const PRODUCT_NAMING_EXAMPLES = {
  'Liquid Products': [
    'Nutrient @12% - 250ml',
    'Pesticide XYZ - 500ml', 
    'Growth Hormone @5% - 100ml'
  ],
  'Granular Products': [
    'NPK 20:20:0 - 50kg Bag',
    'Urea 46% - 25kg Bag',
    'Organic Compost - 10kg Pack'
  ],
  'Seeds': [
    'Wheat Seeds Premium - 1kg Pack',
    'Tomato Seeds Hybrid - 100gm Pack',
    'Cotton Seeds Bt - 500gm Pack'
  ],
  'Tools': [
    'Sprayer Manual - 16L Capacity',
    'Fertilizer Spreader - Hand Operated',
    'pH Meter Digital - Portable'
  ]
};

// UOM Best Practices Guide
export const UOM_BEST_PRACTICES = {
  unit_selection: {
    recommendation: 'Always use "pcs" as the primary unit for countable items',
    reasoning: 'Eliminates confusion between wholesale (boxes) and retail (individual items) units',
    examples: {
      correct: 'Product: "Nutrient @12% - 250ml", Unit: pcs, Qty: 50 (if you have 50 bottles)',
      incorrect: 'Product: "Nutrient", Unit: boxes, Qty: 5 (creates confusion about individual bottles)'
    }
  },
  product_naming: {
    format: '[Product Name] @[Concentration/Grade]% - [Pack Size][Unit]',
    examples: [
      'Nutrient @12% - 250ml',
      'NPK @20:20:0 - 50kg',
      'Pesticide ABC @25% - 1L'
    ]
  },
  pricing: {
    rule: 'Always enter purchase and sale price per piece (individual item)',
    example: 'If you buy 1 box of 10 bottles at ₹2000, enter Purchase Price = ₹200 per piece'
  }
};

export const GST_RATES = [
  0,
  5,
  12,
  18,
  28
];

// Common HSN codes for fertilizers
export const COMMON_HSN_CODES = {
  'Chemical Fertilizer': {
    'Urea (46% N)': '31021000',
    'DAP (Diammonium Phosphate)': '31051000',
    'MOP (Muriate of Potash)': '31041000',
    'SSP (Single Super Phosphate)': '31031000',
    'Ammonium Sulphate': '31022100',
    'Ammonium Nitrate': '31023000',
    'Calcium Ammonium Nitrate (CAN)': '31023000',
    'Potassium Sulphate (SOP)': '31042000',
    'MAP (Mono Ammonium Phosphate)': '31051000',
    'Calcium Nitrate': '31026000'
  },
  'NPK Fertilizers': {
    'NPK 20:20:0': '31051000',
    'NPK 10:26:26': '31051000',
    'NPK 12:32:16': '31051000',
    'NPK 15:15:15': '31051000',
    'NPK 19:19:19': '31051000',
    'NPK 14:35:14': '31051000',
    'NPK 13:40:13': '31051000',
    'NPK 16:20:0': '31051000',
    'NPK 28:28:0': '31051000'
  },
  'Organic Fertilizer': {
    'Vermicompost': '31010000',
    'Cow Dung Manure': '31010000',
    'Bone Meal': '31010000',
    'Neem Cake': '31010000',
    'Castor Cake': '31010000',
    'Poultry Manure': '31010000',
    'Seaweed Extract Fertilizer': '31010000',
    'Green Manure (Sunhemp, Dhaincha)': '31010000',
    'Fish Meal Fertilizer': '31010000',
    'Pressmud Compost': '31010000'
  },
  'Bio Fertilizer': {
    'Rhizobium': '31010000',
    'Azotobacter': '31010000',
    'Mycorrhiza': '31010000',
    'Azospirillum': '31010000',
    'Phosphate Solubilizing Bacteria (PSB)': '31010000',
    'Potash Mobilizing Bacteria (KMB)': '31010000',
    'Zinc Solubilizing Bacteria (ZSB)': '31010000',
    'Blue-Green Algae (BGA)': '31010000',
    'Acetobacter': '31010000'
  },
  'Seeds': {
    'Wheat Seeds': '10019900',
    'Paddy Seeds (Basmati, Non-Basmati)': '10061000',
    'Maize Seeds (Hybrid & Desi)': '10051000',
    'Hybrid Vegetables (Tomato, Brinjal, Chilli)': '12099100',
    'Mustard Seeds': '12051000',
    'Cotton Seeds (Bt & Non-Bt)': '12072100',
    'Groundnut Seeds': '12024200',
    'Soybean Seeds': '12019000',
    'Sunflower Seeds': '12060000',
    'Pulses Seeds (Gram, Lentil, Pea)': '07139000'
  },
  'Pesticides': {
    'Insecticide': '38089100',
    'Fungicide': '38089200',
    'Herbicide': '38089300',
    'Bactericide': '38089400',
    'Nematicide': '38089500',
    'Acaricide': '38089600',
    'Rodenticide': '38089700',
    'Plant Growth Regulator': '38089800',
    'Bio-Pesticide': '38089900',
    'Organic Pesticide': '38089900'
  },
  'Tools': {
    'Hand Tools': '82019000',
    'Sprayers': '84248100',
    'Irrigation Equipment': '84248200',
    'Measuring Tools': '90279000',
    'Storage Equipment': '39269000',
    'Safety Equipment': '39269100',
    'Garden Tools': '82019100',
    'Farm Machinery Parts': '84329000',
    'Fertilizer Spreaders': '84248300',
    'Soil Testing Kits': '90279100'
  }
};

// Helper function to get HSN code for a product
export const getHSNCode = (category, type) => {
  return COMMON_HSN_CODES[category]?.[type] || '';
};

// Helper function to get types for a category
export const getTypesForCategory = (category) => {
  return FERTILIZER_CATEGORIES[category] || [];
};

// Helper function to get suggested GST rate based on category
export const getSuggestedGSTRate = (category) => {
  const gstRates = {
    'Chemical Fertilizer': 5,
    'Organic Fertilizer': 0,
    'Bio Fertilizer': 0,
    'NPK Fertilizers': 5,
    'Seeds': 0,
    'Pesticides': 18,
    'Tools': 18
  };
  return gstRates[category] || 18;
};
