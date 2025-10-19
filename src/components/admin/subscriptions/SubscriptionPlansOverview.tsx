import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Edit, 
  Plus, 
  Trash2,
  Star,
  Clock,
  Zap,
  Shield,
  Settings
} from 'lucide-react';
import { SubscriptionPlan } from './PlanManagementDialog';
import { toast } from 'sonner';

interface SubscriptionPlansOverviewProps {
  plans: SubscriptionPlan[];
  onCreatePlan: () => void;
  onEditPlan: (plan: SubscriptionPlan) => void;
  onDeletePlan: (planId: string) => void;
  onTogglePlanStatus: (planId: string, isActive: boolean) => void;
  onConfigureTrials?: () => void;
  isLoading?: boolean;
}

export function SubscriptionPlansOverview({
  plans,
  onCreatePlan,
  onEditPlan,
  onDeletePlan,
  onTogglePlanStatus,
  onConfigureTrials,
  isLoading = false
}: SubscriptionPlansOverviewProps) {
  const [deletingPlan, setDeletingPlan] = useState<string | null>(null);

  const handleDeletePlan = async (planId: string, planName: string) => {
    if (!confirm(`Are you sure you want to delete the "${planName}" plan? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingPlan(planId);
      await onDeletePlan(planId);
      toast.success('Plan deleted successfully');
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Failed to delete plan');
    } finally {
      setDeletingPlan(null);
    }
  };

  const handleToggleStatus = async (planId: string, currentStatus: boolean) => {
    try {
      await onTogglePlanStatus(planId, !currentStatus);
      toast.success(`Plan ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
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

  const getYearlySavings = (monthly: number, yearly: number) => {
    if (monthly === 0 || yearly === 0) return null;
    const savings = (monthly * 12) - yearly;
    const percentage = (savings / (monthly * 12)) * 100;
    return { amount: savings, percentage };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Subscription Plans</h2>
          <p className="text-muted-foreground">
            Manage your subscription plans, pricing, and features
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onConfigureTrials && plans.length > 0 && (
            <Button onClick={onConfigureTrials} variant="outline" disabled={isLoading}>
              <Clock className="h-4 w-4 mr-2" />
              Configure Trials
            </Button>
          )}
          <Button onClick={onCreatePlan} disabled={isLoading}>
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const savings = getYearlySavings(plan.price_monthly, plan.price_yearly);
          
          return (
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
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={plan.is_active}
                      onCheckedChange={() => handleToggleStatus(plan.id, plan.is_active)}
                      disabled={isLoading}
                    />
                  </div>
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
                      {savings && (
                        <span className="text-green-600 font-medium ml-2">
                          Save ${savings.amount.toFixed(2)} ({savings.percentage.toFixed(0)}%)
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

                {/* Key Features */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Key Features:</h4>
                  <div className="space-y-1">
                    {plan.features?.filter(f => f.included).slice(0, 4).map((feature) => (
                      <div key={feature.id} className="flex items-center gap-2 text-sm">
                        <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                        <span>{feature.name}</span>
                        {feature.limit && (
                          <Badge variant="secondary" className="text-xs">
                            {feature.limit}
                          </Badge>
                        )}
                      </div>
                    ))}
                    {plan.features?.filter(f => f.included).length > 4 && (
                      <div className="text-xs text-muted-foreground">
                        +{plan.features.filter(f => f.included).length - 4} more features
                      </div>
                    )}
                  </div>
                </div>

                {/* Usage Limits */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Usage Limits:
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Brands:</span>
                      <span className="ml-1 font-medium">
                        {plan.limits.brands_per_month === -1 ? '∞' : plan.limits.brands_per_month}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">CVs:</span>
                      <span className="ml-1 font-medium">
                        {plan.limits.cvs_per_month === -1 ? '∞' : plan.limits.cvs_per_month}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">AI Gen:</span>
                      <span className="ml-1 font-medium">
                        {plan.limits.ai_generations_per_month === -1 ? '∞' : plan.limits.ai_generations_per_month}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Storage:</span>
                      <span className="ml-1 font-medium">
                        {plan.limits.storage_mb >= 1000 
                          ? `${(plan.limits.storage_mb / 1000).toFixed(1)}GB`
                          : `${plan.limits.storage_mb}MB`
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    onClick={() => onEditPlan(plan)}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  
                  <Button
                    onClick={() => handleDeletePlan(plan.id, plan.name)}
                    size="sm"
                    variant="outline"
                    disabled={isLoading || deletingPlan === plan.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span>Status: {plan.is_active ? 'Active' : 'Inactive'}</span>
                  <span>Updated: {new Date(plan.updated_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Empty State */}
        {plans.length === 0 && !isLoading && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No subscription plans</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first subscription plan to start managing pricing and features.
              </p>
              <Button onClick={onCreatePlan}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Plan
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Stats */}
      {plans.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total Plans</span>
              </div>
              <p className="text-2xl font-bold">{plans.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Active Plans</span>
              </div>
              <p className="text-2xl font-bold">{plans.filter(p => p.is_active).length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Popular Plans</span>
              </div>
              <p className="text-2xl font-bold">{plans.filter(p => p.is_popular).length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Avg Trial Days</span>
              </div>
              <p className="text-2xl font-bold">
                {plans.length > 0 
                  ? Math.round(plans.reduce((sum, p) => sum + p.trial_days, 0) / plans.length)
                  : 0
                }
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}