import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  action_type: string;
  target_type?: string;
  target_id?: string;
  details: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AdminSession {
  id: string;
  user_id: string;
  session_start: string;
  session_end?: string;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
}

export type AdminActionType = 
  | 'USER_CREATED'
  | 'USER_UPDATED' 
  | 'USER_SUSPENDED'
  | 'USER_ACTIVATED'
  | 'USER_DELETED'
  | 'USER_ROLE_CHANGED'
  | 'CONTENT_APPROVED'
  | 'CONTENT_REJECTED'
  | 'CONTENT_FLAGGED'
  | 'SUBSCRIPTION_MODIFIED'
  | 'SUBSCRIPTION_REFUNDED'
  | 'SYSTEM_CONFIG_CHANGED'
  | 'SESSION_START'
  | 'SESSION_END'
  | 'LOGIN_ATTEMPT'
  | 'PERMISSION_DENIED';

export type TargetType = 
  | 'user'
  | 'content'
  | 'subscription'
  | 'system'
  | 'session';

class AuditService {
  /**
   * Log an admin action to the audit trail
   */
  async logAction(
    adminUserId: string,
    actionType: AdminActionType,
    targetType?: TargetType,
    targetId?: string,
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('log_admin_action', {
        p_admin_user_id: adminUserId,
        p_action_type: actionType,
        p_target_type: targetType,
        p_target_id: targetId,
        p_details: details,
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      });

      if (error) {
        console.error('Failed to log admin action:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error logging admin action:', error);
      return null;
    }
  }

  /**
   * Start an admin session
   */
  async startSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('start_admin_session', {
        p_user_id: userId,
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      });

      if (error) {
        console.error('Failed to start admin session:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error starting admin session:', error);
      return null;
    }
  }

  /**
   * End an admin session
   */
  async endSession(userId: string, sessionId?: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('end_admin_session', {
        p_user_id: userId,
        p_session_id: sessionId
      });

      if (error) {
        console.error('Failed to end admin session:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error ending admin session:', error);
      return false;
    }
  }

  /**
   * Get audit log entries with filtering and pagination
   */
  async getAuditLog(
    filters: {
      adminUserId?: string;
      actionType?: AdminActionType;
      targetType?: TargetType;
      targetId?: string;
      startDate?: string;
      endDate?: string;
    } = {},
    pagination: {
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ data: AuditLogEntry[]; count: number } | null> {
    try {
      let query = supabase
        .from('admin_audit_log')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.adminUserId) {
        query = query.eq('admin_user_id', filters.adminUserId);
      }
      if (filters.actionType) {
        query = query.eq('action_type', filters.actionType);
      }
      if (filters.targetType) {
        query = query.eq('target_type', filters.targetType);
      }
      if (filters.targetId) {
        query = query.eq('target_id', filters.targetId);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      // Apply pagination
      const page = pagination.page || 1;
      const limit = pagination.limit || 50;
      const offset = (page - 1) * limit;
      
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Failed to fetch audit log:', error);
        return null;
      }

      return { data: data || [], count: count || 0 };
    } catch (error) {
      console.error('Error fetching audit log:', error);
      return null;
    }
  }

  /**
   * Get active admin sessions
   */
  async getActiveSessions(): Promise<AdminSession[] | null> {
    try {
      const { data, error } = await supabase
        .from('admin_sessions')
        .select('*')
        .eq('is_active', true)
        .order('session_start', { ascending: false });

      if (error) {
        console.error('Failed to fetch active sessions:', error);
        return null;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      return null;
    }
  }

  /**
   * Get session history for a user
   */
  async getUserSessions(
    userId: string,
    limit: number = 10
  ): Promise<AdminSession[] | null> {
    try {
      const { data, error } = await supabase
        .from('admin_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('session_start', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch user sessions:', error);
        return null;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      return null;
    }
  }

  /**
   * Helper method to get client IP and user agent
   */
  getClientInfo(): { ipAddress?: string; userAgent?: string } {
    return {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    };
  }
}

export const auditService = new AuditService();