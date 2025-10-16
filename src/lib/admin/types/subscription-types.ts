import { Database } from '@/integrations/supabase/types';

export type SubscriptionTier = Database['public']['Enums']['subscription_tier'];

export interface AdminSubscriptionView {
  user_id: string;
  user_email: string;
  user_name: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  current_tier: SubscriptionTier;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_ends_at: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionMetrics {
  total_revenue: number;
  active_subscriptions: number;
  churn_rate: number;
  mrr: number; // Monthly Recurring Revenue
  conversion_rate: number;
  trial_conversions: number;
  cancellations_this_month: number;
  new_subscriptions_this_month: number;
}

export interface BillingIssue {
  id: string;
  user_id: string;
  user_email: string;
  subscription_id: string;
  issue_type: 'payment_failed' | 'dispute' | 'refund_request' | 'billing_inquiry';
  description: string;
  amount: number;
  currency: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
}

export interface SubscriptionFilters {
  search: string;
  tier: SubscriptionTier[];
  status: string[];
  dateRange: {
    start: string;
    end: string;
  } | null;
}

export interface RefundRequest {
  subscription_id: string;
  amount?: number; // If not provided, refund full amount
  reason: string;
  notify_customer: boolean;
}

export interface SubscriptionModification {
  subscription_id: string;
  new_tier: SubscriptionTier;
  prorate: boolean;
  effective_date?: string; // If not provided, change immediately
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}