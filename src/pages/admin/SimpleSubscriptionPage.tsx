import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  CreditCard, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  ArrowLeft,
  RefreshCw 
} from 'lucide-react';

interface SubscriptionStats {
  totalUsers: number;
  activeUsers: number;
  estimatedRevenue: number;
}

export default function SimpleSubscriptionPage() {
  const [stats, setStats] = useState<SubscriptionStats>({
    totalUsers: 0,
    activeUsers: 0,
    estimatedRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptionStats();
  }, []);

  const loadSubscriptionStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user stats (since we don't have subscription table yet)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, created_at');

      if (profilesError) throw profilesError;

      const totalUsers = profiles?.length || 0;
      const activeUsers = totalUsers; // Assume all users are active for now
      
      // Estimate revenue based on user count (placeholder calculation)
      const estimatedRevenue = Math.round(totalUsers * 15.99); // Assume avg $15.99/user

      setStats({
        totalUsers,
        activeUsers,
        estimatedRevenue
      });

    } catch (err) {
      console.error('Error loading subscription stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => window.location.href = '/admin'}
                className="gap-2 text-gray-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Admin
              </Button>
              <CreditCard className="w-8 h-8 text-yellow-400" />
              <h1 className="text-2xl font-bold text-white">Subscription Management</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={loadSubscriptionStats} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Billing & Subscriptions</h2>
          <p className="text-gray-400">Manage user subscriptions, billing issues, and payment processing</p>
          {error && (
            <div className="mt-4 p-4 bg-red-900 border border-red-700 rounded-lg">
              <p className="text-red-300">Error: {error}</p>
            </div>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {loading ? '...' : stats.totalUsers.toLocaleString()}
              </div>
              <p className="text-xs text-gray-400">Registered users</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Estimated Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${loading ? '...' : stats.estimatedRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-gray-400">Based on user count</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Active Users</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {loading ? '...' : stats.activeUsers.toLocaleString()}
              </div>
              <p className="text-xs text-gray-400">
                {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Avg Revenue/User</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${stats.totalUsers > 0 ? (stats.estimatedRevenue / stats.totalUsers).toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-gray-400">Per user estimate</p>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Management Sections */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Subscriptions */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Subscriptions</CardTitle>
              <CardDescription className="text-gray-400">
                Latest subscription activities and changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[].map((sub, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{sub.user}</p>
                      <p className="text-xs text-gray-400">{sub.plan} Plan • {sub.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={sub.status === 'active' ? 'default' : 'secondary'}
                        className={sub.status === 'active' ? 'bg-green-600' : 'bg-gray-600'}
                      >
                        {sub.status}
                      </Badge>
                      <span className="text-sm font-medium text-white">{sub.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Billing Issues */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Billing Issues</CardTitle>
              <CardDescription className="text-gray-400">
                Payment failures and billing problems requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[].map((issue, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{issue.user}</p>
                      <p className="text-xs text-gray-400">{issue.issue} • {issue.plan} Plan • {issue.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="secondary"
                        className={
                          issue.severity === 'high' ? 'bg-red-600' : 
                          issue.severity === 'medium' ? 'bg-yellow-600' : 'bg-blue-600'
                        }
                      >
                        {issue.severity}
                      </Badge>
                      <Button size="sm" variant="outline">
                        Resolve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Plans Overview */}
        <Card className="mt-8 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Subscription Plans Overview</CardTitle>
            <CardDescription className="text-gray-400">
              Current subscription plan distribution and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">{stats.totalUsers}</div>
                <div className="text-sm text-gray-300">Free Plan</div>
                <div className="text-xs text-gray-400">$0/month</div>
              </div>
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-green-400">0</div>
                <div className="text-sm text-gray-300">Pro Plan</div>
                <div className="text-xs text-gray-400">$29.99/month</div>
              </div>
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-purple-400">0</div>
                <div className="text-sm text-gray-300">Premium Plan</div>
                <div className="text-xs text-gray-400">$49.99/month</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mt-8 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
            <CardDescription className="text-gray-400">
              Common subscription management tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button className="h-20 flex flex-col items-center justify-center gap-2">
                <CreditCard className="w-6 h-6" />
                <span className="text-sm">Process Refund</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <Users className="w-6 h-6" />
                <span className="text-sm">Bulk Actions</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <TrendingUp className="w-6 h-6" />
                <span className="text-sm">Export Data</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                <span className="text-sm">Resolve Issues</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}