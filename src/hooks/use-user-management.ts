import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userManagementAPI, type UserSearchParams, type BulkUserAction, type UserUpdateData } from '@/lib/admin/api/user-management-api';
import { type UserRole } from '@/lib/admin/user-management-service';
import { useToast } from '@/hooks/use-toast';

export function useUserSearch(params: UserSearchParams) {
  return useQuery({
    queryKey: ['admin', 'users', 'search', params],
    queryFn: () => userManagementAPI.searchUsers(params),
    staleTime: 30000, // 30 seconds
    enabled: true
  });
}

export function useUserDetails(userId: string | null) {
  return useQuery({
    queryKey: ['admin', 'users', 'details', userId],
    queryFn: () => userId ? userManagementAPI.getUserDetails(userId) : null,
    enabled: !!userId,
    staleTime: 60000 // 1 minute
  });
}

export function useUserStatistics() {
  return useQuery({
    queryKey: ['admin', 'users', 'statistics'],
    queryFn: () => userManagementAPI.getUserStatistics(),
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000 // Auto-refresh every 5 minutes
  });
}

export function useUserManagementActions(adminId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateUserQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
  }, [queryClient]);

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, updateData }: { userId: string; updateData: UserUpdateData }) =>
      userManagementAPI.updateUser(userId, updateData, adminId),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        invalidateUserQueries();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive",
      });
    }
  });

  const suspendUserMutation = useMutation({
    mutationFn: ({ userId, reason, notes }: { userId: string; reason: string; notes?: string }) =>
      userManagementAPI.suspendUser(userId, adminId, reason, notes),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "User Suspended",
          description: result.message,
        });
        invalidateUserQueries();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to suspend user",
        variant: "destructive",
      });
    }
  });

  const activateUserMutation = useMutation({
    mutationFn: ({ userId, notes }: { userId: string; notes?: string }) =>
      userManagementAPI.activateUser(userId, adminId, notes),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "User Activated",
          description: result.message,
        });
        invalidateUserQueries();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to activate user",
        variant: "destructive",
      });
    }
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, newRole, notes }: { userId: string; newRole: UserRole; notes?: string }) =>
      userManagementAPI.changeUserRole(userId, newRole, adminId, notes),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Role Changed",
          description: result.message,
        });
        invalidateUserQueries();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change user role",
        variant: "destructive",
      });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      userManagementAPI.deleteUser(userId, adminId, reason),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "User Deleted",
          description: result.message,
        });
        invalidateUserQueries();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      });
    }
  });

  const bulkActionMutation = useMutation({
    mutationFn: (action: BulkUserAction) =>
      userManagementAPI.bulkUserAction(action, adminId),
    onSuccess: (result) => {
      const successCount = result.success.length;
      const failedCount = result.failed.length;
      
      if (successCount > 0) {
        toast({
          title: "Bulk Action Completed",
          description: `${successCount} users processed successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
        });
      }
      
      if (failedCount > 0 && successCount === 0) {
        toast({
          title: "Bulk Action Failed",
          description: `Failed to process ${failedCount} users`,
          variant: "destructive",
        });
      }
      
      invalidateUserQueries();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Bulk action failed",
        variant: "destructive",
      });
    }
  });

  const addNotesMutation = useMutation({
    mutationFn: ({ userId, notes }: { userId: string; notes: string }) =>
      userManagementAPI.addUserNotes(userId, adminId, notes),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Notes Added",
          description: result.message,
        });
        invalidateUserQueries();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add notes",
        variant: "destructive",
      });
    }
  });

  return {
    updateUser: updateUserMutation.mutate,
    suspendUser: suspendUserMutation.mutate,
    activateUser: activateUserMutation.mutate,
    changeRole: changeRoleMutation.mutate,
    deleteUser: deleteUserMutation.mutate,
    bulkAction: bulkActionMutation.mutate,
    addNotes: addNotesMutation.mutate,
    isLoading: {
      update: updateUserMutation.isPending,
      suspend: suspendUserMutation.isPending,
      activate: activateUserMutation.isPending,
      changeRole: changeRoleMutation.isPending,
      delete: deleteUserMutation.isPending,
      bulkAction: bulkActionMutation.isPending,
      addNotes: addNotesMutation.isPending
    }
  };
}

export function useUserPermissions(adminId: string) {
  const [permissions, setPermissions] = useState<{ [userId: string]: boolean }>({});

  const checkPermission = useCallback(async (targetUserId: string) => {
    if (permissions[targetUserId] !== undefined) {
      return permissions[targetUserId];
    }

    try {
      const canModify = await userManagementAPI.canModifyUser(targetUserId, adminId);
      setPermissions(prev => ({ ...prev, [targetUserId]: canModify }));
      return canModify;
    } catch (error) {
      console.error('Error checking user permissions:', error);
      return false;
    }
  }, [adminId, permissions]);

  return { checkPermission };
}

export function useUserExport() {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportUsers = useCallback(async (filters: any) => {
    setIsExporting(true);
    try {
      const users = await userManagementAPI.exportUserData(filters);
      
      // Convert to CSV
      const headers = ['ID', 'Email', 'Full Name', 'Role', 'Subscription', 'Created At', 'Status', 'Content Count'];
      const csvContent = [
        headers.join(','),
        ...users.map(user => [
          user.id,
          user.email,
          user.full_name || '',
          user.app_role,
          user.subscription_tier || '',
          user.created_at,
          user.is_suspended ? 'Suspended' : 'Active',
          user.content_count
        ].join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Exported ${users.length} users to CSV`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export users",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }, [toast]);

  return { exportUsers, isExporting };
}