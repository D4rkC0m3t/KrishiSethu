/**
 * Navigation Refresh Utility
 * 
 * This utility provides a consistent pattern for triggering data refreshes
 * when navigating between components in the application.
 * 
 * Usage:
 * - Import the utility functions
 * - Use triggerRefresh() to notify a component to refresh its data
 * - Use onRefreshEvent() to listen for refresh events
 * 
 * Example:
 * // In a component that needs to trigger refresh
 * import { triggerInventoryRefresh } from '../utils/navigationRefresh';
 * triggerInventoryRefresh();
 * 
 * // In a component that needs to listen for refresh
 * import { onInventoryRefresh } from '../utils/navigationRefresh';
 * onInventoryRefresh(() => { loadData(); });
 */

// Event names for different components
export const REFRESH_EVENTS = {
  INVENTORY: 'inventory-navigation-refresh',
  SALES: 'sales-navigation-refresh',
  REPORTS: 'reports-navigation-refresh',
  CUSTOMERS: 'customers-navigation-refresh',
  SUPPLIERS: 'suppliers-navigation-refresh',
  CATEGORIES: 'categories-navigation-refresh',
  BRANDS: 'brands-navigation-refresh',
};

/**
 * Generic function to trigger a refresh event
 * @param {string} eventName - Name of the event to trigger
 * @param {Object} data - Optional data to pass with the event
 */
export const triggerRefreshEvent = (eventName, data = {}) => {
  console.log(`🔄 NavigationRefresh: Triggering ${eventName} event`, data);
  const event = new CustomEvent(eventName, { detail: data });
  window.dispatchEvent(event);
};

/**
 * Generic function to listen for refresh events
 * @param {string} eventName - Name of the event to listen for
 * @param {Function} callback - Callback function to execute when event is triggered
 * @returns {Function} - Cleanup function to remove the event listener
 */
export const onRefreshEvent = (eventName, callback) => {
  const handler = (event) => {
    console.log(`🔄 NavigationRefresh: Received ${eventName} event`, event.detail);
    callback(event.detail);
  };

  window.addEventListener(eventName, handler);

  // Return cleanup function
  return () => {
    window.removeEventListener(eventName, handler);
  };
};

// Specific trigger functions for common components
export const triggerInventoryRefresh = (data = {}) => {
  triggerRefreshEvent(REFRESH_EVENTS.INVENTORY, data);
};

export const triggerSalesRefresh = (data = {}) => {
  triggerRefreshEvent(REFRESH_EVENTS.SALES, data);
};

export const triggerReportsRefresh = (data = {}) => {
  triggerRefreshEvent(REFRESH_EVENTS.REPORTS, data);
};

export const triggerCustomersRefresh = (data = {}) => {
  triggerRefreshEvent(REFRESH_EVENTS.CUSTOMERS, data);
};

export const triggerSuppliersRefresh = (data = {}) => {
  triggerRefreshEvent(REFRESH_EVENTS.SUPPLIERS, data);
};

export const triggerCategoriesRefresh = (data = {}) => {
  triggerRefreshEvent(REFRESH_EVENTS.CATEGORIES, data);
};

export const triggerBrandsRefresh = (data = {}) => {
  triggerRefreshEvent(REFRESH_EVENTS.BRANDS, data);
};

// Specific listener functions for common components
export const onInventoryRefresh = (callback) => {
  return onRefreshEvent(REFRESH_EVENTS.INVENTORY, callback);
};

export const onSalesRefresh = (callback) => {
  return onRefreshEvent(REFRESH_EVENTS.SALES, callback);
};

export const onReportsRefresh = (callback) => {
  return onRefreshEvent(REFRESH_EVENTS.REPORTS, callback);
};

export const onCustomersRefresh = (callback) => {
  return onRefreshEvent(REFRESH_EVENTS.CUSTOMERS, callback);
};

export const onSuppliersRefresh = (callback) => {
  return onRefreshEvent(REFRESH_EVENTS.SUPPLIERS, callback);
};

export const onCategoriesRefresh = (callback) => {
  return onRefreshEvent(REFRESH_EVENTS.CATEGORIES, callback);
};

export const onBrandsRefresh = (callback) => {
  return onRefreshEvent(REFRESH_EVENTS.BRANDS, callback);
};

/**
 * Hook-like function for React components to easily set up refresh listeners
 * @param {string} eventName - Event name to listen for
 * @param {Function} callback - Callback function
 * @param {Array} dependencies - Dependencies array (like useEffect)
 */
export const useRefreshListener = (eventName, callback, dependencies = []) => {
  // This should be used within a useEffect hook in React components
  console.log(`🔄 NavigationRefresh: Setting up listener for ${eventName}`);
  return onRefreshEvent(eventName, callback);
};

/**
 * Utility to trigger multiple refresh events at once
 * @param {Array<string>} eventNames - Array of event names to trigger
 * @param {Object} data - Data to pass with all events
 */
export const triggerMultipleRefresh = (eventNames, data = {}) => {
  eventNames.forEach(eventName => {
    triggerRefreshEvent(eventName, data);
  });
};

/**
 * Debounced refresh trigger to prevent excessive refresh calls
 * @param {string} eventName - Event name to trigger
 * @param {Object} data - Data to pass with the event
 * @param {number} delay - Delay in milliseconds (default: 300)
 */
export const debouncedRefreshTrigger = (() => {
  const timeouts = {};
  
  return (eventName, data = {}, delay = 300) => {
    if (timeouts[eventName]) {
      clearTimeout(timeouts[eventName]);
    }
    
    timeouts[eventName] = setTimeout(() => {
      triggerRefreshEvent(eventName, data);
      delete timeouts[eventName];
    }, delay);
  };
})();

/**
 * Enhanced navigation function that includes refresh triggering
 * @param {Function} originalNavigate - Original navigation function
 * @param {string} targetPage - Page to navigate to
 * @param {Object} data - Data to pass to the page
 * @param {Array<string>} refreshEvents - Events to trigger after navigation
 */
export const navigateWithRefresh = (originalNavigate, targetPage, data = {}, refreshEvents = []) => {
  console.log(`🧭 NavigationRefresh: Navigating to ${targetPage} with refresh events:`, refreshEvents);
  
  // Execute original navigation
  originalNavigate(targetPage, data);
  
  // Trigger refresh events after a small delay to ensure component is mounted
  setTimeout(() => {
    refreshEvents.forEach(eventName => {
      triggerRefreshEvent(eventName, { source: 'navigation', target: targetPage });
    });
  }, 100);
};

export default {
  REFRESH_EVENTS,
  triggerRefreshEvent,
  onRefreshEvent,
  triggerInventoryRefresh,
  triggerSalesRefresh,
  triggerReportsRefresh,
  triggerCustomersRefresh,
  triggerSuppliersRefresh,
  triggerCategoriesRefresh,
  triggerBrandsRefresh,
  onInventoryRefresh,
  onSalesRefresh,
  onReportsRefresh,
  onCustomersRefresh,
  onSuppliersRefresh,
  onCategoriesRefresh,
  onBrandsRefresh,
  useRefreshListener,
  triggerMultipleRefresh,
  debouncedRefreshTrigger,
  navigateWithRefresh,
};
