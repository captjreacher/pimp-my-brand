import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminContext } from '@/contexts/AdminContext';
import { UserManagementPage } from '@/pages/admin/UserManagementPage';
import { ContentModerationPage } from '@/pages/admin/ContentModerationPage';
import { SubscriptionManagementPage } from '@/pages/admin/SubscriptionManagementPage';
import { AnalyticsPage } from '@/pages/admin/AnalyticsPage';
import { SecurityPage } from '@/pages/admin/SecurityPage';
import { supabase } from '@/integrations/supabase/client';
import type { AdminUser, AdminPermissions } from '@/lib/admin/types';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
      signOut: vi.fn(),
    },
    storage: {
      from: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

// Mock Stripe
vi.mock('@/lib/admin/stripe-service', () => ({
  StripeService: {
    processRefund: vi.fn(),
    modifySubscription: vi.fn(),
    getCustomerDetails: vi.fn(),
  },
}));

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

describe('Admin Workflows End-to-End Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('User Management Workflows', () => {
    const mockUsers = [
      {
        id: 'user-1',
        email: 'user1@test.com',
        full_name: 'Test User 1',
        app_role: 'user',
        subscription_tier: 'free',
        created_at: '2024-01-01T00:00:00Z',
        last_sign_in: '2024-01-15T00:00:00Z',
        is_active: true,
        content_count: 5,
        total_generations: 10,
      },
      {
        id: 'user-2',
        email: 'user2@test.com',
        full_name: 'Test User 2',
        app_role: 'user',
        subscription_tier: 'pro',
        created_at: '2024-01-02T00:00:00Z',
        last_sign_in: '2024-01-16T00:00:00Z',
        is_active: false,
        content_count: 15,
        total_generations: 25,
      },
    ];

    beforeEach(() => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockUsers,
                error: null,
                count: mockUsers.length,
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ ...mockUsers[0], is_active: false }],
            error: null,
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });
      
      (supabase.from as any).mockImplementation(mockFrom);
    });

    it('should complete user search and filter workflow', async () => {
      render(
        <TestWrapper>
          <UserManagementPage />
        </TestWrapper>
      );

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByText('Test User 1')).toBeInTheDocument();
        expect(screen.getByText('Test User 2')).toBeInTheDocument();
      });

      // Test search functionality
      const searchInput = screen.getByPlaceholderText(/search users/i);
      fireEvent.change(searchInput, { target: { value: 'user1@test.com' } });

      await waitFor(() => {
        expect(screen.getByText('Test User 1')).toBeInTheDocument();
      });

      // Test filter by subscription tier
      const subscriptionFilter = screen.getByRole('combobox', { name: /subscription/i });
      fireEvent.click(subscriptionFilter);
      fireEvent.click(screen.getByText('Pro'));

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('profiles');
      });
    });

    it('should complete user suspension workflow', async () => {
      render(
        <TestWrapper>
          <UserManagementPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test User 1')).toBeInTheDocument();
      });

      // Click on user to open detail modal
      fireEvent.click(screen.getByText('Test User 1'));

      await waitFor(() => {
        expect(screen.getByText('User Details')).toBeInTheDocument();
      });

      // Click suspend button
      const suspendButton = screen.getByRole('button', { name: /suspend/i });
      fireEvent.click(suspendButton);

      // Fill suspension form
      const reasonInput = screen.getByPlaceholderText(/reason for suspension/i);
      fireEvent.change(reasonInput, { target: { value: 'Policy violation' } });

      const confirmButton = screen.getByRole('button', { name: /confirm suspension/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('profiles');
      });
    });

    it('should complete bulk user actions workflow', async () => {
      render(
        <TestWrapper>
          <UserManagementPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test User 1')).toBeInTheDocument();
      });

      // Select multiple users
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // First user checkbox
      fireEvent.click(checkboxes[2]); // Second user checkbox

      // Bulk action should appear
      await waitFor(() => {
        expect(screen.getByText(/2 users selected/i)).toBeInTheDocument();
      });

      // Perform bulk suspension
      const bulkSuspendButton = screen.getByRole('button', { name: /bulk suspend/i });
      fireEvent.click(bulkSuspendButton);

      const confirmBulkButton = screen.getByRole('button', { name: /confirm bulk action/i });
      fireEvent.click(confirmBulkButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('profiles');
      });
    });
  });

  describe('Content Moderation Workflows', () => {
    const mockModerationItems = [
      {
        id: 'mod-1',
        type: 'brand',
        title: 'Test Brand',
        user_id: 'user-1',
        user_email: 'user1@test.com',
        created_at: '2024-01-01T00:00:00Z',
        flagged_at: '2024-01-02T00:00:00Z',
        flag_reason: 'Inappropriate content',
        status: 'pending',
        content_preview: 'Brand content preview...',
        risk_score: 75,
      },
      {
        id: 'mod-2',
        type: 'cv',
        title: 'Test CV',
        user_id: 'user-2',
        user_email: 'user2@test.com',
        created_at: '2024-01-03T00:00:00Z',
        flagged_at: '2024-01-04T00:00:00Z',
        flag_reason: 'Spam content',
        status: 'pending',
        content_preview: 'CV content preview...',
        risk_score: 85,
      },
    ];

    beforeEach(() => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockModerationItems,
                error: null,
                count: mockModerationItems.length,
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ ...mockModerationItems[0], status: 'approved' }],
            error: null,
          }),
        }),
      });
      
      (supabase.from as any).mockImplementation(mockFrom);
    });

    it('should complete content review and approval workflow', async () => {
      render(
        <TestWrapper>
          <ContentModerationPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Brand')).toBeInTheDocument();
        expect(screen.getByText('Test CV')).toBeInTheDocument();
      });

      // Click on first moderation item
      fireEvent.click(screen.getByText('Test Brand'));

      await waitFor(() => {
        expect(screen.getByText('Content Preview')).toBeInTheDocument();
      });

      // Approve content
      const approveButton = screen.getByRole('button', { name: /approve/i });
      fireEvent.click(approveButton);

      const confirmButton = screen.getByRole('button', { name: /confirm approval/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('content_moderation_queue');
      });
    });

    it('should complete content rejection workflow', async () => {
      render(
        <TestWrapper>
          <ContentModerationPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test CV')).toBeInTheDocument();
      });

      // Click on second moderation item
      fireEvent.click(screen.getByText('Test CV'));

      // Reject content
      const rejectButton = screen.getByRole('button', { name: /reject/i });
      fireEvent.click(rejectButton);

      // Add rejection reason
      const reasonInput = screen.getByPlaceholderText(/rejection reason/i);
      fireEvent.change(reasonInput, { target: { value: 'Violates community guidelines' } });

      const confirmButton = screen.getByRole('button', { name: /confirm rejection/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('content_moderation_queue');
      });
    });

    it('should complete bulk moderation workflow', async () => {
      render(
        <TestWrapper>
          <ContentModerationPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Brand')).toBeInTheDocument();
      });

      // Select multiple items
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // First item
      fireEvent.click(checkboxes[2]); // Second item

      // Bulk approve
      const bulkApproveButton = screen.getByRole('button', { name: /bulk approve/i });
      fireEvent.click(bulkApproveButton);

      const confirmButton = screen.getByRole('button', { name: /confirm bulk approval/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('content_moderation_queue');
      });
    });
  }); 
 describe('Subscription Management Workflows', () => {
    const mockSubscriptions = [
      {
        user_id: 'user-1',
        user_email: 'user1@test.com',
        stripe_customer_id: 'cus_test1',
        current_tier: 'pro',
        status: 'active',
        current_period_start: '2024-01-01T00:00:00Z',
        current_period_end: '2024-02-01T00:00:00Z',
        cancel_at_period_end: false,
        total_paid: 2900,
      },
      {
        user_id: 'user-2',
        user_email: 'user2@test.com',
        stripe_customer_id: 'cus_test2',
        current_tier: 'premium',
        status: 'past_due',
        current_period_start: '2024-01-01T00:00:00Z',
        current_period_end: '2024-02-01T00:00:00Z',
        cancel_at_period_end: false,
        total_paid: 4900,
      },
    ];

    const mockBillingIssues = [
      {
        id: 'issue-1',
        user_id: 'user-2',
        user_email: 'user2@test.com',
        issue_type: 'payment_failed',
        description: 'Credit card declined',
        created_at: '2024-01-15T00:00:00Z',
        status: 'open',
        priority: 'high',
      },
    ];

    beforeEach(() => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'subscription_analytics') {
          return {
            select: vi.fn().mockResolvedValue({
              data: mockSubscriptions,
              error: null,
            }),
          };
        }
        if (table === 'billing_issues') {
          return {
            select: vi.fn().mockResolvedValue({
              data: mockBillingIssues,
              error: null,
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ ...mockBillingIssues[0], status: 'resolved' }],
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
    });

    it('should complete subscription modification workflow', async () => {
      const { StripeService } = await import('@/lib/admin/stripe-service');
      (StripeService.modifySubscription as any).mockResolvedValue({
        success: true,
        subscription: { id: 'sub_test', status: 'active' },
      });

      render(
        <TestWrapper>
          <SubscriptionManagementPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('user1@test.com')).toBeInTheDocument();
      });

      // Click on subscription to open details
      fireEvent.click(screen.getByText('user1@test.com'));

      await waitFor(() => {
        expect(screen.getByText('Subscription Details')).toBeInTheDocument();
      });

      // Modify subscription
      const modifyButton = screen.getByRole('button', { name: /modify subscription/i });
      fireEvent.click(modifyButton);

      // Change tier
      const tierSelect = screen.getByRole('combobox', { name: /new tier/i });
      fireEvent.click(tierSelect);
      fireEvent.click(screen.getByText('Premium'));

      const confirmButton = screen.getByRole('button', { name: /confirm modification/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(StripeService.modifySubscription).toHaveBeenCalledWith(
          'cus_test1',
          expect.objectContaining({ tier: 'premium' })
        );
      });
    });

    it('should complete refund processing workflow', async () => {
      const { StripeService } = await import('@/lib/admin/stripe-service');
      (StripeService.processRefund as any).mockResolvedValue({
        success: true,
        refund: { id: 'ref_test', amount: 2900 },
      });

      render(
        <TestWrapper>
          <SubscriptionManagementPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('user1@test.com')).toBeInTheDocument();
      });

      // Click on subscription
      fireEvent.click(screen.getByText('user1@test.com'));

      // Process refund
      const refundButton = screen.getByRole('button', { name: /process refund/i });
      fireEvent.click(refundButton);

      // Enter refund amount
      const amountInput = screen.getByPlaceholderText(/refund amount/i);
      fireEvent.change(amountInput, { target: { value: '29.00' } });

      // Enter reason
      const reasonInput = screen.getByPlaceholderText(/refund reason/i);
      fireEvent.change(reasonInput, { target: { value: 'Customer request' } });

      const confirmButton = screen.getByRole('button', { name: /confirm refund/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(StripeService.processRefund).toHaveBeenCalledWith(
          'cus_test1',
          expect.objectContaining({ amount: 2900, reason: 'Customer request' })
        );
      });
    });

    it('should complete billing issue resolution workflow', async () => {
      render(
        <TestWrapper>
          <SubscriptionManagementPage />
        </TestWrapper>
      );

      // Navigate to billing issues tab
      const billingIssuesTab = screen.getByRole('tab', { name: /billing issues/i });
      fireEvent.click(billingIssuesTab);

      await waitFor(() => {
        expect(screen.getByText('Credit card declined')).toBeInTheDocument();
      });

      // Click on billing issue
      fireEvent.click(screen.getByText('Credit card declined'));

      // Resolve issue
      const resolveButton = screen.getByRole('button', { name: /resolve issue/i });
      fireEvent.click(resolveButton);

      // Add resolution notes
      const notesInput = screen.getByPlaceholderText(/resolution notes/i);
      fireEvent.change(notesInput, { target: { value: 'Customer updated payment method' } });

      const confirmButton = screen.getByRole('button', { name: /confirm resolution/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('billing_issues');
      });
    });
  });

  describe('Analytics and Monitoring Workflows', () => {
    const mockAnalyticsData = {
      systemMetrics: {
        active_users_24h: 150,
        total_content_generated: 1250,
        api_requests_24h: 5000,
        storage_usage: 2.5,
        ai_api_costs: 125.50,
      },
      performanceMetrics: {
        avg_response_time: 250,
        error_rate: 0.02,
        uptime_percentage: 99.9,
        database_performance: {
          avg_query_time: 15,
          slow_queries: 2,
          connection_pool_usage: 0.75,
        },
      },
      userAnalytics: {
        new_users_24h: 25,
        active_sessions: 85,
        conversion_rate: 0.15,
        churn_rate: 0.05,
      },
    };

    beforeEach(() => {
      const mockRpc = vi.fn().mockImplementation((functionName: string) => {
        if (functionName === 'get_admin_analytics') {
          return Promise.resolve({
            data: mockAnalyticsData,
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });
      
      (supabase.rpc as any).mockImplementation(mockRpc);
    });

    it('should display real-time analytics dashboard', async () => {
      render(
        <TestWrapper>
          <AnalyticsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument(); // Active users
        expect(screen.getByText('1,250')).toBeInTheDocument(); // Content generated
        expect(screen.getByText('5,000')).toBeInTheDocument(); // API requests
      });

      // Verify performance metrics
      expect(screen.getByText('250ms')).toBeInTheDocument(); // Response time
      expect(screen.getByText('99.9%')).toBeInTheDocument(); // Uptime
    });

    it('should validate alert system functionality', async () => {
      // Mock high error rate scenario
      const highErrorData = {
        ...mockAnalyticsData,
        performanceMetrics: {
          ...mockAnalyticsData.performanceMetrics,
          error_rate: 0.15, // 15% error rate should trigger alert
        },
      };

      (supabase.rpc as any).mockResolvedValue({
        data: highErrorData,
        error: null,
      });

      render(
        <TestWrapper>
          <AnalyticsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/high error rate detected/i)).toBeInTheDocument();
      });

      // Test alert acknowledgment
      const acknowledgeButton = screen.getByRole('button', { name: /acknowledge/i });
      fireEvent.click(acknowledgeButton);

      await waitFor(() => {
        expect(supabase.rpc).toHaveBeenCalledWith('acknowledge_alert', expect.any(Object));
      });
    });

    it('should validate system health monitoring accuracy', async () => {
      render(
        <TestWrapper>
          <AnalyticsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        // Verify system health indicators
        expect(screen.getByText(/system healthy/i)).toBeInTheDocument();
      });

      // Check database performance metrics
      expect(screen.getByText('15ms')).toBeInTheDocument(); // Avg query time
      expect(screen.getByText('75%')).toBeInTheDocument(); // Connection pool usage
    });
  });

  describe('Security and Compliance Workflows', () => {
    const mockSecurityData = {
      loginAttempts: [
        {
          id: 'attempt-1',
          user_email: 'user1@test.com',
          ip_address: '192.168.1.1',
          success: false,
          attempted_at: '2024-01-15T10:30:00Z',
          failure_reason: 'invalid_password',
        },
        {
          id: 'attempt-2',
          user_email: 'admin@test.com',
          ip_address: '192.168.1.100',
          success: true,
          attempted_at: '2024-01-15T11:00:00Z',
          failure_reason: null,
        },
      ],
      auditLogs: [
        {
          id: 'audit-1',
          admin_user_id: 'admin-user-1',
          action_type: 'user_suspended',
          target_type: 'user',
          target_id: 'user-1',
          details: { reason: 'Policy violation' },
          created_at: '2024-01-15T12:00:00Z',
        },
      ],
    };

    beforeEach(() => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'admin_login_attempts') {
          return {
            select: vi.fn().mockResolvedValue({
              data: mockSecurityData.loginAttempts,
              error: null,
            }),
          };
        }
        if (table === 'admin_audit_log') {
          return {
            select: vi.fn().mockResolvedValue({
              data: mockSecurityData.auditLogs,
              error: null,
            }),
          };
        }
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      });
      
      (supabase.from as any).mockImplementation(mockFrom);
    });

    it('should validate MFA setup workflow', async () => {
      render(
        <TestWrapper>
          <SecurityPage />
        </TestWrapper>
      );

      // Navigate to MFA settings
      const mfaTab = screen.getByRole('tab', { name: /multi-factor authentication/i });
      fireEvent.click(mfaTab);

      await waitFor(() => {
        expect(screen.getByText('Multi-Factor Authentication')).toBeInTheDocument();
      });

      // Setup MFA
      const setupButton = screen.getByRole('button', { name: /setup mfa/i });
      fireEvent.click(setupButton);

      await waitFor(() => {
        expect(screen.getByText('QR Code')).toBeInTheDocument();
      });

      // Verify MFA code
      const codeInput = screen.getByPlaceholderText(/enter verification code/i);
      fireEvent.change(codeInput, { target: { value: '123456' } });

      const verifyButton = screen.getByRole('button', { name: /verify/i });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(supabase.rpc).toHaveBeenCalledWith('setup_admin_mfa', expect.any(Object));
      });
    });

    it('should validate audit trail integrity', async () => {
      render(
        <TestWrapper>
          <SecurityPage />
        </TestWrapper>
      );

      // Navigate to audit logs
      const auditTab = screen.getByRole('tab', { name: /audit logs/i });
      fireEvent.click(auditTab);

      await waitFor(() => {
        expect(screen.getByText('user_suspended')).toBeInTheDocument();
        expect(screen.getByText('Policy violation')).toBeInTheDocument();
      });

      // Test audit log export
      const exportButton = screen.getByRole('button', { name: /export logs/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(supabase.rpc).toHaveBeenCalledWith('export_audit_logs', expect.any(Object));
      });
    });

    it('should validate GDPR compliance workflows', async () => {
      render(
        <TestWrapper>
          <SecurityPage />
        </TestWrapper>
      );

      // Navigate to GDPR compliance
      const gdprTab = screen.getByRole('tab', { name: /gdpr compliance/i });
      fireEvent.click(gdprTab);

      await waitFor(() => {
        expect(screen.getByText('Data Export')).toBeInTheDocument();
        expect(screen.getByText('Data Deletion')).toBeInTheDocument();
      });

      // Test user data export
      const userIdInput = screen.getByPlaceholderText(/user id or email/i);
      fireEvent.change(userIdInput, { target: { value: 'user1@test.com' } });

      const exportDataButton = screen.getByRole('button', { name: /export user data/i });
      fireEvent.click(exportDataButton);

      await waitFor(() => {
        expect(supabase.rpc).toHaveBeenCalledWith('export_user_data', 
          expect.objectContaining({ user_identifier: 'user1@test.com' })
        );
      });

      // Test user data deletion
      const deleteDataButton = screen.getByRole('button', { name: /delete user data/i });
      fireEvent.click(deleteDataButton);

      // Confirm deletion
      const confirmInput = screen.getByPlaceholderText(/type "DELETE" to confirm/i);
      fireEvent.change(confirmInput, { target: { value: 'DELETE' } });

      const confirmDeleteButton = screen.getByRole('button', { name: /confirm deletion/i });
      fireEvent.click(confirmDeleteButton);

      await waitFor(() => {
        expect(supabase.rpc).toHaveBeenCalledWith('delete_user_data', 
          expect.objectContaining({ user_identifier: 'user1@test.com' })
        );
      });
    });

    it('should validate login attempt monitoring', async () => {
      render(
        <TestWrapper>
          <SecurityPage />
        </TestWrapper>
      );

      // Navigate to login monitoring
      const loginTab = screen.getByRole('tab', { name: /login attempts/i });
      fireEvent.click(loginTab);

      await waitFor(() => {
        expect(screen.getByText('user1@test.com')).toBeInTheDocument();
        expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
        expect(screen.getByText('invalid_password')).toBeInTheDocument();
      });

      // Test IP blocking
      const blockIpButton = screen.getByRole('button', { name: /block ip/i });
      fireEvent.click(blockIpButton);

      const confirmBlockButton = screen.getByRole('button', { name: /confirm block/i });
      fireEvent.click(confirmBlockButton);

      await waitFor(() => {
        expect(supabase.rpc).toHaveBeenCalledWith('block_ip_address', 
          expect.objectContaining({ ip_address: '192.168.1.1' })
        );
      });
    });
  });

  describe('Integration Testing', () => {
    it('should validate Stripe webhook integration', async () => {
      // Mock webhook payload
      const webhookPayload = {
        type: 'invoice.payment_failed',
        data: {
          object: {
            customer: 'cus_test1',
            subscription: 'sub_test1',
            amount_due: 2900,
          },
        },
      };

      // Simulate webhook processing
      const response = await fetch('/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Stripe-Signature': 'test-signature',
        },
        body: JSON.stringify(webhookPayload),
      });

      expect(response.ok).toBe(true);
    });

    it('should validate end-to-end admin workflow integration', async () => {
      // Test complete workflow: User flagged content -> Moderation -> User suspension
      
      // 1. Content gets flagged
      const flagResponse = await supabase
        .from('content_moderation_queue')
        .insert({
          content_type: 'brand',
          content_id: 'brand-test-1',
          user_id: 'user-1',
          flag_reason: 'Inappropriate content',
          status: 'pending',
        });

      expect(flagResponse.error).toBeNull();

      // 2. Admin reviews and rejects content
      const moderationResponse = await supabase
        .from('content_moderation_queue')
        .update({
          status: 'rejected',
          moderator_id: 'admin-user-1',
          moderator_notes: 'Violates community guidelines',
        })
        .eq('id', 'mod-test-1');

      expect(moderationResponse.error).toBeNull();

      // 3. User gets suspended due to repeated violations
      const suspensionResponse = await supabase
        .from('profiles')
        .update({
          is_active: false,
          suspended_at: new Date().toISOString(),
          suspended_by: 'admin-user-1',
          suspension_reason: 'Multiple policy violations',
        })
        .eq('id', 'user-1');

      expect(suspensionResponse.error).toBeNull();

      // 4. Audit log should capture all actions
      const auditResponse = await supabase
        .from('admin_audit_log')
        .select('*')
        .eq('target_id', 'user-1')
        .eq('action_type', 'user_suspended');

      expect(auditResponse.data).toHaveLength(1);
      expect(auditResponse.data?.[0].admin_user_id).toBe('admin-user-1');
    });
  });
});