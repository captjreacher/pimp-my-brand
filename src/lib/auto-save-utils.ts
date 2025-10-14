/**
 * Utilities for auto-save functionality, offline support, and data synchronization
 */

export interface OfflineBackup<T> {
  data: T;
  timestamp: string;
  version: number;
  key: string;
}

export interface SyncResult<T> {
  success: boolean;
  data?: T;
  conflicts?: Array<{
    key: string;
    local: T;
    server: T;
  }>;
  errors?: Array<{
    key: string;
    error: string;
  }>;
}

/**
 * Offline backup manager for handling local storage operations
 */
export class OfflineBackupManager {
  private static readonly BACKUP_PREFIX = 'autosave_backup_';
  private static readonly INDEX_KEY = 'autosave_backup_index';

  /**
   * Save data to local storage with metadata
   */
  static save<T>(key: string, data: T): boolean {
    try {
      const backup: OfflineBackup<T> = {
        data,
        timestamp: new Date().toISOString(),
        version: Date.now(),
        key,
      };

      const storageKey = this.BACKUP_PREFIX + key;
      localStorage.setItem(storageKey, JSON.stringify(backup));

      // Update index
      this.updateIndex(key);
      
      return true;
    } catch (error) {
      console.warn('Failed to save offline backup:', error);
      return false;
    }
  }

  /**
   * Load data from local storage
   */
  static load<T>(key: string): OfflineBackup<T> | null {
    try {
      const storageKey = this.BACKUP_PREFIX + key;
      const stored = localStorage.getItem(storageKey);
      
      if (!stored) return null;
      
      const backup = JSON.parse(stored) as OfflineBackup<T>;
      return backup;
    } catch (error) {
      console.warn('Failed to load offline backup:', error);
      return null;
    }
  }

  /**
   * Remove backup from local storage
   */
  static remove(key: string): boolean {
    try {
      const storageKey = this.BACKUP_PREFIX + key;
      localStorage.removeItem(storageKey);
      
      // Update index
      this.removeFromIndex(key);
      
      return true;
    } catch (error) {
      console.warn('Failed to remove offline backup:', error);
      return false;
    }
  }

  /**
   * Get all backup keys
   */
  static getAllKeys(): string[] {
    try {
      const index = localStorage.getItem(this.INDEX_KEY);
      return index ? JSON.parse(index) : [];
    } catch (error) {
      console.warn('Failed to load backup index:', error);
      return [];
    }
  }

