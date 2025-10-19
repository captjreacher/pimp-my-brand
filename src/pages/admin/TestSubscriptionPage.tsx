import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  Settings
} from 'lucide-react';

export function TestSubscriptionPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Test Subscription Management</h1>
            <p className="text-muted-foreground">
              Testing tabs without permission gate
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Plans
              <Badge variant="secondary">3</Badge>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Subscriptions
              <Badge variant="secondary">5</Badge>
            </TabsTrigger>
            <TabsTrigger value="billing-issues" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Billing Issues
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Overview Tab</CardTitle>
                <CardDescription>This is the overview tab content</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Overview content goes here</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Plans Tab - SUCCESS!</CardTitle>
                <CardDescription>This is the plans tab content</CardDescription>
              </CardHeader>
              <CardContent>
                <p>🎯 Plans tab is working! This means the issue is with permissions.</p>
                <p>The PermissionGate is blocking the entire subscription page.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscriptions Tab</CardTitle>
                <CardDescription>This is the subscriptions tab content</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Subscriptions content goes here</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Issues Tab */}
          <TabsContent value="billing-issues" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing Issues Tab</CardTitle>
                <CardDescription>This is the billing issues tab content</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Billing issues content goes here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}