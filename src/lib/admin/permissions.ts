import type { AdminRole, AdminPermission, AdminPermissions } from './types';

// Define role-based permissions
const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  user: [],
  moderator: [
    'moderate_content',
    'view_analytics'
  ],
  admin: [
    'manage_users',
    'moderate_content',
    'manage_billing',
    'view_analytics',
    'view_audit_logs'
  ],
  super_admin: [
    'manage_users',
    'moderate_content',
    'manage_billing',
    'view_analytics',
    'manage_system',
    'view_audit_logs'
  ]
} as const;

/**
 * Get permissions for a given admin role
 */
export function getPermissionsForRole(role: AdminRole): AdminPermissions {
  const permissions = ROLE_PERMISSIONS[role] || [];
  
  return {
    canManageUsers: permissions.includes('manage_users'),
    canModerateContent: permissions.includes('moderate_content'),
    canManageBilling: permissions.includes('manage_billing'),
    canViewAnalytics: permissions.includes('view_analytics'),
    canManageSystem: permissions.includes('manage_system'),
    canViewAuditLogs: permissions.includes('view_audit_logs')
  };
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: AdminRole, permission: AdminPermission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: AdminRole, permissions: AdminPermission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: AdminRole, permissions: AdminPermission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Check if a role is admin or higher
 */
export function isAdmin(role: AdminRole): boolean {
  return ['admin', 'super_admin'].includes(role);
}

/**
 * Check if a role is moderator or higher
 */
export function isModerator(role: AdminRole): boolean {
  return ['moderator', 'admin', 'super_admin'].includes(role);
}

/**
 * Check if a role is super admin
 */
export function isSuperAdmin(role: AdminRole): boolean {
  return role === 'super_admin';
}

/**
 * Get the hierarchy level of a role (higher number = more permissions)
 */
export function getRoleLevel(role: AdminRole): number {
  const levels: Record<AdminRole, number> = {
    user: 0,
    moderator: 1,
    admin: 2,
    super_admin: 3
  };
  
  return levels[role] || 0;
}

/**
 * Check if one role can manage another role
 */
export function canManageRole(managerRole: AdminRole, targetRole: AdminRole): boolean {
  // Super admins can manage everyone
  if (managerRole === 'super_admin') return true;
  
  // Admins can manage moderators and users
  if (managerRole === 'admin' && ['moderator', 'user'].includes(targetRole)) return true;
  
  // Moderators cannot manage other roles
  return false;
}

/**
 * Get available roles that a user can assign
 */
export function getAssignableRoles(currentRole: AdminRole): AdminRole[] {
  switch (currentRole) {
    case 'super_admin':
      return ['user', 'moderator', 'admin', 'super_admin'];
    case 'admin':
      return ['user', 'moderator', 'admin'];
    case 'moderator':
      return ['user'];
    default:
      return [];
  }
}