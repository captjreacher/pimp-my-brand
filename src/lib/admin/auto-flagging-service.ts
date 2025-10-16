import { supabase } from '@/integrations/supabase/client';
import { contentRiskAnalyzer, ContentAnalysisInput, ContentRiskScore } from './content-risk-analyzer';

export interface AutoFlaggingResult {
  flagged: boolean;
  risk_score: ContentRiskScore;
  moderation_queue_id?: string;
}

export class AutoFlaggingService {
  /**
   * Analyze and potentially flag brand content
   */
  async analyzeBrand(brandId: string, userId: string): Promise<AutoFlaggingResult> {
    try {
      // Get brand data
      const { data: brand, error } = await supabase
        .from('brands')
        .select('*')
        .eq('id', brandId)
        .single();

      if (error || !brand) {
        throw new Error('Brand not found');
      }

      // Get user history
      const userHistory = await contentRiskAnalyzer.getUserHistory(userId);

      // Prepare analysis input
      const analysisInput: ContentAnalysisInput = {
        content_type: 'brand',
        title: brand.name,
        description: brand.description,
        content_data: {
          tagline: brand.tagline,
          description: brand.description,
          values: brand.values,
          style: brand.style
        },
        user_id: userId,
        user_history: userHistory
      };

      // Analyze content
      const riskScore = await contentRiskAnalyzer.analyzeContent(analysisInput);

      // Flag if necessary
      let moderationQueueId: string | undefined;
      if (riskScore.auto_flag) {
        moderationQueueId = await this.flagContent(
          'brand',
          brandId,
          userId,
          'Automatically flagged by content analysis system',
          riskScore
        );
      }

      return {
        flagged: riskScore.auto_flag,
        risk_score: riskScore,
        moderation_queue_id: moderationQueueId
      };
    } catch (error) {
      console.error('Error analyzing brand:', error);
      throw error;
    }
  }

  /**
   * Analyze and potentially flag CV content
   */
  async analyzeCV(cvId: string, userId: string): Promise<AutoFlaggingResult> {
    try {
      // Get CV data
      const { data: cv, error } = await supabase
        .from('cvs')
        .select('*')
        .eq('id', cvId)
        .single();

      if (error || !cv) {
        throw new Error('CV not found');
      }

      // Get user history
      const userHistory = await contentRiskAnalyzer.getUserHistory(userId);

      // Prepare analysis input
      const analysisInput: ContentAnalysisInput = {
        content_type: 'cv',
        title: cv.title,
        content_data: cv.content || {},
        user_id: userId,
        user_history: userHistory
      };

      // Analyze content
      const riskScore = await contentRiskAnalyzer.analyzeContent(analysisInput);

      // Flag if necessary
      let moderationQueueId: string | undefined;
      if (riskScore.auto_flag) {
        moderationQueueId = await this.flagContent(
          'cv',
          cvId,
          userId,
          'Automatically flagged by content analysis system',
          riskScore
        );
      }

      return {
        flagged: riskScore.auto_flag,
        risk_score: riskScore,
        moderation_queue_id: moderationQueueId
      };
    } catch (error) {
      console.error('Error analyzing CV:', error);
      throw error;
    }
  }

