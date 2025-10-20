import { AIFeature, AIProvider, GenerationOptions, GenerationResult } from './types';
import { OpenAIProvider } from './providers/openai-provider';
// Note: ElevenLabs provider will be implemented when needed
import { supabase } from '@/integrations/supabase/client';
import { AIContentModerationService } from './content-moderation-service';
import { backgroundProcessor } from './background-processor';
import { cdnCacheService } from './cdn-cache-service';

export interface AIServiceConfig {
  providers: {
    openai: { 
      apiKey: string;
      imageModel: 'dall-e-3' | 'dall-e-2';
      ttsModel: 'tts-1' | 'tts-1-hd';
      voiceOptions: string[];
    };
    stability: { 
      apiKey: string; 
      endpoint: string;
    };
    elevenlabs: { 
      apiKey: string; 
      voiceId: string;
    };
  };
  limits: {
    maxFileSize: number;
    maxGenerationTime: number;
    costLimits: Record<string, number>;
  };
}

export class AIServiceOrchestrator {
  private providers: Map<AIFeature, AIProvider[]> = new Map();
  private config: AIServiceConfig;
  private moderationService: AIContentModerationService;

  constructor(config: AIServiceConfig) {
    this.config = config;
    this.moderationService = new AIContentModerationService();
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize OpenAI as primary provider
    const openaiProvider = new OpenAIProvider(this.config.providers.openai);
    
    // Initialize fallback providers (will be added when needed)
    // const elevenLabsProvider = new ElevenLabsProvider(this.config.providers.elevenlabs);

    // Set up provider hierarchy for each feature
    this.providers.set(AIFeature.IMAGE_GENERATION, [
      openaiProvider
    ]);

    this.providers.set(AIFeature.VOICE_SYNTHESIS, [
      openaiProvider
      // elevenLabsProvider // Will be added when implemented
    ]);

    this.providers.set(AIFeature.VIDEO_GENERATION, [
      openaiProvider // Will be extended with video providers later
    ]);

    this.providers.set(AIFeature.ADVANCED_EDITING, [
      openaiProvider
    ]);
  }

  async generateWithFallback<T extends GenerationResult>(
    feature: AIFeature,
    request: any,
    options: GenerationOptions,
    userId: string
  ): Promise<T> {
    const providers = this.providers.get(feature) || [];
    
    if (providers.length === 0) {
      throw new Error(`No providers configured for feature: ${feature}`);
    }

    // Content moderation for text-based requests
    if (request.prompt || request.text) {
      const content = request.prompt || request.text;
      const moderationResult = await this.moderationService.moderateContent({
        id: crypto.randomUUID(),
        content,
        contentType: 'text',
        userId
      });

      if (moderationResult.flagged) {
        throw new Error('Content flagged for review: ' + moderationResult.reason);
      }
    }

    // Check cache first for cacheable requests
    const cacheKey = this.generateCacheKey(feature, request);
    const cachedResult = await cdnCacheService.getCachedAsset(cacheKey);
    
    if (cachedResult) {
      return {
        url: cachedResult,
        metadata: { provider: 'cache', cached: true }
      } as T;
    }

    // Check if this should be processed as a background job
    if (this.isResourceIntensive(feature, request)) {
      const jobId = await backgroundProcessor.queueJob({
        type: feature as any,
        payload: { request, options },
        priority: options.priority || 0,
        userId
      });

      return {
        url: '',
        metadata: { backgroundJobId: jobId, queued: true }
      } as T;
    }

    let lastError: Error | null = null;

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      
      try {
        // Check rate limits and costs before attempting generation
        await this.enforceRateLimit(userId, feature);
        await this.checkBudget(userId, feature, provider.estimateCost(request));

        // Track request start
        const requestId = await this.trackRequestStart(userId, feature, provider.name, request);

        const startTime = Date.now();
        const result = await provider.generate(request, options);
        const processingTime = Date.now() - startTime;

        // Cache the result if it's cacheable
        if (result.url && this.isCacheable(feature)) {
          try {
            // For now, we'll just store the URL in cache
            // In a real implementation, we'd fetch and store the actual asset
            await cdnCacheService.cacheAsset(
              cacheKey,
              new Blob([result.url], { type: 'text/plain' }),
              'text/plain',
              { provider: provider.name, feature }
            );
          } catch (cacheError) {
            console.warn('Failed to cache result:', cacheError);
          }
        }

        // Track successful completion
        await this.trackRequestComplete(requestId, result, processingTime);
        await this.trackSuccess(provider, feature);

        // Record performance metrics
        await this.recordPerformanceMetrics(feature, provider.name, processingTime, true, result.costCents);

        return result as T;

      } catch (error) {
        lastError = error as Error;
        
        // Track failure
        await this.trackFailure(provider, feature, lastError);
        
        // Record failure metrics
        await this.recordPerformanceMetrics(feature, provider.name, 0, false);
        
        // If this is the last provider or a non-retryable error, throw
        if (i === providers.length - 1 || !this.isRetryableError(lastError)) {
          break;
        }
        
        // Log fallback attempt
        console.warn(`Provider ${provider.name} failed for ${feature}, trying next provider:`, lastError.message);
      }
    }

