import { useEffect, useState } from "react";

// Bump this version whenever we change data schema or fix breaking issues
const APP_VERSION = "v3.0.0"; // Updated for localStorage corruption fix

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      // Check app version and clear incompatible data
      const currentVersion = localStorage.getItem("appVersion");
      if (currentVersion !== APP_VERSION) {
        console.log(`🔄 App version changed from ${currentVersion} to ${APP_VERSION} - clearing localStorage`);
        
        // Clear all localStorage except theme preferences
        const theme = localStorage.getItem('theme');
        localStorage.clear();
        if (theme) localStorage.setItem('theme', theme);
        
        // Set new version
        localStorage.setItem("appVersion", APP_VERSION);
        setValue(initialValue);
        setIsLoading(false);
        return;
      }

      // Try to load existing value
      const item = localStorage.getItem(key);
      if (item) {
        try {
          const parsed = JSON.parse(item);
          
          // Additional validation for auth tokens
          if (key.includes('auth') || key.includes('sb-')) {
            // Check if auth token is expired or malformed
            if (parsed && typeof parsed === 'object') {
              if (parsed.expires_at && new Date(parsed.expires_at * 1000) < new Date()) {
                console.log(`🧽 Removing expired token: ${key}`);
                localStorage.removeItem(key);
                setValue(initialValue);
              } else {
                setValue(parsed);
              }
            } else {
              // Malformed auth data
              console.log(`🧽 Removing malformed auth data: ${key}`);
              localStorage.removeItem(key);
              setValue(initialValue);
            }
          } else {
            setValue(parsed);
          }
        } catch (parseError) {
          console.warn(`🧽 Corrupted data in localStorage key "${key}":`, parseError);
          localStorage.removeItem(key);
          setValue(initialValue);
        }
      } else {
        setValue(initialValue);
      }
    } catch (error) {
      console.error(`🔴 localStorage error for key "${key}":`, error);
      // Fallback: try to clear just this key
      try {
        localStorage.removeItem(key);
      } catch (clearError) {
        console.error('Cannot clear localStorage:', clearError);
      }
      setValue(initialValue);
    } finally {
      setIsLoading(false);
    }
  }, [key, initialValue]);

  const updateValue = (newValue) => {
    try {
      setValue(newValue);
      if (newValue === null || newValue === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(newValue));
      }
    } catch (error) {
      console.error(`🔴 Failed to save to localStorage key "${key}":`, error);
      // Still update state even if localStorage fails
      setValue(newValue);
    }
  };

  const clearValue = () => {
    try {
      localStorage.removeItem(key);
      setValue(initialValue);
    } catch (error) {
      console.error(`🔴 Failed to clear localStorage key "${key}":`, error);
      setValue(initialValue);
    }
  };

  return [value, updateValue, clearValue, isLoading];
}

// Helper to safely clear all auth-related localStorage
export function clearAuthStorage() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('auth') || key.includes('sb-'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🧽 Cleared auth storage: ${key}`);
    });
    
    // Also clear sessionStorage
    sessionStorage.clear();
    
    return true;
  } catch (error) {
    console.error('🔴 Failed to clear auth storage:', error);
    return false;
  }
}

// Helper to check if localStorage is available and working
export function isLocalStorageAvailable() {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.warn('🔴 localStorage is not available:', error);
    return false;
  }
}
