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
    'Calcium Nitrate'
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
    'Pressmud Compost'
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
    'Acetobacter'
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
    'Pulses Seeds (Gram, Lentil, Pea)'
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
    'NPK 28:28:0'
  ]
};

// All categories as a flat array
export const CATEGORIES = Object.keys(FERTILIZER_CATEGORIES);

// All types as a flat array (all subcategories combined)
export const FERTILIZER_TYPES = Object.values(FERTILIZER_CATEGORIES).flat();

// Additional product attributes
export const UNITS = [
  'kg',
  'bags',
  'liters',
  'tons',
  'packets',
  'bottles',
  'boxes',
  'pieces'
];

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
    'Seeds': 0
  };
  return gstRates[category] || 18;
};
