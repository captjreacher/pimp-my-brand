import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';

// Performance monitoring hook
export function useAdminPerformance() {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    apiResponseTime: 0,
    memoryUsage: 0,
    componentCount: 0,
  });

  const startTime = useRef<number>(Date.now());
  const apiCallTimes = useRef<number[]>([]);

  // Track component render time
  useEffect(() => {
    const endTime = Date.now();
    const renderTime = endTime - startTime.current;
    
    setMetrics(prev => ({
      ...prev,
      renderTime,
    }));
  }, []);

  // Track API response times
  const trackApiCall = useCallback((startTime: number, endTime: number) => {
    const responseTime = endTime - startTime;
    apiCallTimes.current.push(responseTime);
    
    // Keep only last 10 API calls
    if (apiCallTimes.current.length > 10) {
      apiCallTimes.current.shift();
    }

    const avgResponseTime = apiCallTimes.current.reduce((a, b) => a + b, 0) / apiCallTimes.current.length;
    
    setMetrics(prev => ({
      ...prev,
      apiResponseTime: avgResponseTime,
    }));
  }, []);

  // Track memory usage (if available)
  useEffect(() => {
    if ('memory' in performance) {
      const updateMemoryUsage = () => {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024, // MB
        }));
      };

      updateMemoryUsage();
      const interval = setInterval(updateMemoryUsage, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  return {
    metrics,
    trackApiCall,
  };
}

// Optimized data fetching hook for admin components
export function useOptimizedAdminData<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  options: {
    cacheKey?: string;
    cacheDuration?: number;
    refetchInterval?: number;
    enabled?: boolean;
  } = {}
) {
  const {
    cacheKey,
    cacheDuration = 5 * 60 * 1000, // 5 minutes
    refetchInterval,
    enabled = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  const { trackApiCall } = useAdminPerformance();

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    // Check cache first
    if (cacheKey && !force) {
      const cached = cacheRef.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheDuration) {
        setData(cached.data);
        return cached.data;
      }
    }

    setLoading(true);
    setError(null);

    const startTime = Date.now();
    
    try {
      const result = await fetchFn();
      const endTime = Date.now();
      
      trackApiCall(startTime, endTime);
      
      setData(result);
      setLastFetch(Date.now());

      // Cache the result
      if (cacheKey) {
        cacheRef.current.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });
      }

      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchFn, enabled, cacheKey, cacheDuration, trackApiCall]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  // Auto-refetch interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      const interval = setInterval(() => {
        fetchData();
      }, refetchInterval);

      return () => clearInterval(interval);
    }
  }, [fetchData, refetchInterval, enabled]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    lastFetch,
  };
}

// Virtual scrolling hook for large admin lists
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    handleScroll,
  };
}

// Debounced search hook for admin interfaces
export function useAdminSearch<T>(
  items: T[],
  searchFn: (item: T, query: string) => boolean,
  debounceMs = 300
) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const filteredItems = useMemo(() => {
    if (!debouncedQuery.trim()) return items;
    return items.filter(item => searchFn(item, debouncedQuery));
  }, [items, debouncedQuery, searchFn]);

  return {
    query,
    setQuery,
    filteredItems,
    isSearching: query !== debouncedQuery,
  };
}

// Optimized bulk operations hook
export function useBulkOperations<T>(
  items: T[],
  keyExtractor: (item: T) => string
) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleItem = useCallback((item: T) => {
    const key = keyExtractor(item);
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }, [keyExtractor]);

  const toggleAll = useCallback(() => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(keyExtractor)));
    }
  }, [items, keyExtractor, selectedItems.size]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const getSelectedItems = useCallback(() => {
    return items.filter(item => selectedItems.has(keyExtractor(item)));
  }, [items, selectedItems, keyExtractor]);

  const processBulkOperation = useCallback(async <R>(
    operation: (items: T[]) => Promise<R[]>,
    options: {
      batchSize?: number;
      onProgress?: (completed: number, total: number) => void;
      onError?: (item: T, error: Error) => void;
    } = {}
  ) => {
    const { batchSize = 10, onProgress, onError } = options;
    const selectedItemsList = getSelectedItems();
    
    if (selectedItemsList.length === 0) return [];

    setIsProcessing(true);
    const results: R[] = [];
    const errors: Array<{ item: T; error: Error }> = [];

    try {
      // Process in batches
      for (let i = 0; i < selectedItemsList.length; i += batchSize) {
        const batch = selectedItemsList.slice(i, i + batchSize);
        
        try {
          const batchResults = await operation(batch);
          results.push(...batchResults);
        } catch (error) {
          // Handle batch errors
          batch.forEach(item => {
            const err = error as Error;
            errors.push({ item, error: err });
            onError?.(item, err);
          });
        }

        onProgress?.(Math.min(i + batchSize, selectedItemsList.length), selectedItemsList.length);
      }

      // Clear selection after successful processing
      if (errors.length === 0) {
        clearSelection();
      }

      return { results, errors };
    } finally {
      setIsProcessing(false);
    }
  }, [getSelectedItems, clearSelection]);

  return {
    selectedItems,
    selectedCount: selectedItems.size,
    isProcessing,
    toggleItem,
    toggleAll,
    clearSelection,
    getSelectedItems,
    processBulkOperation,
    isAllSelected: selectedItems.size === items.length,
    isNoneSelected: selectedItems.size === 0,
  };
}

// Admin component lazy loading hook
export function useAdminLazyLoading() {
  const [loadedComponents, setLoadedComponents] = useState<Set<string>>(new Set());

  const loadComponent = useCallback(async (componentName: string, loader: () => Promise<any>) => {
    if (loadedComponents.has(componentName)) {
      return;
    }

    try {
      await loader();
      setLoadedComponents(prev => new Set([...prev, componentName]));
    } catch (error) {
      console.error(`Failed to load component ${componentName}:`, error);
    }
  }, [loadedComponents]);

  const isComponentLoaded = useCallback((componentName: string) => {
    return loadedComponents.has(componentName);
  }, [loadedComponents]);

  return {
    loadComponent,
    isComponentLoaded,
    loadedComponents: Array.from(loadedComponents),
  };
}

// Real-time data synchronization hook
export function useAdminRealTimeSync<T>(
  initialData: T,
  syncFn: () => Promise<T>,
  options: {
    interval?: number;
    enabled?: boolean;
    onUpdate?: (newData: T, oldData: T) => void;
  } = {}
) {
  const { interval = 30000, enabled = true, onUpdate } = options;
  const [data, setData] = useState<T>(initialData);
  const [lastSync, setLastSync] = useState<number>(Date.now());
  const [isSyncing, setIsSyncing] = useState(false);

  const sync = useCallback(async () => {
    if (!enabled || isSyncing) return;

    setIsSyncing(true);
    try {
      const newData = await syncFn();
      const oldData = data;
      
      setData(newData);
      setLastSync(Date.now());
      
      if (onUpdate && JSON.stringify(newData) !== JSON.stringify(oldData)) {
        onUpdate(newData, oldData);
      }
    } catch (error) {
      console.error('Real-time sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [enabled, isSyncing, syncFn, data, onUpdate]);

  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(sync, interval);
    return () => clearInterval(intervalId);
  }, [sync, interval, enabled]);

  const forceSync = useCallback(() => {
    sync();
  }, [sync]);

  return {
    data,
    lastSync,
    isSyncing,
    forceSync,
  };
}