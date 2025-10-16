// System Configuration Management Page
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Flag, 
  Gauge, 
  Plug, 
  Download, 
  Upload, 
  Search,
  Plus,
  RefreshCw
} from 'lucide-react';
import { useSystemConfig } from '@/hooks/use-system-config';
import { ConfigurationForm } from '@/components/admin/config/ConfigurationForm';
import { FeatureFlagManager } from '@/components/admin/config/FeatureFlagManager';
import { RateLimitManager } from '@/components/admin/config/RateLimitManager';
import { ApiIntegrationManager } from '@/components/admin/config/ApiIntegrationManager';
import { ConfigHistoryDialog } from '@/components/admin/config/ConfigHistoryDialog';
import { ImportConfigDialog } from '@/components/admin/config/ImportConfigDialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function SystemConfigPage() {
  const {
    configs,
    featureFlags,
    rateLimits,
    apiIntegrations,
    loading,
    error,
    loadAllData,
    exportConfiguration
  } = useSystemConfig();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('configs');
  const [showImportDialog, setShowImportDialog] = useState(false);

  const handleExport = async () => {
    try {
      await exportConfiguration();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      await loadAllData();
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  if (loading && configs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Configuration</h1>
          <p className="text-muted-foreground">
            Manage system settings, feature flags, rate limits, and API integrations
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowImportDialog(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search configurations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configurations</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{configs.length}</div>
            <p className="text-xs text-muted-foreground">
              {configs.filter(c => c.is_sensitive).length} sensitive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feature Flags</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{featureFlags.length}</div>
            <p className="text-xs text-muted-foreground">
              {featureFlags.filter(f => f.is_enabled).length} enabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Limits</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rateLimits.length}</div>
            <p className="text-xs text-muted-foreground">
              {rateLimits.filter(r => r.is_enabled).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Integrations</CardTitle>
            <Plug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiIntegrations.length}</div>
            <p className="text-xs text-muted-foreground">
              {apiIntegrations.filter(i => i.health_status === 'healthy').length} healthy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configs" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurations
          </TabsTrigger>
          <TabsTrigger value="flags" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Feature Flags
          </TabsTrigger>
          <TabsTrigger value="limits" className="flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Rate Limits
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Plug className="h-4 w-4" />
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configs" className="space-y-4">
          <ConfigurationForm searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="flags" className="space-y-4">
          <FeatureFlagManager searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="limits" className="space-y-4">
          <RateLimitManager searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <ApiIntegrationManager searchQuery={searchQuery} />
        </TabsContent>
      </Tabs>

      {/* Import Dialog */}
      <ImportConfigDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
      />
    </div>
  );
}