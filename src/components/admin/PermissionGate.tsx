import React from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, Lock } from 'lucide-react';
import type { AdminRole, AdminPermission } from '@/lib/admin/types';

interface PermissionGateProps {
  children: React.ReactNode;
  requiredRole?: AdminRole;
  requiredPermissions?: AdminPermission[];
  requireAll?: boolean; // true = require ALL permissions, false = require ANY permission
  fallback?: React.ReactNode;
  showError?: boolean; // Whether to show error message or just hide content
  errorMessage?: string;
}

export function PermissionGate({
  children,
  requiredRole,
  requiredPermissions = [],
  requireAll = true,
  fallback = null,
  showError = false,
  errorMessage
}: PermissionGateProps) {
  const { user, checkPermission } = useAdmin();

  // Check if user exists and has admin privileges
  if (!user || user.app_role === 'user') {
    if (showError) {
      return (
        <Alert variant="destructive" className="max-w-md">
          <Lock className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            {errorMessage || 'Admin privileges required to view this content.'}
          </AlertDescription>
        </Alert>
      );
    }
    return <>{fallback}</>;
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
      if (showError) {
        return (
          <Alert variant="destructive" className="max-w-md">
            <Shield className="h-4 w-4" />
            <AlertTitle>Insufficient Role</AlertTitle>
            <AlertDescription>
              {errorMessage || `${requiredRole.replace('_', ' ')} role required. Your role: ${user.app_role.replace('_', ' ')}.`}
            </AlertDescription>
          </Alert>
        );
      }
      return <>{fallback}</>;
    }
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasPermission = requireAll
      ? requiredPermissions.every(permission => checkPermission(permission))
      : requiredPermissions.some(permission => checkPermission(permission));

    if (!hasPermission) {
      if (showError) {
        const missingPermissions = requiredPermissions.filter(permission => 
          !checkPermission(permission)
        );
        
        return (
          <Alert variant="destructive" className="max-w-md">
            <Shield className="h-4 w-4" />
            <AlertTitle>Missing Permissions</AlertTitle>
            <AlertDescription>
              {errorMessage || `Required permissions: ${missingPermissions.join(', ')}`}
            </AlertDescription>
          </Alert>
        );
      }
      return <>{fallback}</>;
    }
  }

  // All checks passed, render children
  return <>{children}</>;
}

// Convenience components for common permission checks
export function UserManagementGate({ children, ...props }: Omit<PermissionGateProps, 'requiredPermissions'>) {
  return (
    <PermissionGate requiredPermissions={['manage_users']} {...props}>
      {children}
    </PermissionGate>
  );
}

export function ContentModerationGate({ children, ...props }: Omit<PermissionGateProps, 'requiredPermissions'>) {
  return (
    <PermissionGate requiredPermissions={['moderate_content']} {...props}>
      {children}
    </PermissionGate>
  );
}

export function BillingManagementGate({ children, ...props }: Omit<PermissionGateProps, 'requiredPermissions'>) {
  return (
    <PermissionGate requiredPermissions={['manage_billing']} {...props}>
      {children}
    </PermissionGate>
  );
}

export function AnalyticsGate({ children, ...props }: Omit<PermissionGateProps, 'requiredPermissions'>) {
  return (
    <PermissionGate requiredPermissions={['view_analytics']} {...props}>
      {children}
    </PermissionGate>
  );
}

export function SystemManagementGate({ children, ...props }: Omit<PermissionGateProps, 'requiredPermissions'>) {
  return (
    <PermissionGate requiredPermissions={['manage_system']} {...props}>
      {children}
    </PermissionGate>
  );
}

export function AuditLogGate({ children, ...props }: Omit<PermissionGateProps, 'requiredPermissions'>) {
  return (
    <PermissionGate requiredPermissions={['view_audit_logs']} {...props}>
      {children}
    </PermissionGate>
  );
}

// Role-based gates
export function SuperAdminGate({ children, ...props }: Omit<PermissionGateProps, 'requiredRole'>) {
  return (
    <PermissionGate requiredRole="super_admin" {...props}>
      {children}
    </PermissionGate>
  );
}

export function AdminGate({ children, ...props }: Omit<PermissionGateProps, 'requiredRole'>) {
  return (
    <PermissionGate requiredRole="admin" {...props}>
      {children}
    </PermissionGate>
  );
}

export function ModeratorGate({ children, ...props }: Omit<PermissionGateProps, 'requiredRole'>) {
  return (
    <PermissionGate requiredRole="moderator" {...props}>
      {children}
    </PermissionGate>
  );
}