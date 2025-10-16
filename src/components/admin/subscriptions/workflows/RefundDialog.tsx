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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, DollarSign } from 'lucide-react';
import { AdminSubscriptionView, RefundRequest } from '@/lib/admin/types/subscription-types';
import { toast } from 'sonner';

interface RefundDialogProps {
  subscription: AdminSubscriptionView | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (request: RefundRequest) => void;
  isProcessing?: boolean;
}

export function RefundDialog({
  subscription,
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
}: RefundDialogProps) {
  const [refundAmount, setRefundAmount] = useState('');
  const [reason, setReason] = useState('');
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [isPartialRefund, setIsPartialRefund] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subscription) return;
    
    if (!reason.trim()) {
      toast.error('Please provide a reason for the refund');
      return;
    }

    if (isPartialRefund && (!refundAmount || parseFloat(refundAmount) <= 0)) {
      toast.error('Please enter a valid refund amount');
      return;
    }

    const request: RefundRequest = {
      subscription_id: subscription.stripe_subscription_id || subscription.user_id,
      amount: isPartialRefund ? Math.round(parseFloat(refundAmount) * 100) : undefined, // Convert to cents
      reason: reason.trim(),
      notify_customer: notifyCustomer,
    };

    onConfirm(request);
  };

  const handleClose = () => {
    setRefundAmount('');
    setReason('');
    setNotifyCustomer(true);
    setIsPartialRefund(false);
    onClose();
  };

  const getSubscriptionAmount = (tier: string) => {
    const amounts = { free: 0, pro: 29, elite: 99 };
    return amounts[tier as keyof typeof amounts] || 0;
  };

  if (!subscription) return null;

  const subscriptionAmount = getSubscriptionAmount(subscription.current_tier);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Process Refund
          </DialogTitle>
          <DialogDescription>
            Process a refund for {subscription.user_email}'s subscription
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Subscription Info */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{subscription.user_name}</span>
              <Badge>{subscription.current_tier.toUpperCase()}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {subscription.user_email}
            </div>
            <div className="text-sm">
              Current subscription: ${subscriptionAmount}/month
            </div>
          </div>

          {/* Refund Type */}
          <div className="space-y-3">
            <Label>Refund Type</Label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="refundType"
                  checked={!isPartialRefund}
                  onChange={() => setIsPartialRefund(false)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Full refund (${subscriptionAmount})</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="refundType"
                  checked={isPartialRefund}
                  onChange={() => setIsPartialRefund(true)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Partial refund</span>
              </label>
            </div>
          </div>

          {/* Partial Refund Amount */}
          {isPartialRefund && (
            <div className="space-y-2">
              <Label htmlFor="refundAmount">Refund Amount ($)</Label>
              <Input
                id="refundAmount"
                type="number"
                step="0.01"
                min="0.01"
                max={subscriptionAmount}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="Enter amount to refund"
                required={isPartialRefund}
              />
              <p className="text-xs text-muted-foreground">
                Maximum refundable amount: ${subscriptionAmount}
              </p>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Refund *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this refund is being processed..."
              rows={3}
              required
            />
          </div>

          {/* Notify Customer */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="notifyCustomer"
              checked={notifyCustomer}
              onCheckedChange={(checked) => setNotifyCustomer(checked as boolean)}
            />
            <Label htmlFor="notifyCustomer" className="text-sm">
              Send refund notification to customer
            </Label>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Important:</p>
              <p>
                This action will process a refund through Stripe and cannot be undone. 
                The customer's subscription status may be affected.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? 'Processing...' : 'Process Refund'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}