import { supabase } from '@/integrations/supabase/client';
import { auditService } from './audit-service';
import type {
  UserNotification,
  NotificationDeliveryLog,
  SendNotificationRequest
} from './types/communication-types';

export class NotificationBroadcastService {
  // Broadcast notifications to multiple users
  static async broadcastToUsers(
    userIds: string[],
    notification: Omit<SendNotificationRequest, 'user_id' | 'user_ids'>
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const notifications = userIds.map(userId => ({
      admin_user_id: user.id,
      user_id: userId,
      title: notification.title,
      message: notification.message,
      notification_type: notification.notification_type || 'info',
      priority: notification.priority || 'normal',
      action_url: notification.action_url,
      action_label: notification.action_label,
      metadata: notification.metadata || {},
      expires_at: notification.expires_at
    }));

    const { error } = await supabase
      .from('user_notifications')
      .insert(notifications);

    if (error) throw error;

    await auditLog('notification_broadcast_users', 'user_notification', null, {
      title: notification.title,
      user_count: userIds.length,
      notification_type: notification.notification_type
    });

    // Schedule delivery if delivery methods are specified
    if (notification.delivery_methods?.length) {
      await this.scheduleDelivery(userIds, notification.delivery_methods);
    }
  }

  // Broadcast to all users
  static async broadcastToAll(
    notification: Omit<SendNotificationRequest, 'user_id' | 'user_ids'>
  ): Promise<void> {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id');

    if (error) throw error;

    const userIds = users?.map(u => u.id) || [];
    await this.broadcastToUsers(userIds, notification);
  }

  // Broadcast to subscribers only
  static async broadcastToSubscribers(
    notification: Omit<SendNotificationRequest, 'user_id' | 'user_ids'>
  ): Promise<void> {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id')
      .not('subscription_tier', 'is', null);

    if (error) throw error;

    const userIds = users?.map(u => u.id) || [];
    await this.broadcastToUsers(userIds, notification);
  }

  // Broadcast to free users only
  static async broadcastToFreeUsers(
    notification: Omit<SendNotificationRequest, 'user_id' | 'user_ids'>
  ): Promise<void> {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id')
      .is('subscription_tier', null);

    if (error) throw error;

    const userIds = users?.map(u => u.id) || [];
    await this.broadcastToUsers(userIds, notification);
  }

  // Broadcast system maintenance notifications
  static async broadcastMaintenanceNotification(
    scheduledTime: string,
    duration: string,
    description?: string
  ): Promise<void> {
    const notification = {
      title: 'Scheduled Maintenance',
      message: `System maintenance is scheduled for ${new Date(scheduledTime).toLocaleString()}. Expected duration: ${duration}. ${description || 'We apologize for any inconvenience.'}`,
      notification_type: 'warning' as const,
      priority: 'high' as const,
      action_url: '/status',
      action_label: 'View Status Page',
      metadata: {
        maintenance_type: 'scheduled',
        scheduled_time: scheduledTime,
        duration: duration
      },
      delivery_methods: ['in_app', 'email'] as const
    };

    await this.broadcastToAll(notification);
  }

  // Broadcast security alerts
  static async broadcastSecurityAlert(
    title: string,
    message: string,
    actionRequired?: {
      url: string;
      label: string;
    }
  ): Promise<void> {
    const notification = {
      title: `Security Alert: ${title}`,
      message: message,
      notification_type: 'error' as const,
      priority: 'urgent' as const,
      action_url: actionRequired?.url,
      action_label: actionRequired?.label,
      metadata: {
        alert_type: 'security',
        timestamp: new Date().toISOString()
      },
      delivery_methods: ['in_app', 'email'] as const
    };

    await this.broadcastToAll(notification);
  }

  // Broadcast feature announcements
  static async broadcastFeatureAnnouncement(
    title: string,
    description: string,
    featureUrl?: string
  ): Promise<void> {
    const notification = {
      title: `New Feature: ${title}`,
      message: description,
      notification_type: 'success' as const,
      priority: 'normal' as const,
      action_url: featureUrl,
      action_label: featureUrl ? 'Try It Now' : undefined,
      metadata: {
        announcement_type: 'feature',
        feature_name: title
      },
      delivery_methods: ['in_app'] as const
    };

    await this.broadcastToAll(notification);
  }

