import { supabase } from "@/integrations/supabase/client";

interface ProfileView {
  id: string;
  profile_id: string;
  viewer_id?: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  viewed_at: string;
}

interface ContentEngagement {
  content_id: string;
  content_type: 'brand' | 'cv';
  action: 'view' | 'share' | 'download' | 'like';
  timestamp: string;
  metadata?: Record<string, any>;
}

interface NetworkInsight {
  total_connections: number;
  industry_breakdown: Record<string, number>;
  role_breakdown: Record<string, number>;
  geographic_distribution: Record<string, number>;
  engagement_score: number;
}

export class ProfileTracker {
  private static instance: ProfileTracker;
  private userId: string | null = null;

  private constructor() {}

  static getInstance(): ProfileTracker {
    if (!ProfileTracker.instance) {
      ProfileTracker.instance = new ProfileTracker();
    }
    return ProfileTracker.instance;
  }

  async initialize(userId: string) {
    this.userId = userId;
  }

  // Track profile views
  async trackProfileView(profileId: string, viewerId?: string) {
    try {
      const viewData = {
        profile_id: profileId,
        viewer_id: viewerId,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
        viewed_at: new Date().toISOString()
      };

      // Store in local storage for now (would be database in production)
      const views = this.getStoredViews();
      views.push(viewData);
      localStorage.setItem('profile_views', JSON.stringify(views));

      return viewData;
    } catch (error) {
      console.error('Error tracking profile view:', error);
    }
  }

  // Track content engagement
  async trackContentEngagement(
    contentId: string, 
    contentType: 'brand' | 'cv', 
    action: 'view' | 'share' | 'download' | 'like',
    metadata?: Record<string, any>
  ) {
    try {
      const engagement: ContentEngagement = {
        content_id: contentId,
        content_type: contentType,
        action,
        timestamp: new Date().toISOString(),
        metadata
      };

      const engagements = this.getStoredEngagements();
      engagements.push(engagement);
      localStorage.setItem('content_engagements', JSON.stringify(engagements));

      return engagement;
    } catch (error) {
      console.error('Error tracking content engagement:', error);
    }
  }

  // Get profile analytics
  async getProfileAnalytics(profileId: string) {
    try {
      const views = this.getStoredViews().filter(v => v.profile_id === profileId);
      const engagements = this.getStoredEngagements();

      // Get content from database
      const [brandsResult, cvsResult, sharesResult] = await Promise.all([
        supabase
          .from('brands')
          .select('id, visibility, created_at')
          .eq('user_id', profileId),
        supabase
          .from('cvs')
          .select('id, visibility, created_at')
          .eq('user_id', profileId),
        supabase
          .from('shares')
          .select('id, kind, created_at')
          .eq('user_id', profileId)
      ]);

      const brands = brandsResult.data || [];
      const cvs = cvsResult.data || [];
      const shares = sharesResult.data || [];

      // Calculate metrics
      const profileViews = views.length;
      const brandViews = engagements.filter(e => e.content_type === 'brand' && e.action === 'view').length;
      const cvViews = engagements.filter(e => e.content_type === 'cv' && e.action === 'view').length;
      const totalShares = shares.length;

      // Calculate engagement trends
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

      const recentViews = views.filter(v => new Date(v.viewed_at) > last30Days);
      const recentEngagements = engagements.filter(e => new Date(e.timestamp) > last30Days);

      // Calculate reach metrics
      const uniqueViewers = new Set(views.map(v => v.viewer_id || v.ip_address)).size;
      const avgViewsPerDay = profileViews / 30; // Simplified calculation

      return {
        profile_views: profileViews,
        brand_views: brandViews,
        cv_views: cvViews,
        shares_count: totalShares,
        public_brands_count: brands.filter(b => b.visibility === 'public').length,
        public_cvs_count: cvs.filter(c => c.visibility === 'public').length,
        total_brands_count: brands.length,
        total_cvs_count: cvs.length,
        unique_viewers: uniqueViewers,
        recent_views_30d: recentViews.length,
        recent_engagements_30d: recentEngagements.length,
        avg_views_per_day: Math.round(avgViewsPerDay * 10) / 10,
        engagement_rate: profileViews > 0 ? Math.round((recentEngagements.length / profileViews) * 100) : 0,
        growth_trend: this.calculateGrowthTrend(views),
        top_content: this.getTopContent(engagements, brands, cvs),
        viewer_insights: this.getViewerInsights(views)
      };
    } catch (error) {
      console.error('Error getting profile analytics:', error);
      return null;
    }
  }

