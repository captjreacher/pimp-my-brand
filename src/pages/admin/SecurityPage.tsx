import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { SecuritySettingsPanel } from '@/components/admin/security/SecuritySettingsPanel';
import { LoginAttemptsMonitor } from '@/components/admin/security/LoginAttemptsMonitor';
import { useAdmin } from '@/contexts/AdminContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Activity, Settings, AlertTriangle } from 'lucide-react';

export default function SecurityPage() {
  const { user } = useAdmin();

  if (!user) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Security Management</h1>
        </div>

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Security Settings
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Login Monitoring
            </TabsTrigger>
            <TabsTrigger value="threats" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Threat Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <SecuritySettingsPanel 
              userId={user.id} 
              userEmail={user.email || ''} 
            />
          </TabsContent>

          <TabsContent value="monitoring">
            <LoginAttemptsMonitor showMetrics={true} />
          </TabsContent>

          <TabsContent value="threats">
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Threat Analysis</h3>
              <p>Advanced threat detection and analysis features coming soon.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}