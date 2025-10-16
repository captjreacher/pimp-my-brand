import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CreditCard, 
  DollarSign, 
  Clock, 
  CheckCircle,
  XCircle,
  RefreshCw 
} from 'lucide-react';
import { BillingIssue } from '@/lib/admin/types/subscription-types';
import { format } from 'date-fns';

interface BillingIssuesPanelProps {
  issues: BillingIssue[];
  onResolveIssue: (issue: BillingIssue) => void;
  onRefreshIssues: () => void;
  isLoading?: boolean;
}

export function BillingIssuesPanel({
  issues,
  onResolveIssue,
  onRefreshIssues,
  isLoading,
}: BillingIssuesPanelProps) {
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Convert from cents
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      open: { variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
      in_progress: { variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      resolved: { variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
      closed: { variant: 'outline', icon: <CheckCircle className="h-3 w-3" /> },
    };

    const config = variants[status] || variants.open;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
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

  const openIssues = issues.filter(issue => issue.status === 'open' || issue.status === 'in_progress');
  const resolvedIssues = issues.filter(issue => issue.status === 'resolved' || issue.status === 'closed');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Billing Issues
          </CardTitle>
          <CardDescription>
            Issues requiring admin attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Billing Issues
              {openIssues.length > 0 && (
                <Badge variant="destructive">{openIssues.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Issues requiring admin attention
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefreshIssues}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {issues.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No billing issues</h3>
            <p className="text-muted-foreground">
              All billing is running smoothly.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Open Issues */}
            {openIssues.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-red-600 mb-3">
                  Requires Attention ({openIssues.length})
                </h4>
                <div className="space-y-3">
                  {openIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        {getIssueIcon(issue.issue_type)}
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{issue.user_email}</span>
                            <Badge variant="outline" className="text-xs">
                              {getIssueTypeLabel(issue.issue_type)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {issue.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Amount: {formatCurrency(issue.amount, issue.currency)}</span>
                            <span>Created: {format(new Date(issue.created_at), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(issue.status)}
                        <Button
                          size="sm"
                          onClick={() => onResolveIssue(issue)}
                          className="ml-2"
                        >
                          Resolve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resolved Issues */}
            {resolvedIssues.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-green-600 mb-3">
                  Recently Resolved ({resolvedIssues.length})
                </h4>
                <div className="space-y-3">
                  {resolvedIssues.slice(0, 5).map((issue) => (
                    <div
                      key={issue.id}
                      className="flex items-center justify-between p-4 border border-green-200 rounded-lg bg-green-50"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        {getIssueIcon(issue.issue_type)}
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{issue.user_email}</span>
                            <Badge variant="outline" className="text-xs">
                              {getIssueTypeLabel(issue.issue_type)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {issue.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Amount: {formatCurrency(issue.amount, issue.currency)}</span>
                            <span>Resolved: {issue.resolved_at ? format(new Date(issue.resolved_at), 'MMM d, yyyy') : 'N/A'}</span>
                          </div>
                          {issue.resolution_notes && (
                            <p className="text-xs text-green-700 bg-green-100 p-2 rounded">
                              Resolution: {issue.resolution_notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(issue.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}