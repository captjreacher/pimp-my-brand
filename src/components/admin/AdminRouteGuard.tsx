import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import type { AdminRole, AdminPermission } from '@/lib/admin/types';

// Simple loading component
const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

interface AdminRouteGuardProps {
  children: React.ReactNode;
  requiredRole?: AdminRole;
  requiredPermissions?: AdminPermission[];
  fallbackPath?: string;
  showLoading?: boolean;
}

export function AdminRouteGuard({
  children,
  requiredRole,
  requiredPermissions = [],
  fallbackPath = '/dashboard',
  showLoading = true
}: AdminRouteGuardProps) {
  const { user, permissions, isLoading, checkPermission } = useAdmin();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading && showLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Check if user is authenticated and has admin privileges
  if (!user || user.app_role === 'user') {
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location.pathname }}
        replace 
      />
    );
  }

  // Check role requirements
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
      return (
        <Navigate 
          to={fallbackPath} 
          state={{ 
            from: location.pathname,
            error: 'Insufficient privileges'
          }}
          replace 
        />
      );
    }
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => 
      checkPermission(permission)
    );

    if (!hasAllPermissions) {
      return (
        <Navigate 
          to={fallbackPath} 
          state={{ 
            from: location.pathname,
            error: 'Missing required permissions'
          }}
          replace 
        />
      );
    }
  }

  // All checks passed, render children
  return <>{children}</>;
}

// Convenience components for specific roles
export function SuperAdminRoute({ children, ...props }: Omit<AdminRouteGuardProps, 'requiredRole'>) {
  return (
    <AdminRouteGuard requiredRole="super_admin" {...props}>
      {children}
    </AdminRouteGuard>
  );
}

export function AdminRoute({ children, ...props }: Omit<AdminRouteGuardProps, 'requiredRole'>) {
  return (
    <AdminRouteGuard requiredRole="admin" {...props}>
      {children}
    </AdminRouteGuard>
  );
}

export function ModeratorRoute({ children, ...props }: Omit<AdminRouteGuardProps, 'requiredRole'>) {
  return (
    <AdminRouteGuard requiredRole="moderator" {...props}>
      {children}
    </AdminRouteGuard>
  );
}

// Component for conditional rendering based on permissions
interface AdminPermissionGateProps {
  children: React.ReactNode;
  requiredPermissions: AdminPermission[];
  fallback?: React.ReactNode;
  requireAll?: boolean; // true = require ALL permissions, false = require ANY permission
}

export function AdminPermissionGate({
  children,
  requiredPermissions,
  fallback = null,
  requireAll = true
}: AdminPermissionGateProps) {
  const { checkPermission } = useAdmin();

  const hasPermission = requireAll
    ? requiredPermissions.every(permission => checkPermission(permission))
    : requiredPermissions.some(permission => checkPermission(permission));

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

// Hook for programmatic navigation with admin checks
export function useAdminNavigation() {
  const { user, checkPermission } = useAdmin();

  const canAccessRoute = (
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
  };

  return { canAccessRoute, user };
}