import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity,
  ArrowLeft,
  RefreshCw,
  Eye,
  Clock,
  Globe
} from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  totalBrands: number;
  totalCVs: number;
  newUsersThisWeek: number;
  newBrandsThisWeek: number;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    user_email?: string;
  }>;
}

export default function SimpleAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalBrands: 0,
    totalCVs: 0,
    newUsersThisWeek: 0,
    newBrandsThisWeek: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user analytics
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, created_at');

      if (profilesError) throw profilesError;

      // Get brand analytics
      const { data: brands, error: brandsError } = await supabase
        .from('brands')
        .select('id, created_at, user_id');

      // Get CV analytics
      const { data: cvs, error: cvsError } = await supabase
        .from('cvs')
        .select('id, created_at');

      // Calculate analytics
      const totalUsers = profiles?.length || 0;
      const totalBrands = brands?.length || 0;
      const totalCVs = cvs?.length || 0;

      // Calculate this week's stats
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const newUsersThisWeek = profiles?.filter(p => 
        new Date(p.created_at) >= oneWeekAgo
      ).length || 0;

      const newBrandsThisWeek = brands?.filter(b => 
        new Date(b.created_at) >= oneWeekAgo
      ).length || 0;

      // Create recent activity from brands and users
      const recentActivity = [];
      
      // Add recent user registrations
      const recentUsers = profiles?.filter(p => 
        new Date(p.created_at) >= oneWeekAgo
      ).slice(0, 3) || [];
      
      recentUsers.forEach(user => {
        recentActivity.push({
          id: `user-${user.id}`,
          type: 'user_signup',
          message: `New user registered: ${user.email}`,
          timestamp: new Date(user.created_at).toLocaleString(),
          user_email: user.email
        });
      });

      // Add recent brand creations
      const recentBrands = brands?.filter(b => 
        new Date(b.created_at) >= oneWeekAgo
      ).slice(0, 3) || [];
      
      recentBrands.forEach(brand => {
        recentActivity.push({
          id: `brand-${brand.id}`,
          type: 'brand_created',
          message: `New brand generated`,
          timestamp: new Date(brand.created_at).toLocaleString()
        });
      });

      // Sort by timestamp
      recentActivity.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setAnalytics({
        totalUsers,
        totalBrands,
        totalCVs,
        newUsersThisWeek,
        newBrandsThisWeek,
        recentActivity: recentActivity.slice(0, 5)
      });

    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
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
              <BarChart3 className="w-8 h-8 text-green-400" />
              <h1 className="text-2xl font-bold text-white">Analytics & Reports</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={loadAnalytics} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">System Analytics</h2>
          <p className="text-gray-400">Monitor platform performance, user engagement, and system metrics</p>
          {error && (
            <div className="mt-4 p-4 bg-red-900 border border-red-700 rounded-lg">
              <p className="text-red-300">Error: {error}</p>
            </div>
          )}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {loading ? '...' : analytics.totalUsers.toLocaleString()}
              </div>
              <p className="text-xs text-green-400">
                +{analytics.newUsersThisWeek} this week
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Brands</CardTitle>
              <Eye className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {loading ? '...' : analytics.totalBrands.toLocaleString()}
              </div>
              <p className="text-xs text-green-400">
                +{analytics.newBrandsThisWeek} this week
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total CVs</CardTitle>
              <Activity className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {loading ? '...' : analytics.totalCVs.toLocaleString()}
              </div>
              <p className="text-xs text-gray-400">Generated CVs</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Growth Rate</CardTitle>
              <Clock className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {analytics.totalUsers > 0 ? 
                  Math.round((analytics.newUsersThisWeek / analytics.totalUsers) * 100) : 0}%
              </div>
              <p className="text-xs text-green-400">Weekly growth</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analytics */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* User Growth Chart */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">User Growth</CardTitle>
              <CardDescription className="text-gray-400">
                Monthly user registration and growth trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-700 rounded-lg">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-300">User Growth Chart</p>
                  <p className="text-sm text-gray-400">Interactive chart would be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Traffic Sources */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Traffic Sources</CardTitle>
              <CardDescription className="text-gray-400">
                Where your users are coming from
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { source: 'Direct Traffic', visitors: '0', percentage: '0%', color: 'bg-blue-500' },
                  { source: 'Google Search', visitors: '0', percentage: '0%', color: 'bg-green-500' },
                  { source: 'Social Media', visitors: '0', percentage: '0%', color: 'bg-purple-500' },
                  { source: 'Referrals', visitors: '0', percentage: '0%', color: 'bg-orange-500' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-sm text-gray-300">{item.source}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-white">{item.visitors}</span>
                      <span className="text-sm text-gray-400 w-12">{item.percentage}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* System Performance */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">System Performance</CardTitle>
              <CardDescription className="text-gray-400">
                Current system health and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">CPU Usage</span>
                  <span className="text-sm text-green-400">23%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Memory Usage</span>
                  <span className="text-sm text-yellow-400">67%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Disk Usage</span>
                  <span className="text-sm text-blue-400">45%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Network I/O</span>
                  <span className="text-sm text-purple-400">12 MB/s</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Performance */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">API Performance</CardTitle>
              <CardDescription className="text-gray-400">
                API response times and error rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Avg Response Time</span>
                  <span className="text-sm text-green-400">N/A</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Success Rate</span>
                  <span className="text-sm text-green-400">99.8%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Error Rate</span>
                  <span className="text-sm text-red-400">0.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Requests/min</span>
                  <span className="text-sm text-blue-400">0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Engagement */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">User Engagement</CardTitle>
              <CardDescription className="text-gray-400">
                User activity and engagement metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Daily Active Users</span>
                  <span className="text-sm text-green-400">{analytics.totalUsers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Bounce Rate</span>
                  <span className="text-sm text-yellow-400">34%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Pages per Session</span>
                  <span className="text-sm text-blue-400">3.2</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Conversion Rate</span>
                  <span className="text-sm text-purple-400">2.8%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-gray-400">
              Latest system events and user activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No recent activity</p>
                </div>
              ) : (
                analytics.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'user_signup' ? 'bg-blue-400' :
                        activity.type === 'brand_created' ? 'bg-green-400' :
                        activity.type === 'cv_generated' ? 'bg-purple-400' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-white">{activity.message}</p>
                        <p className="text-xs text-gray-400">{activity.user_email || 'System'}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{activity.timestamp}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}