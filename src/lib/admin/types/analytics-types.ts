export type AnalyticsTimeRange = '1h' | '24h' | '7d' | '30d';

export interface SystemMetrics {
  active_users_24h: number;
  total_users: number;
  new_users_period: number;
  total_content_generated: number;
  content_created_period: number;
  api_requests_24h: number;
  storage_usage: number;
  ai_api_costs: number;
  users_by_tier: Record<string, number>;
  content_by_type: {
    brands: number;
    cvs: number;
  };
  avg_content_per_user: number;
}

export interface UserAnalytics {
  total_users: number;
  active_users: number;
  new_users: number;
  user_retention_rate: number;
  users_by_subscription: Record<string, number>;
  suspended_users: number;
  user_growth_trend: Array<{
    date: string;
    count: number;
  }>;
  engagement_metrics: {
    avg_session_duration: number;
    bounce_rate: number;
    pages_per_session: number;
  };
}

export interface PerformanceMetrics {
  avg_response_time: number;
  error_rate: number;
  uptime_percentage: number;
  total_requests: number;
  requests_by_status: Record<string, number>;
  slowest_endpoints: Array<{
    endpoint: string;
    avg_response_time: number;
    request_count: number;
  }>;
  database_performance: {
    connection_count: number;
    avg_query_time: number;
    slow_queries: Array<{
      query: string;
      avg_time: number;
      count: number;
    }>;
  };
}

export interface ModerationStats {
  pending_count: number;
  daily_processed: number;
  approval_rate: number;
  avg_processing_time: number;
  moderation_by_type: Record<string, number>;
  flagged_content_trend: Array<{
    date: string;
    count: number;
  }>;
}

export interface AnalyticsAlert {
  id: string;
  type: 'error_rate' | 'response_time' | 'user_activity' | 'system_health';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  threshold: number;
  current_value: number;
  created_at: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
}

export interface MetricDataPoint {
  timestamp: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
  }>;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'table' | 'alert';
  size: 'small' | 'medium' | 'large';
  data: any;
  refreshInterval?: number;
  lastUpdated: string;
}

export interface AnalyticsFilter {
  timeRange: AnalyticsTimeRange;
  metricTypes?: string[];
  userSegment?: string;
  contentType?: string;
}

export interface AnalyticsExport {
  format: 'csv' | 'json' | 'pdf';
  metrics: string[];
  timeRange: AnalyticsTimeRange;
  filters?: AnalyticsFilter;
}

export interface SystemHealthStatus {
  overall: 'healthy' | 'warning' | 'critical';
  components: {
    database: 'healthy' | 'warning' | 'critical';
    api: 'healthy' | 'warning' | 'critical';
    storage: 'healthy' | 'warning' | 'critical';
    ai_services: 'healthy' | 'warning' | 'critical';
  };
  last_check: string;
}

export interface AlertThreshold {
  metric_name: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  notification_channels: string[];
}

export interface NotificationChannel {
  id: string;
  type: 'email' | 'webhook' | 'in_app';
  name: string;
  config: Record<string, any>;
  enabled: boolean;
}

export interface AnalyticsReport {
  id: string;
  title: string;
  description: string;
  metrics: string[];
  filters: AnalyticsFilter;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    recipients: string[];
  };
  created_by: string;
  created_at: string;
  last_generated?: string;
}