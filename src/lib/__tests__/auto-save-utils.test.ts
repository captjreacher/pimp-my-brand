import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  OfflineBackupManager,
  DataSyncManager,
  createDebouncer,
  NetworkStatusManager,
  formatFileSize,
  formatRelativeTime,
} from '../auto-save-utils';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('OfflineBackupManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('save and load', () => {
    it('should save and load backup data', () => {
      const testData = { name: 'test', value: 123 };
      
      // Mock successful save
      mockLocalStorage.setItem.mockReturnValue(undefined);
      mockLocalStorage.getItem.mockReturnValue(null); // For index
      
      const result = OfflineBackupManager.save('test-key', testData);
      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'autosave_backup_test-key',
        expect.stringContaining('"name":"test"')
      );

      // Mock load
      const mockBackup = {
        data: testData,
        timestamp: new Date().toISOString(),
        version: Date.now(),
        key: 'test-key',
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockBackup));

      const loaded = OfflineBackupManager.load('test-key');
      expect(loaded).toEqual(mockBackup);
    });

    it('should handle save errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const result = OfflineBackupManager.save('test-key', { data: 'test' });
      expect(result).toBe(false);
    });

    it('should handle load errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = OfflineBackupManager.load('test-key');
      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove backup data', () => {
      mockLocalStorage.getItem.mockReturnValue('["test-key"]'); // Mock index
      
      const result = OfflineBackupManager.remove('test-key');
      expect(result).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('autosave_backup_test-key');
    });
  });

  describe('getAllKeys', () => {
    it('should return all backup keys', () => {
      const keys = ['key1', 'key2', 'key3'];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(keys));

      const result = OfflineBackupManager.getAllKeys();
      expect(result).toEqual(keys);
    });

    it('should return empty array when no index exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = OfflineBackupManager.getAllKeys();
      expect(result).toEqual([]);
    });
  });

  describe('getAllBackups', () => {
    it('should return all backups sorted by timestamp', () => {
      const keys = ['key1', 'key2'];
      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(keys)) // Index call
        .mockReturnValueOnce(JSON.stringify({
          data: 'data1',
          timestamp: '2023-01-01T00:00:00Z',
          version: 1,
          key: 'key1',
        }))
        .mockReturnValueOnce(JSON.stringify({
          data: 'data2',
          timestamp: '2023-01-02T00:00:00Z',
          version: 2,
          key: 'key2',
        }));

      const result = OfflineBackupManager.getAllBackups();
      expect(result).toHaveLength(2);
      expect(result[0].key).toBe('key2'); // Newer first
      expect(result[1].key).toBe('key1');
    });
  });

  describe('clearAll', () => {
    it('should clear all backups', () => {
      const keys = ['key1', 'key2'];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(keys));

      const result = OfflineBackupManager.clearAll();
      expect(result).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('autosave_backup_key1');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('autosave_backup_key2');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('autosave_backup_index');
    });
  });

  describe('getStorageInfo', () => {
    it('should return storage information', () => {
      const keys = ['key1'];
      const backup = {
        data: 'test data',
        timestamp: '2023-01-01T00:00:00Z',
        version: 1,
        key: 'key1',
      };
      
      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(keys))
        .mockReturnValueOnce(JSON.stringify(backup));

      const info = OfflineBackupManager.getStorageInfo();
      expect(info.totalBackups).toBe(1);
      expect(info.estimatedSize).toBeGreaterThan(0);
      expect(info.oldestBackup).toEqual(new Date('2023-01-01T00:00:00Z'));
      expect(info.newestBackup).toEqual(new Date('2023-01-01T00:00:00Z'));
    });
  });

  describe('cleanup', () => {
    it('should remove old backups', () => {
      const keys = ['doc1_v1', 'doc1_v2', 'doc1_v3', 'doc2_v1'];
      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(keys)) // getAllKeys
        .mockReturnValueOnce(JSON.stringify({ // doc1_v1
          timestamp: '2023-01-01T00:00:00Z',
        }))
        .mockReturnValueOnce(JSON.stringify({ // doc1_v2
          timestamp: '2023-01-02T00:00:00Z',
        }))
        .mockReturnValueOnce(JSON.stringify({ // doc1_v3
          timestamp: '2023-01-03T00:00:00Z',
        }))
        .mockReturnValueOnce(JSON.stringify({ // doc2_v1
          timestamp: '2023-01-01T00:00:00Z',
        }));

      const removed = OfflineBackupManager.cleanup(2);
      expect(removed).toBeGreaterThan(0);
    });
  });
});

