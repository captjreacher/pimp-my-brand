import { supabase } from '@/integrations/supabase/client';
import type { AdminUser, AdminSession, AdminActionType, AdminRole } from './types';
import { getPermissionsForRole, hasPermission } from './permissions';
import type { AdminPermission } from './types';
import { OFFLINE_ADMIN_MODE, offlineAdminUser, offlineAuthState } from './offline-mode';

export class AdminAuthService {
  private static instance: AdminAuthService;
  private currentUser: AdminUser | null = null;
  private currentSession: AdminSession | null = null;

  private constructor() {}

  static getInstance(): AdminAuthService {
    if (!AdminAuthService.instance) {
      AdminAuthService.instance = new AdminAuthService();
    }
    return AdminAuthService.instance;
  }

  /**
   * Initialize admin authentication
   */
  async initialize(): Promise<AdminUser | null> {
    // Offline mode for testing
    if (OFFLINE_ADMIN_MODE) {
      const permissions = getPermissionsForRole(offlineAdminUser.app_role);
      
      this.currentUser = {
        id: offlineAdminUser.id,
        email: offlineAdminUser.email,
        app_role: offlineAdminUser.app_role,
        admin_permissions: Object.entries(permissions)
          .filter(([_, hasPermission]) => hasPermission)
          .map(([permission]) => this.mapPermissionName(permission))
      };

      return this.currentUser;
    }

    try {
      console.log('AdminAuthService: Starting initialization...');
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.log('AdminAuthService: No authenticated user found');
        this.currentUser = null;
        return null;
      }

      console.log('AdminAuthService: Found authenticated user:', user.email);

      // Get user profile with admin role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        console.log('AdminAuthService: No profile found or error:', profileError);
        this.currentUser = null;
        return null;
      }

      console.log('AdminAuthService: Found profile with role:', profile.app_role);

      // Check if user has admin privileges
      if (!profile.app_role || profile.app_role === 'user') {
        console.log('AdminAuthService: User does not have admin privileges');
        this.currentUser = null;
        return null;
      }

      // Get permissions for the role
      const permissions = getPermissionsForRole(profile.app_role);

      this.currentUser = {
        id: user.id,
        email: user.email,
        app_role: profile.app_role,
        admin_permissions: Object.entries(permissions)
          .filter(([_, hasPermission]) => hasPermission)
          .map(([permission]) => this.mapPermissionName(permission))
      };

      console.log('AdminAuthService: Successfully initialized admin user');

      // Skip session management for now to avoid hanging
      // await this.checkActiveSession();

      return this.currentUser;
    } catch (error) {
      console.error('Admin auth initialization error:', error);
      this.currentUser = null;
      return null;
    }
  }

  /**
   * Start an admin session
   */
  async startAdminSession(): Promise<AdminSession> {
    if (!this.currentUser) {
      throw new Error('No authenticated admin user');
    }

    try {
      console.log('AdminAuthService: Starting admin session...');
      
      // Create a simple session object without complex RPC calls
      const session: AdminSession = {
        id: `session-${Date.now()}`,
        user_id: this.currentUser.id,
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        is_active: true,
        user_agent: navigator.userAgent,
        ip_address: 'localhost' // Simplified for now
      };

      this.currentSession = session;
      this.currentUser.current_session_id = session.id;

      console.log('AdminAuthService: Session created successfully');
      return session;
    } catch (error) {
      console.error('Failed to start admin session:', error);
      throw error;
    }
  }

  /**
   * End the current admin session
   */
  async endAdminSession(): Promise<void> {
    try {
      const { error } = await supabase.rpc('end_admin_session');
      if (error) throw error;

      this.currentSession = null;
      if (this.currentUser) {
        this.currentUser.current_session_id = undefined;
      }
    } catch (error) {
      console.error('Failed to end admin session:', error);
      throw error;
    }
  }

  /**
   * Check for active admin session
   */
  private async checkActiveSession(): Promise<void> {
    if (!this.currentUser) return;

    try {
      console.log('AdminAuthService: Checking for active session...');
      
      // Simplified session check - just create a new session if none exists
      if (!this.currentSession) {
        await this.startAdminSession();
      }
      
      console.log('AdminAuthService: Session check completed');
    } catch (error) {
      console.error('Failed to check active session:', error);
      // Don't throw - just continue without session
    }
  }

  /**
   * Log an admin action
   */
  async logAction(
    actionType: AdminActionType,
    targetType?: string,
    targetId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No authenticated admin user');
    }

    try {
      console.log('AdminAuthService: Logging action:', actionType);
      
      // Simplified logging - just log to console for now
      console.log('Admin Action:', {
        actionType,
        adminUserId: this.currentUser.id,
        targetType,
        targetId,
        details,
        timestamp: new Date().toISOString()
      });
      
      // In a real implementation, you'd insert into admin_audit_log table
      // For now, we'll skip the database call to avoid hanging
      
    } catch (error) {
      console.error('Failed to log admin action:', error);
      // Don't throw - logging failures shouldn't break the app
    }
  }

  /**
   * Check if current user has a specific permission
   */
  hasPermission(permission: AdminPermission): boolean {
    if (!this.currentUser) return false;
    return hasPermission(this.currentUser.app_role, permission);
  }

  /**
   * Check if current user has admin role or higher
   */
  isAdmin(): boolean {
    if (!this.currentUser) return false;
    return ['admin', 'super_admin'].includes(this.currentUser.app_role);
  }

  /**
   * Check if current user has moderator role or higher
   */
  isModerator(): boolean {
    if (!this.currentUser) return false;
    return ['moderator', 'admin', 'super_admin'].includes(this.currentUser.app_role);
  }

  /**
   * Get current admin user
   */
  getCurrentUser(): AdminUser | null {
    return this.currentUser;
  }

  /**
   * Get current admin session
   */
  getCurrentSession(): AdminSession | null {
    return this.currentSession;
  }

  /**
   * Validate admin access for a specific role
   */
  validateAdminAccess(requiredRole?: AdminRole): boolean {
    if (!this.currentUser) return false;
    
    if (!requiredRole) {
      // Just check if user has any admin privileges
      return this.currentUser.app_role !== 'user';
    }

    // Check role hierarchy
    const roleHierarchy: Record<AdminRole, number> = {
      user: 0,
      moderator: 1,
      admin: 2,
      super_admin: 3
    };

    const userLevel = roleHierarchy[this.currentUser.app_role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
  }

  /**
   * Map permission names from boolean object to permission strings
   */
  private mapPermissionName(permissionKey: string): AdminPermission {
    const mapping: Record<string, AdminPermission> = {
      canManageUsers: 'manage_users',
      canModerateContent: 'moderate_content',
      canManageBilling: 'manage_billing',
      canViewAnalytics: 'view_analytics',
      canManageSystem: 'manage_system',
      canViewAuditLogs: 'view_audit_logs'
    };

    return mapping[permissionKey] || 'view_analytics';
  }

  /**
   * Logout and cleanup
   */
  async logout(): Promise<void> {
    try {
      // End admin session if active
      if (this.currentSession) {
        await this.endAdminSession();
      }

      // Clear local state
      this.currentUser = null;
      this.currentSession = null;

      // Logout from Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Admin logout error:', error);
      throw error;
    }
  }
}