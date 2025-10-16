import { supabase } from '@/integrations/supabase/client';
import type { AdminRole, AdminPermission } from './types';
import { hasPermission } from './permissions';

export interface AdminMiddlewareOptions {
  requiredRole?: AdminRole;
  requiredPermissions?: AdminPermission[];
  logAction?: boolean;
}

export interface AdminRequest {
  user: {
    id: string;
    email?: string;
    app_role: AdminRole;
  };
  session: {
    id: string;
    is_active: boolean;
  };
}

/**
 * Admin authentication middleware for API calls
 */
export async function adminMiddleware(
  options: AdminMiddlewareOptions = {}
): Promise<AdminRequest> {
  const { requiredRole, requiredPermissions = [], logAction = true } = options;

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Authentication required');
    }

    // Get user profile with admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('app_role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    // Check if user has admin privileges
    if (!profile.app_role || profile.app_role === 'user') {
      throw new Error('Insufficient privileges');
    }

    // Check role requirements
    if (requiredRole) {
      const roleHierarchy: Record<AdminRole, number> = {
        user: 0,
        moderator: 1,
        admin: 2,
        super_admin: 3
      };

      const userLevel = roleHierarchy[profile.app_role] || 0;
      const requiredLevel = roleHierarchy[requiredRole] || 0;

      if (userLevel < requiredLevel) {
        throw new Error(`Role ${requiredRole} required`);
      }
    }

    // Check permission requirements
    if (requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every(permission => 
        hasPermission(profile.app_role, permission)
      );

      if (!hasAllPermissions) {
        throw new Error('Missing required permissions');
      }
    }

    // Check for active admin session
    const { data: sessions, error: sessionError } = await supabase
      .from('admin_sessions')
      .select('id, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionError) {
      throw new Error('Session validation failed');
    }

    if (!sessions || sessions.length === 0) {
      throw new Error('No active admin session');
    }

    const session = sessions[0];

    // Return admin request object
    return {
      user: {
        id: user.id,
        email: user.email,
        app_role: profile.app_role
      },
      session: {
        id: session.id,
        is_active: session.is_active
      }
    };

  } catch (error) {
    console.error('Admin middleware error:', error);
    throw error;
  }
}

/**
 * Wrapper for admin API calls with automatic middleware
 */
export async function withAdminAuth<T>(
  apiCall: (req: AdminRequest) => Promise<T>,
  options: AdminMiddlewareOptions = {}
): Promise<T> {
  const adminRequest = await adminMiddleware(options);
  return await apiCall(adminRequest);
}

/**
 * Log admin action helper
 */
export async function logAdminAction(
  actionType: string,
  targetType?: string,
  targetId?: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Server';
    
    const { error } = await supabase.rpc('log_admin_action', {
      p_action_type: actionType,
      p_target_type: targetType,
      p_target_id: targetId,
      p_details: details ? JSON.stringify(details) : null,
      p_user_agent: userAgent
    });

    if (error) {
      console.error('Failed to log admin action:', error);
    }
  } catch (error) {
    console.error('Admin action logging error:', error);
  }
}

/**
 * Validate admin session
 */
export async function validateAdminSession(userId: string): Promise<boolean> {
  try {
    const { data: sessions, error } = await supabase
      .from('admin_sessions')
      .select('id, is_active, session_start')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !sessions || sessions.length === 0) {
      return false;
    }

    const session = sessions[0];
    const sessionStart = new Date(session.session_start);
    const now = new Date();
    const sessionDuration = now.getTime() - sessionStart.getTime();
    
    // Check if session is older than 8 hours (configurable)
    const maxSessionDuration = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    
    if (sessionDuration > maxSessionDuration) {
      // End expired session
      await supabase
        .from('admin_sessions')
        .update({ is_active: false, session_end: now.toISOString() })
        .eq('id', session.id);
      
      return false;
    }

    return true;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
}

/**
 * Get admin user info
 */
export async function getAdminUser(userId: string) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return null;
    }

    // Check if user has admin privileges
    if (!profile.app_role || profile.app_role === 'user') {
      return null;
    }

    return {
      id: userId,
      app_role: profile.app_role,
      profile
    };
  } catch (error) {
    console.error('Get admin user error:', error);
    return null;
  }
}