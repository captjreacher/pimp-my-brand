import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Server,
  Database,
  Zap
} from 'lucide-react';
import type { PerformanceMetrics, AnalyticsTimeRange } from '@/lib/admin/types/analytics-types';

interface PerformanceMonitoringPanelProps {
  performanceMetrics: PerformanceMetrics | null;
  timeRange: AnalyticsTimeRange;
  loading: boolean;
  compact?: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-3">
    <Skeleton className="h-4 w-32" />
    <Skeleton className="h-48 w-full" />
  </div>
);

const PerformanceIndicator: React.FC<{
  title: string;
  value: number;
  unit: string;
  threshold: number;
  icon: React.ReactNode;
  format?: (value: number) => string;
}> = ({ title, value, unit, threshold, icon, format }) => {
  const isGood = value <= threshold;
  const displayValue = format ? format(value) : value.toFixed(1);
  
  return (
    <div className={`p-4 rounded-lg border ${isGood ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={isGood ? 'text-green-600' : 'text-red-600'}>
            {icon}
          </div>
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className={`text-lg font-bold ${isGood ? 'text-green-600' : 'text-red-600'}`}>
          {displayValue}{unit}
        </div>
      </div>
    </div>
  );
};

export const PerformanceMonitoringPanel: React.FC<PerformanceMonitoringPanelProps> = ({
  performanceMetrics,
  timeRange,
  loading,
  compact = false
}) => {
  if (loading) {
    return (
      <div className={`grid grid-cols-1 ${compact ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} gap-6`}>
        <Card>
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingSkeleton />
          </CardContent>
        </Card>
        
        {!compact && (
          <Card>
            <CardHeader>
              <CardTitle>Request Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <LoadingSkeleton />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Prepare status code distribution data
  const statusData = performanceMetrics?.requests_by_status 
    ? Object.entries(performanceMetrics.requests_by_status).map(([status, count]) => ({
        name: status,
        value: count,
        percentage: ((count / performanceMetrics.total_requests) * 100).toFixed(1)
      }))
    : [];

  // Prepare slowest endpoints data
  const slowEndpoints = performanceMetrics?.slowest_endpoints?.slice(0, 5) || [];

  const getStatusColor = (status: string) => {
    if (status.startsWith('2')) return '#00C49F'; // Green for 2xx
    if (status.startsWith('3')) return '#0088FE'; // Blue for 3xx
    if (status.startsWith('4')) return '#FFBB28'; // Yellow for 4xx
    if (status.startsWith('5')) return '#FF8042'; // Red for 5xx
    return '#8884D8';
  };

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PerformanceIndicator
          title="Avg Response Time"
          value={performanceMetrics?.avg_response_time || 0}
          unit="ms"
          threshold={1000}
          icon={<Clock className="h-4 w-4" />}
          format={(value) => Math.round(value).toString()}
        />
        
        <PerformanceIndicator
          title="Error Rate"
          value={performanceMetrics?.error_rate || 0}
          unit="%"
          threshold={5}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        
        <PerformanceIndicator
          title="Uptime"
          value={performanceMetrics?.uptime_percentage || 100}
          unit="%"
          threshold={99}
          icon={<CheckCircle className="h-4 w-4" />}
        />
        
        <PerformanceIndicator
          title="Total Requests"
          value={performanceMetrics?.total_requests || 0}
          unit=""
          threshold={Infinity}
          icon={<Activity className="h-4 w-4" />}
          format={(value) => new Intl.NumberFormat().format(value)}
        />
      </div>

      {/* System Health Alert */}
      {performanceMetrics && (performanceMetrics.error_rate > 5 || performanceMetrics.avg_response_time > 1000) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            System performance is degraded. 
            {performanceMetrics.error_rate > 5 && ` Error rate: ${performanceMetrics.error_rate.toFixed(1)}%.`}
            {performanceMetrics.avg_response_time > 1000 && ` Response time: ${Math.round(performanceMetrics.avg_response_time)}ms.`}
          </AlertDescription>
        </Alert>
      )}

      {/* Charts Grid */}
      <div className={`grid grid-cols-1 ${compact ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} gap-6`}>
        {/* Request Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Request Status Distribution</CardTitle>
            <CardDescription>
              HTTP status code breakdown for the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="flex flex-wrap gap-2">
                  {statusData.map((item) => (
                    <Badge 
                      key={item.name} 
                      variant="outline"
                      style={{ borderColor: getStatusColor(item.name) }}
                    >
                      {item.name}: {item.value}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No request data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Slowest Endpoints */}
        {!compact && (
          <Card>
            <CardHeader>
              <CardTitle>Slowest Endpoints</CardTitle>
              <CardDescription>
                Top 5 endpoints by average response time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {slowEndpoints.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={slowEndpoints} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis 
                      type="category" 
                      dataKey="endpoint" 
                      tick={{ fontSize: 10 }}
                      width={100}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}ms`, 'Avg Response Time']}
                    />
                    <Bar dataKey="avg_response_time" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No endpoint data available
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Database Performance (if not compact) */}
      {!compact && performanceMetrics?.database_performance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Performance
            </CardTitle>
            <CardDescription>
              Database connection and query performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {performanceMetrics.database_performance.connection_count}
                </div>
                <div className="text-sm text-blue-600">Active Connections</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {performanceMetrics.database_performance.avg_query_time.toFixed(1)}ms
                </div>
                <div className="text-sm text-green-600">Avg Query Time</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {performanceMetrics.database_performance.slow_queries.length}
                </div>
                <div className="text-sm text-yellow-600">Slow Queries</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Resources Overview */}
      {!compact && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Resources
            </CardTitle>
            <CardDescription>
              Overall system health and resource utilization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  <span className="font-medium">System Status</span>
                </div>
                <Badge variant={performanceMetrics?.uptime_percentage > 99 ? "default" : "destructive"}>
                  {performanceMetrics?.uptime_percentage > 99 ? "Healthy" : "Degraded"}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Uptime:</span>
                  <span className="ml-2 font-medium">{performanceMetrics?.uptime_percentage.toFixed(2)}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Error Rate:</span>
                  <span className="ml-2 font-medium">{performanceMetrics?.error_rate.toFixed(2)}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg Response:</span>
                  <span className="ml-2 font-medium">{Math.round(performanceMetrics?.avg_response_time || 0)}ms</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Requests:</span>
                  <span className="ml-2 font-medium">{new Intl.NumberFormat().format(performanceMetrics?.total_requests || 0)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};