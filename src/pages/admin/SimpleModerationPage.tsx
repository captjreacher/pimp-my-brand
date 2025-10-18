import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Flag, 
  Eye, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';

export default function SimpleModerationPage() {
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
              <Flag className="w-8 h-8 text-orange-400" />
              <h1 className="text-2xl font-bold text-white">Content Moderation</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Queue
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Content Moderation</h2>
          <p className="text-gray-400">Review and moderate user-generated content</p>
        </div>

        {/* Moderation Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Pending Review</CardTitle>
              <Flag className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">0</div>
              <p className="text-xs text-gray-400">Needs attention</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Approved Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">156</div>
              <p className="text-xs text-gray-400">+12% from yesterday</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Rejected Today</CardTitle>
              <XCircle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">8</div>
              <p className="text-xs text-gray-400">5.1% rejection rate</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Auto-Flagged</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">12</div>
              <p className="text-xs text-gray-400">AI detection active</p>
            </CardContent>
          </Card>
        </div>

        {/* Moderation Queue */}
        <Card className="mb-8 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Moderation Queue</CardTitle>
            <CardDescription className="text-gray-400">
              Content awaiting review and approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                        {item.type === 'Brand' ? (
                          <Flag className="w-6 h-6 text-orange-400" />
                        ) : (
                          <MessageSquare className="w-6 h-6 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{item.content}</p>
                        <p className="text-xs text-gray-400">ID: {item.id} • User: {item.user}</p>
                        <p className="text-xs text-red-400">⚠ {item.flagged}</p>
                        <p className="text-xs text-gray-500">{item.time}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge 
                      variant="secondary"
                      className={
                        item.priority === 'high' ? 'bg-red-600' :
                        item.priority === 'medium' ? 'bg-yellow-600' : 'bg-blue-600'
                      }
                    >
                      {item.priority}
                    </Badge>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-3 h-3 mr-1" />
                        Review
                      </Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive">
                        <XCircle className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Moderation Tools */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Auto-Moderation Settings */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Auto-Moderation</CardTitle>
              <CardDescription className="text-gray-400">
                AI-powered content filtering and flagging
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Inappropriate Content Detection</span>
                  <Badge className="bg-green-600">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Spam Detection</span>
                  <Badge className="bg-green-600">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Copyright Detection</span>
                  <Badge className="bg-green-600">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Profanity Filter</span>
                  <Badge className="bg-yellow-600">Moderate</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Actions */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Actions</CardTitle>
              <CardDescription className="text-gray-400">
                Latest moderation decisions and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: 'Approved', content: 'Marketing Brand', moderator: 'Admin', time: '5 min ago', type: 'approve' },
                  { action: 'Rejected', content: 'Spam CV Content', moderator: 'Moderator', time: '12 min ago', type: 'reject' },
                  { action: 'Flagged', content: 'Suspicious Brand', moderator: 'AI System', time: '18 min ago', type: 'flag' },
                  { action: 'Approved', content: 'Developer CV', moderator: 'Admin', time: '25 min ago', type: 'approve' },
                ].map((action, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        action.type === 'approve' ? 'bg-green-400' :
                        action.type === 'reject' ? 'bg-red-400' : 'bg-yellow-400'
                      }`}></div>
                      <div>
                        <p className="text-sm text-white">{action.action}: {action.content}</p>
                        <p className="text-xs text-gray-400">by {action.moderator}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{action.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
            <CardDescription className="text-gray-400">
              Common moderation tasks and tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button className="h-20 flex flex-col items-center justify-center gap-2">
                <Flag className="w-6 h-6" />
                <span className="text-sm">Bulk Review</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <CheckCircle className="w-6 h-6" />
                <span className="text-sm">Approve All</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                <span className="text-sm">Auto-Flag Settings</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <Eye className="w-6 h-6" />
                <span className="text-sm">Moderation Log</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}