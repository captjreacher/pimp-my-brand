import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AdminProvider } from '@/contexts/AdminContext';
import { UserManagementPage } from '@/pages/admin/UserManagementPage';
import { ContentModerationPage } from '@/pages/admin/ContentModerationPage';
import { SubscriptionManagementPage } from '@/pages/admin/SubscriptionManagementPage';
import { AnalyticsPage } from '@/pages/admin/AnalyticsPage';
import { SecurityPage } from '@/pages/admin/SecurityPage';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
      signOut: vi.fn(),
    },
    rpc: vi.fn(),
    storage: {
      from: vi.fn(),
    },
  },
}));

// Mock Stripe
vi.mock('@/lib/admin/stripe-service', () => ({
  StripeService: {
    processRefund: vi.fn(),
    updateSubscription: vi.fn(),
    getCustomerDetails: vi.fn(),
    handleWebhook: vi.fn(),
  },
}));

const mockAdminUser = {
  id: 'admin-user-id',
  email: 'admin@test.com',
  app_role: 'admin' as const,
  admin_permissions: ['manage_users', 'moderate_content', 'manage_billing', 'view_analytics'],
  last_admin_login: new Date().toISOString(),
};

const mockAdminContext = {
  user: mockAdminUser,
  permissions: {
    canManageUsers: true,
    canModerateContent: true,
    canManageBilling: true,
    canViewAnalytics: true,
    canManageSystem: true,
  },
  isLoading: false,
  error: null,
  refreshPermissions: vi.fn(),
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
        <AdminProvider>
          {children}
        </AdminProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Complete Admin User Management Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful database responses
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'user-1', email: 'user@test.com', full_name: 'Test User' },
            error: null,
          }),
        }),
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'user-1',
                email: 'user@test.com',
                full_name: 'Test User',
                app_role: 'user',
                subscription_tier: 'free',
                created_at: '2024-01-01',
                last_sign_in: '2024-01-15',
                is_active: true,
                content_count: 5,
                total_generations: 10,
              },
            ],
            error: null,
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: { id: 'user-1' },
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

  it('should complete full user suspension workflow', async () => {
    render(
      <TestWrapper>
        <UserManagementPage />
      </TestWrapper>
    );

    // Wait for user list to load
    await waitFor(() => {
      expect(screen.getByText('user@test.com')).toBeInTheDocument();
    });

    // Click on user to open detail modal
    fireEvent.click(screen.getByText('user@test.com'));

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('User Details')).toBeInTheDocument();
    });

    // Click suspend user button
    const suspendButton = screen.getByText('Suspend User');
    fireEvent.click(suspendButton);

    // Fill suspension form
    const reasonInput = screen.getByLabelText('Suspension Reason');
    fireEvent.change(reasonInput, { target: { value: 'Policy violation' } });

    // Confirm suspension
    const confirmButton = screen.getByText('Confirm Suspension');
    fireEvent.click(confirmButton);

    // Verify suspension API call
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });

    // Verify success message
    expect(screen.getByText('User suspended successfully')).toBeInTheDocument();
  });

  it('should complete bulk user role change workflow', async () => {
    render(
      <TestWrapper>
        <UserManagementPage />
      </TestWrapper>
    );

    // Wait for user list to load
    await waitFor(() => {
      expect(screen.getByText('user@test.com')).toBeInTheDocument();
    });

    // Select multiple users
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // First user checkbox
    fireEvent.click(checkboxes[2]); // Second user checkbox

    // Open bulk actions
    const bulkActionsButton = screen.getByText('Bulk Actions');
    fireEvent.click(bulkActionsButton);

    // Select change role action
    const changeRoleOption = screen.getByText('Change Role');
    fireEvent.click(changeRoleOption);

    // Select new role
    const roleSelect = screen.getByLabelText('New Role');
    fireEvent.change(roleSelect, { target: { value: 'moderator' } });

    // Confirm bulk change
    const confirmButton = screen.getByText('Apply Changes');
    fireEvent.click(confirmButton);

    // Verify bulk update API calls
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });

    // Verify success message
    expect(screen.getByText('Bulk role changes applied successfully')).toBeInTheDocument();
  });
});

