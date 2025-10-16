// Rate limit management component
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Gauge,
  Clock,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { useSystemConfig } from '@/hooks/use-system-config';
import type { RateLimitConfig, CreateRateLimitRequest, UpdateRateLimitRequest } from '@/lib/admin/types/config-types';

interface RateLimitManagerProps {
  searchQuery: string;
}

export function RateLimitManager({ searchQuery }: RateLimitManagerProps) {
  const {
    rateLimits,
    loading,
    createRateLimit,
    updateRateLimit,
    deleteRateLimit
  } = useSystemConfig();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingLimit, setEditingLimit] = useState<RateLimitConfig | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateRateLimitRequest>({
    endpoint_pattern: '',
    requests_per_minute: 60,
    requests_per_hour: 1000,
    requests_per_day: 10000,
    burst_limit: 10,
    is_enabled: true,
    applies_to_roles: ['user']
  });

  // Filter rate limits based on search query
  const filteredLimits = useMemo(() => {
    if (!searchQuery) return rateLimits;
    
    return rateLimits.filter(limit =>
      limit.endpoint_pattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
      limit.applies_to_roles.some(role => role.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [rateLimits, searchQuery]);

  const resetForm = () => {
    setFormData({
      endpoint_pattern: '',
      requests_per_minute: 60,
      requests_per_hour: 1000,
      requests_per_day: 10000,
      burst_limit: 10,
      is_enabled: true,
      applies_to_roles: ['user']
    });
    setEditingLimit(null);
  };

  const handleCreate = async () => {
    try {
      await createRateLimit(formData);
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create rate limit:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingLimit) return;

    try {
      const updateData: UpdateRateLimitRequest = {
        requests_per_minute: formData.requests_per_minute,
        requests_per_hour: formData.requests_per_hour,
        requests_per_day: formData.requests_per_day,
        burst_limit: formData.burst_limit,
        is_enabled: formData.is_enabled,
        applies_to_roles: formData.applies_to_roles
      };

      await updateRateLimit(editingLimit.endpoint_pattern, updateData);
      setEditingLimit(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update rate limit:', error);
    }
  };

  const handleDelete = async (endpointPattern: string) => {
    if (!confirm(`Are you sure you want to delete rate limit for '${endpointPattern}'?`)) return;

    try {
      await deleteRateLimit(endpointPattern);
    } catch (error) {
      console.error('Failed to delete rate limit:', error);
    }
  };

  const handleEdit = (limit: RateLimitConfig) => {
    setEditingLimit(limit);
    setFormData({
      endpoint_pattern: limit.endpoint_pattern,
      requests_per_minute: limit.requests_per_minute,
      requests_per_hour: limit.requests_per_hour,
      requests_per_day: limit.requests_per_day,
      burst_limit: limit.burst_limit,
      is_enabled: limit.is_enabled,
      applies_to_roles: limit.applies_to_roles
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const getRateLimitSeverity = (limit: RateLimitConfig) => {
    const perMinute = limit.requests_per_minute;
    if (perMinute <= 10) return { color: 'bg-red-100 text-red-800', label: 'Strict' };
    if (perMinute <= 60) return { color: 'bg-yellow-100 text-yellow-800', label: 'Moderate' };
    return { color: 'bg-green-100 text-green-800', label: 'Lenient' };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Rate Limits</h2>
          <p className="text-sm text-muted-foreground">
            Configure API rate limiting rules to prevent abuse and ensure fair usage
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rate Limit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Rate Limit</DialogTitle>
              <DialogDescription>
                Add a new rate limiting rule for API endpoints
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="endpoint-pattern">Endpoint Pattern</Label>
                <Input
                  id="endpoint-pattern"
                  value={formData.endpoint_pattern}
                  onChange={(e) => setFormData(prev => ({ ...prev, endpoint_pattern: e.target.value }))}
                  placeholder="e.g., /api/generate/* or /api/upload/*"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use * for wildcards. Examples: /api/*, /api/generate/*, /api/users/:id
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="per-minute">Requests per Minute</Label>
                  <Input
                    id="per-minute"
                    type="number"
                    value={formData.requests_per_minute}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      requests_per_minute: parseInt(e.target.value) || 0 
                    }))}
                    min="1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="burst-limit">Burst Limit</Label>
                  <Input
                    id="burst-limit"
                    type="number"
                    value={formData.burst_limit}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      burst_limit: parseInt(e.target.value) || 0 
                    }))}
                    min="1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="per-hour">Requests per Hour</Label>
                  <Input
                    id="per-hour"
                    type="number"
                    value={formData.requests_per_hour}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      requests_per_hour: parseInt(e.target.value) || 0 
                    }))}
                    min="1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="per-day">Requests per Day</Label>
                  <Input
                    id="per-day"
                    type="number"
                    value={formData.requests_per_day}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      requests_per_day: parseInt(e.target.value) || 0 
                    }))}
                    min="1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="roles">Applies to Roles</Label>
                <Input
                  id="roles"
                  value={formData.applies_to_roles.join(', ')}
                  onChange={(e) => 
                    setFormData(prev => ({ 
                      ...prev, 
                      applies_to_roles: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }))
                  }
                  placeholder="user, premium_user, admin"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Comma-separated list of user roles this limit applies to
                </p>
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
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!formData.endpoint_pattern}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rate Limits Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limits ({filteredLimits.length})</CardTitle>
          <CardDescription>
            API endpoint rate limiting configurations and their current settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint Pattern</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Limits</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Applies To</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLimits.map((limit) => {
                const severity = getRateLimitSeverity(limit);
                return (
                  <TableRow key={limit.endpoint_pattern}>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-muted-foreground" />
                        {limit.endpoint_pattern}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={limit.is_enabled ? 'default' : 'secondary'}>
                        {limit.is_enabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {formatNumber(limit.requests_per_minute)}/min
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {formatNumber(limit.requests_per_hour)}/hr
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {formatNumber(limit.requests_per_day)}/day
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <AlertTriangle className="h-3 w-3" />
                          Burst: {limit.burst_limit}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={severity.color}>
                        {severity.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {limit.applies_to_roles.map(role => (
                          <Badge key={role} variant="outline" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(limit.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(limit)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(limit.endpoint_pattern)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredLimits.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No rate limits match your search' : 'No rate limits configured'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingLimit} onOpenChange={(open) => !open && setEditingLimit(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Rate Limit</DialogTitle>
            <DialogDescription>
              Update the rate limiting configuration
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Endpoint Pattern</Label>
              <Input value={formData.endpoint_pattern} disabled className="bg-muted" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-per-minute">Requests per Minute</Label>
                <Input
                  id="edit-per-minute"
                  type="number"
                  value={formData.requests_per_minute}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    requests_per_minute: parseInt(e.target.value) || 0 
                  }))}
                  min="1"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-burst-limit">Burst Limit</Label>
                <Input
                  id="edit-burst-limit"
                  type="number"
                  value={formData.burst_limit}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    burst_limit: parseInt(e.target.value) || 0 
                  }))}
                  min="1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-per-hour">Requests per Hour</Label>
                <Input
                  id="edit-per-hour"
                  type="number"
                  value={formData.requests_per_hour}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    requests_per_hour: parseInt(e.target.value) || 0 
                  }))}
                  min="1"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-per-day">Requests per Day</Label>
                <Input
                  id="edit-per-day"
                  type="number"
                  value={formData.requests_per_day}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    requests_per_day: parseInt(e.target.value) || 0 
                  }))}
                  min="1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-roles">Applies to Roles</Label>
              <Input
                id="edit-roles"
                value={formData.applies_to_roles.join(', ')}
                onChange={(e) => 
                  setFormData(prev => ({ 
                    ...prev, 
                    applies_to_roles: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }))
                }
                placeholder="user, premium_user, admin"
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
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLimit(null)}>
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