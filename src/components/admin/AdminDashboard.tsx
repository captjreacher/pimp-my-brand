import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSessionWarning } from './AdminSessionWarning';
import { AdminOnboarding, useAdminOnboarding, AdminHelpSystem } from './AdminOnboarding';
import { AdminThemeProvider } from './AdminThemeProvider';
import { AdminErrorBoundary } from './AdminErrorBoundary';
import { useAdminShortcuts } from './QuickActions';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

interface AdminDashboardProps {
  children?: React.ReactNode;
}

export function AdminDashboard({ children }: AdminDashboardProps) {
  const { user, isLoading, error } = useAdmin();
  const {
    showOnboarding,
    isCompleted,
    startOnboarding,
    completeOnboarding,
    closeOnboarding,
  } = useAdminOnboarding();
  
  // Enable admin keyboard shortcuts
  useAdminShortcuts();

  // Show loading state while checking admin authentication
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Admin Access Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Show unauthorized message if user doesn't have admin privileges
  if (!user || user.app_role === 'user') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  const adminContext = {
    userId: user.id,
    role: user.app_role,
    permissions: user.admin_permissions || [],
  };

  return (
    <AdminThemeProvider>
      <AdminErrorBoundary adminContext={adminContext}>
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-screen w-full bg-background">
            {/* Admin Sidebar */}
            <AdminSidebar />
            
            {/* Main Content Area */}
            <SidebarInset className="flex-1">
              {/* Admin Header */}
              <AdminHeader />
              
              {/* Session Warning */}
              <AdminSessionWarning />
              
              {/* Main Content */}
              <main className="flex-1 p-6">
                {children || <Outlet />}
              </main>
            </SidebarInset>

            {/* Onboarding Modal */}
            <AdminOnboarding
              isOpen={showOnboarding}
              onClose={closeOnboarding}
              onComplete={completeOnboarding}
            />

            {/* Help System */}
            <AdminHelpSystem />
          </div>
        </SidebarProvider>
      </AdminErrorBoundary>
    </AdminThemeProvider>
  );
}