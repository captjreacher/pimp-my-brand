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
  is_suspended?: boolean;
  subscription_tier?: string;
}

export default function SimpleUserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    app_role: 'user' as 'user' | 'admin' | 'moderator' | 'super_admin',
    password: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    admins: 0,
    suspended: 0
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search term
    if (!searchTerm) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.app_role?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [users, searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try admin function first, fallback to direct query
      let profiles, profilesError;
      
      // Use direct query (RPC function has column issues)
      console.log('Using direct profiles access (RPC function has column issues)');
      const result = await supabase
        .from('profiles')
        .select('id, email, full_name, app_role, subscription_tier, created_at, updated_at, is_suspended, suspended_at, suspended_by, suspension_reason, admin_notes, last_admin_action')
        .order('created_at', { ascending: false });
      profiles = result.data;
      profilesError = result.error;

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
      const active = profiles?.filter(p => !p.is_suspended).length || 0;
      const suspended = profiles?.filter(p => p.is_suspended).length || 0;

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
      
      // Use direct update (RPC function has issues)
      console.log('Using direct update (RPC function has column issues)');
      const result = await supabase
        .from('profiles')
        .update({ app_role: newRole as 'user' | 'admin' | 'moderator' | 'super_admin' })
        .eq('id', userId);
      error = result.error;

      if (error) throw error;

      // Refresh the user list
      await loadUsers();
      alert('User role updated successfully!');
      
    } catch (err) {
      console.error('Error updating user role:', err);
      alert('Failed to update user role: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const suspendUser = async (userId: string, reason: string = 'Administrative action') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_suspended: true, 
          suspended_at: new Date().toISOString(),
          suspension_reason: reason 
        })
        .eq('id', userId);

      if (error) throw error;
      await loadUsers();
      alert('User suspended successfully!');
    } catch (err) {
      console.error('Error suspending user:', err);
      alert('Failed to suspend user: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const activateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_suspended: false, 
          suspended_at: null,
          suspension_reason: null 
        })
        .eq('id', userId);

      if (error) throw error;
      await loadUsers();
      alert('User activated successfully!');
    } catch (err) {
      console.error('Error activating user:', err);
      alert('Failed to activate user: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const editUser = (user: UserProfile) => {
    setEditingUser(user);
  };

  const saveUserEdit = async (updatedUser: UserProfile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: updatedUser.full_name,
          app_role: updatedUser.app_role as 'user' | 'admin' | 'moderator' | 'super_admin'
        })
        .eq('id', updatedUser.id);

      if (error) throw error;
      await loadUsers();
      setEditingUser(null);
      alert('User updated successfully!');
    } catch (err) {
      console.error('Error updating user:', err);
      alert('Failed to update user: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers(filteredUsers.map(user => user.id));
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  const bulkUpdateRole = async (newRole: string) => {
    if (selectedUsers.length === 0) {
      alert('Please select users first');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ app_role: newRole as 'user' | 'admin' | 'moderator' | 'super_admin' })
        .in('id', selectedUsers);

      if (error) throw error;
      await loadUsers();
      clearSelection();
      alert(`Updated ${selectedUsers.length} users successfully!`);
    } catch (err) {
      console.error('Error bulk updating roles:', err);
      alert('Failed to update users: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const bulkSuspend = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select users first');
      return;
    }

    const reason = prompt('Enter suspension reason:') || 'Bulk administrative action';
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_suspended: true, 
          suspended_at: new Date().toISOString(),
          suspension_reason: reason 
        })
        .in('id', selectedUsers);

      if (error) throw error;
      await loadUsers();
      clearSelection();
      alert(`Suspended ${selectedUsers.length} users successfully!`);
    } catch (err) {
      console.error('Error bulk suspending users:', err);
      alert('Failed to suspend users: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const createUser = async () => {
    try {
      if (!newUser.email || !newUser.password) {
        alert('Email and password are required');
        return;
      }

      // In a real app, you'd call Supabase auth.admin.createUser
      // For now, we'll simulate user creation
      const mockUser: UserProfile = {
        id: 'new-' + Date.now(),
        email: newUser.email,
        full_name: newUser.full_name,
        app_role: newUser.app_role,
        created_at: new Date().toISOString(),
        is_suspended: false
      };

      // Add to current users list
      setUsers(prev => [mockUser, ...prev]);
      
      // Reset form
      setNewUser({
        email: '',
        full_name: '',
        app_role: 'user',
        password: ''
      });
      setShowAddUserDialog(false);
      
      alert('User created successfully!\n\nNote: In a real application, this would create an actual user account in Supabase Auth.');
    } catch (err) {
      console.error('Error creating user:', err);
      alert('Failed to create user: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const exportUsers = () => {
    const csvContent = [
      ['ID', 'Email', 'Full Name', 'Role', 'Status', 'Created At'].join(','),
      ...filteredUsers.map(user => [
        user.id,
        user.email,
        user.full_name || '',
        user.app_role || 'user',
        user.is_suspended ? 'Suspended' : 'Active',
        new Date(user.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
                  placeholder="Search users by name, email, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <Card className="mb-6 bg-blue-900 border-blue-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => bulkUpdateRole('admin')} variant="outline">
                    Make Admin
                  </Button>
                  <Button size="sm" onClick={() => bulkUpdateRole('user')} variant="outline">
                    Make User
                  </Button>
                  <Button size="sm" onClick={bulkSuspend} variant="destructive">
                    Suspend
                  </Button>
                  <Button size="sm" onClick={clearSelection} variant="ghost">
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User List */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">All Users ({filteredUsers.length})</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage user accounts and permissions
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={selectAllUsers} variant="outline">
                  Select All
                </Button>
                <Button size="sm" onClick={clearSelection} variant="ghost">
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">
                  {searchTerm ? 'No users match your search' : 'No users found'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-4 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                      />
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {user.full_name ? 
                            user.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 
                            user.email.charAt(0).toUpperCase()
                          }
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {user.full_name || 'No Name'}
                            </p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                            <p className="text-xs text-gray-500">
                              Joined: {new Date(user.created_at).toLocaleDateString()}
                              {user.is_suspended && <span className="text-red-400 ml-2">• Suspended</span>}
                            </p>
                          </div>
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
                        {user.is_suspended ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => activateUser(user.id)}
                            className="text-green-400 border-green-400 hover:bg-green-400 hover:text-black"
                          >
                            Activate
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => suspendUser(user.id)}
                            className="text-red-400 border-red-400 hover:bg-red-400 hover:text-black"
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            Suspend
                          </Button>
                        )}
                        
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
                            Remove Admin
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => editUser(user)}
                        >
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
              <Button 
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => setShowAddUserDialog(true)}
              >
                <Users className="w-6 h-6" />
                <span className="text-sm">Add User</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => {
                  if (selectedUsers.length === 0) {
                    alert('Please select users first');
                    return;
                  }
                  const role = prompt('Enter new role (user, admin, moderator):');
                  if (role) bulkUpdateRole(role);
                }}
              >
                <Shield className="w-6 h-6" />
                <span className="text-sm">Bulk Role Change</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={bulkSuspend}
              >
                <Ban className="w-6 h-6" />
                <span className="text-sm">Bulk Suspend</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={exportUsers}
              >
                <RefreshCw className="w-6 h-6" />
                <span className="text-sm">Export Users</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-96 max-w-90vw">
            <h3 className="text-lg font-semibold text-white mb-4">Edit User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editingUser.full_name || ''}
                  onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={editingUser.app_role || 'user'}
                  onChange={(e) => setEditingUser({...editingUser, app_role: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email (read-only)
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  disabled
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-600 text-gray-400 rounded-md"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={() => saveUserEdit(editingUser)}
                className="flex-1"
              >
                Save Changes
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setEditingUser(null)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-96 max-w-90vw">
            <h3 className="text-lg font-semibold text-white mb-4">Add New User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={newUser.app_role}
                  onChange={(e) => setNewUser({...newUser, app_role: e.target.value as any})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Minimum 8 characters"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={createUser}
                className="flex-1"
                disabled={!newUser.email || !newUser.password}
              >
                Create User
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddUserDialog(false);
                  setNewUser({ email: '', full_name: '', app_role: 'user', password: '' });
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}