import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminAnalyticsDashboard } from '@/components/admin/analytics/AdminAnalyticsDashboard';
import { NotificationSettings } from '@/components/admin/analytics/NotificationSettings';
import { PermissionGate } from '@/components/admin/PermissionGate';
import { 
  BarChart3, 
  Bell, 
  TrendingUp,
  Settings
} from 'lucide-react';

const AnalyticsPage: React.FC = () => {
  return (
    <AdminLayout>
      <PermissionGate requiredPermissions={['canViewAnalytics']}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics & Monitoring</h1>
            <p className="text-muted-foreground">
              Monitor system performance, track user activity, and manage alerts
            </p>
          </div>

          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics Dashboard
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notification Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <AdminAnalyticsDashboard />
            </TabsContent>

            <TabsContent value="notifications">
              <NotificationSettings />
            </TabsContent>
          </Tabs>
        </div>
      </PermissionGate>
    </AdminLayout>
  );
};

export default AnalyticsPage;