import { toast } from 'sonner';
import { auditService } from './audit-service';
import { userManagementService } from './user-management-service';
import { moderationService } from './moderation-service';
import { adminAnalyticsService as analyticsService } from './analytics-service';
import { ConfigService as configService } from './config-service';
import { adminNotificationService as notificationService } from './notification-service';
import type { AdminUser, AdminPermission } from './types';

interface IntegrationConfig {
  enableAuditLogging: boolean;
  enableRealTimeUpdates: boolean;
  enableNotifications: boolean;
  enablePerformanceMonitoring: boolean;
  batchSize: number;
  retryAttempts: number;
}

interface OperationContext {
  adminUser: AdminUser;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, any>;
}

interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  warnings?: string[];
  auditId?: string;
}

class AdminIntegrationService {
  private config: IntegrationConfig = {
    enableAuditLogging: true,
    enableRealTimeUpdates: true,
    enableNotifications: true,
    enablePerformanceMonitoring: true,
    batchSize: 10,
    retryAttempts: 3,
  };

  private eventListeners: Map<string, Array<(data: any) => void>> = new Map();

  constructor() {
    this.initializeIntegrations();
  }

  private initializeIntegrations() {
    // Set up cross-service event listeners
    this.setupEventListeners();
    
    // Initialize performance monitoring
    if (this.config.enablePerformanceMonitoring) {
      this.initializePerformanceMonitoring();
    }

    // Initialize real-time updates
    if (this.config.enableRealTimeUpdates) {
      this.initializeRealTimeUpdates();
    }
  }

  private setupEventListeners() {
    // User management events
    this.addEventListener('user:suspended', async (data) => {
      await this.handleUserSuspended(data);
    });

    this.addEventListener('user:role_changed', async (data) => {
      await this.handleUserRoleChanged(data);
    });

    // Content moderation events
    this.addEventListener('content:flagged', async (data) => {
      await this.handleContentFlagged(data);
    });

    this.addEventListener('content:approved', async (data) => {
      await this.handleContentApproved(data);
    });

    // System events
    this.addEventListener('system:config_changed', async (data) => {
      await this.handleSystemConfigChanged(data);
    });

    this.addEventListener('system:alert', async (data) => {
      await this.handleSystemAlert(data);
    });
  }

