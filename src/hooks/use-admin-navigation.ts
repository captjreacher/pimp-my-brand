import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { toast } from 'sonner';
import type { AdminRole, AdminPermission } from '@/lib/admin/types';

interface NavigationOptions {
  requiredRole?: AdminRole;
  requiredPermissions?: AdminPermission[];
  fallbackPath?: string;
  showError?: boolean;
}

export function useAdminNavigation() {
  const { user, checkPermission } = useAdmin();
  const navigate = useNavigate();

  const canAccessRoute = useCallback((
    requiredRole?: AdminRole,
    requiredPermissions?: AdminPermission[]
  ): boolean => {
    if (!user || user.app_role === 'user') {
      return false;
    }

    if (requiredRole) {
      const roleHierarchy: Record<AdminRole, number> = {
        user: 0,
        moderator: 1,
        admin: 2,
        super_admin: 3
      };

      const userLevel = roleHierarchy[user.app_role] || 0;
      const requiredLevel = roleHierarchy[requiredRole] || 0;

      if (userLevel < requiredLevel) {
        return false;
      }
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      return requiredPermissions.every(permission => checkPermission(permission));
    }

    return true;
  }, [user, checkPermission]);

  const navigateWithPermissionCheck = useCallback((
    path: string,
    options: NavigationOptions = {}
  ) => {
    const {
      requiredRole,
      requiredPermissions,
      fallbackPath = '/admin',
      showError = true
    } = options;

    if (!canAccessRoute(requiredRole, requiredPermissions)) {
      if (showError) {
        if (!user || user.app_role === 'user') {
          toast.error('Admin access required');
        } else if (requiredRole) {
          toast.error(`${requiredRole.replace('_', ' ')} role required`);
        } else if (requiredPermissions) {
          toast.error('Insufficient permissions');
        }
      }
      
      navigate(fallbackPath);
      return false;
    }

    navigate(path);
    return true;
  }, [canAccessRoute, navigate, user]);

  const getAccessibleRoutes = useCallback(() => {
    if (!user || user.app_role === 'user') {
      return [];
    }

    const routes = [
      { path: '/admin', label: 'Dashboard', permissions: [] },
    ];

    // User management routes
    if (checkPermission('manage_users')) {
      routes.push(
        { path: '/admin/users', label: 'Users', permissions: ['manage_users'] },
        { path: '/admin/roles', label: 'Roles & Permissions', permissions: ['manage_users'] }
      );
    }

    // Content moderation routes
    if (checkPermission('moderate_content')) {
      routes.push(
        { path: '/admin/moderation', label: 'Moderation Queue', permissions: ['moderate_content'] },
        { path: '/admin/content', label: 'Content Library', permissions: ['moderate_content'] }
      );
    }

    // Billing management routes
    if (checkPermission('manage_billing')) {
      routes.push(
        { path: '/admin/subscriptions', label: 'Subscriptions', permissions: ['manage_billing'] }
      );
    }

    // Analytics routes
    if (checkPermission('view_analytics')) {
      routes.push(
        { path: '/admin/analytics', label: 'Analytics', permissions: ['view_analytics'] }
      );
    }

    // System management routes
    if (checkPermission('manage_system')) {
      routes.push(
        { path: '/admin/system', label: 'System Health', permissions: ['manage_system'] },
        { path: '/admin/database', label: 'Database', permissions: ['manage_system'] },
        { path: '/admin/settings', label: 'Settings', permissions: ['manage_system'] }
      );
    }

    // Audit log routes
    if (checkPermission('view_audit_logs')) {
      routes.push(
        { path: '/admin/audit', label: 'Audit Logs', permissions: ['view_audit_logs'] }
      );
    }

    return routes;
  }, [user, checkPermission]);

  const isCurrentUserAdmin = useCallback(() => {
    return user && user.app_role !== 'user';
  }, [user]);

  const getCurrentUserRole = useCallback(() => {
    return user?.app_role || 'user';
  }, [user]);

  const hasAnyAdminPermission = useCallback(() => {
    if (!user || user.app_role === 'user') {
      return false;
    }

    const adminPermissions: AdminPermission[] = [
      'manage_users',
      'moderate_content',
      'manage_billing',
      'view_analytics',
      'manage_system',
      'view_audit_logs'
    ];

    return adminPermissions.some(permission => checkPermission(permission));
  }, [user, checkPermission]);

  return {
    canAccessRoute,
    navigateWithPermissionCheck,
    getAccessibleRoutes,
    isCurrentUserAdmin,
    getCurrentUserRole,
    hasAnyAdminPermission,
    user
  };
}