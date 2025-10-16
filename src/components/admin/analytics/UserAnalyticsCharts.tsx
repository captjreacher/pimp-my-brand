import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
import type { UserAnalytics, AnalyticsTimeRange } from '@/lib/admin/types/analytics-types';

interface UserAnalyticsChartsProps {
  userAnalytics: UserAnalytics | null;
  timeRange: AnalyticsTimeRange;
  loading: boolean;
  detailed?: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-3">
    <Skeleton className="h-4 w-32" />
    <Skeleton className="h-48 w-full" />
  </div>
);

export const UserAnalyticsCharts: React.FC<UserAnalyticsChartsProps> = ({
  userAnalytics,
  timeRange,
  loading,
  detailed = false
}) => {
  // Prepare subscription distribution data
  const subscriptionData = userAnalytics?.users_by_subscription 
    ? Object.entries(userAnalytics.users_by_subscription).map(([tier, count]) => ({
        name: tier.charAt(0).toUpperCase() + tier.slice(1),
        value: count,
        percentage: ((count / userAnalytics.total_users) * 100).toFixed(1)
      }))
    : [];

  // Prepare user growth trend data
  const growthData = userAnalytics?.user_growth_trend || [];

  // Prepare engagement metrics
  const engagementData = userAnalytics?.engagement_metrics ? [
    {
      name: 'Session Duration',
      value: userAnalytics.engagement_metrics.avg_session_duration,
      unit: 'minutes'
    },
    {
      name: 'Bounce Rate',
      value: userAnalytics.engagement_metrics.bounce_rate,
      unit: '%'
    },
    {
      name: 'Pages/Session',
      value: userAnalytics.engagement_metrics.pages_per_session,
      unit: 'pages'
    }
  ] : [];

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingSkeleton />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingSkeleton />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userAnalytics?.total_users || 0}</div>
            <p className="text-xs text-muted-foreground">
              {userAnalytics?.new_users || 0} new this period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userAnalytics?.active_users || 0}</div>
            <p className="text-xs text-muted-foreground">
              {userAnalytics?.user_retention_rate.toFixed(1) || 0}% retention rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Suspended Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {userAnalytics?.suspended_users || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {((userAnalytics?.suspended_users || 0) / (userAnalytics?.total_users || 1) * 100).toFixed(2)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className={`grid grid-cols-1 ${detailed ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} gap-6`}>
        {/* Subscription Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Distribution by Subscription</CardTitle>
            <CardDescription>
              Breakdown of users by subscription tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subscriptionData.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={subscriptionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {subscriptionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="flex flex-wrap gap-2">
                  {subscriptionData.map((item, index) => (
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
                No subscription data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Growth Trend */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth Trend</CardTitle>
            <CardDescription>
              New user registrations over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value) => [value, 'New Users']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No growth data available for selected period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics (detailed view only) */}
      {detailed && engagementData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>User Engagement Metrics</CardTitle>
            <CardDescription>
              Key engagement indicators for the selected time period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value} ${props.payload.unit}`, 
                    name
                  ]}
                />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* User Activity Heatmap (detailed view only) */}
      {detailed && (
        <Card>
          <CardHeader>
            <CardTitle>User Activity Overview</CardTitle>
            <CardDescription>
              Summary of user activity patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {userAnalytics?.active_users || 0}
                </div>
                <div className="text-sm text-blue-600">Active Users</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {userAnalytics?.new_users || 0}
                </div>
                <div className="text-sm text-green-600">New Users</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {userAnalytics?.user_retention_rate.toFixed(1) || 0}%
                </div>
                <div className="text-sm text-yellow-600">Retention Rate</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {userAnalytics?.suspended_users || 0}
                </div>
                <div className="text-sm text-red-600">Suspended</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};