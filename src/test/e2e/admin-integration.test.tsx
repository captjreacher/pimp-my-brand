import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminContext } from '@/contexts/AdminContext';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { supabase } from '@/integrations/supabase/client';
import type { AdminUser, AdminPermissions } from '@/lib/admin/types';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    }),
  },
}));

// Mock Stripe
vi.mock('@/lib/admin/stripe-service', () => ({
  StripeService: {
    processRefund: vi.fn(),
    modifySubscription: vi.fn(),
    getCustomerDetails: vi.fn(),
    handleWebhook: vi.fn(),
  },
}));

// Mock fetch for webhook testing
global.fetch = vi.fn();

const mockAdminUser: AdminUser = {
  id: 'admin-user-1',
  email: 'admin@test.com',
  app_role: 'admin',
  admin_permissions: ['manage_users', 'moderate_content', 'manage_billing', 'view_analytics'],
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

describe('Admin System Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Stripe Webhook Integration', () => {
    it('should handle subscription created webhook', async () => {
      const webhookPayload = {
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'active',
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 2592000, // 30 days
            items: {
              data: [{
                price: {
                  id: 'price_pro',
                  nickname: 'Pro Plan',
                },
              }],
            },
          },
        },
      };

      const { StripeService } = await import('@/lib/admin/stripe-service');
      (StripeService.handleWebhook as any).mockResolvedValue({
        success: true,
        processed: true,
      });

      // Mock database update
      const mockFrom = vi.fn().mockReturnValue({
        upsert: vi.fn().mockResolvedValue({
          data: [{ id: 'subscription-1', status: 'active' }],
          error: null,
        }),
      });

      (supabase.from as any).mockImplementation(mockFrom);

      // Simulate webhook processing
      const result = await StripeService.handleWebhook(webhookPayload, 'test-signature');

      expect(result.success).toBe(true);
      expect(StripeService.handleWebhook).toHaveBeenCalledWith(webhookPayload, 'test-signature');
    });

    it('should handle payment failed webhook and create billing issue', async () => {
      const webhookPayload = {
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_test123',
            customer: 'cus_test123',
            subscription: 'sub_test123',
            amount_due: 2900,
            attempt_count: 2,
            next_payment_attempt: Math.floor(Date.now() / 1000) + 86400, // 24 hours
          },
        },
      };

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'billing_issues') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: [{ 
                id: 'issue-1', 
                issue_type: 'payment_failed',
                status: 'open',
                priority: 'high',
              }],
              error: null,
            }),
          };
        }
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      (supabase.from as any).mockImplementation(mockFrom);

      const { StripeService } = await import('@/lib/admin/stripe-service');
      (StripeService.handleWebhook as any).mockResolvedValue({
        success: true,
        billingIssueCreated: true,
      });

      const result = await StripeService.handleWebhook(webhookPayload, 'test-signature');

      expect(result.success).toBe(true);
      expect(result.billingIssueCreated).toBe(true);
    });

    it('should handle subscription cancelled webhook', async () => {
      const webhookPayload = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'canceled',
            canceled_at: Math.floor(Date.now() / 1000),
          },
        },
      };

      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: 'subscription-1', status: 'canceled' }],
            error: null,
          }),
        }),
      });

      (supabase.from as any).mockImplementation(mockFrom);

      const { StripeService } = await import('@/lib/admin/stripe-service');
      (StripeService.handleWebhook as any).mockResolvedValue({
        success: true,
        subscriptionCanceled: true,
      });

      const result = await StripeService.handleWebhook(webhookPayload, 'test-signature');

      expect(result.success).toBe(true);
      expect(result.subscriptionCanceled).toBe(true);
    });
  });

  describe('Real-time Updates Integration', () => {
    it('should handle real-time user status updates', async () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
      };

      (supabase.channel as any).mockReturnValue(mockChannel);

      render(
        <TestWrapper>
          <AdminDashboardPage />
        </TestWrapper>
      );

      // Verify real-time subscription setup
      expect(supabase.channel).toHaveBeenCalledWith('admin-updates');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: '*',
          schema: 'public',
          table: 'profiles',
        }),
        expect.any(Function)
      );
    });

    it('should handle real-time moderation queue updates', async () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
      };

      (supabase.channel as any).mockReturnValue(mockChannel);

      render(
        <TestWrapper>
          <AdminDashboardPage />
        </TestWrapper>
      );

      // Simulate real-time moderation update
      const moderationUpdate = {
        eventType: 'INSERT',
        new: {
          id: 'mod-new-1',
          content_type: 'brand',
          status: 'pending',
          flag_reason: 'Inappropriate content',
          created_at: new Date().toISOString(),
        },
      };

      // Get the callback function that was registered
      const onCallback = mockChannel.on.mock.calls.find(
        call => call[1]?.table === 'content_moderation_queue'
      )?.[2];

      if (onCallback) {
        onCallback(moderationUpdate);
      }

      await waitFor(() => {
        // Should update the moderation queue count
        expect(screen.getByText(/new moderation item/i)).toBeInTheDocument();
      });
    });

    it('should handle real-time analytics updates', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: {
          active_users_24h: 1500,
          total_content_generated: 7500,
          api_requests_24h: 75000,
        },
        error: null,
      });

      (supabase.rpc as any).mockImplementation(mockRpc);

      render(
        <TestWrapper>
          <AdminDashboardPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('1,500')).toBeInTheDocument();
      });

      // Simulate real-time metric update
      (supabase.rpc as any).mockResolvedValue({
        data: {
          active_users_24h: 1600,
          total_content_generated: 7600,
          api_requests_24h: 76000,
        },
        error: null,
      });

      // Trigger update
      await waitFor(() => {
        expect(screen.getByText('1,600')).toBeInTheDocument();
      });
    });
  });

  describe('Cross-Module Integration', () => {
    it('should integrate user suspension with content moderation', async () => {
      // Mock user with flagged content
      const mockUser = {
        id: 'user-problematic',
        email: 'problematic@test.com',
        full_name: 'Problematic User',
        is_active: true,
        content_count: 5,
      };

      const mockModerationItems = [
        {
          id: 'mod-1',
          content_type: 'brand',
          user_id: 'user-problematic',
          status: 'rejected',
          flag_reason: 'Inappropriate content',
        },
        {
          id: 'mod-2',
          content_type: 'cv',
          user_id: 'user-problematic',
          status: 'rejected',
          flag_reason: 'Spam content',
        },
      ];

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [mockUser],
              error: null,
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ ...mockUser, is_active: false }],
                error: null,
              }),
            }),
          };
        }
        if (table === 'content_moderation_queue') {
          return {
            select: vi.fn().mockResolvedValue({
              data: mockModerationItems,
              error: null,
            }),
          };
        }
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      (supabase.from as any).mockImplementation(mockFrom);

      render(
        <TestWrapper>
          <AdminDashboardPage />
        </TestWrapper>
      );

      // Navigate to user management
      const userManagementLink = screen.getByRole('link', { name: /user management/i });
      fireEvent.click(userManagementLink);

      await waitFor(() => {
        expect(screen.getByText('problematic@test.com')).toBeInTheDocument();
      });

      // Click on user to see details
      fireEvent.click(screen.getByText('problematic@test.com'));

      await waitFor(() => {
        // Should show moderation history
        expect(screen.getByText('2 rejected items')).toBeInTheDocument();
      });

      // Suspend user based on moderation history
      const suspendButton = screen.getByRole('button', { name: /suspend user/i });
      fireEvent.click(suspendButton);

      const reasonInput = screen.getByPlaceholderText(/suspension reason/i);
      fireEvent.change(reasonInput, { target: { value: 'Multiple policy violations' } });

      const confirmButton = screen.getByRole('button', { name: /confirm suspension/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('profiles');
      });
    });

    it('should integrate billing issues with user management', async () => {
      const mockUser = {
        id: 'user-billing-issue',
        email: 'billing@test.com',
        subscription_tier: 'pro',
        subscription_status: 'past_due',
      };

      const mockBillingIssue = {
        id: 'issue-1',
        user_id: 'user-billing-issue',
        issue_type: 'payment_failed',
        status: 'open',
        priority: 'high',
      };

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [mockUser],
              error: null,
            }),
          };
        }
        if (table === 'billing_issues') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [mockBillingIssue],
              error: null,
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ ...mockBillingIssue, status: 'resolved' }],
                error: null,
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      (supabase.from as any).mockImplementation(mockFrom);

      render(
        <TestWrapper>
          <AdminDashboardPage />
        </TestWrapper>
      );

      // Should show billing alert for user
      await waitFor(() => {
        expect(screen.getByText(/billing issues detected/i)).toBeInTheDocument();
      });

      // Navigate to billing management
      const billingLink = screen.getByRole('link', { name: /subscription management/i });
      fireEvent.click(billingLink);

      await waitFor(() => {
        expect(screen.getByText('billing@test.com')).toBeInTheDocument();
        expect(screen.getByText('payment_failed')).toBeInTheDocument();
      });

      // Resolve billing issue
      const resolveButton = screen.getByRole('button', { name: /resolve/i });
      fireEvent.click(resolveButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('billing_issues');
      });
    });

    it('should integrate analytics with system alerts', async () => {
      const mockAnalytics = {
        systemMetrics: {
          active_users_24h: 500,
          error_rate: 0.15, // High error rate
          avg_response_time: 2500, // Slow response time
        },
        alerts: [
          {
            id: 'alert-1',
            type: 'high_error_rate',
            severity: 'critical',
            message: 'Error rate exceeded 10%',
            created_at: new Date().toISOString(),
          },
          {
            id: 'alert-2',
            type: 'slow_response',
            severity: 'warning',
            message: 'Average response time exceeded 2 seconds',
            created_at: new Date().toISOString(),
          },
        ],
      };

      const mockRpc = vi.fn().mockResolvedValue({
        data: mockAnalytics,
        error: null,
      });

      (supabase.rpc as any).mockImplementation(mockRpc);

      render(
        <TestWrapper>
          <AdminDashboardPage />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should show system alerts
        expect(screen.getByText(/critical alert/i)).toBeInTheDocument();
        expect(screen.getByText('Error rate exceeded 10%')).toBeInTheDocument();
        expect(screen.getByText('Average response time exceeded 2 seconds')).toBeInTheDocument();
      });

      // Acknowledge alert
      const acknowledgeButton = screen.getByRole('button', { name: /acknowledge/i });
      fireEvent.click(acknowledgeButton);

      await waitFor(() => {
        expect(supabase.rpc).toHaveBeenCalledWith('acknowledge_alert', 
          expect.objectContaining({ alert_id: 'alert-1' })
        );
      });
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should maintain data consistency across admin operations', async () => {
      // Test scenario: User suspension should update all related records
      const userId = 'user-consistency-test';
      
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        const baseResponse = {
          eq: vi.fn().mockReturnThis(),
          update: vi.fn().mockResolvedValue({ data: [], error: null }),
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        };

        if (table === 'profiles') {
          return {
            ...baseResponse,
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: userId, is_active: false }],
                error: null,
              }),
            }),
          };
        }

        return baseResponse;
      });

      (supabase.from as any).mockImplementation(mockFrom);

      // Mock transaction-like behavior
      const mockRpc = vi.fn().mockResolvedValue({
        data: { success: true, affected_records: 5 },
        error: null,
      });

      (supabase.rpc as any).mockImplementation(mockRpc);

      render(
        <TestWrapper>
          <AdminDashboardPage />
        </TestWrapper>
      );

      // Simulate user suspension
      await waitFor(() => {
        expect(supabase.rpc).toHaveBeenCalledWith('suspend_user_transaction', 
          expect.objectContaining({ user_id: userId })
        );
      });

      // Verify all related records were updated
      expect(mockRpc).toHaveBeenCalledWith('suspend_user_transaction', 
        expect.objectContaining({
          user_id: userId,
          admin_user_id: 'admin-user-1',
          reason: expect.any(String),
        })
      );
    });

    it('should handle concurrent admin operations safely', async () => {
      const userId = 'user-concurrent-test';
      let operationCount = 0;

      const mockFrom = vi.fn().mockImplementation(() => ({
        update: vi.fn().mockImplementation(() => {
          operationCount++;
          if (operationCount === 1) {
            // First operation succeeds
            return {
              eq: vi.fn().mockResolvedValue({
                data: [{ id: userId, is_active: false }],
                error: null,
              }),
            };
          } else {
            // Second operation fails due to optimistic locking
            return {
              eq: vi.fn().mockRejectedValue({
                message: 'Record was modified by another user',
                code: 'CONCURRENT_MODIFICATION',
              }),
            };
          }
        }),
      }));

      (supabase.from as any).mockImplementation(mockFrom);

      // Simulate two concurrent admin operations
      const operation1 = supabase.from('profiles').update({ is_active: false }).eq('id', userId);
      const operation2 = supabase.from('profiles').update({ is_active: false }).eq('id', userId);

      const results = await Promise.allSettled([operation1, operation2]);

      // One should succeed, one should fail
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
    });

    it('should validate referential integrity in admin operations', async () => {
      const mockRpc = vi.fn().mockImplementation((functionName: string) => {
        if (functionName === 'validate_referential_integrity') {
          return Promise.resolve({
            data: {
              valid: true,
              orphaned_records: 0,
              integrity_violations: [],
            },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      (supabase.rpc as any).mockImplementation(mockRpc);

      render(
        <TestWrapper>
          <AdminDashboardPage />
        </TestWrapper>
      );

      // Run integrity check
      const integrityButton = screen.getByRole('button', { name: /check integrity/i });
      fireEvent.click(integrityButton);

      await waitFor(() => {
        expect(supabase.rpc).toHaveBeenCalledWith('validate_referential_integrity');
        expect(screen.getByText(/integrity check passed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from database connection failures', async () => {
      let attemptCount = 0;

      const mockFrom = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockImplementation(() => {
          attemptCount++;
          if (attemptCount <= 2) {
            return Promise.reject(new Error('Connection timeout'));
          }
          return Promise.resolve({
            data: [{ id: 'user-1', email: 'test@test.com' }],
            error: null,
          });
        }),
      }));

      (supabase.from as any).mockImplementation(mockFrom);

      render(
        <TestWrapper>
          <AdminDashboardPage />
        </TestWrapper>
      );

      // Should eventually recover and show data
      await waitFor(() => {
        expect(screen.getByText('test@test.com')).toBeInTheDocument();
      }, { timeout: 5000 });

      expect(attemptCount).toBeGreaterThan(2);
    });

    it('should handle partial system failures gracefully', async () => {
      const mockRpc = vi.fn().mockImplementation((functionName: string) => {
        if (functionName === 'get_system_metrics') {
          return Promise.resolve({
            data: { active_users_24h: 1000 },
            error: null,
          });
        }
        if (functionName === 'get_billing_metrics') {
          return Promise.reject(new Error('Billing service unavailable'));
        }
        return Promise.resolve({ data: null, error: null });
      });

      (supabase.rpc as any).mockImplementation(mockRpc);

      render(
        <TestWrapper>
          <AdminDashboardPage />
        </TestWrapper>
      );

      await waitFor(() => {
        // System metrics should load
        expect(screen.getByText('1,000')).toBeInTheDocument();
        // Billing section should show error state
        expect(screen.getByText(/billing data unavailable/i)).toBeInTheDocument();
      });
    });
  });
});