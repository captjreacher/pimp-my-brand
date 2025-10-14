import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Eye, 
  Share2, 
  FileText, 
  User, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Globe,
  Lock,
  Calendar,
  BarChart3,
  Users,
  MapPin,
  Briefcase,
  Target,
  Zap,
  Award,
  RefreshCw
} from "lucide-react";
import { profileTracker } from "@/lib/analytics/profile-tracker";

interface ProfileAnalytics {
  profile_views: number;
  brand_views: number;
  cv_views: number;
  shares_count: number;
  public_brands_count: number;
  public_cvs_count: number;
  total_brands_count: number;
  total_cvs_count: number;
  unique_viewers?: number;
  recent_views_30d?: number;
  recent_engagements_30d?: number;
  avg_views_per_day?: number;
  engagement_rate?: number;
  growth_trend?: 'up' | 'down' | 'stable';
  top_content?: Array<{
    id: string;
    title: string;
    type: 'brand' | 'cv';
    engagement_count: number;
  }>;
  viewer_insights?: {
    top_referrers: Array<{ referrer: string; count: number }>;
    total_unique_viewers: number;
  };
}

interface NetworkInsight {
  total_connections: number;
  industry_breakdown: Record<string, number>;
  role_breakdown: Record<string, number>;
  geographic_distribution: Record<string, number>;
  engagement_score: number;
}

interface ProfileAnalyticsProps {
  analytics: ProfileAnalytics;
  isLoading?: boolean;
  userId?: string;
}

