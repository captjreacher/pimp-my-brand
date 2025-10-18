import { AIServiceOrchestrator, AIServiceConfig } from './service-orchestrator';
import { AIFeature, VoiceGenerationRequest, VoiceOptions, GenerationResult } from './types';
import { FeatureGate } from './feature-gate';
import { supabase } from '@/integrations/supabase/client';

export interface VoiceSynthesisOptions extends VoiceOptions {
  brandRiderContent?: string;
  customPrompt?: string;
}

export interface VoicePreset {
  id: string;
  name: string;
  voice: string;
  speed: number;
  pitch: number;
  emotion: 'neutral' | 'energetic' | 'professional' | 'friendly';
  description: string;
}

export class VoiceSynthesisService {
  private orchestrator: AIServiceOrchestrator;

  constructor(config: AIServiceConfig) {
    this.orchestrator = new AIServiceOrchestrator(config);
  }

  /**
   * Generate voiceover from brand rider content
   */
  async generateBrandRiderVoiceover(
    userId: string,
    brandRiderId: string,
    options: Partial<VoiceSynthesisOptions> = {}
  ): Promise<GenerationResult> {
    // Check subscription access
    const canAccess = await FeatureGate.canAccessFeature(userId, AIFeature.VOICE_SYNTHESIS);
    if (!canAccess) {
      throw new Error('Voice synthesis requires a Tier 1 or higher subscription');
    }

    // Get brand rider content
    const brandRiderText = await this.getBrandRiderText(brandRiderId);
    
    // Prepare optimized text for voiceover
    const optimizedText = this.optimizeTextForVoice(brandRiderText, options.customPrompt);

    const voiceRequest: VoiceGenerationRequest = {
      text: optimizedText,
      options: {
        voice: options.voice || 'professional',
        speed: options.speed || 1.0,
        pitch: options.pitch || 0,
        emotion: options.emotion || 'professional',
        maxDuration: 10 // 10-second limit as per requirements
      }
    };

    const result = await this.orchestrator.generateWithFallback<GenerationResult>(
      AIFeature.VOICE_SYNTHESIS,
      voiceRequest,
      { userId, timeout: 45000 },
      userId
    );

    // Track usage
    await FeatureGate.trackUsage(userId, AIFeature.VOICE_SYNTHESIS, result.costCents || 0);

    // Store generated voiceover reference
    await this.storeVoiceoverReference(userId, brandRiderId, result);

    return result;
  }

  /**
   * Generate custom voiceover from text
   */
  async generateCustomVoiceover(
    userId: string,
    text: string,
    options: Partial<VoiceSynthesisOptions> = {}
  ): Promise<GenerationResult> {
    // Check subscription access
    const canAccess = await FeatureGate.canAccessFeature(userId, AIFeature.VOICE_SYNTHESIS);
    if (!canAccess) {
      throw new Error('Voice synthesis requires a Tier 1 or higher subscription');
    }

    const voiceRequest: VoiceGenerationRequest = {
      text: this.optimizeTextForVoice(text),
      options: {
        voice: options.voice || 'professional',
        speed: options.speed || 1.0,
        pitch: options.pitch || 0,
        emotion: options.emotion || 'neutral',
        maxDuration: 10
      }
    };

    const result = await this.orchestrator.generateWithFallback<GenerationResult>(
      AIFeature.VOICE_SYNTHESIS,
      voiceRequest,
      { userId, timeout: 45000 },
      userId
    );

    // Track usage
    await FeatureGate.trackUsage(userId, AIFeature.VOICE_SYNTHESIS, result.costCents || 0);

    return result;
  }

