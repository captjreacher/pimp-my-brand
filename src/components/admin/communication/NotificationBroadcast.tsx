import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  useBroadcastNotification,
  useBroadcastMaintenanceNotification,
  useBroadcastSecurityAlert,
  useBroadcastFeatureAnnouncement,
  useDeliveryStats,
} from '@/hooks/use-admin-communication';
import { useToast } from '@/hooks/use-toast';
import {
  Bell,
  Send,
  Users,
  AlertTriangle,
  Shield,
  Star,
  Wrench,
  Mail,
  Smartphone,
  Monitor,
  TrendingUp,
  Calendar,
  Clock,
} from 'lucide-react';
import type { SendNotificationRequest } from '@/lib/admin/types/communication-types';

export function NotificationBroadcast() {
  const [activeTab, setActiveTab] = useState('broadcast');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const { toast } = useToast();
  const broadcastNotification = useBroadcastNotification();
  const broadcastMaintenance = useBroadcastMaintenanceNotification();
  const broadcastSecurity = useBroadcastSecurityAlert();
  const broadcastFeature = useBroadcastFeatureAnnouncement();
  const { data: deliveryStats } = useDeliveryStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notification Broadcast
          </h2>
          <p className="text-muted-foreground">
            Send notifications and announcements to users
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="broadcast">General Broadcast</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="security">Security Alert</TabsTrigger>
          <TabsTrigger value="feature">Feature Announcement</TabsTrigger>
          <TabsTrigger value="stats">Delivery Stats</TabsTrigger>
        </TabsList>

        {/* General Broadcast */}
        <TabsContent value="broadcast">
          <GeneralBroadcastForm
            onPreview={(data) => {
              setPreviewData(data);
              setIsPreviewOpen(true);
            }}
          />
        </TabsContent>

        {/* Maintenance Notifications */}
        <TabsContent value="maintenance">
          <MaintenanceNotificationForm />
        </TabsContent>

        {/* Security Alerts */}
        <TabsContent value="security">
          <SecurityAlertForm />
        </TabsContent>

        {/* Feature Announcements */}
        <TabsContent value="feature">
          <FeatureAnnouncementForm />
        </TabsContent>

        {/* Delivery Statistics */}
        <TabsContent value="stats">
          <DeliveryStatsPanel />
        </TabsContent>
      </Tabs>

      {/* Preview Modal */}
      {isPreviewOpen && previewData && (
        <NotificationPreviewModal
          data={previewData}
          onClose={() => setIsPreviewOpen(false)}
          onSend={async () => {
            try {
              await broadcastNotification.mutateAsync(previewData);
              toast({
                title: 'Notification Sent',
                description: 'Your notification has been broadcast successfully.',
              });
              setIsPreviewOpen(false);
            } catch (error) {
              toast({
                title: 'Error',
                description: 'Failed to send notification. Please try again.',
                variant: 'destructive',
              });
            }
          }}
        />
      )}
    </div>
  );
}

