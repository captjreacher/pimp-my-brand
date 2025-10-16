import { contentModerationAPI, ContentModerationFilters, ContentModerationPagination, BulkModerationRequest } from './content-moderation-api';
import { ContentType, ModerationStatus } from '../moderation-service';

export interface ModerationRouteHandlers {
  getModerationQueue: (filters?: ContentModerationFilters, pagination?: ContentModerationPagination) => Promise<any>;
  getContentPreview: (contentType: ContentType, contentId: string) => Promise<any>;
  flagContent: (contentType: ContentType, contentId: string, userId: string, options?: any) => Promise<any>;
  moderateContent: (queueId: string, moderatorId: string, status: ModerationStatus, notes?: string) => Promise<any>;
  bulkModerate: (request: BulkModerationRequest, moderatorId: string) => Promise<any>;
  getModerationStats: () => Promise<any>;
  getFlagReasons: () => Promise<any>;
  getContentModerationHistory: (contentType: ContentType, contentId: string) => Promise<any>;
  escalateContent: (queueId: string, moderatorId: string, reason: string) => Promise<any>;
}

/**
 * Content Moderation API Route Handlers
 * These handlers provide the API interface for content moderation operations
 */
export const moderationRouteHandlers: ModerationRouteHandlers = {
  /**
   * GET /api/admin/moderation/queue
   * Get moderation queue with filtering and pagination
   */
  async getModerationQueue(filters?: ContentModerationFilters, pagination?: ContentModerationPagination) {
    try {
      const result = await contentModerationAPI.getModerationQueue(filters, pagination);
      
      if (!result) {
        return {
          success: false,
          error: 'Failed to fetch moderation queue',
          data: null
        };
      }

      return {
        success: true,
        data: {
          items: result.items,
          total: result.total,
          pagination: {
            limit: pagination?.limit || 50,
            offset: pagination?.offset || 0,
            hasMore: result.total > (pagination?.offset || 0) + (pagination?.limit || 50)
          }
        }
      };
    } catch (error) {
      console.error('Error in getModerationQueue handler:', error);
      return {
        success: false,
        error: 'Internal server error',
        data: null
      };
    }
  },

  /**
   * GET /api/admin/moderation/content/:type/:id/preview
   * Get content preview for moderation
   */
  async getContentPreview(contentType: ContentType, contentId: string) {
    try {
      const preview = await contentModerationAPI.getContentPreview(contentType, contentId);
      
      if (!preview) {
        return {
          success: false,
          error: 'Content not found or access denied',
          data: null
        };
      }

      return {
        success: true,
        data: preview
      };
    } catch (error) {
      console.error('Error in getContentPreview handler:', error);
      return {
        success: false,
        error: 'Internal server error',
        data: null
      };
    }
  },

  /**
   * POST /api/admin/moderation/flag
   * Flag content for moderation
   */
  async flagContent(contentType: ContentType, contentId: string, userId: string, options = {}) {
    try {
      const queueId = await contentModerationAPI.flagContent(contentType, contentId, userId, options);
      
      if (!queueId) {
        return {
          success: false,
          error: 'Failed to flag content',
          data: null
        };
      }

      return {
        success: true,
        data: {
          queueId,
          message: 'Content flagged successfully'
        }
      };
    } catch (error) {
      console.error('Error in flagContent handler:', error);
      return {
        success: false,
        error: 'Internal server error',
        data: null
      };
    }
  },

  /**
   * POST /api/admin/moderation/moderate
   * Moderate content (approve/reject/escalate)
   */
  async moderateContent(queueId: string, moderatorId: string, status: ModerationStatus, notes?: string) {
    try {
      const success = await contentModerationAPI.moderateContent(queueId, moderatorId, status, notes);
      
      if (!success) {
        return {
          success: false,
          error: 'Failed to moderate content',
          data: null
        };
      }

      return {
        success: true,
        data: {
          queueId,
          status,
          message: `Content ${status} successfully`
        }
      };
    } catch (error) {
      console.error('Error in moderateContent handler:', error);
      return {
        success: false,
        error: 'Internal server error',
        data: null
      };
    }
  },

  /**
   * POST /api/admin/moderation/bulk-moderate
   * Bulk moderate multiple content items
   */
  async bulkModerate(request: BulkModerationRequest, moderatorId: string) {
    try {
      const result = await contentModerationAPI.bulkModerate(request, moderatorId);
      
      return {
        success: true,
        data: {
          ...result,
          message: `Bulk moderation completed: ${result.success.length}/${result.total} items processed successfully`
        }
      };
    } catch (error) {
      console.error('Error in bulkModerate handler:', error);
      return {
        success: false,
        error: 'Internal server error',
        data: null
      };
    }
  },

  /**
   * GET /api/admin/moderation/stats
   * Get moderation statistics
   */
  async getModerationStats() {
    try {
      const stats = await contentModerationAPI.getModerationStats();
      
      if (!stats) {
        return {
          success: false,
          error: 'Failed to fetch moderation statistics',
          data: null
        };
      }

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error in getModerationStats handler:', error);
      return {
        success: false,
        error: 'Internal server error',
        data: null
      };
    }
  },

  /**
   * GET /api/admin/moderation/flag-reasons
   * Get available flag reasons
   */
  async getFlagReasons() {
    try {
      const reasons = await contentModerationAPI.getFlagReasons();
      
      if (!reasons) {
        return {
          success: false,
          error: 'Failed to fetch flag reasons',
          data: null
        };
      }

      return {
        success: true,
        data: reasons
      };
    } catch (error) {
      console.error('Error in getFlagReasons handler:', error);
      return {
        success: false,
        error: 'Internal server error',
        data: null
      };
    }
  },

  /**
   * GET /api/admin/moderation/content/:type/:id/history
   * Get moderation history for specific content
   */
  async getContentModerationHistory(contentType: ContentType, contentId: string) {
    try {
      const history = await contentModerationAPI.getContentModerationHistory(contentType, contentId);
      
      if (!history) {
        return {
          success: false,
          error: 'Failed to fetch moderation history',
          data: null
        };
      }

      return {
        success: true,
        data: history
      };
    } catch (error) {
      console.error('Error in getContentModerationHistory handler:', error);
      return {
        success: false,
        error: 'Internal server error',
        data: null
      };
    }
  },

  /**
   * POST /api/admin/moderation/escalate
   * Escalate content to higher priority
   */
  async escalateContent(queueId: string, moderatorId: string, reason: string) {
    try {
      const success = await contentModerationAPI.escalateContent(queueId, moderatorId, reason);
      
      if (!success) {
        return {
          success: false,
          error: 'Failed to escalate content',
          data: null
        };
      }

      return {
        success: true,
        data: {
          queueId,
          message: 'Content escalated successfully'
        }
      };
    } catch (error) {
      console.error('Error in escalateContent handler:', error);
      return {
        success: false,
        error: 'Internal server error',
        data: null
      };
    }
  }
};

