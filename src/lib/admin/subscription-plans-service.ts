import { supabase } from '@/integrations/supabase/client';
import { SubscriptionPlan } from '@/components/admin/subscriptions/PlanManagementDialog';

export class SubscriptionPlansService {
  static async getAllPlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching subscription plans:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllPlans:', error);
      return [];
    }
  }

  static async createPlan(planData: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | null> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .insert({
          name: planData.name,
          description: planData.description,
          tier: planData.tier,
          price_monthly: planData.price_monthly,
          price_yearly: planData.price_yearly,
          stripe_price_id_monthly: planData.stripe_price_id_monthly,
          stripe_price_id_yearly: planData.stripe_price_id_yearly,
          trial_days: planData.trial_days,
          features: planData.features,
          limits: planData.limits,
          is_active: planData.is_active,
          is_popular: planData.is_popular,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating subscription plan:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createPlan:', error);
      throw error;
    }
  }

  static async updatePlan(planId: string, planData: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | null> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .update({
          name: planData.name,
          description: planData.description,
          tier: planData.tier,
          price_monthly: planData.price_monthly,
          price_yearly: planData.price_yearly,
          stripe_price_id_monthly: planData.stripe_price_id_monthly,
          stripe_price_id_yearly: planData.stripe_price_id_yearly,
          trial_days: planData.trial_days,
          features: planData.features,
          limits: planData.limits,
          is_active: planData.is_active,
          is_popular: planData.is_popular,
          updated_at: new Date().toISOString(),
        })
        .eq('id', planId)
        .select()
        .single();

      if (error) {
        console.error('Error updating subscription plan:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updatePlan:', error);
      throw error;
    }
  }

  static async deletePlan(planId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) {
        console.error('Error deleting subscription plan:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deletePlan:', error);
      throw error;
    }
  }

  static async togglePlanStatus(planId: string, isActive: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId);

      if (error) {
        console.error('Error toggling plan status:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in togglePlanStatus:', error);
      throw error;
    }
  }

  static async getPlanByTier(tier: string): Promise<SubscriptionPlan | null> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('tier', tier)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching plan by tier:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getPlanByTier:', error);
      return null;
    }
  }

  static async getActivePlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (error) {
        console.error('Error fetching active plans:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getActivePlans:', error);
      return [];
    }
  }

  static async updateTrialPeriod(planId: string, trialDays: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ 
          trial_days: trialDays,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId);

      if (error) {
        console.error('Error updating trial period:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateTrialPeriod:', error);
      throw error;
    }
  }

  static async bulkUpdatePricing(updates: Array<{ planId: string; priceMonthly?: number; priceYearly?: number }>): Promise<void> {
    try {
      const promises = updates.map(update => 
        supabase
          .from('subscription_plans')
          .update({
            ...(update.priceMonthly !== undefined && { price_monthly: update.priceMonthly }),
            ...(update.priceYearly !== undefined && { price_yearly: update.priceYearly }),
            updated_at: new Date().toISOString()
          })
          .eq('id', update.planId)
      );

      const results = await Promise.all(promises);
      
      for (const result of results) {
        if (result.error) {
          console.error('Error in bulk update:', result.error);
          throw result.error;
        }
      }
    } catch (error) {
      console.error('Error in bulkUpdatePricing:', error);
      throw error;
    }
  }

  static async duplicatePlan(planId: string, newName: string): Promise<SubscriptionPlan | null> {
    try {
      // First, get the original plan
      const { data: originalPlan, error: fetchError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (fetchError || !originalPlan) {
        console.error('Error fetching original plan:', fetchError);
        throw fetchError;
      }

      // Create a duplicate with a new name
      const { data, error } = await supabase
        .from('subscription_plans')
        .insert({
          name: newName,
          description: originalPlan.description,
          tier: originalPlan.tier,
          price_monthly: originalPlan.price_monthly,
          price_yearly: originalPlan.price_yearly,
          stripe_price_id_monthly: null, // Clear Stripe IDs for duplicate
          stripe_price_id_yearly: null,
          trial_days: originalPlan.trial_days,
          features: originalPlan.features,
          limits: originalPlan.limits,
          is_active: false, // Start as inactive
          is_popular: false, // Don't duplicate popular status
        })
        .select()
        .single();

      if (error) {
        console.error('Error duplicating plan:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in duplicatePlan:', error);
      throw error;
    }
  }
}