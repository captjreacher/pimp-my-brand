import { supabase } from '@/integrations/supabase/client';

export interface MFASetupData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface MFAVerificationResult {
  success: boolean;
  error?: string;
}

export interface AdminSecuritySettings {
  id: string;
  user_id: string;
  mfa_enabled: boolean;
  ip_restriction_enabled: boolean;
  ip_allowlist: string[];
  session_timeout_minutes: number;
  require_mfa_for_sensitive_actions: boolean;
}

export class AdminMFAService {
  private static instance: AdminMFAService;

  private constructor() {}

  static getInstance(): AdminMFAService {
    if (!AdminMFAService.instance) {
      AdminMFAService.instance = new AdminMFAService();
    }
    return AdminMFAService.instance;
  }

  /**
   * Generate TOTP secret and setup data for MFA
   */
  async setupMFA(userId: string, userEmail: string): Promise<MFASetupData> {
    try {
      // Generate a random secret (base32 encoded)
      const secret = this.generateTOTPSecret();
      
      // Generate QR code URL for authenticator apps
      const qrCodeUrl = this.generateQRCodeUrl(userEmail, secret);
      
      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      
      // Store encrypted secret and backup codes in database
      const { error } = await supabase.rpc('setup_admin_mfa', {
        p_user_id: userId,
        p_secret: secret, // In production, this should be encrypted
        p_backup_codes: backupCodes // In production, these should be encrypted
      });

      if (error) throw error;

      return {
        secret,
        qrCodeUrl,
        backupCodes
      };
    } catch (error) {
      console.error('MFA setup error:', error);
      throw new Error('Failed to setup MFA');
    }
  }

  /**
   * Verify TOTP code during MFA setup
   */
  async verifyMFASetup(userId: string, code: string): Promise<MFAVerificationResult> {
    try {
      // Get the temporary secret from database
      const { data: settings, error } = await supabase
        .from('admin_security_settings')
        .select('mfa_secret')
        .eq('user_id', userId)
        .single();

      if (error || !settings?.mfa_secret) {
        return { success: false, error: 'MFA setup not found' };
      }

      // Verify the TOTP code
      const isValid = await this.verifyTOTPCode(settings.mfa_secret, code);
      
      if (isValid) {
        // Enable MFA for the user
        const { error: updateError } = await supabase
          .from('admin_security_settings')
          .update({ mfa_enabled: true })
          .eq('user_id', userId);

        if (updateError) throw updateError;

        return { success: true };
      } else {
        return { success: false, error: 'Invalid verification code' };
      }
    } catch (error) {
      console.error('MFA verification error:', error);
      return { success: false, error: 'Verification failed' };
    }
  }

  /**
   * Verify TOTP code during login
   */
  async verifyMFALogin(userId: string, code: string): Promise<MFAVerificationResult> {
    try {
      const { data: settings, error } = await supabase
        .from('admin_security_settings')
        .select('mfa_secret, backup_codes')
        .eq('user_id', userId)
        .eq('mfa_enabled', true)
        .single();

      if (error || !settings) {
        return { success: false, error: 'MFA not enabled' };
      }

      // First try TOTP verification
      if (await this.verifyTOTPCode(settings.mfa_secret, code)) {
        return { success: true };
      }

      // If TOTP fails, check backup codes
      if (settings.backup_codes && settings.backup_codes.includes(code)) {
        // Remove used backup code
        const updatedBackupCodes = settings.backup_codes.filter(c => c !== code);
        
        await supabase
          .from('admin_security_settings')
          .update({ backup_codes: updatedBackupCodes })
          .eq('user_id', userId);

        return { success: true };
      }

      return { success: false, error: 'Invalid verification code' };
    } catch (error) {
      console.error('MFA login verification error:', error);
      return { success: false, error: 'Verification failed' };
    }
  }