describe('Content Moderation Process Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock moderation queue data
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'mod-1',
                content_type: 'brand',
                content_id: 'brand-1',
                user_id: 'user-1',
                user_email: 'user@test.com',
                title: 'Test Brand',
                flagged_at: '2024-01-15',
                flag_reason: 'Inappropriate content',
                status: 'pending',
                risk_score: 0.8,
                content_preview: 'Brand content preview...',
              },
            ],
            error: null,
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: { id: 'mod-1' },
          error: null,
        }),
      }),
    });
    
    (supabase.from as any).mockImplementation(mockFrom);
  });

  it('should complete content approval workflow with real content', async () => {
    render(
      <TestWrapper>
        <ContentModerationPage />
      </TestWrapper>
    );

    // Wait for moderation queue to load
    await waitFor(() => {
      expect(screen.getByText('Test Brand')).toBeInTheDocument();
    });

    // Click on content item to review
    fireEvent.click(screen.getByText('Test Brand'));

    // Wait for content preview to load
    await waitFor(() => {
      expect(screen.getByText('Brand content preview...')).toBeInTheDocument();
    });

    // Approve content
    const approveButton = screen.getByText('Approve');
    fireEvent.click(approveButton);

    // Add approval notes
    const notesInput = screen.getByLabelText('Moderator Notes');
    fireEvent.change(notesInput, { target: { value: 'Content meets guidelines' } });

    // Confirm approval
    const confirmButton = screen.getByText('Confirm Approval');
    fireEvent.click(confirmButton);

    // Verify approval API call
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('content_moderation_queue');
    });

    // Verify success message
    expect(screen.getByText('Content approved successfully')).toBeInTheDocument();
  });

  it('should complete bulk content moderation workflow', async () => {
    render(
      <TestWrapper>
        <ContentModerationPage />
      </TestWrapper>
    );

    // Wait for moderation queue to load
    await waitFor(() => {
      expect(screen.getByText('Test Brand')).toBeInTheDocument();
    });

    // Select multiple content items
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]); // Select all checkbox
    
    // Open bulk moderation actions
    const bulkActionsButton = screen.getByText('Bulk Actions');
    fireEvent.click(bulkActionsButton);

    // Select approve all action
    const approveAllOption = screen.getByText('Approve Selected');
    fireEvent.click(approveAllOption);

    // Add bulk approval notes
    const notesInput = screen.getByLabelText('Bulk Moderation Notes');
    fireEvent.change(notesInput, { target: { value: 'Batch approval - content reviewed' } });

    // Confirm bulk approval
    const confirmButton = screen.getByText('Apply Bulk Action');
    fireEvent.click(confirmButton);

    // Verify bulk moderation API calls
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('content_moderation_queue');
    });

    // Verify success message
    expect(screen.getByText('Bulk moderation completed successfully')).toBeInTheDocument();
  });
});

describe('Subscription Management Integration with Stripe Webhooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock subscription data
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              user_id: 'user-1',
              user_email: 'user@test.com',
              stripe_customer_id: 'cus_test123',
              current_tier: 'pro',
              status: 'active',
              current_period_start: '2024-01-01',
              current_period_end: '2024-02-01',
              cancel_at_period_end: false,
              total_paid: 29.99,
            },
            error: null,
          }),
        }),
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({
            data: [
              {
                user_id: 'user-1',
                user_email: 'user@test.com',
                stripe_customer_id: 'cus_test123',
                current_tier: 'pro',
                status: 'active',
                current_period_start: '2024-01-01',
                current_period_end: '2024-02-01',
                cancel_at_period_end: false,
                total_paid: 29.99,
              },
            ],
            error: null,
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: { user_id: 'user-1' },
          error: null,
        }),
      }),
    });
    
    (supabase.from as any).mockImplementation(mockFrom);
  });

  it('should complete subscription refund workflow with Stripe integration', async () => {
    // Mock Stripe service
    const { StripeService } = await import('@/lib/admin/stripe-service');
    (StripeService.processRefund as any).mockResolvedValue({
      id: 'refund_test123',
      amount: 2999,
      status: 'succeeded',
    });

    render(
      <TestWrapper>
        <SubscriptionManagementPage />
      </TestWrapper>
    );

    // Wait for subscription list to load
    await waitFor(() => {
      expect(screen.getByText('user@test.com')).toBeInTheDocument();
    });

    // Click on subscription to open details
    fireEvent.click(screen.getByText('user@test.com'));

    // Wait for subscription details modal
    await waitFor(() => {
      expect(screen.getByText('Subscription Details')).toBeInTheDocument();
    });

    // Click refund button
    const refundButton = screen.getByText('Process Refund');
    fireEvent.click(refundButton);

    // Fill refund form
    const amountInput = screen.getByLabelText('Refund Amount');
    fireEvent.change(amountInput, { target: { value: '29.99' } });

    const reasonInput = screen.getByLabelText('Refund Reason');
    fireEvent.change(reasonInput, { target: { value: 'Customer request' } });

    // Confirm refund
    const confirmButton = screen.getByText('Process Refund');
    fireEvent.click(confirmButton);

    // Verify Stripe refund call
    await waitFor(() => {
      expect(StripeService.processRefund).toHaveBeenCalledWith({
        customerId: 'cus_test123',
        amount: 2999,
        reason: 'Customer request',
      });
    });

    // Verify success message
    expect(screen.getByText('Refund processed successfully')).toBeInTheDocument();
  });

  it('should handle Stripe webhook events correctly', async () => {
    const { StripeService } = await import('@/lib/admin/stripe-service');
    
    // Mock webhook event
    const webhookEvent = {
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_test123',
          customer: 'cus_test123',
          status: 'canceled',
          cancel_at_period_end: true,
        },
      },
    };

    (StripeService.handleWebhook as any).mockResolvedValue({
      processed: true,
      subscription_updated: true,
    });

    render(
      <TestWrapper>
        <SubscriptionManagementPage />
      </TestWrapper>
    );

    // Simulate webhook processing
    await waitFor(() => {
      expect(StripeService.handleWebhook).toHaveBeenCalledWith(webhookEvent);
    });

    // Verify subscription status update in UI
    await waitFor(() => {
      expect(screen.getByText('Subscription status updated')).toBeInTheDocument();
    });
  });

  it('should complete billing issue resolution workflow', async () => {
    render(
      <TestWrapper>
        <SubscriptionManagementPage />
      </TestWrapper>
    );

    // Navigate to billing issues tab
    const billingIssuesTab = screen.getByText('Billing Issues');
    fireEvent.click(billingIssuesTab);

    // Wait for billing issues to load
    await waitFor(() => {
      expect(screen.getByText('Payment Failed')).toBeInTheDocument();
    });

    // Click on billing issue
    fireEvent.click(screen.getByText('Payment Failed'));

    // Open resolution dialog
    const resolveButton = screen.getByText('Resolve Issue');
    fireEvent.click(resolveButton);

    // Select resolution type
    const resolutionSelect = screen.getByLabelText('Resolution Type');
    fireEvent.change(resolutionSelect, { target: { value: 'retry_payment' } });

    // Add resolution notes
    const notesInput = screen.getByLabelText('Resolution Notes');
    fireEvent.change(notesInput, { target: { value: 'Updated payment method' } });

    // Confirm resolution
    const confirmButton = screen.getByText('Resolve Issue');
    fireEvent.click(confirmButton);

    // Verify resolution API call
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('billing_issues');
    });

    // Verify success message
    expect(screen.getByText('Billing issue resolved successfully')).toBeInTheDocument();
  });
});

