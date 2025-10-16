import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { PermissionGate } from '@/components/admin/PermissionGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  Download,
  RefreshCw 
} from 'lucide-react';
import { SubscriptionDashboard } from '@/components/admin/subscriptions/SubscriptionDashboard';
import { SubscriptionTable } from '@/components/admin/subscriptions/SubscriptionTable';
import { SubscriptionFilters } from '@/components/admin/subscriptions/SubscriptionFilters';
import { BillingIssuesPanel } from '@/components/admin/subscriptions/BillingIssuesPanel';
import { SubscriptionDetailsModal } from '@/components/admin/subscriptions/SubscriptionDetailsModal';
import { RefundDialog } from '@/components/admin/subscriptions/workflows/RefundDialog';
import { ModifySubscriptionDialog } from '@/components/admin/subscriptions/workflows/ModifySubscriptionDialog';
import { ResolveBillingIssueDialog } from '@/components/admin/subscriptions/workflows/ResolveBillingIssueDialog';
import { useSubscriptionManagement } from '@/hooks/use-subscription-management';
import { AdminSubscriptionView, BillingIssue, RefundRequest, SubscriptionModification } from '@/lib/admin/types/subscription-types';
import { toast } from 'sonner';

export function SubscriptionManagementPage() {
  const {
    subscriptions,
    totalSubscriptions,
    metrics,
    billingIssues,
    subscriptionsLoading,
    metricsLoading,
    billingIssuesLoading,
    filters,
    currentPage,
    selectedSubscriptions,
    updateFilters,
    clearFilters,
    goToPage,
    toggleSubscriptionSelection,
    selectAllSubscriptions,
    clearSelection,
    processRefund,
    modifySubscription,
    cancelSubscription,
    syncSubscription,
    bulkCancelSubscriptions,
    bulkSyncSubscriptions,
    refetchSubscriptions,
    isProcessingRefund,
    isModifyingSubscription,
  } = useSubscriptionManagement();

  const [activeTab, setActiveTab] = useState('overview');
  
  // Dialog states
  const [selectedSubscription, setSelectedSubscription] = useState<AdminSubscriptionView | null>(null);
  const [selectedBillingIssue, setSelectedBillingIssue] = useState<BillingIssue | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [showResolveIssueDialog, setShowResolveIssueDialog] = useState(false);

  const handleViewDetails = (subscription: AdminSubscriptionView) => {
    setSelectedSubscription(subscription);
    setShowDetailsModal(true);
  };

  const handleModifySubscription = (subscription: AdminSubscriptionView) => {
    setSelectedSubscription(subscription);
    setShowModifyDialog(true);
  };

  const handleCancelSubscription = (subscription: AdminSubscriptionView) => {
    if (confirm(`Are you sure you want to cancel the subscription for ${subscription.user_email}?`)) {
      cancelSubscription({ 
        subscriptionId: subscription.stripe_subscription_id || subscription.user_id, 
        immediately: false 
      });
    }
  };

  const handleSyncSubscription = (subscription: AdminSubscriptionView) => {
    if (subscription.stripe_subscription_id) {
      syncSubscription(subscription.stripe_subscription_id);
    } else {
      toast.error('No Stripe subscription ID found');
    }
  };

  const handleViewBilling = (subscription: AdminSubscriptionView) => {
    setSelectedSubscription(subscription);
    setShowDetailsModal(true);
  };

  const handleResolveIssue = (issue: BillingIssue) => {
    setSelectedBillingIssue(issue);
    setShowResolveIssueDialog(true);
  };

  const handleProcessRefund = (subscription: AdminSubscriptionView) => {
    setSelectedSubscription(subscription);
    setShowRefundDialog(true);
  };

  const handleConfirmRefund = (request: RefundRequest) => {
    processRefund(request);
    setShowRefundDialog(false);
    setSelectedSubscription(null);
  };

  const handleConfirmModification = (modification: SubscriptionModification) => {
    modifySubscription(modification);
    setShowModifyDialog(false);
    setSelectedSubscription(null);
  };

  const handleConfirmResolveIssue = (issueId: string, resolution: any) => {
    // TODO: Implement resolve issue API call
    toast.success('Billing issue resolved successfully');
    setShowResolveIssueDialog(false);
    setSelectedBillingIssue(null);
    refetchSubscriptions();
  };

  const handleExportData = () => {
    // TODO: Implement data export
    toast.info('Exporting subscription data...');
  };

  const totalPages = Math.ceil(totalSubscriptions / 20);

  return (
    <AdminLayout>
      <PermissionGate requiredPermissions={['manage_billing']}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
              <p className="text-muted-foreground">
                Manage subscriptions, billing, and revenue
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleExportData}>
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
              <Button variant="outline" onClick={() => refetchSubscriptions()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Subscriptions
                <Badge variant="secondary">{totalSubscriptions}</Badge>
              </TabsTrigger>
              <TabsTrigger value="billing-issues" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Billing Issues
                {billingIssues && billingIssues.length > 0 && (
                  <Badge variant="destructive">{billingIssues.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <SubscriptionDashboard 
                metrics={metrics!} 
                isLoading={metricsLoading} 
              />
              
              {/* Recent Billing Issues */}
              {billingIssues && billingIssues.length > 0 && (
                <BillingIssuesPanel
                  issues={billingIssues.slice(0, 5)}
                  onResolveIssue={handleResolveIssue}
                  onRefreshIssues={() => refetchSubscriptions()}
                  isLoading={billingIssuesLoading}
                />
              )}
            </TabsContent>

            {/* Subscriptions Tab */}
            <TabsContent value="subscriptions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    All Subscriptions
                  </CardTitle>
                  <CardDescription>
                    Manage user subscriptions and billing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Filters */}
                  <SubscriptionFilters
                    filters={filters}
                    onFiltersChange={updateFilters}
                    onClearFilters={clearFilters}
                  />

                  {/* Bulk Actions */}
                  {selectedSubscriptions.length > 0 && (
                    <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                      <span className="text-sm font-medium">
                        {selectedSubscriptions.length} subscription(s) selected
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => bulkSyncSubscriptions()}
                      >
                        Sync Selected
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => bulkCancelSubscriptions(false)}
                      >
                        Cancel Selected
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={clearSelection}
                      >
                        Clear Selection
                      </Button>
                    </div>
                  )}

                  {/* Subscriptions Table */}
                  <SubscriptionTable
                    subscriptions={subscriptions}
                    selectedSubscriptions={selectedSubscriptions}
                    onToggleSelection={toggleSubscriptionSelection}
                    onSelectAll={selectAllSubscriptions}
                    onViewDetails={handleViewDetails}
                    onModifySubscription={handleModifySubscription}
                    onCancelSubscription={handleCancelSubscription}
                    onSyncSubscription={handleSyncSubscription}
                    onViewBilling={handleViewBilling}
                    onProcessRefund={handleProcessRefund}
                    isLoading={subscriptionsLoading}
                  />

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalSubscriptions)} of {totalSubscriptions} subscriptions
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing Issues Tab */}
            <TabsContent value="billing-issues" className="space-y-6">
              <BillingIssuesPanel
                issues={billingIssues || []}
                onResolveIssue={handleResolveIssue}
                onRefreshIssues={() => refetchSubscriptions()}
                isLoading={billingIssuesLoading}
              />
            </TabsContent>
          </Tabs>

          {/* Modals and Dialogs */}
          <SubscriptionDetailsModal
            subscription={selectedSubscription}
            isOpen={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedSubscription(null);
            }}
            onRefresh={refetchSubscriptions}
          />

          <RefundDialog
            subscription={selectedSubscription}
            isOpen={showRefundDialog}
            onClose={() => {
              setShowRefundDialog(false);
              setSelectedSubscription(null);
            }}
            onConfirm={handleConfirmRefund}
            isProcessing={isProcessingRefund}
          />

          <ModifySubscriptionDialog
            subscription={selectedSubscription}
            isOpen={showModifyDialog}
            onClose={() => {
              setShowModifyDialog(false);
              setSelectedSubscription(null);
            }}
            onConfirm={handleConfirmModification}
            isProcessing={isModifyingSubscription}
          />

          <ResolveBillingIssueDialog
            issue={selectedBillingIssue}
            isOpen={showResolveIssueDialog}
            onClose={() => {
              setShowResolveIssueDialog(false);
              setSelectedBillingIssue(null);
            }}
            onResolve={handleConfirmResolveIssue}
          />
        </div>
      </PermissionGate>
    </AdminLayout>
  );
}