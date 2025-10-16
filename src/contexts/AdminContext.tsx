import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminAuthService } from '@/lib/admin/auth-service';
import { getPermissionsForRole } from '@/lib/admin/permissions';
import type { 
  AdminContext as AdminContextType, 
  AdminUser, 
  AdminSession, 
  AdminPermissions,
  AdminActionType,
  AdminPermission
} from '@/lib/admin/types';
import { toast } from 'sonner';

const AdminContext = createContext<AdminContextType | null>(null);

interface AdminProviderProps {
  children: React.ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [permissions, setPermissions] = useState<AdminPermissions>({
    canManageUsers: false,
    canModerateContent: false,
    canManageBilling: false,
    canViewAnalytics: false,
    canManageSystem: false,
    canViewAuditLogs: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authService = AdminAuthService.getInstance();

  // Initialize admin authentication
  const initialize = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const adminUser = await authService.initialize();
      
      if (adminUser) {
        setUser(adminUser);
        setPermissions(getPermissionsForRole(adminUser.app_role));
        setSession(authService.getCurrentSession());
        
        // Start admin session if not already active
        if (!authService.getCurrentSession()) {
          try {
            const newSession = await authService.startAdminSession();
            setSession(newSession);
          } catch (sessionError) {
            console.warn('Failed to start admin session:', sessionError);
            // Don't fail initialization if session creation fails
          }
        }
      } else {
        setUser(null);
        setPermissions({
          canManageUsers: false,
          canModerateContent: false,
          canManageBilling: false,
          canViewAnalytics: false,
          canManageSystem: false,
          canViewAuditLogs: false
        });
        setSession(null);
      }
    } catch (err) {
      console.error('Admin initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize admin');
      setUser(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, [authService]);

  // Login function
  const login = useCallback(async (credentials?: any) => {
    try {
      setIsLoading(true);
      setError(null);

      // If credentials provided, handle regular login first
      if (credentials) {
        // This would be handled by your regular auth system
        // For now, we'll just re-initialize
      }

      await initialize();
      
      if (user) {
        toast.success('Admin access granted');
      } else {
        throw new Error('Insufficient privileges for admin access');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Admin login failed';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [initialize, user]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      
      setUser(null);
      setSession(null);
      setPermissions({
        canManageUsers: false,
        canModerateContent: false,
        canManageBilling: false,
        canViewAnalytics: false,
        canManageSystem: false,
        canViewAuditLogs: false
      });
      
      toast.success('Logged out successfully');
    } catch (err) {
      console.error('Admin logout error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [authService]);

  // Check permission function
  const checkPermission = useCallback((permission: AdminPermission): boolean => {
    return authService.hasPermission(permission);
  }, [authService]);

  // Log action function
  const logAction = useCallback(async (
    action: AdminActionType, 
    details?: any
  ): Promise<void> => {
    try {
      await authService.logAction(action, undefined, undefined, details);
    } catch (err) {
      console.error('Failed to log admin action:', err);
      // Don't throw here as logging failures shouldn't break the app
    }
  }, [authService]);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setPermissions({
            canManageUsers: false,
            canModerateContent: false,
            canManageBilling: false,
            canViewAnalytics: false,
            canManageSystem: false,
            canViewAuditLogs: false
          });
        } else if (event === 'SIGNED_IN' && session) {
          // Re-initialize admin context
          await initialize();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [initialize]);

  const contextValue: AdminContextType = {
    user,
    permissions,
    session,
    isLoading,
    error,
    login,
    logout,
    checkPermission,
    logAction
  };

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextType {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

// Hook for checking admin permissions
export function useAdminPermissions() {
  const { permissions, checkPermission } = useAdmin();
  return { permissions, checkPermission };
}

// Hook for admin actions with automatic logging
export function useAdminActions() {
  const { logAction, user } = useAdmin();
  
  const loggedAction = useCallback(async (
    action: AdminActionType,
    details?: any,
    callback?: () => Promise<void> | void
  ) => {
    try {
      if (callback) {
        await callback();
      }
      await logAction(action, details);
    } catch (error) {
      console.error('Admin action failed:', error);
      throw error;
    }
  }, [logAction]);

  return { loggedAction, isAdmin: !!user };
}