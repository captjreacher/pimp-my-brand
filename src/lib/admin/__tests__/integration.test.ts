import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { adminIntegrationService } from '../integration-service';
import { auditService } from '../audit-service';
import { userManagementService } from '../user-management-service';
import { moderationService } from '../moderation-service';
import { analyticsService } from '../analytics-service';
import { configService } from '../config-service';
import { notificationService } from '../notification-service';

// Mock all services
vi.mock('../audit-service');
vi.mock('../user-management-service');
vi.mock('../moderation-service');
vi.mock('../analytics-service');
vi.mock('../config-service');
vi.mock('../notification-service');

describe('Admin Integration Service', () => {
  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@test.com',
    app_role: 'admin' as const,
    admin_permissions: ['manage_users', 'moderate_content'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('executeOperation', () => {
    it('should execute operation with audit logging', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success');
      const mockAuditId = 'audit-123';

      vi.mocked(auditService.logAction).mockResolvedValue(mockAuditId);
      vi.mocked(auditService.updateActionResult).mockResolvedValue();

      const result = await adminIntegrationService.executeOperation(
        mockOperation,
        {
          adminUser: mockAdminUser,
          action: 'test_action',
          targetType: 'user',
          targetId: 'user-123',
        }
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.auditId).toBe(mockAuditId);
      expect(auditService.logAction).toHaveBeenCalledWith({
        admin_user_id: mockAdminUser.id,
        action_type: 'test_action',
        target_type: 'user',
        target_id: 'user-123',
        details: {},
        ip_address: '127.0.0.1',
        user_agent: expect.any(String),
      });
      expect(auditService.updateActionResult).toHaveBeenCalledWith(
        mockAuditId,
        expect.objectContaining({
          success: true,
          duration: expect.any(Number),
          result_data: { value: 'success' },
        })
      );
    });

    it('should handle operation errors with audit logging', async () => {
      const mockError = new Error('Operation failed');
      const mockOperation = vi.fn().mockRejectedValue(mockError);
      const mockAuditId = 'audit-123';

      vi.mocked(auditService.logAction).mockResolvedValue(mockAuditId);
      vi.mocked(auditService.updateActionResult).mockResolvedValue();

      const result = await adminIntegrationService.executeOperation(
        mockOperation,
        {
          adminUser: mockAdminUser,
          action: 'test_action',
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(mockError);
      expect(result.auditId).toBe(mockAuditId);
      expect(auditService.updateActionResult).toHaveBeenCalledWith(
        mockAuditId,
        expect.objectContaining({
          success: false,
          duration: expect.any(Number),
          error_message: 'Operation failed',
          error_stack: expect.any(String),
        })
      );
    });
  });

  describe('executeBatchOperation', () => {
    it('should process items in batches', async () => {
      const items = ['item1', 'item2', 'item3', 'item4', 'item5'];
      const mockOperation = vi.fn().mockImplementation((item: string) => 
        Promise.resolve(`processed-${item}`)
      );

      vi.mocked(auditService.logAction).mockResolvedValue('audit-123');
      vi.mocked(auditService.updateActionResult).mockResolvedValue();

      // Update config to use smaller batch size for testing
      adminIntegrationService.updateConfig({ batchSize: 2 });

      const result = await adminIntegrationService.executeBatchOperation(
        items,
        mockOperation,
        {
          adminUser: mockAdminUser,
          action: 'batch_test',
          getTargetId: (item) => item,
        }
      );

      expect(result.summary.total).toBe(5);
      expect(result.summary.successful).toBe(5);
      expect(result.summary.failed).toBe(0);
      expect(result.results).toHaveLength(5);
      expect(mockOperation).toHaveBeenCalledTimes(5);
    });

    it('should handle partial failures in batch operations', async () => {
      const items = ['item1', 'item2', 'item3'];
      const mockOperation = vi.fn().mockImplementation((item: string) => {
        if (item === 'item2') {
          return Promise.reject(new Error('Item 2 failed'));
        }
        return Promise.resolve(`processed-${item}`);
      });

      vi.mocked(auditService.logAction).mockResolvedValue('audit-123');
      vi.mocked(auditService.updateActionResult).mockImplementation((auditId, result) => {
        // Simulate audit service handling both success and failure cases
        return Promise.resolve();
      });

      const result = await adminIntegrationService.executeBatchOperation(
        items,
        mockOperation,
        {
          adminUser: mockAdminUser,
          action: 'batch_test',
          getTargetId: (item) => item,
        }
      );

      expect(result.summary.total).toBe(3);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(1);
      expect(result.summary.warnings).toContain('1 out of 3 items failed to process');
    });
  });

  describe('event system', () => {
    it('should emit and handle events', async () => {
      const mockCallback = vi.fn();
      
      adminIntegrationService.addEventListener('test:event', mockCallback);
      adminIntegrationService.emitEvent('test:event', { data: 'test' });

      expect(mockCallback).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should remove event listeners', () => {
      const mockCallback = vi.fn();
      
      adminIntegrationService.addEventListener('test:event', mockCallback);
      adminIntegrationService.removeEventListener('test:event', mockCallback);
      adminIntegrationService.emitEvent('test:event', { data: 'test' });

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('health check', () => {
    it('should perform health check on all services', async () => {
      // Mock health check methods for services that have them
      const mockHealthCheck = vi.fn().mockResolvedValue(undefined);
      
      vi.mocked(auditService).healthCheck = mockHealthCheck;
      vi.mocked(userManagementService).healthCheck = mockHealthCheck;
      vi.mocked(moderationService).healthCheck = mockHealthCheck;
      vi.mocked(analyticsService).healthCheck = mockHealthCheck;
      vi.mocked(configService).healthCheck = mockHealthCheck;
      vi.mocked(notificationService).healthCheck = mockHealthCheck;

      const result = await adminIntegrationService.performHealthCheck();

      expect(result.overall).toBe('healthy');
      expect(Object.keys(result.services)).toHaveLength(6);
      expect(result.services.audit.status).toBe('up');
      expect(result.services.userManagement.status).toBe('up');
      expect(result.services.moderation.status).toBe('up');
      expect(result.services.analytics.status).toBe('up');
      expect(result.services.config.status).toBe('up');
      expect(result.services.notification.status).toBe('up');
    });

    it('should handle service failures in health check', async () => {
      const mockHealthCheck = vi.fn().mockRejectedValue(new Error('Service down'));
      
      vi.mocked(auditService).healthCheck = mockHealthCheck;
      vi.mocked(userManagementService).healthCheck = vi.fn().mockResolvedValue(undefined);
      vi.mocked(moderationService).healthCheck = vi.fn().mockResolvedValue(undefined);
      vi.mocked(analyticsService).healthCheck = vi.fn().mockResolvedValue(undefined);
      vi.mocked(configService).healthCheck = vi.fn().mockResolvedValue(undefined);
      vi.mocked(notificationService).healthCheck = vi.fn().mockResolvedValue(undefined);

      const result = await adminIntegrationService.performHealthCheck();

      expect(result.overall).toBe('degraded');
      expect(result.services.audit.status).toBe('down');
      expect(result.services.audit.error).toBe('Service down');
    });
  });

  describe('cross-service event handling', () => {
    it('should handle user suspension events', async () => {
      vi.mocked(moderationService.handleUserSuspended).mockResolvedValue();
      vi.mocked(analyticsService.recordUserEvent).mockResolvedValue();
      vi.mocked(notificationService.sendAdminNotification).mockResolvedValue();

      adminIntegrationService.emitEvent('user:suspended', {
        userId: 'user-123',
        reason: 'violation',
        adminId: 'admin-123',
      });

      // Wait for async event handlers
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(moderationService.handleUserSuspended).toHaveBeenCalledWith('user-123');
      expect(analyticsService.recordUserEvent).toHaveBeenCalledWith('user_suspended', {
        userId: 'user-123',
        reason: 'violation',
        adminId: 'admin-123',
      });
      expect(notificationService.sendAdminNotification).toHaveBeenCalledWith({
        type: 'user_action',
        title: 'User Suspended',
        message: 'User user-123 has been suspended',
        recipients: ['admin', 'moderator'],
      });
    });

    it('should handle content flagging events', async () => {
      vi.mocked(moderationService.addToQueue).mockResolvedValue();
      vi.mocked(analyticsService.recordContentEvent).mockResolvedValue();
      vi.mocked(notificationService.sendAdminNotification).mockResolvedValue();

      adminIntegrationService.emitEvent('content:flagged', {
        contentId: 'content-123',
        contentType: 'brand',
        reason: 'inappropriate',
        userId: 'user-123',
      });

      // Wait for async event handlers
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(moderationService.addToQueue).toHaveBeenCalledWith({
        contentId: 'content-123',
        contentType: 'brand',
        flagReason: 'inappropriate',
        userId: 'user-123',
      });
      expect(analyticsService.recordContentEvent).toHaveBeenCalledWith('content_flagged', {
        contentId: 'content-123',
        contentType: 'brand',
        reason: 'inappropriate',
      });
      expect(notificationService.sendAdminNotification).toHaveBeenCalledWith({
        type: 'content_moderation',
        title: 'Content Flagged',
        message: 'brand content has been flagged for review',
        recipients: ['moderator', 'admin'],
      });
    });
  });

  describe('configuration management', () => {
    it('should update configuration', () => {
      const newConfig = {
        batchSize: 20,
        enableNotifications: false,
      };

      adminIntegrationService.updateConfig(newConfig);
      const config = adminIntegrationService.getConfig();

      expect(config.batchSize).toBe(20);
      expect(config.enableNotifications).toBe(false);
      expect(config.enableAuditLogging).toBe(true); // Should preserve existing values
    });

    it('should get current configuration', () => {
      const config = adminIntegrationService.getConfig();

      expect(config).toHaveProperty('enableAuditLogging');
      expect(config).toHaveProperty('enableRealTimeUpdates');
      expect(config).toHaveProperty('enableNotifications');
      expect(config).toHaveProperty('enablePerformanceMonitoring');
      expect(config).toHaveProperty('batchSize');
      expect(config).toHaveProperty('retryAttempts');
    });
  });
});