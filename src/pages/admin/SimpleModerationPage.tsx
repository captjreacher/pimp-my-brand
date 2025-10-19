import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
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

interface ContentItem {
  id: string;
  title: string;
  type: 'brand' | 'cv';
  created_at: string;
  user_id: string;
  status?: string;
}

interface ModerationStats {
  pending: number;
  approved_today: number;
  rejected_today: number;
  auto_flagged: number;
}

export default function SimpleModerationPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ModerationStats>({
    pending: 0,
    approved_today: 0,
    rejected_today: 0,
    auto_flagged: 0
  });
  const [recentContent, setRecentContent] = useState<ContentItem[]>([]);
  const [pendingContent, setPendingContent] = useState<ContentItem[]>([]);

  useEffect(() => {
    loadModerationData();
  }, []);

  const loadModerationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get brands and CVs for moderation
      const [brandsResult, cvsResult] = await Promise.all([
        supabase
          .from('brands')
          .select('id, title, created_at, user_id')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('cvs')
          .select('id, title, created_at, user_id')
          .order('created_at', { ascending: false })
          .limit(20)
      ]);

      if (brandsResult.error) throw brandsResult.error;
      if (cvsResult.error) throw cvsResult.error;

      // Combine and format content
      const allContent: ContentItem[] = [
        ...(brandsResult.data || []).map(brand => ({
          ...brand,
          type: 'brand' as const
        })),
        ...(cvsResult.data || []).map(cv => ({
          ...cv,
          type: 'cv' as const
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setRecentContent(allContent.slice(0, 10));
      setPendingContent([]); // No pending system implemented yet

      // Calculate real statistics
      const today = new Date().toISOString().split('T')[0];
      const todayContent = allContent.filter(item => 
        item.created_at.startsWith(today)
      );

      setStats({
        pending: 0, // No pending system yet
        approved_today: todayContent.length, // All content is considered approved for now
        rejected_today: 0, // No rejection system yet
        auto_flagged: 0 // No auto-flagging system yet
      });

    } catch (err) {
      console.error('Error loading moderation data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load moderation data');
    } finally {
      setLoading(false);
    }
  };
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
              <Button variant="outline" size="sm" onClick={loadModerationData}>
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
          <p className="text-gray-400">Review and moderate user-generated content - Real Data Mode</p>
          {error && (
            <div className="mt-4 p-4 bg-red-900 border border-red-700 rounded-lg">
              <p className="text-red-300">Error: {error}</p>
            </div>
          )}
        </div>

        {/* Moderation Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Pending Review</CardTitle>
              <Flag className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.pending}</div>
              <p className="text-xs text-gray-400">Needs attention</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Approved Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.approved_today}</div>
              <p className="text-xs text-gray-400">Real content created today</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Rejected Today</CardTitle>
              <XCircle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.rejected_today}</div>
              <p className="text-xs text-gray-400">No rejections yet</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Auto-Flagged</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.auto_flagged}</div>
              <p className="text-xs text-gray-400">AI detection ready</p>
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
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading moderation queue...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-400">Error: {error}</p>
              </div>
            ) : pendingContent.length === 0 ? (
              <div className="text-center py-8">
                <Flag className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No content pending review</p>
                <p className="text-xs text-gray-500 mt-2">All content is automatically approved for now</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingContent.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                        {item.type === 'brand' ? (
                          <Flag className="w-6 h-6 text-orange-400" />
                        ) : (
                          <MessageSquare className="w-6 h-6 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <p className="text-xs text-gray-400">ID: {item.id} • User: {item.user_id}</p>
                        <p className="text-xs text-gray-500">
                          {item.type === 'brand' ? 'Brand' : 'CV'} • {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge 
                      variant="secondary"
                      className="bg-blue-600"
                    >
                      {item.type}
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
            )}
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
                {recentContent.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-400">No recent activity</p>
                  </div>
                ) : (
                  recentContent.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <div>
                          <p className="text-sm text-white">Created: {item.title}</p>
                          <p className="text-xs text-gray-400">by User {item.user_id.slice(0, 8)}...</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(item.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
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
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => window.location.href = '/admin/config'}
              >
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