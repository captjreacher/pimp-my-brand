import type { Database } from '@/integrations/supabase/types';

// Admin role types
export type AdminRole = 'user' | 'moderator' | 'admin' | 'super_admin';

// Admin user interface extending the base user
export interface AdminUser {
  id: string;
  email?: string;
  app_role: AdminRole;
  admin_permissions: AdminPermission[];
  last_admin_login?: string;
  current_session_id?: string;
}

// Admin permissions
export interface AdminPermissions {
  canManageUsers: boolean;
  canModerateContent: boolean;
  canManageBilling: boolean;
  canViewAnalytics: boolean;
  canManageSystem: boolean;
  canViewAuditLogs: boolean;
}

// Admin permission strings
export type AdminPermission = 
  | 'manage_users'
  | 'moderate_content'
  | 'manage_billing'
  | 'view_analytics'
  | 'manage_system'
  | 'view_audit_logs';

// Admin session interface
export interface AdminSession {
  id: string;
  user_id: string;
  session_start: string;
  session_end?: string;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
}

// Admin audit log interface
export interface AdminAuditLog {
  id: string;
  admin_user_id: string;
  action_type: string;
  target_type?: string;
  target_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Admin action types
export type AdminActionType = 
  | 'admin_login'
  | 'admin_logout'
  | 'user_suspend'
  | 'user_activate'
  | 'user_delete'
  | 'user_role_change'
  | 'content_approve'
  | 'content_reject'
  | 'content_flag'
  | 'subscription_modify'
  | 'subscription_refund'
  | 'config_update'
  | 'system_maintenance';

// Admin context interface
export interface AdminContext {
  user: AdminUser | null;
  permissions: AdminPermissions;
  session: AdminSession | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials?: any) => Promise<void>;
  logout: () => Promise<void>;
  checkPermission: (permission: AdminPermission) => boolean;
  logAction: (action: AdminActionType, details?: any) => Promise<void>;
}

// Admin route protection
export interface AdminRouteProps {
  requiredRole?: AdminRole;
  requiredPermissions?: AdminPermission[];
  fallbackPath?: string;
  children: React.ReactNode;
}

// Admin error types
export enum AdminErrorType {
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  INVALID_ADMIN_ACTION = 'INVALID_ADMIN_ACTION',
  AUDIT_LOG_FAILURE = 'AUDIT_LOG_FAILURE',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS'
}

export interface AdminError extends Error {
  type: AdminErrorType;
  context: {
    adminUserId?: string;
    action?: string;
    targetId?: string;
    details?: any;
  };
}