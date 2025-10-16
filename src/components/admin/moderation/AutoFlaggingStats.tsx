import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, Shield, Activity } from 'lucide-react';
import { useAutoFlagging } from '@/hooks/use-auto-flagging';

export function AutoFlaggingStats() {
  const { stats, isLoadingStats, loadStats } = useAutoFlagging();
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    loadStats(parseInt(timeRange));
  }, [timeRange, loadStats]);

  const handleRefresh = () => {
    loadStats(parseInt(timeRange));
  };

  const getRiskLevelColor = (score: number) => {
    if (score >= 70) return 'destructive';
    if (score >= 40) return 'default';
    return 'secondary';
  };

  const getRiskLevelText = (score: number) => {
    if (score >= 70) return 'High Risk';
    if (score >= 40) return 'Medium Risk';
    return 'Low Risk';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Auto-Flagging Statistics</h3>
          <p className="text-sm text-muted-foreground">
            Automated content analysis and flagging metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleRefresh} 
            disabled={isLoadingStats}
            size="sm"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Analyzed</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? '...' : stats?.total_analyzed.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Total pieces analyzed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Flagged</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? '...' : stats?.total_flagged.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Automatically flagged for review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flag Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? '...' : `${stats?.flag_rate.toFixed(1) || '0.0'}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Percentage of content flagged
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? '...' : stats?.avg_risk_score.toFixed(0) || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Average risk score (0-100)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Score Distribution */}
      {stats && stats.avg_risk_score > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risk Assessment</CardTitle>
            <CardDescription>
              Average risk level of flagged content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Risk Level</span>
                <Badge variant={getRiskLevelColor(stats.avg_risk_score)}>
                  {getRiskLevelText(stats.avg_risk_score)}
                </Badge>
              </div>
              <Progress 
                value={stats.avg_risk_score} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low (0-39)</span>
                <span>Medium (40-69)</span>
                <span>High (70-100)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Factor Breakdown */}
      {stats && Object.keys(stats.risk_factor_breakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risk Factor Breakdown</CardTitle>
            <CardDescription>
              Most common reasons for content flagging
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.risk_factor_breakdown)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([factor, count]) => (
                  <div key={factor} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {factor.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{count}</span>
                      <div className="w-16 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min((count / Math.max(...Object.values(stats.risk_factor_breakdown))) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">System Status</CardTitle>
          <CardDescription>
            Auto-flagging system health and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">Active</div>
              <p className="text-xs text-muted-foreground">System Status</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {stats ? `${(stats.flag_rate < 10 ? 'Good' : stats.flag_rate < 20 ? 'Fair' : 'High')}` : 'Unknown'}
              </div>
              <p className="text-xs text-muted-foreground">Flag Rate Health</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">Real-time</div>
              <p className="text-xs text-muted-foreground">Processing Mode</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}