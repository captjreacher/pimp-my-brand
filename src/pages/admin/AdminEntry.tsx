import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import UnifiedAdminDashboard from './UnifiedAdminDashboard';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Shield } from 'lucide-react';

/**
 * Admin Entry Point
 * Single entry point for all admin functionality
 * Handles authentication, authorization, and routing to unified dashboard
 */
export default function AdminEntry() {
  const { user, isLoading, error } = useAdmin();

  console.log('AdminEntry - Debug Info:', { user, isLoading, error });

  // In development mode, bypass authentication and show dashboard directly
  if (process.env.NODE_ENV === 'development') {
    return (
      <AdminLayout>
        <UnifiedAdminDashboard />
      </AdminLayout>
    );
  }

  // Auto-redirect disabled - using offline mode for testing

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center max-w-md">
          <LoadingSkeleton />
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
          <p className="mt-2 text-sm text-gray-500">
            If this takes more than 10 seconds, try one of the options below.
          </p>
          <div className="mt-6 space-y-2">
            <button 
              onClick={() => window.location.href = '/admin/minimal'}
              className="block w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Use Minimal Admin (Recommended)
            </button>
            <button 
              onClick={() => window.location.href = '/admin/fallback'}
              className="block w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Use Simple Admin (Fallback)
            </button>
            <button 
              onClick={() => window.location.href = '/admin/test'}
              className="block w-full text-sm underline text-gray-600"
            >
              Debug Admin Loading
            </button>
            <button 
              onClick={() => window.location.href = '/admin/direct'}
              className="block w-full text-sm underline text-gray-600"
            >
              Direct Admin Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if there's an authentication error
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-100">
        <Alert className="max-w-md" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Admin Access Error</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-4">
              <button 
                onClick={() => window.location.href = '/admin/test'}
                className="text-sm underline"
              >
                Go to Admin Test Page
              </button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Redirect non-admin users
  if (!user || user.app_role === 'user') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-100">
        <Alert className="max-w-md" variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Admin access required. Please contact an administrator if you need admin privileges.
            <div className="mt-4 space-y-2">
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="block w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Go to Dashboard
              </button>
              <button 
                onClick={() => window.location.href = '/admin/test'}
                className="block w-full text-sm underline"
              >
                Go to Admin Test Page
              </button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check for insufficient admin privileges
  if (!['admin', 'super_admin', 'moderator'].includes(user.app_role)) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-100">
        <Alert className="max-w-md" variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertTitle>Insufficient Privileges</AlertTitle>
          <AlertDescription>
            You need admin privileges to access this section.
            Your current role: {user.app_role.replace('_', ' ')}.
            <div className="mt-4">
              <button 
                onClick={() => window.location.href = '/admin/test'}
                className="text-sm underline"
              >
                Go to Admin Test Page
              </button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Render unified admin dashboard within admin layout
  try {
    return (
      <AdminLayout>
        <UnifiedAdminDashboard />
      </AdminLayout>
    );
  } catch (err) {
    console.error('Error rendering admin dashboard:', err);
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-100">
        <Alert className="max-w-md" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Dashboard Error</AlertTitle>
          <AlertDescription>
            Failed to load admin dashboard. Please try refreshing the page.
            <div className="mt-4 space-y-2">
              <button 
                onClick={() => window.location.reload()}
                className="block w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Refresh Page
              </button>
              <button 
                onClick={() => window.location.href = '/admin/test'}
                className="block w-full text-sm underline"
              >
                Go to Admin Test Page
              </button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
}