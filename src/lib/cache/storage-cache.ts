interface StorageCacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class StorageCache {
  private prefix: string;

  constructor(prefix = 'pbg_cache_') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  set<T>(key: string, data: T, ttl = 30 * 60 * 1000): void { // Default 30 minutes
    try {
      const entry: StorageCacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      
      localStorage.setItem(this.getKey(key), JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to set cache entry:', error);
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.getKey(key));
      
      if (!item) {
        return null;
      }

      const entry: StorageCacheEntry<T> = JSON.parse(item);
      
      // Check if entry has expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.delete(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Failed to get cache entry:', error);
      return null;
    }
  }

  has(key: string): boolean {
    try {
      const item = localStorage.getItem(this.getKey(key));
      
      if (!item) {
        return false;
      }

      const entry: StorageCacheEntry<any> = JSON.parse(item);
      
      // Check if entry has expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.delete(key);
        return false;
      }

      return true;
    } catch (error) {
      console.warn('Failed to check cache entry:', error);
      return false;
    }
  }

  delete(key: string): void {
    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.warn('Failed to delete cache entry:', error);
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  // Clean up expired entries
  cleanup(): void {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();
      
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const entry: StorageCacheEntry<any> = JSON.parse(item);
              if (now - entry.timestamp > entry.ttl) {
                localStorage.removeItem(key);
              }
            }
          } catch (error) {
            // Remove corrupted entries
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to cleanup cache:', error);
    }
  }

  // Get cache size in bytes (approximate)
  getSize(): number {
    try {
      let size = 0;
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          const item = localStorage.getItem(key);
          if (item) {
            size += key.length + item.length;
          }
        }
      });
      
      return size;
    } catch (error) {
      console.warn('Failed to calculate cache size:', error);
      return 0;
    }
  }
}

// Global storage cache instance
export const storageCache = new StorageCache();

// Cleanup expired entries on page load
storageCache.cleanup();