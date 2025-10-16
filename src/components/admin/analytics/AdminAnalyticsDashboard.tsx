import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, AlertTriangle, TrendingUp, Users, Activity } from 'lucide-react';
import { useAdminAnalytics, useSystemHealth } from '@/hooks/use-admin-analytics';
import { SystemMetricsCards } from './SystemMetricsCards';
import { UserAnalyticsCharts } from './UserAnalyticsCharts';
import { PerformanceMonitoringPanel } from './PerformanceMonitoringPanel';
import { ContentModerationStats } from './ContentModerationStats';
import { SystemHealthIndicator } from './SystemHealthIndicator';
import { AlertsPanel } from './AlertsPanel';
import type { AnalyticsTimeRange } from '@/lib/admin/types/analytics-types';

interface AdminAnalyticsDashboardProps {
  className?: string;
}

export const AdminAnalyticsDashboard: React.FC<AdminAnalyticsDashboardProps> = ({
  className = ''
}) => {
  const [selectedTab, setSelectedTab] = useState('overview');
  
  const {
    systemMetrics,
    userAnalytics,
    performanceMetrics,
    moderationStats,
    loading,
    error,
    refreshMetrics,
    setTimeRange,
    timeRange
  } = useAdminAnalytics({
    autoRefresh: true,
    refreshInterval: 30000
  });

  const {
    isHealthy,
    alerts,
    loading: healthLoading,
    refresh: refreshHealth
  } = useSystemHealth({
    autoRefresh: true,
    refreshInterval: 10000
  });

  const handleRefresh = async () => {
    await Promise.all([refreshMetrics(), refreshHealth()]);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export analytics data');
  };

  if (error) {
    return (
      <Card className={`${className} border-red-200`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Failed to load analytics: {error}</span>
          </div>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm" 
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor system performance, user activity, and platform health
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <SystemHealthIndicator 
            isHealthy={isHealthy} 
            alertCount={alerts.length}
            loading={healthLoading}
          />
          
          <Select value={timeRange} onValueChange={(value: AnalyticsTimeRange) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button 
            onClick={handleExport} 
            variant="outline" 
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Alerts Panel */}
      {alerts.length > 0 && (
        <AlertsPanel alerts={alerts} onRefresh={refreshHealth} />
      )}

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="moderation" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Moderation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <SystemMetricsCards 
            systemMetrics={systemMetrics}
            userAnalytics={userAnalytics}
            performanceMetrics={performanceMetrics}
            loading={loading}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UserAnalyticsCharts 
              userAnalytics={userAnalytics}
              timeRange={timeRange}
              loading={loading}
            />
            <PerformanceMonitoringPanel 
              performanceMetrics={performanceMetrics}
              timeRange={timeRange}
              loading={loading}
              compact
            />
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserAnalyticsCharts 
            userAnalytics={userAnalytics}
            timeRange={timeRange}
            loading={loading}
            detailed
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceMonitoringPanel 
            performanceMetrics={performanceMetrics}
            timeRange={timeRange}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="moderation" className="space-y-6">
          <ContentModerationStats 
            moderationStats={moderationStats}
            timeRange={timeRange}
            loading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};