    throw lastError || new Error('All AI providers failed');
  }

  private async trackRequestStart(
    userId: string, 
    feature: AIFeature, 
    provider: string, 
    request: any
  ): Promise<string> {
    const { data, error } = await supabase
      .from('ai_generation_requests')
      .insert({
        user_id: userId,
        feature,
        provider,
        prompt: request.prompt || JSON.stringify(request),
        options: request.options || {},
        status: 'processing'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to track request start:', error);
      return crypto.randomUUID(); // Fallback ID
    }

    return data.id;
  }

  private async trackRequestComplete(
    requestId: string, 
    result: GenerationResult, 
    processingTime: number
  ): Promise<void> {
    const { error } = await supabase
      .from('ai_generation_requests')
      .update({
        result_url: result.url,
        cost_cents: result.costCents || 0,
        processing_time_ms: processingTime,
        status: 'completed'
      })
      .eq('id', requestId);

    if (error) {
      console.error('Failed to track request completion:', error);
    }
  }

  private async trackSuccess(provider: AIProvider, feature: AIFeature): Promise<void> {
    // Implementation for tracking provider success rates
    console.log(`Provider ${provider.name} succeeded for ${feature}`);
  }

  private async trackFailure(provider: AIProvider, feature: AIFeature, error: Error): Promise<void> {
    // Implementation for tracking provider failure rates
    console.error(`Provider ${provider.name} failed for ${feature}:`, error.message);
  }

  private isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'rate_limit_exceeded',
      'service_unavailable',
      'timeout',
      'network_error'
    ];

    return retryableErrors.some(errorType => 
      error.message.toLowerCase().includes(errorType)
    );
  }

  private async enforceRateLimit(userId: string, feature: AIFeature): Promise<void> {
    // Check recent requests for rate limiting
    const oneMinuteAgo = new Date(Date.now() - 60000);
    
    const { data: recentRequests, error } = await supabase
      .from('ai_generation_requests')
      .select('id')
      .eq('user_id', userId)
      .eq('feature', feature)
      .gte('created_at', oneMinuteAgo.toISOString());

    if (error) {
      console.error('Failed to check rate limits:', error);
      return;
    }

    const limits = await this.getRateLimits(userId, feature);
    
    if (recentRequests.length >= limits.perMinute) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
  }

  private async checkBudget(userId: string, feature: AIFeature, estimatedCost: number): Promise<void> {
    // Get current month's usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: usage, error } = await supabase
      .from('ai_usage_tracking')
      .select('total_cost_cents')
      .eq('user_id', userId)
      .eq('feature', feature)
      .gte('period_start', startOfMonth.toISOString().split('T')[0])
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is OK
      console.error('Failed to check budget:', error);
      return;
    }

    const currentUsage = usage?.total_cost_cents || 0;
    const limits = await this.getSubscriptionLimits(userId);
    
    if (currentUsage + estimatedCost > limits.monthlyCostLimit) {
      throw new Error('Monthly budget limit exceeded. Please upgrade your subscription.');
    }
  }

  private async getRateLimits(userId: string, feature: AIFeature): Promise<{ perMinute: number }> {
    // Get user's subscription tier and return appropriate limits
    // This would integrate with the subscription system
    return { perMinute: 10 }; // Default limit
  }

  private async getSubscriptionLimits(userId: string): Promise<{ monthlyCostLimit: number }> {
    // Get user's subscription tier and return appropriate limits
    // This would integrate with the subscription system
    return { monthlyCostLimit: 1000 }; // Default limit in cents
  }

  private generateCacheKey(feature: AIFeature, request: any): string {
    return cdnCacheService.generateCacheKey(feature, request);
  }

  private isResourceIntensive(feature: AIFeature, request: any): boolean {
    switch (feature) {
      case AIFeature.IMAGE_GENERATION:
        return request.dimensions?.width * request.dimensions?.height > 1024 * 1024;
      case AIFeature.VOICE_SYNTHESIS:
        return (request.text?.length || 0) > 500;
      case AIFeature.VIDEO_GENERATION:
        return true; // Video generation is always resource-intensive
      default:
        return false;
    }
  }

  private isCacheable(feature: AIFeature): boolean {
    // All AI-generated content can be cached
    return [
      AIFeature.IMAGE_GENERATION,
      AIFeature.VOICE_SYNTHESIS,
      AIFeature.VIDEO_GENERATION
    ].includes(feature);
  }

  private async recordPerformanceMetrics(
    feature: AIFeature,
    provider: string,
    responseTime: number,
    success: boolean,
    cost?: number
  ): Promise<void> {
    const tags = { feature, provider };
    
    const metrics = [
      {
        metric_type: 'request',
        metric_name: 'response_time',
        value: responseTime,
        unit: 'ms',
        tags
      },
      {
        metric_type: 'request',
        metric_name: 'success',
        value: success ? 1 : 0,
        unit: 'boolean',
        tags
      }
    ];

    if (cost !== undefined) {
      metrics.push({
        metric_type: 'request',
        metric_name: 'cost',
        value: cost,
        unit: 'cents',
        tags
      });
    }

    try {
      await supabase.from('ai_performance_metrics').insert(metrics);
    } catch (error) {
      console.error('Failed to record performance metrics:', error);
    }
  }
}