import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  FileText, 
  Activity, 
  HardDrive, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import type { SystemMetrics, UserAnalytics, PerformanceMetrics } from '@/lib/admin/types/analytics-types';

interface SystemMetricsCardsProps {
  systemMetrics: SystemMetrics | null;
  userAnalytics: UserAnalytics | null;
  performanceMetrics: PerformanceMetrics | null;
  loading: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  loading?: boolean;
  format?: 'number' | 'currency' | 'percentage' | 'bytes';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  loading = false,
  format = 'number'
}) => {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'bytes':
        return formatBytes(val);
      default:
        return new Intl.NumberFormat('en-US').format(val);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTrendIcon = () => {
    if (change === undefined) return <Minus className="h-3 w-3" />;
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return <Minus className="h-3 w-3 text-gray-400" />;
  };

  const getTrendColor = () => {
    if (change === undefined) return 'text-gray-500';
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className="text-2xl font-bold">
              {formatValue(value)}
            </div>
          )}
          
          {change !== undefined && !loading && (
            <div className={`flex items-center text-xs ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="ml-1">
                {Math.abs(change).toFixed(1)}% {changeLabel || 'from last period'}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const SystemMetricsCards: React.FC<SystemMetricsCardsProps> = ({
  systemMetrics,
  userAnalytics,
  performanceMetrics,
  loading
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Active Users (24h)"
        value={systemMetrics?.active_users_24h || 0}
        icon={<Users className="h-4 w-4" />}
        loading={loading}
      />
      
      <MetricCard
        title="Total Content"
        value={systemMetrics?.total_content_generated || 0}
        icon={<FileText className="h-4 w-4" />}
        loading={loading}
      />
      
      <MetricCard
        title="API Requests (24h)"
        value={systemMetrics?.api_requests_24h || 0}
        icon={<Activity className="h-4 w-4" />}
        loading={loading}
      />
      
      <MetricCard
        title="Storage Usage"
        value={systemMetrics?.storage_usage || 0}
        format="bytes"
        icon={<HardDrive className="h-4 w-4" />}
        loading={loading}
      />
      
      <MetricCard
        title="Total Users"
        value={userAnalytics?.total_users || 0}
        change={userAnalytics ? (userAnalytics.new_users / userAnalytics.total_users) * 100 : undefined}
        changeLabel="growth rate"
        icon={<Users className="h-4 w-4" />}
        loading={loading}
      />
      
      <MetricCard
        title="New Content"
        value={systemMetrics?.content_created_period || 0}
        icon={<FileText className="h-4 w-4" />}
        loading={loading}
      />
      
      <MetricCard
        title="Avg Response Time"
        value={`${performanceMetrics?.avg_response_time || 0}ms`}
        change={performanceMetrics?.error_rate ? -performanceMetrics.error_rate : undefined}
        changeLabel="error rate"
        icon={<Activity className="h-4 w-4" />}
        loading={loading}
      />
      
      <MetricCard
        title="AI API Costs"
        value={systemMetrics?.ai_api_costs || 0}
        format="currency"
        icon={<DollarSign className="h-4 w-4" />}
        loading={loading}
      />
    </div>
  );
};