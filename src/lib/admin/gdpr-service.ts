import { supabase } from '@/integrations/supabase/client';

export interface DataExportRequest {
  id: string;
  user_id: string;
  requested_by: string;
  request_type: 'user_data' | 'audit_logs' | 'full_export';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  export_format: 'json' | 'csv' | 'xml';
  include_deleted: boolean;
  date_range_start?: string;
  date_range_end?: string;
  export_file_path?: string;
  export_file_size?: number;
  completed_at?: string;
  expires_at?: string;
  error_message?: string;
  created_at: string;
}

export interface DataDeletionRequest {
  id: string;
  user_id: string;
  requested_by: string;
  deletion_type: 'soft_delete' | 'hard_delete' | 'anonymize';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  preserve_audit_trail: boolean;
  preserve_analytics: boolean;
  deletion_reason?: string;
  scheduled_for?: string;
  completed_at?: string;
  rollback_data?: any;
  error_message?: string;
  created_at: string;
}

export interface RetentionPolicy {
  id: string;
  policy_name: string;
  data_type: 'user_data' | 'audit_logs' | 'content' | 'analytics';
  retention_period_days: number;
  auto_delete: boolean;
  anonymize_instead: boolean;
  policy_description?: string;
  is_active: boolean;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface GDPRStatus {
  user_id: string;
  has_active_consent: boolean;
  last_export_date?: string;
  pending_deletion: boolean;
  data_anonymized: boolean;
  compliance_status: 'compliant' | 'consent_required' | 'deletion_pending' | 'anonymized';
}

export interface AuditTrailExport {
  id: string;
  export_name: string;
  date_range_start: string;
  date_range_end: string;
  user_filter?: string[];
  action_filter?: string[];
  export_format: 'json' | 'csv' | 'xml';
  file_path?: string;
  file_size?: number;
  record_count?: number;
  exported_by: string;
  export_reason?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  completed_at?: string;
  expires_at?: string;
  created_at: string;
}

export class GDPRComplianceService {
  private static instance: GDPRComplianceService;

  private constructor() {}

  static getInstance(): GDPRComplianceService {
    if (!GDPRComplianceService.instance) {
      GDPRComplianceService.instance = new GDPRComplianceService();
    }
    return GDPRComplianceService.instance;
  }

