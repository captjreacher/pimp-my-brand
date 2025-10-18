import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Database, 
  Globe, 
  Shield,
  ArrowLeft,
  RefreshCw,
  Save,
  Upload,
  Download
} from 'lucide-react';

export default function SimpleConfigPage() {
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
              <Settings className="w-8 h-8 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">System Configuration</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Config
              </Button>
              <Button size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">System Configuration</h2>
          <p className="text-gray-400">Configure system settings, features, and integrations</p>
        </div>

        {/* System Status */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">System Health</CardTitle>
              <Database className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">100%</div>
              <p className="text-xs text-gray-400">All systems operational</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">API Status</CardTitle>
              <Globe className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">Online</div>
              <p className="text-xs text-gray-400">125ms avg response</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Security Level</CardTitle>
              <Shield className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">High</div>
              <p className="text-xs text-gray-400">All checks passed</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Config Version</CardTitle>
              <Settings className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">v2.1.3</div>
              <p className="text-xs text-gray-400">Latest stable</p>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Sections */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* General Settings */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">General Settings</CardTitle>
              <CardDescription className="text-gray-400">
                Basic system configuration and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">Maintenance Mode</p>
                    <p className="text-xs text-gray-400">Temporarily disable user access</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-600">Disabled</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">User Registration</p>
                    <p className="text-xs text-gray-400">Allow new user signups</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-600">Enabled</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">Email Notifications</p>
                    <p className="text-xs text-gray-400">System email notifications</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-600">Active</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">Debug Mode</p>
                    <p className="text-xs text-gray-400">Enhanced logging and debugging</p>
                  </div>
                  <Badge variant="secondary" className="bg-red-600">Disabled</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Flags */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Feature Flags</CardTitle>
              <CardDescription className="text-gray-400">
                Enable or disable specific platform features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">AI Brand Generation</p>
                    <p className="text-xs text-gray-400">AI-powered brand creation</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-600">Enabled</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">CV Generation</p>
                    <p className="text-xs text-gray-400">Resume creation tools</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-600">Enabled</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">Premium Features</p>
                    <p className="text-xs text-gray-400">Subscription-based features</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-600">Enabled</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">Beta Features</p>
                    <p className="text-xs text-gray-400">Experimental functionality</p>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-600">Limited</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Integrations */}
        <Card className="mb-8 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">API Integrations</CardTitle>
            <CardDescription className="text-gray-400">
              External service integrations and API configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-white">OpenAI API</h4>
                  <Badge className="bg-green-600">Connected</Badge>
                </div>
                <p className="text-xs text-gray-400 mb-3">AI content generation and processing</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-green-400">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rate Limit:</span>
                    <span className="text-white">1000/hour</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Usage:</span>
                    <span className="text-white">234/1000</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-white">Stripe Payment</h4>
                  <Badge className="bg-green-600">Connected</Badge>
                </div>
                <p className="text-xs text-gray-400 mb-3">Payment processing and subscriptions</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-green-400">Live</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Webhooks:</span>
                    <span className="text-green-400">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Test Mode:</span>
                    <span className="text-red-400">Disabled</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-white">Email Service</h4>
                  <Badge className="bg-green-600">Connected</Badge>
                </div>
                <p className="text-xs text-gray-400 mb-3">Email notifications and marketing</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Provider:</span>
                    <span className="text-white">SendGrid</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Daily Limit:</span>
                    <span className="text-white">10,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sent Today:</span>
                    <span className="text-white">1,234</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Management */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Configuration Management</CardTitle>
            <CardDescription className="text-gray-400">
              Import, export, and manage system configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button className="h-20 flex flex-col items-center justify-center gap-2">
                <Upload className="w-6 h-6" />
                <span className="text-sm">Import Config</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <Download className="w-6 h-6" />
                <span className="text-sm">Export Config</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6" />
                <span className="text-sm">Reset to Default</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <Save className="w-6 h-6" />
                <span className="text-sm">Backup Config</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}