describe('DataSyncManager', () => {
  describe('syncOfflineChanges', () => {
    it('should sync offline changes successfully', async () => {
      const mockSyncFn = vi.fn().mockResolvedValue(undefined);
      const backups = [
        {
          data: 'test1',
          timestamp: '2023-01-01T00:00:00Z',
          version: 1,
          key: 'key1',
        },
      ];

      // Mock OfflineBackupManager
      vi.spyOn(OfflineBackupManager, 'getAllBackups').mockReturnValue(backups);
      vi.spyOn(OfflineBackupManager, 'remove').mockReturnValue(true);

      const result = await DataSyncManager.syncOfflineChanges(mockSyncFn);
      
      expect(result.success).toBe(true);
      expect(mockSyncFn).toHaveBeenCalledWith('key1', 'test1');
      expect(OfflineBackupManager.remove).toHaveBeenCalledWith('key1');
    });

    it('should handle sync errors', async () => {
      const mockSyncFn = vi.fn().mockRejectedValue(new Error('Sync failed'));
      const backups = [
        {
          data: 'test1',
          timestamp: '2023-01-01T00:00:00Z',
          version: 1,
          key: 'key1',
        },
      ];

      vi.spyOn(OfflineBackupManager, 'getAllBackups').mockReturnValue(backups);

      const result = await DataSyncManager.syncOfflineChanges(mockSyncFn);
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors?.[0].key).toBe('key1');
    });

    it('should handle conflicts', async () => {
      const conflictError = new Error('conflict');
      const mockSyncFn = vi.fn().mockRejectedValue(conflictError);
      const mockLoadFn = vi.fn().mockResolvedValue('server-data');
      const backups = [
        {
          data: 'local-data',
          timestamp: '2023-01-01T00:00:00Z',
          version: 1,
          key: 'key1',
        },
      ];

      vi.spyOn(OfflineBackupManager, 'getAllBackups').mockReturnValue(backups);

      const result = await DataSyncManager.syncOfflineChanges(mockSyncFn, mockLoadFn);
      
      expect(result.success).toBe(false);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts?.[0]).toEqual({
        key: 'key1',
        local: 'local-data',
        server: 'server-data',
      });
    });
  });

  describe('checkForConflicts', () => {
    it('should detect conflicts', async () => {
      const mockLoadLocal = vi.fn()
        .mockReturnValueOnce('local-data1')
        .mockReturnValueOnce(null); // No local data for key2
      const mockLoadServer = vi.fn().mockResolvedValue('server-data1');

      const conflicts = await DataSyncManager.checkForConflicts(
        ['key1', 'key2'],
        mockLoadLocal,
        mockLoadServer
      );

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]).toEqual({
        key: 'key1',
        local: 'local-data1',
        server: 'server-data1',
      });
    });

    it('should use custom compare function', async () => {
      const mockLoadLocal = vi.fn().mockReturnValue({ id: 1, name: 'test' });
      const mockLoadServer = vi.fn().mockResolvedValue({ id: 1, name: 'test', updated: true });
      const mockCompareFn = vi.fn().mockReturnValue(true); // No conflict

      const conflicts = await DataSyncManager.checkForConflicts(
        ['key1'],
        mockLoadLocal,
        mockLoadServer,
        mockCompareFn
      );

      expect(conflicts).toHaveLength(0);
      expect(mockCompareFn).toHaveBeenCalled();
    });
  });
});

describe('createDebouncer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce function calls', () => {
    const mockFn = vi.fn();
    const debouncedFn = createDebouncer(mockFn, 100);

    debouncedFn('arg1');
    debouncedFn('arg2');
    debouncedFn('arg3');

    expect(mockFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('arg3');
  });

  it('should cancel debounced calls', () => {
    const mockFn = vi.fn();
    const debouncedFn = createDebouncer(mockFn, 100);

    debouncedFn('arg1');
    debouncedFn.cancel();

    vi.advanceTimersByTime(100);

    expect(mockFn).not.toHaveBeenCalled();
  });

  it('should flush debounced calls immediately', () => {
    const mockFn = vi.fn();
    const debouncedFn = createDebouncer(mockFn, 100);

    debouncedFn('arg1');
    debouncedFn.flush();

    expect(mockFn).toHaveBeenCalledWith('arg1');
  });
});

describe('NetworkStatusManager', () => {
  it('should return current online status', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    expect(NetworkStatusManager.isOnline()).toBe(true);

    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    expect(NetworkStatusManager.isOnline()).toBe(false);
  });

  it('should add and remove listeners', () => {
    const mockCallback = vi.fn();
    const removeListener = NetworkStatusManager.addListener(mockCallback);

    expect(typeof removeListener).toBe('function');
    
    // Test removal
    removeListener();
    // Should not throw error
  });

  it('should test connectivity', async () => {
    // Mock successful fetch
    global.fetch = vi.fn().mockResolvedValue({ ok: true });

    const result = await NetworkStatusManager.testConnectivity();
    expect(result).toBe(true);

    // Mock failed fetch
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result2 = await NetworkStatusManager.testConnectivity();
    expect(result2).toBe(false);
  });
});

describe('formatFileSize', () => {
  it('should format file sizes correctly', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });
});

describe('formatRelativeTime', () => {
  it('should format relative times correctly', () => {
    const now = new Date();
    
    expect(formatRelativeTime(new Date(now.getTime() - 30 * 1000))).toBe('just now');
    expect(formatRelativeTime(new Date(now.getTime() - 5 * 60 * 1000))).toBe('5m ago');
    expect(formatRelativeTime(new Date(now.getTime() - 2 * 60 * 60 * 1000))).toBe('2h ago');
    expect(formatRelativeTime(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000))).toBe('3d ago');
    
    const oldDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(oldDate)).toBe(oldDate.toLocaleDateString());
  });
});