import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  supabaseMock,
  handleServiceErrorMock,
  logErrorMock,
  processRefundMock,
  modifySubscriptionMock,
  cancelSubscriptionMock
} = vi.hoisted(() => {
  const supabase = {
    rpc: vi.fn(),
    from: vi.fn(),
    auth: { getUser: vi.fn() }
  };

  const handleServiceError = vi.fn((error: unknown, operation: string) => ({
    code: 'SERVICE_ERROR',
    message: `Failed to ${operation}`,
    details: error,
    timestamp: new Date()
  }));

  return {
    supabaseMock: supabase,
    handleServiceErrorMock: handleServiceError,
    logErrorMock: vi.fn(),
    processRefundMock: vi.fn(),
    modifySubscriptionMock: vi.fn(),
    cancelSubscriptionMock: vi.fn()
  };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: supabaseMock
}));

vi.mock('@/lib/admin/error-handler', () => ({
  adminErrorHandler: {
    handleDatabaseError: vi.fn(),
    handleServiceError: handleServiceErrorMock,
    logError: logErrorMock
  }
}));

vi.mock('@/lib/admin/stripe-service', () => ({
  StripeAdminService: {
    processRefund: processRefundMock,
    modifySubscription: modifySubscriptionMock,
    cancelSubscription: cancelSubscriptionMock
  }
}));

import { logAdminAction } from '@/lib/admin/middleware';
import { consolidatedAdminService } from '@/lib/admin/consolidated-admin-service';
import { SubscriptionManagementAPI } from '@/lib/admin/api/subscription-management-api';
import { StripeAdminService } from '@/lib/admin/stripe-service';

describe('admin audit helpers', () => {
  beforeEach(() => {
    supabaseMock.rpc.mockReset();
    supabaseMock.from.mockReset();
    logErrorMock.mockReset();
    handleServiceErrorMock.mockClear();
    processRefundMock.mockReset();
  });

  describe('logAdminAction', () => {
    it('returns log identifier when Supabase RPC succeeds', async () => {
      supabaseMock.rpc.mockResolvedValue({ data: 'log-id', error: null });

      await expect(logAdminAction('test_action')).resolves.toBe('log-id');
      expect(supabaseMock.rpc).toHaveBeenCalledWith('log_admin_action', expect.objectContaining({
        p_action_type: 'test_action'
      }));
    });

    it('throws when Supabase RPC reports an error', async () => {
      const supabaseError = new Error('rpc failure');
      supabaseMock.rpc.mockResolvedValue({ data: null, error: supabaseError });

      await expect(logAdminAction('test_action')).rejects.toBe(supabaseError);
    });
  });

  describe('consolidatedAdminService.approveContent', () => {
    it('returns true when audit log insert succeeds', async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null });
      supabaseMock.from.mockReturnValue({ insert: insertMock });

      const result = await consolidatedAdminService.approveContent('content-1', 'admin-1');

      expect(result).toBe(true);
      expect(supabaseMock.from).toHaveBeenCalledWith('admin_audit_log');
      expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
        action_type: 'content_approved',
        admin_user_id: 'admin-1',
        target_id: 'content-1'
      }));
    });

    it('returns false and logs error when audit log insert fails', async () => {
      const supabaseError = new Error('insert failure');
      const insertMock = vi.fn().mockResolvedValue({ error: supabaseError });
      supabaseMock.from.mockReturnValue({ insert: insertMock });

      const result = await consolidatedAdminService.approveContent('content-2', 'admin-2');

      expect(result).toBe(false);
      expect(handleServiceErrorMock).toHaveBeenCalledWith(supabaseError, 'approve content');
      expect(logErrorMock).toHaveBeenCalled();
    });
  });

  describe('SubscriptionManagementAPI.processRefund', () => {
    const baseRequest = {
      subscription_id: 'sub_1',
      amount: 1000,
      reason: 'test reason',
      notify_customer: false
    };

    it('returns true when refund and logging succeed', async () => {
      processRefundMock.mockResolvedValue({
        id: 'refund_1',
        amount: 1000
      });
      supabaseMock.rpc.mockResolvedValue({ data: 'log-id', error: null });

      await expect(SubscriptionManagementAPI.processRefund(baseRequest, 'admin-1')).resolves.toBe(true);
      expect(supabaseMock.rpc).toHaveBeenCalledWith('log_admin_action', expect.objectContaining({
        p_action_type: 'refund_processed',
        p_admin_user_id: 'admin-1'
      }));
    });

    it('throws when audit logging fails after refund processing', async () => {
      processRefundMock.mockResolvedValue({
        id: 'refund_2',
        amount: 500
      });
      const logError = new Error('log failure');
      supabaseMock.rpc.mockResolvedValue({ data: null, error: logError });

      await expect(SubscriptionManagementAPI.processRefund(baseRequest, 'admin-2')).rejects.toBe(logError);
    });
  });
});