  /**
   * Get available voice presets
   */
  getVoicePresets(): VoicePreset[] {
    return [
      {
        id: 'professional',
        name: 'Professional',
        voice: 'alloy',
        speed: 1.0,
        pitch: 0,
        emotion: 'professional',
        description: 'Clear, authoritative voice perfect for business presentations'
      },
      {
        id: 'energetic',
        name: 'Energetic',
        voice: 'nova',
        speed: 1.1,
        pitch: 2,
        emotion: 'energetic',
        description: 'Upbeat and dynamic voice that captures attention'
      },
      {
        id: 'friendly',
        name: 'Friendly',
        voice: 'shimmer',
        speed: 0.95,
        pitch: 1,
        emotion: 'friendly',
        description: 'Warm and approachable voice for personal branding'
      },
      {
        id: 'confident',
        name: 'Confident',
        voice: 'onyx',
        speed: 0.9,
        pitch: -1,
        emotion: 'professional',
        description: 'Strong, confident voice that commands respect'
      },
      {
        id: 'conversational',
        name: 'Conversational',
        voice: 'echo',
        speed: 1.0,
        pitch: 0,
        emotion: 'friendly',
        description: 'Natural, conversational tone for storytelling'
      }
    ];
  }

  /**
   * Get user's voice generation history
   */
  async getVoiceHistory(userId: string, limit: number = 10): Promise<any[]> {
    const { data, error } = await supabase
      .from('ai_generation_requests')
      .select(`
        id,
        prompt,
        result_url,
        cost_cents,
        created_at,
        options,
        status
      `)
      .eq('user_id', userId)
      .eq('feature', AIFeature.VOICE_SYNTHESIS)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch voice history:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get usage statistics for the current month
   */
  async getUsageStats(userId: string): Promise<{
    used: number;
    limit: number;
    costUsed: number;
    costLimit: number;
    resetDate: Date;
  }> {
    const quota = await FeatureGate.checkQuota(userId, AIFeature.VOICE_SYNTHESIS);
    const limits = await FeatureGate.getUsageLimit(userId, AIFeature.VOICE_SYNTHESIS);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data: usage } = await supabase
      .from('ai_usage_tracking')
      .select('usage_count, total_cost_cents')
      .eq('user_id', userId)
      .eq('feature', AIFeature.VOICE_SYNTHESIS)
      .gte('period_start', monthStart.toISOString().split('T')[0])
      .single();

    return {
      used: usage?.usage_count || 0,
      limit: limits.monthly,
      costUsed: usage?.total_cost_cents || 0,
      costLimit: limits.costLimit,
      resetDate: quota.resetDate
    };
  }

  private async getBrandRiderText(brandRiderId: string): Promise<string> {
    const { data: brand, error } = await supabase
      .from('brands')
      .select('title, tagline, bio, strengths')
      .eq('id', brandRiderId)
      .single();

    if (error || !brand) {
      throw new Error('Brand rider not found');
    }

    // Combine brand elements into a cohesive script
    let script = `${brand.title || 'Personal Brand'}. `;
    
    if (brand.tagline) {
      script += `${brand.tagline}. `;
    }
    
    if (brand.bio) {
      script += `${brand.bio}. `;
    }

    if (brand.strengths && Array.isArray(brand.strengths)) {
      const keyPoints = brand.strengths.slice(0, 2); // Limit to 2 key points for 10-second duration
      script += keyPoints.join('. ') + '.';
    }

    return script;
  }

  private optimizeTextForVoice(text: string, customPrompt?: string): string {
    if (customPrompt) {
      return customPrompt;
    }

    // Clean up text for better voice synthesis
    let optimized = text
      .replace(/\n+/g, '. ') // Replace line breaks with periods
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.,!?-]/g, '') // Remove special characters except basic punctuation
      .trim();

    // Ensure proper sentence endings
    if (!optimized.match(/[.!?]$/)) {
      optimized += '.';
    }

    // Add natural pauses for better flow
    optimized = optimized
      .replace(/\. /g, '. ') // Ensure space after periods
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2'); // Proper spacing between sentences

    return optimized;
  }

  private async storeVoiceoverReference(
    userId: string,
    brandRiderId: string,
    result: GenerationResult
  ): Promise<void> {
    const { error } = await supabase
      .from('generated_assets')
      .insert({
        user_id: userId,
        asset_type: 'audio',
        storage_path: result.url,
        metadata: {
          brand_rider_id: brandRiderId,
          generation_metadata: result.metadata,
          cost_cents: result.costCents
        },
        is_public: false,
        moderation_status: 'approved' // Voice content is generally safe
      });

    if (error) {
      console.error('Failed to store voiceover reference:', error);
      // Don't throw error as the generation was successful
    }
  }
}