describe('Analytics and Monitoring System Accuracy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock analytics data
    const mockRpc = vi.fn().mockImplementation((functionName) => {
      switch (functionName) {
        case 'get_admin_system_metrics':
          return Promise.resolve({
            data: {
              active_users_24h: 150,
              total_content_generated: 1250,
              api_requests_24h: 5000,
              storage_usage: 2.5,
              ai_api_costs: 125.50,
            },
            error: null,
          });
        case 'get_user_analytics':
          return Promise.resolve({
            data: {
              new_users_today: 25,
              active_users_week: 500,
              retention_rate: 0.75,
              avg_session_duration: 1800,
            },
            error: null,
          });
        case 'get_performance_metrics':
          return Promise.resolve({
            data: {
              avg_response_time: 250,
              error_rate: 0.02,
              uptime_percentage: 99.9,
              database_connections: 45,
            },
            error: null,
          });
        default:
          return Promise.resolve({ data: null, error: null });
      }
    });
    
    (supabase.rpc as any).mockImplementation(mockRpc);
  });

  it('should display accurate system metrics in real-time', async () => {
    render(
      <TestWrapper>
        <AnalyticsPage />
      </TestWrapper>
    );

    // Wait for metrics to load
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument(); // Active users
      expect(screen.getByText('1,250')).toBeInTheDocument(); // Content generated
      expect(screen.getByText('5,000')).toBeInTheDocument(); // API requests
    });

    // Verify RPC calls for metrics
    expect(supabase.rpc).toHaveBeenCalledWith('get_admin_system_metrics');
    expect(supabase.rpc).toHaveBeenCalledWith('get_user_analytics');
    expect(supabase.rpc).toHaveBeenCalledWith('get_performance_metrics');
  });

  it('should validate performance monitoring accuracy', async () => {
    render(
      <TestWrapper>
        <AnalyticsPage />
      </TestWrapper>
    );

    // Navigate to performance tab
    const performanceTab = screen.getByText('Performance');
    fireEvent.click(performanceTab);

    // Wait for performance metrics to load
    await waitFor(() => {
      expect(screen.getByText('250ms')).toBeInTheDocument(); // Response time
      expect(screen.getByText('2%')).toBeInTheDocument(); // Error rate
      expect(screen.getByText('99.9%')).toBeInTheDocument(); // Uptime
    });

    // Verify performance data accuracy
    expect(screen.getByText('System Performance')).toBeInTheDocument();
    expect(screen.getByText('Database Connections: 45')).toBeInTheDocument();
  });

  it('should test alerting system functionality', async () => {
    // Mock alert conditions
    const mockRpc = vi.fn().mockResolvedValue({
      data: {
        alerts: [
          {
            id: 'alert-1',
            type: 'high_error_rate',
            severity: 'critical',
            message: 'Error rate exceeded 5%',
            created_at: new Date().toISOString(),
          },
        ],
      },
      error: null,
    });
    
    (supabase.rpc as any).mockImplementation(mockRpc);

    render(
      <TestWrapper>
        <AnalyticsPage />
      </TestWrapper>
    );

    // Navigate to alerts tab
    const alertsTab = screen.getByText('Alerts');
    fireEvent.click(alertsTab);

    // Wait for alerts to load
    await waitFor(() => {
      expect(screen.getByText('Error rate exceeded 5%')).toBeInTheDocument();
    });

    // Verify alert severity display
    expect(screen.getByText('Critical')).toBeInTheDocument();

    // Test alert acknowledgment
    const acknowledgeButton = screen.getByText('Acknowledge');
    fireEvent.click(acknowledgeButton);

    // Verify acknowledgment API call
    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('acknowledge_alert', { alert_id: 'alert-1' });
    });
  });
});

