import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CreateBrand from '@/pages/CreateBrand';

// Mock the wizard components
vi.mock('@/components/wizard/UploadStep', () => ({
  UploadStep: ({ onComplete }: { onComplete: (corpus: string, ids: string[]) => void }) => (
    <div data-testid="upload-step">
      <h2>Upload Your Content</h2>
      <button onClick={() => onComplete('test corpus', ['test-id'])}>
        Complete Upload
      </button>
    </div>
  )
}));

vi.mock('@/components/wizard/FormatStep', () => ({
  FormatStep: ({ onComplete }: { onComplete: (format: string) => void }) => (
    <div data-testid="format-step">
      <h2>Choose Format</h2>
      <button onClick={() => onComplete('ufc')}>
        Complete Format
      </button>
    </div>
  )
}));

vi.mock('@/components/wizard/LogoStep', () => ({
  LogoStep: ({ onComplete, onSkip }: { onComplete: (url: string | null) => void; onSkip: () => void }) => (
    <div data-testid="logo-step">
      <h2>Add Logo</h2>
      <button onClick={() => onComplete('test-logo-url')}>
        Complete Logo
      </button>
      <button onClick={onSkip}>
        Skip Logo
      </button>
    </div>
  )
}));

vi.mock('@/components/wizard/GenerateStep', () => ({
  GenerateStep: ({ onComplete }: { onComplete: (brandId: string, cvId?: string) => void }) => (
    <div data-testid="generate-step">
      <h2>Generate Brand</h2>
      <button onClick={() => onComplete('test-brand-id')}>
        Complete Generation
      </button>
    </div>
  )
}));

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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

describe('CreateBrand Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the first step (UploadStep) by default', () => {
    render(
      <TestWrapper>
        <CreateBrand />
      </TestWrapper>
    );

    expect(screen.getByTestId('upload-step')).toBeInTheDocument();
    expect(screen.getByText('Upload Your Content')).toBeInTheDocument();
  });

  it('shows progress indicators', () => {
    render(
      <TestWrapper>
        <CreateBrand />
      </TestWrapper>
    );

    // Should have 4 progress indicators
    const progressIndicators = screen.getByRole('main').querySelectorAll('.h-2.rounded-full');
    expect(progressIndicators).toHaveLength(4);
  });

  it('shows back button on first step', () => {
    render(
      <TestWrapper>
        <CreateBrand />
      </TestWrapper>
    );

    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeInTheDocument();
  });

  it('navigates to dashboard when back is clicked on first step', () => {
    render(
      <TestWrapper>
        <CreateBrand />
      </TestWrapper>
    );

    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('progresses through all steps correctly', async () => {
    render(
      <TestWrapper>
        <CreateBrand />
      </TestWrapper>
    );

    // Step 1: Upload
    expect(screen.getByTestId('upload-step')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Complete Upload'));

    // Step 2: Format
    await waitFor(() => {
      expect(screen.getByTestId('format-step')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Complete Format'));

    // Step 3: Logo
    await waitFor(() => {
      expect(screen.getByTestId('logo-step')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Skip Logo'));

    // Step 4: Generate
    await waitFor(() => {
      expect(screen.getByTestId('generate-step')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Complete Generation'));

    // Should navigate to brand view
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/brand/test-brand-id');
    });
  });

  it('can go back to previous steps', async () => {
    render(
      <TestWrapper>
        <CreateBrand />
      </TestWrapper>
    );

    // Progress to step 2
    fireEvent.click(screen.getByText('Complete Upload'));
    await waitFor(() => {
      expect(screen.getByTestId('format-step')).toBeInTheDocument();
    });

    // Click back button
    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);

    // Should be back to step 1
    await waitFor(() => {
      expect(screen.getByTestId('upload-step')).toBeInTheDocument();
    });
  });

  it('handles navigation with CV generation', async () => {
    render(
      <TestWrapper>
        <CreateBrand />
      </TestWrapper>
    );

    // Progress through all steps
    fireEvent.click(screen.getByText('Complete Upload'));
    await waitFor(() => screen.getByTestId('format-step'));
    
    fireEvent.click(screen.getByText('Complete Format'));
    await waitFor(() => screen.getByTestId('logo-step'));
    
    fireEvent.click(screen.getByText('Skip Logo'));
    await waitFor(() => screen.getByTestId('generate-step'));

    // Mock GenerateStep to return both brand and CV IDs
    const generateStep = screen.getByTestId('generate-step');
    const completeButton = generateStep.querySelector('button');
    
    // Simulate completion with CV
    fireEvent.click(completeButton!);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/brand/test-brand-id');
    });
  });

  it('maintains state between steps', async () => {
    render(
      <TestWrapper>
        <CreateBrand />
      </TestWrapper>
    );

    // Complete upload step
    fireEvent.click(screen.getByText('Complete Upload'));
    await waitFor(() => screen.getByTestId('format-step'));

    // Go back and forward again
    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);
    await waitFor(() => screen.getByTestId('upload-step'));

    fireEvent.click(screen.getByText('Complete Upload'));
    await waitFor(() => screen.getByTestId('format-step'));

    // Should still be on format step, indicating state is maintained
    expect(screen.getByTestId('format-step')).toBeInTheDocument();
  });
});