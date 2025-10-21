import { supabase } from '@/integrations/supabase/client';
import { StripeAdminService } from '../stripe-service';
import { 
  AdminSubscriptionView, 
  SubscriptionMetrics, 
  BillingIssue, 
  SubscriptionFilters,
  RefundRequest,
  SubscriptionModification 
} from '../types/subscription-types';

export class SubscriptionManagementAPI {
  /**
   * Get paginated list of subscriptions with user details
   */
  static async getSubscriptions(
    filters: Partial<SubscriptionFilters> = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: AdminSubscriptionView[]; total: number }> {
    try {
      let query = supabase
        .from('subscriptions')
        .select(`
          *,
          profiles!inner(
            id,
            email,
            full_name
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.search) {
        query = query.or(`profiles.email.ilike.%${filters.search}%,profiles.full_name.ilike.%${filters.search}%`);
      }

      if (filters.tier && filters.tier.length > 0) {
        query = query.in('tier', filters.tier);
      }

      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start)
          .lte('created_at', filters.dateRange.end);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      // Order by most recent
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      const subscriptions: AdminSubscriptionView[] = (data || []).map(sub => ({
        user_id: sub.user_id,
        user_email: (sub.profiles as any).email,
        user_name: (sub.profiles as any).full_name || 'Unknown',
        stripe_customer_id: sub.stripe_customer_id,
        stripe_subscription_id: sub.stripe_subscription_id,
        stripe_price_id: sub.stripe_price_id,
        current_tier: sub.tier,
        status: sub.status,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        trial_ends_at: sub.trial_ends_at,
        canceled_at: sub.canceled_at,
        created_at: sub.created_at,
        updated_at: sub.updated_at,
      }));

      return {
        data: subscriptions,
        total: count || 0,
      };
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      throw error;
    }
  }

  /**
   * Get subscription metrics for dashboard
   */
  static async getSubscriptionMetrics(): Promise<SubscriptionMetrics> {
    try {
      // Get basic subscription counts
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('tier, status, created_at, canceled_at');

      if (error) throw error;

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const activeSubscriptions = subscriptions?.filter(sub => 
        sub.status === 'active' || sub.status === 'trialing'
      ) || [];

      const newThisMonth = subscriptions?.filter(sub => 
        new Date(sub.created_at) >= thisMonth
      ) || [];

      const canceledThisMonth = subscriptions?.filter(sub => 
        sub.canceled_at && new Date(sub.canceled_at) >= thisMonth
      ) || [];

      const lastMonthActive = subscriptions?.filter(sub => {
        const createdDate = new Date(sub.created_at);
        const canceledDate = sub.canceled_at ? new Date(sub.canceled_at) : null;
        return createdDate < thisMonth && (!canceledDate || canceledDate >= lastMonth);
      }) || [];

      // Calculate MRR (simplified - assumes fixed pricing)
      const pricingMap = { free: 0, pro: 29, elite: 99 };
      const mrr = activeSubscriptions.reduce((total, sub) => {
        return total + (pricingMap[sub.tier as keyof typeof pricingMap] || 0);
      }, 0);

      // Calculate churn rate
      const churnRate = lastMonthActive.length > 0 
        ? (canceledThisMonth.length / lastMonthActive.length) * 100 
        : 0;

      // Calculate conversion rate (trials to paid)
      const trialsThisMonth = subscriptions?.filter(sub => 
        sub.status === 'trialing' && new Date(sub.created_at) >= thisMonth
      ) || [];

      const convertedTrials = subscriptions?.filter(sub => 
        sub.status === 'active' && 
        new Date(sub.created_at) >= thisMonth &&
        // Assuming if created this month and active, it was converted from trial
        trialsThisMonth.some(trial => (trial as any).user_id === (sub as any).user_id)
      ) || [];

      const conversionRate = trialsThisMonth.length > 0 
        ? (convertedTrials.length / trialsThisMonth.length) * 100 
        : 0;

      return {
        total_revenue: mrr * 12, // Annualized
        active_subscriptions: activeSubscriptions.length,
        churn_rate: churnRate,
        mrr,
        conversion_rate: conversionRate,
        trial_conversions: convertedTrials.length,
        cancellations_this_month: canceledThisMonth.length,
        new_subscriptions_this_month: newThisMonth.length,
      };
    } catch (error) {
      console.error('Error calculating subscription metrics:', error);
      throw error;
    }
  }

  /**
   * Get billing issues that need admin attention
   */
  static async getBillingIssues(): Promise<BillingIssue[]> {
    try {
      // This would typically come from a dedicated billing_issues table
      // For now, we'll simulate by finding subscriptions with payment issues
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          profiles!inner(email, full_name)
        `)
        .in('status', ['past_due', 'unpaid', 'incomplete']);

      if (error) throw error;

      // Convert to billing issues format
      const issues: BillingIssue[] = (subscriptions || []).map(sub => ({
        id: sub.id,
        user_id: sub.user_id,
        user_email: (sub.profiles as any).email,
        subscription_id: sub.stripe_subscription_id || sub.id,
        issue_type: 'payment_failed' as const,
        description: `Payment failed for ${sub.tier} subscription`,
        amount: sub.tier === 'pro' ? 2900 : sub.tier === 'elite' ? 9900 : 0, // In cents
        currency: 'usd',
        status: 'open' as const,
        created_at: sub.updated_at,
        resolved_at: null,
        resolved_by: null,
        resolution_notes: null,
      }));

      return issues;
    } catch (error) {
      console.error('Error fetching billing issues:', error);
      throw error;
    }
  }