describe('Security Features and Compliance Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock security data
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'audit-1',
              admin_user_id: 'admin-1',
              action_type: 'user_suspension',
              target_type: 'user',
              target_id: 'user-1',
              details: { reason: 'Policy violation' },
              ip_address: '192.168.1.1',
              created_at: '2024-01-15T10:00:00Z',
            },
          ],
          error: null,
        }),
      }),
    });
    
    (supabase.from as any).mockImplementation(mockFrom);
  });

  it('should validate audit trail integrity', async () => {
    render(
      <TestWrapper>
        <SecurityPage />
      </TestWrapper>
    );

    // Navigate to audit logs tab
    const auditTab = screen.getByText('Audit Logs');
    fireEvent.click(auditTab);

    // Wait for audit logs to load
    await waitFor(() => {
      expect(screen.getByText('user_suspension')).toBeInTheDocument();
    });

    // Verify audit log details
    expect(screen.getByText('Policy violation')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();

    // Test audit log export
    const exportButton = screen.getByText('Export Audit Logs');
    fireEvent.click(exportButton);

    // Verify export functionality
    await waitFor(() => {
      expect(screen.getByText('Audit logs exported successfully')).toBeInTheDocument();
    });
  });

  it('should test GDPR compliance workflows', async () => {
    render(
      <TestWrapper>
        <SecurityPage />
      </TestWrapper>
    );

    // Navigate to GDPR compliance tab
    const gdprTab = screen.getByText('GDPR Compliance');
    fireEvent.click(gdprTab);

    // Test data export request
    const exportButton = screen.getByText('Export User Data');
    fireEvent.click(exportButton);

    // Fill user ID for export
    const userIdInput = screen.getByLabelText('User ID');
    fireEvent.change(userIdInput, { target: { value: 'user-1' } });

    // Confirm export
    const confirmButton = screen.getByText('Generate Export');
    fireEvent.click(confirmButton);

    // Verify export API call
    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('export_user_data', { user_id: 'user-1' });
    });

    // Test data deletion workflow
    const deleteButton = screen.getByText('Delete User Data');
    fireEvent.click(deleteButton);

    // Fill deletion form
    const deleteUserIdInput = screen.getByLabelText('User ID for Deletion');
    fireEvent.change(deleteUserIdInput, { target: { value: 'user-1' } });

    const confirmationInput = screen.getByLabelText('Type DELETE to confirm');
    fireEvent.change(confirmationInput, { target: { value: 'DELETE' } });

    // Confirm deletion
    const confirmDeleteButton = screen.getByText('Delete User Data');
    fireEvent.click(confirmDeleteButton);

    // Verify deletion API call
    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('delete_user_data_gdpr', { user_id: 'user-1' });
    });
  });

  it('should validate multi-factor authentication workflow', async () => {
    render(
      <TestWrapper>
        <SecurityPage />
      </TestWrapper>
    );

    // Navigate to MFA settings
    const mfaTab = screen.getByText('Multi-Factor Authentication');
    fireEvent.click(mfaTab);

    // Enable MFA for admin
    const enableMfaButton = screen.getByText('Enable MFA');
    fireEvent.click(enableMfaButton);

    // Wait for QR code generation
    await waitFor(() => {
      expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
    });

    // Enter verification code
    const codeInput = screen.getByLabelText('Verification Code');
    fireEvent.change(codeInput, { target: { value: '123456' } });

    // Confirm MFA setup
    const confirmMfaButton = screen.getByText('Verify and Enable');
    fireEvent.click(confirmMfaButton);

    // Verify MFA setup API call
    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('setup_admin_mfa', { 
        verification_code: '123456' 
      });
    });

    // Verify success message
    expect(screen.getByText('MFA enabled successfully')).toBeInTheDocument();
  });
});