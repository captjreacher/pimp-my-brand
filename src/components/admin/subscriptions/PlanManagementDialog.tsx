import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  DollarSign, 
  Calendar, 
  Users, 
  Zap, 
  Shield, 
  Clock,
  Plus,
  Trash2,
  Save
} from 'lucide-react';
import { toast } from 'sonner';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  tier: 'free' | 'pro' | 'premium' | 'enterprise';
  price_monthly: number;
  price_yearly: number;
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
  trial_days: number;
  features: PlanFeature[];
  limits: PlanLimits;
  is_active: boolean;
  is_popular: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanFeature {
  id: string;
  name: string;
  description: string;
  included: boolean;
  limit?: number;
}

export interface PlanLimits {
  brands_per_month: number;
  cvs_per_month: number;
  ai_generations_per_month: number;
  storage_mb: number;
  team_members: number;
  api_calls_per_month: number;
  priority_support: boolean;
  custom_branding: boolean;
}

interface PlanManagementDialogProps {
  plan?: SubscriptionPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: Partial<SubscriptionPlan>) => Promise<void>;
  isLoading?: boolean;
}

const defaultLimits: PlanLimits = {
  brands_per_month: 3,
  cvs_per_month: 3,
  ai_generations_per_month: 10,
  storage_mb: 100,
  team_members: 1,
  api_calls_per_month: 100,
  priority_support: false,
  custom_branding: false,
};

const defaultFeatures: PlanFeature[] = [
  { id: 'brand_creation', name: 'Brand Creation', description: 'Create personal brands', included: true },
  { id: 'cv_generation', name: 'CV Generation', description: 'Generate professional CVs', included: true },
  { id: 'ai_assistance', name: 'AI Assistance', description: 'AI-powered content generation', included: true },
  { id: 'templates', name: 'Premium Templates', description: 'Access to premium templates', included: false },
  { id: 'analytics', name: 'Analytics Dashboard', description: 'Detailed usage analytics', included: false },
  { id: 'api_access', name: 'API Access', description: 'Programmatic access to features', included: false },
  { id: 'priority_support', name: 'Priority Support', description: '24/7 priority customer support', included: false },
  { id: 'custom_branding', name: 'Custom Branding', description: 'Remove branding and add your own', included: false },
];

