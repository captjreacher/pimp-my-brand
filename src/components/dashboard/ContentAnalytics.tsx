import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Eye, 
  Share, 
  Download, 
  Calendar,
  Users,
  BarChart3,
  Activity
} from 'lucide-react';
import { formatDistanceToNow, format, subDays, isAfter } from 'date-fns';

interface ContentAnalyticsProps {
  contentType: 'brands' | 'cvs' | 'uploads';
  items: any[];
}

interface AnalyticsData {
  totalViews: number;
  totalShares: number;
  totalDownloads: number;
  recentActivity: number;
  popularFormats: { format: string; count: number; percentage: number }[];
  visibilityStats: { public: number; private: number };
  creationTrend: { period: string; count: number }[];
  topPerforming: any[];
}

export function ContentAnalytics({ contentType, items }: ContentAnalyticsProps) {
  const analytics = calculateAnalytics(items, contentType);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Total Views"
          value={analytics.totalViews}
          icon={<Eye className="w-4 h-4" />}
          trend="+12%"
          trendUp={true}
        />
        <AnalyticsCard
          title="Shares"
          value={analytics.totalShares}
          icon={<Share className="w-4 h-4" />}
          trend="+8%"
          trendUp={true}
        />
        <AnalyticsCard
          title="Downloads"
          value={analytics.totalDownloads}
          icon={<Download className="w-4 h-4" />}
          trend="+15%"
          trendUp={true}
        />
        <AnalyticsCard
          title="Recent Activity"
          value={analytics.recentActivity}
          icon={<Activity className="w-4 h-4" />}
          trend="Last 7 days"
          trendUp={null}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Format Distribution */}
        {contentType !== 'uploads' && analytics.popularFormats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Format Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.popularFormats.map((format) => (
                  <div key={format.format} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize">{format.format}</span>
                      <span className="text-muted-foreground">
                        {format.count} ({format.percentage}%)
                      </span>
                    </div>
                    <Progress value={format.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Visibility Stats */}
        {contentType !== 'uploads' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Visibility Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Public</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {analytics.visibilityStats.public}
                    </span>
                    <Badge variant="outline">
                      {Math.round((analytics.visibilityStats.public / items.length) * 100)}%
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span>Private</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {analytics.visibilityStats.private}
                    </span>
                    <Badge variant="outline">
                      {Math.round((analytics.visibilityStats.private / items.length) * 100)}%
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Creation Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Creation Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.creationTrend.map((trend, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{trend.period}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ 
                          width: `${Math.min((trend.count / Math.max(...analytics.creationTrend.map(t => t.count))) * 100, 100)}%` 
                        }}
                      />
                    </div>
                    <span className="font-medium w-6 text-right">{trend.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Content */}
        {analytics.topPerforming.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Top Performing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topPerforming.slice(0, 5).map((item, index) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-muted rounded-full text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {getItemTitle(item, contentType)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {item.format_preset || 'Default'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface AnalyticsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend: string;
  trendUp: boolean | null;
}

function AnalyticsCard({ title, value, icon, trend, trendUp }: AnalyticsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          </div>
          <div className="p-2 bg-muted rounded-lg">
            {icon}
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          {trendUp !== null && (
            <TrendingUp className={`w-4 h-4 mr-1 ${trendUp ? 'text-green-600' : 'text-red-600 rotate-180'}`} />
          )}
          <span className={trendUp !== null ? (trendUp ? 'text-green-600' : 'text-red-600') : 'text-muted-foreground'}>
            {trend}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function calculateAnalytics(items: any[], contentType: string): AnalyticsData {
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  
  // Mock analytics data - in a real app, this would come from actual usage data
  const totalViews = items.length * Math.floor(Math.random() * 50) + 10;
  const totalShares = Math.floor(totalViews * 0.1);
  const totalDownloads = Math.floor(totalViews * 0.15);
  
  const recentActivity = items.filter(item => 
    isAfter(new Date(item.updated_at || item.created_at), sevenDaysAgo)
  ).length;

  // Format distribution
  const formatCounts: Record<string, number> = {};
  items.forEach(item => {
    const format = item.format_preset || 'default';
    formatCounts[format] = (formatCounts[format] || 0) + 1;
  });

  const popularFormats = Object.entries(formatCounts)
    .map(([format, count]) => ({
      format,
      count,
      percentage: Math.round((count / items.length) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // Visibility stats
  const visibilityStats = {
    public: items.filter(item => item.visibility === 'public').length,
    private: items.filter(item => item.visibility === 'private' || !item.visibility).length,
  };

  // Creation trend (last 7 days)
  const creationTrend = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(now, i);
    const dayItems = items.filter(item => {
      const itemDate = new Date(item.created_at);
      return format(itemDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
    
    creationTrend.push({
      period: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : format(date, 'MMM dd'),
      count: dayItems.length,
    });
  }

  // Top performing (most recently updated)
  const topPerforming = [...items]
    .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    .slice(0, 5);

  return {
    totalViews,
    totalShares,
    totalDownloads,
    recentActivity,
    popularFormats,
    visibilityStats,
    creationTrend,
    topPerforming,
  };
}

function getItemTitle(item: any, contentType: string): string {
  if (contentType === 'uploads') return item.original_name;
  return item.title || `Untitled ${contentType.slice(0, -1)}`;
}