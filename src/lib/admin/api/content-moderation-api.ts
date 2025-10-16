import { supabase } from '@/integrations/supabase/client';
import { moderationService, ModerationQueueItem, ModerationStats, FlagReason, ModerationStatus, ContentType } from '../moderation-service';
import { auditService } from '../audit-service';

export interface ContentModerationFilters {
  status?: ModerationStatus;
  contentType?: ContentType;
  priorityMin?: number;
  riskScoreMin?: number;
  autoFlagged?: boolean;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  moderatorId?: string;
}

export interface ContentModerationPagination {
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'priority' | 'risk_score' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}

export interface BulkModerationRequest {
  queueIds: string[];
  status: ModerationStatus;
  moderatorNotes?: string;
}

export interface BulkModerationResult {
  success: string[];
  failed: string[];
  total: number;
}

export interface ContentPreview {
  id: string;
  type: ContentType;
  title?: string;
  content?: string;
  metadata?: Record<string, any>;
  userInfo?: {
    id: string;
    email: string;
    fullName?: string;
  };
}

class ContentModerationAPI {
  /**
   * Get moderation queue with advanced filtering and pagination
   */
  async getModerationQueue(
    filters: ContentModerationFilters = {},
    pagination: ContentModerationPagination = {}
  ): Promise<{ items: ModerationQueueItem[]; total: number } | null> {
    try {
      // Build query with filters
      let query = supabase
        .from('content_moderation_queue')
        .select(`
          *,
          user:auth.users!content_moderation_queue_user_id_fkey(email),
          moderator:auth.users!content_moderation_queue_moderator_id_fkey(email),
          flagged_by_user:auth.users!content_moderation_queue_flagged_by_fkey(email)
        `, { count: 'exact' });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.contentType) {
        query = query.eq('content_type', filters.contentType);
      }
      if (filters.priorityMin) {
        query = query.gte('priority', filters.priorityMin);
      }
      if (filters.riskScoreMin) {
        query = query.gte('risk_score', filters.riskScoreMin);
      }
      if (filters.autoFlagged !== undefined) {
        query = query.eq('auto_flagged', filters.autoFlagged);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.moderatorId) {
        query = query.eq('moderator_id', filters.moderatorId);
      }

      // Apply sorting
      const sortBy = pagination.sortBy || 'created_at';
      const sortOrder = pagination.sortOrder || 'desc';
      
      if (sortBy === 'priority') {
        query = query.order('priority', { ascending: sortOrder === 'asc' })
                    .order('created_at', { ascending: false });
      } else {
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      }

      // Apply pagination
      const limit = pagination.limit || 50;
      const offset = pagination.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Failed to fetch moderation queue:', error);
        return null;
      }

      // Transform data to include user emails
      const items: ModerationQueueItem[] = (data || []).map(item => ({
        ...item,
        user_email: item.user?.email,
        moderator_email: item.moderator?.email,
        flagged_by_email: item.flagged_by_user?.email
      }));

