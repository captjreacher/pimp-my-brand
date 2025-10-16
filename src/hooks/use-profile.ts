import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { useProfileAnalytics } from "./use-profile-analytics";

type ProfileData = Tables<'profiles'>;

interface ProfileAnalytics {
  profile_views: number;
  brand_views: number;
  cv_views: number;
  shares_count: number;
  public_brands_count: number;
  public_cvs_count: number;
  total_brands_count: number;
  total_cvs_count: number;
}

export const useProfile = (userId?: string) => {
  const queryClient = useQueryClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const targetUserId = userId || currentUserId;
  
  // Use enhanced analytics
  const { 
    enhancedAnalytics, 
    isLoadingEnhanced, 
    trackProfileView, 
    trackContentEngagement 
  } = useProfileAnalytics(targetUserId);

  // Fetch profile data
  const {
    data: profile,
    isLoading: isLoadingProfile,
    error: profileError
  } = useQuery({
    queryKey: ['profile', targetUserId],
    queryFn: async () => {
      if (!targetUserId) throw new Error('No user ID provided');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!targetUserId
  });

  // Fetch profile analytics
  const {
    data: analytics,
    isLoading: isLoadingAnalytics
  } = useQuery({
    queryKey: ['profile-analytics', targetUserId],
    queryFn: async () => {
      if (!targetUserId) throw new Error('No user ID provided');

      // Get brand and CV counts
      const [brandsResult, cvsResult, sharesResult] = await Promise.all([
        supabase
          .from('brands')
          .select('id, visibility')
          .eq('user_id', targetUserId),
        supabase
          .from('cvs')
          .select('id, visibility')
          .eq('user_id', targetUserId),
        supabase
          .from('shares')
          .select('id')
          .eq('user_id', targetUserId)
      ]);

      const brands = brandsResult.data || [];
      const cvs = cvsResult.data || [];
      const shares = sharesResult.data || [];

      return {
        profile_views: 0, // Would need to implement view tracking
        brand_views: 0,   // Would need to implement view tracking
        cv_views: 0,      // Would need to implement view tracking
        shares_count: shares.length,
        public_brands_count: brands.filter(b => b.visibility === 'public').length,
        public_cvs_count: cvs.filter(c => c.visibility === 'public').length,
        total_brands_count: brands.length,
        total_cvs_count: cvs.length
      } as ProfileAnalytics;
    },
    enabled: !!targetUserId
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<ProfileData>) => {
      if (!currentUserId) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', currentUserId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', currentUserId], data);
      queryClient.invalidateQueries({ queryKey: ['profile-analytics', currentUserId] });
    },
    onError: (error) => {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    }
  });

  // Create profile mutation (for new users)
  const createProfileMutation = useMutation({
    mutationFn: async (profileData: Omit<ProfileData, 'id' | 'created_at' | 'updated_at'>) => {
      if (!currentUserId) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: currentUserId,
          ...profileData
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', currentUserId], data);
      queryClient.invalidateQueries({ queryKey: ['profile-analytics', currentUserId] });
    },
    onError: (error) => {
      console.error('Profile creation error:', error);
      toast.error('Failed to create profile');
    }
  });

  // Check if handle is available
  const checkHandleAvailability = async (handle: string): Promise<boolean> => {
    if (!handle || handle.length < 3) return false;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('handle', handle)
        .neq('id', currentUserId || '');

      if (error) throw error;
      return data.length === 0;
    } catch (error) {
      console.error('Handle check error:', error);
      return false;
    }
  };

  // Get public profile by handle
  const getProfileByHandle = async (handle: string): Promise<ProfileData | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('handle', handle)
        .eq('visibility', 'public')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  };

  const updateProfileAsync = async (updates: Partial<ProfileData>) => {
    return new Promise<void>((resolve, reject) => {
      updateProfileMutation.mutate(updates, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error)
      });
    });
  };

  const createProfileAsync = async (profileData: Omit<ProfileData, 'id' | 'created_at' | 'updated_at'>) => {
    return new Promise<void>((resolve, reject) => {
      createProfileMutation.mutate(profileData, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error)
      });
    });
  };

  return {
    profile,
    analytics: enhancedAnalytics || analytics,
    isLoading: isLoadingProfile || isLoadingAnalytics || isLoadingEnhanced,
    isLoadingProfile,
    isLoadingAnalytics,
    error: profileError,
    updateProfile: updateProfileAsync,
    createProfile: createProfileAsync,
    isUpdating: updateProfileMutation.isPending,
    isCreating: createProfileMutation.isPending,
    checkHandleAvailability,
    getProfileByHandle,
    trackProfileView,
    trackContentEngagement
  };
};