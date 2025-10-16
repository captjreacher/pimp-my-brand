import { supabase } from '@/integrations/supabase/client';
import type { 
  AnalyticsAlert, 
  AlertThreshold, 
  NotificationChannel 
} from './types/analytics-types';

export interface NotificationConfig {
  email?: {
    enabled: boolean;
    recipients: string[];
    smtpConfig?: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
  };
  webhook?: {
    enabled: boolean;
    url: string;
    headers?: Record<string, string>;
  };
  inApp?: {
    enabled: boolean;
    persistDays: number;
  };
}

export class AdminNotificationService {
  private static instance: AdminNotificationService;
  private config: NotificationConfig = {
    email: { enabled: false, recipients: [] },
    webhook: { enabled: false, url: '' },
    inApp: { enabled: true, persistDays: 7 }
  };
  private alertThresholds: AlertThreshold[] = [];

  static getInstance(): AdminNotificationService {
    if (!AdminNotificationService.instance) {
      AdminNotificationService.instance = new AdminNotificationService();
    }
    return AdminNotificationService.instance;
  }

  /**
   * Initialize the notification service with configuration
   */
  async initialize(config?: NotificationConfig): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    // Load alert thresholds from database
    await this.loadAlertThresholds();
    
    // Start monitoring system metrics
    this.startMetricsMonitoring();
  }

  /**
   * Create a new alert
   */
  async createAlert(
    type: AnalyticsAlert['type'],
    severity: AnalyticsAlert['severity'],
    title: string,
    message: string,
    currentValue: number,
    threshold: number,
    metadata?: Record<string, any>
  ): Promise<AnalyticsAlert> {
    const alert: AnalyticsAlert = {
      id: crypto.randomUUID(),
      type,
      severity,
      title,
      message,
      threshold,
      current_value: currentValue,
      created_at: new Date().toISOString(),
      acknowledged: false
    };

    // Store alert in database
    await this.storeAlert(alert, metadata);

    // Send notifications
    await this.sendNotifications(alert);

    return alert;
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_alerts')
        .update({
          acknowledged: true,
          acknowledged_by: acknowledgedBy,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<AnalyticsAlert[]> {
    try {
      const { data, error } = await supabase
        .from('admin_alerts')
        .select('*')
        .eq('acknowledged', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(this.mapDatabaseAlert) || [];
    } catch (error) {
      console.error('Error fetching active alerts:', error);
      return [];
    }
  }

  /**
   * Get all alerts (including acknowledged)
   */
  async getAllAlerts(limit: number = 50): Promise<AnalyticsAlert[]> {
    try {
      const { data, error } = await supabase
        .from('admin_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map(this.mapDatabaseAlert) || [];
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  }

  /**
   * Configure alert thresholds
   */
  async setAlertThreshold(threshold: AlertThreshold): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_alert_thresholds')
        .upsert({
          metric_name: threshold.metric_name,
          operator: threshold.operator,
          value: threshold.value,
          severity: threshold.severity,
          enabled: threshold.enabled,
          notification_channels: threshold.notification_channels
        });

      if (error) throw error;

      // Update local cache
      const existingIndex = this.alertThresholds.findIndex(
        t => t.metric_name === threshold.metric_name
      );
      
      if (existingIndex >= 0) {
        this.alertThresholds[existingIndex] = threshold;
      } else {
        this.alertThresholds.push(threshold);
      }
    } catch (error) {
      console.error('Error setting alert threshold:', error);
      throw error;
    }
  }

  /**
   * Get configured alert thresholds
   */
  async getAlertThresholds(): Promise<AlertThreshold[]> {
    return this.alertThresholds;
  }

  /**
   * Check metric value against thresholds and create alerts if needed
   */
  async checkMetricThresholds(
    metricName: string,
    currentValue: number,
    metricType: string = 'performance'
  ): Promise<void> {
    const relevantThresholds = this.alertThresholds.filter(
      t => t.metric_name === metricName && t.enabled
    );

    for (const threshold of relevantThresholds) {
      const shouldAlert = this.evaluateThreshold(currentValue, threshold);
      
      if (shouldAlert) {
        // Check if we already have a recent alert for this metric
        const recentAlert = await this.hasRecentAlert(metricName, threshold.severity);
        
        if (!recentAlert) {
          await this.createAlert(
            metricType as AnalyticsAlert['type'],
            threshold.severity,
            `${metricName} threshold exceeded`,
            `${metricName} is ${currentValue} (threshold: ${threshold.operator} ${threshold.value})`,
            currentValue,
            threshold.value
          );
        }
      }
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification(channel: string): Promise<boolean> {
    const testAlert: AnalyticsAlert = {
      id: 'test-alert',
      type: 'system_health',
      severity: 'low',
      title: 'Test Notification',
      message: 'This is a test notification to verify the alerting system is working correctly.',
      threshold: 0,
      current_value: 0,
      created_at: new Date().toISOString(),
      acknowledged: false
    };

    try {
      switch (channel) {
        case 'email':
          return await this.sendEmailNotification(testAlert);
        case 'webhook':
          return await this.sendWebhookNotification(testAlert);
        case 'in_app':
          return await this.sendInAppNotification(testAlert);
        default:
          return false;
      }
    } catch (error) {
      console.error(`Error sending test notification via ${channel}:`, error);
      return false;
    }
  }

  // Private methods

  private async loadAlertThresholds(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('admin_alert_thresholds')
        .select('*')
        .eq('enabled', true);

      if (error) throw error;

      this.alertThresholds = data?.map(item => ({
        metric_name: item.metric_name,
        operator: item.operator,
        value: item.value,
        severity: item.severity,
        enabled: item.enabled,
        notification_channels: item.notification_channels || []
      })) || [];
    } catch (error) {
      console.error('Error loading alert thresholds:', error);
    }
  }

  private startMetricsMonitoring(): void {
    // Start periodic monitoring of system metrics
    setInterval(async () => {
      try {
        await this.monitorSystemMetrics();
      } catch (error) {
        console.error('Error monitoring system metrics:', error);
      }
    }, 60000); // Check every minute
  }

  private async monitorSystemMetrics(): Promise<void> {
    // This would integrate with your analytics service to get current metrics
    // and check them against thresholds
    
    // Example: Monitor error rate
    // const errorRate = await analyticsService.getCurrentErrorRate();
    // await this.checkMetricThresholds('error_rate', errorRate, 'error_rate');
    
    // Example: Monitor response time
    // const responseTime = await analyticsService.getCurrentResponseTime();
    // await this.checkMetricThresholds('response_time', responseTime, 'response_time');
  }

  private evaluateThreshold(value: number, threshold: AlertThreshold): boolean {
    switch (threshold.operator) {
      case 'gt':
        return value > threshold.value;
      case 'gte':
        return value >= threshold.value;
      case 'lt':
        return value < threshold.value;
      case 'lte':
        return value <= threshold.value;
      case 'eq':
        return value === threshold.value;
      default:
        return false;
    }
  }

  private async hasRecentAlert(
    metricName: string, 
    severity: string, 
    withinMinutes: number = 30
  ): Promise<boolean> {
    try {
      const cutoffTime = new Date(Date.now() - withinMinutes * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('admin_alerts')
        .select('id')
        .ilike('message', `%${metricName}%`)
        .eq('severity', severity)
        .gte('created_at', cutoffTime)
        .limit(1);

      if (error) throw error;

      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Error checking recent alerts:', error);
      return false;
    }
  }

  private async storeAlert(alert: AnalyticsAlert, metadata?: Record<string, any>): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_alerts')
        .insert({
          id: alert.id,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          threshold: alert.threshold,
          current_value: alert.current_value,
          metadata: metadata || {},
          acknowledged: false,
          created_at: alert.created_at
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error storing alert:', error);
      throw error;
    }
  }

  private async sendNotifications(alert: AnalyticsAlert): Promise<void> {
    const promises: Promise<boolean>[] = [];

    if (this.config.email?.enabled) {
      promises.push(this.sendEmailNotification(alert));
    }

    if (this.config.webhook?.enabled) {
      promises.push(this.sendWebhookNotification(alert));
    }

    if (this.config.inApp?.enabled) {
      promises.push(this.sendInAppNotification(alert));
    }

    try {
      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  private async sendEmailNotification(alert: AnalyticsAlert): Promise<boolean> {
    if (!this.config.email?.enabled || !this.config.email.recipients.length) {
      return false;
    }

    try {
      // This would integrate with your email service (SendGrid, AWS SES, etc.)
      // For now, we'll just log the notification
      console.log('Email notification would be sent:', {
        to: this.config.email.recipients,
        subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
        body: alert.message
      });
      
      return true;
    } catch (error) {
      console.error('Error sending email notification:', error);
      return false;
    }
  }

  private async sendWebhookNotification(alert: AnalyticsAlert): Promise<boolean> {
    if (!this.config.webhook?.enabled || !this.config.webhook.url) {
      return false;
    }

    try {
      const response = await fetch(this.config.webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.webhook.headers
        },
        body: JSON.stringify({
          alert,
          timestamp: new Date().toISOString(),
          source: 'admin-notification-service'
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending webhook notification:', error);
      return false;
    }
  }

  private async sendInAppNotification(alert: AnalyticsAlert): Promise<boolean> {
    if (!this.config.inApp?.enabled) {
      return false;
    }

    try {
      // Store in-app notification in database
      const { error } = await supabase
        .from('admin_notifications')
        .insert({
          id: crypto.randomUUID(),
          alert_id: alert.id,
          type: 'alert',
          title: alert.title,
          message: alert.message,
          severity: alert.severity,
          read: false,
          expires_at: new Date(
            Date.now() + (this.config.inApp.persistDays * 24 * 60 * 60 * 1000)
          ).toISOString(),
          created_at: new Date().toISOString()
        });

      return !error;
    } catch (error) {
      console.error('Error sending in-app notification:', error);
      return false;
    }
  }

  private mapDatabaseAlert(dbAlert: any): AnalyticsAlert {
    return {
      id: dbAlert.id,
      type: dbAlert.type,
      severity: dbAlert.severity,
      title: dbAlert.title,
      message: dbAlert.message,
      threshold: dbAlert.threshold,
      current_value: dbAlert.current_value,
      created_at: dbAlert.created_at,
      acknowledged: dbAlert.acknowledged,
      acknowledged_by: dbAlert.acknowledged_by,
      acknowledged_at: dbAlert.acknowledged_at
    };
  }
}

export const adminNotificationService = AdminNotificationService.getInstance();