import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Lock, 
  Key, 
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

export default function SimpleSecurityPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => window.location.href = '/admin'}
                className="gap-2 text-gray-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Admin
              </Button>
              <Shield className="w-8 h-8 text-red-400" />
              <h1 className="text-2xl font-bold text-white">Security Management</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Security & Access Control</h2>
          <p className="text-gray-400">Manage security settings, authentication, and access controls</p>
        </div>

        {/* Security Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Security Score</CardTitle>
              <Shield className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">94%</div>
              <p className="text-xs text-gray-400">Excellent security</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Failed Logins</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">0</div>
              <p className="text-xs text-gray-400">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">MFA Enabled</CardTitle>
              <Key className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">78%</div>
              <p className="text-xs text-gray-400">Of admin users</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Active Sessions</CardTitle>
              <Lock className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">156</div>
              <p className="text-xs text-gray-400">Currently logged in</p>
            </CardContent>
          </Card>
        </div>

        {/* Security Settings */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Authentication Settings */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Authentication Settings</CardTitle>
              <CardDescription className="text-gray-400">
                Configure login and authentication requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">Two-Factor Authentication</p>
                    <p className="text-xs text-gray-400">Require 2FA for admin accounts</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-600">Required</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">Password Complexity</p>
                    <p className="text-xs text-gray-400">Minimum password requirements</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-600">High</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">Session Timeout</p>
                    <p className="text-xs text-gray-400">Auto-logout after inactivity</p>
                  </div>
                  <Badge variant="secondary" className="bg-blue-600">30 minutes</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">Login Attempts</p>
                    <p className="text-xs text-gray-400">Max failed attempts before lockout</p>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-600">5 attempts</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Access Control */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Access Control</CardTitle>
              <CardDescription className="text-gray-400">
                Manage user permissions and role-based access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">Role-Based Access</p>
                    <p className="text-xs text-gray-400">Hierarchical permission system</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-600">Active</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">IP Restrictions</p>
                    <p className="text-xs text-gray-400">Limit access by IP address</p>
                  </div>
                  <Badge variant="secondary" className="bg-red-600">Disabled</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">API Rate Limiting</p>
                    <p className="text-xs text-gray-400">Prevent API abuse</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-600">Enabled</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">Audit Logging</p>
                    <p className="text-xs text-gray-400">Track all admin actions</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-600">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Security Events */}
        <Card className="mb-8 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Security Events</CardTitle>
            <CardDescription className="text-gray-400">
              Latest security-related activities and alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[].map((event, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      event.severity === 'high' ? 'bg-red-400' :
                      event.severity === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium text-white">{event.event}</p>
                      <p className="text-xs text-gray-400">User: {event.user} • IP: {event.ip}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge 
                      variant="secondary"
                      className={
                        event.severity === 'high' ? 'bg-red-600' :
                        event.severity === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
                      }
                    >
                      {event.severity}
                    </Badge>
                    <span className="text-xs text-gray-400">{event.time}</span>
                    <Button size="sm" variant="outline">
                      <Eye className="w-3 h-3 mr-1" />
                      Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Tools */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Security Tools</CardTitle>
            <CardDescription className="text-gray-400">
              Security management and monitoring tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button className="h-20 flex flex-col items-center justify-center gap-2">
                <Shield className="w-6 h-6" />
                <span className="text-sm">Security Scan</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <Key className="w-6 h-6" />
                <span className="text-sm">MFA Setup</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <Lock className="w-6 h-6" />
                <span className="text-sm">Force Logout All</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                <span className="text-sm">Security Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}