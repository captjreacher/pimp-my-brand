import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAutoSave } from '../use-auto-save';

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

// Mock navigator.onLine
const mockNavigator = {
  onLine: true,
};
Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true,
});

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('useAutoSave', () => {
  const mockOnSave = vi.fn();
  const mockOnLoad = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockNavigator.onLine = true;
  });

  it('should initialize with idle status', () => {
    const { result } = renderHook(() =>
      useAutoSave({
        onSave: mockOnSave,
        localStorageKey: 'test-key',
      })
    );

    const [state] = result.current;
    expect(state.status).toBe('idle');
    expect(state.hasUnsavedChanges).toBe(false);
    expect(state.isOnline).toBe(true);
    expect(state.lastSaved).toBeNull();
  });

  it('should debounce save operations', async () => {
    const { result } = renderHook(() =>
      useAutoSave({
        onSave: mockOnSave,
        debounceMs: 100,
        localStorageKey: 'test-key',
      })
    );

    const [, actions] = result.current;

    // Trigger multiple saves quickly
    act(() => {
      actions.save('data1');
      actions.save('data2');
      actions.save('data3');
    });

    // Should not have called onSave yet
    expect(mockOnSave).not.toHaveBeenCalled();

    // Wait for debounce
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });

    // Should have called with the last data
    expect(mockOnSave).toHaveBeenCalledWith('data3');
  });

  it('should force save without debouncing', async () => {
    mockOnSave.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useAutoSave({
        onSave: mockOnSave,
        debounceMs: 1000,
        localStorageKey: 'test-key',
      })
    );

    const [, actions] = result.current;

    await act(async () => {
      await actions.forceSave('immediate-data');
    });

    expect(mockOnSave).toHaveBeenCalledWith('immediate-data');
  });

  it('should handle save success', async () => {
    mockOnSave.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useAutoSave({
        onSave: mockOnSave,
        debounceMs: 50,
        localStorageKey: 'test-key',
      })
    );

    const [, actions] = result.current;

    act(() => {
      actions.save('test-data');
    });

    await waitFor(() => {
      expect(result.current[0].status).toBe('saved');
    });

    expect(result.current[0].hasUnsavedChanges).toBe(false);
    expect(result.current[0].lastSaved).toBeInstanceOf(Date);
  });

  it('should handle save errors', async () => {
    const error = new Error('Save failed');
    mockOnSave.mockRejectedValue(error);

    const { result } = renderHook(() =>
      useAutoSave({
        onSave: mockOnSave,
        debounceMs: 50,
        localStorageKey: 'test-key',
        enableOfflineSupport: true,
      })
    );

    const [, actions] = result.current;

    act(() => {
      actions.save('test-data');
    });

    await waitFor(() => {
      expect(result.current[0].status).toBe('error');
    });

    expect(result.current[0].hasUnsavedChanges).toBe(true);
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
  });

  it('should handle conflict errors', async () => {
    const conflictError = new Error('conflict detected');
    mockOnSave.mockRejectedValue(conflictError);
    mockOnLoad.mockResolvedValue('server-data');

    const { result } = renderHook(() =>
      useAutoSave({
        onSave: mockOnSave,
        onLoad: mockOnLoad,
        debounceMs: 50,
        localStorageKey: 'test-key',
      })
    );

    const [, actions] = result.current;

    act(() => {
      actions.save('local-data');
    });

    await waitFor(() => {
      expect(result.current[0].status).toBe('conflict');
    });

    expect(mockOnLoad).toHaveBeenCalled();
  });

  it('should resolve conflicts', async () => {
    const { result } = renderHook(() =>
      useAutoSave({
        onSave: mockOnSave,
        onLoad: mockOnLoad,
        localStorageKey: 'test-key',
      })
    );

    // Simulate conflict state
    act(() => {
      result.current[0].status = 'conflict';
    });

    const [, actions] = result.current;

    await act(async () => {
      await actions.resolveConflict(true); // Use server version
    });

    // Should reset to saved state
    expect(result.current[0].status).toBe('saved');
    expect(result.current[0].hasUnsavedChanges).toBe(false);
  });

  it('should handle offline mode', async () => {
    // Simulate offline
    mockNavigator.onLine = false;

    const { result } = renderHook(() =>
      useAutoSave({
        onSave: mockOnSave,
        debounceMs: 50,
        localStorageKey: 'test-key',
        enableOfflineSupport: true,
      })
    );

    const [, actions] = result.current;

    act(() => {
      actions.save('offline-data');
    });

    await waitFor(() => {
      expect(result.current[0].status).toBe('offline');
    });

    expect(result.current[0].hasUnsavedChanges).toBe(true);
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should sync when coming back online', async () => {
    mockOnSave.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useAutoSave({
        onSave: mockOnSave,
        debounceMs: 50,
        localStorageKey: 'test-key',
        enableOfflineSupport: true,
      })
    );

    // Start offline
    mockNavigator.onLine = false;
    
    const [, actions] = result.current;

    act(() => {
      actions.save('offline-data');
    });

    await waitFor(() => {
      expect(result.current[0].status).toBe('offline');
    });

    // Come back online
    mockNavigator.onLine = true;
    
    // Simulate online event
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('offline-data');
    });
  });

  it('should manage offline backup', () => {
    const { result } = renderHook(() =>
      useAutoSave({
        onSave: mockOnSave,
        localStorageKey: 'test-key',
        enableOfflineSupport: true,
      })
    );

    const [, actions] = result.current;

    // Test getting offline backup when none exists
    expect(actions.getOfflineBackup()).toBeNull();

    // Mock localStorage to return backup data
    mockLocalStorage.getItem.mockReturnValue(
      JSON.stringify({
        data: 'backup-data',
        timestamp: new Date().toISOString(),
        version: Date.now(),
      })
    );

    expect(actions.getOfflineBackup()).toBe('backup-data');

    // Test clearing backup
    actions.clearOfflineBackup();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key');
  });

  it('should handle localStorage errors gracefully', () => {
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('Storage quota exceeded');
    });

    const { result } = renderHook(() =>
      useAutoSave({
        onSave: mockOnSave,
        localStorageKey: 'test-key',
        enableOfflineSupport: true,
      })
    );

    const [, actions] = result.current;

    // Should not throw error
    expect(() => {
      actions.save('test-data');
    }).not.toThrow();
  });

  it('should cleanup on unmount', () => {
    const { result, unmount } = renderHook(() =>
      useAutoSave({
        onSave: mockOnSave,
        debounceMs: 1000,
        localStorageKey: 'test-key',
      })
    );

    const [, actions] = result.current;

    // Start a save operation
    act(() => {
      actions.save('test-data');
    });

    // Unmount before debounce completes
    unmount();

    // Should not call onSave after unmount
    setTimeout(() => {
      expect(mockOnSave).not.toHaveBeenCalled();
    }, 1100);
  });
});