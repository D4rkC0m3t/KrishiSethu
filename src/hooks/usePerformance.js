import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { cacheService, CACHE_TTL, debounce, throttle } from '../lib/cache';

/**
 * Custom hook for performance-optimized data fetching with caching
 * @param {string} cacheKey - Cache key
 * @param {Function} fetchFunction - Function to fetch data
 * @param {object} options - Options for caching and performance
 * @returns {object} { data, loading, error, refresh, clearCache }
 */
export const useOptimizedData = (cacheKey, fetchFunction, options = {}) => {
  const {
    ttl = CACHE_TTL.MEDIUM,
    enableCache = true,
    dependencies = [],
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const loadData = useCallback(async (forceRefresh = false) => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      let result;
      if (enableCache && !forceRefresh) {
        result = await cacheService.getOrSet(cacheKey, fetchFunction, ttl);
      } else {
        if (forceRefresh && enableCache) {
          cacheService.delete(cacheKey);
        }
        result = await fetchFunction();
        if (enableCache) {
          cacheService.set(cacheKey, result, ttl);
        }
      }

      if (mountedRef.current) {
        setData(result);
        onSuccess?.(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        onError?.(err);
        console.error(`Error loading data for ${cacheKey}:`, err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [cacheKey, fetchFunction, ttl, enableCache, onSuccess, onError]);

  useEffect(() => {
    loadData();
  }, [loadData, ...dependencies]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  const clearCache = useCallback(() => {
    if (enableCache) {
      cacheService.delete(cacheKey);
    }
  }, [cacheKey, enableCache]);

  return { data, loading, error, refresh, clearCache };
};

/**
 * Custom hook for debounced search functionality
 * @param {string} initialValue - Initial search value
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {object} { searchTerm, debouncedSearchTerm, setSearchTerm }
 */
export const useDebouncedSearch = (initialValue = '', delay = 300) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialValue);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, delay]);

  return { searchTerm, debouncedSearchTerm, setSearchTerm };
};

/**
 * Custom hook for throttled function execution
 * @param {Function} callback - Function to throttle
 * @param {number} delay - Throttle delay in milliseconds
 * @returns {Function} Throttled function
 */
export const useThrottledCallback = (callback, delay) => {
  const throttledCallback = useMemo(
    () => throttle(callback, delay),
    [callback, delay]
  );

  return throttledCallback;
};

/**
 * Custom hook for debounced function execution
 * @param {Function} callback - Function to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Function} Debounced function
 */
export const useDebouncedCallback = (callback, delay) => {
  const debouncedCallback = useMemo(
    () => debounce(callback, delay),
    [callback, delay]
  );

  return debouncedCallback;
};

/**
 * Custom hook for lazy loading with intersection observer
 * @param {object} options - Intersection observer options
 * @returns {object} { ref, isVisible, hasBeenVisible }
 */
export const useLazyLoading = (options = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasBeenVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [options]);

  return { ref, isVisible, hasBeenVisible };
};

/**
 * Custom hook for virtual scrolling (for large lists)
 * @param {Array} items - Array of items
 * @param {number} itemHeight - Height of each item
 * @param {number} containerHeight - Height of the container
 * @returns {object} Virtual scrolling data
 */
export const useVirtualScrolling = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItemsCount = Math.ceil(containerHeight / itemHeight);
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleItemsCount + 1, items.length);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      index: startIndex + index,
      top: (startIndex + index) * itemHeight
    }));
  }, [items, startIndex, endIndex, itemHeight]);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    handleScroll,
    startIndex,
    endIndex
  };
};

/**
 * Custom hook for performance monitoring
 * @param {string} componentName - Name of the component
 * @returns {object} Performance monitoring functions
 */
export const usePerformanceMonitor = (componentName) => {
  const renderCount = useRef(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const renderTime = Date.now() - startTime.current;
    
    if (renderTime > 100) { // Log slow renders (>100ms)
      console.warn(`Slow render detected in ${componentName}: ${renderTime}ms (render #${renderCount.current})`);
    }
    
    startTime.current = Date.now();
  });

  const logPerformance = useCallback((action, duration) => {
    console.log(`Performance [${componentName}] ${action}: ${duration}ms`);
  }, [componentName]);

  const measureAsync = useCallback(async (action, asyncFunction) => {
    const start = Date.now();
    try {
      const result = await asyncFunction();
      const duration = Date.now() - start;
      logPerformance(action, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logPerformance(`${action} (ERROR)`, duration);
      throw error;
    }
  }, [logPerformance]);

  return {
    renderCount: renderCount.current,
    logPerformance,
    measureAsync
  };
};

/**
 * Custom hook for memory usage monitoring
 * @returns {object} Memory usage information
 */
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if (performance.memory) {
        setMemoryInfo({
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
          usedMB: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          totalMB: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};

/**
 * Custom hook for batch operations
 * @param {Function} batchFunction - Function to execute in batch
 * @param {number} batchSize - Size of each batch
 * @param {number} delay - Delay between batches
 * @returns {object} Batch operation functions
 */
export const useBatchOperations = (batchFunction, batchSize = 10, delay = 100) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const processBatch = useCallback(async (items) => {
    setIsProcessing(true);
    setProgress(0);

    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    const results = [];
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchResults = await batchFunction(batch);
      results.push(...batchResults);
      
      setProgress(((i + 1) / batches.length) * 100);
      
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    setIsProcessing(false);
    setProgress(100);
    return results;
  }, [batchFunction, batchSize, delay]);

  return { processBatch, isProcessing, progress };
};
