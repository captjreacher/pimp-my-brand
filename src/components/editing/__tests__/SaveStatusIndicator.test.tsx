import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveStatusIndicator, CompactSaveStatusIndicator } from '../SaveStatusIndicator';
import { AutoSaveState } from '@/hooks/use-auto-save';

describe('SaveStatusIndicator', () => {
  const mockOnForceSave = vi.fn();
  const mockOnResolveConflict = vi.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockState = (overrides: Partial<AutoSaveState> = {}): AutoSaveState => ({
    status: 'idle',
    lastSaved: null,
    hasUnsavedChanges: false,
    isOnline: true,
    ...overrides,
  });

  describe('status display', () => {
    it('should display idle status', () => {
      const state = createMockState({ status: 'idle' });
      render(<SaveStatusIndicator state={state} />);
      
      expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    it('should display saving status with spinner', () => {
      const state = createMockState({ status: 'saving' });
      render(<SaveStatusIndicator state={state} />);
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      // Check for spinner animation class
      const icon = screen.getByText('Saving...').previousElementSibling;
      expect(icon).toHaveClass('animate-spin');
    });

    it('should display saved status', () => {
      const state = createMockState({ 
        status: 'saved',
        lastSaved: new Date('2023-01-01T12:00:00Z'),
      });
      render(<SaveStatusIndicator state={state} />);
      
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    it('should display error status', () => {
      const state = createMockState({ 
        status: 'error',
        hasUnsavedChanges: true,
      });
      render(<SaveStatusIndicator state={state} />);
      
      expect(screen.getByText('Save failed')).toBeInTheDocument();
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });

    it('should display conflict status', () => {
      const state = createMockState({ status: 'conflict' });
      render(<SaveStatusIndicator state={state} />);
      
      expect(screen.getByText('Conflict')).toBeInTheDocument();
    });

    it('should display offline status', () => {
      const state = createMockState({ 
        status: 'offline',
        isOnline: false,
      });
      render(<SaveStatusIndicator state={state} />);
      
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });
  });

  describe('unsaved changes indicator', () => {
    it('should show unsaved changes badge when there are unsaved changes', () => {
      const state = createMockState({ 
        status: 'idle',
        hasUnsavedChanges: true,
      });
      render(<SaveStatusIndicator state={state} />);
      
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });

    it('should not show unsaved changes badge when saving', () => {
      const state = createMockState({ 
        status: 'saving',
        hasUnsavedChanges: true,
      });
      render(<SaveStatusIndicator state={state} />);
      
      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    });
  });

  describe('last saved time', () => {
    it('should display last saved time', () => {
      const lastSaved = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      const state = createMockState({ 
        status: 'saved',
        lastSaved,
      });
      render(<SaveStatusIndicator state={state} showLastSaved={true} />);
      
      expect(screen.getByText(/Saved \d+m ago/)).toBeInTheDocument();
    });

    it('should not display last saved time when showLastSaved is false', () => {
      const lastSaved = new Date(Date.now() - 5 * 60 * 1000);
      const state = createMockState({ 
        status: 'saved',
        lastSaved,
      });
      render(<SaveStatusIndicator state={state} showLastSaved={false} />);
      
      expect(screen.queryByText(/Saved \d+m ago/)).not.toBeInTheDocument();
    });

    it('should display "just now" for recent saves', () => {
      const lastSaved = new Date(Date.now() - 30 * 1000); // 30 seconds ago
      const state = createMockState({ 
        status: 'saved',
        lastSaved,
      });
      render(<SaveStatusIndicator state={state} />);
      
      expect(screen.getByText('Saved just now')).toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    it('should show retry button for error status', () => {
      const state = createMockState({ status: 'error' });
      render(
        <SaveStatusIndicator 
          state={state} 
          onForceSave={mockOnForceSave}
        />
      );
      
      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();
      
      fireEvent.click(retryButton);
      expect(mockOnForceSave).toHaveBeenCalledTimes(1);
    });

    it('should show retry button for offline status', () => {
      const state = createMockState({ 
        status: 'offline',
        isOnline: false,
      });
      render(
        <SaveStatusIndicator 
          state={state} 
          onForceSave={mockOnForceSave}
        />
      );
      
      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();
    });

    it('should show resolve button for conflict status', () => {
      const state = createMockState({ status: 'conflict' });
      render(
        <SaveStatusIndicator 
          state={state} 
          onResolveConflict={mockOnResolveConflict}
        />
      );
      
      const resolveButton = screen.getByText('Resolve');
      expect(resolveButton).toBeInTheDocument();
      
      fireEvent.click(resolveButton);
      expect(mockOnResolveConflict).toHaveBeenCalledTimes(1);
    });

    it('should not show action buttons when handlers are not provided', () => {
      const state = createMockState({ status: 'error' });
      render(<SaveStatusIndicator state={state} />);
      
      expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    });
  });

  describe('offline indicator', () => {
    it('should show offline badge when not online', () => {
      const state = createMockState({ 
        status: 'idle',
        isOnline: false,
      });
      render(<SaveStatusIndicator state={state} />);
      
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });

    it('should not show offline badge when online', () => {
      const state = createMockState({ 
        status: 'idle',
        isOnline: true,
      });
      render(<SaveStatusIndicator state={state} />);
      
      // Should only have one "Ready" text, not "Offline"
      expect(screen.getAllByText(/Ready|Offline/)).toHaveLength(1);
      expect(screen.getByText('Ready')).toBeInTheDocument();
    });
  });
});

describe('CompactSaveStatusIndicator', () => {
  const mockOnForceSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockState = (overrides: Partial<AutoSaveState> = {}): AutoSaveState => ({
    status: 'idle',
    lastSaved: null,
    hasUnsavedChanges: false,
    isOnline: true,
    ...overrides,
  });

  it('should display status in compact format', () => {
    const state = createMockState({ status: 'saved' });
    render(<CompactSaveStatusIndicator state={state} />);
    
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('should show unsaved changes indicator dot', () => {
    const state = createMockState({ 
      status: 'idle',
      hasUnsavedChanges: true,
    });
    render(<CompactSaveStatusIndicator state={state} />);
    
    // Check for the amber dot (by title attribute)
    const dot = screen.getByTitle('Unsaved changes');
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveClass('bg-amber-400');
  });

  it('should show compact retry button for errors', () => {
    const state = createMockState({ status: 'error' });
    render(
      <CompactSaveStatusIndicator 
        state={state} 
        onForceSave={mockOnForceSave}
      />
    );
    
    const retryButton = screen.getByTitle('Retry save');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(mockOnForceSave).toHaveBeenCalledTimes(1);
  });

  it('should apply appropriate background colors for different statuses', () => {
    const { rerender } = render(
      <CompactSaveStatusIndicator 
        state={createMockState({ status: 'error' })} 
      />
    );
    
    expect(screen.getByText('Save failed').parentElement).toHaveClass('bg-red-50');

    rerender(
      <CompactSaveStatusIndicator 
        state={createMockState({ status: 'saved' })} 
      />
    );
    
    expect(screen.getByText('Saved').parentElement).toHaveClass('bg-green-50');

    rerender(
      <CompactSaveStatusIndicator 
        state={createMockState({ status: 'saving' })} 
      />
    );
    
    expect(screen.getByText('Saving...').parentElement).toHaveClass('bg-blue-50');
  });

  it('should show spinner for saving status', () => {
    const state = createMockState({ status: 'saving' });
    render(<CompactSaveStatusIndicator state={state} />);
    
    const icon = screen.getByText('Saving...').previousElementSibling;
    expect(icon).toHaveClass('animate-spin');
  });
});