import { useEffect, useRef } from 'react';
import { realtimeService } from '../lib/realtime';

/**
 * Custom hook for subscribing to Supabase Realtime updates
 * @param {string} tableName - Name of the table to subscribe to
 * @param {Function} onUpdate - Callback function to handle updates
 * @param {boolean} enabled - Whether the subscription is enabled (default: true)
 * @returns {object} Object with subscription status and methods
 */
export const useSupabaseRealtime = (tableName, onUpdate, enabled = true) => {
  const unsubscribeRef = useRef(null);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !tableName || !onUpdate) {
      return;
    }

    console.log(`🔔 Setting up useSupabaseRealtime hook for ${tableName}`);

    // Set up the subscription
    const unsubscribe = realtimeService.subscribe(
      tableName,
      (payload) => {
        console.log(`🔄 Realtime update received in hook for ${tableName}:`, payload);
        
        // Call the provided callback with the update
        if (typeof onUpdate === 'function') {
          onUpdate(payload);
        }
      }
    );

    unsubscribeRef.current = unsubscribe;
    isSubscribedRef.current = true;

    // Cleanup function
    return () => {
      console.log(`🔌 Cleaning up useSupabaseRealtime hook for ${tableName}`);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [tableName, onUpdate, enabled]);

  return {
    isSubscribed: isSubscribedRef.current,
    unsubscribe: () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        isSubscribedRef.current = false;
      }
    }
  };
};

/**
 * Custom hook for subscribing to a specific document's Supabase Realtime updates
 * @param {string} tableName - Name of the table
 * @param {string} documentId - ID of the specific document
 * @param {Function} onUpdate - Callback function to handle updates
 * @param {boolean} enabled - Whether the subscription is enabled (default: true)
 * @returns {object} Object with subscription status and methods
 */
export const useSupabaseRealtimeDocument = (tableName, documentId, onUpdate, enabled = true) => {
  const unsubscribeRef = useRef(null);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !tableName || !documentId || !onUpdate) {
      return;
    }

    console.log(`🔔 Setting up useSupabaseRealtimeDocument hook for ${tableName}/${documentId}`);

    // Set up the document subscription
    const unsubscribe = realtimeService.subscribeToDocument(
      tableName,
      documentId,
      (document) => {
        console.log(`📝 Document update received in hook for ${tableName}/${documentId}:`, document);
        
        // Call the provided callback with the updated document
        if (typeof onUpdate === 'function') {
          onUpdate(document);
        }
      }
    );

    unsubscribeRef.current = unsubscribe;
    isSubscribedRef.current = true;

    // Cleanup function
    return () => {
      console.log(`🔌 Cleaning up useSupabaseRealtimeDocument hook for ${tableName}/${documentId}`);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [tableName, documentId, onUpdate, enabled]);

  return {
    isSubscribed: isSubscribedRef.current,
    unsubscribe: () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        isSubscribedRef.current = false;
      }
    }
  };
};

/**
 * Hook specifically for products realtime updates
 * @param {Function} onProductUpdate - Callback for product changes
 * @param {boolean} enabled - Whether subscription is enabled
 */
export const useProductsRealtime = (onProductUpdate, enabled = true) => {
  return useSupabaseRealtime('products', onProductUpdate, enabled);
};

/**
 * Hook specifically for sales realtime updates
 * @param {Function} onSaleUpdate - Callback for sale changes
 * @param {boolean} enabled - Whether subscription is enabled
 */
export const useSalesRealtime = (onSaleUpdate, enabled = true) => {
  return useSupabaseRealtime('sales', onSaleUpdate, enabled);
};

/**
 * Hook specifically for customers realtime updates
 * @param {Function} onCustomerUpdate - Callback for customer changes
 * @param {boolean} enabled - Whether subscription is enabled
 */
export const useCustomersRealtime = (onCustomerUpdate, enabled = true) => {
  return useSupabaseRealtime('customers', onCustomerUpdate, enabled);
};

/**
 * Hook specifically for inventory (products) realtime updates with stock focus
 * @param {Function} onInventoryUpdate - Callback for inventory changes
 * @param {boolean} enabled - Whether subscription is enabled
 */
export const useInventoryRealtime = (onInventoryUpdate, enabled = true) => {
  const handleProductUpdate = (payload) => {
    // Focus on quantity/stock changes for inventory updates
    if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
      console.log(`📦 Inventory update detected:`, payload);
      
      // Call the callback with inventory-focused data
      if (typeof onInventoryUpdate === 'function') {
        onInventoryUpdate({
          type: payload.eventType,
          product: payload.new || payload.old,
          changes: payload
        });
      }
    }
  };

  return useSupabaseRealtime('products', handleProductUpdate, enabled);
};

export default {
  useSupabaseRealtime,
  useSupabaseRealtimeDocument,
  useProductsRealtime,
  useSalesRealtime,
  useCustomersRealtime,
  useInventoryRealtime
};
