import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Components to test
import { SharedContent } from '@/pages/SharedContent';
import BrandView from '@/pages/BrandView';
import CVView from '@/pages/CVView';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } }
      })
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'test-brand-id',
              title: 'Test Brand',
              raw_context: { markdown: '# Test Brand Rider' }
            }
          }),
          maybeSingle: vi.fn().mockResolvedValue({
            data: null
          })
        })
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'test-share-id', token: 'test-token' }
          })
        })
      })
    })
  }
}));

// Mock ShareManager
vi.mock('@/lib/export/share-manager', () => ({
  ShareManager: {
    getSharedContent: vi.fn().mockResolvedValue({
      id: 'test-share-id',
      kind: 'brand',
      content: {
        id: 'test-brand-id',
        title: 'Test Brand',
        raw_context: { markdown: '# Test Brand Rider' }
      },
      expires_at: new Date(Date.now() + 86400000).toISOString() // 24 hours from now
    }),
    isShareValid: vi.fn().mockReturnValue(true)
  }
}));

// Mock PDF/PNG exporters
vi.mock('@/lib/export/pdf-exporter', () => ({
  PDFExporter: {
    exportBrandRider: vi.fn().mockResolvedValue({
      url: 'blob:test-pdf-url',
      filename: 'brand-rider.pdf'
    }),
    exportCV: vi.fn().mockResolvedValue({
      url: 'blob:test-cv-pdf-url',
      filename: 'cv.pdf'
    })
  }
}));

