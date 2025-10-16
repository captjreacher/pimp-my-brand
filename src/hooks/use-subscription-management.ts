import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionRoutes } from '@/lib/admin/api/subscription-routes';
import { 
  AdminSubscriptionView, 
  SubscriptionMetrics, 
  BillingIssue, 
  SubscriptionFilters,
  RefundRequest,
  SubscriptionModification 
} from '@/lib/admin/types/subscription-types';
import { useAdmin } from '@/contexts/AdminContext';
import { toast } from 'sonner';

export function useSubscriptionManagement() {
  const { user } = useAdmin();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<Partial<SubscriptionFilters>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>([]);

  // Fetch subscriptions with pagination and filters
  const {
    data: subscriptionsData,
    isLoading: subscriptionsLoading,
    error: subscriptionsError,
    refetch: refetchSubscriptions,
  } = useQuery({
    queryKey: ['admin-subscriptions', currentPage, filters],
    queryFn: () => subscriptionRoutes.getSubscriptions({
      page: currentPage,
      limit: 20,
      filters,
    }),
    enabled: !!user,
  });

  // Fetch subscription metrics
  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
  } = useQuery({
    queryKey: ['subscription-metrics'],
    queryFn: () => subscriptionRoutes.getMetrics(),
    enabled: !!user,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  // Fetch billing issues
  const {
    data: billingIssues,
    isLoading: billingIssuesLoading,
    error: billingIssuesError,
  } = useQuery({
    queryKey: ['billing-issues'],
    queryFn: () => subscriptionRoutes.getBillingIssues(),
    enabled: !!user,
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
  });

  // Process refund mutation
  const refundMutation = useMutation({
    mutationFn: (request: RefundRequest) => 
      subscriptionRoutes.processRefund(request, user?.id || ''),
    onSuccess: () => {
      toast.success('Refund processed successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['billing-issues'] });
    },
    onError: (error) => {
      toast.error(`Failed to process refund: ${error.message}`);
    },
  });

  // Modify subscription mutation
  const modifySubscriptionMutation = useMutation({
    mutationFn: (modification: SubscriptionModification) => 
      subscriptionRoutes.modifySubscription(modification, user?.id || ''),
    onSuccess: () => {
      toast.success('Subscription modified successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-metrics'] });
    },
    onError: (error) => {
      toast.error(`Failed to modify subscription: ${error.message}`);
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: ({ subscriptionId, immediately }: { subscriptionId: string; immediately: boolean }) => 
      subscriptionRoutes.cancelSubscription(subscriptionId, immediately, user?.id || ''),
    onSuccess: () => {
      toast.success('Subscription canceled successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-metrics'] });
    },
    onError: (error) => {
      toast.error(`Failed to cancel subscription: ${error.message}`);
    },
  });

  // Sync subscription mutation
  const syncSubscriptionMutation = useMutation({
    mutationFn: (subscriptionId: string) => 
      subscriptionRoutes.syncSubscription(subscriptionId),
    onSuccess: () => {
      toast.success('Subscription synced successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
    },
    onError: (error) => {
      toast.error(`Failed to sync subscription: ${error.message}`);
    },
  });

  // Filter and pagination handlers
  const updateFilters = (newFilters: Partial<SubscriptionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  // Selection handlers
  const toggleSubscriptionSelection = (subscriptionId: string) => {
    setSelectedSubscriptions(prev => 
      prev.includes(subscriptionId)
        ? prev.filter(id => id !== subscriptionId)
        : [...prev, subscriptionId]
    );
  };

  const selectAllSubscriptions = () => {
    if (subscriptionsData?.data) {
      setSelectedSubscriptions(subscriptionsData.data.map(sub => sub.user_id));
    }
  };

  const clearSelection = () => {
    setSelectedSubscriptions([]);
  };

  // Bulk operations
  const bulkCancelSubscriptions = async (immediately: boolean = false) => {
    if (selectedSubscriptions.length === 0) return;

    try {
      const promises = selectedSubscriptions.map(subscriptionId =>
        subscriptionRoutes.cancelSubscription(subscriptionId, immediately, user?.id || '')
      );
      
      await Promise.all(promises);
      toast.success(`${selectedSubscriptions.length} subscriptions canceled successfully`);
      
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-metrics'] });
      clearSelection();
    } catch (error) {
      toast.error('Failed to cancel some subscriptions');
    }
  };

  const bulkSyncSubscriptions = async () => {
    if (selectedSubscriptions.length === 0) return;

    try {
      const promises = selectedSubscriptions.map(subscriptionId =>
        subscriptionRoutes.syncSubscription(subscriptionId)
      );
      
      await Promise.all(promises);
      toast.success(`${selectedSubscriptions.length} subscriptions synced successfully`);
      
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      clearSelection();
    } catch (error) {
      toast.error('Failed to sync some subscriptions');
    }
  };

  return {
    // Data
    subscriptions: subscriptionsData?.data || [],
    totalSubscriptions: subscriptionsData?.total || 0,
    metrics: metrics as SubscriptionMetrics | undefined,
    billingIssues: billingIssues as BillingIssue[] | undefined,
    
    // Loading states
    subscriptionsLoading,
    metricsLoading,
    billingIssuesLoading,
    
    // Error states
    subscriptionsError,
    metricsError,
    billingIssuesError,
    
    // Filters and pagination
    filters,
    currentPage,
    updateFilters,
    clearFilters,
    goToPage,
    
    // Selection
    selectedSubscriptions,
    toggleSubscriptionSelection,
    selectAllSubscriptions,
    clearSelection,
    
    // Actions
    processRefund: refundMutation.mutate,
    modifySubscription: modifySubscriptionMutation.mutate,
    cancelSubscription: cancelSubscriptionMutation.mutate,
    syncSubscription: syncSubscriptionMutation.mutate,
    
    // Bulk actions
    bulkCancelSubscriptions,
    bulkSyncSubscriptions,
    
    // Action states
    isProcessingRefund: refundMutation.isPending,
    isModifyingSubscription: modifySubscriptionMutation.isPending,
    isCancelingSubscription: cancelSubscriptionMutation.isPending,
    isSyncingSubscription: syncSubscriptionMutation.isPending,
    
    // Refresh
    refetchSubscriptions,
  };
}