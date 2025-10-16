// System configuration service for admin management
import { supabase } from '@/integrations/supabase/client';
import type {
  AdminConfig,
  AdminConfigHistory,
  FeatureFlag,
  RateLimitConfig,
  ApiIntegration,
  CreateConfigRequest,
  UpdateConfigRequest,
  CreateFeatureFlagRequest,
  UpdateFeatureFlagRequest,
  CreateRateLimitRequest,
  UpdateRateLimitRequest,
  CreateApiIntegrationRequest,
  UpdateApiIntegrationRequest,
  ConfigValidationResult,
  ConfigRollbackRequest,
  IntegrationHealthCheck,
  ConfigExport,
  ConfigImportRequest
} from './types/config-types';

export class ConfigService {
  // Admin Configuration Management
  static async getAllConfigs(): Promise<AdminConfig[]> {
    const { data, error } = await supabase
      .from('admin_config')
      .select('*')
      .order('key');

    if (error) throw error;
    return data || [];
  }

  static async getConfig(key: string): Promise<AdminConfig | null> {
    const { data, error } = await supabase
      .from('admin_config')
      .select('*')
      .eq('key', key)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async createConfig(config: CreateConfigRequest, userId: string): Promise<AdminConfig> {
    // Validate configuration value
    const validation = this.validateConfigValue(config.value, config.config_type);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    const { data, error } = await supabase
      .from('admin_config')
      .insert({
        ...config,
        created_by: userId,
        updated_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateConfig(key: string, update: UpdateConfigRequest, userId: string): Promise<AdminConfig> {
    // Get current config to validate type
    const currentConfig = await this.getConfig(key);
    if (!currentConfig) {
      throw new Error(`Configuration key '${key}' not found`);
    }

    // Validate new value against existing type
    const validation = this.validateConfigValue(update.value, currentConfig.config_type);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    const { data, error } = await supabase
      .from('admin_config')
      .update({
        value: update.value,
        description: update.description,
        updated_by: userId
      })
      .eq('key', key)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteConfig(key: string): Promise<void> {
    const { error } = await supabase
      .from('admin_config')
      .delete()
      .eq('key', key);

    if (error) throw error;
  }

  static async getConfigHistory(key: string): Promise<AdminConfigHistory[]> {
    const { data, error } = await supabase
      .from('admin_config_history')
      .select(`
        *,
        changed_by_profile:profiles!admin_config_history_changed_by_fkey(full_name, email)
      `)
      .eq('config_key', key)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async rollbackConfig(rollback: ConfigRollbackRequest, userId: string): Promise<AdminConfig> {
    // Get the target history record
    const { data: historyRecord, error: historyError } = await supabase
      .from('admin_config_history')
      .select('*')
      .eq('id', rollback.target_history_id)
      .eq('config_key', rollback.config_key)
      .single();

    if (historyError) throw historyError;
    if (!historyRecord) throw new Error('History record not found');

    // Update the config with the historical value
    return this.updateConfig(rollback.config_key, {
      value: historyRecord.old_value || historyRecord.new_value,
      change_reason: rollback.reason || `Rollback to ${historyRecord.created_at}`
    }, userId);
  }

  // Feature Flag Management
  static async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('flag_name');

    if (error) throw error;
    return data || [];
  }

  static async getFeatureFlag(flagName: string): Promise<FeatureFlag | null> {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('flag_name', flagName)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async createFeatureFlag(flag: CreateFeatureFlagRequest, userId: string): Promise<FeatureFlag> {
    const { data, error } = await supabase
      .from('feature_flags')
      .insert({
        ...flag,
        created_by: userId,
        updated_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateFeatureFlag(flagName: string, update: UpdateFeatureFlagRequest, userId: string): Promise<FeatureFlag> {
    const { data, error } = await supabase
      .from('feature_flags')
      .update({
        ...update,
        updated_by: userId
      })
      .eq('flag_name', flagName)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteFeatureFlag(flagName: string): Promise<void> {
    const { error } = await supabase
      .from('feature_flags')
      .delete()
      .eq('flag_name', flagName);

    if (error) throw error;
  }

  static async toggleFeatureFlag(flagName: string, userId: string): Promise<FeatureFlag> {
    const currentFlag = await this.getFeatureFlag(flagName);
    if (!currentFlag) throw new Error(`Feature flag '${flagName}' not found`);

    return this.updateFeatureFlag(flagName, {
      is_enabled: !currentFlag.is_enabled
    }, userId);
  }

  // Rate Limiting Management
  static async getAllRateLimits(): Promise<RateLimitConfig[]> {
    const { data, error } = await supabase
      .from('rate_limit_config')
      .select('*')
      .order('endpoint_pattern');

    if (error) throw error;
    return data || [];
  }

  static async getRateLimit(endpointPattern: string): Promise<RateLimitConfig | null> {
    const { data, error } = await supabase
      .from('rate_limit_config')
      .select('*')
      .eq('endpoint_pattern', endpointPattern)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async createRateLimit(rateLimit: CreateRateLimitRequest, userId: string): Promise<RateLimitConfig> {
    const { data, error } = await supabase
      .from('rate_limit_config')
      .insert({
        ...rateLimit,
        created_by: userId,
        updated_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateRateLimit(endpointPattern: string, update: UpdateRateLimitRequest, userId: string): Promise<RateLimitConfig> {
    const { data, error } = await supabase
      .from('rate_limit_config')
      .update({
        ...update,
        updated_by: userId
      })
      .eq('endpoint_pattern', endpointPattern)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteRateLimit(endpointPattern: string): Promise<void> {
    const { error } = await supabase
      .from('rate_limit_config')
      .delete()
      .eq('endpoint_pattern', endpointPattern);

    if (error) throw error;
  }

  // API Integration Management
  static async getAllApiIntegrations(): Promise<ApiIntegration[]> {
    const { data, error } = await supabase
      .from('api_integrations')
      .select('*')
      .order('service_name');

    if (error) throw error;
    return data || [];
  }

  static async getApiIntegration(serviceName: string): Promise<ApiIntegration | null> {
    const { data, error } = await supabase
      .from('api_integrations')
      .select('*')
      .eq('service_name', serviceName)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async createApiIntegration(integration: CreateApiIntegrationRequest, userId: string): Promise<ApiIntegration> {
    // Encrypt API key if provided
    const encryptedKey = integration.api_key ? await this.encryptApiKey(integration.api_key) : undefined;

    const { data, error } = await supabase
      .from('api_integrations')
      .insert({
        service_name: integration.service_name,
        api_key_encrypted: encryptedKey,
        endpoint_url: integration.endpoint_url,
        configuration: integration.configuration || {},
        is_active: integration.is_active ?? true,
        created_by: userId,
        updated_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateApiIntegration(serviceName: string, update: UpdateApiIntegrationRequest, userId: string): Promise<ApiIntegration> {
    const updateData: any = {
      ...update,
      updated_by: userId
    };

    // Encrypt API key if provided
    if (update.api_key) {
      updateData.api_key_encrypted = await this.encryptApiKey(update.api_key);
      delete updateData.api_key;
    }

    const { data, error } = await supabase
      .from('api_integrations')
      .update(updateData)
      .eq('service_name', serviceName)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteApiIntegration(serviceName: string): Promise<void> {
    const { error } = await supabase
      .from('api_integrations')
      .delete()
      .eq('service_name', serviceName);

    if (error) throw error;
  }

  static async testApiIntegration(serviceName: string): Promise<IntegrationHealthCheck> {
    const integration = await this.getApiIntegration(serviceName);
    if (!integration) throw new Error(`Integration '${serviceName}' not found`);

    const startTime = Date.now();
    let status: IntegrationHealthCheck['status'] = 'unknown';
    let errorMessage: string | undefined;

    try {
      // Basic health check - attempt to reach the endpoint
      if (integration.endpoint_url) {
        const response = await fetch(integration.endpoint_url, {
          method: 'HEAD',
          timeout: 5000
        });
        
        if (response.ok) {
          status = 'healthy';
        } else {
          status = 'degraded';
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
      } else {
        status = 'healthy'; // No endpoint to test
      }
    } catch (error) {
      status = 'down';
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }

    const responseTime = Date.now() - startTime;

    // Update the integration with health check results
    await supabase
      .from('api_integrations')
      .update({
        last_health_check: new Date().toISOString(),
        health_status: status
      })
      .eq('service_name', serviceName);

    return {
      service_name: serviceName,
      status,
      response_time_ms: responseTime,
      last_checked: new Date().toISOString(),
      error_message: errorMessage
    };
  }

  // Validation helpers
  static validateConfigValue(value: any, type: AdminConfig['config_type']): ConfigValidationResult {
    const errors: any[] = [];

    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push({ field: 'value', message: 'Value must be a string', code: 'INVALID_TYPE' });
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push({ field: 'value', message: 'Value must be a valid number', code: 'INVALID_TYPE' });
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push({ field: 'value', message: 'Value must be a boolean', code: 'INVALID_TYPE' });
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          errors.push({ field: 'value', message: 'Value must be an array', code: 'INVALID_TYPE' });
        }
        break;
      case 'json':
        if (typeof value !== 'object' || value === null) {
          errors.push({ field: 'value', message: 'Value must be a valid JSON object', code: 'INVALID_TYPE' });
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Export/Import functionality
  static async exportConfiguration(): Promise<ConfigExport> {
    const [configs, featureFlags, rateLimits] = await Promise.all([
      this.getAllConfigs(),
      this.getAllFeatureFlags(),
      this.getAllRateLimits()
    ]);

    const { data: { user } } = await supabase.auth.getUser();

    return {
      configs,
      feature_flags: featureFlags,
      rate_limits: rateLimits,
      exported_at: new Date().toISOString(),
      exported_by: user?.id || 'unknown'
    };
  }

  static async importConfiguration(importData: ConfigImportRequest, userId: string): Promise<void> {
    // This would be implemented with proper transaction handling
    // For now, we'll implement basic import functionality
    
    if (importData.configs) {
      for (const config of importData.configs) {
        if (config.key && config.value !== undefined && config.config_type) {
          try {
            const existing = await this.getConfig(config.key);
            if (existing && !importData.overwrite_existing) {
              continue; // Skip existing configs unless overwrite is enabled
            }

            if (existing) {
              await this.updateConfig(config.key, {
                value: config.value,
                description: config.description
              }, userId);
            } else {
              await this.createConfig({
                key: config.key,
                value: config.value,
                description: config.description,
                config_type: config.config_type,
                is_sensitive: config.is_sensitive
              }, userId);
            }
          } catch (error) {
            console.error(`Failed to import config ${config.key}:`, error);
          }
        }
      }
    }

    // Similar logic for feature flags and rate limits...
  }

  // Utility methods
  private static async encryptApiKey(apiKey: string): Promise<string> {
    // In a real implementation, this would use proper encryption
    // For now, we'll use base64 encoding as a placeholder
    return btoa(apiKey);
  }

  private static async decryptApiKey(encryptedKey: string): Promise<string> {
    // In a real implementation, this would use proper decryption
    // For now, we'll use base64 decoding as a placeholder
    return atob(encryptedKey);
  }
}