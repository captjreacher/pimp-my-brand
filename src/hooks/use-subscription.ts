import { useState, useEffect } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { SubscriptionService, Subscription, UsageLimit } from '@/lib/subscription-service';

export function useSubscription() {
  const user = useUser();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSubscription();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user]);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let sub = await SubscriptionService.getUserSubscription(user?.id);
      
      // If no subscription exists, create a default one
      if (!sub && user) {
        sub = await SubscriptionService.createDefaultSubscription(user.id);
      }
      
      setSubscription(sub);
    } catch (err) {
      console.error('Error loading subscription:', err);
      setError('Failed to load subscription');
      // Set default subscription on error
      if (user) {
        setSubscription({
          id: 'default',
          user_id: user.id,
          status: 'active',
          plan: 'free',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const checkUsageLimit = async (action: string): Promise<boolean> => {
    if (!user) return false;
    return await SubscriptionService.checkUsageLimit(action, user.id);
  };

  const trackUsage = async (action: string, count: number = 1): Promise<void> => {
    if (!user) return;
    await SubscriptionService.trackUsage(action, count, user.id);
  };

  const getPlanLimits = (): UsageLimit => {
    return SubscriptionService.getPlanLimits(subscription?.plan || 'free');
  };

  const isFeatureAvailable = (feature: string): boolean => {
    if (!subscription) return false;
    
    // All features available for premium
    if (subscription.plan === 'premium') return true;
    
    // Basic features for free and pro
    const basicFeatures = ['brand_creation', 'cv_creation', 'basic_templates'];
    if (basicFeatures.includes(feature)) return true;
    
    // Pro features
    const proFeatures = ['advanced_templates', 'custom_branding', 'export_options'];
    if (subscription.plan === 'pro' && proFeatures.includes(feature)) return true;
    
    return false;
  };

  return {
    subscription,
    loading,
    error,
    checkUsageLimit,
    trackUsage,
    getPlanLimits,
    isFeatureAvailable,
    refresh: loadSubscription
  };
}