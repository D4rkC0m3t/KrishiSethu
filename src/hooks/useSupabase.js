import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Custom hook for safe Supabase operations
 * Provides loading states and error handling
 */
export const useSupabase = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Safe query wrapper
  const query = async (operation) => {
    if (!isSupabaseConfigured()) {
      const error = new Error('Supabase not configured');
      setError(error);
      return { data: null, error };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await operation(supabase);
      setIsLoading(false);
      return result;
    } catch (err) {
      setError(err);
      setIsLoading(false);
      return { data: null, error: err };
    }
  };

  // Safe auth operations
  const auth = {
    signIn: async (email, password) => {
      return query(async (sb) => sb.auth.signInWithPassword({ email, password }));
    },
    signUp: async (email, password) => {
      return query(async (sb) => sb.auth.signUp({ email, password }));
    },
    signOut: async () => {
      return query(async (sb) => sb.auth.signOut());
    },
    getUser: async () => {
      return query(async (sb) => sb.auth.getUser());
    }
  };

  // Safe database operations
  const db = {
    select: (table) => ({
      execute: async () => {
        return query(async (sb) => sb.from(table).select());
      },
      eq: (column, value) => ({
        execute: async () => {
          return query(async (sb) => sb.from(table).select().eq(column, value));
        }
      })
    }),
    insert: (table, data) => ({
      execute: async () => {
        return query(async (sb) => sb.from(table).insert(data));
      }
    }),
    update: (table, data) => ({
      eq: (column, value) => ({
        execute: async () => {
          return query(async (sb) => sb.from(table).update(data).eq(column, value));
        }
      })
    }),
    delete: (table) => ({
      eq: (column, value) => ({
        execute: async () => {
          return query(async (sb) => sb.from(table).delete().eq(column, value));
        }
      })
    })
  };

  return {
    isConfigured: isSupabaseConfigured(),
    isLoading,
    error,
    auth,
    db,
    client: supabase // Direct access if needed
  };
};

/**
 * Hook for checking Supabase connection status
 */
export const useSupabaseStatus = () => {
  const [status, setStatus] = useState({
    isConfigured: false,
    isConnected: false,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const checkStatus = async () => {
      const isConfigured = isSupabaseConfigured();
      
      if (!isConfigured) {
        setStatus({
          isConfigured: false,
          isConnected: false,
          isLoading: false,
          error: new Error('Supabase not configured')
        });
        return;
      }

      try {
        // Test connection with a simple query
        const { error } = await supabase.from('_health_check').select('*').limit(1);
        
        setStatus({
          isConfigured: true,
          isConnected: !error,
          isLoading: false,
          error: error
        });
      } catch (err) {
        setStatus({
          isConfigured: true,
          isConnected: false,
          isLoading: false,
          error: err
        });
      }
    };

    checkStatus();
  }, []);

  return status;
};

export default useSupabase;
