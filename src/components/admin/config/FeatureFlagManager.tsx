// Feature flag management component
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
import { Slider } from '@/components/ui/slider';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Flag,
  Users,
  Percent,
  UserCheck,
  Shield
} from 'lucide-react';
import { useSystemConfig } from '@/hooks/use-system-config';
import type { FeatureFlag, CreateFeatureFlagRequest, UpdateFeatureFlagRequest } from '@/lib/admin/types/config-types';

interface FeatureFlagManagerProps {
  searchQuery: string;
}

export function FeatureFlagManager({ searchQuery }: FeatureFlagManagerProps) {
  const {
    featureFlags,
    loading,
    createFeatureFlag,
    updateFeatureFlag,
    toggleFeatureFlag,
    deleteFeatureFlag,
    bulkToggleFeatureFlags
  } = useSystemConfig();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [selectedFlags, setSelectedFlags] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState<CreateFeatureFlagRequest>({
    flag_name: '',
    is_enabled: false,
    description: '',
    target_audience: { type: 'all' },
    rollout_percentage: 0,
    enabled_for_users: [],
    enabled_for_roles: []
  });

  // Filter flags based on search query
  const filteredFlags = useMemo(() => {
    if (!searchQuery) return featureFlags;
    
    return featureFlags.filter(flag =>
      flag.flag_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [featureFlags, searchQuery]);

  const resetForm = () => {
    setFormData({
      flag_name: '',
      is_enabled: false,
      description: '',
      target_audience: { type: 'all' },
      rollout_percentage: 0,
      enabled_for_users: [],
      enabled_for_roles: []
    });
    setEditingFlag(null);
  };

  const handleCreate = async () => {
    try {
      await createFeatureFlag(formData);
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create feature flag:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingFlag) return;

    try {
      const updateData: UpdateFeatureFlagRequest = {
        is_enabled: formData.is_enabled,
        description: formData.description,
        target_audience: formData.target_audience,
        rollout_percentage: formData.rollout_percentage,
        enabled_for_users: formData.enabled_for_users,
        enabled_for_roles: formData.enabled_for_roles
      };

      await updateFeatureFlag(editingFlag.flag_name, updateData);
      setEditingFlag(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update feature flag:', error);
    }
  };

  const handleToggle = async (flagName: string) => {
    try {
      await toggleFeatureFlag(flagName);
    } catch (error) {
      console.error('Failed to toggle feature flag:', error);
    }
  };

  const handleDelete = async (flagName: string) => {
    if (!confirm(`Are you sure you want to delete feature flag '${flagName}'?`)) return;

    try {
      await deleteFeatureFlag(flagName);
    } catch (error) {
      console.error('Failed to delete feature flag:', error);
    }
  };

  const handleEdit = (flag: FeatureFlag) => {
    setEditingFlag(flag);
    setFormData({
      flag_name: flag.flag_name,
      is_enabled: flag.is_enabled,
      description: flag.description || '',
      target_audience: flag.target_audience,
      rollout_percentage: flag.rollout_percentage,
      enabled_for_users: flag.enabled_for_users,
      enabled_for_roles: flag.enabled_for_roles
    });
  };

  const handleBulkToggle = async () => {
    if (selectedFlags.length === 0) return;

    try {
      await bulkToggleFeatureFlags(selectedFlags);
      setSelectedFlags([]);
    } catch (error) {
      console.error('Failed to bulk toggle feature flags:', error);
    }
  };

  const handleSelectFlag = (flagName: string, selected: boolean) => {
    if (selected) {
      setSelectedFlags(prev => [...prev, flagName]);
    } else {
      setSelectedFlags(prev => prev.filter(name => name !== flagName));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedFlags(filteredFlags.map(flag => flag.flag_name));
    } else {
      setSelectedFlags([]);
    }
  };

  const getAudienceIcon = (type: string) => {
    switch (type) {
      case 'all': return <Users className="h-4 w-4" />;
      case 'percentage': return <Percent className="h-4 w-4" />;
      case 'user_list': return <UserCheck className="h-4 w-4" />;
      case 'role_based': return <Shield className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getAudienceDescription = (flag: FeatureFlag) => {
    switch (flag.target_audience.type) {
      case 'all':
        return 'All users';
      case 'percentage':
        return `${flag.rollout_percentage}% of users`;
      case 'user_list':
        return `${flag.enabled_for_users.length} specific users`;
      case 'role_based':
        return `Users with roles: ${flag.enabled_for_roles.join(', ')}`;
      default:
        return 'Unknown audience';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Feature Flags</h2>
          <p className="text-sm text-muted-foreground">
            Control feature availability and rollout to different user groups
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedFlags.length > 0 && (
            <Button variant="outline" onClick={handleBulkToggle}>
              Toggle Selected ({selectedFlags.length})
            </Button>
          )}
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Feature Flag
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Feature Flag</DialogTitle>
                <DialogDescription>
                  Add a new feature flag to control feature availability
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="flag-name">Flag Name</Label>
                  <Input
                    id="flag-name"
                    value={formData.flag_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, flag_name: e.target.value }))}
                    placeholder="e.g., new_dashboard_ui"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this feature"
                    rows={2}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_enabled}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, is_enabled: checked }))
                    }
                  />
                  <Label>Enabled</Label>
                </div>
                
                <div>
                  <Label>Target Audience</Label>
                  <Select
                    value={formData.target_audience.type}
                    onValueChange={(value: 'all' | 'percentage' | 'user_list' | 'role_based') => 
                      setFormData(prev => ({ 
                        ...prev, 
                        target_audience: { type: value },
                        rollout_percentage: value === 'percentage' ? 10 : 0
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="percentage">Percentage Rollout</SelectItem>
                      <SelectItem value="user_list">Specific Users</SelectItem>
                      <SelectItem value="role_based">Role-Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.target_audience.type === 'percentage' && (
                  <div>
                    <Label>Rollout Percentage: {formData.rollout_percentage}%</Label>
                    <Slider
                      value={[formData.rollout_percentage]}
                      onValueChange={([value]) => 
                        setFormData(prev => ({ ...prev, rollout_percentage: value }))
                      }
                      max={100}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                )}
                
                {formData.target_audience.type === 'role_based' && (
                  <div>
                    <Label>Enabled for Roles</Label>
                    <Input
                      value={formData.enabled_for_roles.join(', ')}
                      onChange={(e) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          enabled_for_roles: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        }))
                      }
                      placeholder="admin, moderator, premium_user"
                    />
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!formData.flag_name}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Feature Flags Table */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags ({filteredFlags.length})</CardTitle>
          <CardDescription>
            Control feature availability and manage rollout strategies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <input
                    type="checkbox"
                    checked={selectedFlags.length === filteredFlags.length && filteredFlags.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableHead>
                <TableHead>Flag Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Target Audience</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFlags.map((flag) => (
                <TableRow key={flag.flag_name}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedFlags.includes(flag.flag_name)}
                      onChange={(e) => handleSelectFlag(flag.flag_name, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-muted-foreground" />
                      {flag.flag_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={flag.is_enabled}
                        onCheckedChange={() => handleToggle(flag.flag_name)}
                        size="sm"
                      />
                      <Badge variant={flag.is_enabled ? 'default' : 'secondary'}>
                        {flag.is_enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getAudienceIcon(flag.target_audience.type)}
                      <span className="text-sm">{getAudienceDescription(flag)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {flag.description || '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(flag.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(flag)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggle(flag.flag_name)}>
                          <Flag className="h-4 w-4 mr-2" />
                          {flag.is_enabled ? 'Disable' : 'Enable'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(flag.flag_name)}
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
          
          {filteredFlags.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No feature flags match your search' : 'No feature flags found'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingFlag} onOpenChange={(open) => !open && setEditingFlag(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Feature Flag</DialogTitle>
            <DialogDescription>
              Update the feature flag configuration
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Flag Name</Label>
              <Input value={formData.flag_name} disabled className="bg-muted" />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this feature"
                rows={2}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_enabled}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, is_enabled: checked }))
                }
              />
              <Label>Enabled</Label>
            </div>
            
            <div>
              <Label>Target Audience</Label>
              <Select
                value={formData.target_audience.type}
                onValueChange={(value: 'all' | 'percentage' | 'user_list' | 'role_based') => 
                  setFormData(prev => ({ 
                    ...prev, 
                    target_audience: { type: value }
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="percentage">Percentage Rollout</SelectItem>
                  <SelectItem value="user_list">Specific Users</SelectItem>
                  <SelectItem value="role_based">Role-Based</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.target_audience.type === 'percentage' && (
              <div>
                <Label>Rollout Percentage: {formData.rollout_percentage}%</Label>
                <Slider
                  value={[formData.rollout_percentage]}
                  onValueChange={([value]) => 
                    setFormData(prev => ({ ...prev, rollout_percentage: value }))
                  }
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </div>
            )}
            
            {formData.target_audience.type === 'role_based' && (
              <div>
                <Label>Enabled for Roles</Label>
                <Input
                  value={formData.enabled_for_roles.join(', ')}
                  onChange={(e) => 
                    setFormData(prev => ({ 
                      ...prev, 
                      enabled_for_roles: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }))
                  }
                  placeholder="admin, moderator, premium_user"
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFlag(null)}>
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