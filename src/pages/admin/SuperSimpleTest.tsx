import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export function SuperSimpleTest() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 Super Simple Test Page</h1>
      <p>This page tests if tabs work without any admin components.</p>
      
      <div style={{ marginTop: '20px' }}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="plans">
              Plans <Badge variant="secondary">3</Badge>
            </TabsTrigger>
            <TabsTrigger value="subscriptions">
              Subscriptions <Badge variant="secondary">5</Badge>
            </TabsTrigger>
            <TabsTrigger value="billing">
              Billing Issues
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div style={{ padding: '20px', border: '1px solid #ccc', marginTop: '10px' }}>
              <h2>✅ Overview Tab Works!</h2>
              <p>If you can see this, the tabs component is working.</p>
            </div>
          </TabsContent>

          <TabsContent value="plans">
            <div style={{ padding: '20px', border: '1px solid #ccc', marginTop: '10px', backgroundColor: '#e8f5e8' }}>
              <h2>🎯 Plans Tab Works!</h2>
              <p><strong>SUCCESS!</strong> The Plans tab is working perfectly.</p>
              <p>This means the issue is with the AdminLayout or PermissionGate components.</p>
              <h3>Next Steps:</h3>
              <ol>
                <li>Check browser console for errors</li>
                <li>Add manage_billing permission to your user</li>
                <li>Test the real subscription page</li>
              </ol>
            </div>
          </TabsContent>

          <TabsContent value="subscriptions">
            <div style={{ padding: '20px', border: '1px solid #ccc', marginTop: '10px' }}>
              <h2>📊 Subscriptions Tab Works!</h2>
              <p>This tab is also working fine.</p>
            </div>
          </TabsContent>

          <TabsContent value="billing">
            <div style={{ padding: '20px', border: '1px solid #ccc', marginTop: '10px' }}>
              <h2>⚠️ Billing Issues Tab Works!</h2>
              <p>All tabs are working correctly.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f0f8ff', border: '1px solid #0066cc' }}>
        <h3>🔍 Diagnostic Information</h3>
        <p><strong>Current URL:</strong> {window.location.href}</p>
        <p><strong>Test Result:</strong> If you can see tabs above, the UI components work fine.</p>
        <p><strong>Issue Location:</strong> The problem is likely in AdminLayout, PermissionGate, or admin routing.</p>
      </div>
    </div>
  );
}