/**
 * Utility function to validate moderation request parameters
 */
export function validateModerationRequest(params: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (params.contentType && !['brand', 'cv'].includes(params.contentType)) {
    errors.push('Invalid content type. Must be "brand" or "cv"');
  }

  if (params.status && !['pending', 'approved', 'rejected', 'escalated'].includes(params.status)) {
    errors.push('Invalid status. Must be one of: pending, approved, rejected, escalated');
  }

  if (params.priority && (params.priority < 1 || params.priority > 5)) {
    errors.push('Invalid priority. Must be between 1 and 5');
  }

  if (params.riskScore && (params.riskScore < 0 || params.riskScore > 100)) {
    errors.push('Invalid risk score. Must be between 0 and 100');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Utility function to sanitize moderation filters
 */
export function sanitizeModerationFilters(filters: any): ContentModerationFilters {
  const sanitized: ContentModerationFilters = {};

  if (filters.status && ['pending', 'approved', 'rejected', 'escalated'].includes(filters.status)) {
    sanitized.status = filters.status;
  }

  if (filters.contentType && ['brand', 'cv'].includes(filters.contentType)) {
    sanitized.contentType = filters.contentType;
  }

  if (filters.priorityMin && Number.isInteger(filters.priorityMin) && filters.priorityMin >= 1 && filters.priorityMin <= 5) {
    sanitized.priorityMin = filters.priorityMin;
  }

  if (filters.riskScoreMin && Number.isInteger(filters.riskScoreMin) && filters.riskScoreMin >= 0 && filters.riskScoreMin <= 100) {
    sanitized.riskScoreMin = filters.riskScoreMin;
  }

  if (typeof filters.autoFlagged === 'boolean') {
    sanitized.autoFlagged = filters.autoFlagged;
  }

  if (filters.dateFrom && typeof filters.dateFrom === 'string') {
    sanitized.dateFrom = filters.dateFrom;
  }

  if (filters.dateTo && typeof filters.dateTo === 'string') {
    sanitized.dateTo = filters.dateTo;
  }

  if (filters.userId && typeof filters.userId === 'string') {
    sanitized.userId = filters.userId;
  }

  if (filters.moderatorId && typeof filters.moderatorId === 'string') {
    sanitized.moderatorId = filters.moderatorId;
  }

  return sanitized;
}

/**
 * Utility function to sanitize pagination parameters
 */
export function sanitizePagination(pagination: any): ContentModerationPagination {
  const sanitized: ContentModerationPagination = {};

  if (pagination.limit && Number.isInteger(pagination.limit) && pagination.limit > 0 && pagination.limit <= 100) {
    sanitized.limit = pagination.limit;
  }

  if (pagination.offset && Number.isInteger(pagination.offset) && pagination.offset >= 0) {
    sanitized.offset = pagination.offset;
  }

  if (pagination.sortBy && ['created_at', 'priority', 'risk_score', 'updated_at'].includes(pagination.sortBy)) {
    sanitized.sortBy = pagination.sortBy;
  }

  if (pagination.sortOrder && ['asc', 'desc'].includes(pagination.sortOrder)) {
    sanitized.sortOrder = pagination.sortOrder;
  }

  return sanitized;
}