  // Get network insights
  async getNetworkInsights(profileId: string): Promise<NetworkInsight | null> {
    try {
      // This would typically come from a more sophisticated backend
      // For now, we'll simulate some insights
      const views = this.getStoredViews().filter(v => v.profile_id === profileId);
      const uniqueViewers = new Set(views.map(v => v.viewer_id || v.ip_address)).size;

      return {
        total_connections: uniqueViewers,
        industry_breakdown: {
          'Technology': Math.floor(uniqueViewers * 0.4),
          'Marketing': Math.floor(uniqueViewers * 0.25),
          'Design': Math.floor(uniqueViewers * 0.15),
          'Business': Math.floor(uniqueViewers * 0.1),
          'Other': Math.floor(uniqueViewers * 0.1)
        },
        role_breakdown: {
          'Individual Contributors': Math.floor(uniqueViewers * 0.5),
          'Managers': Math.floor(uniqueViewers * 0.3),
          'Executives': Math.floor(uniqueViewers * 0.15),
          'Students': Math.floor(uniqueViewers * 0.05)
        },
        geographic_distribution: {
          'North America': Math.floor(uniqueViewers * 0.45),
          'Europe': Math.floor(uniqueViewers * 0.30),
          'Asia': Math.floor(uniqueViewers * 0.15),
          'Other': Math.floor(uniqueViewers * 0.10)
        },
        engagement_score: Math.min(Math.floor((uniqueViewers * 2.5) + (views.length * 1.2)), 100)
      };
    } catch (error) {
      console.error('Error getting network insights:', error);
      return null;
    }
  }

  // Helper methods
  private getStoredViews(): any[] {
    try {
      return JSON.parse(localStorage.getItem('profile_views') || '[]');
    } catch {
      return [];
    }
  }

  private getStoredEngagements(): ContentEngagement[] {
    try {
      return JSON.parse(localStorage.getItem('content_engagements') || '[]');
    } catch {
      return [];
    }
  }

  private async getClientIP(): Promise<string | null> {
    try {
      // In a real app, you'd use a service to get the client IP
      return null;
    } catch {
      return null;
    }
  }

  private calculateGrowthTrend(views: any[]): 'up' | 'down' | 'stable' {
    if (views.length < 2) return 'stable';

    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previousWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recentViews = views.filter(v => new Date(v.viewed_at) > lastWeek).length;
    const previousViews = views.filter(v => {
      const date = new Date(v.viewed_at);
      return date > previousWeek && date <= lastWeek;
    }).length;

    if (recentViews > previousViews) return 'up';
    if (recentViews < previousViews) return 'down';
    return 'stable';
  }

  private getTopContent(engagements: ContentEngagement[], brands: any[], cvs: any[]) {
    const contentEngagement = engagements.reduce((acc, eng) => {
      acc[eng.content_id] = (acc[eng.content_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedContent = Object.entries(contentEngagement)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5);

    return sortedContent.map(([contentId, count]) => {
      const brand = brands.find(b => b.id === contentId);
      const cv = cvs.find(c => c.id === contentId);
      
      return {
        id: contentId,
        title: brand?.title || cv?.title || 'Unknown',
        type: brand ? 'brand' : 'cv',
        engagement_count: count
      };
    });
  }

  private getViewerInsights(views: any[]) {
    const referrers = views.reduce((acc, view) => {
      const referrer = view.referrer || 'Direct';
      acc[referrer] = (acc[referrer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topReferrers = Object.entries(referrers)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([referrer, count]) => ({ referrer, count }));

    return {
      top_referrers: topReferrers,
      total_unique_viewers: new Set(views.map(v => v.viewer_id || v.ip_address)).size
    };
  }
}

export const profileTracker = ProfileTracker.getInstance();