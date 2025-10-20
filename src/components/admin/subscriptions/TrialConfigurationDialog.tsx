import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Save, AlertCircle } from 'lucide-react';
import { SubscriptionPlan } from './PlanManagementDialog';
import { toast } from 'sonner';

interface TrialConfigurationDialogProps {
  plans: SubscriptionPlan[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateTrialPeriod: (planId: string, trialDays: number) => Promise<void>;
  isLoading?: boolean;
}

interface TrialUpdate {
  planId: string;
  planName: string;
  currentTrialDays: number;
  newTrialDays: number;
}

export function TrialConfigurationDialog({
  plans,
  isOpen,
  onClose,
  onUpdateTrialPeriod,
  isLoading = false
}: TrialConfigurationDialogProps) {
  const [trialUpdates, setTrialUpdates] = useState<TrialUpdate[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen && plans.length > 0) {
      const updates = plans.map(plan => ({
        planId: plan.id,
        planName: plan.name,
        currentTrialDays: plan.trial_days,
        newTrialDays: plan.trial_days,
      }));
      setTrialUpdates(updates);
      setHasChanges(false);
    }
  }, [isOpen, plans]);

  const updateTrialDays = (planId: string, days: number) => {
    setTrialUpdates(prev => prev.map(update => 
      update.planId === planId 
        ? { ...update, newTrialDays: Math.max(0, Math.min(365, days)) }
        : update
    ));
    
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    try {
      const changedPlans = trialUpdates.filter(
        update => update.newTrialDays !== update.currentTrialDays
      );

      if (changedPlans.length === 0) {
        toast.info('No changes to save');
        return;
      }

      // Update all changed plans
      const promises = changedPlans.map(update => 
        onUpdateTrialPeriod(update.planId, update.newTrialDays)
      );

      await Promise.all(promises);
      
      toast.success(`Updated trial periods for ${changedPlans.length} plan(s)`);
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error('Error saving trial periods:', error);
      toast.error('Failed to update trial periods');
    }
  };

  const resetChanges = () => {
    setTrialUpdates(prev => prev.map(update => ({
      ...update,
      newTrialDays: update.currentTrialDays
    })));
    setHasChanges(false);
  };

  const setAllTrialDays = (days: number) => {
    setTrialUpdates(prev => prev.map(update => ({
      ...update,
      newTrialDays: Math.max(0, Math.min(365, days))
    })));
    setHasChanges(true);
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

  const changedPlansCount = trialUpdates.filter(
    update => update.newTrialDays !== update.currentTrialDays
  ).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Configure Trial Periods
          </DialogTitle>
          <DialogDescription>
            Set trial periods for all subscription plans. Trial periods allow users to test premium features before committing to a paid plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
              <CardDescription>Apply trial periods to all plans at once</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setAllTrialDays(7)}
                  size="sm"
                  variant="outline"
                >
                  7 Days
                </Button>
                <Button
                  onClick={() => setAllTrialDays(14)}
                  size="sm"
                  variant="outline"
                >
                  14 Days
                </Button>
                <Button
                  onClick={() => setAllTrialDays(30)}
                  size="sm"
                  variant="outline"
                >
                  30 Days
                </Button>
                <Button
                  onClick={() => setAllTrialDays(0)}
                  size="sm"
                  variant="outline"
                >
                  No Trial
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Individual Plan Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Individual Plan Settings</h3>
            
            {trialUpdates.map((update) => {
              const plan = plans.find(p => p.id === update.planId);
              const hasChanged = update.newTrialDays !== update.currentTrialDays;
              
              return (
                <Card key={update.planId} className={hasChanged ? 'ring-2 ring-primary/20' : ''}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{update.planName}</h4>
                            <Badge className={getTierColor(plan?.tier || '')}>
                              {plan?.tier}
                            </Badge>
                            {hasChanged && (
                              <Badge variant="outline" className="text-primary">
                                Modified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Current: {update.currentTrialDays} days
                            {plan?.price_monthly && plan.price_monthly > 0 && (
                              <span className="ml-2">• ${plan.price_monthly}/month</span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`trial-${update.planId}`} className="text-sm">
                          Trial Days:
                        </Label>
                        <Input
                          id={`trial-${update.planId}`}
                          type="number"
                          min="0"
                          max="365"
                          value={update.newTrialDays}
                          onChange={(e) => updateTrialDays(update.planId, parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                      </div>
                    </div>
                    
                    {hasChanged && (
                      <div className="mt-3 p-2 bg-blue-50 rounded-md">
                        <div className="flex items-center gap-2 text-sm text-blue-700">
                          <AlertCircle className="h-4 w-4" />
                          <span>
                            Trial period will change from {update.currentTrialDays} to {update.newTrialDays} days
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Summary */}
          {hasChanges && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span>
                    {changedPlansCount} plan(s) will be updated with new trial periods
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button
                onClick={resetChanges}
                variant="ghost"
                size="sm"
                disabled={isLoading}
              >
                Reset Changes
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveAll}
              disabled={isLoading || !hasChanges}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : `Save Changes${changedPlansCount > 0 ? ` (${changedPlansCount})` : ''}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}