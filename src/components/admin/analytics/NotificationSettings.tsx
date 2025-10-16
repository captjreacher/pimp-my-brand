import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Mail, 
  Webhook, 
  Settings, 
  Plus, 
  Trash2, 
  TestTube,
  Save,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useAlertThresholds } from '@/hooks/use-admin-notifications';
import type { AlertThreshold } from '@/lib/admin/types/analytics-types';

interface NotificationSettingsProps {
  className?: string;
}

const ThresholdForm: React.FC<{
  threshold?: AlertThreshold;
  onSave: (threshold: AlertThreshold) => void;
  onCancel: () => void;
}> = ({ threshold, onSave, onCancel }) => {
  const [formData, setFormData] = useState<AlertThreshold>(
    threshold || {
      metric_name: '',
      operator: 'gt',
      value: 0,
      severity: 'medium',
      enabled: true,
      notification_channels: ['in_app']
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const toggleChannel = (channel: string) => {
    setFormData(prev => ({
      ...prev,
      notification_channels: prev.notification_channels.includes(channel)
        ? prev.notification_channels.filter(c => c !== channel)
        : [...prev.notification_channels, channel]
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{threshold ? 'Edit' : 'Add'} Alert Threshold</CardTitle>
        <CardDescription>
          Configure when alerts should be triggered for system metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="metric_name">Metric Name</Label>
              <Select
                value={formData.metric_name}
                onValueChange={(value) => setFormData(prev => ({ ...prev, metric_name: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="error_rate">Error Rate (%)</SelectItem>
                  <SelectItem value="response_time">Response Time (ms)</SelectItem>
                  <SelectItem value="uptime_percentage">Uptime (%)</SelectItem>
                  <SelectItem value="pending_moderation">Pending Moderation</SelectItem>
                  <SelectItem value="active_users">Active Users</SelectItem>
                  <SelectItem value="storage_usage">Storage Usage (bytes)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="operator">Condition</Label>
              <Select
                value={formData.operator}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, operator: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gt">Greater than</SelectItem>
                  <SelectItem value="gte">Greater than or equal</SelectItem>
                  <SelectItem value="lt">Less than</SelectItem>
                  <SelectItem value="lte">Less than or equal</SelectItem>
                  <SelectItem value="eq">Equal to</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Threshold Value</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select
                value={formData.severity}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, severity: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notification Channels</Label>
            <div className="flex flex-wrap gap-2">
              {['email', 'webhook', 'in_app'].map(channel => (
                <Badge
                  key={channel}
                  variant={formData.notification_channels.includes(channel) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleChannel(channel)}
                >
                  {channel === 'email' && <Mail className="h-3 w-3 mr-1" />}
                  {channel === 'webhook' && <Webhook className="h-3 w-3 mr-1" />}
                  {channel === 'in_app' && <Bell className="h-3 w-3 mr-1" />}
                  {channel.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
            />
            <Label htmlFor="enabled">Enabled</Label>
          </div>

          <div className="flex gap-2">
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              Save Threshold
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  className = ''
}) => {
  const {
    thresholds,
    loading,
    error,
    refreshThresholds,
    updateThreshold,
    testNotification
  } = useAlertThresholds();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState<AlertThreshold | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const handleSaveThreshold = async (threshold: AlertThreshold) => {
    await updateThreshold(threshold);
    setShowAddForm(false);
    setEditingThreshold(null);
  };

  const handleTestNotification = async (channel: string) => {
    const success = await testNotification(channel);
    setTestResults(prev => ({ ...prev, [channel]: success }));
    
    // Clear test result after 3 seconds
    setTimeout(() => {
      setTestResults(prev => {
        const updated = { ...prev };
        delete updated[channel];
        return updated;
      });
    }, 3000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load notification settings: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notification Settings</h2>
          <p className="text-muted-foreground">
            Configure alert thresholds and notification channels
          </p>
        </div>
        
        <Button onClick={() => setShowAddForm(true)} disabled={showAddForm || editingThreshold}>
          <Plus className="h-4 w-4 mr-2" />
          Add Threshold
        </Button>
      </div>

      <Tabs defaultValue="thresholds" className="space-y-6">
        <TabsList>
          <TabsTrigger value="thresholds">Alert Thresholds</TabsTrigger>
          <TabsTrigger value="channels">Notification Channels</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="thresholds" className="space-y-4">
          {(showAddForm || editingThreshold) && (
            <ThresholdForm
              threshold={editingThreshold || undefined}
              onSave={handleSaveThreshold}
              onCancel={() => {
                setShowAddForm(false);
                setEditingThreshold(null);
              }}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Configured Thresholds</CardTitle>
              <CardDescription>
                Current alert thresholds for system metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading thresholds...
                </div>
              ) : thresholds.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No alert thresholds configured
                </div>
              ) : (
                <div className="space-y-3">
                  {thresholds.map((threshold, index) => (
                    <div
                      key={`${threshold.metric_name}-${index}`}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="font-medium">{threshold.metric_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {threshold.operator} {threshold.value}
                          </div>
                        </div>
                        
                        <Badge variant={getSeverityColor(threshold.severity) as any}>
                          {threshold.severity}
                        </Badge>
                        
                        <div className="flex gap-1">
                          {threshold.notification_channels.map(channel => (
                            <Badge key={channel} variant="outline" className="text-xs">
                              {channel}
                            </Badge>
                          ))}
                        </div>
                        
                        {!threshold.enabled && (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingThreshold(threshold)}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-recipients">Recipients</Label>
                  <Input
                    id="email-recipients"
                    placeholder="admin@example.com"
                    disabled
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="email-enabled" disabled />
                  <Label htmlFor="email-enabled">Enabled</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Email configuration requires SMTP setup
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Webhook Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    placeholder="https://hooks.slack.com/..."
                    disabled
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="webhook-enabled" disabled />
                  <Label htmlFor="webhook-enabled">Enabled</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Configure webhook endpoint for external integrations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  In-App Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="retention-days">Retention (days)</Label>
                  <Input
                    id="retention-days"
                    type="number"
                    defaultValue="7"
                    disabled
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="inapp-enabled" defaultChecked disabled />
                  <Label htmlFor="inapp-enabled">Enabled</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Show notifications in the admin dashboard
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Notifications</CardTitle>
              <CardDescription>
                Send test notifications to verify your configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['email', 'webhook', 'in_app'].map(channel => (
                  <div key={channel} className="space-y-3">
                    <div className="flex items-center gap-2">
                      {channel === 'email' && <Mail className="h-4 w-4" />}
                      {channel === 'webhook' && <Webhook className="h-4 w-4" />}
                      {channel === 'in_app' && <Bell className="h-4 w-4" />}
                      <span className="font-medium capitalize">
                        {channel.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <Button
                      onClick={() => handleTestNotification(channel)}
                      disabled={channel !== 'in_app'} // Only in_app is implemented
                      className="w-full"
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Send Test
                    </Button>
                    
                    {testResults[channel] !== undefined && (
                      <div className={`flex items-center gap-2 text-sm ${
                        testResults[channel] ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {testResults[channel] ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                        {testResults[channel] ? 'Test successful' : 'Test failed'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};