  // Broadcast billing notifications
  static async broadcastBillingNotification(
    title: string,
    message: string,
    targetSubscribers = true
  ): Promise<void> {
    const notification = {
      title: title,
      message: message,
      notification_type: 'info' as const,
      priority: 'normal' as const,
      action_url: '/billing',
      action_label: 'View Billing',
      metadata: {
        notification_type: 'billing'
      },
      delivery_methods: ['in_app', 'email'] as const
    };

    if (targetSubscribers) {
      await this.broadcastToSubscribers(notification);
    } else {
      await this.broadcastToAll(notification);
    }
  }

  // Schedule notification delivery via different methods
  private static async scheduleDelivery(
    userIds: string[],
    deliveryMethods: Array<'in_app' | 'email' | 'push'>
  ): Promise<void> {
    const deliveryLogs = userIds.flatMap(userId =>
      deliveryMethods.map(method => ({
        user_id: userId,
        delivery_method: method,
        status: 'pending' as const
      }))
    );

    const { error } = await supabase
      .from('notification_delivery_log')
      .insert(deliveryLogs);

    if (error) throw error;

    // In a real implementation, this would trigger background jobs
    // to actually send emails, push notifications, etc.
    console.log(`Scheduled ${deliveryLogs.length} notification deliveries`);
  }

  // Get delivery statistics
  static async getDeliveryStats(dateFrom?: string, dateTo?: string): Promise<{
    total_scheduled: number;
    delivered: number;
    failed: number;
    pending: number;
    delivery_rate: number;
    by_method: Record<string, {
      scheduled: number;
      delivered: number;
      failed: number;
    }>;
  }> {
    let query = supabase
      .from('notification_delivery_log')
      .select('delivery_method, status');

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data: logs, error } = await query;
    if (error) throw error;

    const totalScheduled = logs?.length || 0;
    const delivered = logs?.filter(log => log.status === 'delivered').length || 0;
    const failed = logs?.filter(log => log.status === 'failed').length || 0;
    const pending = logs?.filter(log => log.status === 'pending').length || 0;
    const deliveryRate = totalScheduled > 0 ? delivered / totalScheduled : 0;

    const byMethod = logs?.reduce((acc, log) => {
      if (!acc[log.delivery_method]) {
        acc[log.delivery_method] = { scheduled: 0, delivered: 0, failed: 0 };
      }
      acc[log.delivery_method].scheduled++;
      if (log.status === 'delivered') {
        acc[log.delivery_method].delivered++;
      } else if (log.status === 'failed') {
        acc[log.delivery_method].failed++;
      }
      return acc;
    }, {} as Record<string, { scheduled: number; delivered: number; failed: number }>) || {};

    return {
      total_scheduled: totalScheduled,
      delivered,
      failed,
      pending,
      delivery_rate: deliveryRate,
      by_method: byMethod
    };
  }

  // Mark notifications as delivered (called by delivery workers)
  static async markAsDelivered(
    userId: string,
    deliveryMethod: 'in_app' | 'email' | 'push',
    notificationId?: string
  ): Promise<void> {
    let query = supabase
      .from('notification_delivery_log')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('delivery_method', deliveryMethod)
      .eq('status', 'pending');

    if (notificationId) {
      query = query.eq('notification_id', notificationId);
    }

    const { error } = await query;
    if (error) throw error;
  }

  // Mark notifications as failed
  static async markAsFailed(
    userId: string,
    deliveryMethod: 'in_app' | 'email' | 'push',
    errorMessage: string,
    notificationId?: string
  ): Promise<void> {
    let query = supabase
      .from('notification_delivery_log')
      .update({
        status: 'failed',
        error_message: errorMessage
      })
      .eq('user_id', userId)
      .eq('delivery_method', deliveryMethod)
      .eq('status', 'pending');

    if (notificationId) {
      query = query.eq('notification_id', notificationId);
    }

    const { error } = await query;
    if (error) throw error;
  }

  // Get user's unread notifications
  static async getUserNotifications(
    userId: string,
    includeRead = false,
    limit = 50
  ): Promise<UserNotification[]> {
    let query = supabase
      .from('user_notifications')
      .select(`
        *,
        admin_user:profiles!user_notifications_admin_user_id_fkey(id, email, full_name)
      `)
      .eq('user_id', userId);

    if (!includeRead) {
      query = query.eq('status', 'unread');
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  }

  // Mark user notification as read
  static async markNotificationAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('user_notifications')
      .update({
        status: 'read',
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (error) throw error;
  }

  // Dismiss user notification
  static async dismissNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('user_notifications')
      .update({ status: 'dismissed' })
      .eq('id', notificationId);

    if (error) throw error;
  }
}