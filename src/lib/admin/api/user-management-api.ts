import { supabase } from '@/integrations/supabase/client';
import { userManagementService, type AdminUserView, type UserAdminSummary, type UserFilters, type UserPagination, type UserRole } from '../user-management-service';
import { auditService } from '../audit-service';

export interface UserSearchParams {
  search?: string;
  role?: UserRole | 'all';
  status?: 'active' | 'suspended' | 'all';
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'last_sign_in' | 'email' | 'full_name';
  sortOrder?: 'asc' | 'desc';
}

export interface BulkUserAction {
  userIds: string[];
  action: 'suspend' | 'activate' | 'delete';
  reason?: string;
  notes?: string;
}

export interface UserUpdateData {
  full_name?: string;
  app_role?: UserRole;
  admin_notes?: string;
}

export interface UserActionResult {
  success: boolean;
  message: string;
  data?: any;
}

export interface BulkActionResult {
  success: string[];
  failed: string[];
  errors: { [userId: string]: string };
}

class UserManagementAPI {
  /**
   * Search and filter users with pagination
   */
  async searchUsers(params: UserSearchParams): Promise<{
    users: AdminUserView[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const filters: UserFilters = {
        search: params.search,
        role: params.role,
        status: params.status || 'all'
      };

      const pagination: UserPagination = {
        limit: params.limit || 50,
        offset: params.offset || 0
      };

      const users = await userManagementService.getUserList(filters, pagination);
      
      if (!users) {
        throw new Error('Failed to fetch users');
      }

      // Get total count for pagination
      let countQuery = supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (params.role && params.role !== 'all') {
        countQuery = countQuery.eq('app_role', params.role);
      }
      
      const { count } = await countQuery;

      const total = count || 0;
      const hasMore = (params.offset || 0) + users.length < total;

      return {
        users,
        total,
        hasMore
      };
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  /**
   * Get detailed user information
   */
  async getUserDetails(userId: string): Promise<UserAdminSummary> {
    try {
      const userSummary = await userManagementService.getUserSummary(userId);
      
      if (!userSummary) {
        throw new Error('User not found');
      }

      return userSummary;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  }

  /**
   * Update user profile information
   */
  async updateUser(
    userId: string, 
    updateData: UserUpdateData, 
    adminId: string
  ): Promise<UserActionResult> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...(updateData.full_name !== undefined && { full_name: updateData.full_name }),
          ...(updateData.app_role !== undefined && { app_role: updateData.app_role }),
          ...(updateData.admin_notes !== undefined && { admin_notes: updateData.admin_notes }),
          last_admin_action: 'profile_updated'
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log the action
      await auditService.logAction(
        adminId,
        'USER_UPDATED',
        'user',
        userId,
        updateData
      );

      return {
        success: true,
        message: 'User updated successfully',
        data
      };
    } catch (error) {
      console.error('Error updating user:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update user'
      };
    }
  }

  /**
   * Suspend a user
   */
  async suspendUser(
    userId: string,
    suspendedBy: string,
    reason: string,
    notes?: string
  ): Promise<UserActionResult> {
    try {
      const success = await userManagementService.suspendUser(
        userId,
        suspendedBy,
        reason,
        notes
      );

      if (!success) {
        throw new Error('Failed to suspend user');
      }

      return {
        success: true,
        message: 'User suspended successfully'
      };
    } catch (error) {
      console.error('Error suspending user:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to suspend user'
      };
    }
  }

  /**
   * Activate a user
   */
  async activateUser(
    userId: string,
    activatedBy: string,
    notes?: string
  ): Promise<UserActionResult> {
    try {
      const success = await userManagementService.activateUser(
        userId,
        activatedBy,
        notes
      );

      if (!success) {
        throw new Error('Failed to activate user');
      }

      return {
        success: true,
        message: 'User activated successfully'
      };
    } catch (error) {
      console.error('Error activating user:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to activate user'
      };
    }
  }

  /**
   * Change user role
   */
  async changeUserRole(
    userId: string,
    newRole: UserRole,
    changedBy: string,
    notes?: string
  ): Promise<UserActionResult> {
    try {
      const success = await userManagementService.changeUserRole(
        userId,
        newRole,
        changedBy,
        notes
      );

      if (!success) {
        throw new Error('Failed to change user role');
      }

      return {
        success: true,
        message: 'User role changed successfully'
      };
    } catch (error) {
      console.error('Error changing user role:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to change user role'
      };
    }
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(
    userId: string,
    deletedBy: string,
    reason: string
  ): Promise<UserActionResult> {
    try {
      const success = await userManagementService.deleteUser(
        userId,
        deletedBy,
        reason
      );

      if (!success) {
        throw new Error('Failed to delete user');
      }

      return {
        success: true,
        message: 'User deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete user'
      };
    }
  }

  /**
   * Perform bulk actions on multiple users
   */
  async bulkUserAction(
    action: BulkUserAction,
    adminId: string
  ): Promise<BulkActionResult> {
    const result: BulkActionResult = {
      success: [],
      failed: [],
      errors: {}
    };

    for (const userId of action.userIds) {
      try {
        let actionResult: UserActionResult;

        switch (action.action) {
          case 'suspend':
            actionResult = await this.suspendUser(
              userId,
              adminId,
              action.reason || 'Bulk suspension',
              action.notes
            );
            break;
          case 'activate':
            actionResult = await this.activateUser(
              userId,
              adminId,
              action.notes
            );
            break;
          case 'delete':
            actionResult = await this.deleteUser(
              userId,
              adminId,
              action.reason || 'Bulk deletion'
            );
            break;
          default:
            throw new Error('Invalid bulk action');
        }

        if (actionResult.success) {
          result.success.push(userId);
        } else {
          result.failed.push(userId);
          result.errors[userId] = actionResult.message;
        }
      } catch (error) {
        result.failed.push(userId);
        result.errors[userId] = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    // Log bulk action
    await auditService.logAction(
      adminId,
      'USER_UPDATED', // Using generic action type for bulk operations
      'user',
      undefined,
      {
        action: action.action,
        userIds: action.userIds,
        reason: action.reason,
        notes: action.notes,
        results: result
      }
    );

    return result;
  }

  /**
   * Add notes to user profile
   */
  async addUserNotes(
    userId: string,
    adminId: string,
    notes: string
  ): Promise<UserActionResult> {
    try {
      const success = await userManagementService.addAdminNotes(
        userId,
        adminId,
        notes
      );

      if (!success) {
        throw new Error('Failed to add notes');
      }

      return {
        success: true,
        message: 'Notes added successfully'
      };
    } catch (error) {
      console.error('Error adding user notes:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add notes'
      };
    }
  }

  /**
   * Get user statistics for dashboard
   */
  async getUserStatistics(): Promise<{
    total_users: number;
    active_users: number;
    suspended_users: number;
    admin_users: number;
    new_users_today: number;
    new_users_this_week: number;
  }> {
    try {
      const stats = await userManagementService.getUserStats();
      
      if (!stats) {
        throw new Error('Failed to fetch user statistics');
      }

      return stats;
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      throw error;
    }
  }

  /**
   * Export user data (for admin reporting)
   */
  async exportUserData(filters: UserFilters): Promise<AdminUserView[]> {
    try {
      // Remove pagination for export
      const users = await userManagementService.getUserList(filters, { limit: 10000 });
      
      if (!users) {
        throw new Error('Failed to export user data');
      }

      return users;
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  }

  /**
   * Check if user can be modified by current admin
   */
  async canModifyUser(targetUserId: string, adminId: string): Promise<boolean> {
    try {
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('app_role')
        .eq('id', adminId)
        .single();

      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('app_role')
        .eq('id', targetUserId)
        .single();

      if (!adminProfile || !targetProfile) {
        return false;
      }

      // Super admin can modify anyone
      if (adminProfile.app_role === 'super_admin') {
        return true;
      }

      // Admin can modify users and moderators, but not other admins
      if (adminProfile.app_role === 'admin') {
        return !['admin', 'super_admin'].includes(targetProfile.app_role as string);
      }

      // Moderators can only modify regular users
      if (adminProfile.app_role === 'moderator') {
        return targetProfile.app_role === 'user';
      }

      return false;
    } catch (error) {
      console.error('Error checking user modification permissions:', error);
      return false;
    }
  }
}

export const userManagementAPI = new UserManagementAPI();