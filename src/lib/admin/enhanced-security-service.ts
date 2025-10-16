import { supabase } from '@/integrations/supabase/client';
import { mfaService as AdminMFAService } from './mfa-service-stub';

export interface LoginAttempt {
  id: string;
  user_id: string;
  email: string;
  ip_address: string;
  user_agent: string;
  success: boolean;
  failure_reason?: string;
  mfa_required: boolean;
  mfa_success?: boolean;
  created_at: string;
}

export interface AccountLockout {
  id: string;
  user_id: string;
  locked_at: string;
  locked_until?: string;
  lockout_reason: string;
  failed_attempts_count: number;
  is_active: boolean;
}

export interface SecurityMetrics {
  total_login_attempts: number;
  failed_attempts: number;
  success_rate: number;
  locked_accounts: number;
  mfa_enabled_users: number;
  ip_restricted_users: number;
}

export class EnhancedAdminSecurityService {
  private static instance: EnhancedAdminSecurityService;
  private mfaService: AdminMFAService;

  private constructor() {
    this.mfaService = AdminMFAService.getInstance();
  }

  static getInstance(): EnhancedAdminSecurityService {
    if (!EnhancedAdminSecurityService.instance) {
      EnhancedAdminSecurityService.instance = new EnhancedAdminSecurityService();
    }
    return EnhancedAdminSecurityService.instance;
  }

