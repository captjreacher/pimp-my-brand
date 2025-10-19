import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2,
  Star,
  Clock,
  Save,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  tier: 'free' | 'pro' | 'premium' | 'enterprise';
  price_monthly: number;
  price_yearly: number;
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
  trial_days: number;
  features: any[];
  limits: any;
  is_active: boolean;
  is_popular: boolean;
  created_at: string;
  updated_at: string;
}

export function SimpleSubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tier: 'free' as const,
    price_monthly: 0,
    price_yearly: 0,
    trial_days: 7,
    is_active: true,
    is_popular: false,
  });

  const loadPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (error) {
        console.error('Error loading plans:', error);
        toast.error('Failed to load subscription plans');
        return;
      }

      setPlans(data || []);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleCreatePlan = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      tier: 'free',
      price_monthly: 0,
      price_yearly: 0,
      trial_days: 7,
      is_active: true,
      is_popular: false,
    });
    setShowDialog(true);
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      tier: plan.tier,
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      trial_days: plan.trial_days,
      is_active: plan.is_active,
      is_popular: plan.is_popular,
    });
    setShowDialog(true);
  };

  const handleSavePlan = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error('Plan name is required');
        return;
      }

      const planData = {
        ...formData,
        features: [],
        limits: {
          brands_per_month: formData.tier === 'free' ? 3 : formData.tier === 'pro' ? 20 : -1,
          cvs_per_month: formData.tier === 'free' ? 3 : formData.tier === 'pro' ? 20 : -1,
          ai_generations_per_month: formData.tier === 'free' ? 10 : formData.tier === 'pro' ? 100 : -1,
          storage_mb: formData.tier === 'free' ? 100 : formData.tier === 'pro' ? 1000 : 10000,
          team_members: formData.tier === 'free' ? 1 : formData.tier === 'pro' ? 3 : 10,
          api_calls_per_month: formData.tier === 'free' ? 100 : formData.tier === 'pro' ? 1000 : -1,
          priority_support: formData.tier !== 'free',
          custom_branding: formData.tier === 'premium' || formData.tier === 'enterprise',
        }
      };

      let result;
      if (editingPlan) {
        result = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', editingPlan.id);
      } else {
        result = await supabase
          .from('subscription_plans')
          .insert([planData]);
      }

      if (result.error) {
        console.error('Error saving plan:', result.error);
        toast.error('Failed to save plan');
        return;
      }

      toast.success(editingPlan ? 'Plan updated successfully' : 'Plan created successfully');
      setShowDialog(false);
      loadPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Failed to save plan');
    }
  };

  const handleDeletePlan = async (plan: SubscriptionPlan) => {
    if (!confirm(`Are you sure you want to delete "${plan.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', plan.id);

      if (error) {
        console.error('Error deleting plan:', error);
        toast.error('Failed to delete plan');
        return;
      }

      toast.success('Plan deleted successfully');
      loadPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Failed to delete plan');
    }
  };

  const handleToggleStatus = async (plan: SubscriptionPlan) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: !plan.is_active })
        .eq('id', plan.id);

      if (error) {
        console.error('Error toggling plan status:', error);
        toast.error('Failed to update plan status');
        return;
      }

      toast.success(`Plan ${!plan.is_active ? 'activated' : 'deactivated'} successfully`);
      loadPlans();
    } catch (error) {
      console.error('Error toggling plan status:', error);
      toast.error('Failed to update plan status');
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'pro': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `$${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
          <p className="text-muted-foreground">
            Manage your subscription plans and pricing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadPlans} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreatePlan}>
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.is_popular ? 'ring-2 ring-primary' : ''}`}>
            {plan.is_popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  <Star className="h-3 w-3 mr-1" />
                  Popular
                </Badge>
              </div>
            )}

            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {plan.name}
                    <Badge className={getTierColor(plan.tier)}>
                      {plan.tier}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {plan.description}
                  </CardDescription>
                </div>
                
                <Switch
                  checked={plan.is_active}
                  onCheckedChange={() => handleToggleStatus(plan)}
                />
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Pricing */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    {formatPrice(plan.price_monthly)}
                  </span>
                  {plan.price_monthly > 0 && (
                    <span className="text-muted-foreground">/month</span>
                  )}
                </div>
                
                {plan.price_yearly > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {formatPrice(plan.price_yearly)}/year
                    {plan.price_monthly > 0 && (
                      <span className="text-green-600 font-medium ml-2">
                        Save ${((plan.price_monthly * 12) - plan.price_yearly).toFixed(2)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Trial Period */}
              {plan.trial_days > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {plan.trial_days} day free trial
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  onClick={() => handleEditPlan(plan)}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                
                <Button
                  onClick={() => handleDeletePlan(plan)}
                  size="sm"
                  variant="outline"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                <span>Status: {plan.is_active ? 'Active' : 'Inactive'}</span>
                <span>Updated: {new Date(plan.updated_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Empty State */}
        {plans.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No subscription plans</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first subscription plan to start managing pricing and features.
              </p>
              <Button onClick={handleCreatePlan}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Plan
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Plan Management Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {editingPlan ? 'Edit Subscription Plan' : 'Create New Plan'}
            </DialogTitle>
            <DialogDescription>
              Configure subscription plan details and pricing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Professional Plan"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tier">Tier</Label>
                <Select 
                  value={formData.tier} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tier: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this plan offers..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_monthly">Monthly Price ($)</Label>
                <Input
                  id="price_monthly"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price_monthly}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_monthly: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_yearly">Yearly Price ($)</Label>
                <Input
                  id="price_yearly"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price_yearly}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_yearly: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trial_days">Trial Days</Label>
                <Input
                  id="trial_days"
                  type="number"
                  min="0"
                  max="365"
                  value={formData.trial_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, trial_days: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active Plan</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_popular"
                  checked={formData.is_popular}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_popular: checked }))}
                />
                <Label htmlFor="is_popular">Popular Plan</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePlan}>
              <Save className="h-4 w-4 mr-2" />
              Save Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}