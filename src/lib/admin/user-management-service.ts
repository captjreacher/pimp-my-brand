import { supabase } from '@/integrations/supabase/client';

export interface AdminUserView {
  id: string;
  email: string;
  full_name?: string;
  app_role: string;
  subscription_tier?: string;
  created_at: string;
  last_sign_in?: string;
  is_suspended: boolean;
  suspended_at?: string;
  suspended_by?: string;
  suspension_reason?: string;
  admin_notes?: string;
  last_admin_action?: string;
  content_count: number;
  total_generations: number;
}

export interface UserAdminSummary {
  id: string;
  email: string;
  full_name?: string;
  app_role: string;
  subscription_tier?: string;
  created_at: string;
  last_sign_in?: string;
  is_suspended: boolean;
  suspended_at?: string;
  suspended_by?: string;
  suspension_reason?: string;
  admin_notes?: string;
  last_admin_action?: string;
  content_count: number;
  total_generations: number;
  total_brands: number;
  total_cvs: number;
  recent_activity: any;
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: 'active' | 'suspended' | 'all';
}

export interface UserPagination {
  limit?: number;
  offset?: number;
}

export type UserRole = 'user' | 'moderator' | 'admin' | 'super_admin';

class UserManagementService {
  /**
   * Get list of users with admin filtering and pagination
   */
  async getUserList(
    filters: UserFilters = {},
    pagination: UserPagination = {}
  ): Promise<AdminUserView[] | null> {
    try {
      const { data, error } = await supabase.rpc('get_admin_user_list', {
        p_search: filters.search,
        p_role_filter: filters.role,
        p_status_filter: filters.status || 'all',
        p_limit: pagination.limit || 50,
        p_offset: pagination.offset || 0
      });

      if (error) {
        console.error('Failed to fetch user list:', error);
        return null;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user list:', error);
      return null;
    }
  }

  /**
   * Get detailed user summary for admin view
   */
  async getUserSummary(userId: string): Promise<UserAdminSummary | null> {
    try {
      const { data, error } = await supabase.rpc('get_user_admin_summary', {
        p_user_id: userId
      });

      if (error) {
        console.error('Failed to fetch user summary:', error);
        return null;
      }

      const summary = data?.[0];
      if (!summary) return null;
      
      return {
        ...summary,
        content_count: (summary.total_brands || 0) + (summary.total_cvs || 0)
      };
    } catch (error) {
      console.error('Error fetching user summary:', error);
      return null;
    }
  }

  /**
   * Suspend a user
   */
  async suspendUser(
    userId: string,
    suspendedBy: string,
    suspensionReason: string,
    adminNotes?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('suspend_user', {
        p_user_id: userId,
        p_suspended_by: suspendedBy,
        p_suspension_reason: suspensionReason,
        p_admin_notes: adminNotes
      });

      if (error) {
        console.error('Failed to suspend user:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error suspending user:', error);
      return false;
    }
  }

  /**
   * Activate/unsuspend a user
   */
  async activateUser(
    userId: string,
    activatedBy: string,
    adminNotes?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('activate_user', {
        p_user_id: userId,
        p_activated_by: activatedBy,
        p_admin_notes: adminNotes
      });

      if (error) {
        console.error('Failed to activate user:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error activating user:', error);
      return false;
    }
  }

  /**
   * Change user role
   */
  async changeUserRole(
    userId: string,
    newRole: UserRole,
    changedBy: string,
    adminNotes?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('change_user_role', {
        p_user_id: userId,
        p_new_role: newRole,
        p_changed_by: changedBy,
        p_admin_notes: adminNotes
      });

      if (error) {
        console.error('Failed to change user role:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error changing user role:', error);
      return false;
    }
  }

  /**
   * Add admin notes to user
   */
  async addAdminNotes(
    userId: string,
    adminId: string,
    notes: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('add_admin_notes', {
        p_user_id: userId,
        p_admin_id: adminId,
        p_notes: notes
      });

      if (error) {
        console.error('Failed to add admin notes:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error adding admin notes:', error);
      return false;
    }
  }

  /**
   * Check if user is suspended
   */
  async isUserSuspended(userId: string): Promise<boolean | null> {
    try {
      const { data, error } = await supabase.rpc('is_user_suspended', {
        p_user_id: userId
      });

      if (error) {
        console.error('Failed to check user suspension status:', error);
        return null;
      }

      return data === true;
    } catch (error) {
      console.error('Error checking user suspension status:', error);
      return null;
    }
  }

  /**
   * Delete user (soft delete by suspending permanently)
   */
  async deleteUser(
    userId: string,
    deletedBy: string,
    reason: string
  ): Promise<boolean> {
    try {
      // First suspend the user with deletion reason
      const suspended = await this.suspendUser(
        userId,
        deletedBy,
        `DELETED: ${reason}`,
        `User account deleted on ${new Date().toISOString()}`
      );

      if (!suspended) {
        return false;
      }

      // Additional cleanup could be added here
      // For now, we're using suspension as soft delete
      // Hard delete would require careful handling of foreign key constraints

      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  /**
   * Bulk suspend users
   */
  async bulkSuspendUsers(
    userIds: string[],
    suspendedBy: string,
    suspensionReason: string,
    adminNotes?: string
  ): Promise<{ success: string[]; failed: string[] }> {
    const results = { success: [], failed: [] };

    for (const userId of userIds) {
      const success = await this.suspendUser(userId, suspendedBy, suspensionReason, adminNotes);
      if (success) {
        results.success.push(userId);
      } else {
        results.failed.push(userId);
      }
    }

    return results;
  }

  /**
   * Bulk activate users
   */
  async bulkActivateUsers(
    userIds: string[],
    activatedBy: string,
    adminNotes?: string
  ): Promise<{ success: string[]; failed: string[] }> {
    const results = { success: [], failed: [] };

    for (const userId of userIds) {
      const success = await this.activateUser(userId, activatedBy, adminNotes);
      if (success) {
        results.success.push(userId);
      } else {
        results.failed.push(userId);
      }
    }

    return results;
  }

  /**
   * Get user statistics for admin dashboard
   */
  async getUserStats(): Promise<{
    total_users: number;
    active_users: number;
    suspended_users: number;
    admin_users: number;
    new_users_today: number;
    new_users_this_week: number;
  } | null> {
    try {
      const { data: totalUsers, error: totalError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      if (totalError) throw totalError;

      const { data: activeUsers, error: activeError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .is('suspended_at', null);

      if (activeError) throw activeError;

      const { data: suspendedUsers, error: suspendedError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .not('suspended_at', 'is', null);

      if (suspendedError) throw suspendedError;

      const { data: adminUsers, error: adminError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .in('app_role', ['admin', 'moderator', 'super_admin']);

      if (adminError) throw adminError;

      const today = new Date().toISOString().split('T')[0];
      const { data: newUsersToday, error: todayError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', today);

      if (todayError) throw todayError;

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data: newUsersWeek, error: weekError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      if (weekError) throw weekError;

      return {
        total_users: totalUsers?.length || 0,
        active_users: activeUsers?.length || 0,
        suspended_users: suspendedUsers?.length || 0,
        admin_users: adminUsers?.length || 0,
        new_users_today: newUsersToday?.length || 0,
        new_users_this_week: newUsersWeek?.length || 0
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  }
}

export const userManagementService = new UserManagementService();