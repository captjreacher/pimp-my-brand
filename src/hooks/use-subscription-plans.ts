import { useState, useEffect } from 'react';
import { SubscriptionPlan } from '@/components/admin/subscriptions/PlanManagementDialog';
import { SubscriptionPlansService } from '@/lib/admin/subscription-plans-service';
import { toast } from 'sonner';

export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [activePlans, setActivePlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const allPlans = await SubscriptionPlansService.getAllPlans();
      setPlans(allPlans);
      
      const activeOnly = await SubscriptionPlansService.getActivePlans();
      setActivePlans(activeOnly);
    } catch (err) {
      console.error('Error loading subscription plans:', err);
      setError('Failed to load subscription plans');
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async (planData: Partial<SubscriptionPlan>) => {
    try {
      setLoading(true);
      const newPlan = await SubscriptionPlansService.createPlan(planData);
      if (newPlan) {
        setPlans(prev => [newPlan, ...prev]);
        if (newPlan.is_active) {
          setActivePlans(prev => [...prev, newPlan].sort((a, b) => a.price_monthly - b.price_monthly));
        }
        toast.success('Plan created successfully');
        return newPlan;
      }
    } catch (err) {
      console.error('Error creating plan:', err);
      toast.error('Failed to create plan');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePlan = async (planId: string, planData: Partial<SubscriptionPlan>) => {
    try {
      setLoading(true);
      const updatedPlan = await SubscriptionPlansService.updatePlan(planId, planData);
      if (updatedPlan) {
        setPlans(prev => prev.map(p => p.id === planId ? updatedPlan : p));
        
        // Update active plans list
        if (updatedPlan.is_active) {
          setActivePlans(prev => {
            const filtered = prev.filter(p => p.id !== planId);
            return [...filtered, updatedPlan].sort((a, b) => a.price_monthly - b.price_monthly);
          });
        } else {
          setActivePlans(prev => prev.filter(p => p.id !== planId));
        }
        
        toast.success('Plan updated successfully');
        return updatedPlan;
      }
    } catch (err) {
      console.error('Error updating plan:', err);
      toast.error('Failed to update plan');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (planId: string) => {
    try {
      setLoading(true);
      await SubscriptionPlansService.deletePlan(planId);
      setPlans(prev => prev.filter(p => p.id !== planId));
      setActivePlans(prev => prev.filter(p => p.id !== planId));
      toast.success('Plan deleted successfully');
    } catch (err) {
      console.error('Error deleting plan:', err);
      toast.error('Failed to delete plan');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const togglePlanStatus = async (planId: string, isActive: boolean) => {
    try {
      setLoading(true);
      await SubscriptionPlansService.togglePlanStatus(planId, isActive);
      
      setPlans(prev => prev.map(p => 
        p.id === planId ? { ...p, is_active: isActive } : p
      ));

      if (isActive) {
        const plan = plans.find(p => p.id === planId);
        if (plan) {
          setActivePlans(prev => [...prev, { ...plan, is_active: true }]
            .sort((a, b) => a.price_monthly - b.price_monthly));
        }
      } else {
        setActivePlans(prev => prev.filter(p => p.id !== planId));
      }

      toast.success(`Plan ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      console.error('Error toggling plan status:', err);
      toast.error('Failed to update plan status');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTrialPeriod = async (planId: string, trialDays: number) => {
    try {
      setLoading(true);
      await SubscriptionPlansService.updateTrialPeriod(planId, trialDays);
      
      setPlans(prev => prev.map(p => 
        p.id === planId ? { ...p, trial_days: trialDays } : p
      ));
      
      setActivePlans(prev => prev.map(p => 
        p.id === planId ? { ...p, trial_days: trialDays } : p
      ));

      toast.success('Trial period updated successfully');
    } catch (err) {
      console.error('Error updating trial period:', err);
      toast.error('Failed to update trial period');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const duplicatePlan = async (planId: string, newName: string) => {
    try {
      setLoading(true);
      const duplicatedPlan = await SubscriptionPlansService.duplicatePlan(planId, newName);
      if (duplicatedPlan) {
        setPlans(prev => [duplicatedPlan, ...prev]);
        toast.success('Plan duplicated successfully');
        return duplicatedPlan;
      }
    } catch (err) {
      console.error('Error duplicating plan:', err);
      toast.error('Failed to duplicate plan');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getPlanByTier = (tier: string): SubscriptionPlan | undefined => {
    return activePlans.find(plan => plan.tier === tier);
  };

  const getPopularPlans = (): SubscriptionPlan[] => {
    return activePlans.filter(plan => plan.is_popular);
  };

  const getPlanStats = () => {
    return {
      total: plans.length,
      active: activePlans.length,
      inactive: plans.length - activePlans.length,
      popular: plans.filter(p => p.is_popular).length,
      withTrial: plans.filter(p => p.trial_days > 0).length,
      averageTrialDays: plans.length > 0 
        ? Math.round(plans.reduce((sum, p) => sum + p.trial_days, 0) / plans.length)
        : 0,
      priceRange: {
        min: Math.min(...activePlans.map(p => p.price_monthly).filter(p => p > 0)),
        max: Math.max(...activePlans.map(p => p.price_monthly))
      }
    };
  };

  useEffect(() => {
    loadPlans();
  }, []);

  return {
    plans,
    activePlans,
    loading,
    error,
    loadPlans,
    createPlan,
    updatePlan,
    deletePlan,
    togglePlanStatus,
    updateTrialPeriod,
    duplicatePlan,
    getPlanByTier,
    getPopularPlans,
    getPlanStats,
  };
}