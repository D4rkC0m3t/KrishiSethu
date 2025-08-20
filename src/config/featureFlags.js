/**
 * Feature Flags Configuration
 * 
 * This system allows safe rollout of new features without breaking existing functionality.
 * All flags default to FALSE (safe mode) and can be enabled via environment variables.
 * 
 * EMERGENCY ROLLBACK: Set REACT_APP_EMERGENCY_ROLLBACK=true to disable all new features instantly
 */

// Emergency rollback - disables ALL new features instantly
const EMERGENCY_ROLLBACK = process.env.REACT_APP_EMERGENCY_ROLLBACK === 'true';

if (EMERGENCY_ROLLBACK) {
  console.warn('🚨 EMERGENCY ROLLBACK ACTIVE - All new features disabled');
}

export const FEATURE_FLAGS = {
  // Emergency rollback flag
  EMERGENCY_ROLLBACK,

  // Customer Management Features
  USE_NEW_CUSTOMER_ADDRESS: !EMERGENCY_ROLLBACK && 
    process.env.REACT_APP_USE_NEW_CUSTOMER_ADDRESS === 'true',
  
  USE_ENHANCED_CUSTOMER_FIELDS: !EMERGENCY_ROLLBACK && 
    process.env.REACT_APP_USE_ENHANCED_CUSTOMER_FIELDS === 'true',

  // Product Management Features  
  USE_ENHANCED_PRODUCT_FIELDS: !EMERGENCY_ROLLBACK && 
    process.env.REACT_APP_USE_ENHANCED_PRODUCT_FIELDS === 'true',
  
  USE_PRODUCT_COMPOSITION_JSONB: !EMERGENCY_ROLLBACK && 
    process.env.REACT_APP_USE_PRODUCT_COMPOSITION_JSONB === 'true',

  // Sales & POS Features
  USE_NEW_SALES_FORMAT: !EMERGENCY_ROLLBACK && 
    process.env.REACT_APP_USE_NEW_SALES_FORMAT === 'true',
  
  USE_ENHANCED_POS_DATA: !EMERGENCY_ROLLBACK && 
    process.env.REACT_APP_USE_ENHANCED_POS_DATA === 'true',

  // Purchase Management Features
  USE_ENHANCED_PURCHASE_FIELDS: !EMERGENCY_ROLLBACK && 
    process.env.REACT_APP_USE_ENHANCED_PURCHASE_FIELDS === 'true',

  // Brand Management Features
  USE_ENHANCED_BRAND_FIELDS: !EMERGENCY_ROLLBACK && 
    process.env.REACT_APP_USE_ENHANCED_BRAND_FIELDS === 'true',

  // Database & Performance Features
  USE_NEW_FIELD_MAPPINGS: !EMERGENCY_ROLLBACK && 
    process.env.REACT_APP_USE_NEW_FIELD_MAPPINGS === 'true',
  
  USE_ENHANCED_ERROR_HANDLING: !EMERGENCY_ROLLBACK && 
    process.env.REACT_APP_USE_ENHANCED_ERROR_HANDLING === 'true',

  // Development & Testing Features
  ENABLE_DEBUG_LOGGING: process.env.REACT_APP_ENABLE_DEBUG_LOGGING === 'true',
  ENABLE_PERFORMANCE_MONITORING: process.env.REACT_APP_ENABLE_PERFORMANCE_MONITORING === 'true',
  ENABLE_FEATURE_ANALYTICS: process.env.REACT_APP_ENABLE_FEATURE_ANALYTICS === 'true'
};

// Feature flag utilities
export const featureUtils = {
  /**
   * Check if a feature is enabled
   * @param {string} featureName - Name of the feature flag
   * @returns {boolean} - Whether the feature is enabled
   */
  isEnabled(featureName) {
    return FEATURE_FLAGS[featureName] === true;
  },

  /**
   * Get all enabled features
   * @returns {string[]} - Array of enabled feature names
   */
  getEnabledFeatures() {
    return Object.keys(FEATURE_FLAGS).filter(key => FEATURE_FLAGS[key] === true);
  },

  /**
   * Get feature flag status for debugging
   * @returns {object} - Object with all feature flags and their status
   */
  getStatus() {
    return {
      emergencyRollback: EMERGENCY_ROLLBACK,
      enabledFeatures: this.getEnabledFeatures(),
      allFlags: FEATURE_FLAGS,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }
    };
  },

  /**
   * Log feature flag status (for debugging)
   */
  logStatus() {
    if (FEATURE_FLAGS.ENABLE_DEBUG_LOGGING) {
      console.group('🚩 Feature Flags Status');
      console.log('Emergency Rollback:', EMERGENCY_ROLLBACK);
      console.log('Enabled Features:', this.getEnabledFeatures());
      console.log('All Flags:', FEATURE_FLAGS);
      console.groupEnd();
    }
  },

  /**
   * Check if user should get new feature (for gradual rollout)
   * @param {string} userId - User ID for consistent experience
   * @param {number} percentage - Percentage of users to enable (0-100)
   * @returns {boolean} - Whether user should get the feature
   */
  shouldEnableForUser(userId, percentage = 0) {
    if (EMERGENCY_ROLLBACK) return false;
    if (percentage === 0) return false;
    if (percentage === 100) return true;
    
    // Simple hash function for consistent user experience
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return Math.abs(hash) % 100 < percentage;
  }
};

// Environment configuration helper
export const envConfig = {
  /**
   * Get environment-specific configuration
   */
  getConfig() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';
    
    return {
      isDevelopment,
      isProduction,
      // Enable more features in development
      enableAllFeatures: isDevelopment && process.env.REACT_APP_ENABLE_ALL_FEATURES === 'true',
      // Stricter safety in production
      requireExplicitEnable: isProduction
    };
  },

  /**
   * Get safe defaults for production
   */
  getSafeDefaults() {
    return {
      USE_NEW_CUSTOMER_ADDRESS: false,
      USE_ENHANCED_PRODUCT_FIELDS: false,
      USE_NEW_SALES_FORMAT: false,
      USE_ENHANCED_PURCHASE_FIELDS: false,
      USE_ENHANCED_BRAND_FIELDS: false
    };
  }
};

// Initialize feature flags logging
if (typeof window !== 'undefined') {
  // Only in browser environment
  featureUtils.logStatus();
  
  // Make feature flags available in console for debugging
  window.FEATURE_FLAGS = FEATURE_FLAGS;
  window.featureUtils = featureUtils;
}

// Export default for easy importing
export default FEATURE_FLAGS;

/**
 * Usage Examples:
 * 
 * // Basic usage
 * import { FEATURE_FLAGS } from './config/featureFlags';
 * if (FEATURE_FLAGS.USE_NEW_CUSTOMER_ADDRESS) {
 *   // Use new customer address format
 * }
 * 
 * // Utility usage
 * import { featureUtils } from './config/featureFlags';
 * if (featureUtils.isEnabled('USE_NEW_CUSTOMER_ADDRESS')) {
 *   // Use new feature
 * }
 * 
 * // Gradual rollout
 * if (featureUtils.shouldEnableForUser(user.id, 10)) {
 *   // Enable for 10% of users
 * }
 * 
 * // Emergency rollback
 * // Set REACT_APP_EMERGENCY_ROLLBACK=true in environment
 * // All new features will be disabled instantly
 */