  /**
   * Disable MFA for a user
   */
  async disableMFA(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_security_settings')
        .update({
          mfa_enabled: false,
          mfa_secret: null,
          backup_codes: null
        })
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('MFA disable error:', error);
      throw new Error('Failed to disable MFA');
    }
  }

  /**
   * Get admin security settings
   */
  async getSecuritySettings(userId: string): Promise<AdminSecuritySettings | null> {
    try {
      const { data, error } = await supabase
        .from('admin_security_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Get security settings error:', error);
      return null;
    }
  }

  /**
   * Update security settings
   */
  async updateSecuritySettings(
    userId: string, 
    settings: Partial<AdminSecuritySettings>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_security_settings')
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Update security settings error:', error);
      throw new Error('Failed to update security settings');
    }
  }

  /**
   * Check if MFA is required for user
   */
  async isMFARequired(userId: string): Promise<boolean> {
    try {
      const settings = await this.getSecuritySettings(userId);
      return settings?.mfa_enabled || false;
    } catch (error) {
      console.error('MFA requirement check error:', error);
      return false;
    }
  }

  /**
   * Generate a random TOTP secret
   */
  private generateTOTPSecret(): string {
    // Generate 20 random bytes and encode as base32
    const buffer = new Uint8Array(20);
    crypto.getRandomValues(buffer);
    return this.base32Encode(buffer);
  }

  /**
   * Generate QR code URL for authenticator apps
   */
  private generateQRCodeUrl(email: string, secret: string): string {
    const issuer = 'Personal Brand Generator Admin';
    const label = `${issuer}:${email}`;
    
    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm: 'SHA1',
      digits: '6',
      period: '30'
    });

    return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      // Generate 8-digit backup codes
      const code = Math.random().toString().slice(2, 10);
      codes.push(code);
    }
    return codes;
  }

  /**
   * Verify TOTP code
   * Note: In production, use a proper TOTP library like 'otplib'
   */
  private async verifyTOTPCode(secret: string, code: string): Promise<boolean> {
    // This is a simplified implementation
    // In production, use a proper TOTP library that handles time windows
    try {
      const timeStep = Math.floor(Date.now() / 1000 / 30);
      const expectedCode = await this.generateTOTPCode(secret, timeStep);
      
      // Also check previous and next time steps for clock drift
      const prevCode = await this.generateTOTPCode(secret, timeStep - 1);
      const nextCode = await this.generateTOTPCode(secret, timeStep + 1);
      
      return code === expectedCode || code === prevCode || code === nextCode;
    } catch (error) {
      console.error('TOTP verification error:', error);
      return false;
    }
  }

  /**
   * Generate TOTP code for a given time step
   * Note: This is a simplified implementation
   */
  private async generateTOTPCode(secret: string, timeStep: number): Promise<string> {
    // This is a placeholder implementation
    // In production, use a proper TOTP library
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(timeStep.toString());
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    const hmac = new Uint8Array(signature);
    
    const offset = hmac[hmac.length - 1] & 0xf;
    const code = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    ) % 1000000;
    
    return code.toString().padStart(6, '0');
  }

  /**
   * Base32 encode
   */
  private base32Encode(buffer: Buffer): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;

      while (bits >= 5) {
        output += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += alphabet[(value << (5 - bits)) & 31];
    }

    return output;
  }
}

// Database function to setup MFA (to be added to migration)
export const setupMFAFunction = `
CREATE OR REPLACE FUNCTION setup_admin_mfa(
  p_user_id UUID,
  p_secret TEXT,
  p_backup_codes TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO admin_security_settings (
    user_id,
    mfa_secret,
    backup_codes,
    mfa_enabled
  ) VALUES (
    p_user_id,
    p_secret,
    p_backup_codes,
    false -- Will be enabled after verification
  )
  ON CONFLICT (user_id) DO UPDATE SET
    mfa_secret = EXCLUDED.mfa_secret,
    backup_codes = EXCLUDED.backup_codes,
    mfa_enabled = false,
    updated_at = NOW();
  
  RETURN true;
END;
$$;
`;