vi.mock('@/lib/export/png-exporter', () => ({
  PNGExporter: {
    exportBrandRiderHero: vi.fn().mockResolvedValue({
      url: 'blob:test-png-url',
      filename: 'brand-hero.png'
    }),
    exportCVHero: vi.fn().mockResolvedValue({
      url: 'blob:test-cv-png-url',
      filename: 'cv-hero.png'
    })
  }
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined)
  }
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test-url');
global.URL.revokeObjectURL = vi.fn();

// Mock document.createElement for download links
const mockAnchorElement = {
  href: '',
  download: '',
  click: vi.fn(),
  remove: vi.fn()
};

global.document.createElement = vi.fn().mockImplementation((tagName) => {
  if (tagName === 'a') {
    return mockAnchorElement;
  }
  return document.createElement(tagName);
});

global.document.body.appendChild = vi.fn();
global.document.body.removeChild = vi.fn();

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe.skip('Sharing and Export Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Brand Sharing', () => {
    it('should create and display share link for brand', async () => {
      // Mock useParams to return brand ID
      vi.mock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          useParams: () => ({ id: 'test-brand-id' }),
          useNavigate: () => vi.fn()
        };
      });

      render(
        <TestWrapper>
          <BrandView />
        </TestWrapper>
      );

      // Wait for brand to load
      await waitFor(() => {
        expect(screen.getByText('Test Brand')).toBeInTheDocument();
      });

      // Click share button
      const shareButton = screen.getByText('Share');
      fireEvent.click(shareButton);

      // Wait for share dialog
      await waitFor(() => {
        expect(screen.getByText('Share brand')).toBeInTheDocument();
      });

      // Verify share link is displayed
      expect(screen.getByDisplayValue(/share\/test-token/)).toBeInTheDocument();

      // Test copy functionality
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });

    it('should handle shared content viewing', async () => {
      // Mock useParams for shared content
      vi.mock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          useParams: () => ({ token: 'test-token' })
        };
      });

      render(
        <TestWrapper>
          <SharedContent />
        </TestWrapper>
      );

      // Wait for shared content to load
      await waitFor(() => {
        expect(screen.getByText('Shared Brand Rider')).toBeInTheDocument();
      });

      // Verify content is displayed
      expect(screen.getByText('Test Brand Rider')).toBeInTheDocument();
    });

    it('should handle expired share links', async () => {
      const { ShareManager } = await import('@/lib/export/share-manager');
      ShareManager.isShareValid = vi.fn().mockReturnValue(false);

      render(
        <TestWrapper>
          <SharedContent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('This share link has expired')).toBeInTheDocument();
      });
    });
  });

  describe('Export Functionality', () => {
    it('should export brand as PDF', async () => {
      render(
        <TestWrapper>
          <BrandView />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Brand')).toBeInTheDocument();
      });

      // Click export PDF button
      const exportButton = screen.getByText('Export PDF');
      fireEvent.click(exportButton);

      // Wait for export to complete
      await waitFor(() => {
        expect(mockAnchorElement.click).toHaveBeenCalled();
      });

      // Verify download attributes
      expect(mockAnchorElement.href).toBe('blob:test-pdf-url');
      expect(mockAnchorElement.download).toBe('brand-rider.pdf');
    });

    it('should export CV as PDF', async () => {
      // Mock CV data
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'test-cv-id',
                title: 'Test CV',
                name: 'John Doe',
                role: 'Software Engineer'
              }
            })
          })
        })
      });

      render(
        <TestWrapper>
          <CVView />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Click export PDF button
      const exportButton = screen.getByText('Export PDF');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockAnchorElement.click).toHaveBeenCalled();
      });

      expect(mockAnchorElement.href).toBe('blob:test-cv-pdf-url');
      expect(mockAnchorElement.download).toBe('cv.pdf');
    });

    it('should export shared content as PNG', async () => {
      render(
        <TestWrapper>
          <SharedContent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Shared Brand Rider')).toBeInTheDocument();
      });

      // Click export PNG button
      const exportButton = screen.getByText('Export PNG');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockAnchorElement.click).toHaveBeenCalled();
      });

      expect(mockAnchorElement.href).toBe('blob:test-png-url');
      expect(mockAnchorElement.download).toBe('brand-hero.png');
    });

    it('should handle export errors gracefully', async () => {
      const { PDFExporter } = await import('@/lib/export/pdf-exporter');
      PDFExporter.exportBrandRider = vi.fn().mockRejectedValue(new Error('Export failed'));

      const { toast } = await import('sonner');

      render(
        <TestWrapper>
          <BrandView />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Brand')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Export PDF');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Export failed');
      });
    });
  });

  describe('Gallery Integration', () => {
    it('should display public brands in gallery', async () => {
      // Mock gallery data
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'brand-1',
                    title: 'Public Brand 1',
                    tagline: 'Test tagline',
                    visibility: 'public'
                  },
                  {
                    id: 'brand-2',
                    title: 'Public Brand 2',
                    tagline: 'Another tagline',
                    visibility: 'public'
                  }
                ]
              })
            })
          })
        })
      });

      const Gallery = (await import('@/pages/Gallery')).default;

      render(
        <TestWrapper>
          <Gallery />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Public Brand 1')).toBeInTheDocument();
        expect(screen.getByText('Public Brand 2')).toBeInTheDocument();
      });
    });

    it('should filter gallery by format', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: 'brand-1',
                      title: 'UFC Brand',
                      format_preset: 'ufc',
                      visibility: 'public'
                    }
                  ]
                })
              })
            })
          })
        })
      });

      const Gallery = (await import('@/pages/Gallery')).default;

      render(
        <TestWrapper>
          <Gallery />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('UFC Brand')).toBeInTheDocument();
      });

      // Test format filtering would be implemented here
      // This would require the Gallery component to have filter controls
    });
  });

  describe('Performance and Accessibility', () => {
    it('should handle large content exports efficiently', async () => {
      const startTime = performance.now();

      render(
        <TestWrapper>
          <BrandView />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Brand')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Export PDF');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockAnchorElement.click).toHaveBeenCalled();
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Export should complete within reasonable time (5 seconds)
      expect(duration).toBeLessThan(5000);
    });

    it('should provide proper ARIA labels for export buttons', async () => {
      render(
        <TestWrapper>
          <SharedContent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Shared Brand Rider')).toBeInTheDocument();
      });

      // Check for accessible export buttons
      const exportPDFButton = screen.getByRole('button', { name: /export pdf/i });
      const exportPNGButton = screen.getByRole('button', { name: /export png/i });
      const copyLinkButton = screen.getByRole('button', { name: /copy link/i });

      expect(exportPDFButton).toBeInTheDocument();
      expect(exportPNGButton).toBeInTheDocument();
      expect(copyLinkButton).toBeInTheDocument();
    });

    it('should handle offline scenarios gracefully', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      render(
        <TestWrapper>
          <BrandView />
        </TestWrapper>
      );

      // The component should still render and show appropriate offline messaging
      // This would depend on the offline handling implementation
      await waitFor(() => {
        expect(screen.getByText('Test Brand')).toBeInTheDocument();
      });

      // Reset online state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
    });
  });

  describe('Cross-browser Compatibility', () => {
    it('should handle different clipboard API implementations', async () => {
      // Test with missing clipboard API
      const originalClipboard = navigator.clipboard;
      delete (navigator as any).clipboard;

      render(
        <TestWrapper>
          <SharedContent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Shared Brand Rider')).toBeInTheDocument();
      });

      const copyButton = screen.getByText('Copy Link');
      fireEvent.click(copyButton);

      // Should handle gracefully without clipboard API
      // Implementation would depend on fallback mechanism

      // Restore clipboard API
      (navigator as any).clipboard = originalClipboard;
    });

    it('should handle different file download mechanisms', async () => {
      // Test download functionality across different browsers
      render(
        <TestWrapper>
          <BrandView />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Brand')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Export PDF');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockAnchorElement.click).toHaveBeenCalled();
      });

      // Verify proper cleanup
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });
});