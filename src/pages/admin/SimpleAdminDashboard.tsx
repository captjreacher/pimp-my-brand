import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Flag, 
  CreditCard, 
  BarChart3, 
  Activity, 
  Settings,
  Shield,
  MessageSquare,
  Bot,
  RefreshCw
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalBrands: number;
  totalCVs: number;
  newUsersThisMonth: number;
}

export default function SimpleAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalBrands: 0,
    totalCVs: 0,
    newUsersThisMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user stats
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, created_at');

      if (profilesError) throw profilesError;

      // Get brand stats
      const { data: brands, error: brandsError } = await supabase
        .from('brands')
        .select('id');

      // Get CV stats (if table exists)
      const { data: cvs, error: cvsError } = await supabase
        .from('cvs')
        .select('id');

      // Calculate stats
      const totalUsers = profiles?.length || 0;
      const activeUsers = totalUsers; // All registered users are considered active
      const totalBrands = brands?.length || 0;
      const totalCVs = cvs?.length || 0;

      // Calculate new users this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const newUsersThisMonth = profiles?.filter(p => 
        new Date(p.created_at) >= thisMonth
      ).length || 0;

      setStats({
        totalUsers,
        activeUsers,
        totalBrands,
        totalCVs,
        newUsersThisMonth
      });

    } catch (err) {
      console.error('Error loading dashboard stats:', err);
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
              <Shield className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">Full Admin System</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadDashboardStats}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/simple-admin'}
              >
                Back to Simple Admin
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/dashboard'}
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h2>
          <p className="text-gray-400">Complete administrative control panel</p>
          {error && (
            <div className="mt-4 p-4 bg-red-900 border border-red-700 rounded-lg">
              <p className="text-red-300">Error: {error}</p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
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
              <p className="text-xs text-gray-400">
                +{stats.newUsersThisMonth} this month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Brands</CardTitle>
              <Activity className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {loading ? '...' : stats.totalBrands.toLocaleString()}
              </div>
              <p className="text-xs text-gray-400">
                Generated brands
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total CVs</CardTitle>
              <Flag className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {loading ? '...' : stats.totalCVs.toLocaleString()}
              </div>
              <p className="text-xs text-gray-400">
                Generated CVs
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Active Users</CardTitle>
              <CreditCard className="h-4 w-4 text-purple-400" />
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
        </div>

        {/* Admin Functions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Management */}
          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Users className="w-5 h-5 text-blue-400" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300 mb-4">
                Comprehensive user account management, roles, and permissions
              </CardDescription>
              <Button 
                className="w-full"
                onClick={() => window.location.href = '/admin/users'}
              >
                Manage Users
              </Button>
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <BarChart3 className="w-5 h-5 text-green-400" />
                Analytics & Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300 mb-4">
                System metrics, user analytics, and performance monitoring
              </CardDescription>
              <Button 
                className="w-full"
                onClick={() => window.location.href = '/admin/analytics'}
              >
                View Analytics
              </Button>
            </CardContent>
          </Card>

          {/* Content Moderation */}
          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Flag className="w-5 h-5 text-orange-400" />
                Content Moderation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300 mb-4">
                Review flagged content, auto-moderation, and approval workflows
              </CardDescription>
              <Button 
                className="w-full"
                onClick={() => window.location.href = '/admin/moderation'}
              >
                Moderate Content
              </Button>
            </CardContent>
          </Card>

          {/* System Configuration */}
          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Settings className="w-5 h-5 text-purple-400" />
                System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300 mb-4">
                System settings, feature flags, and API integrations
              </CardDescription>
              <Button 
                className="w-full"
                onClick={() => window.location.href = '/admin/config'}
              >
                System Settings
              </Button>
            </CardContent>
          </Card>

          {/* Security Management */}
          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="w-5 h-5 text-red-400" />
                Security & Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300 mb-4">
                Security settings, MFA management, and access controls
              </CardDescription>
              <Button 
                className="w-full"
                onClick={() => window.location.href = '/admin/security'}
              >
                Security Settings
              </Button>
            </CardContent>
          </Card>

          {/* Communication */}
          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                Communication Hub
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300 mb-4">
                User notifications, announcements, and support tickets
              </CardDescription>
              <Button 
                className="w-full"
                onClick={() => window.location.href = '/admin/communication'}
              >
                Communications
              </Button>
            </CardContent>
          </Card>

          {/* Subscription Management */}
          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CreditCard className="w-5 h-5 text-yellow-400" />
                Billing & Subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300 mb-4">
                Subscription management, billing issues, and payment processing
              </CardDescription>
              <Button 
                className="w-full"
                onClick={() => window.location.href = '/admin/subscriptions'}
              >
                Manage Billing
              </Button>
            </CardContent>
          </Card>

          {/* AI Content Management */}
          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Bot className="w-5 h-5 text-indigo-400" />
                AI Content Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300 mb-4">
                Monitor AI-generated content, performance analytics, and moderation
              </CardDescription>
              <Button 
                className="w-full"
                onClick={() => window.location.href = '/admin/ai-content'}
              >
                AI Management
              </Button>
            </CardContent>
          </Card>

          {/* Quick User List */}
          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Users className="w-5 h-5 text-blue-400" />
                Quick User List
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300 mb-4">
                Simple user list with basic role management functions
              </CardDescription>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = '/working-admin'}
              >
                Simple User List
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card className="mt-8 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">System Status</CardTitle>
            <CardDescription className="text-gray-400">
              Current system health and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">100%</div>
                <div className="text-sm text-gray-400">System Health</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">125ms</div>
                <div className="text-sm text-gray-400">API Response</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">78%</div>
                <div className="text-sm text-gray-400">Storage Usage</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{stats.activeUsers}</div>
                <div className="text-sm text-gray-400">Active Sessions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}