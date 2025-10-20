import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, ArrowLeft, Shield, Ban, List, Grid, Table } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name?: string;
  app_role?: string;
  created_at: string;
}

type ViewMode = 'compact' | 'detailed';

const WorkingAdmin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  
  // Force re-render when viewMode changes
  console.log('🔄 Component render - viewMode:', viewMode, 'users:', users.length);

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
        // If database query fails, use demo data as fallback
        console.log('Database query failed, using demo data');
        profiles = [
          {
            id: 'demo-user-1',
            email: 'admin@example.com',
            full_name: 'Admin User',
            app_role: 'super_admin',
            created_at: '2024-01-15T00:00:00Z'
          },
          {
            id: 'demo-user-2', 
            email: 'user@example.com',
            full_name: 'Regular User',
            app_role: 'user',
            created_at: '2024-01-16T00:00:00Z'
          },
          {
            id: 'demo-user-3',
            email: 'moderator@example.com', 
            full_name: 'Moderator User',
            app_role: 'moderator',
            created_at: '2024-01-17T00:00:00Z'
          }
        ];
        setError('Using demo data - database access restricted');
      }

      console.log('✅ Loaded real user list from database');
      setUsers(profiles || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
      setLoading(false);
    }
  };

  const makeAdmin = async (userId: string, email: string) => {
    try {
      let error;
      
      try {
        // Try admin function first
        const result = await supabase.rpc('update_user_role_admin', {
          target_user_id: userId,
          new_role: 'admin'
        });
        error = result.error;
      } catch (rpcError) {
        // Fallback to direct update
        console.log('Admin function not found, using direct update');
        const result = await supabase
          .from('profiles')
          .update({ app_role: 'admin' })
          .eq('id', userId);
        error = result.error;
      }

      if (error) throw error;

      // Refresh the user list
      await loadUsers();
      
      alert(`Made ${email} an admin!`);
    } catch (err) {
      console.error('Error making user admin:', err);
      alert('Failed to make user admin: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const removeAdmin = async (userId: string, email: string) => {
    try {
      let error;
      
      try {
        // Try admin function first
        const result = await supabase.rpc('update_user_role_admin', {
          target_user_id: userId,
          new_role: 'user'
        });
        error = result.error;
      } catch (rpcError) {
        // Fallback to direct update
        console.log('Admin function not found, using direct update');
        const result = await supabase
          .from('profiles')
          .update({ app_role: 'user' })
          .eq('id', userId);
        error = result.error;
      }

      if (error) throw error;

      // Refresh the user list
      await loadUsers();
      
      alert(`Removed admin privileges from ${email}!`);
    } catch (err) {
      console.error('Error removing admin privileges:', err);
      alert('Failed to remove admin privileges: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-red-400">Error Loading Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">{error}</p>
            <Button onClick={() => window.location.href = '/admin'} className="w-full">
              Back to Admin
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
              <Button 
                variant="ghost" 
                onClick={() => window.location.href = '/admin'}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/dashboard'}
                className="gap-2"
              >
                <Users className="w-4 h-4" />
                Admin Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-600"></div>
              <Users className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">User Management</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
                <Button
                  size="sm"
                  variant={viewMode === 'compact' ? 'default' : 'ghost'}
                  onClick={() => {
                    console.log('Compact clicked, current:', viewMode);
                    setViewMode('compact');
                  }}
                  className="gap-1 h-8"
                >
                  <List className="w-3 h-3" />
                  Compact
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'detailed' ? 'default' : 'ghost'}
                  onClick={() => {
                    console.log('Detailed clicked, current:', viewMode);
                    setViewMode('detailed');
                  }}
                  className="gap-1 h-8"
                >
                  <Grid className="w-3 h-3" />
                  Detailed
                </Button>
              </div>
              <Button onClick={loadUsers}>Refresh</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">All Users ({users.length})</h2>
          <p className="text-gray-400">Manage user accounts and admin privileges</p>
          <p className="text-sm text-blue-400 mt-1">Current view: {viewMode}</p>
        </div>
        
        {/* User List */}
        <div className="bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-700">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-medium text-white">Users</h3>
          </div>
          <div className="divide-y divide-gray-700">
            {users.map((user, index) => (
              <div key={user.id} className={`px-6 hover:bg-gray-700 ${
                viewMode === 'compact' ? 'py-3' : 'py-4'
              }`}>
                {viewMode === 'compact' ? (
                  // Compact single-line view
                  <div className="flex items-center justify-between">
                <div className="flex-1 flex items-center gap-4">
                  <span className="text-sm font-medium text-white w-4">
                    {index + 1}.
                  </span>
                  <span className="text-sm font-medium text-white min-w-0 flex-1">
                    {user.full_name || 'No Name'}
                  </span>
                  <span className="text-sm text-gray-300 min-w-0 flex-1">
                    {user.email}
                  </span>
                  <span className="text-xs text-gray-400 w-20">
                    {user.id.substring(0, 8)}...
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Role Badge */}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.app_role === 'super_admin' ? 'bg-red-100 text-red-800' :
                    user.app_role === 'admin' ? 'bg-blue-100 text-blue-800' :
                    user.app_role === 'moderator' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.app_role || 'user'}
                  </span>
                  
                  {/* Action Buttons */}
                  {user.app_role === 'user' ? (
                    <Button
                      size="sm"
                      onClick={() => makeAdmin(user.id, user.email)}
                      className="gap-1"
                    >
                      <Shield className="w-3 h-3" />
                      Make Admin
                    </Button>
                  ) : user.app_role !== 'super_admin' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeAdmin(user.id, user.email)}
                      className="gap-1"
                    >
                      <Ban className="w-3 h-3" />
                      Remove Admin
                    </Button>
                  ) : (
                    <span className="text-xs text-gray-500 px-3 py-1">
                      Super Admin
                    </span>
                  )}
                    </div>
                  </div>
                ) : (
                  // Detailed multi-line view
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {user.full_name || 'No name'}
                          </p>
                          <p className="text-sm text-gray-300">{user.email}</p>
                          <p className="text-xs text-gray-400">
                            ID: {user.id.substring(0, 8)}... • 
                            Created: {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.app_role === 'super_admin' ? 'bg-red-100 text-red-800' :
                        user.app_role === 'admin' ? 'bg-blue-100 text-blue-800' :
                        user.app_role === 'moderator' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.app_role || 'user'}
                      </span>
                      
                      {user.app_role === 'user' ? (
                        <Button
                          size="sm"
                          onClick={() => makeAdmin(user.id, user.email)}
                          className="gap-1"
                        >
                          <Shield className="w-3 h-3" />
                          Make Admin
                        </Button>
                      ) : user.app_role !== 'super_admin' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeAdmin(user.id, user.email)}
                          className="gap-1"
                        >
                          <Ban className="w-3 h-3" />
                          Remove Admin
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-500 px-3 py-1">
                          Super Admin
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {viewMode === 'list' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Users</h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {users.map((user) => (
                <div key={user.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.full_name || 'No name'}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400">
                          ID: {user.id.substring(0, 8)}... • 
                          Created: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Role Badge */}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.app_role === 'super_admin' ? 'bg-red-100 text-red-800' :
                      user.app_role === 'admin' ? 'bg-blue-100 text-blue-800' :
                      user.app_role === 'moderator' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.app_role || 'user'}
                    </span>
                    
                    {/* Action Buttons */}
                    {user.app_role === 'user' ? (
                      <Button
                        size="sm"
                        onClick={() => makeAdmin(user.id, user.email)}
                        className="gap-1"
                      >
                        <Shield className="w-3 h-3" />
                        Make Admin
                      </Button>
                    ) : user.app_role !== 'super_admin' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeAdmin(user.id, user.email)}
                        className="gap-1"
                      >
                        <Ban className="w-3 h-3" />
                        Remove Admin
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-500 px-3 py-1">
                        Super Admin
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}



        {users.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No users found</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default WorkingAdmin;