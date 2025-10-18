import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Shield, 
  Ban, 
  ArrowLeft,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  app_role?: string;
  created_at: string;
}

export default function SimpleUserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    admins: 0,
    suspended: 0
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try admin function first, fallback to direct query
      let profiles, profilesError;
      
      try {
        // Try admin function (bypasses RLS)
        const result = await supabase.rpc('get_all_users_admin');
        profiles = result.data;
        profilesError = result.error;
      } catch (rpcError) {
        // Fallback to direct query if admin function doesn't exist
        console.log('Admin function not found, using direct query');
        const result = await supabase
          .from('profiles')
          .select('id, email, full_name, app_role, created_at')
          .order('created_at', { ascending: false });
        profiles = result.data;
        profilesError = result.error;
      }

      if (profilesError) {
        // If database query fails, show error
        console.log('Database query failed:', profilesError?.message);
        profiles = []; // No fallback data
        setError(`Database error: ${profilesError?.message || 'Unknown error'}`);
      }

      setUsers(profiles || []);

      // Calculate stats
      const total = profiles?.length || 0;
      const admins = profiles?.filter(p => p.app_role && ['admin', 'super_admin', 'moderator'].includes(p.app_role)).length || 0;
      const active = total; // All users are considered active unless we have a separate status field
      const suspended = 0; // We don't have a suspended status in the current schema

      setStats({
        total,
        active,
        admins,
        suspended
      });

    } catch (err) {
      console.error('Error loading users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      let error;
      
      try {
        // Try admin function first
        const result = await supabase.rpc('update_user_role_admin', {
          target_user_id: userId,
          new_role: newRole
        });
        error = result.error;
      } catch (rpcError) {
        // Fallback to direct update
        console.log('Admin function not found, using direct update');
        const result = await supabase
          .from('profiles')
          .update({ app_role: newRole })
          .eq('id', userId);
        error = result.error;
      }

      if (error) throw error;

      // Refresh the user list
      await loadUsers();
      
    } catch (err) {
      console.error('Error updating user role:', err);
      alert('Failed to update user role: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading users...</p>
        </div>
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
              <Button 
                variant="ghost" 
                onClick={() => window.location.href = '/admin'}
                className="gap-2 text-gray-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Admin
              </Button>
              <Users className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">User Management</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={loadUsers}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/working-admin'}
              >
                Simple User List
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">User Management (Simple)</h2>
          <p className="text-gray-400">Manage user accounts, roles, and permissions - Real Data Mode</p>
          {error && (
            <div className="mt-4 p-4 bg-red-900 border border-red-700 rounded-lg">
              <p className="text-red-300">Error: {error}</p>
            </div>
          )}
        </div>

        {/* User Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <p className="text-xs text-gray-400">Registered users</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Active Users</CardTitle>
              <Users className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.active}</div>
              <p className="text-xs text-gray-400">{stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Admin Users</CardTitle>
              <Shield className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.admins}</div>
              <p className="text-xs text-gray-400">Admin & super admin</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Suspended</CardTitle>
              <Ban className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.suspended}</div>
              <p className="text-xs text-gray-400">Suspended accounts</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users by name, email, or ID..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User List */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">All Users ({users.length})</CardTitle>
            <CardDescription className="text-gray-400">
              Manage user accounts and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No users found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {user.full_name ? 
                              user.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 
                              user.email.charAt(0).toUpperCase()
                            }
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {user.full_name || 'No Name'}
                          </p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                          <p className="text-xs text-gray-500">
                            Joined: {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Badge 
                        variant="secondary"
                        className={
                          user.app_role === 'super_admin' ? 'bg-red-600' :
                          user.app_role === 'admin' ? 'bg-blue-600' :
                          user.app_role === 'moderator' ? 'bg-yellow-600' : 'bg-gray-600'
                        }
                      >
                        {user.app_role?.replace('_', ' ') || 'user'}
                      </Badge>
                      
                      <div className="flex gap-2">
                        {(!user.app_role || user.app_role === 'user') && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateUserRole(user.id, 'admin')}
                          >
                            <Shield className="w-3 h-3 mr-1" />
                            Make Admin
                          </Button>
                        )}
                        {user.app_role && user.app_role !== 'user' && user.app_role !== 'super_admin' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateUserRole(user.id, 'user')}
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            Remove Admin
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mt-8 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
            <CardDescription className="text-gray-400">
              Common user management tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button className="h-20 flex flex-col items-center justify-center gap-2">
                <Users className="w-6 h-6" />
                <span className="text-sm">Add User</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <Shield className="w-6 h-6" />
                <span className="text-sm">Bulk Role Change</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <Ban className="w-6 h-6" />
                <span className="text-sm">Bulk Suspend</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6" />
                <span className="text-sm">Export Users</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}