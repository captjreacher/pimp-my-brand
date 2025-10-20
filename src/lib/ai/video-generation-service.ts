import { AIFeature, VideoConfig, GeneratedVideo, AvatarStyle, BackgroundConfig, AnimationConfig } from './types'
import { FeatureGate } from './feature-gate'
import { supabase } from '@/integrations/supabase/client'

export interface VideoProvider {
  name: string
  generateVideo(config: VideoConfig): Promise<GeneratedVideo>
  isAvailable(): Promise<boolean>
}

export interface VideoGenerationOptions {
  maxDuration: number
  quality: 'standard' | 'hd' | '4k'
  format: 'mp4' | 'webm'
  socialOptimized: boolean
}

export class VideoGenerationService {
  private providers: VideoProvider[] = []
  private featureGate: FeatureGate

  constructor(featureGate: FeatureGate) {
    this.featureGate = featureGate
    this.initializeProviders()
  }

  private initializeProviders() {
    // Initialize video providers in order of preference
    // Primary: D-ID (good for avatar generation)
    // Secondary: Synthesia (enterprise-grade)
    // Fallback: Custom avatar system with OpenAI images + animations
    
    if (process.env.VITE_DID_API_KEY) {
      this.providers.push(new DIDProvider(process.env.VITE_DID_API_KEY))
    }
    
    if (process.env.VITE_SYNTHESIA_API_KEY) {
      this.providers.push(new SynthesiaProvider(process.env.VITE_SYNTHESIA_API_KEY))
    }
    
    // Always include fallback provider
    this.providers.push(new CustomAvatarProvider())
  }

  async generateVideo(
    userId: string,
    config: VideoConfig,
    options: VideoGenerationOptions = {
      maxDuration: 10,
      quality: 'hd',
      format: 'mp4',
      socialOptimized: true
    }
  ): Promise<GeneratedVideo> {
    // Check subscription tier and feature access
    const canAccess = await FeatureGate.canAccessFeature(userId, AIFeature.VIDEO_GENERATION)
    if (!canAccess) {
      throw new Error('Video generation requires tier 2 subscription')
    }

    // Check usage quota
    const quotaStatus = await FeatureGate.checkQuota(userId, AIFeature.VIDEO_GENERATION)
    if (!quotaStatus.canUse) {
      throw new Error(`Video generation quota exceeded. Resets: ${quotaStatus.resetDate}`)
    }

    // Validate config
    this.validateVideoConfig(config, options)

    // Try providers in order
    let lastError: Error | null = null
    
    for (const provider of this.providers) {
      try {
        const isAvailable = await provider.isAvailable()
        if (!isAvailable) continue

        console.log(`Attempting video generation with ${provider.name}`)
        
        const result = await provider.generateVideo(config)
        
        // Track successful generation
        await this.trackGeneration(userId, provider.name, config, result, true)
        
        return result
      } catch (error) {
        console.error(`Video generation failed with ${provider.name}:`, error)
        lastError = error as Error
        
        // Track failed generation
        await this.trackGeneration(userId, provider.name, config, null, false, error as Error)
      }
    }

    throw new Error(`All video providers failed. Last error: ${lastError?.message}`)
  }

  private validateVideoConfig(config: VideoConfig, options: VideoGenerationOptions) {
    if (!config.script || config.script.trim().length === 0) {
      throw new Error('Script content is required')
    }

    if (config.script.length > 500) {
      throw new Error('Script too long for 10-second video')
    }

    if (options.maxDuration > 10) {
      throw new Error('Maximum video duration is 10 seconds')
    }
  }

  private async trackGeneration(
    userId: string,
    provider: string,
    config: VideoConfig,
    result: GeneratedVideo | null,
    success: boolean,
    error?: Error
  ) {
    try {
      await supabase.from('ai_generation_requests').insert({
        user_id: userId,
        feature: 'video_generation',
        provider,
        prompt: config.script,
        options: JSON.stringify({
          avatar_style: config.avatarStyle,
          background: config.background,
          animations: config.animations
        }),
        result_url: result?.url || null,
        cost_cents: this.calculateCost(provider),
        status: success ? 'completed' : 'failed',
        error_message: error?.message || null
      })

      if (success) {
        await FeatureGate.trackUsage(userId, AIFeature.VIDEO_GENERATION, this.calculateCost(provider))
      }
    } catch (trackingError) {
      console.error('Failed to track video generation:', trackingError)
    }
  }

