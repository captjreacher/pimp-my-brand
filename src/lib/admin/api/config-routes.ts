// API routes for system configuration management
import { supabase } from '@/integrations/supabase/client';
import { ConfigService } from '../config-service';
import type {
  AdminConfig,
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
  ConfigRollbackRequest,
  ConfigExport,
  ConfigImportRequest
} from '../types/config-types';

export class ConfigAPI {
  // Admin Configuration endpoints
  static async getConfigs(): Promise<AdminConfig[]> {
    return ConfigService.getAllConfigs();
  }

  static async getConfig(key: string): Promise<AdminConfig | null> {
    return ConfigService.getConfig(key);
  }

  static async createConfig(config: CreateConfigRequest): Promise<AdminConfig> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    return ConfigService.createConfig(config, user.id);
  }

  static async updateConfig(key: string, update: UpdateConfigRequest): Promise<AdminConfig> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    return ConfigService.updateConfig(key, update, user.id);
  }

  static async deleteConfig(key: string): Promise<void> {
    return ConfigService.deleteConfig(key);
  }

  static async getConfigHistory(key: string) {
    return ConfigService.getConfigHistory(key);
  }

  static async rollbackConfig(rollback: ConfigRollbackRequest): Promise<AdminConfig> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    return ConfigService.rollbackConfig(rollback, user.id);
  }

  // Feature Flag endpoints
  static async getFeatureFlags(): Promise<FeatureFlag[]> {
    return ConfigService.getAllFeatureFlags();
  }

  static async getFeatureFlag(flagName: string): Promise<FeatureFlag | null> {
    return ConfigService.getFeatureFlag(flagName);
  }

  static async createFeatureFlag(flag: CreateFeatureFlagRequest): Promise<FeatureFlag> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    return ConfigService.createFeatureFlag(flag, user.id);
  }

  static async updateFeatureFlag(flagName: string, update: UpdateFeatureFlagRequest): Promise<FeatureFlag> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    return ConfigService.updateFeatureFlag(flagName, update, user.id);
  }

  static async deleteFeatureFlag(flagName: string): Promise<void> {
    return ConfigService.deleteFeatureFlag(flagName);
  }

  static async toggleFeatureFlag(flagName: string): Promise<FeatureFlag> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    return ConfigService.toggleFeatureFlag(flagName, user.id);
  }

  // Rate Limiting endpoints
  static async getRateLimits(): Promise<RateLimitConfig[]> {
    return ConfigService.getAllRateLimits();
  }

  static async getRateLimit(endpointPattern: string): Promise<RateLimitConfig | null> {
    return ConfigService.getRateLimit(endpointPattern);
  }

  static async createRateLimit(rateLimit: CreateRateLimitRequest): Promise<RateLimitConfig> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    return ConfigService.createRateLimit(rateLimit, user.id);
  }

  static async updateRateLimit(endpointPattern: string, update: UpdateRateLimitRequest): Promise<RateLimitConfig> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    return ConfigService.updateRateLimit(endpointPattern, update, user.id);
  }

  static async deleteRateLimit(endpointPattern: string): Promise<void> {
    return ConfigService.deleteRateLimit(endpointPattern);
  }

  // API Integration endpoints
  static async getApiIntegrations(): Promise<ApiIntegration[]> {
    return ConfigService.getAllApiIntegrations();
  }

  static async getApiIntegration(serviceName: string): Promise<ApiIntegration | null> {
    return ConfigService.getApiIntegration(serviceName);
  }

  static async createApiIntegration(integration: CreateApiIntegrationRequest): Promise<ApiIntegration> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    return ConfigService.createApiIntegration(integration, user.id);
  }

  static async updateApiIntegration(serviceName: string, update: UpdateApiIntegrationRequest): Promise<ApiIntegration> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    return ConfigService.updateApiIntegration(serviceName, update, user.id);
  }

  static async deleteApiIntegration(serviceName: string): Promise<void> {
    return ConfigService.deleteApiIntegration(serviceName);
  }

  static async testApiIntegration(serviceName: string) {
    return ConfigService.testApiIntegration(serviceName);
  }

  // Bulk operations
  static async bulkUpdateConfigs(updates: Array<{ key: string; value: any; change_reason?: string }>): Promise<AdminConfig[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const results: AdminConfig[] = [];
    
    for (const update of updates) {
      try {
        const result = await ConfigService.updateConfig(update.key, {
          value: update.value,
          change_reason: update.change_reason
        }, user.id);
        results.push(result);
      } catch (error) {
        console.error(`Failed to update config ${update.key}:`, error);
        // Continue with other updates
      }
    }
    
    return results;
  }

  static async bulkToggleFeatureFlags(flagNames: string[]): Promise<FeatureFlag[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const results: FeatureFlag[] = [];
    
    for (const flagName of flagNames) {
      try {
        const result = await ConfigService.toggleFeatureFlag(flagName, user.id);
        results.push(result);
      } catch (error) {
        console.error(`Failed to toggle feature flag ${flagName}:`, error);
        // Continue with other flags
      }
    }
    
    return results;
  }

  // Export/Import functionality
  static async exportConfiguration(): Promise<ConfigExport> {
    return ConfigService.exportConfiguration();
  }

  static async importConfiguration(importData: ConfigImportRequest): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    return ConfigService.importConfiguration(importData, user.id);
  }

  // Validation endpoint
  static async validateConfig(key: string, value: any, type: AdminConfig['config_type']) {
    return ConfigService.validateConfigValue(value, type);
  }

  // Search and filtering
  static async searchConfigs(query: string, filters?: {
    type?: AdminConfig['config_type'];
    sensitive?: boolean;
  }): Promise<AdminConfig[]> {
    const allConfigs = await ConfigService.getAllConfigs();
    
    return allConfigs.filter(config => {
      // Text search
      const matchesQuery = !query || 
        config.key.toLowerCase().includes(query.toLowerCase()) ||
        config.description?.toLowerCase().includes(query.toLowerCase());
      
      // Type filter
      const matchesType = !filters?.type || config.config_type === filters.type;
      
      // Sensitive filter
      const matchesSensitive = filters?.sensitive === undefined || config.is_sensitive === filters.sensitive;
      
      return matchesQuery && matchesType && matchesSensitive;
    });
  }

  static async searchFeatureFlags(query: string, filters?: {
    enabled?: boolean;
    audience_type?: string;
  }): Promise<FeatureFlag[]> {
    const allFlags = await ConfigService.getAllFeatureFlags();
    
    return allFlags.filter(flag => {
      // Text search
      const matchesQuery = !query || 
        flag.flag_name.toLowerCase().includes(query.toLowerCase()) ||
        flag.description?.toLowerCase().includes(query.toLowerCase());
      
      // Enabled filter
      const matchesEnabled = filters?.enabled === undefined || flag.is_enabled === filters.enabled;
      
      // Audience type filter
      const matchesAudience = !filters?.audience_type || flag.target_audience.type === filters.audience_type;
      
      return matchesQuery && matchesEnabled && matchesAudience;
    });
  }

  // Statistics and metrics
  static async getConfigStats() {
    const [configs, featureFlags, rateLimits, apiIntegrations] = await Promise.all([
      ConfigService.getAllConfigs(),
      ConfigService.getAllFeatureFlags(),
      ConfigService.getAllRateLimits(),
      ConfigService.getAllApiIntegrations()
    ]);

    return {
      total_configs: configs.length,
      sensitive_configs: configs.filter(c => c.is_sensitive).length,
      config_types: configs.reduce((acc, config) => {
        acc[config.config_type] = (acc[config.config_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      
      total_feature_flags: featureFlags.length,
      enabled_flags: featureFlags.filter(f => f.is_enabled).length,
      
      total_rate_limits: rateLimits.length,
      active_rate_limits: rateLimits.filter(r => r.is_enabled).length,
      
      total_integrations: apiIntegrations.length,
      active_integrations: apiIntegrations.filter(i => i.is_active).length,
      healthy_integrations: apiIntegrations.filter(i => i.health_status === 'healthy').length
    };
  }
}