export function PlanManagementDialog({ 
  plan, 
  isOpen, 
  onClose, 
  onSave, 
  isLoading = false 
}: PlanManagementDialogProps) {
  const [formData, setFormData] = useState<Partial<SubscriptionPlan>>({
    name: '',
    description: '',
    tier: 'free',
    price_monthly: 0,
    price_yearly: 0,
    trial_days: 7,
    features: [...defaultFeatures],
    limits: { ...defaultLimits },
    is_active: true,
    is_popular: false,
  });

  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (plan) {
      setFormData({
        ...plan,
        features: plan.features?.length ? plan.features : [...defaultFeatures],
        limits: plan.limits || { ...defaultLimits },
      });
    } else {
      setFormData({
        name: '',
        description: '',
        tier: 'free',
        price_monthly: 0,
        price_yearly: 0,
        trial_days: 7,
        features: [...defaultFeatures],
        limits: { ...defaultLimits },
        is_active: true,
        is_popular: false,
      });
    }
  }, [plan, isOpen]);

  const handleSave = async () => {
    try {
      if (!formData.name?.trim()) {
        toast.error('Plan name is required');
        return;
      }

      await onSave(formData);
      toast.success(plan ? 'Plan updated successfully' : 'Plan created successfully');
      onClose();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Failed to save plan');
    }
  };

  const updateFeature = (featureId: string, updates: Partial<PlanFeature>) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features?.map(f => 
        f.id === featureId ? { ...f, ...updates } : f
      ) || []
    }));
  };

  const addCustomFeature = () => {
    const newFeature: PlanFeature = {
      id: `custom_${Date.now()}`,
      name: 'New Feature',
      description: 'Custom feature description',
      included: true,
    };
    
    setFormData(prev => ({
      ...prev,
      features: [...(prev.features || []), newFeature]
    }));
  };

  const removeFeature = (featureId: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features?.filter(f => f.id !== featureId) || []
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {plan ? 'Edit Subscription Plan' : 'Create New Plan'}
          </DialogTitle>
          <DialogDescription>
            Configure subscription plan details, pricing, features, and limits.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="limits">Limits</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
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
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this plan offers..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trial_days" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Trial Days
                </Label>
                <Input
                  id="trial_days"
                  type="number"
                  min="0"
                  max="365"
                  value={formData.trial_days || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, trial_days: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active || false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active Plan</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_popular"
                  checked={formData.is_popular || false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_popular: checked }))}
                />
                <Label htmlFor="is_popular">Popular Plan</Label>
              </div>
            </div>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Monthly Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="price_monthly">Monthly Price ($)</Label>
                    <Input
                      id="price_monthly"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price_monthly || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, price_monthly: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="stripe_price_id_monthly">Stripe Price ID (Monthly)</Label>
                    <Input
                      id="stripe_price_id_monthly"
                      value={formData.stripe_price_id_monthly || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, stripe_price_id_monthly: e.target.value }))}
                      placeholder="price_..."
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Yearly Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="price_yearly">Yearly Price ($)</Label>
                    <Input
                      id="price_yearly"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price_yearly || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, price_yearly: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="stripe_price_id_yearly">Stripe Price ID (Yearly)</Label>
                    <Input
                      id="stripe_price_id_yearly"
                      value={formData.stripe_price_id_yearly || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, stripe_price_id_yearly: e.target.value }))}
                      placeholder="price_..."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {formData.price_monthly && formData.price_yearly && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Yearly Savings</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${((formData.price_monthly * 12) - formData.price_yearly).toFixed(2)}
                      <span className="text-sm font-normal">
                        ({(((formData.price_monthly * 12) - formData.price_yearly) / (formData.price_monthly * 12) * 100).toFixed(0)}% off)
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Plan Features</h3>
              <Button onClick={addCustomFeature} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Feature
              </Button>
            </div>

            <div className="space-y-3">
              {formData.features?.map((feature, index) => (
                <Card key={feature.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      <Switch
                        checked={feature.included}
                        onCheckedChange={(checked) => updateFeature(feature.id, { included: checked })}
                      />
                      
                      <div className="flex-1 space-y-2">
                        <Input
                          value={feature.name}
                          onChange={(e) => updateFeature(feature.id, { name: e.target.value })}
                          placeholder="Feature name"
                        />
                        <Input
                          value={feature.description}
                          onChange={(e) => updateFeature(feature.id, { description: e.target.value })}
                          placeholder="Feature description"
                        />
                        {feature.included && (
                          <Input
                            type="number"
                            value={feature.limit || ''}
                            onChange={(e) => updateFeature(feature.id, { limit: parseInt(e.target.value) || undefined })}
                            placeholder="Limit (optional, leave empty for unlimited)"
                          />
                        )}
                      </div>

                      {feature.id.startsWith('custom_') && (
                        <Button
                          onClick={() => removeFeature(feature.id)}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Limits Tab */}
          <TabsContent value="limits" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Usage Limits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Brands per Month</Label>
                    <Input
                      type="number"
                      min="-1"
                      value={formData.limits?.brands_per_month || 0}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        limits: { ...prev.limits!, brands_per_month: parseInt(e.target.value) || 0 }
                      }))}
                      placeholder="-1 for unlimited"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>CVs per Month</Label>
                    <Input
                      type="number"
                      min="-1"
                      value={formData.limits?.cvs_per_month || 0}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        limits: { ...prev.limits!, cvs_per_month: parseInt(e.target.value) || 0 }
                      }))}
                      placeholder="-1 for unlimited"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>AI Generations per Month</Label>
                    <Input
                      type="number"
                      min="-1"
                      value={formData.limits?.ai_generations_per_month || 0}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        limits: { ...prev.limits!, ai_generations_per_month: parseInt(e.target.value) || 0 }
                      }))}
                      placeholder="-1 for unlimited"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Storage (MB)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.limits?.storage_mb || 0}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        limits: { ...prev.limits!, storage_mb: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Team & Access
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Team Members</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.limits?.team_members || 1}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        limits: { ...prev.limits!, team_members: parseInt(e.target.value) || 1 }
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>API Calls per Month</Label>
                    <Input
                      type="number"
                      min="-1"
                      value={formData.limits?.api_calls_per_month || 0}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        limits: { ...prev.limits!, api_calls_per_month: parseInt(e.target.value) || 0 }
                      }))}
                      placeholder="-1 for unlimited"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.limits?.priority_support || false}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          limits: { ...prev.limits!, priority_support: checked }
                        }))}
                      />
                      <Label>Priority Support</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.limits?.custom_branding || false}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          limits: { ...prev.limits!, custom_branding: checked }
                        }))}
                      />
                      <Label>Custom Branding</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}