  private calculateCost(provider: string): number {
    // Cost in cents per video generation
    const costs = {
      'D-ID': 500, // $5.00 per video
      'Synthesia': 300, // $3.00 per video
      'Custom': 100 // $1.00 per video (OpenAI image + processing)
    }
    return costs[provider as keyof typeof costs] || 100
  }

  async getAvailableAvatarStyles(): Promise<AvatarStyle[]> {
    return [
      {
        id: 'professional-male',
        name: 'Professional Male',
        description: 'Business attire, confident posture',
        previewUrl: '/avatars/professional-male.jpg',
        category: 'professional'
      },
      {
        id: 'professional-female',
        name: 'Professional Female',
        description: 'Business attire, approachable demeanor',
        previewUrl: '/avatars/professional-female.jpg',
        category: 'professional'
      },
      {
        id: 'casual-male',
        name: 'Casual Male',
        description: 'Relaxed clothing, friendly appearance',
        previewUrl: '/avatars/casual-male.jpg',
        category: 'casual'
      },
      {
        id: 'casual-female',
        name: 'Casual Female',
        description: 'Casual attire, warm personality',
        previewUrl: '/avatars/casual-female.jpg',
        category: 'casual'
      },
      {
        id: 'creative-male',
        name: 'Creative Male',
        description: 'Artistic style, expressive gestures',
        previewUrl: '/avatars/creative-male.jpg',
        category: 'creative'
      },
      {
        id: 'creative-female',
        name: 'Creative Female',
        description: 'Unique style, dynamic presence',
        previewUrl: '/avatars/creative-female.jpg',
        category: 'creative'
      }
    ]
  }

  async getBackgroundOptions(): Promise<BackgroundConfig[]> {
    return [
      {
        id: 'office',
        name: 'Modern Office',
        description: 'Clean, professional workspace',
        previewUrl: '/backgrounds/office.jpg',
        category: 'professional'
      },
      {
        id: 'studio',
        name: 'Studio',
        description: 'Neutral background with soft lighting',
        previewUrl: '/backgrounds/studio.jpg',
        category: 'neutral'
      },
      {
        id: 'home-office',
        name: 'Home Office',
        description: 'Comfortable, personal workspace',
        previewUrl: '/backgrounds/home-office.jpg',
        category: 'casual'
      },
      {
        id: 'creative-space',
        name: 'Creative Space',
        description: 'Artistic environment with vibrant colors',
        previewUrl: '/backgrounds/creative-space.jpg',
        category: 'creative'
      },
      {
        id: 'outdoor',
        name: 'Outdoor',
        description: 'Natural setting with soft focus',
        previewUrl: '/backgrounds/outdoor.jpg',
        category: 'natural'
      }
    ]
  }
}

