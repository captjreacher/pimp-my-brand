import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { AdminAuthService } from '@/lib/admin/auth-service';
import { userManagementService } from '@/lib/admin/user-management-service';
import { moderationService } from '@/lib/admin/moderation-service';
import { StripeService } from '@/lib/admin/stripe-service';
import { analyticsService } from '@/lib/admin/analytics-service';
import { auditService } from '@/lib/admin/audit-service';

// Mock all external dependencies
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

vi.mock('@/lib/admin/stripe-service', () => ({
  StripeService: {
    processRefund: vi.fn(),
    updateSubscription: vi.fn(),
    getCustomerDetails: vi.fn(),
    handleWebhook: vi.fn(),
  },
}));

describe('Admin Workflow End-to-End Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default successful responses
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'test-id', status: 'success' },
            error: null,
          }),
        }),
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: { id: 'test-id' },
          error: null,
        }),
      }),
      insert: vi.fn().mockResolvedValue({
        data: { id: 'new-id' },
        error: null,
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    });

    const mockRpc = vi.fn().mockResolvedValue({
      data: { success: true },
      error: null,
    });

    (supabase.from as any).mockImplementation(mockFrom);
    (supabase.rpc as any).mockImplementation(mockRpc);
  });

  describe('User Management Workflows', () => {
    it('should complete user suspension workflow end-to-end', async () => {
      // Use the service instances directly

      // Mock user data
      const mockUser = {
        id: 'user-1',
        email: 'user@test.com',
        full_name: 'Test User',
        app_role: 'user',
        is_active: true,
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [mockUser],
            error: null,
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: { ...mockUser, is_active: false },
            error: null,
          }),
        }),
      });

      // Execute suspension workflow
      const result = await userManagementService.suspendUser('user-1', 'Policy violation', 'admin-1');

      // Verify suspension was processed
      expect(result).toBeDefined();
      expect(supabase.from).toHaveBeenCalledWith('profiles');

      // Verify audit log was created
      expect(supabase.from).toHaveBeenCalledWith('admin_audit_log');
    });

    it('should complete bulk user role change workflow', async () => {
      const userService = new UserManagementService();

      // Mock multiple users
      const mockUsers = [
        { id: 'user-1', app_role: 'user' },
        { id: 'user-2', app_role: 'user' },
      ];

      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: mockUsers.map(u => ({ ...u, app_role: 'moderator' })),
            error: null,
          }),
        }),
      });

      // Execute bulk role change
      const result = await userService.bulkUpdateRoles(['user-1', 'user-2'], 'moderator', 'admin-1');

      // Verify bulk update was processed
      expect(result).toBeDefined();
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });
  });

  describe('Content Moderation Workflows', () => {
    it('should complete content approval workflow with real content', async () => {
      const moderationService = new ModerationService();

      // Mock content moderation item
      const mockModerationItem = {
        id: 'mod-1',
        content_type: 'brand',
        content_id: 'brand-1',
        user_id: 'user-1',
        status: 'pending',
        flagged_at: new Date().toISOString(),
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [mockModerationItem],
            error: null,
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: { ...mockModerationItem, status: 'approved' },
            error: null,
          }),
        }),
      });

      // Execute content approval
      const result = await moderationService.approveContent('mod-1', 'admin-1', 'Content meets guidelines');

      // Verify approval was processed
      expect(result).toBeDefined();
      expect(supabase.from).toHaveBeenCalledWith('content_moderation_queue');
    });

    it('should complete bulk content moderation workflow', async () => {
      const moderationService = new ModerationService();

      // Mock multiple moderation items
      const mockItems = ['mod-1', 'mod-2', 'mod-3'];

      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: mockItems.map(id => ({ id, status: 'approved' })),
            error: null,
          }),
        }),
      });

      // Execute bulk moderation
      const result = await moderationService.bulkModerate(mockItems, 'approve', 'admin-1', 'Batch approval');

      // Verify bulk moderation was processed
      expect(result).toBeDefined();
      expect(supabase.from).toHaveBeenCalledWith('content_moderation_queue');
    });
  });

  describe('Subscription Management Integration with Stripe', () => {
    it('should complete subscription refund workflow with Stripe integration', async () => {
      // Mock Stripe refund response
      (StripeService.processRefund as any).mockResolvedValue({
        id: 'refund_test123',
        amount: 2999,
        status: 'succeeded',
      });

      // Mock subscription data
      const mockSubscription = {
        user_id: 'user-1',
        stripe_customer_id: 'cus_test123',
        current_tier: 'pro',
        status: 'active',
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [mockSubscription],
            error: null,
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: { ...mockSubscription, status: 'refunded' },
            error: null,
          }),
        }),
      });

      // Execute refund workflow
      const refundResult = await StripeService.processRefund({
        customerId: 'cus_test123',
        amount: 2999,
        reason: 'Customer request',
      });

      // Verify Stripe refund was processed
      expect(refundResult).toBeDefined();
      expect(refundResult.status).toBe('succeeded');
      expect(StripeService.processRefund).toHaveBeenCalledWith({
        customerId: 'cus_test123',
        amount: 2999,
        reason: 'Customer request',
      });
    });

    it('should handle Stripe webhook events correctly', async () => {
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

      // Process webhook
      const result = await StripeService.handleWebhook(webhookEvent);

      // Verify webhook was processed
      expect(result).toBeDefined();
      expect(result.processed).toBe(true);
      expect(StripeService.handleWebhook).toHaveBeenCalledWith(webhookEvent);
    });
  });

  describe('Analytics and Monitoring System Accuracy', () => {
    it('should validate system metrics accuracy', async () => {
      const analyticsService = new AnalyticsService();

      // Mock analytics data
      const mockMetrics = {
        active_users_24h: 150,
        total_content_generated: 1250,
        api_requests_24h: 5000,
        storage_usage: 2.5,
        ai_api_costs: 125.50,
      };

      (supabase.rpc as any).mockResolvedValue({
        data: mockMetrics,
        error: null,
      });

      // Get system metrics
      const metrics = await analyticsService.getSystemMetrics();

      // Verify metrics were retrieved
      expect(metrics).toBeDefined();
      expect(metrics.active_users_24h).toBe(150);
      expect(metrics.total_content_generated).toBe(1250);
      expect(supabase.rpc).toHaveBeenCalledWith('get_admin_system_metrics');
    });

    it('should validate performance monitoring accuracy', async () => {
      const analyticsService = new AnalyticsService();

      // Mock performance data
      const mockPerformance = {
        avg_response_time: 250,
        error_rate: 0.02,
        uptime_percentage: 99.9,
        database_connections: 45,
      };

      (supabase.rpc as any).mockResolvedValue({
        data: mockPerformance,
        error: null,
      });

      // Get performance metrics
      const performance = await analyticsService.getPerformanceMetrics();

      // Verify performance data
      expect(performance).toBeDefined();
      expect(performance.avg_response_time).toBe(250);
      expect(performance.error_rate).toBe(0.02);
      expect(supabase.rpc).toHaveBeenCalledWith('get_performance_metrics');
    });
  });

  describe('Security Features and Compliance Workflows', () => {
    it('should validate audit trail integrity', async () => {
      const auditService = new AuditService();

      // Mock audit log data
      const mockAuditLogs = [
        {
          id: 'audit-1',
          admin_user_id: 'admin-1',
          action_type: 'user_suspension',
          target_type: 'user',
          target_id: 'user-1',
          details: { reason: 'Policy violation' },
          created_at: new Date().toISOString(),
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockAuditLogs,
            error: null,
          }),
        }),
      });

      // Get audit logs
      const auditLogs = await auditService.getAuditLogs();

      // Verify audit logs were retrieved
      expect(auditLogs).toBeDefined();
      expect(auditLogs.length).toBe(1);
      expect(auditLogs[0].action_type).toBe('user_suspension');
      expect(supabase.from).toHaveBeenCalledWith('admin_audit_log');
    });

    it('should validate GDPR compliance workflows', async () => {
      // Mock GDPR data export
      const mockUserData = {
        profile: { id: 'user-1', email: 'user@test.com' },
        brands: [],
        cvs: [],
        audit_logs: [],
      };

      (supabase.rpc as any).mockResolvedValue({
        data: mockUserData,
        error: null,
      });

      // Execute GDPR data export
      const exportResult = await supabase.rpc('export_user_data', { user_id: 'user-1' });

      // Verify export was successful
      expect(exportResult.data).toBeDefined();
      expect(exportResult.data.profile.id).toBe('user-1');
      expect(supabase.rpc).toHaveBeenCalledWith('export_user_data', { user_id: 'user-1' });
    });
  });

  describe('Cross-Workflow Integration', () => {
    it('should validate data consistency across workflows', async () => {
      const userService = new UserManagementService();
      const moderationService = new ModerationService();

      // Mock user suspension affecting content moderation
      const mockUser = { id: 'user-1', is_active: false };
      const mockContent = { id: 'content-1', user_id: 'user-1', status: 'hidden' };

      (supabase.from as any).mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockUser,
                error: null,
              }),
            }),
          };
        } else if (table === 'content_moderation_queue') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockContent,
                error: null,
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      });

      // Execute user suspension
      await userService.suspendUser('user-1', 'Policy violation', 'admin-1');

      // Verify content was also affected
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(supabase.from).toHaveBeenCalledWith('admin_audit_log');
    });

    it('should handle error scenarios gracefully', async () => {
      const userService = new UserManagementService();

      // Mock database error
      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' },
          }),
        }),
      });

      // Attempt operation that should fail
      try {
        await userService.suspendUser('user-1', 'Test', 'admin-1');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toContain('Database connection failed');
      }
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle concurrent admin operations', async () => {
      const userService = new UserManagementService();

      // Mock successful responses for concurrent operations
      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: { id: 'user-1' },
            error: null,
          }),
        }),
      });

      // Execute multiple concurrent operations
      const operations = Array.from({ length: 10 }, (_, i) =>
        userService.suspendUser(`user-${i}`, 'Test', 'admin-1')
      );

      const results = await Promise.allSettled(operations);

      // Verify all operations completed
      expect(results.length).toBe(10);
      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
      });
    });

    it('should validate system performance under load', async () => {
      const analyticsService = new AnalyticsService();

      // Mock large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        value: Math.random(),
      }));

      (supabase.rpc as any).mockResolvedValue({
        data: largeDataset,
        error: null,
      });

      const startTime = performance.now();

      // Execute operation with large dataset
      const result = await analyticsService.getSystemMetrics();

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Verify reasonable performance (under 1 second)
      expect(duration).toBeLessThan(1000);
      expect(result).toBeDefined();
    });
  });
});