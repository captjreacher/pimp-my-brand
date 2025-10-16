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
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        this.currentUser = null;
        return null;
      }

      // Get user profile with admin role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        this.currentUser = null;
        return null;
      }

      // Check if user has admin privileges
      if (!profile.app_role || profile.app_role === 'user') {
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

      // Check for active admin session
      await this.checkActiveSession();

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
      // Get client IP and user agent (in a real app, you'd get these from request headers)
      const userAgent = navigator.userAgent;
      
      const { data, error } = await supabase.rpc('start_admin_session', {
        p_user_id: this.currentUser.id,
        p_user_agent: userAgent
      });

      if (error) throw error;

      // Get the created session
      const { data: session, error: sessionError } = await supabase
        .from('admin_sessions')
        .select('*')
        .eq('id', data)
        .single();

      if (sessionError) throw sessionError;

      this.currentSession = session;
      this.currentUser.current_session_id = session.id;

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
      const { data: sessions, error } = await supabase
        .from('admin_sessions')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (sessions && sessions.length > 0) {
        this.currentSession = sessions[0];
        this.currentUser.current_session_id = sessions[0].id;
      }
    } catch (error) {
      console.error('Failed to check active session:', error);
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
      const userAgent = navigator.userAgent;
      
      const { error } = await supabase.rpc('log_admin_action', {
        p_action_type: actionType,
        p_admin_user_id: this.currentUser.id,
        p_target_type: targetType,
        p_target_id: targetId,
        p_details: details ? JSON.stringify(details) : null,
        p_user_agent: userAgent
      });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to log admin action:', error);
      throw error;
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