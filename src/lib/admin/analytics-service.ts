import { supabase } from '@/integrations/supabase/client';
import type { 
  SystemMetrics, 
  UserAnalytics, 
  PerformanceMetrics,
  ModerationStats,
  AnalyticsTimeRange 
} from './types/analytics-types';

export class AdminAnalyticsService {
  private static instance: AdminAnalyticsService;
  private metricsCache = new Map<string, { data: any; expires: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): AdminAnalyticsService {
    if (!AdminAnalyticsService.instance) {
      AdminAnalyticsService.instance = new AdminAnalyticsService();
    }
    return AdminAnalyticsService.instance;
  }

  /**
   * Get comprehensive system metrics
   */
  async getSystemMetrics(timeRange: AnalyticsTimeRange = '24h'): Promise<SystemMetrics> {
    const cacheKey = `system-metrics-${timeRange}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const interval = this.getPostgresInterval(timeRange);
      
      // Get user statistics
      const { data: userStats, error: userError } = await supabase
        .rpc('get_user_statistics', { time_range: interval });
      
      if (userError) throw userError;

      // Get content statistics  
      const { data: contentStats, error: contentError } = await supabase
        .rpc('get_content_statistics', { time_range: interval });
        
      if (contentError) throw contentError;

      // Get performance statistics
      const { data: perfStats, error: perfError } = await supabase
        .rpc('get_performance_statistics', { time_range: interval });
        
      if (perfError) throw perfError;

      // Get storage usage
      const storageUsage = await this.getStorageUsage();

      const metrics: SystemMetrics = {
        active_users_24h: userStats?.active_users_period || 0,
        total_users: userStats?.total_users || 0,
        new_users_period: userStats?.new_users_period || 0,
        total_content_generated: (contentStats?.total_brands || 0) + (contentStats?.total_cvs || 0),
        content_created_period: (contentStats?.brands_created_period || 0) + (contentStats?.cvs_created_period || 0),
        api_requests_24h: perfStats?.total_requests || 0,
        storage_usage: storageUsage,
        ai_api_costs: await this.getAIApiCosts(timeRange),
        users_by_tier: userStats?.users_by_tier || {},
        content_by_type: {
          brands: contentStats?.total_brands || 0,
          cvs: contentStats?.total_cvs || 0
        },
        avg_content_per_user: contentStats?.avg_content_per_user || 0
      };

      this.setCachedData(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      throw new Error('Failed to fetch system metrics');
    }
  }

  /**
   * Get user analytics and engagement data
   */
  async getUserAnalytics(timeRange: AnalyticsTimeRange = '24h'): Promise<UserAnalytics> {
    const cacheKey = `user-analytics-${timeRange}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const interval = this.getPostgresInterval(timeRange);
      
      const { data: userStats, error } = await supabase
        .rpc('get_user_statistics', { time_range: interval });
        
      if (error) throw error;

      // Get user engagement metrics
      const engagementData = await this.getUserEngagementMetrics(timeRange);
      
      const analytics: UserAnalytics = {
        total_users: userStats?.total_users || 0,
        active_users: userStats?.active_users_period || 0,
        new_users: userStats?.new_users_period || 0,
        user_retention_rate: await this.calculateRetentionRate(timeRange),
        users_by_subscription: userStats?.users_by_tier || {},
        suspended_users: userStats?.suspended_users || 0,
        user_growth_trend: await this.getUserGrowthTrend(timeRange),
        engagement_metrics: engagementData
      };

      this.setCachedData(cacheKey, analytics);
      return analytics;
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      throw new Error('Failed to fetch user analytics');
    }
  }

  /**
   * Get system performance metrics
   */
  async getPerformanceMetrics(timeRange: AnalyticsTimeRange = '24h'): Promise<PerformanceMetrics> {
    const cacheKey = `performance-metrics-${timeRange}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const interval = this.getPostgresInterval(timeRange);
      
      const { data: perfStats, error } = await supabase
        .rpc('get_performance_statistics', { time_range: interval });
        
      if (error) throw error;

      const metrics: PerformanceMetrics = {
        avg_response_time: perfStats?.avg_response_time || 0,
        error_rate: perfStats?.error_rate || 0,
        uptime_percentage: await this.calculateUptime(timeRange),
        total_requests: perfStats?.total_requests || 0,
        requests_by_status: perfStats?.requests_by_status || {},
        slowest_endpoints: perfStats?.slowest_endpoints || [],
        database_performance: await this.getDatabaseMetrics()
      };

      this.setCachedData(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      throw new Error('Failed to fetch performance metrics');
    }
  }

  /**
   * Get content moderation statistics
   */
  async getModerationStats(timeRange: AnalyticsTimeRange = '24h'): Promise<ModerationStats> {
    const cacheKey = `moderation-stats-${timeRange}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const interval = this.getPostgresInterval(timeRange);
      
      const { data: modStats, error } = await supabase
        .rpc('get_moderation_statistics', { time_range: interval });
        
      if (error) throw error;

      const stats: ModerationStats = {
        pending_count: modStats?.pending_moderation || 0,
        daily_processed: modStats?.moderated_period || 0,
        approval_rate: modStats?.approval_rate || 0,
        avg_processing_time: modStats?.avg_moderation_time || 0,
        moderation_by_type: modStats?.moderation_by_type || {},
        flagged_content_trend: await this.getFlaggedContentTrend(timeRange)
      };

      this.setCachedData(cacheKey, stats);
      return stats;
    } catch (error) {
      console.error('Error fetching moderation stats:', error);
      throw new Error('Failed to fetch moderation statistics');
    }
  }

  /**
   * Record system health metric
   */
  async recordHealthMetric(
    endpoint: string,
    responseTime: number,
    statusCode: number,
    errorMessage?: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_health_metrics')
        .insert({
          endpoint,
          response_time_ms: responseTime,
          status_code: statusCode,
          error_message: errorMessage,
          user_agent: userAgent,
          ip_address: ipAddress
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error recording health metric:', error);
      // Don't throw here to avoid disrupting the main application flow
    }
  }

  /**
   * Collect and store system metrics (called by scheduled job)
   */
  async collectSystemMetrics(): Promise<void> {
    try {
      const { error } = await supabase.rpc('collect_system_metrics');
      if (error) throw error;
      
      // Clear relevant caches after collection
      this.clearCacheByPattern('system-metrics');
      this.clearCacheByPattern('user-analytics');
      this.clearCacheByPattern('performance-metrics');
    } catch (error) {
      console.error('Error collecting system metrics:', error);
      throw error;
    }
  }

  /**
   * Get historical metrics for trend analysis
   */
  async getHistoricalMetrics(
    metricType: string,
    metricName: string,
    timeRange: AnalyticsTimeRange = '7d'
  ): Promise<Array<{ timestamp: string; value: number }>> {
    try {
      const interval = this.getPostgresInterval(timeRange);
      const startTime = new Date(Date.now() - this.getMilliseconds(timeRange));

      const { data, error } = await supabase
        .from('admin_metrics')
        .select('metric_value, collected_at')
        .eq('metric_type', metricType)
        .eq('metric_name', metricName)
        .gte('collected_at', startTime.toISOString())
        .order('collected_at', { ascending: true });

      if (error) throw error;

      return data?.map(item => ({
        timestamp: item.collected_at,
        value: item.metric_value
      })) || [];
    } catch (error) {
      console.error('Error fetching historical metrics:', error);
      throw error;
    }
  }

  // Private helper methods

  private getCachedData(key: string): any {
    const cached = this.metricsCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    this.metricsCache.delete(key);
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.metricsCache.set(key, {
      data,
      expires: Date.now() + this.CACHE_DURATION
    });
  }

  private clearCacheByPattern(pattern: string): void {
    for (const key of this.metricsCache.keys()) {
      if (key.includes(pattern)) {
        this.metricsCache.delete(key);
      }
    }
  }

  private getPostgresInterval(timeRange: AnalyticsTimeRange): string {
    const intervals = {
      '1h': '1 hour',
      '24h': '24 hours',
      '7d': '7 days',
      '30d': '30 days'
    };
    return intervals[timeRange] || '24 hours';
  }

  private getMilliseconds(timeRange: AnalyticsTimeRange): number {
    const ms = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    return ms[timeRange] || ms['24h'];
  }

  private async getStorageUsage(): Promise<number> {
    try {
      // This would need to be implemented based on Supabase storage API
      // For now, return a placeholder
      return 0;
    } catch (error) {
      console.error('Error getting storage usage:', error);
      return 0;
    }
  }

  private async getAIApiCosts(timeRange: AnalyticsTimeRange): Promise<number> {
    // This would need to be implemented based on your AI API usage tracking
    // For now, return a placeholder
    return 0;
  }

  private async getUserEngagementMetrics(timeRange: AnalyticsTimeRange): Promise<any> {
    // Calculate user engagement metrics like session duration, page views, etc.
    return {
      avg_session_duration: 0,
      bounce_rate: 0,
      pages_per_session: 0
    };
  }

  private async calculateRetentionRate(timeRange: AnalyticsTimeRange): Promise<number> {
    // Calculate user retention rate
    return 0;
  }

  private async getUserGrowthTrend(timeRange: AnalyticsTimeRange): Promise<Array<{ date: string; count: number }>> {
    // Get user growth trend data
    return [];
  }

  private async calculateUptime(timeRange: AnalyticsTimeRange): Promise<number> {
    try {
      const interval = this.getPostgresInterval(timeRange);
      const startTime = new Date(Date.now() - this.getMilliseconds(timeRange));

      const { data, error } = await supabase
        .from('system_health_metrics')
        .select('status_code')
        .gte('recorded_at', startTime.toISOString());

      if (error) throw error;

      if (!data || data.length === 0) return 100;

      const successfulRequests = data.filter(metric => metric.status_code < 400).length;
      return (successfulRequests / data.length) * 100;
    } catch (error) {
      console.error('Error calculating uptime:', error);
      return 100;
    }
  }

  private async getDatabaseMetrics(): Promise<any> {
    // Get database performance metrics
    return {
      connection_count: 0,
      avg_query_time: 0,
      slow_queries: []
    };
  }

  private async getFlaggedContentTrend(timeRange: AnalyticsTimeRange): Promise<Array<{ date: string; count: number }>> {
    // Get flagged content trend data
    return [];
  }
}

export const adminAnalyticsService = AdminAnalyticsService.getInstance();