import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FormatStep } from '../FormatStep';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';

// Mock the subscription context
vi.mock('@/contexts/SubscriptionContext', () => ({
  SubscriptionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSubscription: () => ({
    tier: 'free',
    loading: false,
    trialActive: false,
    subscriptionEnd: null,
    checkSubscription: vi.fn()
  })
}));

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      })
    },
    functions: {
      invoke: vi.fn()
    }
  }
}));

describe('FormatStep', () => {
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    mockOnComplete.mockClear();
  });

  it('renders format selection cards', () => {
    render(
      <SubscriptionProvider>
        <FormatStep onComplete={mockOnComplete} />
      </SubscriptionProvider>
    );

    // Check if main heading is present
    expect(screen.getByText('Choose Your Format')).toBeInTheDocument();
    
    // Check if some format cards are present
    expect(screen.getByText('UFC Announcer')).toBeInTheDocument();
    expect(screen.getByText('Military')).toBeInTheDocument();
    expect(screen.getByText('Team Captain')).toBeInTheDocument();
  });

  it('shows live preview panel', () => {
    render(
      <SubscriptionProvider>
        <FormatStep onComplete={mockOnComplete} />
      </SubscriptionProvider>
    );

    expect(screen.getByText('Live Preview')).toBeInTheDocument();
    expect(screen.getByText('Original')).toBeInTheDocument();
    expect(screen.getByText('Key Characteristics')).toBeInTheDocument();
  });

  it('allows format selection', () => {
    render(
      <SubscriptionProvider>
        <FormatStep onComplete={mockOnComplete} />
      </SubscriptionProvider>
    );

    // Find and click a format card (UFC)
    const ufcCard = screen.getByText('UFC Announcer').closest('button');
    expect(ufcCard).toBeInTheDocument();
    
    if (ufcCard) {
      fireEvent.click(ufcCard);
    }

    // Check if continue button is present
    const continueButton = screen.getByText(/Continue with/);
    expect(continueButton).toBeInTheDocument();
  });

  it('calls onComplete when continue button is clicked', () => {
    render(
      <SubscriptionProvider>
        <FormatStep onComplete={mockOnComplete} />
      </SubscriptionProvider>
    );

    // Click continue button (should default to custom format)
    const continueButton = screen.getByText(/Continue with/);
    fireEvent.click(continueButton);

    expect(mockOnComplete).toHaveBeenCalledWith('custom');
  });

  it('updates live preview when hovering over formats', () => {
    render(
      <SubscriptionProvider>
        <FormatStep onComplete={mockOnComplete} />
      </SubscriptionProvider>
    );

    // Find UFC format card
    const ufcCard = screen.getByText('UFC Announcer').closest('button');
    
    if (ufcCard) {
      // Hover over the card
      fireEvent.mouseEnter(ufcCard);
      
      // Check if live preview updates (should show UFC style transformation)
      expect(screen.getByText('UFC Announcer Style')).toBeInTheDocument();
    }
  });
});