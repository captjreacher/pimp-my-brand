import { useState, useEffect, useCallback, useRef } from 'react';
import { adminNotificationService } from '@/lib/admin/notification-service';
import type { 
  AnalyticsAlert, 
  AlertThreshold, 
  NotificationChannel 
} from '@/lib/admin/types/analytics-types';

interface UseAdminNotificationsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  includeAcknowledged?: boolean;
}

interface UseAdminNotificationsReturn {
  alerts: AnalyticsAlert[];
  activeAlerts: AnalyticsAlert[];
  acknowledgedAlerts: AnalyticsAlert[];
  loading: boolean;
  error: string | null;
  refreshAlerts: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  acknowledgeMultipleAlerts: (alertIds: string[]) => Promise<void>;
  createTestAlert: (severity: AnalyticsAlert['severity']) => Promise<void>;
}

export const useAdminNotifications = (
  options: UseAdminNotificationsOptions = {}
): UseAdminNotificationsReturn => {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    includeAcknowledged = true
  } = options;

  const [alerts, setAlerts] = useState<AnalyticsAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const fetchAlerts = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const fetchedAlerts = includeAcknowledged 
        ? await adminNotificationService.getAllAlerts()
        : await adminNotificationService.getActiveAlerts();

      if (mountedRef.current) {
        setAlerts(fetchedAlerts);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
        console.error('Alerts fetch error:', err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [includeAcknowledged]);

  const refreshAlerts = useCallback(async () => {
    await fetchAlerts();
  }, [fetchAlerts]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      // Get current user ID (this would come from your auth context)
      const currentUserId = 'current-user-id'; // Replace with actual user ID
      
      await adminNotificationService.acknowledgeAlert(alertId, currentUserId);
      
      // Update local state
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === alertId 
            ? { 
                ...alert, 
                acknowledged: true, 
                acknowledged_by: currentUserId,
                acknowledged_at: new Date().toISOString()
              }
            : alert
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acknowledge alert');
      console.error('Error acknowledging alert:', err);
    }
  }, []);

  const acknowledgeMultipleAlerts = useCallback(async (alertIds: string[]) => {
    try {
      const currentUserId = 'current-user-id'; // Replace with actual user ID
      
      await Promise.all(
        alertIds.map(id => adminNotificationService.acknowledgeAlert(id, currentUserId))
      );
      
      // Update local state
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alertIds.includes(alert.id)
            ? { 
                ...alert, 
                acknowledged: true, 
                acknowledged_by: currentUserId,
                acknowledged_at: new Date().toISOString()
              }
            : alert
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acknowledge alerts');
      console.error('Error acknowledging multiple alerts:', err);
    }
  }, []);

  const createTestAlert = useCallback(async (severity: AnalyticsAlert['severity']) => {
    try {
      await adminNotificationService.createAlert(
        'system_health',
        severity,
        'Test Alert',
        `This is a test ${severity} alert to verify the notification system is working correctly.`,
        100,
        50
      );
      
      // Refresh alerts to show the new test alert
      await fetchAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create test alert');
      console.error('Error creating test alert:', err);
    }
  }, [fetchAlerts]);

  // Initial fetch
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(fetchAlerts, refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchAlerts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Computed values
  const activeAlerts = alerts.filter(alert => !alert.acknowledged);
  const acknowledgedAlerts = alerts.filter(alert => alert.acknowledged);

  return {
    alerts,
    activeAlerts,
    acknowledgedAlerts,
    loading,
    error,
    refreshAlerts,
    acknowledgeAlert,
    acknowledgeMultipleAlerts,
    createTestAlert
  };
};

interface UseAlertThresholdsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseAlertThresholdsReturn {
  thresholds: AlertThreshold[];
  loading: boolean;
  error: string | null;
  refreshThresholds: () => Promise<void>;
  updateThreshold: (threshold: AlertThreshold) => Promise<void>;
  testNotification: (channel: string) => Promise<boolean>;
}

export const useAlertThresholds = (
  options: UseAlertThresholdsOptions = {}
): UseAlertThresholdsReturn => {
  const {
    autoRefresh = false,
    refreshInterval = 300000 // 5 minutes
  } = options;

  const [thresholds, setThresholds] = useState<AlertThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const fetchThresholds = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const fetchedThresholds = await adminNotificationService.getAlertThresholds();

      if (mountedRef.current) {
        setThresholds(fetchedThresholds);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch thresholds');
        console.error('Thresholds fetch error:', err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const refreshThresholds = useCallback(async () => {
    await fetchThresholds();
  }, [fetchThresholds]);

  const updateThreshold = useCallback(async (threshold: AlertThreshold) => {
    try {
      await adminNotificationService.setAlertThreshold(threshold);
      
      // Update local state
      setThresholds(prevThresholds => {
        const existingIndex = prevThresholds.findIndex(
          t => t.metric_name === threshold.metric_name
        );
        
        if (existingIndex >= 0) {
          const updated = [...prevThresholds];
          updated[existingIndex] = threshold;
          return updated;
        } else {
          return [...prevThresholds, threshold];
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update threshold');
      console.error('Error updating threshold:', err);
    }
  }, []);

  const testNotification = useCallback(async (channel: string): Promise<boolean> => {
    try {
      return await adminNotificationService.sendTestNotification(channel);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send test notification');
      console.error('Error sending test notification:', err);
      return false;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchThresholds();
  }, [fetchThresholds]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(fetchThresholds, refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchThresholds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    thresholds,
    loading,
    error,
    refreshThresholds,
    updateThreshold,
    testNotification
  };
};