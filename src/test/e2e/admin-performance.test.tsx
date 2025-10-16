import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminContext } from '@/contexts/AdminContext';
import { AnalyticsPage } from '@/pages/admin/AnalyticsPage';
import { supabase } from '@/integrations/supabase/client';
import type { AdminUser, AdminPermissions } from '@/lib/admin/types';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

const mockAdminUser: AdminUser = {
  id: 'admin-user-1',
  email: 'admin@test.com',
  app_role: 'admin',
  admin_permissions: ['view_analytics'],
  last_admin_login: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockAdminPermissions: AdminPermissions = {
  canManageUsers: true,
  canModerateContent: true,
  canManageBilling: true,
  canViewAnalytics: true,
  canManageSystem: true,
};

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
        <AdminContext.Provider
          value={{
            user: mockAdminUser,
            permissions: mockAdminPermissions,
            isLoading: false,
            error: null,
            refreshUser: vi.fn(),
          }}
        >
          {children}
        </AdminContext.Provider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Admin Performance and Load Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dashboard Performance', () => {
    it('should load dashboard within acceptable time limits', async () => {
      const startTime = performance.now();

      // Mock analytics data with large dataset
      const mockLargeDataset = {
        systemMetrics: {
          active_users_24h: 10000,
          total_content_generated: 50000,
          api_requests_24h: 1000000,
          storage_usage: 100.5,
          ai_api_costs: 5000.75,
        },
        performanceMetrics: {
          avg_response_time: 150,
          error_rate: 0.01,
          uptime_percentage: 99.95,
          database_performance: {
            avg_query_time: 25,
            slow_queries: 5,
            connection_pool_usage: 0.85,
          },
        },
        userAnalytics: Array.from({ length: 1000 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          active_users: Math.floor(Math.random() * 1000) + 500,
          new_users: Math.floor(Math.random() * 100) + 20,
          content_generated: Math.floor(Math.random() * 500) + 100,
        })),
      };

      (supabase.rpc as any).mockResolvedValue({
        data: mockLargeDataset,
        error: null,
      });

      render(
        <TestWrapper>
          <AnalyticsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('10,000')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Dashboard should load within 2 seconds even with large datasets
      expect(loadTime).toBeLessThan(2000);
    });

    it('should handle concurrent admin users efficiently', async () => {
      // Simulate multiple admin sessions
      const concurrentRequests = Array.from({ length: 10 }, (_, i) => {
        const mockRpc = vi.fn().mockResolvedValue({
          data: {
            systemMetrics: {
              active_users_24h: 1000 + i * 100,
              total_content_generated: 5000 + i * 500,
              api_requests_24h: 50000 + i * 5000,
              storage_usage: 10.5 + i,
              ai_api_costs: 500.75 + i * 50,
            },
          },
          error: null,
        });

        (supabase.rpc as any).mockImplementation(mockRpc);

        return render(
          <TestWrapper>
            <AnalyticsPage />
          </TestWrapper>
        );
      });

      // All requests should complete successfully
      await Promise.all(
        concurrentRequests.map(async (_, index) => {
          await waitFor(() => {
            const expectedValue = (1000 + index * 100).toLocaleString();
            expect(screen.getAllByText(expectedValue)).toHaveLength(1);
          });
        })
      );
    });

    it('should maintain performance under high data volume', async () => {
      // Mock high-volume data scenario
      const highVolumeData = {
        systemMetrics: {
          active_users_24h: 50000,
          total_content_generated: 1000000,
          api_requests_24h: 10000000,
          storage_usage: 1000.5,
          ai_api_costs: 25000.75,
        },
        auditLogs: Array.from({ length: 10000 }, (_, i) => ({
          id: `audit-${i}`,
          admin_user_id: 'admin-user-1',
          action_type: 'user_action',
          target_type: 'user',
          target_id: `user-${i}`,
          created_at: new Date(Date.now() - i * 60000).toISOString(),
        })),
      };

      (supabase.rpc as any).mockResolvedValue({
        data: highVolumeData,
        error: null,
      });

      const startTime = performance.now();

      render(
        <TestWrapper>
          <AnalyticsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('50,000')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should handle high volume data efficiently
      expect(renderTime).toBeLessThan(3000);
    });
  });

  describe('Memory Management', () => {
    it('should not have memory leaks during extended usage', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Simulate extended admin session with multiple page navigations
      for (let i = 0; i < 50; i++) {
        const { unmount } = render(
          <TestWrapper>
            <AnalyticsPage />
          </TestWrapper>
        );

        await waitFor(() => {
          expect(screen.getByText('System Metrics')).toBeInTheDocument();
        });

        unmount();
      }

      // Force garbage collection if available
      if ((global as any).gc) {
        (global as any).gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should efficiently handle large data table rendering', async () => {
      // Mock large user dataset
      const largeUserDataset = Array.from({ length: 5000 }, (_, i) => ({
        id: `user-${i}`,
        email: `user${i}@test.com`,
        full_name: `Test User ${i}`,
        app_role: 'user',
        subscription_tier: i % 3 === 0 ? 'pro' : 'free',
        created_at: new Date(Date.now() - i * 60000).toISOString(),
        last_sign_in: new Date(Date.now() - i * 30000).toISOString(),
        is_active: i % 10 !== 0,
        content_count: Math.floor(Math.random() * 50),
        total_generations: Math.floor(Math.random() * 100),
      }));

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: largeUserDataset.slice(0, 100), // Paginated
                error: null,
                count: largeUserDataset.length,
              }),
            }),
          }),
        }),
      });

      const startTime = performance.now();

      render(
        <TestWrapper>
          <AnalyticsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('user0@test.com')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Large table should render efficiently with pagination
      expect(renderTime).toBeLessThan(1500);
    });
  });

  describe('Error Resilience', () => {
    it('should gracefully handle API failures', async () => {
      // Mock API failure
      (supabase.rpc as any).mockRejectedValue(new Error('Database connection failed'));

      render(
        <TestWrapper>
          <AnalyticsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/error loading analytics/i)).toBeInTheDocument();
      });

      // Should show retry option
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should handle partial data failures gracefully', async () => {
      // Mock partial failure scenario
      (supabase.rpc as any).mockImplementation((functionName: string) => {
        if (functionName === 'get_system_metrics') {
          return Promise.resolve({
            data: {
              active_users_24h: 1000,
              total_content_generated: 5000,
            },
            error: null,
          });
        }
        if (functionName === 'get_performance_metrics') {
          return Promise.reject(new Error('Performance service unavailable'));
        }
        return Promise.resolve({ data: null, error: null });
      });

      render(
        <TestWrapper>
          <AnalyticsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        // System metrics should load
        expect(screen.getByText('1,000')).toBeInTheDocument();
        // Performance section should show error state
        expect(screen.getByText(/performance data unavailable/i)).toBeInTheDocument();
      });
    });

    it('should recover from temporary network issues', async () => {
      let callCount = 0;
      
      (supabase.rpc as any).mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.reject(new Error('Network timeout'));
        }
        return Promise.resolve({
          data: {
            systemMetrics: {
              active_users_24h: 1000,
              total_content_generated: 5000,
            },
          },
          error: null,
        });
      });

      render(
        <TestWrapper>
          <AnalyticsPage />
        </TestWrapper>
      );

      // Should eventually succeed after retries
      await waitFor(() => {
        expect(screen.getByText('1,000')).toBeInTheDocument();
      }, { timeout: 5000 });

      expect(callCount).toBeGreaterThan(2);
    });
  });

  describe('Real-time Updates', () => {
    it('should handle real-time metric updates efficiently', async () => {
      let updateCount = 0;
      const mockData = {
        systemMetrics: {
          active_users_24h: 1000,
          total_content_generated: 5000,
          api_requests_24h: 50000,
          storage_usage: 10.5,
          ai_api_costs: 500.75,
        },
      };

      (supabase.rpc as any).mockImplementation(() => {
        updateCount++;
        return Promise.resolve({
          data: {
            ...mockData,
            systemMetrics: {
              ...mockData.systemMetrics,
              active_users_24h: 1000 + updateCount * 10,
            },
          },
          error: null,
        });
      });

      render(
        <TestWrapper>
          <AnalyticsPage />
        </TestWrapper>
      );

      // Initial load
      await waitFor(() => {
        expect(screen.getByText('1,010')).toBeInTheDocument();
      });

      // Simulate real-time updates
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await waitFor(() => {
          const expectedValue = (1000 + (updateCount) * 10).toLocaleString();
          expect(screen.getByText(expectedValue)).toBeInTheDocument();
        });
      }

      // Should handle frequent updates without performance degradation
      expect(updateCount).toBeGreaterThan(10);
    });
  });
});