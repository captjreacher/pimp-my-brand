import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Users, UserPlus, UserCheck, UserX, TrendingUp } from 'lucide-react';
import { UserTable } from '@/components/admin/users/UserTable';
import { UserDetailModal } from '@/components/admin/users/UserDetailModal';
import { BulkUserActions } from '@/components/admin/users/BulkUserActions';
import { UserFilters, type UserFilterState } from '@/components/admin/users/UserFilters';
import {
  SuspendUserDialog,
  ActivateUserDialog,
  ChangeRoleDialog,
  DeleteUserDialog,
  AddNotesDialog
} from '@/components/admin/users/workflows';
import { useUserSearch, useUserDetails, useUserStatistics, useUserManagementActions, useUserExport } from '@/hooks/use-user-management';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';
import { type AdminUserView, type UserRole } from '@/lib/admin/user-management-service';
import { DemoDataBanner } from '@/components/admin/DemoDataBanner';

const USERS_PER_PAGE = 25;

export const UserManagementPage: React.FC = () => {
  const { user: adminUser } = useAdmin();
  const { toast } = useToast();
  
  // State management
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'created_at' | 'last_sign_in' | 'email' | 'full_name'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<UserFilterState>({
    search: '',
    role: 'all',
    status: 'all',
    subscription: 'all'
  });

  // Dialog states
  const [dialogStates, setDialogStates] = useState({
    suspend: { isOpen: false, user: null as AdminUserView | null },
    activate: { isOpen: false, user: null as AdminUserView | null },
    changeRole: { isOpen: false, user: null as AdminUserView | null },
    delete: { isOpen: false, user: null as AdminUserView | null },
    addNotes: { isOpen: false, user: null as AdminUserView | null }
  });

  // API hooks
  const searchParams = useMemo(() => ({
    search: filters.search || undefined,
    role: filters.role !== 'all' ? filters.role : undefined,
    status: filters.status,
    limit: USERS_PER_PAGE,
    offset: (currentPage - 1) * USERS_PER_PAGE,
    sortBy,
    sortOrder
  }), [filters, currentPage, sortBy, sortOrder]);

  const { data: searchResult, isLoading: isLoadingUsers, error: usersError } = useUserSearch(searchParams);
  const { data: userDetails, isLoading: isLoadingDetails } = useUserDetails(selectedUserId);
  const { data: userStats, isLoading: isLoadingStats } = useUserStatistics();
  const userActions = useUserManagementActions(adminUser?.id || '');
  const { exportUsers, isExporting } = useUserExport();

  // Event handlers
  const handleUserSelect = useCallback((userId: string, selected: boolean) => {
    setSelectedUsers(prev => 
      selected 
        ? [...prev, userId]
        : prev.filter(id => id !== userId)
    );
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected && searchResult?.users) {
      setSelectedUsers(searchResult.users.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  }, [searchResult?.users]);

  const handleClearSelection = useCallback(() => {
    setSelectedUsers([]);
  }, []);

  const handleUserAction = useCallback((userId: string, action: string) => {
    const user = searchResult?.users.find(u => u.id === userId);
    if (!user) return;

    switch (action) {
      case 'view':
        setSelectedUserId(userId);
        break;
      case 'suspend':
        setDialogStates(prev => ({
          ...prev,
          suspend: { isOpen: true, user }
        }));
        break;
      case 'activate':
        setDialogStates(prev => ({
          ...prev,
          activate: { isOpen: true, user }
        }));
        break;
      case 'delete':
        setDialogStates(prev => ({
          ...prev,
          delete: { isOpen: true, user }
        }));
        break;
      case 'role':
        setDialogStates(prev => ({
          ...prev,
          changeRole: { isOpen: true, user }
        }));
        break;
      case 'notes':
        setDialogStates(prev => ({
          ...prev,
          addNotes: { isOpen: true, user }
        }));
        break;
    }
  }, [searchResult?.users]);

  const handleViewUser = useCallback((userId: string) => {
    setSelectedUserId(userId);
  }, []);

  const handleBulkAction = useCallback((action: 'suspend' | 'activate' | 'delete', reason?: string, notes?: string) => {
    userActions.bulkAction({
      userIds: selectedUsers,
      action,
      reason,
      notes
    });
    setSelectedUsers([]);
  }, [selectedUsers, userActions]);

  const handleSort = useCallback((column: string) => {
    const validColumns: ('created_at' | 'last_sign_in' | 'email' | 'full_name')[] = ['created_at', 'last_sign_in', 'email', 'full_name'];
    if (!validColumns.includes(column as any)) return;
    
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column as 'created_at' | 'last_sign_in' | 'email' | 'full_name');
      setSortOrder('asc');
    }
    setCurrentPage(1);
  }, [sortBy]);

  const handleFiltersChange = useCallback((newFilters: UserFilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setSelectedUsers([]);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      search: '',
      role: 'all',
      status: 'all',
      subscription: 'all'
    });
    setCurrentPage(1);
    setSelectedUsers([]);
  }, []);

  const handleExport = useCallback(() => {
    const exportFilters = {
      search: filters.search || undefined,
      role: filters.role !== 'all' ? filters.role : undefined,
      status: filters.status
    };
    exportUsers(exportFilters);
  }, [filters, exportUsers]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setSelectedUsers([]);
  }, []);

  // Dialog handlers
  const handleSuspendUser = useCallback((reason: string, notes?: string) => {
    const user = dialogStates.suspend.user;
    if (user) {
      userActions.suspendUser({ userId: user.id, reason, notes });
    }
    setDialogStates(prev => ({ ...prev, suspend: { isOpen: false, user: null } }));
  }, [dialogStates.suspend.user, userActions]);

  const handleActivateUser = useCallback((notes?: string) => {
    const user = dialogStates.activate.user;
    if (user) {
      userActions.activateUser({ userId: user.id, notes });
    }
    setDialogStates(prev => ({ ...prev, activate: { isOpen: false, user: null } }));
  }, [dialogStates.activate.user, userActions]);

  const handleChangeRole = useCallback((newRole: UserRole, notes?: string) => {
    const user = dialogStates.changeRole.user;
    if (user) {
      userActions.changeRole({ userId: user.id, newRole, notes });
    }
    setDialogStates(prev => ({ ...prev, changeRole: { isOpen: false, user: null } }));
  }, [dialogStates.changeRole.user, userActions]);

  const handleDeleteUser = useCallback((reason: string, notes?: string) => {
    const user = dialogStates.delete.user;
    if (user) {
      userActions.deleteUser({ userId: user.id, reason });
    }
    setDialogStates(prev => ({ ...prev, delete: { isOpen: false, user: null } }));
  }, [dialogStates.delete.user, userActions]);

  const handleAddNotes = useCallback((notes: string) => {
    const user = dialogStates.addNotes.user;
    if (user) {
      userActions.addNotes({ userId: user.id, notes });
    }
    setDialogStates(prev => ({ ...prev, addNotes: { isOpen: false, user: null } }));
  }, [dialogStates.addNotes.user, userActions]);

  const closeDialog = useCallback((dialogType: keyof typeof dialogStates) => {
    setDialogStates(prev => ({ ...prev, [dialogType]: { isOpen: false, user: null } }));
  }, []);

  // Calculate pagination
  const totalPages = searchResult ? Math.ceil(searchResult.total / USERS_PER_PAGE) : 0;
  const startItem = (currentPage - 1) * USERS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * USERS_PER_PAGE, searchResult?.total || 0);

  // Error handling
  if (usersError) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-destructive">Error loading users: {usersError.message}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>

      {/* Data Status Banner */}
      {searchResult?.isUsingDemoData && (
        <DemoDataBanner 
          onFixDatabase={() => {
            toast({
              title: "Database Fix Required",
              description: "Run 'ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;' in Supabase SQL Editor to show real user data.",
            });
          }}
        />
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? '...' : userStats?.total_users.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +{userStats?.new_users_today || 0} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? '...' : userStats?.active_users.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {userStats && userStats.total_users > 0 
                ? `${Math.round((userStats.active_users / userStats.total_users) * 100)}% of total`
                : 'N/A'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? '...' : userStats?.suspended_users.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? '...' : userStats?.new_users_this_week.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Growth trend
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <UserFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            isLoading={isLoadingUsers}
          />
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      <BulkUserActions
        selectedUsers={selectedUsers}
        onBulkAction={handleBulkAction}
        onExport={handleExport}
        onClearSelection={handleClearSelection}
        isLoading={userActions.isLoading.bulkAction || isExporting}
      />

      {/* User Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Users</CardTitle>
            {searchResult && (
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>
                  Showing {startItem}-{endItem} of {searchResult.total.toLocaleString()} users
                </span>
                {searchResult.hasMore && (
                  <Badge variant="outline">More available</Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <UserTable
            users={searchResult?.users || []}
            selectedUsers={selectedUsers}
            onUserSelect={handleUserSelect}
            onSelectAll={handleSelectAll}
            onUserAction={handleUserAction}
            onViewUser={handleViewUser}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            isLoading={isLoadingUsers}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const page = i + 1;
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* User Detail Modal */}
      <UserDetailModal
        user={userDetails || null}
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        isLoading={isLoadingDetails}
      />

      {/* Action Dialogs */}
      <SuspendUserDialog
        user={dialogStates.suspend.user}
        isOpen={dialogStates.suspend.isOpen}
        onClose={() => closeDialog('suspend')}
        onConfirm={handleSuspendUser}
        isLoading={userActions.isLoading.suspend}
      />

      <ActivateUserDialog
        user={dialogStates.activate.user}
        isOpen={dialogStates.activate.isOpen}
        onClose={() => closeDialog('activate')}
        onConfirm={handleActivateUser}
        isLoading={userActions.isLoading.activate}
      />

      <ChangeRoleDialog
        user={dialogStates.changeRole.user}
        currentAdminRole={adminUser?.app_role || 'user'}
        isOpen={dialogStates.changeRole.isOpen}
        onClose={() => closeDialog('changeRole')}
        onConfirm={handleChangeRole}
        isLoading={userActions.isLoading.changeRole}
      />

      <DeleteUserDialog
        user={dialogStates.delete.user}
        isOpen={dialogStates.delete.isOpen}
        onClose={() => closeDialog('delete')}
        onConfirm={handleDeleteUser}
        isLoading={userActions.isLoading.delete}
      />

      <AddNotesDialog
        user={dialogStates.addNotes.user}
        isOpen={dialogStates.addNotes.isOpen}
        onClose={() => closeDialog('addNotes')}
        onConfirm={handleAddNotes}
        isLoading={userActions.isLoading.addNotes}
      />
    </div>
  );
};