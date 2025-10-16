import { QueryClient } from "@tanstack/react-query";
import { storageCache } from "./storage-cache";

// Create optimized query client with caching strategies
export const createOptimizedQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache for 5 minutes by default
        staleTime: 5 * 60 * 1000,
        // Keep in cache for 10 minutes
        gcTime: 10 * 60 * 1000,
        // Retry failed requests 2 times
        retry: 2,
        // Don't refetch on window focus for better performance
        refetchOnWindowFocus: false,
        // Don't refetch on reconnect for cached data
        refetchOnReconnect: 'always',
      },
      mutations: {
        // Retry failed mutations once
        retry: 1,
      },
    },
  });
};

// Cache keys for consistent caching
export const cacheKeys = {
  // User data
  profile: (userId: string) => ['profile', userId],
  uploads: (userId: string) => ['uploads', userId],
  
  // Brand data
  brands: (userId: string) => ['brands', userId],
  brand: (brandId: string) => ['brand', brandId],
  
  // CV data
  cvs: (userId: string) => ['cvs', userId],
  cv: (cvId: string) => ['cv', cvId],
  
  // Gallery data
  gallery: (filters?: Record<string, any>) => ['gallery', filters],
  
  // AI analysis
  styleAnalysis: (textHash: string) => ['style-analysis', textHash],
  visualAnalysis: (textHash: string) => ['visual-analysis', textHash],
  
  // File processing
  fileExtraction: (fileHash: string) => ['file-extraction', fileHash],
} as const;

// Utility functions for caching AI results
export const cacheAIResult = <T>(key: string, data: T, ttl = 60 * 60 * 1000) => {
  storageCache.set(key, data, ttl); // Cache AI results for 1 hour
};

export const getCachedAIResult = <T>(key: string): T | null => {
  return storageCache.get<T>(key);
};

// Hash function for creating consistent cache keys
export const createHash = (input: string): string => {
  let hash = 0;
  if (input.length === 0) return hash.toString();
  
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString();
};