      return {
        items,
        total: count || 0
      };
    } catch (error) {
      console.error('Error fetching moderation queue:', error);
      return null;
    }
  }

  /**
   * Get content preview for moderation
   */
  async getContentPreview(contentType: ContentType, contentId: string): Promise<ContentPreview | null> {
    try {
      let contentData = null;
      let userInfo = null;

      if (contentType === 'brand') {
        const { data, error } = await supabase
          .from('brands')
          .select(`
            id,
            name,
            description,
            style_analysis,
            user_id,
            user:profiles!brands_user_id_fkey(id, email, full_name)
          `)
          .eq('id', contentId)
          .single();

        if (error) {
          console.error('Failed to fetch brand content:', error);
          return null;
        }

        contentData = data;
        userInfo = data?.user;
      } else if (contentType === 'cv') {
        const { data, error } = await supabase
          .from('cvs')
          .select(`
            id,
            title,
            content,
            user_id,
            user:profiles!cvs_user_id_fkey(id, email, full_name)
          `)
          .eq('id', contentId)
          .single();

        if (error) {
          console.error('Failed to fetch CV content:', error);
          return null;
        }

        contentData = data;
        userInfo = data?.user;
      }

      if (!contentData) {
        return null;
      }

      return {
        id: contentData.id,
        type: contentType,
        title: contentData.name || contentData.title,
        content: contentData.description || contentData.content,
        metadata: {
          style_analysis: contentData.style_analysis,
          created_at: contentData.created_at,
          updated_at: contentData.updated_at
        },
        userInfo: userInfo ? {
          id: userInfo.id,
          email: userInfo.email,
          fullName: userInfo.full_name
        } : undefined
      };
    } catch (error) {
      console.error('Error fetching content preview:', error);
      return null;
    }
  }

  /**
   * Flag content for moderation
   */
  async flagContent(
    contentType: ContentType,
    contentId: string,
    userId: string,
    options: {
      flaggedBy?: string;
      flagReason?: string;
      priority?: number;
      riskScore?: number;
      autoFlagged?: boolean;
      flaggingDetails?: Record<string, any>;
    } = {}
  ): Promise<string | null> {
    try {
      const queueId = await moderationService.flagContent(
        contentType,
        contentId,
        userId,
        options
      );

      if (queueId && options.flaggedBy) {
        // Log the manual flagging action
        await auditService.logAction(
          options.flaggedBy,
          'CONTENT_FLAGGED',
          'content',
          queueId,
          {
            content_type: contentType,
            content_id: contentId,
            flag_reason: options.flagReason,
            priority: options.priority,
            risk_score: options.riskScore,
            auto_flagged: options.autoFlagged || false
          }
        );
      }

      return queueId;
    } catch (error) {
      console.error('Error flagging content:', error);
      return null;
    }
  }

  /**
   * Moderate single content item
   */
  async moderateContent(
    queueId: string,
    moderatorId: string,
    status: ModerationStatus,
    moderatorNotes?: string
  ): Promise<boolean> {
    try {
      const success = await moderationService.moderateContent(
        queueId,
        moderatorId,
        status,
        moderatorNotes
      );

      if (success) {
        // Additional audit logging is handled by the database function
        console.log(`Content moderated: ${queueId} -> ${status}`);
      }

      return success;
    } catch (error) {
      console.error('Error moderating content:', error);
      return false;
    }
  }

  /**
   * Bulk moderate content items
   */
  async bulkModerate(
    request: BulkModerationRequest,
    moderatorId: string
  ): Promise<BulkModerationResult> {
    try {
      const result = await moderationService.bulkModerate(
        request.queueIds,
        moderatorId,
        request.status,
        request.moderatorNotes
      );

      // Log bulk moderation action
      await auditService.logAction(
        moderatorId,
        'BULK_CONTENT_MODERATION',
        'content',
        null,
        {
          status: request.status,
          total_items: request.queueIds.length,
          successful: result.success.length,
          failed: result.failed.length,
          moderator_notes: request.moderatorNotes,
          queue_ids: request.queueIds
        }
      );

      return {
        ...result,
        total: request.queueIds.length
      };
    } catch (error) {
      console.error('Error bulk moderating content:', error);
      return {
        success: [],
        failed: request.queueIds,
        total: request.queueIds.length
      };
    }
  }

  /**
   * Get moderation statistics
   */
  async getModerationStats(): Promise<ModerationStats | null> {
    try {
      return await moderationService.getModerationStats();
    } catch (error) {
      console.error('Error fetching moderation stats:', error);
      return null;
    }
  }

  /**
   * Get available flag reasons
   */
  async getFlagReasons(): Promise<FlagReason[] | null> {
    try {
      return await moderationService.getFlagReasons();
    } catch (error) {
      console.error('Error fetching flag reasons:', error);
      return null;
    }
  }

  /**
   * Auto-flag content if risk score is high
   */
  async autoFlagIfNeeded(
    contentType: ContentType,
    contentId: string,
    userId: string,
    contentText: string,
    riskThreshold: number = 50
  ): Promise<string | null> {
    try {
      return await moderationService.autoFlagIfNeeded(
        contentType,
        contentId,
        userId,
        contentText,
        riskThreshold
      );
    } catch (error) {
      console.error('Error auto-flagging content:', error);
      return null;
    }
  }

  /**
   * Get moderation history for a specific content item
   */
  async getContentModerationHistory(
    contentType: ContentType,
    contentId: string
  ): Promise<ModerationQueueItem[] | null> {
    try {
      const { data, error } = await supabase
        .from('content_moderation_queue')
        .select(`
          *,
          user:auth.users!content_moderation_queue_user_id_fkey(email),
          moderator:auth.users!content_moderation_queue_moderator_id_fkey(email),
          flagged_by_user:auth.users!content_moderation_queue_flagged_by_fkey(email)
        `)
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch moderation history:', error);
        return null;
      }

      return (data || []).map(item => ({
        ...item,
        user_email: item.user?.email,
        moderator_email: item.moderator?.email,
        flagged_by_email: item.flagged_by_user?.email
      }));
    } catch (error) {
      console.error('Error fetching moderation history:', error);
      return null;
    }
  }

  /**
   * Update flag reason
   */
  async updateFlagReason(
    reasonId: string,
    updates: Partial<FlagReason>,
    adminId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('content_flag_reasons')
        .update(updates)
        .eq('id', reasonId);

      if (error) {
        console.error('Failed to update flag reason:', error);
        return false;
      }

      // Log the update
      await auditService.logAction(
        adminId,
        'FLAG_REASON_UPDATED',
        'flag_reason',
        reasonId,
        updates
      );

      return true;
    } catch (error) {
      console.error('Error updating flag reason:', error);
      return false;
    }
  }

  /**
   * Create new flag reason
   */
  async createFlagReason(
    flagReason: Omit<FlagReason, 'id' | 'created_at'>,
    adminId: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('content_flag_reasons')
        .insert(flagReason)
        .select('id')
        .single();

      if (error) {
        console.error('Failed to create flag reason:', error);
        return null;
      }

      // Log the creation
      await auditService.logAction(
        adminId,
        'FLAG_REASON_CREATED',
        'flag_reason',
        data.id,
        flagReason
      );

      return data.id;
    } catch (error) {
      console.error('Error creating flag reason:', error);
      return null;
    }
  }

  /**
   * Escalate content to higher priority
   */
  async escalateContent(
    queueId: string,
    moderatorId: string,
    escalationReason: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('content_moderation_queue')
        .update({
          status: 'escalated',
          priority: 5, // Set to highest priority
          moderator_notes: escalationReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', queueId);

      if (error) {
        console.error('Failed to escalate content:', error);
        return false;
      }

      // Log the escalation
      await auditService.logAction(
        moderatorId,
        'CONTENT_ESCALATED',
        'content',
        queueId,
        {
          escalation_reason: escalationReason,
          new_priority: 5
        }
      );

      return true;
    } catch (error) {
      console.error('Error escalating content:', error);
      return false;
    }
  }
}

export const contentModerationAPI = new ContentModerationAPI();