// General Broadcast Form
function GeneralBroadcastForm({ onPreview }: { onPreview: (data: any) => void }) {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    notification_type: 'info' as const,
    priority: 'normal' as const,
    target_audience: 'all' as const,
    action_url: '',
    action_label: '',
    expires_at: '',
    delivery_methods: ['in_app'] as Array<'in_app' | 'email' | 'push'>,
  });

  const handlePreview = () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      return;
    }
    onPreview(formData);
  };

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'success':
        return <Star className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          General Notification Broadcast
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter notification title..."
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Enter notification message..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {formData.message.length} characters
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.notification_type}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, notification_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select
                value={formData.target_audience}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, target_audience: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="subscribers">Subscribers Only</SelectItem>
                  <SelectItem value="free_users">Free Users Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action_url">Action URL (Optional)</Label>
              <Input
                id="action_url"
                value={formData.action_url}
                onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
                placeholder="https://example.com/action"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="action_label">Action Label (Optional)</Label>
              <Input
                id="action_label"
                value={formData.action_label}
                onChange={(e) => setFormData({ ...formData, action_label: e.target.value })}
                placeholder="Learn More"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires_at">Expires At (Optional)</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Delivery Methods</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'in_app', label: 'In-App', icon: Monitor },
                  { value: 'email', label: 'Email', icon: Mail },
                  { value: 'push', label: 'Push', icon: Smartphone },
                ].map(({ value, label, icon: Icon }) => (
                  <div key={value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={value}
                      checked={formData.delivery_methods.includes(value as any)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            delivery_methods: [...formData.delivery_methods, value as any],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            delivery_methods: formData.delivery_methods.filter(m => m !== value),
                          });
                        }
                      }}
                    />
                    <Label htmlFor={value} className="flex items-center gap-1 text-sm">
                      <Icon className="h-3 w-3" />
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="p-4 border rounded-md bg-muted/50">
            <div className="flex items-start gap-3">
              {getNotificationTypeIcon(formData.notification_type)}
              <div className="flex-1 space-y-1">
                <h4 className="font-medium">
                  {formData.title || 'Notification Title'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {formData.message || 'Notification message will appear here...'}
                </p>
                {formData.action_label && (
                  <Button size="sm" variant="outline" className="mt-2">
                    {formData.action_label}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            onClick={handlePreview}
            disabled={!formData.title.trim() || !formData.message.trim()}
          >
            Preview & Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Maintenance Notification Form
function MaintenanceNotificationForm() {
  const [formData, setFormData] = useState({
    scheduledTime: '',
    duration: '',
    description: '',
  });

  const { toast } = useToast();
  const broadcastMaintenance = useBroadcastMaintenanceNotification();

  const handleSend = async () => {
    if (!formData.scheduledTime || !formData.duration) {
      toast({
        title: 'Validation Error',
        description: 'Scheduled time and duration are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await broadcastMaintenance.mutateAsync(formData);
      toast({
        title: 'Maintenance Notification Sent',
        description: 'Maintenance notification has been broadcast to all users.',
      });
      setFormData({ scheduledTime: '', duration: '', description: '' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send maintenance notification.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Maintenance Notification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="scheduledTime">Scheduled Time</Label>
            <Input
              id="scheduledTime"
              type="datetime-local"
              value={formData.scheduledTime}
              onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="e.g., 2 hours, 30 minutes"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Additional details about the maintenance..."
            rows={3}
          />
        </div>

        <Button
          onClick={handleSend}
          disabled={!formData.scheduledTime || !formData.duration || broadcastMaintenance.isPending}
          className="w-full"
        >
          {broadcastMaintenance.isPending ? 'Sending...' : 'Send Maintenance Notification'}
        </Button>
      </CardContent>
    </Card>
  );
}

// Security Alert Form
function SecurityAlertForm() {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    actionUrl: '',
    actionLabel: '',
  });

  const { toast } = useToast();
  const broadcastSecurity = useBroadcastSecurityAlert();

  const handleSend = async () => {
    if (!formData.title || !formData.message) {
      toast({
        title: 'Validation Error',
        description: 'Title and message are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await broadcastSecurity.mutateAsync({
        title: formData.title,
        message: formData.message,
        actionRequired: formData.actionUrl ? {
          url: formData.actionUrl,
          label: formData.actionLabel || 'Take Action'
        } : undefined
      });
      toast({
        title: 'Security Alert Sent',
        description: 'Security alert has been broadcast to all users.',
      });
      setFormData({ title: '', message: '', actionUrl: '', actionLabel: '' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send security alert.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Alert
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Alert Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Security Alert Title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Alert Message</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Describe the security issue and any actions users should take..."
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="actionUrl">Action URL (Optional)</Label>
            <Input
              id="actionUrl"
              value={formData.actionUrl}
              onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
              placeholder="https://example.com/security-action"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="actionLabel">Action Label</Label>
            <Input
              id="actionLabel"
              value={formData.actionLabel}
              onChange={(e) => setFormData({ ...formData, actionLabel: e.target.value })}
              placeholder="Take Action"
            />
          </div>
        </div>

        <Button
          onClick={handleSend}
          disabled={!formData.title || !formData.message || broadcastSecurity.isPending}
          className="w-full"
          variant="destructive"
        >
          {broadcastSecurity.isPending ? 'Sending...' : 'Send Security Alert'}
        </Button>
      </CardContent>
    </Card>
  );
}

// Feature Announcement Form
function FeatureAnnouncementForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    featureUrl: '',
  });

  const { toast } = useToast();
  const broadcastFeature = useBroadcastFeatureAnnouncement();

  const handleSend = async () => {
    if (!formData.title || !formData.description) {
      toast({
        title: 'Validation Error',
        description: 'Title and description are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await broadcastFeature.mutateAsync(formData);
      toast({
        title: 'Feature Announcement Sent',
        description: 'Feature announcement has been broadcast to all users.',
      });
      setFormData({ title: '', description: '', featureUrl: '' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send feature announcement.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Feature Announcement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Feature Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="New Feature Name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Feature Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the new feature and its benefits..."
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="featureUrl">Feature URL (Optional)</Label>
          <Input
            id="featureUrl"
            value={formData.featureUrl}
            onChange={(e) => setFormData({ ...formData, featureUrl: e.target.value })}
            placeholder="https://example.com/new-feature"
          />
        </div>

        <Button
          onClick={handleSend}
          disabled={!formData.title || !formData.description || broadcastFeature.isPending}
          className="w-full"
        >
          {broadcastFeature.isPending ? 'Sending...' : 'Send Feature Announcement'}
        </Button>
      </CardContent>
    </Card>
  );
}

// Delivery Stats Panel
function DeliveryStatsPanel() {
  const { data: stats } = useDeliveryStats();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Delivery Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats ? (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.total_scheduled}</p>
                  <p className="text-sm text-muted-foreground">Total Scheduled</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
                  <p className="text-sm text-muted-foreground">Delivered</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(stats.delivery_rate * 100)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Delivery Rate</p>
                </div>
              </div>

              <Separator />

              {/* By Method */}
              <div>
                <h3 className="font-semibold mb-4">Delivery by Method</h3>
                <div className="space-y-3">
                  {Object.entries(stats.by_method).map(([method, methodStats]) => (
                    <div key={method} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-2">
                        {method === 'email' && <Mail className="h-4 w-4" />}
                        {method === 'push' && <Smartphone className="h-4 w-4" />}
                        {method === 'in_app' && <Monitor className="h-4 w-4" />}
                        <span className="capitalize">{method.replace('_', ' ')}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {methodStats.delivered} / {methodStats.scheduled}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {Math.round((methodStats.delivered / methodStats.scheduled) * 100)}% success
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No delivery statistics available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Notification Preview Modal
function NotificationPreviewModal({
  data,
  onClose,
  onSend,
}: {
  data: any;
  onClose: () => void;
  onSend: () => void;
}) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Preview Notification</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="p-4 border rounded-md bg-muted/50">
            <div className="flex items-start gap-3">
              <Bell className="h-4 w-4 text-blue-500 mt-0.5" />
              <div className="flex-1 space-y-1">
                <h4 className="font-medium">{data.title}</h4>
                <p className="text-sm text-muted-foreground">{data.message}</p>
                {data.action_label && (
                  <Button size="sm" variant="outline" className="mt-2">
                    {data.action_label}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Target:</span>
              <Badge>{data.target_audience.replace('_', ' ')}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Priority:</span>
              <Badge>{data.priority}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Delivery:</span>
              <div className="flex gap-1">
                {data.delivery_methods.map((method: string) => (
                  <Badge key={method} variant="outline" className="text-xs">
                    {method.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSend}>
            Send Notification
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}