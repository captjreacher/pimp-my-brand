import { autoFlaggingService, AutoFlaggingResult } from './auto-flagging-service';

/**
 * Integration service to hook auto-flagging into content creation/update workflows
 */
export class ContentValidationIntegration {
  /**
   * Validate brand content during creation/update
   * This should be called after brand is saved to database
   */
  async validateBrandContent(brandId: string, userId: string): Promise<{
    isValid: boolean;
    flagged: boolean;
    riskScore: number;
    warnings: string[];
  }> {
    try {
      const result = await autoFlaggingService.analyzeBrand(brandId, userId);
      
      const warnings: string[] = [];
      
      // Add warnings based on risk factors
      if (result.risk_score.risk_factors.length > 0) {
        result.risk_score.risk_factors.forEach(factor => {
          if (factor.severity === 'high') {
            warnings.push(`High risk: ${factor.description}`);
          } else if (factor.severity === 'medium' && factor.score > 20) {
            warnings.push(`Medium risk: ${factor.description}`);
          }
        });
      }
      
      // Content is considered valid unless it's auto-flagged with high confidence
      const isValid = !(result.flagged && result.risk_score.confidence > 0.8);
      
      return {
        isValid,
        flagged: result.flagged,
        riskScore: result.risk_score.overall_score,
        warnings
      };
    } catch (error) {
      console.error('Error validating brand content:', error);
      // On error, allow content but log the issue
      return {
        isValid: true,
        flagged: false,
        riskScore: 0,
        warnings: ['Content validation temporarily unavailable']
      };
    }
  }

  /**
   * Validate CV content during creation/update
   * This should be called after CV is saved to database
   */
  async validateCVContent(cvId: string, userId: string): Promise<{
    isValid: boolean;
    flagged: boolean;
    riskScore: number;
    warnings: string[];
  }> {
    try {
      const result = await autoFlaggingService.analyzeCV(cvId, userId);
      
      const warnings: string[] = [];
      
      // Add warnings based on risk factors
      if (result.risk_score.risk_factors.length > 0) {
        result.risk_score.risk_factors.forEach(factor => {
          if (factor.severity === 'high') {
            warnings.push(`High risk: ${factor.description}`);
          } else if (factor.severity === 'medium' && factor.score > 20) {
            warnings.push(`Medium risk: ${factor.description}`);
          }
        });
      }
      
      // Content is considered valid unless it's auto-flagged with high confidence
      const isValid = !(result.flagged && result.risk_score.confidence > 0.8);
      
      return {
        isValid,
        flagged: result.flagged,
        riskScore: result.risk_score.overall_score,
        warnings
      };
    } catch (error) {
      console.error('Error validating CV content:', error);
      // On error, allow content but log the issue
      return {
        isValid: true,
        flagged: false,
        riskScore: 0,
        warnings: ['Content validation temporarily unavailable']
      };
    }
  }

  /**
   * Batch validate multiple pieces of content
   * Useful for processing existing content or bulk operations
   */
  async batchValidateContent(
    items: Array<{ type: 'brand' | 'cv'; id: string; userId: string }>
  ): Promise<Array<{
    id: string;
    type: 'brand' | 'cv';
    isValid: boolean;
    flagged: boolean;
    riskScore: number;
    warnings: string[];
  }>> {
    try {
      const results = await autoFlaggingService.batchAnalyze(items);
      
      return results.map(({ id, result }) => {
        const item = items.find(i => i.id === id);
        const warnings: string[] = [];
        
        // Add warnings based on risk factors
        if (result.risk_score.risk_factors.length > 0) {
          result.risk_score.risk_factors.forEach(factor => {
            if (factor.severity === 'high') {
              warnings.push(`High risk: ${factor.description}`);
            } else if (factor.severity === 'medium' && factor.score > 20) {
              warnings.push(`Medium risk: ${factor.description}`);
            }
          });
        }
        
        const isValid = !(result.flagged && result.risk_score.confidence > 0.8);
        
        return {
          id,
          type: item?.type || 'brand',
          isValid,
          flagged: result.flagged,
          riskScore: result.risk_score.overall_score,
          warnings
        };
      });
    } catch (error) {
      console.error('Error batch validating content:', error);
      // Return safe defaults on error
      return items.map(item => ({
        id: item.id,
        type: item.type,
        isValid: true,
        flagged: false,
        riskScore: 0,
        warnings: ['Content validation temporarily unavailable']
      }));
    }
  }

  /**
   * Check if user should be warned about content quality
   */
  async shouldWarnUser(userId: string): Promise<{
    shouldWarn: boolean;
    reason?: string;
    suggestions: string[];
  }> {
    try {
      const userHistory = await autoFlaggingService['contentRiskAnalyzer'].getUserHistory(userId);
      
      if (!userHistory) {
        return {
          shouldWarn: false,
          suggestions: []
        };
      }
      
      const suggestions: string[] = [];
      let shouldWarn = false;
      let reason: string | undefined;
      
      // Check for multiple recent flags
      if (userHistory.previous_flags > 2) {
        shouldWarn = true;
        reason = 'Multiple pieces of your content have been flagged for review';
        suggestions.push('Review our content guidelines');
        suggestions.push('Ensure your content is appropriate and follows platform rules');
      }
      
      // Check for new account with high activity
      if (userHistory.account_age_days < 3 && userHistory.content_count > 10) {
        shouldWarn = true;
        reason = reason || 'High content creation rate detected';
        suggestions.push('Take time to review and refine your content');
        suggestions.push('Quality is more important than quantity');
      }
      
      // General suggestions for flagged users
      if (userHistory.previous_flags > 0) {
        suggestions.push('Use professional language in your content');
        suggestions.push('Avoid promotional or spam-like content');
        suggestions.push('Focus on authentic personal branding');
      }
      
      return {
        shouldWarn,
        reason,
        suggestions
      };
    } catch (error) {
      console.error('Error checking user warning status:', error);
      return {
        shouldWarn: false,
        suggestions: []
      };
    }
  }
}

export const contentValidationIntegration = new ContentValidationIntegration();