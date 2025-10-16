// Configuration management form component
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Edit, 
  Trash2, 
  History, 
  MoreHorizontal, 
  Eye, 
  EyeOff,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';
import { useSystemConfig } from '@/hooks/use-system-config';
import { ConfigHistoryDialog } from './ConfigHistoryDialog';
import type { AdminConfig, CreateConfigRequest, UpdateConfigRequest } from '@/lib/admin/types/config-types';

interface ConfigurationFormProps {
  searchQuery: string;
}

export function ConfigurationForm({ searchQuery }: ConfigurationFormProps) {
  const {
    configs,
    loading,
    createConfig,
    updateConfig,
    deleteConfig,
    loadConfigHistory
  } = useSystemConfig();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AdminConfig | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedConfigKey, setSelectedConfigKey] = useState<string>('');
  const [showSensitiveValues, setShowSensitiveValues] = useState<Record<string, boolean>>({});

  // Form state
  const [formData, setFormData] = useState<CreateConfigRequest>({
    key: '',
    value: '',
    description: '',
    config_type: 'string',
    is_sensitive: false
  });

  // Filter configs based on search query
  const filteredConfigs = useMemo(() => {
    if (!searchQuery) return configs;
    
    return configs.filter(config =>
      config.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      config.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [configs, searchQuery]);

  const resetForm = () => {
    setFormData({
      key: '',
      value: '',
      description: '',
      config_type: 'string',
      is_sensitive: false
    });
    setEditingConfig(null);
  };

  const handleCreate = async () => {
    try {
      await createConfig(formData);
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create config:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingConfig) return;

    try {
      await updateConfig(editingConfig.key, {
        value: formData.value,
        description: formData.description
      });
      setEditingConfig(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update config:', error);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Are you sure you want to delete configuration '${key}'?`)) return;

    try {
      await deleteConfig(key);
    } catch (error) {
      console.error('Failed to delete config:', error);
    }
  };

  const handleEdit = (config: AdminConfig) => {
    setEditingConfig(config);
    setFormData({
      key: config.key,
      value: config.value,
      description: config.description || '',
      config_type: config.config_type,
      is_sensitive: config.is_sensitive
    });
  };

  const handleShowHistory = async (key: string) => {
    setSelectedConfigKey(key);
    await loadConfigHistory(key);
    setShowHistoryDialog(true);
  };

  const toggleSensitiveValue = (key: string) => {
    setShowSensitiveValues(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const formatValue = (config: AdminConfig) => {
    if (config.is_sensitive && !showSensitiveValues[config.key]) {
      return '••••••••';
    }

    switch (config.config_type) {
      case 'boolean':
        return config.value ? 'true' : 'false';
      case 'array':
      case 'json':
        return JSON.stringify(config.value);
      default:
        return String(config.value);
    }
  };

  const getTypeColor = (type: AdminConfig['config_type']) => {
    switch (type) {
      case 'string': return 'bg-blue-100 text-blue-800';
      case 'number': return 'bg-green-100 text-green-800';
      case 'boolean': return 'bg-purple-100 text-purple-800';
      case 'array': return 'bg-orange-100 text-orange-800';
      case 'json': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">System Configurations</h2>
          <p className="text-sm text-muted-foreground">
            Manage application-wide configuration settings
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Configuration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Configuration</DialogTitle>
              <DialogDescription>
                Add a new system configuration setting
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="key">Key</Label>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                  placeholder="e.g., app.max_file_size_mb"
                />
              </div>
              
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.config_type}
                  onValueChange={(value: AdminConfig['config_type']) => 
                    setFormData(prev => ({ ...prev, config_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="array">Array</SelectItem>
                    <SelectItem value="json">JSON Object</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="value">Value</Label>
                {formData.config_type === 'boolean' ? (
                  <div className="flex items-center space-x-2 mt-2">
                    <Switch
                      checked={formData.value === true || formData.value === 'true'}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, value: checked }))
                      }
                    />
                    <Label>Enabled</Label>
                  </div>
                ) : (
                  <Textarea
                    id="value"
                    value={typeof formData.value === 'object' ? JSON.stringify(formData.value, null, 2) : formData.value}
                    onChange={(e) => {
                      let value: any = e.target.value;
                      
                      // Parse based on type
                      if (formData.config_type === 'number') {
                        value = parseFloat(value) || 0;
                      } else if (formData.config_type === 'array' || formData.config_type === 'json') {
                        try {
                          value = JSON.parse(value);
                        } catch {
                          // Keep as string if invalid JSON
                        }
                      }
                      
                      setFormData(prev => ({ ...prev, value }));
                    }}
                    placeholder="Enter configuration value"
                    rows={formData.config_type === 'array' || formData.config_type === 'json' ? 4 : 2}
                  />
                )}
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this setting"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_sensitive}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, is_sensitive: checked }))
                  }
                />
                <Label>Sensitive (hide value by default)</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!formData.key || formData.value === ''}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Configurations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Configurations ({filteredConfigs.length})</CardTitle>
          <CardDescription>
            System-wide configuration settings and their current values
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConfigs.map((config) => (
                <TableRow key={config.key}>
                  <TableCell className="font-mono text-sm">
                    <div className="flex items-center gap-2">
                      {config.key}
                      {config.is_sensitive && (
                        <Badge variant="secondary" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Sensitive
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(config.config_type)}>
                      {config.config_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded truncate">
                        {formatValue(config)}
                      </code>
                      {config.is_sensitive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSensitiveValue(config.key)}
                        >
                          {showSensitiveValues[config.key] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {config.description || '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(config.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(config)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShowHistory(config.key)}>
                          <History className="h-4 w-4 mr-2" />
                          History
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(config.key)}
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
          
          {filteredConfigs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No configurations match your search' : 'No configurations found'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingConfig} onOpenChange={(open) => !open && setEditingConfig(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Configuration</DialogTitle>
            <DialogDescription>
              Update the configuration value and description
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Key</Label>
              <Input value={formData.key} disabled className="bg-muted" />
            </div>
            
            <div>
              <Label>Type</Label>
              <Input value={formData.config_type} disabled className="bg-muted" />
            </div>
            
            <div>
              <Label htmlFor="edit-value">Value</Label>
              {formData.config_type === 'boolean' ? (
                <div className="flex items-center space-x-2 mt-2">
                  <Switch
                    checked={formData.value === true || formData.value === 'true'}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, value: checked }))
                    }
                  />
                  <Label>Enabled</Label>
                </div>
              ) : (
                <Textarea
                  id="edit-value"
                  value={typeof formData.value === 'object' ? JSON.stringify(formData.value, null, 2) : formData.value}
                  onChange={(e) => {
                    let value: any = e.target.value;
                    
                    // Parse based on type
                    if (formData.config_type === 'number') {
                      value = parseFloat(value) || 0;
                    } else if (formData.config_type === 'array' || formData.config_type === 'json') {
                      try {
                        value = JSON.parse(value);
                      } catch {
                        // Keep as string if invalid JSON
                      }
                    }
                    
                    setFormData(prev => ({ ...prev, value }));
                  }}
                  rows={formData.config_type === 'array' || formData.config_type === 'json' ? 4 : 2}
                />
              )}
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this setting"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingConfig(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <ConfigHistoryDialog
        open={showHistoryDialog}
        onOpenChange={setShowHistoryDialog}
        configKey={selectedConfigKey}
      />
    </div>
  );
}