import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Edit, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { AdminSubscriptionView, SubscriptionModification, SubscriptionTier } from '@/lib/admin/types/subscription-types';
import { toast } from 'sonner';

interface ModifySubscriptionDialogProps {
  subscription: AdminSubscriptionView | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (modification: SubscriptionModification) => void;
  isProcessing?: boolean;
}

export function ModifySubscriptionDialog({
  subscription,
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
}: ModifySubscriptionDialogProps) {
  const [newTier, setNewTier] = useState<SubscriptionTier>('free');
  const [prorate, setProrate] = useState(true);
  const [effectiveDate, setEffectiveDate] = useState<Date | undefined>(undefined);
  const [reason, setReason] = useState('');

  const tiers: { value: SubscriptionTier; label: string; price: number; description: string }[] = [
    { value: 'free', label: 'Free', price: 0, description: 'Basic features' },
    { value: 'pro', label: 'Pro', price: 29, description: 'Advanced features' },
    { value: 'elite', label: 'Elite', price: 99, description: 'Premium features' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subscription) return;
    
    if (newTier === subscription.current_tier) {
      toast.error('Please select a different tier');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for the modification');
      return;
    }

    const modification: SubscriptionModification = {
      subscription_id: subscription.stripe_subscription_id || subscription.user_id,
      new_tier: newTier,
      prorate,
      effective_date: effectiveDate?.toISOString(),
    };

    onConfirm(modification);
  };

  const handleClose = () => {
    setNewTier('free');
    setProrate(true);
    setEffectiveDate(undefined);
    setReason('');
    onClose();
  };

  const getCurrentTierInfo = () => {
    return tiers.find(tier => tier.value === subscription?.current_tier);
  };

  const getNewTierInfo = () => {
    return tiers.find(tier => tier.value === newTier);
  };

  const isUpgrade = () => {
    const currentTier = getCurrentTierInfo();
    const selectedTier = getNewTierInfo();
    return (selectedTier?.price || 0) > (currentTier?.price || 0);
  };

  const getPriceChange = () => {
    const currentPrice = getCurrentTierInfo()?.price || 0;
    const newPrice = getNewTierInfo()?.price || 0;
    return newPrice - currentPrice;
  };

  if (!subscription) return null;

  const currentTierInfo = getCurrentTierInfo();
  const newTierInfo = getNewTierInfo();
  const priceChange = getPriceChange();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Modify Subscription
          </DialogTitle>
          <DialogDescription>
            Change the subscription tier for {subscription.user_email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Subscription Info */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{subscription.user_name}</span>
              <Badge>{subscription.current_tier.toUpperCase()}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {subscription.user_email}
            </div>
            <div className="text-sm">
              Current: {currentTierInfo?.label} - ${currentTierInfo?.price}/month
            </div>
          </div>

          {/* New Tier Selection */}
          <div className="space-y-2">
            <Label htmlFor="newTier">New Subscription Tier</Label>
            <Select value={newTier} onValueChange={(value) => setNewTier(value as SubscriptionTier)}>
              <SelectTrigger>
                <SelectValue placeholder="Select new tier" />
              </SelectTrigger>
              <SelectContent>
                {tiers.map((tier) => (
                  <SelectItem 
                    key={tier.value} 
                    value={tier.value}
                    disabled={tier.value === subscription.current_tier}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <span className="font-medium">{tier.label}</span>
                        <span className="text-muted-foreground ml-2">
                          ${tier.price}/month
                        </span>
                      </div>
                      {tier.value === subscription.current_tier && (
                        <Badge variant="outline" className="ml-2">Current</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Change Preview */}
          {newTier !== subscription.current_tier && (
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Price Change</span>
                <div className="flex items-center gap-1">
                  {isUpgrade() ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`font-medium ${isUpgrade() ? 'text-green-600' : 'text-red-600'}`}>
                    {priceChange > 0 ? '+' : ''}${priceChange}/month
                  </span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {currentTierInfo?.label} (${currentTierInfo?.price}) → {newTierInfo?.label} (${newTierInfo?.price})
              </div>
            </div>
          )}

          {/* Proration */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="prorate"
                checked={prorate}
                onCheckedChange={(checked) => setProrate(checked as boolean)}
              />
              <Label htmlFor="prorate" className="text-sm">
                Prorate charges for current billing period
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              {prorate 
                ? 'Customer will be charged/credited for the difference immediately'
                : 'Changes will take effect at the next billing cycle'
              }
            </p>
          </div>

          {/* Effective Date */}
          <div className="space-y-2">
            <Label>Effective Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {effectiveDate ? format(effectiveDate, 'PPP') : 'Immediate (default)'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={effectiveDate}
                  onSelect={setEffectiveDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Leave empty to apply changes immediately
            </p>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Modification *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this subscription is being modified..."
              rows={3}
              required
            />
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Important:</p>
              <p>
                This will modify the customer's subscription in Stripe. 
                {prorate && ' They may be charged or credited immediately.'}
                {!prorate && ' Changes will take effect at the next billing cycle.'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isProcessing || newTier === subscription.current_tier}
            >
              {isProcessing ? 'Processing...' : 'Modify Subscription'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}