export const ProfileAnalytics = ({ analytics, isLoading, userId }: ProfileAnalyticsProps) => {
  const [networkInsights, setNetworkInsights] = useState<NetworkInsight | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (userId && activeTab === 'network') {
      loadNetworkInsights();
    }
  }, [userId, activeTab]);

  const loadNetworkInsights = async () => {
    if (!userId) return;
    
    setIsLoadingInsights(true);
    try {
      const insights = await profileTracker.getNetworkInsights(userId);
      setNetworkInsights(insights);
    } catch (error) {
      console.error('Error loading network insights:', error);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const refreshAnalytics = async () => {
    if (!userId) return;
    
    try {
      await profileTracker.getProfileAnalytics(userId);
      if (activeTab === 'network') {
        await loadNetworkInsights();
      }
    } catch (error) {
      console.error('Error refreshing analytics:', error);
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-8 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalViews = analytics.profile_views + analytics.brand_views + analytics.cv_views;
  const publicContentPercentage = analytics.total_brands_count > 0 
    ? Math.round((analytics.public_brands_count / analytics.total_brands_count) * 100)
    : 0;

  const engagementScore = Math.min(
    Math.round(((analytics.shares_count * 10) + totalViews) / 10),
    100
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics & Insights</h2>
          <p className="text-muted-foreground">Track your profile performance and audience engagement</p>
        </div>
        <Button variant="outline" onClick={refreshAnalytics} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
              </div>
              <Eye className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>Across all content</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Shares</p>
                <p className="text-2xl font-bold">{analytics.shares_count}</p>
              </div>
              <Share2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              <span>All time</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Brand Materials</p>
                <p className="text-2xl font-bold">{analytics.total_brands_count}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Globe className="h-3 w-3 mr-1" />
                {analytics.public_brands_count} public
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">CVs</p>
                <p className="text-2xl font-bold">{analytics.total_cvs_count}</p>
              </div>
              <User className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Globe className="h-3 w-3 mr-1" />
                {analytics.public_cvs_count} public
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Content Performance
            </CardTitle>
            <CardDescription>
              Breakdown of views across your content types
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Profile Views
                </span>
                <span className="font-medium">{analytics.profile_views}</span>
              </div>
              <Progress 
                value={totalViews > 0 ? (analytics.profile_views / totalViews) * 100 : 0} 
                className="h-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Brand Views
                </span>
                <span className="font-medium">{analytics.brand_views}</span>
              </div>
              <Progress 
                value={totalViews > 0 ? (analytics.brand_views / totalViews) * 100 : 0} 
                className="h-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4 text-purple-600" />
                  CV Views
                </span>
                <span className="font-medium">{analytics.cv_views}</span>
              </div>
              <Progress 
                value={totalViews > 0 ? (analytics.cv_views / totalViews) * 100 : 0} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Visibility & Engagement
            </CardTitle>
            <CardDescription>
              How discoverable and engaging your content is
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Public Content</span>
                <span className="text-sm text-muted-foreground">{publicContentPercentage}%</span>
              </div>
              <Progress value={publicContentPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {analytics.public_brands_count + analytics.public_cvs_count} of {analytics.total_brands_count + analytics.total_cvs_count} items are public
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Engagement Score</span>
                <span className="text-sm text-muted-foreground">{engagementScore}/100</span>
              </div>
              <Progress value={engagementScore} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Based on views, shares, and content quality
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm font-medium">Public</span>
                </div>
                <p className="text-2xl font-bold">{analytics.public_brands_count + analytics.public_cvs_count}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-orange-600 mb-1">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm font-medium">Private</span>
                </div>
                <p className="text-2xl font-bold">
                  {(analytics.total_brands_count + analytics.total_cvs_count) - (analytics.public_brands_count + analytics.public_cvs_count)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Insights</CardTitle>
          <CardDescription>
            Recommendations to improve your profile performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.public_brands_count === 0 && analytics.total_brands_count > 0 && (
              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <Globe className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Make your content discoverable
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                    Consider making some of your brand materials public to increase visibility and attract opportunities.
                  </p>
                </div>
              </div>
            )}

            {analytics.shares_count === 0 && analytics.total_brands_count > 0 && (
              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <Share2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900 dark:text-green-100">
                    Start sharing your work
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-200 mt-1">
                    Share your brand materials with colleagues and on social media to increase engagement.
                  </p>
                </div>
              </div>
            )}

            {analytics.total_brands_count < 3 && (
              <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-purple-900 dark:text-purple-100">
                    Build your portfolio
                  </h4>
                  <p className="text-sm text-purple-700 dark:text-purple-200 mt-1">
                    Create more brand materials to showcase different aspects of your professional identity.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Engagement Metrics
                </CardTitle>
                <CardDescription>
                  How your audience interacts with your content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Engagement Rate</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{analytics.engagement_rate || 0}%</span>
                    {getTrendIcon(analytics.growth_trend)}
                  </div>
                </div>
                <Progress value={analytics.engagement_rate || 0} className="h-2" />

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{analytics.unique_viewers || 0}</p>
                    <p className="text-xs text-muted-foreground">Unique Viewers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{analytics.avg_views_per_day || 0}</p>
                    <p className="text-xs text-muted-foreground">Avg Views/Day</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Top Performing Content
                </CardTitle>
                <CardDescription>
                  Your most engaging brand materials and CVs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.top_content && analytics.top_content.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.top_content.map((content, index) => (
                      <div key={content.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{content.title}</p>
                            <p className="text-xs text-muted-foreground capitalize">{content.type}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {content.engagement_count} views
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No content engagement data yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Traffic Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Traffic Sources
              </CardTitle>
              <CardDescription>
                Where your profile visitors are coming from
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.viewer_insights?.top_referrers && analytics.viewer_insights.top_referrers.length > 0 ? (
                <div className="space-y-3">
                  {analytics.viewer_insights.top_referrers.map((referrer, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {referrer.referrer === 'Direct' ? 'Direct Traffic' : referrer.referrer}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ 
                              width: `${(referrer.count / (analytics.viewer_insights?.total_unique_viewers || 1)) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-8 text-right">
                          {referrer.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No traffic source data available yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          {isLoadingInsights ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-8 bg-muted rounded w-1/2" />
                      <div className="h-3 bg-muted rounded w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : networkInsights ? (
            <>
              {/* Network Overview */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Connections</p>
                        <p className="text-2xl font-bold">{networkInsights.total_connections}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Engagement Score</p>
                        <p className="text-2xl font-bold">{networkInsights.engagement_score}</p>
                      </div>
                      <Award className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div className="mt-4">
                      <Progress value={networkInsights.engagement_score} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Top Industry</p>
                        <p className="text-lg font-bold">
                          {Object.entries(networkInsights.industry_breakdown)
                            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                        </p>
                      </div>
                      <Briefcase className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Top Region</p>
                        <p className="text-lg font-bold">
                          {Object.entries(networkInsights.geographic_distribution)
                            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                        </p>
                      </div>
                      <MapPin className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Breakdowns */}
              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Industry Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(networkInsights.industry_breakdown)
                      .sort(([,a], [,b]) => b - a)
                      .map(([industry, count]) => (
                        <div key={industry} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{industry}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${(count / networkInsights.total_connections) * 100}%` 
                                }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-6 text-right">
                              {count}
                            </span>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Role Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(networkInsights.role_breakdown)
                      .sort(([,a], [,b]) => b - a)
                      .map(([role, count]) => (
                        <div key={role} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{role}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${(count / networkInsights.total_connections) * 100}%` 
                                }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-6 text-right">
                              {count}
                            </span>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Geographic Reach</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(networkInsights.geographic_distribution)
                      .sort(([,a], [,b]) => b - a)
                      .map(([region, count]) => (
                        <div key={region} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{region}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${(count / networkInsights.total_connections) * 100}%` 
                                }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-6 text-right">
                              {count}
                            </span>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No Network Data Available</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start sharing your profile to build your professional network insights.
                </p>
                <Button onClick={loadNetworkInsights} variant="outline">
                  Load Network Insights
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};