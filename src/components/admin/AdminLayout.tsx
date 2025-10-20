import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { AdminDashboard } from './AdminDashboard';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Shield } from 'lucide-react';
import type { AdminRole, AdminPermission } from '@/lib/admin/types';

interface AdminLayoutProps {
  children: React.ReactNode;
  requiredRole?: AdminRole;
  requiredPermissions?: AdminPermission[];
  fallbackPath?: string;
}

export function AdminLayout({
  children,
  requiredRole,
  requiredPermissions = [],
  fallbackPath = '/dashboard'
}: AdminLayoutProps) {
  const { user, permissions, isLoading, error, checkPermission } = useAdmin();
  const location = useLocation();

  // In offline mode, skip authentication checks
  if (process.env.NODE_ENV === 'development') {
    return (
      <AdminDashboard>
        {children}
      </AdminDashboard>
    );
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSkeleton />
      </div>
    );
  }

  // Show error state if there's an authentication error
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert className="max-w-md" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Admin Access Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check if user is authenticated and has admin privileges
  if (!user || user.app_role === 'user') {
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ 
          from: location.pathname,
          error: 'Admin access required'
        }}
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
        <AdminDashboard>
          <div className="flex items-center justify-center min-h-[400px]">
            <Alert className="max-w-md" variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertTitle>Insufficient Privileges</AlertTitle>
              <AlertDescription>
                You need {requiredRole.replace('_', ' ')} privileges to access this section.
                Your current role: {user.app_role.replace('_', ' ')}.
              </AlertDescription>
            </Alert>
          </div>
        </AdminDashboard>
      );
    }
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const missingPermissions = requiredPermissions.filter(permission => 
      !checkPermission(permission)
    );

    if (missingPermissions.length > 0) {
      return (
        <AdminDashboard>
          <div className="flex items-center justify-center min-h-[400px]">
            <Alert className="max-w-md" variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertTitle>Missing Permissions</AlertTitle>
              <AlertDescription>
                You don't have the required permissions to access this section.
                Missing: {missingPermissions.join(', ')}.
              </AlertDescription>
            </Alert>
          </div>
        </AdminDashboard>
      );
    }
  }

  // All checks passed, render children within admin dashboard
  return (
    <AdminDashboard>
      {children}
    </AdminDashboard>
  );
}

// Convenience components for specific roles and permissions
export function SuperAdminLayout({ children, ...props }: Omit<AdminLayoutProps, 'requiredRole'>) {
  return (
    <AdminLayout requiredRole="super_admin" {...props}>
      {children}
    </AdminLayout>
  );
}

export function AdminOnlyLayout({ children, ...props }: Omit<AdminLayoutProps, 'requiredRole'>) {
  return (
    <AdminLayout requiredRole="admin" {...props}>
      {children}
    </AdminLayout>
  );
}

export function ModeratorLayout({ children, ...props }: Omit<AdminLayoutProps, 'requiredRole'>) {
  return (
    <AdminLayout requiredRole="moderator" {...props}>
      {children}
    </AdminLayout>
  );
}

// Permission-based layout components
export function UserManagementLayout({ children, ...props }: Omit<AdminLayoutProps, 'requiredPermissions'>) {
  return (
    <AdminLayout requiredPermissions={['manage_users']} {...props}>
      {children}
    </AdminLayout>
  );
}

export function ContentModerationLayout({ children, ...props }: Omit<AdminLayoutProps, 'requiredPermissions'>) {
  return (
    <AdminLayout requiredPermissions={['moderate_content']} {...props}>
      {children}
    </AdminLayout>
  );
}

export function BillingManagementLayout({ children, ...props }: Omit<AdminLayoutProps, 'requiredPermissions'>) {
  return (
    <AdminLayout requiredPermissions={['manage_billing']} {...props}>
      {children}
    </AdminLayout>
  );
}

export function AnalyticsLayout({ children, ...props }: Omit<AdminLayoutProps, 'requiredPermissions'>) {
  return (
    <AdminLayout requiredPermissions={['view_analytics']} {...props}>
      {children}
    </AdminLayout>
  );
}

export function SystemManagementLayout({ children, ...props }: Omit<AdminLayoutProps, 'requiredPermissions'>) {
  return (
    <AdminLayout requiredPermissions={['manage_system']} {...props}>
      {children}
    </AdminLayout>
  );
}

export function AuditLogLayout({ children, ...props }: Omit<AdminLayoutProps, 'requiredPermissions'>) {
  return (
    <AdminLayout requiredPermissions={['view_audit_logs']} {...props}>
      {children}
    </AdminLayout>
  );
}