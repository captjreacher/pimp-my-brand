import { useState, useEffect, useCallback } from 'react';
import { contentModerationAPI, ContentModerationFilters, ContentModerationPagination, BulkModerationRequest, ContentPreview } from '@/lib/admin/api/content-moderation-api';
import { ModerationQueueItem, ModerationStats, FlagReason, ModerationStatus, ContentType } from '@/lib/admin/moderation-service';
import { useToast } from '@/hooks/use-toast';

export interface UseModerationQueueOptions {
  filters?: ContentModerationFilters;
  pagination?: ContentModerationPagination;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseModerationQueueResult {
  items: ModerationQueueItem[];
  total: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export interface UseContentModerationResult {
  // Queue management
  queue: UseModerationQueueResult;
  
  // Statistics
  stats: ModerationStats | null;
  statsLoading: boolean;
  
  // Flag reasons
  flagReasons: FlagReason[];
  flagReasonsLoading: boolean;
  
  // Actions
  moderateContent: (queueId: string, status: ModerationStatus, notes?: string) => Promise<boolean>;
  bulkModerate: (request: BulkModerationRequest) => Promise<boolean>;
  flagContent: (contentType: ContentType, contentId: string, userId: string, options?: any) => Promise<boolean>;
  escalateContent: (queueId: string, reason: string) => Promise<boolean>;
  
  // Content preview
  getContentPreview: (contentType: ContentType, contentId: string) => Promise<ContentPreview | null>;
  
  // Utilities
  refreshStats: () => Promise<void>;
  refreshFlagReasons: () => Promise<void>;
}

export function useContentModeration(
  options: UseModerationQueueOptions = {},
  moderatorId?: string
): UseContentModerationResult {
  const { toast } = useToast();
  
  // Queue state
  const [items, setItems] = useState<ModerationQueueItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  // Stats state
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Flag reasons state
  const [flagReasons, setFlagReasons] = useState<FlagReason[]>([]);
  const [flagReasonsLoading, setFlagReasonsLoading] = useState(false);

  // Load moderation queue
  const loadQueue = useCallback(async (append = false) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const currentOffset = append ? items.length : 0;
      const pagination = {
        ...options.pagination,
        offset: currentOffset
      };
      
      const result = await contentModerationAPI.getModerationQueue(options.filters, pagination);
      
      if (result) {
        if (append) {
          setItems(prev => [...prev, ...result.items]);
        } else {
          setItems(result.items);
        }
        setTotal(result.total);
        
        const limit = pagination.limit || 50;
        setHasMore(currentOffset + result.items.length < result.total);
      } else {
        setError('Failed to load moderation queue');
      }
    } catch (err) {
      setError('Error loading moderation queue');
      console.error('Error loading moderation queue:', err);
    } finally {
      setLoading(false);
    }
  }, [options.filters, options.pagination, items.length, loading]);