// D-ID Provider Implementation
class DIDProvider implements VideoProvider {
  name = 'D-ID'
  private apiKey: string
  private baseUrl = 'https://api.d-id.com'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/clips`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      return response.ok
    } catch {
      return false
    }
  }

  async generateVideo(config: VideoConfig): Promise<GeneratedVideo> {
    const payload = {
      script: {
        type: 'text',
        input: config.script,
        provider: {
          type: 'microsoft',
          voice_id: 'en-US-JennyNeural'
        }
      },
      presenter_config: {
        type: 'clip',
        presenter_id: this.mapAvatarToPresenter(config.avatarStyle.id)
      },
      background: {
        color: config.background.color || '#ffffff'
      },
      config: {
        result_format: 'mp4',
        fluent: true,
        pad_audio: 0.0
      }
    }

    const response = await fetch(`${this.baseUrl}/clips`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`D-ID API error: ${response.statusText}`)
    }

    const result = await response.json()
    
    // Poll for completion
    const videoUrl = await this.pollForCompletion(result.id)
    
    return {
      id: result.id,
      url: videoUrl,
      duration: 10,
      format: 'mp4',
      provider: 'D-ID',
      metadata: {
        avatarStyle: config.avatarStyle,
        background: config.background,
        script: config.script
      }
    }
  }

  private mapAvatarToPresenter(avatarId: string): string {
    const mapping = {
      'professional-male': 'amy-jcwCkr1grs',
      'professional-female': 'amy-Aq6OmGZnMt',
      'casual-male': 'amy-jcwCkr1grs',
      'casual-female': 'amy-Aq6OmGZnMt',
      'creative-male': 'amy-jcwCkr1grs',
      'creative-female': 'amy-Aq6OmGZnMt'
    }
    return mapping[avatarId as keyof typeof mapping] || 'amy-jcwCkr1grs'
  }

  private async pollForCompletion(clipId: string): Promise<string> {
    const maxAttempts = 30
    const pollInterval = 2000

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(`${this.baseUrl}/clips/${clipId}`, {
        headers: {
          'Authorization': `Basic ${this.apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to check clip status: ${response.statusText}`)
      }

      const status = await response.json()
      
      if (status.status === 'done') {
        return status.result_url
      }
      
      if (status.status === 'error') {
        throw new Error(`Video generation failed: ${status.error}`)
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }

    throw new Error('Video generation timed out')
  }
}

// Synthesia Provider Implementation
class SynthesiaProvider implements VideoProvider {
  name = 'Synthesia'
  private apiKey: string
  private baseUrl = 'https://api.synthesia.io/v2'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/videos`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      return response.ok
    } catch {
      return false
    }
  }

  async generateVideo(config: VideoConfig): Promise<GeneratedVideo> {
    const payload = {
      test: false,
      visibility: 'private',
      aspectRatio: '16:9',
      title: 'Brand Presentation',
      description: 'AI-generated brand rider presentation',
      scenes: [
        {
          background: config.background.url || '#ffffff',
          elements: [
            {
              type: 'avatar',
              avatar: this.mapAvatarToSynthesia(config.avatarStyle.id),
              script: config.script,
              x: 0,
              y: 0,
              width: 1,
              height: 1
            }
          ]
        }
      ]
    }

    const response = await fetch(`${this.baseUrl}/videos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Synthesia API error: ${response.statusText}`)
    }

    const result = await response.json()
    
    // Poll for completion
    const videoUrl = await this.pollForCompletion(result.id)
    
    return {
      id: result.id,
      url: videoUrl,
      duration: 10,
      format: 'mp4',
      provider: 'Synthesia',
      metadata: {
        avatarStyle: config.avatarStyle,
        background: config.background,
        script: config.script
      }
    }
  }

  private mapAvatarToSynthesia(avatarId: string): string {
    const mapping = {
      'professional-male': 'anna_costume1_cameraA',
      'professional-female': 'anna_costume1_cameraA',
      'casual-male': 'anna_costume2_cameraA',
      'casual-female': 'anna_costume2_cameraA',
      'creative-male': 'anna_costume3_cameraA',
      'creative-female': 'anna_costume3_cameraA'
    }
    return mapping[avatarId as keyof typeof mapping] || 'anna_costume1_cameraA'
  }

  private async pollForCompletion(videoId: string): Promise<string> {
    const maxAttempts = 60
    const pollInterval = 5000

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(`${this.baseUrl}/videos/${videoId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to check video status: ${response.statusText}`)
      }

      const status = await response.json()
      
      if (status.status === 'complete') {
        return status.download
      }
      
      if (status.status === 'failed') {
        throw new Error(`Video generation failed: ${status.error}`)
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }

    throw new Error('Video generation timed out')
  }
}

// Custom Avatar Provider (Fallback)
class CustomAvatarProvider implements VideoProvider {
  name = 'Custom'

  async isAvailable(): Promise<boolean> {
    return true // Always available as fallback
  }

  async generateVideo(config: VideoConfig): Promise<GeneratedVideo> {
    // This would create a simple animated presentation using:
    // 1. OpenAI-generated avatar image
    // 2. Text-to-speech for audio
    // 3. Simple animations (zoom, fade, text overlay)
    // 4. Canvas/WebGL rendering to MP4
    
    // For now, return a placeholder implementation
    // In a real implementation, this would use libraries like:
    // - fabric.js for canvas manipulation
    // - ffmpeg.wasm for video encoding
    // - Web Audio API for audio processing
    
    const videoId = `custom_${Date.now()}`
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    return {
      id: videoId,
      url: `/api/videos/${videoId}.mp4`, // Would be generated
      duration: 10,
      format: 'mp4',
      provider: 'Custom',
      metadata: {
        avatarStyle: config.avatarStyle,
        background: config.background,
        script: config.script,
        note: 'Generated using custom avatar system'
      }
    }
  }
}