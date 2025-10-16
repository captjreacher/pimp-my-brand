import Stripe from 'stripe';
import { supabase } from '@/integrations/supabase/client';
import { RefundRequest, SubscriptionModification } from './types/subscription-types';

// Initialize Stripe with server-side key (this would typically be in a server environment)
// For demo purposes, we'll use a placeholder - in production this should be server-side only
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-09-30.clover',
});

export class StripeAdminService {
  /**
   * Get customer details from Stripe
   */
  static async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      return customer as Stripe.Customer;
    } catch (error) {
      console.error('Error fetching Stripe customer:', error);
      return null;
    }
  }

  /**
   * Get subscription details from Stripe
   */
  static async getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error fetching Stripe subscription:', error);
      return null;
    }
  }

  /**
   * Process a refund for a customer
   */
  static async processRefund(request: RefundRequest): Promise<Stripe.Refund | null> {
    try {
      // First get the subscription to find the latest invoice
      const subscription = await stripe.subscriptions.retrieve(request.subscription_id);
      if (!subscription.latest_invoice) {
        throw new Error('No invoice found for subscription');
      }

      // Get the invoice to find the payment intent
      const invoice = await stripe.invoices.retrieve(subscription.latest_invoice as string);
      const paymentIntent = (invoice as any).payment_intent;
      if (!paymentIntent) {
        throw new Error('No payment intent found for invoice');
      }

      // Create the refund
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntent as string,
        amount: request.amount, // If undefined, Stripe will refund the full amount
        reason: 'requested_by_customer',
        metadata: {
          admin_reason: request.reason,
          subscription_id: request.subscription_id,
        },
      });

      // If requested, send notification to customer
      if (request.notify_customer && subscription.customer) {
        // In a real implementation, you'd send an email notification here
        console.log(`Refund notification would be sent to customer ${subscription.customer}`);
      }

      return refund;
    } catch (error) {
      console.error('Error processing refund:', error);
      return null;
    }
  }

  /**
   * Modify a subscription (change tier/price)
   */
  static async modifySubscription(modification: SubscriptionModification): Promise<Stripe.Subscription | null> {
    try {
      const subscription = await stripe.subscriptions.retrieve(modification.subscription_id);
      
      // Get the price ID for the new tier (this would be configured in your system)
      const priceId = await this.getPriceIdForTier(modification.new_tier);
      if (!priceId) {
        throw new Error(`No price ID found for tier: ${modification.new_tier}`);
      }

      // Update the subscription
      const updatedSubscription = await stripe.subscriptions.update(modification.subscription_id, {
        items: [{
          id: subscription.items.data[0].id,
          price: priceId,
        }],
        proration_behavior: modification.prorate ? 'create_prorations' : 'none',
        billing_cycle_anchor: modification.effective_date ? 
          Math.floor(new Date(modification.effective_date).getTime() / 1000) as any : 
          undefined,
      });

      return updatedSubscription;
    } catch (error) {
      console.error('Error modifying subscription:', error);
      return null;
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(subscriptionId: string, immediately: boolean = false): Promise<Stripe.Subscription | null> {
    try {
      if (immediately) {
        // Cancel immediately
        const subscription = await stripe.subscriptions.cancel(subscriptionId);
        return subscription;
      } else {
        // Cancel at period end
        const subscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
        return subscription;
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return null;
    }
  }

  /**
   * Reactivate a canceled subscription
   */
  static async reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });
      return subscription;
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      return null;
    }
  }

  /**
   * Get billing history for a customer
   */
  static async getBillingHistory(customerId: string, limit: number = 10): Promise<Stripe.Invoice[]> {
    try {
      const invoices = await stripe.invoices.list({
        customer: customerId,
        limit,
        status: 'paid',
      });
      return invoices.data;
    } catch (error) {
      console.error('Error fetching billing history:', error);
      return [];
    }
  }

  /**
   * Get failed payments for a customer
   */
  static async getFailedPayments(customerId: string): Promise<Stripe.Invoice[]> {
    try {
      const invoices = await stripe.invoices.list({
        customer: customerId,
        status: 'open',
      });
      return invoices.data.filter(invoice => invoice.attempt_count > 0);
    } catch (error) {
      console.error('Error fetching failed payments:', error);
      return [];
    }
  }

  /**
   * Get price ID for a subscription tier
   * In a real implementation, this would be stored in your database or config
   */
  private static async getPriceIdForTier(tier: string): Promise<string | null> {
    const priceMap: Record<string, string> = {
      'free': '', // Free tier doesn't have a Stripe price
      'pro': process.env.STRIPE_PRO_PRICE_ID || 'price_pro_placeholder',
      'elite': process.env.STRIPE_ELITE_PRICE_ID || 'price_elite_placeholder',
    };
    
    return priceMap[tier] || null;
  }

  /**
   * Sync subscription data from Stripe to local database
   */
  static async syncSubscriptionFromStripe(subscriptionId: string): Promise<boolean> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const customer = await stripe.customers.retrieve(subscription.customer as string);
      
      // Find the user by Stripe customer ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', (customer as Stripe.Customer).email)
        .single();

      if (!profile) {
        console.error('User not found for Stripe customer:', customer.id);
        return false;
      }

      // Update the subscription in our database
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: profile.id,
          stripe_customer_id: customer.id,
          stripe_subscription_id: subscription.id,
          stripe_price_id: subscription.items.data[0]?.price.id,
          status: subscription.status,
          current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
          current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
          tier: this.mapStripePriceToTier(subscription.items.data[0]?.price.id),
          updated_at: new Date().toISOString(),
        });

      return !error;
    } catch (error) {
      console.error('Error syncing subscription from Stripe:', error);
      return false;
    }
  }

  /**
   * Map Stripe price ID to our subscription tier
   */
  private static mapStripePriceToTier(priceId: string | undefined): 'free' | 'pro' | 'elite' {
    if (!priceId) return 'free';
    
    // This mapping would be configured based on your Stripe setup
    if (priceId.includes('pro')) return 'pro';
    if (priceId.includes('elite')) return 'elite';
    return 'free';
  }
}