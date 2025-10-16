import { useState, useEffect, useCallback, useRef } from 'react';
import { adminAnalyticsService } from '@/lib/admin/analytics-service';
import type { 
  SystemMetrics, 
  UserAnalytics, 
  PerformanceMetrics,
  ModerationStats,
  AnalyticsTimeRange,
  MetricDataPoint,
  AnalyticsAlert
} from '@/lib/admin/types/analytics-types';

interface UseAdminAnalyticsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  timeRange?: AnalyticsTimeRange;
}

interface UseAdminAnalyticsReturn {
  systemMetrics: SystemMetrics | null;
  userAnalytics: UserAnalytics | null;
  performanceMetrics: PerformanceMetrics | null;
  moderationStats: ModerationStats | null;
  loading: boolean;
  error: string | null;
  refreshMetrics: () => Promise<void>;
  setTimeRange: (range: AnalyticsTimeRange) => void;
  timeRange: AnalyticsTimeRange;
}

export const useAdminAnalytics = (
  options: UseAdminAnalyticsOptions = {}
): UseAdminAnalyticsReturn => {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    timeRange: initialTimeRange = '24h'
  } = options;

  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [moderationStats, setModerationStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>(initialTimeRange);

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const fetchAllMetrics = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const [system, user, performance, moderation] = await Promise.all([
        adminAnalyticsService.getSystemMetrics(timeRange),
        adminAnalyticsService.getUserAnalytics(timeRange),
        adminAnalyticsService.getPerformanceMetrics(timeRange),
        adminAnalyticsService.getModerationStats(timeRange)
      ]);

      if (mountedRef.current) {
        setSystemMetrics(system);
        setUserAnalytics(user);
        setPerformanceMetrics(performance);
        setModerationStats(moderation);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
        console.error('Analytics fetch error:', err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [timeRange]);

  const refreshMetrics = useCallback(async () => {
    await fetchAllMetrics();
  }, [fetchAllMetrics]);

  // Initial fetch
  useEffect(() => {
    fetchAllMetrics();
  }, [fetchAllMetrics]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(fetchAllMetrics, refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchAllMetrics]);

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
    systemMetrics,
    userAnalytics,
    performanceMetrics,
    moderationStats,
    loading,
    error,
    refreshMetrics,
    setTimeRange,
    timeRange
  };
};

interface UseHistoricalMetricsOptions {
  metricType: string;
  metricName: string;
  timeRange: AnalyticsTimeRange;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseHistoricalMetricsReturn {
  data: MetricDataPoint[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useHistoricalMetrics = (
  options: UseHistoricalMetricsOptions
): UseHistoricalMetricsReturn => {
  const {
    metricType,
    metricName,
    timeRange,
    autoRefresh = false,
    refreshInterval = 60000 // 1 minute
  } = options;

  const [data, setData] = useState<MetricDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const fetchHistoricalData = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const historicalData = await adminAnalyticsService.getHistoricalMetrics(
        metricType,
        metricName,
        timeRange
      );

      if (mountedRef.current) {
        setData(historicalData);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch historical data');
        console.error('Historical metrics fetch error:', err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [metricType, metricName, timeRange]);

  const refresh = useCallback(async () => {
    await fetchHistoricalData();
  }, [fetchHistoricalData]);

  // Initial fetch
  useEffect(() => {
    fetchHistoricalData();
  }, [fetchHistoricalData]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(fetchHistoricalData, refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchHistoricalData]);

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
    data,
    loading,
    error,
    refresh
  };
};

interface UseSystemHealthOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseSystemHealthReturn {
  isHealthy: boolean;
  alerts: AnalyticsAlert[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useSystemHealth = (
  options: UseSystemHealthOptions = {}
): UseSystemHealthReturn => {
  const {
    autoRefresh = true,
    refreshInterval = 10000 // 10 seconds
  } = options;

  const [isHealthy, setIsHealthy] = useState(true);
  const [alerts, setAlerts] = useState<AnalyticsAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const checkSystemHealth = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      // Get current performance metrics to assess health
      const perfMetrics = await adminAnalyticsService.getPerformanceMetrics('1h');
      
      // Simple health check based on error rate and response time
      const healthy = perfMetrics.error_rate < 5 && perfMetrics.avg_response_time < 1000;
      
      // Generate alerts based on thresholds
      const currentAlerts: AnalyticsAlert[] = [];
      
      if (perfMetrics.error_rate >= 5) {
        currentAlerts.push({
          id: 'high-error-rate',
          type: 'error_rate',
          severity: perfMetrics.error_rate >= 10 ? 'critical' : 'high',
          title: 'High Error Rate',
          message: `Error rate is ${perfMetrics.error_rate.toFixed(2)}%`,
          threshold: 5,
          current_value: perfMetrics.error_rate,
          created_at: new Date().toISOString(),
          acknowledged: false
        });
      }

      if (perfMetrics.avg_response_time >= 1000) {
        currentAlerts.push({
          id: 'slow-response',
          type: 'response_time',
          severity: perfMetrics.avg_response_time >= 2000 ? 'critical' : 'high',
          title: 'Slow Response Time',
          message: `Average response time is ${perfMetrics.avg_response_time}ms`,
          threshold: 1000,
          current_value: perfMetrics.avg_response_time,
          created_at: new Date().toISOString(),
          acknowledged: false
        });
      }

      if (mountedRef.current) {
        setIsHealthy(healthy);
        setAlerts(currentAlerts);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to check system health');
        console.error('System health check error:', err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    await checkSystemHealth();
  }, [checkSystemHealth]);

  // Initial check
  useEffect(() => {
    checkSystemHealth();
  }, [checkSystemHealth]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(checkSystemHealth, refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, checkSystemHealth]);

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
    isHealthy,
    alerts,
    loading,
    error,
    refresh
  };
};