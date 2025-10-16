/**
 * Example integration showing how to use auto-flagging in content workflows
 * This demonstrates how to integrate the auto-flagging system with existing content creation/update processes
 */

import { contentValidationIntegration } from '../content-validation-integration';
import { autoFlaggingService } from '../auto-flagging-service';

/**
 * Example: Brand creation with auto-flagging
 * This would be integrated into the brand creation API endpoint
 */
export async function createBrandWithValidation(
  brandData: any,
  userId: string
): Promise<{
  success: boolean;
  brandId?: string;
  warnings?: string[];
  flagged?: boolean;
  error?: string;
}> {
  try {
    // 1. First create the brand in the database (existing logic)
    // This is just a placeholder - replace with actual brand creation logic
    const brandId = 'example-brand-id';
    
    // 2. Run auto-flagging analysis
    const validationResult = await contentValidationIntegration.validateBrandContent(
      brandId,
      userId
    );
    
    // 3. Handle validation results
    if (!validationResult.isValid) {
      // Content failed validation - could delete or mark as draft
      return {
        success: false,
        error: 'Content failed validation checks',
        warnings: validationResult.warnings
      };
    }
    
    // 4. Return success with any warnings
    return {
      success: true,
      brandId,
      warnings: validationResult.warnings,
      flagged: validationResult.flagged
    };
    
  } catch (error) {
    console.error('Error creating brand with validation:', error);
    return {
      success: false,
      error: 'Failed to create brand'
    };
  }
}

/**
 * Example: CV creation with auto-flagging
 * This would be integrated into the CV creation API endpoint
 */
export async function createCVWithValidation(
  cvData: any,
  userId: string
): Promise<{
  success: boolean;
  cvId?: string;
  warnings?: string[];
  flagged?: boolean;
  error?: string;
}> {
  try {
    // 1. First create the CV in the database (existing logic)
    // This is just a placeholder - replace with actual CV creation logic
    const cvId = 'example-cv-id';
    
    // 2. Run auto-flagging analysis
    const validationResult = await contentValidationIntegration.validateCVContent(
      cvId,
      userId
    );
    
    // 3. Handle validation results
    if (!validationResult.isValid) {
      // Content failed validation - could delete or mark as draft
      return {
        success: false,
        error: 'Content failed validation checks',
        warnings: validationResult.warnings
      };
    }
    
    // 4. Return success with any warnings
    return {
      success: true,
      cvId,
      warnings: validationResult.warnings,
      flagged: validationResult.flagged
    };
    
  } catch (error) {
    console.error('Error creating CV with validation:', error);
    return {
      success: false,
      error: 'Failed to create CV'
    };
  }
}

/**
 * Example: Batch content analysis for existing content
 * This could be used to analyze existing content in the system
 */
export async function analyzeExistingContent(
  contentItems: Array<{ type: 'brand' | 'cv'; id: string; userId: string }>
): Promise<{
  analyzed: number;
  flagged: number;
  results: Array<{
    id: string;
    type: 'brand' | 'cv';
    flagged: boolean;
    riskScore: number;
  }>;
}> {
  try {
    const results = await autoFlaggingService.batchAnalyze(contentItems);
    
    const flaggedCount = results.filter(r => r.result.flagged).length;
    
    return {
      analyzed: results.length,
      flagged: flaggedCount,
      results: results.map(r => ({
        id: r.id,
        type: contentItems.find(item => item.id === r.id)?.type || 'brand',
        flagged: r.result.flagged,
        riskScore: r.result.risk_score.overall_score
      }))
    };
  } catch (error) {
    console.error('Error analyzing existing content:', error);
    return {
      analyzed: 0,
      flagged: 0,
      results: []
    };
  }
}

/**
 * Example: User content quality check
 * This could be used to warn users about content quality issues
 */
export async function checkUserContentQuality(userId: string): Promise<{
  shouldWarn: boolean;
  message?: string;
  suggestions: string[];
}> {
  try {
    const warningCheck = await contentValidationIntegration.shouldWarnUser(userId);
    
    return {
      shouldWarn: warningCheck.shouldWarn,
      message: warningCheck.reason,
      suggestions: warningCheck.suggestions
    };
  } catch (error) {
    console.error('Error checking user content quality:', error);
    return {
      shouldWarn: false,
      suggestions: []
    };
  }
}

/**
 * Example: Scheduled content analysis job
 * This could be run as a background job to analyze recent content
 */
export async function scheduledContentAnalysis(): Promise<{
  processed: number;
  flagged: number;
  errors: number;
}> {
  try {
    // Get recent content that hasn't been analyzed
    // This is a placeholder query - replace with actual logic
    const recentContent = [
      // { type: 'brand', id: 'brand-1', userId: 'user-1' },
      // { type: 'cv', id: 'cv-1', userId: 'user-2' },
    ];
    
    if (recentContent.length === 0) {
      return { processed: 0, flagged: 0, errors: 0 };
    }
    
    const results = await autoFlaggingService.batchAnalyze(recentContent);
    const flaggedCount = results.filter(r => r.result.flagged).length;
    
    return {
      processed: results.length,
      flagged: flaggedCount,
      errors: 0
    };
  } catch (error) {
    console.error('Error in scheduled content analysis:', error);
    return {
      processed: 0,
      flagged: 0,
      errors: 1
    };
  }
}

/**
 * Example: Real-time content validation for frontend
 * This could be used to provide real-time feedback as users type
 */
export async function validateContentRealTime(
  contentType: 'brand' | 'cv',
  contentData: any,
  userId: string
): Promise<{
  riskScore: number;
  warnings: string[];
  suggestions: string[];
}> {
  try {
    // Create a temporary analysis input without saving to database
    const analysisInput = {
      content_type: contentType,
      content_data: contentData,
      user_id: userId
    };
    
    // This would need to be implemented in the ContentRiskAnalyzer
    // For now, return a placeholder response
    return {
      riskScore: 0,
      warnings: [],
      suggestions: [
        'Use professional language',
        'Avoid promotional content',
        'Focus on authentic personal branding'
      ]
    };
  } catch (error) {
    console.error('Error validating content real-time:', error);
    return {
      riskScore: 0,
      warnings: ['Validation temporarily unavailable'],
      suggestions: []
    };
  }
}