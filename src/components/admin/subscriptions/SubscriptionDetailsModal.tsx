import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  CreditCard, 
  Calendar, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  RefreshCw 
} from 'lucide-react';
import { AdminSubscriptionView } from '@/lib/admin/types/subscription-types';
import { format } from 'date-fns';

interface SubscriptionDetailsModalProps {
  subscription: AdminSubscriptionView | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

interface BillingHistoryItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: string;
  description: string;
  invoice_url?: string;
}

export function SubscriptionDetailsModal({
  subscription,
  isOpen,
  onClose,
  onRefresh,
}: SubscriptionDetailsModalProps) {
  const [billingHistory] = useState<BillingHistoryItem[]>([
    // Mock data - in real implementation, this would be fetched
    {
      id: 'in_1234567890',
      amount: 2900,
      currency: 'usd',
      status: 'paid',
      created: '2024-01-15T10:00:00Z',
      description: 'Pro subscription',
      invoice_url: 'https://invoice.stripe.com/i/acct_123/test_456',
    },
    {
      id: 'in_0987654321',
      amount: 2900,
      currency: 'usd',
      status: 'paid',
      created: '2023-12-15T10:00:00Z',
      description: 'Pro subscription',
      invoice_url: 'https://invoice.stripe.com/i/acct_123/test_789',
    },
  ]);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      active: { variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
      trialing: { variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      past_due: { variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" /> },
      canceled: { variant: 'outline', icon: <CheckCircle className="h-3 w-3" /> },
      unpaid: { variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" /> },
      incomplete: { variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" /> },
    };

    const config = variants[status] || variants.active;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      free: 'bg-gray-100 text-gray-800',
      pro: 'bg-blue-100 text-blue-800',
      elite: 'bg-purple-100 text-purple-800',
    };

    return (
      <Badge className={colors[tier] || colors.free}>
        {tier.toUpperCase()}
      </Badge>
    );
  };

  const getInvoiceStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      paid: 'default',
      open: 'secondary',
      void: 'outline',
      uncollectible: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (!subscription) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Subscription Details
              </DialogTitle>
              <DialogDescription>
                Complete subscription information for {subscription.user_email}
              </DialogDescription>
            </div>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="billing">Billing History</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-sm">{subscription.user_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm">{subscription.user_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User ID</label>
                  <p className="text-sm font-mono">{subscription.user_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Customer ID</label>
                  <p className="text-sm font-mono">{subscription.stripe_customer_id || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Subscription Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Current Tier</label>
                    <div className="mt-1">
                      {getTierBadge(subscription.current_tier)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      {getStatusBadge(subscription.status)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Subscription ID</label>
                    <p className="text-sm font-mono">{subscription.stripe_subscription_id || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Price ID</label>
                    <p className="text-sm font-mono">{subscription.stripe_price_id || 'N/A'}</p>
                  </div>
                </div>

                {/* Billing Period */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Current Period Start</label>
                    <p className="text-sm">
                      {subscription.current_period_start 
                        ? format(new Date(subscription.current_period_start), 'PPP')
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Current Period End</label>
                    <p className="text-sm">
                      {subscription.current_period_end 
                        ? format(new Date(subscription.current_period_end), 'PPP')
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>

                {/* Trial Information */}
                {subscription.trial_ends_at && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Trial Ends</label>
                    <p className="text-sm">
                      {format(new Date(subscription.trial_ends_at), 'PPP')}
                    </p>
                  </div>
                )}

                {/* Cancellation Information */}
                {subscription.canceled_at && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Canceled At</label>
                    <p className="text-sm">
                      {format(new Date(subscription.canceled_at), 'PPP')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timestamps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm">
                    {format(new Date(subscription.created_at), 'PPP')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-sm">
                    {format(new Date(subscription.updated_at), 'PPP')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing History Tab */}
          <TabsContent value="billing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Billing History
                </CardTitle>
                <CardDescription>
                  Payment history and invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                {billingHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No billing history</h3>
                    <p className="text-muted-foreground">
                      No payment records found for this subscription.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {billingHistory.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {formatCurrency(invoice.amount, invoice.currency)}
                            </span>
                            {getInvoiceStatusBadge(invoice.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {invoice.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(invoice.created), 'PPP')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {invoice.invoice_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(invoice.invoice_url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Invoice
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Activity Log
                </CardTitle>
                <CardDescription>
                  Recent subscription changes and admin actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No activity logged</h3>
                  <p className="text-muted-foreground">
                    Activity logging will be implemented in a future update.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}