  /**
   * Flag content in the moderation queue
   */
  private async flagContent(
    contentType: 'brand' | 'cv',
    contentId: string,
    userId: string,
    reason: string,
    riskScore: ContentRiskScore
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('content_moderation_queue')
        .insert({
          content_type: contentType,
          content_id: contentId,
          user_id: userId,
          flag_reason: reason,
          status: 'pending',
          risk_score: riskScore.overall_score,
          risk_factors: riskScore.risk_factors,
          confidence: riskScore.confidence,
          flagged_by: null, // System flagged
          auto_flagged: true
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      // Log the auto-flagging action
      await this.logAutoFlagging(contentType, contentId, userId, riskScore);

      return data.id;
    } catch (error) {
      console.error('Error flagging content:', error);
      throw error;
    }
  }

  /**
   * Log auto-flagging action for audit purposes
   */
  private async logAutoFlagging(
    contentType: 'brand' | 'cv',
    contentId: string,
    userId: string,
    riskScore: ContentRiskScore
  ): Promise<void> {
    try {
      await supabase
        .from('admin_audit_log')
        .insert({
          admin_user_id: null, // System action
          action_type: 'auto_flag_content',
          target_type: contentType,
          target_id: contentId,
          details: {
            user_id: userId,
            risk_score: riskScore.overall_score,
            confidence: riskScore.confidence,
            risk_factors: riskScore.risk_factors.map(f => ({
              type: f.type,
              severity: f.severity,
              score: f.score
            }))
          }
        });
    } catch (error) {
      console.error('Error logging auto-flagging:', error);
      // Don't throw here as logging failure shouldn't break the main flow
    }
  }

  /**
   * Batch analyze multiple pieces of content
   */
  async batchAnalyze(
    items: Array<{ type: 'brand' | 'cv'; id: string; userId: string }>
  ): Promise<Array<{ id: string; result: AutoFlaggingResult }>> {
    const results: Array<{ id: string; result: AutoFlaggingResult }> = [];

    // Process in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (item) => {
        try {
          const result = item.type === 'brand' 
            ? await this.analyzeBrand(item.id, item.userId)
            : await this.analyzeCV(item.id, item.userId);
          
          return { id: item.id, result };
        } catch (error) {
          console.error(`Error analyzing ${item.type} ${item.id}:`, error);
          return {
            id: item.id,
            result: {
              flagged: false,
              risk_score: {
                overall_score: 0,
                risk_factors: [],
                auto_flag: false,
                confidence: 0
              }
            }
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches to prevent rate limiting
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Get auto-flagging statistics
   */
  async getAutoFlaggingStats(days: number = 30): Promise<{
    total_analyzed: number;
    total_flagged: number;
    flag_rate: number;
    avg_risk_score: number;
    risk_factor_breakdown: Record<string, number>;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get auto-flagged content from the last N days
      const { data: flaggedContent, error } = await supabase
        .from('content_moderation_queue')
        .select('risk_score, risk_factors')
        .eq('auto_flagged', true)
        .gte('created_at', startDate.toISOString());

      if (error) {
        throw error;
      }

      const totalFlagged = flaggedContent?.length || 0;
      
      // Calculate average risk score
      const avgRiskScore = totalFlagged > 0
        ? flaggedContent.reduce((sum, item) => sum + (item.risk_score || 0), 0) / totalFlagged
        : 0;

      // Calculate risk factor breakdown
      const riskFactorBreakdown: Record<string, number> = {};
      flaggedContent?.forEach(item => {
        if (item.risk_factors && Array.isArray(item.risk_factors)) {
          item.risk_factors.forEach((factor: any) => {
            if (factor.type) {
              riskFactorBreakdown[factor.type] = (riskFactorBreakdown[factor.type] || 0) + 1;
            }
          });
        }
      });

      // For now, we'll estimate total analyzed based on content creation
      // In a real implementation, you'd track this separately
      const estimatedAnalyzed = Math.max(totalFlagged * 10, totalFlagged); // Rough estimate

      return {
        total_analyzed: estimatedAnalyzed,
        total_flagged: totalFlagged,
        flag_rate: estimatedAnalyzed > 0 ? (totalFlagged / estimatedAnalyzed) * 100 : 0,
        avg_risk_score: Math.round(avgRiskScore * 100) / 100,
        risk_factor_breakdown: riskFactorBreakdown
      };
    } catch (error) {
      console.error('Error getting auto-flagging stats:', error);
      return {
        total_analyzed: 0,
        total_flagged: 0,
        flag_rate: 0,
        avg_risk_score: 0,
        risk_factor_breakdown: {}
      };
    }
  }
}

export const autoFlaggingService = new AutoFlaggingService();