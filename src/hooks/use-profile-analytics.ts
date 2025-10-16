import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { profileTracker } from "@/lib/analytics/profile-tracker";

interface EnhancedProfileAnalytics {
  profile_views: number;
  brand_views: number;
  cv_views: number;
  shares_count: number;
  public_brands_count: number;
  public_cvs_count: number;
  total_brands_count: number;
  total_cvs_count: number;
  unique_viewers: number;
  recent_views_30d: number;
  recent_engagements_30d: number;
  avg_views_per_day: number;
  engagement_rate: number;
  growth_trend: 'up' | 'down' | 'stable';
  top_content: Array<{
    id: string;
    title: string;
    type: 'brand' | 'cv';
    engagement_count: number;
  }>;
  viewer_insights: {
    top_referrers: Array<{ referrer: string; count: number }>;
    total_unique_viewers: number;
  };
}

export const useProfileAnalytics = (userId?: string) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (userId && !isInitialized) {
      profileTracker.initialize(userId);
      setIsInitialized(true);
    }
  }, [userId, isInitialized]);

  // Fetch enhanced analytics
  const {
    data: enhancedAnalytics,
    isLoading: isLoadingEnhanced,
    refetch: refetchAnalytics
  } = useQuery({
    queryKey: ['enhanced-profile-analytics', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID provided');
      return await profileTracker.getProfileAnalytics(userId);
    },
    enabled: !!userId && isInitialized,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000 // Consider data stale after 2 minutes
  });

  // Track profile view
  const trackProfileView = async (viewerId?: string) => {
    if (!userId) return;
    return await profileTracker.trackProfileView(userId, viewerId);
  };

  // Track content engagement
  const trackContentEngagement = async (
    contentId: string,
    contentType: 'brand' | 'cv',
    action: 'view' | 'share' | 'download' | 'like',
    metadata?: Record<string, any>
  ) => {
    return await profileTracker.trackContentEngagement(contentId, contentType, action, metadata);
  };

  // Get network insights
  const getNetworkInsights = async () => {
    if (!userId) return null;
    return await profileTracker.getNetworkInsights(userId);
  };

  return {
    enhancedAnalytics,
    isLoadingEnhanced,
    refetchAnalytics,
    trackProfileView,
    trackContentEngagement,
    getNetworkInsights,
    isInitialized
  };
};