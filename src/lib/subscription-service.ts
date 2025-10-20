import { supabase } from '@/integrations/supabase/client';

export interface Subscription {
  id: string;
  user_id: string;
  status: 'active' | 'inactive' | 'cancelled';
  plan: 'free' | 'pro' | 'premium';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  created_at: string;
  updated_at: string;
}

export interface UsageLimit {
  brands_per_month: number;
  cvs_per_month: number;
  ai_generations_per_month: number;
  storage_mb: number;
}

export const PLAN_LIMITS: Record<string, UsageLimit> = {
  free: {
    brands_per_month: 3,
    cvs_per_month: 3,
    ai_generations_per_month: 10,
    storage_mb: 100
  },
  pro: {
    brands_per_month: 20,
    cvs_per_month: 20,
    ai_generations_per_month: 100,
    storage_mb: 1000
  },
  premium: {
    brands_per_month: -1, // unlimited
    cvs_per_month: -1, // unlimited
    ai_generations_per_month: -1, // unlimited
    storage_mb: 10000
  }
};

export class SubscriptionService {
  static async getUserSubscription(userId?: string): Promise<Subscription | null> {
    try {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        userId = user.id;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching subscription:', error);
        // Return default free subscription if none exists
        return {
          id: 'default',
          user_id: userId,
          status: 'active',
          plan: 'free',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      return data;
    } catch (error) {
      console.error('Subscription service error:', error);
      return null;
    }
  }

  static async createDefaultSubscription(userId: string): Promise<Subscription | null> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          status: 'active',
          plan: 'free'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating subscription:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating default subscription:', error);
      return null;
    }
  }

  static async checkUsageLimit(action: string, userId?: string): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) return false;

      const limits = PLAN_LIMITS[subscription.plan] || PLAN_LIMITS.free;
      
      // For unlimited plans
      if (limits.ai_generations_per_month === -1) return true;

      // Check current month usage
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('usage_tracking')
        .select('count')
        .eq('user_id', subscription.user_id)
        .eq('action', action)
        .gte('date', startOfMonth.toISOString().split('T')[0]);

      if (error) {
        console.error('Error checking usage:', error);
        return true; // Allow on error
      }

      const totalUsage = data?.reduce((sum, record) => sum + record.count, 0) || 0;
      
      switch (action) {
        case 'brand_generation':
          return totalUsage < limits.brands_per_month;
        case 'cv_generation':
          return totalUsage < limits.cvs_per_month;
        case 'ai_generation':
          return totalUsage < limits.ai_generations_per_month;
        default:
          return true;
      }
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return true; // Allow on error
    }
  }

  static async trackUsage(action: string, count: number = 1, userId?: string): Promise<void> {
    try {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        userId = user.id;
      }

      const { error } = await supabase
        .from('usage_tracking')
        .insert({
          user_id: userId,
          action,
          count,
          date: new Date().toISOString().split('T')[0]
        });

      if (error) {
        console.error('Error tracking usage:', error);
      }
    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  }

  static getPlanLimits(plan: string): UsageLimit {
    return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  }

  static async getCurrentUsage(userId?: string): Promise<Record<string, number>> {
    try {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return {};
        userId = user.id;
      }

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('usage_tracking')
        .select('action, count')
        .eq('user_id', userId)
        .gte('date', startOfMonth.toISOString().split('T')[0]);

      if (error) {
        console.error('Error fetching usage:', error);
        return {};
      }

      const usage: Record<string, number> = {};
      data?.forEach(record => {
        usage[record.action] = (usage[record.action] || 0) + record.count;
      });

      return usage;
    } catch (error) {
      console.error('Error fetching current usage:', error);
      return {};
    }
  }
}