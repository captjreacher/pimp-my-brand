import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Mail, 
  Bell, 
  Send,
  ArrowLeft,
  RefreshCw,
  Users,
  Megaphone
} from 'lucide-react';

export default function SimpleCommunicationPage() {
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
              <MessageSquare className="w-8 h-8 text-cyan-400" />
              <h1 className="text-2xl font-bold text-white">Communication Hub</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm">
                <Send className="w-4 h-4 mr-2" />
                Send Broadcast
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Communication Management</h2>
          <p className="text-gray-400">Send notifications, announcements, and manage user communications</p>
        </div>

        {/* Communication Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Messages Sent</CardTitle>
              <Mail className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">2,847</div>
              <p className="text-xs text-gray-400">This month</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Open Rate</CardTitle>
              <Bell className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">78.5%</div>
              <p className="text-xs text-gray-400">+5.2% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Active Campaigns</CardTitle>
              <Megaphone className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">5</div>
              <p className="text-xs text-gray-400">2 scheduled</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Subscribers</CardTitle>
              <Users className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">1,089</div>
              <p className="text-xs text-gray-400">87% opt-in rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Send Notification */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Send Notification</CardTitle>
              <CardDescription className="text-gray-400">
                Send immediate notifications to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Notification Type
                  </label>
                  <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>System Announcement</option>
                    <option>Maintenance Notice</option>
                    <option>Feature Update</option>
                    <option>Security Alert</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Target Audience
                  </label>
                  <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>All Users</option>
                    <option>Premium Users</option>
                    <option>Admin Users</option>
                    <option>New Users</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea 
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter your message..."
                  ></textarea>
                </div>
                
                <Button className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  Send Notification
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Messages */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Messages</CardTitle>
              <CardDescription className="text-gray-400">
                Latest sent communications and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { 
                    title: 'System Maintenance Notice', 
                    type: 'System', 
                    sent: '2 hours ago',
                    recipients: '1,247 users',
                    status: 'delivered'
                },
                { 
                    title: 'New Feature Announcement', 
                    type: 'Feature', 
                    sent: '1 day ago',
                    recipients: '1,089 users',
                    status: 'delivered'
                },
                { 
                    title: 'Security Update Required', 
                    type: 'Security', 
                    sent: '2 days ago',
                    recipients: '12 admins',
                    status: 'delivered'
                },
                { 
                    title: 'Welcome to Premium', 
                    type: 'Marketing', 
                    sent: '3 days ago',
                    recipients: '45 users',
                    status: 'delivered'
                },
              ].map((message, index) => (
                <div key={index} className="p-3 bg-gray-700 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-medium text-white">{message.title}</h4>
                    <Badge 
                      variant="secondary"
                      className={message.status === 'delivered' ? 'bg-green-600' : 'bg-yellow-600'}
                    >
                      {message.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">
                    {message.type} • {message.recipients} • {message.sent}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Communication Channels */}
        <Card className="mb-8 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Communication Channels</CardTitle>
            <CardDescription className="text-gray-400">
              Manage different communication methods and their settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <h4 className="font-medium text-white">Email</h4>
                  </div>
                  <Badge className="bg-green-600">Active</Badge>
                </div>
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

              <div className="p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-yellow-400" />
                    <h4 className="font-medium text-white">Push Notifications</h4>
                  </div>
                  <Badge className="bg-green-600">Active</Badge>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Service:</span>
                    <span className="text-white">Firebase</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subscribers:</span>
                    <span className="text-white">892</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sent Today:</span>
                    <span className="text-white">456</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-green-400" />
                    <h4 className="font-medium text-white">In-App Messages</h4>
                  </div>
                  <Badge className="bg-green-600">Active</Badge>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Active Messages:</span>
                    <span className="text-white">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Read Rate:</span>
                    <span className="text-white">94%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg. Display:</span>
                    <span className="text-white">2.3s</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Communication Tools */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Communication Tools</CardTitle>
            <CardDescription className="text-gray-400">
              Advanced communication and messaging tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button className="h-20 flex flex-col items-center justify-center gap-2">
                <Megaphone className="w-6 h-6" />
                <span className="text-sm">Broadcast Message</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <Mail className="w-6 h-6" />
                <span className="text-sm">Email Campaign</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <Bell className="w-6 h-6" />
                <span className="text-sm">Push Campaign</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <Users className="w-6 h-6" />
                <span className="text-sm">User Segments</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}