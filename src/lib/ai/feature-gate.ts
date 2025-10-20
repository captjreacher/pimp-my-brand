import { supabase } from '@/integrations/supabase/client'

export enum AIFeature {
  IMAGE_GENERATION = 'image_generation',
  VOICE_SYNTHESIS = 'voice_synthesis', 
  VIDEO_GENERATION = 'video_generation',
  ADVANCED_EDITING = 'advanced_editing'
}

export enum SubscriptionTier {
  FREE = 'free',
  TIER_1 = 'tier_1', 
  TIER_2 = 'tier_2'
}

export interface UsageLimit {
  monthly: number
  daily: number
  perRequest: number
  costLimit: number // in cents
}

export interface QuotaStatus {
  canUse: boolean
  remaining: number
  resetDate: Date
  reason?: string
}

export class FeatureGate {
  private static featureLimits: Record<SubscriptionTier, Record<AIFeature, UsageLimit>> = {
    [SubscriptionTier.FREE]: {
      [AIFeature.IMAGE_GENERATION]: { monthly: 5, daily: 2, perRequest: 1, costLimit: 100 },
      [AIFeature.VOICE_SYNTHESIS]: { monthly: 0, daily: 0, perRequest: 0, costLimit: 0 },
      [AIFeature.VIDEO_GENERATION]: { monthly: 0, daily: 0, perRequest: 0, costLimit: 0 },
      [AIFeature.ADVANCED_EDITING]: { monthly: 10, daily: 5, perRequest: 1, costLimit: 150 }
    },
    [SubscriptionTier.TIER_1]: {
      [AIFeature.IMAGE_GENERATION]: { monthly: 50, daily: 10, perRequest: 3, costLimit: 1000 },
      [AIFeature.VOICE_SYNTHESIS]: { monthly: 20, daily: 5, perRequest: 1, costLimit: 500 },
      [AIFeature.VIDEO_GENERATION]: { monthly: 0, daily: 0, perRequest: 0, costLimit: 0 },
      [AIFeature.ADVANCED_EDITING]: { monthly: 100, daily: 20, perRequest: 5, costLimit: 700 }
    },
    [SubscriptionTier.TIER_2]: {
      [AIFeature.IMAGE_GENERATION]: { monthly: 200, daily: 30, perRequest: 10, costLimit: 5000 },
      [AIFeature.VOICE_SYNTHESIS]: { monthly: 100, daily: 15, perRequest: 5, costLimit: 2000 },
      [AIFeature.VIDEO_GENERATION]: { monthly: 20, daily: 3, perRequest: 1, costLimit: 3000 },
      [AIFeature.ADVANCED_EDITING]: { monthly: 500, daily: 50, perRequest: 20, costLimit: 1800 }
    }
  }

  static async canAccessFeature(userId: string, feature: AIFeature): Promise<boolean> {
    try {
      const tier = await this.getUserSubscriptionTier(userId)
      const limits = this.featureLimits[tier][feature]
      
      if (limits.monthly === 0) return false
      
      const quota = await this.checkQuota(userId, feature)
      return quota.canUse
    } catch (error) {
      console.error('Error checking feature access:', error)
      return false
    }
  }

  static async getUsageLimit(userId: string, feature: AIFeature): Promise<UsageLimit> {
    const tier = await this.getUserSubscriptionTier(userId)
    return this.featureLimits[tier][feature]
  }

  static async trackUsage(userId: string, feature: AIFeature, cost: number): Promise<void> {
    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    const { error } = await supabase
      .from('ai_usage_tracking')
      .upsert({
        user_id: userId,
        feature,
        usage_count: 1,
        total_cost_cents: cost,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        subscription_tier: await this.getUserSubscriptionTier(userId)
      }, {
        onConflict: 'user_id,feature,period_start',
        ignoreDuplicates: false
      })

    if (error) {
      console.error('Error tracking usage:', error)
      throw error
    }
  }

  static async checkQuota(userId: string, feature: AIFeature): Promise<QuotaStatus> {
    const tier = await this.getUserSubscriptionTier(userId)
    const limits = this.featureLimits[tier][feature]
    
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // Check monthly usage
    const { data: monthlyUsage } = await supabase
      .from('ai_usage_tracking')
      .select('usage_count, total_cost_cents')
      .eq('user_id', userId)
      .eq('feature', feature)
      .gte('period_start', monthStart.toISOString().split('T')[0])
      .single()

    const monthlyCount = monthlyUsage?.usage_count || 0
    const monthlyCost = monthlyUsage?.total_cost_cents || 0

    if (monthlyCount >= limits.monthly) {
      return {
        canUse: false,
        remaining: 0,
        resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        reason: 'Monthly limit exceeded'
      }
    }

    if (monthlyCost >= limits.costLimit) {
      return {
        canUse: false,
        remaining: 0,
        resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        reason: 'Monthly cost limit exceeded'
      }
    }

    // Check daily usage
    const { data: dailyRequests } = await supabase
      .from('ai_generation_requests')
      .select('id')
      .eq('user_id', userId)
      .eq('feature', feature)
      .gte('created_at', dayStart.toISOString())

    const dailyCount = dailyRequests?.length || 0

    if (dailyCount >= limits.daily) {
      return {
        canUse: false,
        remaining: 0,
        resetDate: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000),
        reason: 'Daily limit exceeded'
      }
    }

    return {
      canUse: true,
      remaining: Math.min(limits.monthly - monthlyCount, limits.daily - dailyCount),
      resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1)
    }
  }

  private static async getUserSubscriptionTier(userId: string): Promise<SubscriptionTier> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single()

    return (profile?.subscription_tier as SubscriptionTier) || SubscriptionTier.FREE
  }
}