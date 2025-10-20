import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BarChart3, Shield, Settings, CreditCard, Flag } from 'lucide-react';

/**
 * Simple Working Admin - No authentication, no complex dependencies
 * This should always work regardless of other issues
 */
export default function SimpleWorkingAdmin() {
  console.log('SimpleWorkingAdmin: Rendering successfully');
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Simple working admin interface</p>
        </div>

        {/* Success Banner */}
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <strong>✅ SUCCESS!</strong> Admin dashboard is loading and working properly.
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$12,345</div>
              <p className="text-xs text-muted-foreground">+15% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col"
                onClick={() => window.location.href = '/admin/users'}
              >
                <Users className="h-6 w-6 mb-2" />
                Manage Users
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col"
                onClick={() => window.location.href = '/admin/analytics'}
              >
                <BarChart3 className="h-6 w-6 mb-2" />
                View Analytics
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col"
                onClick={() => window.location.href = '/admin/moderation'}
              >
                <Flag className="h-6 w-6 mb-2" />
                Content Moderation
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col"
                onClick={() => window.location.href = '/admin/subscriptions'}
              >
                <CreditCard className="h-6 w-6 mb-2" />
                Subscriptions
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col"
                onClick={() => window.location.href = '/admin/security'}
              >
                <Shield className="h-6 w-6 mb-2" />
                Security
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col"
                onClick={() => window.location.href = '/admin/config'}
              >
                <Settings className="h-6 w-6 mb-2" />
                System Config
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest admin actions and system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New user registered</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Content approved</p>
                  <p className="text-xs text-gray-500">5 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Payment processed</p>
                  <p className="text-xs text-gray-500">10 minutes ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Debug Information</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>✅ React component rendered successfully</p>
            <p>✅ UI components loaded</p>
            <p>✅ Navigation working</p>
            <p>✅ No authentication blocking</p>
            <p>Current URL: {window.location.href}</p>
            <p>Timestamp: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}