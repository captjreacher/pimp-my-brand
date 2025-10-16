// API integration management component
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Plug,
  CheckCircle,
  XCircle,
  AlertCircle,
  HelpCircle,
  Activity,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { useSystemConfig } from '@/hooks/use-system-config';
import type { ApiIntegration, CreateApiIntegrationRequest, UpdateApiIntegrationRequest } from '@/lib/admin/types/config-types';

interface ApiIntegrationManagerProps {
  searchQuery: string;
}

export function ApiIntegrationManager({ searchQuery }: ApiIntegrationManagerProps) {
  const {
    apiIntegrations,
    loading,
    createApiIntegration,
    updateApiIntegration,
    deleteApiIntegration,
    testApiIntegration
  } = useSystemConfig();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<ApiIntegration | null>(null);
  const [testingIntegrations, setTestingIntegrations] = useState<Set<string>>(new Set());
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});

  // Form state
  const [formData, setFormData] = useState<CreateApiIntegrationRequest>({
    service_name: '',
    api_key: '',
    endpoint_url: '',
    configuration: {},
    is_active: true
  });

  // Filter integrations based on search query
  const filteredIntegrations = useMemo(() => {
    if (!searchQuery) return apiIntegrations;
    
    return apiIntegrations.filter(integration =>
      integration.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.endpoint_url?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [apiIntegrations, searchQuery]);

  const resetForm = () => {
    setFormData({
      service_name: '',
      api_key: '',
      endpoint_url: '',
      configuration: {},
      is_active: true
    });
    setEditingIntegration(null);
  };

  const handleCreate = async () => {
    try {
      await createApiIntegration(formData);
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create API integration:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingIntegration) return;

    try {
      const updateData: UpdateApiIntegrationRequest = {
        api_key: formData.api_key || undefined,
        endpoint_url: formData.endpoint_url,
        configuration: formData.configuration,
        is_active: formData.is_active
      };

      await updateApiIntegration(editingIntegration.service_name, updateData);
      setEditingIntegration(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update API integration:', error);
    }
  };

  const handleDelete = async (serviceName: string) => {
    if (!confirm(`Are you sure you want to delete integration '${serviceName}'?`)) return;

    try {
      await deleteApiIntegration(serviceName);
    } catch (error) {
      console.error('Failed to delete API integration:', error);
    }
  };

  const handleEdit = (integration: ApiIntegration) => {
    setEditingIntegration(integration);
    setFormData({
      service_name: integration.service_name,
      api_key: '', // Don't pre-fill API key for security
      endpoint_url: integration.endpoint_url || '',
      configuration: integration.configuration,
      is_active: integration.is_active
    });
  };

  const handleTest = async (serviceName: string) => {
    setTestingIntegrations(prev => new Set(prev).add(serviceName));
    
    try {
      await testApiIntegration(serviceName);
    } catch (error) {
      console.error('Failed to test API integration:', error);
    } finally {
      setTestingIntegrations(prev => {
        const newSet = new Set(prev);
        newSet.delete(serviceName);
        return newSet;
      });
    }
  };

  const toggleApiKeyVisibility = (serviceName: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [serviceName]: !prev[serviceName]
    }));
  };

  const getHealthStatusIcon = (status: ApiIntegration['health_status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHealthStatusColor = (status: ApiIntegration['health_status']) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'degraded': return 'bg-yellow-100 text-yellow-800';
      case 'down': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatConfiguration = (config: Record<string, any>) => {
    if (!config || Object.keys(config).length === 0) return 'None';
    
    return Object.entries(config)
      .slice(0, 3) // Show first 3 config items
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ') + (Object.keys(config).length > 3 ? '...' : '');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">API Integrations</h2>
          <p className="text-sm text-muted-foreground">
            Manage third-party API integrations and their configurations
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create API Integration</DialogTitle>
              <DialogDescription>
                Add a new third-party API integration
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="service-name">Service Name</Label>
                <Input
                  id="service-name"
                  value={formData.service_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, service_name: e.target.value }))}
                  placeholder="e.g., openai, stripe, sendgrid"
                />
              </div>
              
              <div>
                <Label htmlFor="endpoint-url">Endpoint URL</Label>
                <Input
                  id="endpoint-url"
                  value={formData.endpoint_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, endpoint_url: e.target.value }))}
                  placeholder="https://api.example.com/v1"
                />
              </div>
              
              <div>
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                  placeholder="Enter API key (optional)"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  API key will be encrypted and stored securely
                </p>
              </div>
              
              <div>
                <Label htmlFor="configuration">Configuration (JSON)</Label>
                <Textarea
                  id="configuration"
                  value={JSON.stringify(formData.configuration, null, 2)}
                  onChange={(e) => {
                    try {
                      const config = JSON.parse(e.target.value);
                      setFormData(prev => ({ ...prev, configuration: config }));
                    } catch {
                      // Keep the text as-is if invalid JSON
                    }
                  }}
                  placeholder='{"timeout": 30000, "retries": 3}'
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Additional configuration options in JSON format
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, is_active: checked }))
                  }
                />
                <Label>Active</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!formData.service_name}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* API Integrations Table */}
      <Card>
        <CardHeader>
          <CardTitle>API Integrations ({filteredIntegrations.length})</CardTitle>
          <CardDescription>
            Third-party API integrations and their health status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Configuration</TableHead>
                <TableHead>Last Check</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIntegrations.map((integration) => (
                <TableRow key={integration.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Plug className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{integration.service_name}</div>
                        {integration.api_key_encrypted && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Key className="h-3 w-3" />
                            API Key configured
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={integration.is_active ? 'default' : 'secondary'}>
                      {integration.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getHealthStatusIcon(integration.health_status)}
                      <Badge className={getHealthStatusColor(integration.health_status)}>
                        {integration.health_status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {integration.endpoint_url || '-'}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm">
                    <code className="bg-muted px-1 py-0.5 rounded text-xs">
                      {formatConfiguration(integration.configuration)}
                    </code>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {integration.last_health_check 
                      ? new Date(integration.last_health_check).toLocaleString()
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(integration)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleTest(integration.service_name)}
                          disabled={testingIntegrations.has(integration.service_name)}
                        >
                          <Activity className="h-4 w-4 mr-2" />
                          {testingIntegrations.has(integration.service_name) ? 'Testing...' : 'Test Health'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(integration.service_name)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredIntegrations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No integrations match your search' : 'No API integrations configured'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingIntegration} onOpenChange={(open) => !open && setEditingIntegration(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit API Integration</DialogTitle>
            <DialogDescription>
              Update the API integration configuration
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Service Name</Label>
              <Input value={formData.service_name} disabled className="bg-muted" />
            </div>
            
            <div>
              <Label htmlFor="edit-endpoint-url">Endpoint URL</Label>
              <Input
                id="edit-endpoint-url"
                value={formData.endpoint_url}
                onChange={(e) => setFormData(prev => ({ ...prev, endpoint_url: e.target.value }))}
                placeholder="https://api.example.com/v1"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-api-key">API Key</Label>
              <Input
                id="edit-api-key"
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                placeholder="Enter new API key (leave empty to keep current)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to keep the current API key unchanged
              </p>
            </div>
            
            <div>
              <Label htmlFor="edit-configuration">Configuration (JSON)</Label>
              <Textarea
                id="edit-configuration"
                value={JSON.stringify(formData.configuration, null, 2)}
                onChange={(e) => {
                  try {
                    const config = JSON.parse(e.target.value);
                    setFormData(prev => ({ ...prev, configuration: config }));
                  } catch {
                    // Keep the text as-is if invalid JSON
                  }
                }}
                rows={4}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, is_active: checked }))
                }
              />
              <Label>Active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingIntegration(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}