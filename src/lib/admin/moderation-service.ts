import { supabase } from '@/integrations/supabase/client';

export interface ModerationQueueItem {
  id: string;
  content_type: string;
  content_id: string;
  user_id: string;
  user_email?: string;
  flagged_by?: string;
  flag_reason?: string;
  status: string;
  priority: number;
  risk_score: number;
  moderator_id?: string;
  moderated_at?: string;
  moderator_notes?: string;
  auto_flagged: boolean;
  flagging_details: any;
  created_at: string;
  updated_at: string;
}

export interface FlagReason {
  id: string;
  reason_code: string;
  reason_name: string;
  description?: string;
  severity: number;
  auto_flag_enabled: boolean;
  is_active: boolean;
}

export interface ModerationStats {
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  escalated_count: number;
  total_processed_today: number;
  avg_processing_time_hours: number;
  high_priority_count: number;
}

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'escalated';
export type ContentType = 'brand' | 'cv';

class ModerationService {
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
      const { data, error } = await supabase.rpc('flag_content_for_moderation', {
        p_content_type: contentType,
        p_content_id: contentId,
        p_user_id: userId,
        p_flagged_by: options.flaggedBy,
        p_flag_reason: options.flagReason,
        p_priority: options.priority || 1,
        p_risk_score: options.riskScore || 0,
        p_auto_flagged: options.autoFlagged || false,
        p_flagging_details: options.flaggingDetails || {}
      });

      if (error) {
        console.error('Failed to flag content:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error flagging content:', error);
      return null;
    }
  }

  /**
   * Moderate content (approve/reject/escalate)
   */
  async moderateContent(
    queueId: string,
    moderatorId: string,
    status: ModerationStatus,
    moderatorNotes?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('moderate_content', {
        p_queue_id: queueId,
        p_moderator_id: moderatorId,
        p_status: status,
        p_moderator_notes: moderatorNotes
      });

      if (error) {
        console.error('Failed to moderate content:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error moderating content:', error);
      return false;
    }
  }

  /**
   * Get moderation queue with filtering and pagination
   */
  async getModerationQueue(
    filters: {
      status?: ModerationStatus;
      contentType?: ContentType;
      priorityMin?: number;
    } = {},
    pagination: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<ModerationQueueItem[] | null> {
    try {
      const { data, error } = await supabase.rpc('get_moderation_queue', {
        p_status: filters.status,
        p_content_type: filters.contentType,
        p_priority_min: filters.priorityMin,
        p_limit: pagination.limit || 50,
        p_offset: pagination.offset || 0
      });

      if (error) {
        console.error('Failed to fetch moderation queue:', error);
        return null;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching moderation queue:', error);
      return null;
    }
  }

  /**
   * Get moderation statistics
   */
  async getModerationStats(): Promise<ModerationStats | null> {
    try {
      // Get counts by status
      const { data: statusCounts, error: statusError } = await supabase
        .from('content_moderation_queue')
        .select('status')
        .then(result => {
          if (result.error) throw result.error;
          
          const counts = {
            pending_count: 0,
            approved_count: 0,
            rejected_count: 0,
            escalated_count: 0
          };
          
          result.data?.forEach(item => {
            switch (item.status) {
              case 'pending':
                counts.pending_count++;
                break;
              case 'approved':
                counts.approved_count++;
                break;
              case 'rejected':
                counts.rejected_count++;
                break;
              case 'escalated':
                counts.escalated_count++;
                break;
            }
          });
          
          return { data: counts, error: null };
        });

      if (statusError) {
        console.error('Failed to fetch status counts:', statusError);
        return null;
      }

      // Get today's processed count
      const today = new Date().toISOString().split('T')[0];
      const { data: todayProcessed, error: todayError } = await supabase
        .from('content_moderation_queue')
        .select('id')
        .not('moderated_at', 'is', null)
        .gte('moderated_at', today)
        .then(result => ({ data: result.data?.length || 0, error: result.error }));

      if (todayError) {
        console.error('Failed to fetch today processed count:', todayError);
        return null;
      }

      // Get high priority count
      const { data: highPriorityCount, error: priorityError } = await supabase
        .from('content_moderation_queue')
        .select('id')
        .eq('status', 'pending')
        .gte('priority', 4)
        .then(result => ({ data: result.data?.length || 0, error: result.error }));

      if (priorityError) {
        console.error('Failed to fetch high priority count:', priorityError);
        return null;
      }

      // Calculate average processing time (simplified)
      const { data: avgProcessingTime, error: avgError } = await supabase
        .from('content_moderation_queue')
        .select('created_at, moderated_at')
        .not('moderated_at', 'is', null)
        .limit(100)
        .then(result => {
          if (result.error) throw result.error;
          
          if (!result.data || result.data.length === 0) {
            return { data: 0, error: null };
          }
          
          const totalHours = result.data.reduce((sum, item) => {
            const created = new Date(item.created_at);
            const moderated = new Date(item.moderated_at!);
            const hours = (moderated.getTime() - created.getTime()) / (1000 * 60 * 60);
            return sum + hours;
          }, 0);
          
          return { data: totalHours / result.data.length, error: null };
        });

      if (avgError) {
        console.error('Failed to calculate average processing time:', avgError);
        return null;
      }

      return {
        ...statusCounts,
        total_processed_today: todayProcessed,
        avg_processing_time_hours: Math.round(avgProcessingTime * 100) / 100,
        high_priority_count: highPriorityCount
      };
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
      const { data, error } = await supabase
        .from('content_flag_reasons')
        .select('*')
        .eq('is_active', true)
        .order('severity', { ascending: false });

      if (error) {
        console.error('Failed to fetch flag reasons:', error);
        return null;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching flag reasons:', error);
      return null;
    }
  }

  /**
   * Calculate content risk score
   */
  async calculateRiskScore(
    contentText: string,
    contentType: ContentType
  ): Promise<number | null> {
    try {
      const { data, error } = await supabase.rpc('calculate_content_risk_score', {
        p_content_text: contentText,
        p_content_type: contentType
      });

      if (error) {
        console.error('Failed to calculate risk score:', error);
        return null;
      }

      return data || 0;
    } catch (error) {
      console.error('Error calculating risk score:', error);
      return null;
    }
  }

  /**
   * Bulk moderate content
   */
  async bulkModerate(
    queueIds: string[],
    moderatorId: string,
    status: ModerationStatus,
    moderatorNotes?: string
  ): Promise<{ success: string[]; failed: string[] }> {
    const results = { success: [], failed: [] };

    for (const queueId of queueIds) {
      const success = await this.moderateContent(queueId, moderatorId, status, moderatorNotes);
      if (success) {
        results.success.push(queueId);
      } else {
        results.failed.push(queueId);
      }
    }

    return results;
  }

  /**
   * Auto-flag content based on risk score
   */
  async autoFlagIfNeeded(
    contentType: ContentType,
    contentId: string,
    userId: string,
    contentText: string,
    riskThreshold: number = 50
  ): Promise<string | null> {
    const riskScore = await this.calculateRiskScore(contentText, contentType);
    
    if (riskScore && riskScore >= riskThreshold) {
      return this.flagContent(contentType, contentId, userId, {
        flagReason: 'Automatically flagged due to high risk score',
        priority: Math.min(Math.floor(riskScore / 20) + 1, 5),
        riskScore,
        autoFlagged: true,
        flaggingDetails: {
          risk_threshold: riskThreshold,
          auto_flag_reason: 'high_risk_score'
        }
      });
    }

    return null;
  }
}

export const moderationService = new ModerationService();