import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Flag,
  FileText,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import type { ModerationStats, AnalyticsTimeRange } from '@/lib/admin/types/analytics-types';

interface ContentModerationStatsProps {
  moderationStats: ModerationStats | null;
  timeRange: AnalyticsTimeRange;
  loading: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-3">
    <Skeleton className="h-4 w-32" />
    <Skeleton className="h-48 w-full" />
  </div>
);

const ModerationMetricCard: React.FC<{
  title: string;
  value: number;
  unit?: string;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: 'default' | 'success' | 'warning' | 'danger';
  format?: (value: number) => string;
}> = ({ 
  title, 
  value, 
  unit = '', 
  icon, 
  trend, 
  trendLabel,
  color = 'default',
  format 
}) => {
  const displayValue = format ? format(value) : value.toString();
  
  const getColorClasses = () => {
    switch (color) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'danger':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getTrendIcon = () => {
    if (trend === undefined) return null;
    if (trend > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (trend < 0) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return null;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getColorClasses()}`}>
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">
                {displayValue}{unit}
              </p>
              {trend !== undefined && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {getTrendIcon()}
                  <span>{Math.abs(trend).toFixed(1)}% {trendLabel || 'from last period'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const ContentModerationStats: React.FC<ContentModerationStatsProps> = ({
  moderationStats,
  timeRange,
  loading
}) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <LoadingSkeleton />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Prepare moderation by type data
  const moderationByTypeData = moderationStats?.moderation_by_type 
    ? Object.entries(moderationStats.moderation_by_type).map(([type, count]) => ({
        name: type.charAt(0).toUpperCase() + type.slice(1),
        value: count,
        percentage: ((count / Object.values(moderationStats.moderation_by_type).reduce((a, b) => a + b, 0)) * 100).toFixed(1)
      }))
    : [];

  // Prepare flagged content trend data
  const flaggedTrendData = moderationStats?.flagged_content_trend || [];

  // Calculate processing efficiency
  const processingEfficiency = moderationStats?.avg_processing_time 
    ? Math.max(0, 100 - (moderationStats.avg_processing_time / 24) * 100) // Assume 24 hours is 0% efficiency
    : 0;

  return (
    <div className="space-y-6">
      {/* Moderation Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ModerationMetricCard
          title="Pending Review"
          value={moderationStats?.pending_count || 0}
          icon={<Clock className="h-4 w-4" />}
          color={moderationStats?.pending_count > 10 ? 'warning' : 'default'}
        />
        
        <ModerationMetricCard
          title="Processed Today"
          value={moderationStats?.daily_processed || 0}
          icon={<CheckCircle className="h-4 w-4" />}
          color="success"
        />
        
        <ModerationMetricCard
          title="Approval Rate"
          value={moderationStats?.approval_rate || 0}
          unit="%"
          icon={<CheckCircle className="h-4 w-4" />}
          color={moderationStats?.approval_rate > 80 ? 'success' : 'warning'}
          format={(value) => value.toFixed(1)}
        />
        
        <ModerationMetricCard
          title="Avg Processing Time"
          value={moderationStats?.avg_processing_time || 0}
          unit="h"
          icon={<Clock className="h-4 w-4" />}
          color={moderationStats?.avg_processing_time > 12 ? 'danger' : 'default'}
          format={(value) => value.toFixed(1)}
        />
      </div>

      {/* Processing Efficiency Indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Moderation Efficiency
          </CardTitle>
          <CardDescription>
            Overall moderation team performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Processing Efficiency</span>
              <span className="text-sm text-muted-foreground">{processingEfficiency.toFixed(1)}%</span>
            </div>
            <Progress value={processingEfficiency} className="h-2" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Queue Size:</span>
                <span className="ml-2 font-medium">{moderationStats?.pending_count || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Daily Processed:</span>
                <span className="ml-2 font-medium">{moderationStats?.daily_processed || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Approval Rate:</span>
                <span className="ml-2 font-medium">{moderationStats?.approval_rate.toFixed(1) || 0}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Avg Time:</span>
                <span className="ml-2 font-medium">{moderationStats?.avg_processing_time.toFixed(1) || 0}h</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Moderation by Content Type</CardTitle>
            <CardDescription>
              Distribution of moderated content by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            {moderationByTypeData.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={moderationByTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {moderationByTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="flex flex-wrap gap-2">
                  {moderationByTypeData.map((item, index) => (
                    <Badge 
                      key={item.name} 
                      variant="outline"
                      style={{ borderColor: COLORS[index % COLORS.length] }}
                    >
                      {item.name}: {item.value}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No moderation data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Flagged Content Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Flagged Content Trend</CardTitle>
            <CardDescription>
              Content flagging activity over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {flaggedTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={flaggedTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value) => [value, 'Flagged Items']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#FF8042" 
                    fill="#FF8042" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No trend data available for selected period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Moderation Queue Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Queue Status Overview
          </CardTitle>
          <CardDescription>
            Current state of the moderation queue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {moderationStats?.pending_count || 0}
              </div>
              <div className="text-sm text-yellow-600 font-medium">Pending Review</div>
              <div className="text-xs text-yellow-500 mt-1">
                Requires immediate attention
              </div>
            </div>
            
            <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {moderationStats?.daily_processed || 0}
              </div>
              <div className="text-sm text-green-600 font-medium">Processed Today</div>
              <div className="text-xs text-green-500 mt-1">
                {moderationStats?.approval_rate.toFixed(1) || 0}% approval rate
              </div>
            </div>
            
            <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {moderationStats?.avg_processing_time.toFixed(1) || 0}h
              </div>
              <div className="text-sm text-blue-600 font-medium">Avg Processing Time</div>
              <div className="text-xs text-blue-500 mt-1">
                Target: &lt; 12 hours
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};