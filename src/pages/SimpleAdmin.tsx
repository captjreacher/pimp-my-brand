import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Settings, BarChart3, MessageSquare, AlertTriangle, CreditCard, Bot } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  app_role?: string;
  admin_permissions?: string[];
}

const SimpleAdmin = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setError('Not authenticated. Please sign in.');
        setLoading(false);
        return;
      }

      setUser(user);

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        setError(`Profile error: ${profileError.message}`);
        setLoading(false);
        return;
      }

      if (!profile) {
        setError('No profile found for this user.');
        setLoading(false);
        return;
      }

      // Check admin privileges
      if (!profile.app_role || profile.app_role === 'user') {
        setError(`Access denied. Your role: ${profile.app_role || 'user'}. Need: admin, super_admin, or moderator.`);
        setLoading(false);
        return;
      }

      setProfile(profile);
      setLoading(false);
    } catch (err) {
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Admin Access Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">{error}</p>
            <div className="space-y-2 text-sm text-gray-400">
              <p><strong>Debug Info:</strong></p>
              <p>User ID: {user?.id || 'Not available'}</p>
              <p>Email: {user?.email || 'Not available'}</p>
              <p>Profile Role: {profile?.app_role || 'Not available'}</p>
            </div>
            <Button 
              onClick={() => window.location.href = '/dashboard'} 
              className="w-full mt-4"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300">
                Welcome, {profile?.full_name || profile?.email}
              </span>
              <span className="px-2 py-1 bg-blue-600 text-blue-100 rounded-full text-xs font-medium">
                {profile?.app_role}
              </span>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/dashboard'}
              >
                Back to Dashboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/admin'}
              >
                Full Admin System
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h2>
              <p className="text-gray-400">Manage your application and users</p>
            </div>
            <Button 
              onClick={() => window.location.href = '/admin'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Full Admin System
            </Button>
          </div>
        </div>

        {/* Admin Cards */}
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
              <p className="text-gray-300 mb-4">Manage user accounts, roles, and permissions</p>
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  onClick={() => window.location.href = '/admin/users'}
                >
                  Full User Management
                </Button>
                <Button 
                  variant="outline"
                  className="w-full" 
                  onClick={() => window.location.href = '/working-admin'}
                >
                  Simple User List
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <BarChart3 className="w-5 h-5 text-green-400" />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">View system metrics and user analytics</p>
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
                <MessageSquare className="w-5 h-5 text-orange-400" />
                Content Moderation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">Review and moderate user-generated content</p>
              <Button 
                className="w-full"
                onClick={() => window.location.href = '/admin/moderation'}
              >
                Moderate Content
              </Button>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Settings className="w-5 h-5 text-purple-400" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">Configure system settings and preferences</p>
              <Button 
                className="w-full"
                onClick={() => window.location.href = '/admin/config'}
              >
                System Config
              </Button>
            </CardContent>
          </Card>

          {/* Security Management */}
          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="w-5 h-5 text-red-400" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">Manage security settings and authentication</p>
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
                Communication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">Send notifications and manage user communications</p>
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
                Subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">Manage user subscriptions and billing</p>
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
                AI Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">Monitor and manage AI-generated content</p>
              <Button 
                className="w-full"
                onClick={() => window.location.href = '/admin/ai-content'}
              >
                AI Management
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Debug Information */}
        <Card className="mt-8 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2 text-gray-300">User Info:</h4>
                <p className="text-gray-400">ID: {user?.id}</p>
                <p className="text-gray-400">Email: {user?.email}</p>
                <p className="text-gray-400">Created: {user?.created_at}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-gray-300">Profile Info:</h4>
                <p className="text-gray-400">Role: {profile?.app_role}</p>
                <p className="text-gray-400">Permissions: {profile?.admin_permissions?.join(', ') || 'None'}</p>
                <p className="text-gray-400">Full Name: {profile?.full_name || 'Not set'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SimpleAdmin;