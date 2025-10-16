import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { forwardRef } from 'react';
import BrandEditor from '@/pages/BrandEditor';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(() => Promise.resolve({
        data: {
          id: 'test-brand-id',
          title: 'Test Brand',
          tagline: 'Test Tagline',
          bio: 'Test Bio',
          format_preset: 'ufc',
          visibility: 'private',
          strengths: ['Strong', 'Fast'],
          weaknesses: ['Needs work'],
          signature_phrases: ['Test phrase'],
          logo_url: 'test-logo.jpg',
          avatar_url: 'test-avatar.jpg',
          raw_context: { extractedText: 'test content' }
        },
        error: null
      })),
      update: vi.fn().mockReturnThis()
    })),
    functions: {
      invoke: vi.fn(() => Promise.resolve({
        data: { markdown: '# Test Brand\n\nTest content' },
        error: null
      }))
    }
  }
}));

// Mock BrandTemplateRenderer
vi.mock('@/components/brand/BrandTemplateRenderer', () => ({
  BrandTemplateRenderer: forwardRef<HTMLDivElement, { brand: any; markdown: string }>(({ brand, markdown }, ref) => (
    <div ref={ref} data-testid="brand-template-renderer">
      <h1>{brand.title}</h1>
      <p>{brand.tagline}</p>
      <div>{markdown}</div>
    </div>
  ))
}));

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'test-brand-id' })
  };
});

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('BrandEditor Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(
      <TestWrapper>
        <BrandEditor />
      </TestWrapper>
    );

    expect(screen.getByText('Loading brand editor...')).toBeInTheDocument();
  });

  it('renders brand editor after loading', async () => {
    render(
      <TestWrapper>
        <BrandEditor />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Edit Brand')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('Test Brand')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Tagline')).toBeInTheDocument();
  });

  it('shows correct tabs', async () => {
    render(
      <TestWrapper>
        <BrandEditor />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Edit Brand')).toBeInTheDocument();
    });

    expect(screen.getByRole('tab', { name: /content/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /style/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /voice/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /settings/i })).toBeInTheDocument();
  });

  it('allows editing basic information', async () => {
    render(
      <TestWrapper>
        <BrandEditor />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Brand')).toBeInTheDocument();
    });

    const titleInput = screen.getByDisplayValue('Test Brand');
    fireEvent.change(titleInput, { target: { value: 'Updated Brand' } });

    expect(titleInput).toHaveValue('Updated Brand');
  });

  it('allows adding and removing strengths', async () => {
    render(
      <TestWrapper>
        <BrandEditor />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Strong')).toBeInTheDocument();
    });

    // Should show existing strengths
    expect(screen.getByText('Strong')).toBeInTheDocument();
    expect(screen.getByText('Fast')).toBeInTheDocument();

    // Add new strength
    const strengthInput = screen.getByPlaceholderText('Add a strength');
    fireEvent.change(strengthInput, { target: { value: 'New Strength' } });
    
    const addButton = strengthInput.parentElement?.querySelector('button');
    fireEvent.click(addButton!);

    expect(strengthInput).toHaveValue('');
  });

  it('switches between tabs correctly', async () => {
    render(
      <TestWrapper>
        <BrandEditor />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Edit Brand')).toBeInTheDocument();
    });

    // Switch to Voice tab
    fireEvent.click(screen.getByRole('tab', { name: /voice/i }));
    expect(screen.getByText('Signature Phrases')).toBeInTheDocument();

    // Switch to Settings tab
    fireEvent.click(screen.getByRole('tab', { name: /settings/i }));
    expect(screen.getByText('Presentation Settings')).toBeInTheDocument();
  });

  it('shows live preview', async () => {
    render(
      <TestWrapper>
        <BrandEditor />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('brand-template-renderer')).toBeInTheDocument();
    });

    expect(screen.getByText('Live Preview')).toBeInTheDocument();
  });

  it('handles save functionality', async () => {
    render(
      <TestWrapper>
        <BrandEditor />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      const { supabase } = require('@/integrations/supabase/client');
      expect(supabase.from).toHaveBeenCalledWith('brands');
    });
  });

  it('handles preview navigation', async () => {
    render(
      <TestWrapper>
        <BrandEditor />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Preview')).toBeInTheDocument();
    });

    const previewButton = screen.getByText('Preview');
    fireEvent.click(previewButton);

    expect(mockNavigate).toHaveBeenCalledWith('/brand/test-brand-id');
  });

  it('handles back navigation', async () => {
    render(
      <TestWrapper>
        <BrandEditor />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Back to Brand')).toBeInTheDocument();
    });

    const backButton = screen.getByText('Back to Brand');
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/brand/test-brand-id');
  });

  it('shows visibility status correctly', async () => {
    render(
      <TestWrapper>
        <BrandEditor />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Private')).toBeInTheDocument();
    });

    // Should show private status
    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  it('handles format preset changes', async () => {
    render(
      <TestWrapper>
        <BrandEditor />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    // Switch to settings tab
    fireEvent.click(screen.getByRole('tab', { name: /settings/i }));

    // Should show format preset selector
    expect(screen.getByText('Format Preset')).toBeInTheDocument();
  });

  it('handles error states gracefully', async () => {
    // Mock error response
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(() => Promise.resolve({
        data: null,
        error: { message: 'Brand not found' }
      })),
      update: vi.fn().mockReturnThis()
    });

    render(
      <TestWrapper>
        <BrandEditor />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});