  /**
   * Process a refund through Stripe
   */
  static async processRefund(request: RefundRequest, adminUserId: string): Promise<boolean> {
    try {
      // Process refund through Stripe
      const refund = await StripeAdminService.processRefund(request);
      
      if (!refund) {
        throw new Error('Failed to process refund through Stripe');
      }

      // Log the admin action
      const { error: logError } = await supabase.rpc('log_admin_action', {
        p_admin_user_id: adminUserId,
        p_action_type: 'refund_processed',
        p_target_type: 'subscription',
        p_target_id: request.subscription_id,
        p_details: {
          refund_id: refund.id,
          amount: refund.amount,
          reason: request.reason,
        },
      });

      if (logError) {
        throw logError;
      }

      return true;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Modify a subscription (change tier)
   */
  static async modifySubscription(
    modification: SubscriptionModification, 
    adminUserId: string
  ): Promise<boolean> {
    try {
      // Modify subscription through Stripe
      const updatedSubscription = await StripeAdminService.modifySubscription(modification);
      
      if (!updatedSubscription) {
        throw new Error('Failed to modify subscription through Stripe');
      }

      // Update local database
      const { error } = await supabase
        .from('subscriptions')
        .update({
          tier: modification.new_tier,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', modification.subscription_id);

      if (error) throw error;

      // Log the admin action
      const { error: logError } = await supabase.rpc('log_admin_action', {
        p_admin_user_id: adminUserId,
        p_action_type: 'subscription_modified',
        p_target_type: 'subscription',
        p_target_id: modification.subscription_id,
        p_details: {
          old_tier: 'unknown', // Would need to fetch this
          new_tier: modification.new_tier,
          prorate: modification.prorate,
        },
      });

      if (logError) {
        throw logError;
      }

      return true;
    } catch (error) {
      console.error('Error modifying subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(
    subscriptionId: string, 
    immediately: boolean, 
    adminUserId: string
  ): Promise<boolean> {
    try {
      // Cancel subscription through Stripe
      const canceledSubscription = await StripeAdminService.cancelSubscription(subscriptionId, immediately);
      
      if (!canceledSubscription) {
        throw new Error('Failed to cancel subscription through Stripe');
      }

      // Update local database
      const updateData: any = {
        status: immediately ? 'canceled' : 'active', // If not immediate, it's still active until period end
        updated_at: new Date().toISOString(),
      };

      if (immediately) {
        updateData.canceled_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('stripe_subscription_id', subscriptionId);

      if (error) throw error;

      // Log the admin action
      const { error: logError } = await supabase.rpc('log_admin_action', {
        p_admin_user_id: adminUserId,
        p_action_type: 'subscription_canceled',
        p_target_type: 'subscription',
        p_target_id: subscriptionId,
        p_details: {
          immediately,
          canceled_at: immediately ? new Date().toISOString() : null,
        },
      });

      if (logError) {
        throw logError;
      }

      return true;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Get billing history for a user
   */
  static async getBillingHistory(userId: string): Promise<any[]> {
    try {
      // Get user's Stripe customer ID
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      if (error || !profile) throw new Error('User not found');

      // Get subscription to find Stripe customer ID
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();

      if (!subscription?.stripe_customer_id) {
        return [];
      }

      // Fetch billing history from Stripe
      const invoices = await StripeAdminService.getBillingHistory(subscription.stripe_customer_id);
      
      return invoices.map(invoice => ({
        id: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status,
        created: new Date(invoice.created * 1000).toISOString(),
        description: invoice.description || `${invoice.lines.data[0]?.description || 'Subscription'}`,
        invoice_url: invoice.hosted_invoice_url,
      }));
    } catch (error) {
      console.error('Error fetching billing history:', error);
      throw error;
    }
  }

  /**
   * Sync subscription data from Stripe
   */
  static async syncSubscriptionData(subscriptionId: string): Promise<boolean> {
    try {
      return await StripeAdminService.syncSubscriptionFromStripe(subscriptionId);
    } catch (error) {
      console.error('Error syncing subscription data:', error);
      throw error;
    }
  }
}