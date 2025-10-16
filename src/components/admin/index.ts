// Main admin components
export { AdminDashboard } from './AdminDashboard';
export { AdminLayout } from './AdminLayout';
export { AdminSidebar } from './AdminSidebar';
export { AdminHeader } from './AdminHeader';

// Route protection components
export { AdminRouteGuard } from './AdminRouteGuard';
export { PermissionGate } from './PermissionGate';
export { UnauthorizedAccess } from './UnauthorizedAccess';

// Navigation components
export { AdminBreadcrumbs } from './AdminBreadcrumbs';
export { AdminSearch, AdminSearchInput } from './AdminSearch';
export { QuickActions } from './QuickActions';

// Utility components
export { AdminSessionWarning } from './AdminSessionWarning';

// Layout convenience components
export {
  SuperAdminLayout,
  AdminOnlyLayout,
  ModeratorLayout,
  UserManagementLayout,
  ContentModerationLayout,
  BillingManagementLayout,
  AnalyticsLayout,
  SystemManagementLayout,
  AuditLogLayout,
} from './AdminLayout';

// Permission gate convenience components
export {
  UserManagementGate,
  ContentModerationGate,
  BillingManagementGate,
  AnalyticsGate,
  SystemManagementGate,
  AuditLogGate,
  SuperAdminGate,
  AdminGate,
  ModeratorGate,
} from './PermissionGate';

// Unauthorized access convenience components
export {
  AdminLoginRequired,
  InsufficientRole,
  MissingPermissions,
} from './UnauthorizedAccess';