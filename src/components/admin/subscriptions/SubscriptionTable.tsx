import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Ban, 
  RefreshCw, 
  CreditCard,
  AlertTriangle,
  DollarSign 
} from 'lucide-react';
import { AdminSubscriptionView } from '@/lib/admin/types/subscription-types';
import { format } from 'date-fns';

interface SubscriptionTableProps {
  subscriptions: AdminSubscriptionView[];
  selectedSubscriptions: string[];
  onToggleSelection: (subscriptionId: string) => void;
  onSelectAll: () => void;
  onViewDetails: (subscription: AdminSubscriptionView) => void;
  onModifySubscription: (subscription: AdminSubscriptionView) => void;
  onCancelSubscription: (subscription: AdminSubscriptionView) => void;
  onSyncSubscription: (subscription: AdminSubscriptionView) => void;
  onViewBilling: (subscription: AdminSubscriptionView) => void;
  onProcessRefund?: (subscription: AdminSubscriptionView) => void;
  isLoading?: boolean;
}

export function SubscriptionTable({
  subscriptions,
  selectedSubscriptions,
  onToggleSelection,
  onSelectAll,
  onViewDetails,
  onModifySubscription,
  onCancelSubscription,
  onSyncSubscription,
  onViewBilling,
  onProcessRefund,
  isLoading,
}: SubscriptionTableProps) {
  const formatCurrency = (tier: string) => {
    const prices = { free: '$0', pro: '$29', elite: '$99' };
    return prices[tier as keyof typeof prices] || '$0';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      trialing: 'secondary',
      past_due: 'destructive',
      canceled: 'outline',
      unpaid: 'destructive',
      incomplete: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
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

  const isAllSelected = subscriptions.length > 0 && 
    subscriptions.every(sub => selectedSubscriptions.includes(sub.user_id));

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="h-5 w-12 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No subscriptions found</h3>
        <p className="text-muted-foreground">
          No subscriptions match your current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={onSelectAll}
                aria-label="Select all subscriptions"
              />
            </TableHead>
            <TableHead>User</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Current Period</TableHead>
            <TableHead>Revenue</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.map((subscription) => (
            <TableRow key={subscription.user_id}>
              <TableCell>
                <Checkbox
                  checked={selectedSubscriptions.includes(subscription.user_id)}
                  onCheckedChange={() => onToggleSelection(subscription.user_id)}
                  aria-label={`Select subscription for ${subscription.user_email}`}
                />
              </TableCell>
              
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium">{subscription.user_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {subscription.user_email}
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                {getTierBadge(subscription.current_tier)}
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusBadge(subscription.status)}
                  {subscription.status === 'past_due' && (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <div className="text-sm">
                  {subscription.current_period_start && subscription.current_period_end ? (
                    <>
                      <div>
                        {format(new Date(subscription.current_period_start), 'MMM d')} - {' '}
                        {format(new Date(subscription.current_period_end), 'MMM d, yyyy')}
                      </div>
                      {subscription.trial_ends_at && (
                        <div className="text-muted-foreground">
                          Trial ends: {format(new Date(subscription.trial_ends_at), 'MMM d, yyyy')}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground">No active period</span>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <div className="font-medium">
                  {formatCurrency(subscription.current_tier)}
                  <span className="text-muted-foreground text-sm">/mo</span>
                </div>
              </TableCell>
              
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onViewDetails(subscription)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onViewBilling(subscription)}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Billing History
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onModifySubscription(subscription)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Modify Subscription
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onSyncSubscription(subscription)}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync with Stripe
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {onProcessRefund && (
                      <DropdownMenuItem onClick={() => onProcessRefund(subscription)}>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Process Refund
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => onCancelSubscription(subscription)}
                      className="text-red-600"
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Cancel Subscription
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}