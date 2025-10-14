import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict' | 'offline';

export interface AutoSaveOptions<T> {
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Function to save data to the server */
  onSave: (data: T) => Promise<void>;
  /** Function to load data from the server for conflict resolution */
  onLoad?: () => Promise<T>;
  /** Local storage key for offline backup */
  localStorageKey?: string;
  /** Enable offline support */
  enableOfflineSupport?: boolean;
  /** Show toast notifications */
  showToasts?: boolean;
}

export interface AutoSaveState {
  status: SaveStatus;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  isOnline: boolean;
}

export interface AutoSaveActions<T> {
  /** Trigger a save operation */
  save: (data: T) => Promise<void>;
  /** Force save without debouncing */
  forceSave: (data: T) => Promise<void>;
  /** Resolve conflicts by choosing server or local version */
  resolveConflict: (useServerVersion: boolean, data?: T) => Promise<void>;
  /** Clear the offline backup */
  clearOfflineBackup: () => void;
  /** Get offline backup data */
  getOfflineBackup: () => T | null;
}

/**
 * Hook for auto-saving editor changes with debouncing, conflict resolution, and offline support
 */
export function useAutoSave<T>(
  options: AutoSaveOptions<T>
): [AutoSaveState, AutoSaveActions<T>] {
  const {
    debounceMs = 2000,
    onSave,
    onLoad,
    localStorageKey,
    enableOfflineSupport = true,
    showToasts = true,
  } = options;

  const { toast } = useToast();
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [conflictData, setConflictData] = useState<T | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSaveAttemptRef = useRef<Date | null>(null);
  const pendingDataRef = useRef<T | null>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (showToasts) {
        toast({
          title: 'Back online',
          description: 'Auto-save has been restored.',
        });
      }
      
      // Try to save any pending offline changes
      if (pendingDataRef.current && enableOfflineSupport) {
        forceSave(pendingDataRef.current);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (showToasts) {
        toast({
          title: 'You are offline',
          description: 'Changes will be saved locally until connection is restored.',
          variant: 'destructive',
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enableOfflineSupport, showToasts, toast]);

  // Save to local storage for offline support
  const saveToLocalStorage = useCallback((data: T) => {
    if (!enableOfflineSupport || !localStorageKey) return;
    
    try {
      const backup = {
        data,
        timestamp: new Date().toISOString(),
        version: Date.now(), // Simple versioning
      };
      localStorage.setItem(localStorageKey, JSON.stringify(backup));
    } catch (error) {
      console.warn('Failed to save to local storage:', error);
    }
  }, [enableOfflineSupport, localStorageKey]);

  // Get offline backup data
  const getOfflineBackup = useCallback((): T | null => {
    if (!enableOfflineSupport || !localStorageKey) return null;
    
    try {
      const backup = localStorage.getItem(localStorageKey);
      if (!backup) return null;
      
      const parsed = JSON.parse(backup);
      return parsed.data || null;
    } catch (error) {
      console.warn('Failed to load from local storage:', error);
      return null;
    }
  }, [enableOfflineSupport, localStorageKey]);

  // Clear offline backup
  const clearOfflineBackup = useCallback(() => {
    if (!localStorageKey) return;
    
    try {
      localStorage.removeItem(localStorageKey);
    } catch (error) {
      console.warn('Failed to clear local storage:', error);
    }
  }, [localStorageKey]);

  // Perform the actual save operation
  const performSave = useCallback(async (data: T, isForced = false): Promise<void> => {
    if (!isOnline && enableOfflineSupport) {
      // Save offline
      setStatus('offline');
      saveToLocalStorage(data);
      pendingDataRef.current = data;
      setHasUnsavedChanges(true);
      
      if (showToasts && isForced) {
        toast({
          title: 'Saved offline',
          description: 'Changes saved locally. Will sync when online.',
        });
      }
      return;
    }

    setStatus('saving');
    lastSaveAttemptRef.current = new Date();

    try {
      await onSave(data);
      
      setStatus('saved');
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      pendingDataRef.current = null;
      
      // Clear offline backup after successful save
      if (enableOfflineSupport) {
        clearOfflineBackup();
      }

      if (showToasts && isForced) {
        toast({
          title: 'Saved',
          description: 'Your changes have been saved successfully.',
        });
      }

      // Reset to idle after a short delay
      setTimeout(() => {
        setStatus(prev => prev === 'saved' ? 'idle' : prev);
      }, 2000);

    } catch (error: any) {
      console.error('Save failed:', error);
      
      // Check if it's a conflict error (you might need to adjust this based on your API)
      if (error?.message?.includes('conflict') || error?.status === 409) {
        setStatus('conflict');
        
        // Try to load server version for conflict resolution
        if (onLoad) {
          try {
            const serverData = await onLoad();
            setConflictData(serverData);
          } catch (loadError) {
            console.error('Failed to load server data for conflict resolution:', loadError);
          }
        }
        
        if (showToasts) {
          toast({
            title: 'Conflict detected',
            description: 'Someone else has modified this document. Please resolve the conflict.',
            variant: 'destructive',
          });
        }
      } else {
        setStatus('error');
        setHasUnsavedChanges(true);
        
        // Save to local storage as backup
        if (enableOfflineSupport) {
          saveToLocalStorage(data);
          pendingDataRef.current = data;
        }

        if (showToasts) {
          toast({
            title: 'Save failed',
            description: error?.message || 'Failed to save changes. They have been backed up locally.',
            variant: 'destructive',
          });
        }
      }
    }
  }, [isOnline, enableOfflineSupport, onSave, onLoad, saveToLocalStorage, clearOfflineBackup, showToasts, toast]);

  // Debounced save function
  const save = useCallback(async (data: T): Promise<void> => {
    setHasUnsavedChanges(true);
    pendingDataRef.current = data;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      performSave(data, false);
    }, debounceMs);
  }, [debounceMs, performSave]);

  // Force save without debouncing
  const forceSave = useCallback(async (data: T): Promise<void> => {
    // Clear any pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    await performSave(data, true);
  }, [performSave]);

  // Resolve conflicts
  const resolveConflict = useCallback(async (useServerVersion: boolean, data?: T): Promise<void> => {
    if (status !== 'conflict') return;

    try {
      if (useServerVersion) {
        // Use server version - just reset status
        setStatus('saved');
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        setConflictData(null);
        
        if (showToasts) {
          toast({
            title: 'Conflict resolved',
            description: 'Using server version of the document.',
          });
        }
      } else {
        // Use local version - force save
        if (data) {
          await performSave(data, true);
          setConflictData(null);
          
          if (showToasts) {
            toast({
              title: 'Conflict resolved',
              description: 'Your local changes have been saved.',
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      if (showToasts) {
        toast({
          title: 'Failed to resolve conflict',
          description: 'Please try again.',
          variant: 'destructive',
        });
      }
    }
  }, [status, performSave, showToasts, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const state: AutoSaveState = {
    status,
    lastSaved,
    hasUnsavedChanges,
    isOnline,
  };

  const actions: AutoSaveActions<T> = {
    save,
    forceSave,
    resolveConflict,
    clearOfflineBackup,
    getOfflineBackup,
  };

  return [state, actions];
}