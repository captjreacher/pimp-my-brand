import { useState, useCallback } from 'react';
import { autoFlaggingService, AutoFlaggingResult } from '@/lib/admin/auto-flagging-service';
import { contentValidationIntegration } from '@/lib/admin/content-validation-integration';
import { useToast } from '@/hooks/use-toast';

export interface AutoFlaggingStats {
  total_analyzed: number;
  total_flagged: number;
  flag_rate: number;
  avg_risk_score: number;
  risk_factor_breakdown: Record<string, number>;
}

export function useAutoFlagging() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stats, setStats] = useState<AutoFlaggingStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const { toast } = useToast();

  /**
   * Analyze a single piece of content
   */
  const analyzeContent = useCallback(async (
    type: 'brand' | 'cv',
    contentId: string,
    userId: string
  ): Promise<AutoFlaggingResult | null> => {
    setIsAnalyzing(true);
    try {
      const result = type === 'brand'
        ? await autoFlaggingService.analyzeBrand(contentId, userId)
        : await autoFlaggingService.analyzeCV(contentId, userId);

      if (result.flagged) {
        toast({
          title: "Content Flagged",
          description: `Content has been automatically flagged for review (Risk Score: ${result.risk_score.overall_score})`,
          variant: "destructive"
        });
      }

      return result;
    } catch (error) {
      console.error('Error analyzing content:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze content. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [toast]);

  /**
   * Batch analyze multiple pieces of content
   */
  const batchAnalyze = useCallback(async (
    items: Array<{ type: 'brand' | 'cv'; id: string; userId: string }>
  ): Promise<Array<{ id: string; result: AutoFlaggingResult }> | null> => {
    setIsAnalyzing(true);
    try {
      const results = await autoFlaggingService.batchAnalyze(items);
      
      const flaggedCount = results.filter(r => r.result.flagged).length;
      if (flaggedCount > 0) {
        toast({
          title: "Batch Analysis Complete",
          description: `${flaggedCount} out of ${results.length} items were flagged for review`,
          variant: flaggedCount > results.length / 2 ? "destructive" : "default"
        });
      } else {
        toast({
          title: "Batch Analysis Complete",
          description: `All ${results.length} items passed automated review`,
        });
      }

      return results;
    } catch (error) {
      console.error('Error batch analyzing content:', error);
      toast({
        title: "Batch Analysis Failed",
        description: "Failed to analyze content batch. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [toast]);

  /**
   * Validate content with user-friendly feedback
   */
  const validateContent = useCallback(async (
    type: 'brand' | 'cv',
    contentId: string,
    userId: string
  ) => {
    setIsAnalyzing(true);
    try {
      const result = type === 'brand'
        ? await contentValidationIntegration.validateBrandContent(contentId, userId)
        : await contentValidationIntegration.validateCVContent(contentId, userId);

      // Show warnings to user if any
      if (result.warnings.length > 0) {
        toast({
          title: "Content Warnings",
          description: result.warnings.join('. '),
          variant: result.flagged ? "destructive" : "default"
        });
      }

      return result;
    } catch (error) {
      console.error('Error validating content:', error);
      toast({
        title: "Validation Failed",
        description: "Failed to validate content. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [toast]);

  /**
   * Load auto-flagging statistics
   */
  const loadStats = useCallback(async (days: number = 30) => {
    setIsLoadingStats(true);
    try {
      const statsData = await autoFlaggingService.getAutoFlaggingStats(days);
      setStats(statsData);
      return statsData;
    } catch (error) {
      console.error('Error loading auto-flagging stats:', error);
      toast({
        title: "Failed to Load Stats",
        description: "Could not load auto-flagging statistics.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoadingStats(false);
    }
  }, [toast]);

  /**
   * Check if user should be warned about content quality
   */
  const checkUserWarning = useCallback(async (userId: string) => {
    try {
      return await contentValidationIntegration.shouldWarnUser(userId);
    } catch (error) {
      console.error('Error checking user warning:', error);
      return {
        shouldWarn: false,
        suggestions: []
      };
    }
  }, []);

  /**
   * Batch validate content with user-friendly results
   */
  const batchValidate = useCallback(async (
    items: Array<{ type: 'brand' | 'cv'; id: string; userId: string }>
  ) => {
    setIsAnalyzing(true);
    try {
      const results = await contentValidationIntegration.batchValidateContent(items);
      
      const flaggedCount = results.filter(r => r.flagged).length;
      const invalidCount = results.filter(r => !r.isValid).length;
      
      if (invalidCount > 0) {
        toast({
          title: "Validation Complete",
          description: `${invalidCount} items failed validation, ${flaggedCount} items flagged for review`,
          variant: "destructive"
        });
      } else if (flaggedCount > 0) {
        toast({
          title: "Validation Complete",
          description: `${flaggedCount} items flagged for review`,
          variant: "default"
        });
      } else {
        toast({
          title: "Validation Complete",
          description: `All ${results.length} items passed validation`,
        });
      }

      return results;
    } catch (error) {
      console.error('Error batch validating content:', error);
      toast({
        title: "Batch Validation Failed",
        description: "Failed to validate content batch. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [toast]);

  return {
    // State
    isAnalyzing,
    stats,
    isLoadingStats,
    
    // Actions
    analyzeContent,
    batchAnalyze,
    validateContent,
    batchValidate,
    loadStats,
    checkUserWarning
  };
}