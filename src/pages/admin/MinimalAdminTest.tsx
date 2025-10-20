import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BarChart3, Shield, Settings } from 'lucide-react';

/**
 * Minimal Admin Test - Simple admin interface without complex dependencies
 */
export default function MinimalAdminTest() {
  console.log('MinimalAdminTest: Component rendering');
  
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Minimal admin interface for testing</p>
        </div>

        {/* Status Banner */}
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <strong>✅ Admin Page Loading Successfully!</strong> - This confirms the routing and basic rendering works.
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">+20.1% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">+12% from last hour</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">2 resolved today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98%</div>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col">
                <Users className="h-6 w-6 mb-2" />
                Manage Users
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <BarChart3 className="h-6 w-6 mb-2" />
                View Analytics
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <Shield className="h-6 w-6 mb-2" />
                Security Settings
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <Settings className="h-6 w-6 mb-2" />
                System Config
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Navigation */}
        <Card>
          <CardHeader>
            <CardTitle>Test Navigation</CardTitle>
            <CardDescription>Links to test different admin sections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <Button 
                  variant="link" 
                  onClick={() => window.location.href = '/admin/direct'}
                  className="p-0"
                >
                  /admin/direct - Direct Admin Test (current page)
                </Button>
              </div>
              <div>
                <Button 
                  variant="link" 
                  onClick={() => window.location.href = '/admin/test'}
                  className="p-0"
                >
                  /admin/test - Admin Test Page
                </Button>
              </div>
              <div>
                <Button 
                  variant="link" 
                  onClick={() => window.location.href = '/admin/fallback'}
                  className="p-0"
                >
                  /admin/fallback - Simple Admin Fallback
                </Button>
              </div>
              <div>
                <Button 
                  variant="link" 
                  onClick={() => window.location.href = '/admin'}
                  className="p-0"
                >
                  /admin - Main Admin Entry (may be blank)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}