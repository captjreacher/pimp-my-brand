// Admin infrastructure exports
export * from './types';
export * from './permissions';
export * from './auth-service';
export * from './middleware';

// Re-export commonly used components
export { AdminProvider, useAdmin, useAdminPermissions, useAdminActions } from '@/contexts/AdminContext';
export { AdminRouteGuard, SuperAdminRoute, AdminRoute, ModeratorRoute, AdminPermissionGate, useAdminNavigation } from '@/components/admin/AdminRouteGuard';
export { AdminSessionWarning, AdminSessionIndicator } from '@/components/admin/AdminSessionWarning';
export { useAdminSession, useSessionWarning } from '@/hooks/use-admin-session';