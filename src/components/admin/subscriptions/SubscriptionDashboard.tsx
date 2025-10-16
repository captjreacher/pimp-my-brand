import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  CreditCard, 
  UserCheck,
  UserX,
  UserPlus 
} from 'lucide-react';
import { SubscriptionMetrics } from '@/lib/admin/types/subscription-types';

interface SubscriptionDashboardProps {
  metrics: SubscriptionMetrics;
  isLoading?: boolean;
}

export function SubscriptionDashboard({ metrics, isLoading }: SubscriptionDashboardProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.total_revenue)}</div>
            <p className="text-xs text-muted-foreground">
              Annualized from MRR
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.mrr)}</div>
            <p className="text-xs text-muted-foreground">
              Current MRR
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.active_subscriptions}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            {metrics.churn_rate > 5 ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(metrics.churn_rate)}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(metrics.conversion_rate)}</div>
            <p className="text-xs text-muted-foreground">
              Trial to paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Subscriptions</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.new_subscriptions_this_month}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancellations</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.cancellations_this_month}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial Conversions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.trial_conversions}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Health Indicators */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Subscription Health</CardTitle>
            <CardDescription>
              Key performance indicators for subscription business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Churn Rate</span>
                <span className={metrics.churn_rate > 5 ? 'text-red-500' : 'text-green-500'}>
                  {formatPercentage(metrics.churn_rate)}
                </span>
              </div>
              <Progress 
                value={Math.min(metrics.churn_rate, 20)} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                Target: &lt; 5% monthly
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Conversion Rate</span>
                <span className={metrics.conversion_rate > 15 ? 'text-green-500' : 'text-yellow-500'}>
                  {formatPercentage(metrics.conversion_rate)}
                </span>
              </div>
              <Progress 
                value={Math.min(metrics.conversion_rate, 50)} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                Target: &gt; 15% trial conversion
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Growth Metrics</CardTitle>
            <CardDescription>
              Monthly growth and retention indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Net Growth</span>
              <Badge variant={
                metrics.new_subscriptions_this_month > metrics.cancellations_this_month 
                  ? 'default' 
                  : 'destructive'
              }>
                {metrics.new_subscriptions_this_month - metrics.cancellations_this_month > 0 ? '+' : ''}
                {metrics.new_subscriptions_this_month - metrics.cancellations_this_month}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Growth Rate</span>
              <Badge variant="outline">
                {formatPercentage(
                  metrics.active_subscriptions > 0 
                    ? ((metrics.new_subscriptions_this_month - metrics.cancellations_this_month) / metrics.active_subscriptions) * 100
                    : 0
                )}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Revenue Growth</span>
              <Badge variant="outline">
                {formatCurrency(metrics.new_subscriptions_this_month * 29)} {/* Assuming average $29/month */}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}