  /**
   * Get all backups
   */
  static getAllBackups<T>(): Array<OfflineBackup<T>> {
    const keys = this.getAllKeys();
    const backups: Array<OfflineBackup<T>> = [];

    for (const key of keys) {
      const backup = this.load<T>(key);
      if (backup) {
        backups.push(backup);
      }
    }

    return backups.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Clear all backups
   */
  static clearAll(): boolean {
    try {
      const keys = this.getAllKeys();
      
      for (const key of keys) {
        const storageKey = this.BACKUP_PREFIX + key;
        localStorage.removeItem(storageKey);
      }
      
      localStorage.removeItem(this.INDEX_KEY);
      return true;
    } catch (error) {
      console.warn('Failed to clear all backups:', error);
      return false;
    }
  }

  /**
   * Get storage usage information
   */
  static getStorageInfo(): {
    totalBackups: number;
    estimatedSize: number;
    oldestBackup?: Date;
    newestBackup?: Date;
  } {
    const keys = this.getAllKeys();
    let estimatedSize = 0;
    let oldestBackup: Date | undefined;
    let newestBackup: Date | undefined;

    for (const key of keys) {
      try {
        const storageKey = this.BACKUP_PREFIX + key;
        const stored = localStorage.getItem(storageKey);
        
        if (stored) {
          estimatedSize += stored.length * 2; // Rough estimate (UTF-16)
          
          const backup = JSON.parse(stored);
          const backupDate = new Date(backup.timestamp);
          
          if (!oldestBackup || backupDate < oldestBackup) {
            oldestBackup = backupDate;
          }
          
          if (!newestBackup || backupDate > newestBackup) {
            newestBackup = backupDate;
          }
        }
      } catch (error) {
        console.warn(`Failed to analyze backup ${key}:`, error);
      }
    }

    return {
      totalBackups: keys.length,
      estimatedSize,
      oldestBackup,
      newestBackup,
    };
  }

  /**
   * Clean up old backups (keep only the most recent N backups per key)
   */
  static cleanup(maxBackupsPerKey: number = 5): number {
    const keys = this.getAllKeys();
    const keyGroups: Record<string, Array<{ key: string; timestamp: Date }>> = {};
    
    // Group backups by base key
    for (const key of keys) {
      const backup = this.load(key);
      if (backup) {
        const baseKey = key.split('_')[0] || key;
        if (!keyGroups[baseKey]) {
          keyGroups[baseKey] = [];
        }
        keyGroups[baseKey].push({
          key,
          timestamp: new Date(backup.timestamp),
        });
      }
    }

    let removedCount = 0;

    // Remove old backups for each key group
    for (const [baseKey, backups] of Object.entries(keyGroups)) {
      if (backups.length > maxBackupsPerKey) {
        // Sort by timestamp (newest first)
        backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        // Remove old backups
        const toRemove = backups.slice(maxBackupsPerKey);
        for (const backup of toRemove) {
          if (this.remove(backup.key)) {
            removedCount++;
          }
        }
      }
    }

    return removedCount;
  }

  private static updateIndex(key: string): void {
    try {
      const keys = this.getAllKeys();
      if (!keys.includes(key)) {
        keys.push(key);
        localStorage.setItem(this.INDEX_KEY, JSON.stringify(keys));
      }
    } catch (error) {
      console.warn('Failed to update backup index:', error);
    }
  }

  private static removeFromIndex(key: string): void {
    try {
      const keys = this.getAllKeys();
      const filtered = keys.filter(k => k !== key);
      localStorage.setItem(this.INDEX_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.warn('Failed to update backup index:', error);
    }
  }
}

/**
 * Data synchronization utilities
 */
export class DataSyncManager {
  /**
   * Sync offline changes with server
   */
  static async syncOfflineChanges<T>(
    syncFn: (key: string, data: T) => Promise<void>,
    loadFn?: (key: string) => Promise<T>
  ): Promise<SyncResult<T>> {
    const result: SyncResult<T> = {
      success: true,
      conflicts: [],
      errors: [],
    };

    const backups = OfflineBackupManager.getAllBackups<T>();
    
    for (const backup of backups) {
      try {
        await syncFn(backup.key, backup.data);
        
        // Remove successful backup
        OfflineBackupManager.remove(backup.key);
        
      } catch (error: any) {
        result.success = false;
        
        // Handle conflicts
        if (error?.message?.includes('conflict') || error?.status === 409) {
          if (loadFn) {
            try {
              const serverData = await loadFn(backup.key);
              result.conflicts?.push({
                key: backup.key,
                local: backup.data,
                server: serverData,
              });
            } catch (loadError) {
              result.errors?.push({
                key: backup.key,
                error: `Failed to load server data: ${loadError}`,
              });
            }
          } else {
            result.conflicts?.push({
              key: backup.key,
              local: backup.data,
              server: {} as T, // Placeholder
            });
          }
        } else {
          result.errors?.push({
            key: backup.key,
            error: error?.message || 'Unknown error',
          });
        }
      }
    }

    return result;
  }

  /**
   * Check for conflicts between local and server data
   */
  static async checkForConflicts<T>(
    keys: string[],
    loadLocalFn: (key: string) => T | null,
    loadServerFn: (key: string) => Promise<T>,
    compareFn?: (local: T, server: T) => boolean
  ): Promise<Array<{ key: string; local: T; server: T }>> {
    const conflicts: Array<{ key: string; local: T; server: T }> = [];

    for (const key of keys) {
      try {
        const localData = loadLocalFn(key);
        if (!localData) continue;

        const serverData = await loadServerFn(key);
        
        const hasConflict = compareFn 
          ? !compareFn(localData, serverData)
          : JSON.stringify(localData) !== JSON.stringify(serverData);

        if (hasConflict) {
          conflicts.push({
            key,
            local: localData,
            server: serverData,
          });
        }
      } catch (error) {
        console.warn(`Failed to check conflict for ${key}:`, error);
      }
    }

    return conflicts;
  }
}

/**
 * Debounce utility for auto-save operations
 */
export function createDebouncer<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T & { cancel: () => void; flush: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debouncedFn = ((...args: Parameters<T>) => {
    lastArgs = args;
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
      lastArgs = null;
    }, delay);
  }) as T & { cancel: () => void; flush: () => void };

  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastArgs = null;
    }
  };

  debouncedFn.flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      fn(...lastArgs);
      timeoutId = null;
      lastArgs = null;
    }
  };

  return debouncedFn;
}

/**
 * Network status utilities
 */
export class NetworkStatusManager {
  private static listeners: Array<(isOnline: boolean) => void> = [];

  static addListener(callback: (isOnline: boolean) => void): () => void {
    this.listeners.push(callback);

    // Return cleanup function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  static isOnline(): boolean {
    return navigator.onLine;
  }

  static initialize(): void {
    const handleOnline = () => {
      this.listeners.forEach(callback => callback(true));
    };

    const handleOffline = () => {
      this.listeners.forEach(callback => callback(false));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  /**
   * Test network connectivity by making a simple request
   */
  static async testConnectivity(url: string = '/favicon.ico'): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors',
      });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format relative time for display
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}