  // Load statistics
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const result = await contentModerationAPI.getModerationStats();
      setStats(result);
    } catch (err) {
      console.error('Error loading moderation stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Load flag reasons
  const loadFlagReasons = useCallback(async () => {
    setFlagReasonsLoading(true);
    try {
      const result = await contentModerationAPI.getFlagReasons();
      setFlagReasons(result || []);
    } catch (err) {
      console.error('Error loading flag reasons:', err);
    } finally {
      setFlagReasonsLoading(false);
    }
  }, []);

  // Moderate content
  const moderateContent = useCallback(async (
    queueId: string,
    status: ModerationStatus,
    notes?: string
  ): Promise<boolean> => {
    if (!moderatorId) {
      toast({
        title: "Error",
        description: "Moderator ID is required",
        variant: "destructive"
      });
      return false;
    }

    try {
      const success = await contentModerationAPI.moderateContent(queueId, moderatorId, status, notes);
      
      if (success) {
        toast({
          title: "Success",
          description: `Content ${status} successfully`
        });
        
        // Update local state
        setItems(prev => prev.map(item => 
          item.id === queueId 
            ? { ...item, status, moderator_id: moderatorId, moderated_at: new Date().toISOString(), moderator_notes: notes }
            : item
        ));
        
        // Refresh stats
        loadStats();
        
        return true;
      } else {
        toast({
          title: "Error",
          description: "Failed to moderate content",
          variant: "destructive"
        });
        return false;
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Error moderating content",
        variant: "destructive"
      });
      console.error('Error moderating content:', err);
      return false;
    }
  }, [moderatorId, toast, loadStats]);

  // Bulk moderate
  const bulkModerate = useCallback(async (request: BulkModerationRequest): Promise<boolean> => {
    if (!moderatorId) {
      toast({
        title: "Error",
        description: "Moderator ID is required",
        variant: "destructive"
      });
      return false;
    }

    try {
      const result = await contentModerationAPI.bulkModerate(request, moderatorId);
      
      if (result.success.length > 0) {
        toast({
          title: "Bulk Moderation Complete",
          description: `${result.success.length}/${result.total} items processed successfully`
        });
        
        // Update local state for successful items
        setItems(prev => prev.map(item => 
          result.success.includes(item.id)
            ? { ...item, status: request.status, moderator_id: moderatorId, moderated_at: new Date().toISOString(), moderator_notes: request.moderatorNotes }
            : item
        ));
        
        // Refresh stats
        loadStats();
        
        return true;
      } else {
        toast({
          title: "Error",
          description: "Failed to process any items",
          variant: "destructive"
        });
        return false;
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Error performing bulk moderation",
        variant: "destructive"
      });
      console.error('Error bulk moderating:', err);
      return false;
    }
  }, [moderatorId, toast, loadStats]);

  // Flag content
  const flagContent = useCallback(async (
    contentType: ContentType,
    contentId: string,
    userId: string,
    options: any = {}
  ): Promise<boolean> => {
    try {
      const queueId = await contentModerationAPI.flagContent(contentType, contentId, userId, {
        ...options,
        flaggedBy: moderatorId
      });
      
      if (queueId) {
        toast({
          title: "Success",
          description: "Content flagged for moderation"
        });
        
        // Refresh queue to show new item
        loadQueue();
        loadStats();
        
        return true;
      } else {
        toast({
          title: "Error",
          description: "Failed to flag content",
          variant: "destructive"
        });
        return false;
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Error flagging content",
        variant: "destructive"
      });
      console.error('Error flagging content:', err);
      return false;
    }
  }, [moderatorId, toast, loadQueue, loadStats]);

  // Escalate content
  const escalateContent = useCallback(async (queueId: string, reason: string): Promise<boolean> => {
    if (!moderatorId) {
      toast({
        title: "Error",
        description: "Moderator ID is required",
        variant: "destructive"
      });
      return false;
    }

    try {
      const success = await contentModerationAPI.escalateContent(queueId, moderatorId, reason);
      
      if (success) {
        toast({
          title: "Success",
          description: "Content escalated successfully"
        });
        
        // Update local state
        setItems(prev => prev.map(item => 
          item.id === queueId 
            ? { ...item, status: 'escalated', priority: 5, moderator_notes: reason }
            : item
        ));
        
        loadStats();
        return true;
      } else {
        toast({
          title: "Error",
          description: "Failed to escalate content",
          variant: "destructive"
        });
        return false;
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Error escalating content",
        variant: "destructive"
      });
      console.error('Error escalating content:', err);
      return false;
    }
  }, [moderatorId, toast, loadStats]);

  // Get content preview
  const getContentPreview = useCallback(async (
    contentType: ContentType,
    contentId: string
  ): Promise<ContentPreview | null> => {
    try {
      return await contentModerationAPI.getContentPreview(contentType, contentId);
    } catch (err) {
      console.error('Error getting content preview:', err);
      return null;
    }
  }, []);

  // Refresh functions
  const refresh = useCallback(() => loadQueue(false), [loadQueue]);
  const loadMore = useCallback(() => loadQueue(true), [loadQueue]);
  const refreshStats = useCallback(() => loadStats(), [loadStats]);
  const refreshFlagReasons = useCallback(() => loadFlagReasons(), [loadFlagReasons]);

  // Initial load
  useEffect(() => {
    loadQueue();
    loadStats();
    loadFlagReasons();
  }, [options.filters, options.pagination]);

  // Auto refresh
  useEffect(() => {
    if (options.autoRefresh && options.refreshInterval) {
      const interval = setInterval(() => {
        loadQueue();
        loadStats();
      }, options.refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [options.autoRefresh, options.refreshInterval, loadQueue, loadStats]);

  return {
    queue: {
      items,
      total,
      loading,
      error,
      refresh,
      loadMore,
      hasMore
    },
    stats,
    statsLoading,
    flagReasons,
    flagReasonsLoading,
    moderateContent,
    bulkModerate,
    flagContent,
    escalateContent,
    getContentPreview,
    refreshStats,
    refreshFlagReasons
  };
}