  /**
   * Validate admin login with enhanced security checks
   */
  async validateAdminLogin(
    userId: string,
    email: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{
    allowed: boolean;
    requiresMFA: boolean;
    error?: string;
    lockoutInfo?: AccountLockout;
  }> {
    try {
      // Check if account is locked
      const isLocked = await this.isAccountLocked(userId);
      if (isLocked) {
        const lockoutInfo = await this.getActiveLockout(userId);
        await this.recordLoginAttempt(
          userId,
          email,
          ipAddress,
          userAgent,
          false,
          'Account locked'
        );
        
        return {
          allowed: false,
          requiresMFA: false,
          error: 'Account is locked due to security violations',
          lockoutInfo
        };
      }

      // Validate IP address if restriction is enabled
      const ipAllowed = await this.validateIPAccess(userId, ipAddress);
      if (!ipAllowed) {
        await this.recordLoginAttempt(
          userId,
          email,
          ipAddress,
          userAgent,
          false,
          'IP address not allowed'
        );
        
        return {
          allowed: false,
          requiresMFA: false,
          error: 'Access denied from this IP address'
        };
      }

      // Check if MFA is required
      const requiresMFA = await this.mfaService.isMFARequired(userId);

      return {
        allowed: true,
        requiresMFA
      };
    } catch (error) {
      console.error('Admin login validation error:', error);
      return {
        allowed: false,
        requiresMFA: false,
        error: 'Security validation failed'
      };
    }
  }

  /**
   * Complete admin login process
   */
  async completeAdminLogin(
    userId: string,
    email: string,
    ipAddress: string,
    userAgent: string,
    mfaCode?: string
  ): Promise<{ success: boolean; error?: string; sessionId?: string }> {
    try {
      // Check if MFA is required
      const requiresMFA = await this.mfaService.isMFARequired(userId);
      
      if (requiresMFA) {
        if (!mfaCode) {
          return { success: false, error: 'MFA code required' };
        }

        const mfaResult = await this.mfaService.verifyMFALogin(userId, mfaCode);
        if (!mfaResult.success) {
          await this.recordLoginAttempt(
            userId,
            email,
            ipAddress,
            userAgent,
            false,
            'MFA verification failed',
            true,
            false
          );
          
          return { success: false, error: mfaResult.error };
        }
      }

      // Create admin session
      const { data: sessionId, error: sessionError } = await supabase.rpc(
        'start_enhanced_admin_session',
        {
          p_ip_address: ipAddress,
          p_user_agent: userAgent,
          p_mfa_verified: requiresMFA
        }
      );

      if (sessionError) throw sessionError;

      // Record successful login
      await this.recordLoginAttempt(
        userId,
        email,
        ipAddress,
        userAgent,
        true,
        null,
        requiresMFA,
        requiresMFA
      );

      return { success: true, sessionId };
    } catch (error) {
      console.error('Admin login completion error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  /**
   * Check if account is locked
   */
  async isAccountLocked(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_admin_account_locked', {
        p_user_id: userId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Account lock check error:', error);
      return false;
    }
  }

  /**
   * Get active lockout information
   */
  async getActiveLockout(userId: string): Promise<AccountLockout | null> {
    try {
      const { data, error } = await supabase
        .from('admin_account_lockouts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('locked_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Get lockout error:', error);
      return null;
    }
  }

  /**
   * Validate IP access
   */
  async validateIPAccess(userId: string, ipAddress: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('validate_admin_ip_access', {
        p_user_id: userId,
        p_ip_address: ipAddress
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('IP validation error:', error);
      return true; // Default to allow if validation fails
    }
  }

  /**
   * Record login attempt
   */
  async recordLoginAttempt(
    userId: string,
    email: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    failureReason?: string,
    mfaRequired: boolean = false,
    mfaSuccess?: boolean
  ): Promise<void> {
    try {
      await supabase.rpc('record_admin_login_attempt', {
        p_user_id: userId,
        p_email: email,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_success: success,
        p_failure_reason: failureReason,
        p_mfa_required: mfaRequired,
        p_mfa_success: mfaSuccess
      });
    } catch (error) {
      console.error('Record login attempt error:', error);
    }
  }

  /**
   * Get login attempts for a user
   */
  async getLoginAttempts(
    userId: string,
    limit: number = 50
  ): Promise<LoginAttempt[]> {
    try {
      const { data, error } = await supabase
        .from('admin_login_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get login attempts error:', error);
      return [];
    }
  }

  /**
   * Get security metrics
   */
  async getSecurityMetrics(timeframe: 'day' | 'week' | 'month' = 'day'): Promise<SecurityMetrics> {
    try {
      const timeframeDays = timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30;
      
      const { data, error } = await supabase.rpc('get_admin_security_metrics', {
        p_days: timeframeDays
      });

      if (error) throw error;
      
      return data || {
        total_login_attempts: 0,
        failed_attempts: 0,
        success_rate: 0,
        locked_accounts: 0,
        mfa_enabled_users: 0,
        ip_restricted_users: 0
      };
    } catch (error) {
      console.error('Get security metrics error:', error);
      return {
        total_login_attempts: 0,
        failed_attempts: 0,
        success_rate: 0,
        locked_accounts: 0,
        mfa_enabled_users: 0,
        ip_restricted_users: 0
      };
    }
  }

  /**
   * Unlock user account (admin action)
   */
  async unlockAccount(userId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('unlock_admin_account', {
        p_user_id: userId
      });

      if (error) throw error;
    } catch (error) {
      console.error('Unlock account error:', error);
      throw new Error('Failed to unlock account');
    }
  }

  /**
   * Update IP allowlist for user
   */
  async updateIPAllowlist(userId: string, ipAddresses: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_security_settings')
        .upsert({
          user_id: userId,
          ip_allowlist: ipAddresses,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Update IP allowlist error:', error);
      throw new Error('Failed to update IP allowlist');
    }
  }

  /**
   * Enable/disable IP restrictions
   */
  async setIPRestriction(userId: string, enabled: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_security_settings')
        .upsert({
          user_id: userId,
          ip_restriction_enabled: enabled,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Set IP restriction error:', error);
      throw new Error('Failed to update IP restriction setting');
    }
  }

  /**
   * Update session timeout
   */
  async updateSessionTimeout(userId: string, timeoutMinutes: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_security_settings')
        .upsert({
          user_id: userId,
          session_timeout_minutes: timeoutMinutes,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Update session timeout error:', error);
      throw new Error('Failed to update session timeout');
    }
  }

  /**
   * Validate session and update activity
   */
  async validateAndUpdateSession(sessionId: string): Promise<boolean> {
    try {
      // Check if session is expired
      const { data: isExpired, error: expiredError } = await supabase.rpc(
        'is_admin_session_expired',
        { p_session_id: sessionId }
      );

      if (expiredError) throw expiredError;
      
      if (isExpired) {
        return false;
      }

      // Update session activity
      const { data: updated, error: updateError } = await supabase.rpc(
        'update_admin_session_activity',
        { p_session_id: sessionId }
      );

      if (updateError) throw updateError;
      
      return updated;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_admin_sessions');
      
      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Cleanup expired sessions error:', error);
      return 0;
    }
  }
}