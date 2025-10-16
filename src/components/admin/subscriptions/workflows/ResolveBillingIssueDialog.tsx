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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CheckCircle, 
  AlertTriangle, 
  CreditCard, 
  DollarSign,
  Clock,
  XCircle 
} from 'lucide-react';
import { BillingIssue } from '@/lib/admin/types/subscription-types';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ResolveBillingIssueDialogProps {
  issue: BillingIssue | null;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (issueId: string, resolution: BillingIssueResolution) => void;
  isProcessing?: boolean;
}

interface BillingIssueResolution {
  status: 'resolved' | 'closed';
  resolution_notes: string;
  action_taken?: string;
}

export function ResolveBillingIssueDialog({
  issue,
  isOpen,
  onClose,
  onResolve,
  isProcessing,
}: ResolveBillingIssueDialogProps) {
  const [resolutionStatus, setResolutionStatus] = useState<'resolved' | 'closed'>('resolved');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('');

  const resolutionOptions = [
    { value: 'resolved', label: 'Resolved', description: 'Issue has been successfully resolved' },
    { value: 'closed', label: 'Closed', description: 'Issue closed without resolution' },
  ];

  const actionOptions = [
    'Processed refund',
    'Updated payment method',
    'Contacted customer',
    'Escalated to Stripe',
    'Applied account credit',
    'Waived fees',
    'Updated subscription',
    'Other (see notes)',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!issue) return;
    
    if (!resolutionNotes.trim()) {
      toast.error('Please provide resolution notes');
      return;
    }

    const resolution: BillingIssueResolution = {
      status: resolutionStatus,
      resolution_notes: resolutionNotes.trim(),
      action_taken: actionTaken || undefined,
    };

    onResolve(issue.id, resolution);
  };

  const handleClose = () => {
    setResolutionStatus('resolved');
    setResolutionNotes('');
    setActionTaken('');
    onClose();
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'payment_failed':
        return <CreditCard className="h-4 w-4 text-red-500" />;
      case 'dispute':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'refund_request':
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getIssueTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      payment_failed: 'Payment Failed',
      dispute: 'Dispute',
      refund_request: 'Refund Request',
      billing_inquiry: 'Billing Inquiry',
    };
    return labels[type] || type;
  };

  if (!issue) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIssueIcon(issue.issue_type)}
            Resolve Billing Issue
          </DialogTitle>
          <DialogDescription>
            Resolve the billing issue for {issue.user_email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Issue Details */}
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">{issue.user_email}</span>
              <Badge variant="outline">
                {getIssueTypeLabel(issue.issue_type)}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Amount:</span>
                <div className="font-medium">
                  {formatCurrency(issue.amount, issue.currency)}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>
                <div className="font-medium">
                  {format(new Date(issue.created_at), 'MMM d, yyyy')}
                </div>
              </div>
            </div>

            <div>
              <span className="text-muted-foreground text-sm">Description:</span>
              <p className="text-sm mt-1">{issue.description}</p>
            </div>
          </div>

          {/* Resolution Status */}
          <div className="space-y-2">
            <Label htmlFor="resolutionStatus">Resolution Status</Label>
            <Select value={resolutionStatus} onValueChange={(value) => setResolutionStatus(value as 'resolved' | 'closed')}>
              <SelectTrigger>
                <SelectValue placeholder="Select resolution status" />
              </SelectTrigger>
              <SelectContent>
                {resolutionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(option.value)}
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Taken */}
          <div className="space-y-2">
            <Label htmlFor="actionTaken">Action Taken (Optional)</Label>
            <Select value={actionTaken} onValueChange={setActionTaken}>
              <SelectTrigger>
                <SelectValue placeholder="Select action taken" />
              </SelectTrigger>
              <SelectContent>
                {actionOptions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Resolution Notes */}
          <div className="space-y-2">
            <Label htmlFor="resolutionNotes">Resolution Notes *</Label>
            <Textarea
              id="resolutionNotes"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Describe how this issue was resolved, what actions were taken, and any follow-up required..."
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              These notes will be saved for audit purposes and future reference.
            </p>
          </div>

          {/* Resolution Preview */}
          <div className="p-3 border rounded-lg bg-green-50 border-green-200">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(resolutionStatus)}
              <span className="font-medium text-green-800">
                Issue will be marked as {resolutionStatus}
              </span>
            </div>
            <p className="text-sm text-green-700">
              {resolutionStatus === 'resolved' 
                ? 'This issue will be marked as successfully resolved and removed from the active issues list.'
                : 'This issue will be closed without resolution and archived.'
              }
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? 'Processing...' : `Mark as ${resolutionStatus}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}