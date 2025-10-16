// Hook for managing system configuration state
import { useState, useEffect, useCallback } from 'react';
import { ConfigAPI } from '@/lib/admin/api/config-routes';
import type {
  AdminConfig,
  FeatureFlag,
  RateLimitConfig,
  ApiIntegration,
  SystemConfigState,
  CreateConfigRequest,
  UpdateConfigRequest,
  CreateFeatureFlagRequest,
  UpdateFeatureFlagRequest,
  CreateRateLimitRequest,
  UpdateRateLimitRequest,
  CreateApiIntegrationRequest,
  UpdateApiIntegrationRequest,
  ConfigRollbackRequest,
  IntegrationHealthCheck
} from '@/lib/admin/types/config-types';
import { useToast } from '@/hooks/use-toast';

export function useSystemConfig() {
  const [state, setState] = useState<SystemConfigState>({
    configs: [],
    featureFlags: [],
    rateLimits: [],
    apiIntegrations: [],
    configHistory: [],
    loading: false,
    error: null
  });

  const { toast } = useToast();

  // Load all configuration data
  const loadAllData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const [configs, featureFlags, rateLimits, apiIntegrations] = await Promise.all([
        ConfigAPI.getConfigs(),
        ConfigAPI.getFeatureFlags(),
        ConfigAPI.getRateLimits(),
        ConfigAPI.getApiIntegrations()
      ]);

      setState(prev => ({
        ...prev,
        configs,
        featureFlags,
        rateLimits,
        apiIntegrations,
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load configuration';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [toast]);

  // Configuration management
  const createConfig = useCallback(async (config: CreateConfigRequest) => {
    try {
      const newConfig = await ConfigAPI.createConfig(config);
      setState(prev => ({
        ...prev,
        configs: [...prev.configs, newConfig]
      }));
      toast({
        title: "Success",
        description: `Configuration '${config.key}' created successfully`
      });
      return newConfig;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create configuration';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const updateConfig = useCallback(async (key: string, update: UpdateConfigRequest) => {
    try {
      const updatedConfig = await ConfigAPI.updateConfig(key, update);
      setState(prev => ({
        ...prev,
        configs: prev.configs.map(config => 
          config.key === key ? updatedConfig : config
        )
      }));
      toast({
        title: "Success",
        description: `Configuration '${key}' updated successfully`
      });
      return updatedConfig;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update configuration';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const deleteConfig = useCallback(async (key: string) => {
    try {
      await ConfigAPI.deleteConfig(key);
      setState(prev => ({
        ...prev,
        configs: prev.configs.filter(config => config.key !== key)
      }));
      toast({
        title: "Success",
        description: `Configuration '${key}' deleted successfully`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete configuration';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const rollbackConfig = useCallback(async (rollback: ConfigRollbackRequest) => {
    try {
      const rolledBackConfig = await ConfigAPI.rollbackConfig(rollback);
      setState(prev => ({
        ...prev,
        configs: prev.configs.map(config => 
          config.key === rollback.config_key ? rolledBackConfig : config
        )
      }));
      toast({
        title: "Success",
        description: `Configuration '${rollback.config_key}' rolled back successfully`
      });
      return rolledBackConfig;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to rollback configuration';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const loadConfigHistory = useCallback(async (key: string) => {
    try {
      const history = await ConfigAPI.getConfigHistory(key);
      setState(prev => ({ ...prev, configHistory: history }));
      return history;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load configuration history';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  // Feature flag management
  const createFeatureFlag = useCallback(async (flag: CreateFeatureFlagRequest) => {
    try {
      const newFlag = await ConfigAPI.createFeatureFlag(flag);
      setState(prev => ({
        ...prev,
        featureFlags: [...prev.featureFlags, newFlag]
      }));
      toast({
        title: "Success",
        description: `Feature flag '${flag.flag_name}' created successfully`
      });
      return newFlag;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create feature flag';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const updateFeatureFlag = useCallback(async (flagName: string, update: UpdateFeatureFlagRequest) => {
    try {
      const updatedFlag = await ConfigAPI.updateFeatureFlag(flagName, update);
      setState(prev => ({
        ...prev,
        featureFlags: prev.featureFlags.map(flag => 
          flag.flag_name === flagName ? updatedFlag : flag
        )
      }));
      toast({
        title: "Success",
        description: `Feature flag '${flagName}' updated successfully`
      });
      return updatedFlag;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update feature flag';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const toggleFeatureFlag = useCallback(async (flagName: string) => {
    try {
      const toggledFlag = await ConfigAPI.toggleFeatureFlag(flagName);
      setState(prev => ({
        ...prev,
        featureFlags: prev.featureFlags.map(flag => 
          flag.flag_name === flagName ? toggledFlag : flag
        )
      }));
      toast({
        title: "Success",
        description: `Feature flag '${flagName}' ${toggledFlag.is_enabled ? 'enabled' : 'disabled'}`
      });
      return toggledFlag;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle feature flag';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const deleteFeatureFlag = useCallback(async (flagName: string) => {
    try {
      await ConfigAPI.deleteFeatureFlag(flagName);
      setState(prev => ({
        ...prev,
        featureFlags: prev.featureFlags.filter(flag => flag.flag_name !== flagName)
      }));
      toast({
        title: "Success",
        description: `Feature flag '${flagName}' deleted successfully`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete feature flag';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  // Rate limit management
  const createRateLimit = useCallback(async (rateLimit: CreateRateLimitRequest) => {
    try {
      const newRateLimit = await ConfigAPI.createRateLimit(rateLimit);
      setState(prev => ({
        ...prev,
        rateLimits: [...prev.rateLimits, newRateLimit]
      }));
      toast({
        title: "Success",
        description: `Rate limit for '${rateLimit.endpoint_pattern}' created successfully`
      });
      return newRateLimit;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create rate limit';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const updateRateLimit = useCallback(async (endpointPattern: string, update: UpdateRateLimitRequest) => {
    try {
      const updatedRateLimit = await ConfigAPI.updateRateLimit(endpointPattern, update);
      setState(prev => ({
        ...prev,
        rateLimits: prev.rateLimits.map(limit => 
          limit.endpoint_pattern === endpointPattern ? updatedRateLimit : limit
        )
      }));
      toast({
        title: "Success",
        description: `Rate limit for '${endpointPattern}' updated successfully`
      });
      return updatedRateLimit;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update rate limit';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const deleteRateLimit = useCallback(async (endpointPattern: string) => {
    try {
      await ConfigAPI.deleteRateLimit(endpointPattern);
      setState(prev => ({
        ...prev,
        rateLimits: prev.rateLimits.filter(limit => limit.endpoint_pattern !== endpointPattern)
      }));
      toast({
        title: "Success",
        description: `Rate limit for '${endpointPattern}' deleted successfully`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete rate limit';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  // API integration management
  const createApiIntegration = useCallback(async (integration: CreateApiIntegrationRequest) => {
    try {
      const newIntegration = await ConfigAPI.createApiIntegration(integration);
      setState(prev => ({
        ...prev,
        apiIntegrations: [...prev.apiIntegrations, newIntegration]
      }));
      toast({
        title: "Success",
        description: `API integration '${integration.service_name}' created successfully`
      });
      return newIntegration;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create API integration';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const updateApiIntegration = useCallback(async (serviceName: string, update: UpdateApiIntegrationRequest) => {
    try {
      const updatedIntegration = await ConfigAPI.updateApiIntegration(serviceName, update);
      setState(prev => ({
        ...prev,
        apiIntegrations: prev.apiIntegrations.map(integration => 
          integration.service_name === serviceName ? updatedIntegration : integration
        )
      }));
      toast({
        title: "Success",
        description: `API integration '${serviceName}' updated successfully`
      });
      return updatedIntegration;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update API integration';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const deleteApiIntegration = useCallback(async (serviceName: string) => {
    try {
      await ConfigAPI.deleteApiIntegration(serviceName);
      setState(prev => ({
        ...prev,
        apiIntegrations: prev.apiIntegrations.filter(integration => integration.service_name !== serviceName)
      }));
      toast({
        title: "Success",
        description: `API integration '${serviceName}' deleted successfully`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete API integration';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const testApiIntegration = useCallback(async (serviceName: string): Promise<IntegrationHealthCheck> => {
    try {
      const healthCheck = await ConfigAPI.testApiIntegration(serviceName);
      
      // Update the integration status in state
      setState(prev => ({
        ...prev,
        apiIntegrations: prev.apiIntegrations.map(integration => 
          integration.service_name === serviceName 
            ? { ...integration, health_status: healthCheck.status, last_health_check: healthCheck.last_checked }
            : integration
        )
      }));

      toast({
        title: "Health Check Complete",
        description: `${serviceName}: ${healthCheck.status}`,
        variant: healthCheck.status === 'healthy' ? 'default' : 'destructive'
      });

      return healthCheck;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to test API integration';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  // Bulk operations
  const bulkUpdateConfigs = useCallback(async (updates: Array<{ key: string; value: any; change_reason?: string }>) => {
    try {
      const updatedConfigs = await ConfigAPI.bulkUpdateConfigs(updates);
      
      setState(prev => ({
        ...prev,
        configs: prev.configs.map(config => {
          const updated = updatedConfigs.find(u => u.key === config.key);
          return updated || config;
        })
      }));

      toast({
        title: "Success",
        description: `${updatedConfigs.length} configurations updated successfully`
      });

      return updatedConfigs;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update configurations';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const bulkToggleFeatureFlags = useCallback(async (flagNames: string[]) => {
    try {
      const toggledFlags = await ConfigAPI.bulkToggleFeatureFlags(flagNames);
      
      setState(prev => ({
        ...prev,
        featureFlags: prev.featureFlags.map(flag => {
          const toggled = toggledFlags.find(t => t.flag_name === flag.flag_name);
          return toggled || flag;
        })
      }));

      toast({
        title: "Success",
        description: `${toggledFlags.length} feature flags toggled successfully`
      });

      return toggledFlags;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to bulk toggle feature flags';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  // Export/Import
  const exportConfiguration = useCallback(async () => {
    try {
      const exportData = await ConfigAPI.exportConfiguration();
      
      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Configuration exported successfully"
      });

      return exportData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export configuration';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const importConfiguration = useCallback(async (file: File, overwriteExisting = false) => {
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      await ConfigAPI.importConfiguration({
        ...importData,
        overwrite_existing: overwriteExisting
      });

      // Reload all data after import
      await loadAllData();

      toast({
        title: "Success",
        description: "Configuration imported successfully"
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import configuration';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  }, [toast, loadAllData]);

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return {
    ...state,
    
    // Data loading
    loadAllData,
    
    // Configuration management
    createConfig,
    updateConfig,
    deleteConfig,
    rollbackConfig,
    loadConfigHistory,
    
    // Feature flag management
    createFeatureFlag,
    updateFeatureFlag,
    toggleFeatureFlag,
    deleteFeatureFlag,
    
    // Rate limit management
    createRateLimit,
    updateRateLimit,
    deleteRateLimit,
    
    // API integration management
    createApiIntegration,
    updateApiIntegration,
    deleteApiIntegration,
    testApiIntegration,
    
    // Bulk operations
    bulkUpdateConfigs,
    bulkToggleFeatureFlags,
    
    // Export/Import
    exportConfiguration,
    importConfiguration
  };
}