  /**
   * Create a user data export request
   */
  async createDataExport(
    userId: string,
    options: {
      format?: 'json' | 'csv' | 'xml';
      includeDeleted?: boolean;
      dateRangeStart?: Date;
      dateRangeEnd?: Date;
    } = {}
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('create_user_data_export', {
        p_user_id: userId,
        p_export_format: options.format || 'json',
        p_include_deleted: options.includeDeleted || false,
        p_date_range_start: options.dateRangeStart?.toISOString(),
        p_date_range_end: options.dateRangeEnd?.toISOString()
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create data export error:', error);
      throw new Error('Failed to create data export request');
    }
  }

  /**
   * Create a user data deletion request
   */
  async createDataDeletion(
    userId: string,
    options: {
      deletionType?: 'soft_delete' | 'hard_delete' | 'anonymize';
      preserveAuditTrail?: boolean;
      preserveAnalytics?: boolean;
      reason?: string;
      scheduledFor?: Date;
    } = {}
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('create_user_data_deletion', {
        p_user_id: userId,
        p_deletion_type: options.deletionType || 'soft_delete',
        p_preserve_audit_trail: options.preserveAuditTrail ?? true,
        p_preserve_analytics: options.preserveAnalytics ?? false,
        p_deletion_reason: options.reason,
        p_scheduled_for: options.scheduledFor?.toISOString()
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create data deletion error:', error);
      throw new Error('Failed to create data deletion request');
    }
  }

  /**
   * Anonymize user data
   */
  async anonymizeUserData(
    userId: string,
    method: 'hash' | 'random' | 'null' | 'generic' = 'hash',
    reason?: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('anonymize_user_data', {
        p_user_id: userId,
        p_anonymization_method: method,
        p_reason: reason
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Anonymize user data error:', error);
      throw new Error('Failed to anonymize user data');
    }
  }

  /**
   * Create audit trail export
   */
  async createAuditTrailExport(
    exportName: string,
    dateRangeStart: Date,
    dateRangeEnd: Date,
    options: {
      userFilter?: string[];
      actionFilter?: string[];
      format?: 'json' | 'csv' | 'xml';
      reason?: string;
    } = {}
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('create_audit_trail_export', {
        p_export_name: exportName,
        p_date_range_start: dateRangeStart.toISOString(),
        p_date_range_end: dateRangeEnd.toISOString(),
        p_user_filter: options.userFilter,
        p_action_filter: options.actionFilter,
        p_export_format: options.format || 'json',
        p_export_reason: options.reason
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create audit trail export error:', error);
      throw new Error('Failed to create audit trail export');
    }
  }

  /**
   * Get GDPR compliance status for a user
   */
  async getUserGDPRStatus(userId: string): Promise<GDPRStatus> {
    try {
      const { data, error } = await supabase.rpc('get_user_gdpr_status', {
        p_user_id: userId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get GDPR status error:', error);
      throw new Error('Failed to get GDPR status');
    }
  }

  /**
   * Get data export requests
   */
  async getDataExportRequests(
    userId?: string,
    limit: number = 50
  ): Promise<DataExportRequest[]> {
    try {
      let query = supabase
        .from('data_export_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Get data export requests error:', error);
      return [];
    }
  }

  /**
   * Get data deletion requests
   */
  async getDataDeletionRequests(
    userId?: string,
    limit: number = 50
  ): Promise<DataDeletionRequest[]> {
    try {
      let query = supabase
        .from('data_deletion_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Get data deletion requests error:', error);
      return [];
    }
  }

  /**
   * Get retention policies
   */
  async getRetentionPolicies(): Promise<RetentionPolicy[]> {
    try {
      const { data, error } = await supabase
        .from('data_retention_policies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get retention policies error:', error);
      return [];
    }
  }

  /**
   * Create or update retention policy
   */
  async upsertRetentionPolicy(policy: Partial<RetentionPolicy>): Promise<void> {
    try {
      const { error } = await supabase
        .from('data_retention_policies')
        .upsert({
          ...policy,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Upsert retention policy error:', error);
      throw new Error('Failed to save retention policy');
    }
  }

  /**
   * Get audit trail exports
   */
  async getAuditTrailExports(limit: number = 50): Promise<AuditTrailExport[]> {
    try {
      const { data, error } = await supabase
        .from('audit_trail_exports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get audit trail exports error:', error);
      return [];
    }
  }

  /**
   * Update export request status
   */
  async updateExportStatus(
    exportId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    filePath?: string,
    fileSize?: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        ...(status === 'completed' && { completed_at: new Date().toISOString() }),
        ...(filePath && { export_file_path: filePath }),
        ...(fileSize && { export_file_size: fileSize }),
        ...(errorMessage && { error_message: errorMessage })
      };

      const { error } = await supabase
        .from('data_export_requests')
        .update(updateData)
        .eq('id', exportId);

      if (error) throw error;
    } catch (error) {
      console.error('Update export status error:', error);
      throw new Error('Failed to update export status');
    }
  }

  /**
   * Update deletion request status
   */
  async updateDeletionStatus(
    deletionId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    rollbackData?: any,
    errorMessage?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        ...(status === 'completed' && { completed_at: new Date().toISOString() }),
        ...(rollbackData && { rollback_data: rollbackData }),
        ...(errorMessage && { error_message: errorMessage })
      };

      const { error } = await supabase
        .from('data_deletion_requests')
        .update(updateData)
        .eq('id', deletionId);

      if (error) throw error;
    } catch (error) {
      console.error('Update deletion status error:', error);
      throw new Error('Failed to update deletion status');
    }
  }

  /**
   * Record GDPR consent
   */
  async recordConsent(
    userId: string,
    consentType: 'data_processing' | 'marketing' | 'analytics',
    consentGiven: boolean,
    consentVersion: string,
    ipAddress?: string,
    userAgent?: string,
    withdrawalReason?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('gdpr_consent_log')
        .insert({
          user_id: userId,
          consent_type: consentType,
          consent_given: consentGiven,
          consent_version: consentVersion,
          ip_address: ipAddress,
          user_agent: userAgent,
          withdrawal_reason: withdrawalReason
        });

      if (error) throw error;
    } catch (error) {
      console.error('Record consent error:', error);
      throw new Error('Failed to record consent');
    }
  }

  /**
   * Get user consent history
   */
  async getUserConsentHistory(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('gdpr_consent_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get consent history error:', error);
      return [];
    }
  }

  /**
   * Generate user data export (simplified implementation)
   */
  async generateUserDataExport(userId: string, format: 'json' | 'csv' = 'json'): Promise<any> {
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Get user brands
      const { data: brands, error: brandsError } = await supabase
        .from('brands')
        .select('*')
        .eq('user_id', userId);

      if (brandsError) throw brandsError;

      // Get user CVs
      const { data: cvs, error: cvsError } = await supabase
        .from('cvs')
        .select('*')
        .eq('user_id', userId);

      if (cvsError) throw cvsError;

      // Get consent history
      const consentHistory = await this.getUserConsentHistory(userId);

      const exportData = {
        export_metadata: {
          user_id: userId,
          export_date: new Date().toISOString(),
          format,
          version: '1.0'
        },
        profile,
        brands: brands || [],
        cvs: cvs || [],
        consent_history: consentHistory,
        data_processing_info: {
          retention_policies: await this.getRetentionPolicies(),
          last_updated: new Date().toISOString()
        }
      };

      return exportData;
    } catch (error) {
      console.error('Generate user data export error:', error);
      throw new Error('Failed to generate user data export');
    }
  }
}