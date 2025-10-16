import { SubscriptionManagementAPI } from './subscription-management-api';
import { SubscriptionFilters, RefundRequest, SubscriptionModification } from '../types/subscription-types';

/**
 * Admin API routes for subscription management
 * These would typically be server-side API endpoints
 * For demo purposes, they're implemented as client-side functions
 */

export const subscriptionRoutes = {
  /**
   * GET /admin/subscriptions
   */
  async getSubscriptions(params: {
    page?: number;
    limit?: number;
    filters?: Partial<SubscriptionFilters>;
  }) {
    try {
      const { page = 1, limit = 20, filters = {} } = params;
      return await SubscriptionManagementAPI.getSubscriptions(filters, page, limit);
    } catch (error) {
      console.error('Error in getSubscriptions route:', error);
      throw error;
    }
  },

  /**
   * GET /admin/subscriptions/metrics
   */
  async getMetrics() {
    try {
      return await SubscriptionManagementAPI.getSubscriptionMetrics();
    } catch (error) {
      console.error('Error in getMetrics route:', error);
      throw error;
    }
  },

  /**
   * GET /admin/subscriptions/billing-issues
   */
  async getBillingIssues() {
    try {
      return await SubscriptionManagementAPI.getBillingIssues();
    } catch (error) {
      console.error('Error in getBillingIssues route:', error);
      throw error;
    }
  },

  /**
   * POST /admin/subscriptions/refund
   */
  async processRefund(request: RefundRequest, adminUserId: string) {
    try {
      return await SubscriptionManagementAPI.processRefund(request, adminUserId);
    } catch (error) {
      console.error('Error in processRefund route:', error);
      throw error;
    }
  },

  /**
   * PUT /admin/subscriptions/:id/modify
   */
  async modifySubscription(modification: SubscriptionModification, adminUserId: string) {
    try {
      return await SubscriptionManagementAPI.modifySubscription(modification, adminUserId);
    } catch (error) {
      console.error('Error in modifySubscription route:', error);
      throw error;
    }
  },

  /**
   * DELETE /admin/subscriptions/:id/cancel
   */
  async cancelSubscription(subscriptionId: string, immediately: boolean, adminUserId: string) {
    try {
      return await SubscriptionManagementAPI.cancelSubscription(subscriptionId, immediately, adminUserId);
    } catch (error) {
      console.error('Error in cancelSubscription route:', error);
      throw error;
    }
  },

  /**
   * GET /admin/subscriptions/:userId/billing-history
   */
  async getBillingHistory(userId: string) {
    try {
      return await SubscriptionManagementAPI.getBillingHistory(userId);
    } catch (error) {
      console.error('Error in getBillingHistory route:', error);
      throw error;
    }
  },

  /**
   * POST /admin/subscriptions/:id/sync
   */
  async syncSubscription(subscriptionId: string) {
    try {
      return await SubscriptionManagementAPI.syncSubscriptionData(subscriptionId);
    } catch (error) {
      console.error('Error in syncSubscription route:', error);
      throw error;
    }
  },

  /**
   * GET /admin/subscriptions/:id/details
   */
  async getSubscriptionDetails(subscriptionId: string) {
    try {
      const { data: subscriptions } = await SubscriptionManagementAPI.getSubscriptions({}, 1, 1000);
      const subscription = subscriptions.find(sub => 
        sub.stripe_subscription_id === subscriptionId || sub.user_id === subscriptionId
      );
      
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Get billing history for this user
      const billingHistory = await SubscriptionManagementAPI.getBillingHistory(subscription.user_id);

      return {
        subscription,
        billingHistory,
      };
    } catch (error) {
      console.error('Error in getSubscriptionDetails route:', error);
      throw error;
    }
  },
};