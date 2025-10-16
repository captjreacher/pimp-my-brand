// Simplified MFA service stub for build compatibility
// This is a placeholder implementation that should be replaced with proper MFA functionality

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
  mfa_secret?: string;
  backup_codes?: string[];
  created_at: string;
  updated_at: string;
}

class MFAService {
  /**
   * Setup MFA for admin user
   * This is a stub implementation
   */
  async setupMFA(userId: string, email: string): Promise<MFASetupData> {
    // Generate a mock secret for development
    const secret = this.generateMockSecret();
    const qrCodeUrl = `otpauth://totp/AdminPanel:${email}?secret=${secret}&issuer=AdminPanel`;
    const backupCodes = this.generateBackupCodes();

    return {
      secret,
      qrCodeUrl,
      backupCodes,
    };
  }

  /**
   * Verify TOTP code during MFA setup
   * This is a stub implementation
   */
  async verifyMFASetup(userId: string, code: string): Promise<MFAVerificationResult> {
    // For development, accept any 6-digit code
    if (code.length === 6 && /^\d+$/.test(code)) {
      return { success: true };
    }
    
    return { success: false, error: 'Invalid code format' };
  }

  /**
   * Verify TOTP code during login
   * This is a stub implementation
   */
  async verifyMFALogin(userId: string, code: string): Promise<MFAVerificationResult> {
    // For development, accept any 6-digit code
    if (code.length === 6 && /^\d+$/.test(code)) {
      return { success: true };
    }
    
    return { success: false, error: 'Invalid code' };
  }

  /**
   * Disable MFA for admin user
   * This is a stub implementation
   */
  async disableMFA(userId: string): Promise<{ success: boolean; error?: string }> {
    // Mock success
    return { success: true };
  }

  /**
   * Get admin security settings
   * This is a stub implementation
   */
  async getSecuritySettings(userId: string): Promise<AdminSecuritySettings | null> {
    // Return mock settings
    return {
      id: `settings-${userId}`,
      user_id: userId,
      mfa_enabled: false,
      ip_restriction_enabled: false,
      ip_allowlist: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Update security settings
   * This is a stub implementation
   */
  async updateSecuritySettings(
    userId: string, 
    settings: Partial<AdminSecuritySettings>
  ): Promise<{ success: boolean; error?: string }> {
    // Mock success
    return { success: true };
  }

  /**
   * Generate backup codes
   * This is a stub implementation
   */
  async generateNewBackupCodes(userId: string): Promise<string[]> {
    return this.generateBackupCodes();
  }

  /**
   * Generate mock secret for development
   */
  private generateMockSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<void> {
    // Mock health check - always passes
    return Promise.resolve();
  }
}

export const mfaService = new MFAService();