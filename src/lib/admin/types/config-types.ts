// System configuration types for admin management

export interface AdminConfig {
  key: string;
  value: any;
  description?: string;
  config_type: 'string' | 'number' | 'boolean' | 'json' | 'array';
  is_sensitive: boolean;
  validation_schema?: any;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminConfigHistory {
  id: string;
  config_key: string;
  old_value?: any;
  new_value: any;
  changed_by?: string;
  change_reason?: string;
  created_at: string;
}

export interface FeatureFlag {
  flag_name: string;
  is_enabled: boolean;
  description?: string;
  target_audience: {
    type: 'all' | 'percentage' | 'user_list' | 'role_based';
  };
  rollout_percentage: number;
  enabled_for_users: string[];
  enabled_for_roles: string[];
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface RateLimitConfig {
  endpoint_pattern: string;
  requests_per_minute: number;
  requests_per_hour: number;
  requests_per_day: number;
  burst_limit: number;
  is_enabled: boolean;
  applies_to_roles: string[];
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiIntegration {
  id: string;
  service_name: string;
  api_key_encrypted?: string;
  endpoint_url?: string;
  configuration: Record<string, any>;
  is_active: boolean;
  last_health_check?: string;
  health_status: 'healthy' | 'degraded' | 'down' | 'unknown';
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

// Request/Response types for API
export interface CreateConfigRequest {
  key: string;
  value: any;
  description?: string;
  config_type: AdminConfig['config_type'];
  is_sensitive?: boolean;
  validation_schema?: any;
}

export interface UpdateConfigRequest {
  value: any;
  description?: string;
  change_reason?: string;
}

export interface CreateFeatureFlagRequest {
  flag_name: string;
  is_enabled: boolean;
  description?: string;
  target_audience?: FeatureFlag['target_audience'];
  rollout_percentage?: number;
  enabled_for_users?: string[];
  enabled_for_roles?: string[];
}

export interface UpdateFeatureFlagRequest {
  is_enabled?: boolean;
  description?: string;
  target_audience?: FeatureFlag['target_audience'];
  rollout_percentage?: number;
  enabled_for_users?: string[];
  enabled_for_roles?: string[];
}

export interface CreateRateLimitRequest {
  endpoint_pattern: string;
  requests_per_minute: number;
  requests_per_hour: number;
  requests_per_day: number;
  burst_limit?: number;
  is_enabled?: boolean;
  applies_to_roles?: string[];
}

export interface UpdateRateLimitRequest {
  requests_per_minute?: number;
  requests_per_hour?: number;
  requests_per_day?: number;
  burst_limit?: number;
  is_enabled?: boolean;
  applies_to_roles?: string[];
}

export interface CreateApiIntegrationRequest {
  service_name: string;
  api_key?: string;
  endpoint_url?: string;
  configuration?: Record<string, any>;
  is_active?: boolean;
}

export interface UpdateApiIntegrationRequest {
  api_key?: string;
  endpoint_url?: string;
  configuration?: Record<string, any>;
  is_active?: boolean;
}

export interface ConfigValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: ConfigValidationError[];
}

// Configuration categories for UI organization
export interface ConfigCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  configs: AdminConfig[];
}

export interface SystemConfigState {
  configs: AdminConfig[];
  featureFlags: FeatureFlag[];
  rateLimits: RateLimitConfig[];
  apiIntegrations: ApiIntegration[];
  configHistory: AdminConfigHistory[];
  loading: boolean;
  error: string | null;
}

// Rollback functionality
export interface ConfigRollbackRequest {
  config_key: string;
  target_history_id: string;
  reason?: string;
}

// Health check results for integrations
export interface IntegrationHealthCheck {
  service_name: string;
  status: ApiIntegration['health_status'];
  response_time_ms?: number;
  last_checked: string;
  error_message?: string;
}

// Bulk operations
export interface BulkConfigOperation {
  operation: 'update' | 'delete' | 'toggle';
  configs: Array<{
    key: string;
    value?: any;
  }>;
}

export interface BulkFeatureFlagOperation {
  operation: 'enable' | 'disable' | 'delete';
  flags: string[];
}

// Export/Import functionality
export interface ConfigExport {
  configs: AdminConfig[];
  feature_flags: FeatureFlag[];
  rate_limits: RateLimitConfig[];
  exported_at: string;
  exported_by: string;
}

export interface ConfigImportRequest {
  configs?: Partial<AdminConfig>[];
  feature_flags?: Partial<FeatureFlag>[];
  rate_limits?: Partial<RateLimitConfig>[];
  overwrite_existing?: boolean;
}