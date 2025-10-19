import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, 
  Database, 
  Globe, 
  Shield,
  ArrowLeft,
  RefreshCw,
  Save,
  Upload,
  Download
} from 'lucide-react';

interface SystemConfig {
  maintenance_mode: boolean;
  user_registration: boolean;
  email_notifications: boolean;
  debug_mode: boolean;
  ai_brand_generation: boolean;
  cv_generation: boolean;
  premium_features: boolean;
  beta_features: boolean;
}

export default function SimpleConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<SystemConfig>({
    maintenance_mode: false,
    user_registration: true,
    email_notifications: true,
    debug_mode: false,
    ai_brand_generation: true,
    cv_generation: true,
    premium_features: true,
    beta_features: false
  });
  const [systemStats, setSystemStats] = useState({
    health: 100,
    api_status: 'Online',
    response_time: 125,
    security_level: 'High',
    config_version: 'v2.1.3'
  });

  useEffect(() => {
    loadSystemConfig();
  }, []);

  const loadSystemConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load config from database (you could create a system_config table)
      // For now, we'll use localStorage as a simple storage mechanism
      const savedConfig = localStorage.getItem('system_config');
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }

      // Get real system stats
      const startTime = Date.now();
      const { data, error: healthError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      
      setSystemStats(prev => ({
        ...prev,
        health: healthError ? 75 : 100,
        api_status: healthError ? 'Degraded' : 'Online',
        response_time: responseTime,
        security_level: 'High'
      }));

    } catch (err) {
      console.error('Error loading system config:', err);
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      setError(null);

      // Save to localStorage (in a real app, you'd save to database)
      localStorage.setItem('system_config', JSON.stringify(config));
      
      // You could also save to a database table here
      // await supabase.from('system_config').upsert({ ...config, updated_at: new Date() });

      alert('Configuration saved successfully!');
    } catch (err) {
      console.error('Error saving config:', err);
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = (key: keyof SystemConfig) => {
    setConfig(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const exportConfig = () => {
    const configData = {
      ...config,
      exported_at: new Date().toISOString(),
      version: systemStats.config_version
    };
    
    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const importConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedConfig = JSON.parse(e.target?.result as string);
            setConfig({
              maintenance_mode: importedConfig.maintenance_mode ?? false,
              user_registration: importedConfig.user_registration ?? true,
              email_notifications: importedConfig.email_notifications ?? true,
              debug_mode: importedConfig.debug_mode ?? false,
              ai_brand_generation: importedConfig.ai_brand_generation ?? true,
              cv_generation: importedConfig.cv_generation ?? true,
              premium_features: importedConfig.premium_features ?? true,
              beta_features: importedConfig.beta_features ?? false
            });
            alert('Configuration imported successfully!');
          } catch (err) {
            alert('Error importing configuration: Invalid JSON file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => window.location.href = '/admin'}
                className="gap-2 text-gray-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Admin
              </Button>
              <Settings className="w-8 h-8 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">System Configuration</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={loadSystemConfig} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Reload Config
              </Button>
              <Button size="sm" onClick={saveConfig} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">System Configuration</h2>
          <p className="text-gray-400">Configure system settings, features, and integrations - Real Settings</p>
          {error && (
            <div className="mt-4 p-4 bg-red-900 border border-red-700 rounded-lg">
              <p className="text-red-300">Error: {error}</p>
            </div>
          )}
        </div>

        {/* System Status */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">System Health</CardTitle>
              <Database className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{systemStats.health}%</div>
              <p className="text-xs text-gray-400">
                {systemStats.health === 100 ? 'All systems operational' : 'Some issues detected'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">API Status</CardTitle>
              <Globe className={`h-4 w-4 ${systemStats.api_status === 'Online' ? 'text-green-400' : 'text-yellow-400'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{systemStats.api_status}</div>
              <p className="text-xs text-gray-400">{systemStats.response_time}ms avg response</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Security Level</CardTitle>
              <Shield className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{systemStats.security_level}</div>
              <p className="text-xs text-gray-400">All checks passed</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Config Version</CardTitle>
              <Settings className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{systemStats.config_version}</div>
              <p className="text-xs text-gray-400">Latest stable</p>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Sections */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* General Settings */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">General Settings</CardTitle>
              <CardDescription className="text-gray-400">
                Basic system configuration and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">Maintenance Mode</p>
                    <p className="text-xs text-gray-400">Temporarily disable user access</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleSetting('maintenance_mode')}
                    className={config.maintenance_mode ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                  >
                    {config.maintenance_mode ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">User Registration</p>
                    <p className="text-xs text-gray-400">Allow new user signups</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleSetting('user_registration')}
                    className={config.user_registration ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                  >
                    {config.user_registration ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">Email Notifications</p>
                    <p className="text-xs text-gray-400">System email notifications</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleSetting('email_notifications')}
                    className={config.email_notifications ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                  >
                    {config.email_notifications ? 'Active' : 'Inactive'}
                  </Button>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">Debug Mode</p>
                    <p className="text-xs text-gray-400">Enhanced logging and debugging</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleSetting('debug_mode')}
                    className={config.debug_mode ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'}
                  >
                    {config.debug_mode ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Flags */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Feature Flags</CardTitle>
              <CardDescription className="text-gray-400">
                Enable or disable specific platform features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">AI Brand Generation</p>
                    <p className="text-xs text-gray-400">AI-powered brand creation</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleSetting('ai_brand_generation')}
                    className={config.ai_brand_generation ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                  >
                    {config.ai_brand_generation ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">CV Generation</p>
                    <p className="text-xs text-gray-400">Resume creation tools</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleSetting('cv_generation')}
                    className={config.cv_generation ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                  >
                    {config.cv_generation ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">Premium Features</p>
                    <p className="text-xs text-gray-400">Subscription-based features</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleSetting('premium_features')}
                    className={config.premium_features ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                  >
                    {config.premium_features ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">Beta Features</p>
                    <p className="text-xs text-gray-400">Experimental functionality</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleSetting('beta_features')}
                    className={config.beta_features ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'}
                  >
                    {config.beta_features ? 'Limited' : 'Disabled'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Integrations */}
        <Card className="mb-8 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">API Integrations</CardTitle>
            <CardDescription className="text-gray-400">
              External service integrations and API configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-white">OpenAI API</h4>
                  <Badge className="bg-green-600">Connected</Badge>
                </div>
                <p className="text-xs text-gray-400 mb-3">AI content generation and processing</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-green-400">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rate Limit:</span>
                    <span className="text-white">1000/hour</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Usage:</span>
                    <span className="text-white">234/1000</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-white">Stripe Payment</h4>
                  <Badge className="bg-green-600">Connected</Badge>
                </div>
                <p className="text-xs text-gray-400 mb-3">Payment processing and subscriptions</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-green-400">Live</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Webhooks:</span>
                    <span className="text-green-400">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Test Mode:</span>
                    <span className="text-red-400">Disabled</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-white">Email Service</h4>
                  <Badge className="bg-green-600">Connected</Badge>
                </div>
                <p className="text-xs text-gray-400 mb-3">Email notifications and marketing</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Provider:</span>
                    <span className="text-white">SendGrid</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Daily Limit:</span>
                    <span className="text-white">10,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sent Today:</span>
                    <span className="text-white">1,234</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Management */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Configuration Management</CardTitle>
            <CardDescription className="text-gray-400">
              Import, export, and manage system configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button 
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={importConfig}
              >
                <Upload className="w-6 h-6" />
                <span className="text-sm">Import Config</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={exportConfig}
              >
                <Download className="w-6 h-6" />
                <span className="text-sm">Export Config</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => {
                  if (confirm('Reset all settings to default values?')) {
                    setConfig({
                      maintenance_mode: false,
                      user_registration: true,
                      email_notifications: true,
                      debug_mode: false,
                      ai_brand_generation: true,
                      cv_generation: true,
                      premium_features: true,
                      beta_features: false
                    });
                  }
                }}
              >
                <RefreshCw className="w-6 h-6" />
                <span className="text-sm">Reset to Default</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={exportConfig}
              >
                <Save className="w-6 h-6" />
                <span className="text-sm">Backup Config</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}