  private initializePerformanceMonitoring() {
    // Monitor API response times
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      try {
        const response = await originalFetch(...args);
        const endTime = Date.now();
        
        // Log slow API calls
        if (endTime - startTime > 2000) {
          console.warn(`Slow API call detected: ${args[0]} took ${endTime - startTime}ms`);
          this.emitEvent('performance:slow_api', {
            url: args[0],
            duration: endTime - startTime,
            timestamp: new Date().toISOString(),
          });
        }

        return response;
      } catch (error) {
        const endTime = Date.now();
        this.emitEvent('performance:api_error', {
          url: args[0],
          duration: endTime - startTime,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });
        throw error;
      }
    };
  }

  private initializeRealTimeUpdates() {
    // Set up WebSocket or polling for real-time updates
    // This would typically connect to a WebSocket server or set up polling
    console.log('Real-time updates initialized');
  }

  // Event system
  addEventListener(event: string, callback: (data: any) => void) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  removeEventListener(event: string, callback: (data: any) => void) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emitEvent(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Integrated operations with cross-cutting concerns
  async executeOperation<T>(
    operation: () => Promise<T>,
    context: OperationContext
  ): Promise<OperationResult<T>> {
    const startTime = Date.now();
    let auditId: string | undefined;

    try {
      // Pre-operation audit logging
      if (this.config.enableAuditLogging) {
        auditId = await auditService.logAction({
          admin_user_id: context.adminUser.id,
          action_type: context.action,
          target_type: context.targetType,
          target_id: context.targetId,
          details: context.metadata || {},
          ip_address: '127.0.0.1', // Would be actual IP in production
          user_agent: navigator.userAgent,
        });
      }

      // Execute the operation
      const result = await operation();
      const endTime = Date.now();

      // Post-operation logging
      if (auditId) {
        await auditService.updateActionResult(auditId, {
          success: true,
          duration: endTime - startTime,
          result_data: typeof result === 'object' ? result : { value: result },
        });
      }

      // Emit success event
      this.emitEvent(`${context.action}:success`, {
        context,
        result,
        duration: endTime - startTime,
      });

      // Show success notification
      if (this.config.enableNotifications) {
        toast.success(`${context.action} completed successfully`);
      }

      return {
        success: true,
        data: result,
        auditId,
      };

    } catch (error) {
      const endTime = Date.now();
      const err = error as Error;

      // Error audit logging
      if (auditId) {
        await auditService.updateActionResult(auditId, {
          success: false,
          duration: endTime - startTime,
          error_message: err.message,
          error_stack: err.stack,
        });
      }

      // Emit error event
      this.emitEvent(`${context.action}:error`, {
        context,
        error: err,
        duration: endTime - startTime,
      });

      // Show error notification
      if (this.config.enableNotifications) {
        toast.error(`${context.action} failed: ${err.message}`);
      }

      return {
        success: false,
        error: err,
        auditId,
      };
    }
  }

  // Batch operations with integrated error handling
  async executeBatchOperation<T, R>(
    items: T[],
    operation: (item: T) => Promise<R>,
    context: Omit<OperationContext, 'targetId'> & { 
      getTargetId: (item: T) => string;
      onProgress?: (completed: number, total: number) => void;
    }
  ): Promise<{
    results: Array<{ item: T; result?: R; error?: Error }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
      warnings: string[];
    };
  }> {
    const results: Array<{ item: T; result?: R; error?: Error }> = [];
    const warnings: string[] = [];
    let successful = 0;
    let failed = 0;

    // Process in batches
    for (let i = 0; i < items.length; i += this.config.batchSize) {
      const batch = items.slice(i, i + this.config.batchSize);
      
      const batchPromises = batch.map(async (item) => {
        const itemContext: OperationContext = {
          ...context,
          targetId: context.getTargetId(item),
        };

        const result = await this.executeOperation(
          () => operation(item),
          itemContext
        );

        if (result.success) {
          successful++;
          return { item, result: result.data };
        } else {
          failed++;
          return { item, error: result.error };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Report progress
      context.onProgress?.(Math.min(i + this.config.batchSize, items.length), items.length);
    }

    // Generate warnings for partial failures
    if (failed > 0 && successful > 0) {
      warnings.push(`${failed} out of ${items.length} items failed to process`);
    }

    return {
      results,
      summary: {
        total: items.length,
        successful,
        failed,
        warnings,
      },
    };
  }

  // Event handlers for cross-service integration
  private async handleUserSuspended(data: { userId: string; reason: string; adminId: string }) {
    try {
      // Notify other services about user suspension
      await moderationService.handleUserSuspended(data.userId);
      
      // Update analytics
      await analyticsService.recordUserEvent('user_suspended', {
        userId: data.userId,
        reason: data.reason,
        adminId: data.adminId,
      });

      // Send notification to relevant admins
      if (this.config.enableNotifications) {
        await notificationService.sendAdminNotification({
          type: 'user_action',
          title: 'User Suspended',
          message: `User ${data.userId} has been suspended`,
          recipients: ['admin', 'moderator'],
        });
      }
    } catch (error) {
      console.error('Error handling user suspension:', error);
    }
  }

  private async handleUserRoleChanged(data: { userId: string; oldRole: string; newRole: string; adminId: string }) {
    try {
      // Update user permissions cache
      await userManagementService.refreshUserPermissions(data.userId);

      // Log role change in analytics
      await analyticsService.recordUserEvent('role_changed', {
        userId: data.userId,
        oldRole: data.oldRole,
        newRole: data.newRole,
        adminId: data.adminId,
      });

      // Notify user of role change
      if (this.config.enableNotifications) {
        await notificationService.sendUserNotification(data.userId, {
          type: 'role_change',
          title: 'Role Updated',
          message: `Your role has been changed from ${data.oldRole} to ${data.newRole}`,
        });
      }
    } catch (error) {
      console.error('Error handling role change:', error);
    }
  }

  private async handleContentFlagged(data: { contentId: string; contentType: string; reason: string; userId: string }) {
    try {
      // Update moderation queue
      await moderationService.addToQueue({
        contentId: data.contentId,
        contentType: data.contentType,
        flagReason: data.reason,
        userId: data.userId,
      });

      // Update analytics
      await analyticsService.recordContentEvent('content_flagged', {
        contentId: data.contentId,
        contentType: data.contentType,
        reason: data.reason,
      });

      // Notify moderators
      if (this.config.enableNotifications) {
        await notificationService.sendAdminNotification({
          type: 'content_moderation',
          title: 'Content Flagged',
          message: `${data.contentType} content has been flagged for review`,
          recipients: ['moderator', 'admin'],
        });
      }
    } catch (error) {
      console.error('Error handling content flagging:', error);
    }
  }

  private async handleContentApproved(data: { contentId: string; contentType: string; moderatorId: string }) {
    try {
      // Update content status
      await moderationService.approveContent(data.contentId);

      // Update analytics
      await analyticsService.recordContentEvent('content_approved', {
        contentId: data.contentId,
        contentType: data.contentType,
        moderatorId: data.moderatorId,
      });
    } catch (error) {
      console.error('Error handling content approval:', error);
    }
  }

  private async handleSystemConfigChanged(data: { key: string; oldValue: any; newValue: any; adminId: string }) {
    try {
      // Invalidate relevant caches
      await configService.invalidateCache(data.key);

      // Log configuration change
      await analyticsService.recordSystemEvent('config_changed', {
        key: data.key,
        oldValue: data.oldValue,
        newValue: data.newValue,
        adminId: data.adminId,
      });

      // Notify relevant admins
      if (this.config.enableNotifications) {
        await notificationService.sendAdminNotification({
          type: 'system_config',
          title: 'Configuration Changed',
          message: `System configuration "${data.key}" has been updated`,
          recipients: ['admin', 'super_admin'],
        });
      }
    } catch (error) {
      console.error('Error handling config change:', error);
    }
  }

  private async handleSystemAlert(data: { level: 'info' | 'warning' | 'error'; message: string; details?: any }) {
    try {
      // Log system alert
      await analyticsService.recordSystemEvent('system_alert', {
        level: data.level,
        message: data.message,
        details: data.details,
      });

      // Send notifications based on alert level
      if (data.level === 'error' || data.level === 'warning') {
        await notificationService.sendAdminNotification({
          type: 'system_alert',
          title: `System ${data.level.toUpperCase()}`,
          message: data.message,
          recipients: ['admin', 'super_admin'],
          priority: data.level === 'error' ? 'high' : 'medium',
        });
      }
    } catch (error) {
      console.error('Error handling system alert:', error);
    }
  }

  // Configuration management
  updateConfig(updates: Partial<IntegrationConfig>) {
    this.config = { ...this.config, ...updates };
  }

  getConfig(): IntegrationConfig {
    return { ...this.config };
  }

  // Health check for all integrated services
  async performHealthCheck(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, { status: 'up' | 'down'; responseTime?: number; error?: string }>;
  }> {
    const services = {
      audit: auditService,
      userManagement: userManagementService,
      moderation: moderationService,
      analytics: analyticsService,
      config: configService,
      notification: notificationService,
    };

    const results: Record<string, { status: 'up' | 'down'; responseTime?: number; error?: string }> = {};
    let healthyCount = 0;

    for (const [name, service] of Object.entries(services)) {
      const startTime = Date.now();
      try {
        // Each service should implement a health check method
        if ('healthCheck' in service && typeof service.healthCheck === 'function') {
          await service.healthCheck();
          results[name] = {
            status: 'up',
            responseTime: Date.now() - startTime,
          };
          healthyCount++;
        } else {
          results[name] = { status: 'up' };
          healthyCount++;
        }
      } catch (error) {
        results[name] = {
          status: 'down',
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    const totalServices = Object.keys(services).length;
    let overall: 'healthy' | 'degraded' | 'unhealthy';

    if (healthyCount === totalServices) {
      overall = 'healthy';
    } else if (healthyCount >= totalServices * 0.7) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    return { overall, services: results };
  }
}

export const adminIntegrationService = new AdminIntegrationService();