import { supabase } from '@/integrations/supabase/client'
import { AIFeature, FeatureGate } from './feature-gate'
import { OpenAIProvider } from './providers/openai-provider'

export interface ImageOptions {
  style: 'professional' | 'creative' | 'minimal' | 'bold' | 'artistic' | 'corporate'
  dimensions: { width: number; height: number }
  format: 'logo' | 'avatar' | 'background' | 'icon' | 'banner' | 'social'
  colorPalette?: string[]
  quality?: 'standard' | 'hd'
}

export interface GeneratedImage {
  id: string
  url: string
  prompt: string
  options: ImageOptions
  provider: string
  cost: number
  metadata: any
}

export interface GenerationRequest {
  id: string
  userId: string
  feature: AIFeature
  prompt: string
  options: ImageOptions
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: GeneratedImage
  error?: string
}

export class ImageGenerationService {
  private openaiProvider: OpenAIProvider

  constructor() {
    this.openaiProvider = new OpenAIProvider({
      apiKey: process.env.OPENAI_API_KEY || '',
      imageModel: 'dall-e-3',
      ttsModel: 'tts-1-hd',
      voiceOptions: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
    })
  }

  async generateImage(
    userId: string, 
    prompt: string, 
    options: ImageOptions
  ): Promise<GeneratedImage> {
    // Check feature access
    const canAccess = await FeatureGate.canAccessFeature(userId, AIFeature.IMAGE_GENERATION)
    if (!canAccess) {
      throw new Error('Feature not available for your subscription tier')
    }

    // Check quota
    const quota = await FeatureGate.checkQuota(userId, AIFeature.IMAGE_GENERATION)
    if (!quota.canUse) {
      throw new Error(quota.reason || 'Usage limit exceeded')
    }

    // Create generation request
    const request = await this.createGenerationRequest(userId, prompt, options)

    try {
      // Update status to processing
      await this.updateRequestStatus(request.id, 'processing')

      // Generate image with primary provider (OpenAI)
      const result = await this.generateWithProvider(prompt, options)

      // Store the generated image
      const storedImage = await this.storeGeneratedImage(userId, result, request.id)

      // Track usage
      await FeatureGate.trackUsage(userId, AIFeature.IMAGE_GENERATION, result.cost)

      // Update request with result
      await this.updateRequestWithResult(request.id, storedImage)

      return storedImage

    } catch (error) {
      console.error('Image generation failed:', error)
      await this.updateRequestStatus(request.id, 'failed', error.message)
      throw error
    }
  }

  async generateLogo(userId: string, brandName: string, industry: string, style: string): Promise<GeneratedImage> {
    const prompt = this.buildLogoPrompt(brandName, industry, style)
    const options: ImageOptions = {
      style: 'professional',
      dimensions: { width: 512, height: 512 },
      format: 'logo',
      quality: 'hd'
    }

    return this.generateImage(userId, prompt, options)
  }

  async generateAvatar(userId: string, description: string, style: string): Promise<GeneratedImage> {
    const prompt = this.buildAvatarPrompt(description, style)
    const options: ImageOptions = {
      style: style as any,
      dimensions: { width: 512, height: 512 },
      format: 'avatar',
      quality: 'hd'
    }

    return this.generateImage(userId, prompt, options)
  }

  async generateBackground(userId: string, theme: string, mood: string): Promise<GeneratedImage> {
    const prompt = this.buildBackgroundPrompt(theme, mood)
    const options: ImageOptions = {
      style: 'creative',
      dimensions: { width: 1920, height: 1080 },
      format: 'background',
      quality: 'hd'
    }

    return this.generateImage(userId, prompt, options)
  }

  async enhanceImage(userId: string, imageUrl: string): Promise<GeneratedImage> {
    // Check feature access
    const canAccess = await FeatureGate.canAccessFeature(userId, AIFeature.ADVANCED_EDITING)
    if (!canAccess) {
      throw new Error('Image enhancement not available for your subscription tier')
    }

    // This would integrate with an AI enhancement service
    // For now, we'll simulate the process
    const enhancedImage: GeneratedImage = {
      id: crypto.randomUUID(),
      url: imageUrl, // In reality, this would be the enhanced image URL
      prompt: 'Image enhancement',
      options: {
        style: 'professional',
        dimensions: { width: 1024, height: 1024 },
        format: 'avatar'
      },
      provider: 'openai',
      cost: 50, // 50 cents
      metadata: { enhanced: true, originalUrl: imageUrl }
    }

    await FeatureGate.trackUsage(userId, AIFeature.ADVANCED_EDITING, enhancedImage.cost)
    return enhancedImage
  }

  async removeBackground(userId: string, imageUrl: string): Promise<GeneratedImage> {
    // Check feature access
    const canAccess = await FeatureGate.canAccessFeature(userId, AIFeature.ADVANCED_EDITING)
    if (!canAccess) {
      throw new Error('Background removal not available for your subscription tier')
    }

    // This would integrate with a background removal service
    // For now, we'll simulate the process
    const processedImage: GeneratedImage = {
      id: crypto.randomUUID(),
      url: imageUrl, // In reality, this would be the processed image URL
      prompt: 'Background removal',
      options: {
        style: 'professional',
        dimensions: { width: 1024, height: 1024 },
        format: 'avatar'
      },
      provider: 'openai',
      cost: 25, // 25 cents
      metadata: { backgroundRemoved: true, originalUrl: imageUrl }
    }

    await FeatureGate.trackUsage(userId, AIFeature.ADVANCED_EDITING, processedImage.cost)
    return processedImage
  }

  async getGenerationHistory(userId: string, limit: number = 20): Promise<GenerationRequest[]> {
    const { data, error } = await supabase
      .from('ai_generation_requests')
      .select('*')
      .eq('user_id', userId)
      .in('feature', [AIFeature.IMAGE_GENERATION, AIFeature.ADVANCED_EDITING])
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching generation history:', error)
      throw error
    }

    // Map database fields to interface fields
    return (data || []).map(record => ({
      id: record.id,
      userId: record.user_id || '',
      feature: record.feature as AIFeature,
      prompt: record.prompt || '',
      options: record.options as any,
      status: record.status as 'pending' | 'processing' | 'completed' | 'failed',
      result: record.result_url ? {
        id: record.id,
        url: record.result_url,
        prompt: record.prompt || '',
        options: record.options as any,
        provider: record.provider,
        cost: record.cost_cents || 0,
        metadata: {}
      } : undefined,
      error: record.error_message || undefined
    }))
  }

  private async generateWithProvider(prompt: string, options: ImageOptions): Promise<GeneratedImage> {
    try {
      // Try OpenAI first (preferred provider)
      const request = { prompt, options }
      const generationOptions = { userId: '', timeout: 30000 }
      const result = await this.openaiProvider.generate(request, generationOptions)
      
      return {
        id: crypto.randomUUID(),
        url: result.url,
        prompt,
        options,
        provider: 'openai',
        cost: result.costCents,
        metadata: result.metadata
      }
    } catch (error) {
      console.error('OpenAI generation failed, trying fallback:', error)
      
      // In a real implementation, we would try fallback providers here
      // For now, we'll throw the original error
      throw error
    }
  }

  private async createGenerationRequest(
    userId: string, 
    prompt: string, 
    options: ImageOptions
  ): Promise<GenerationRequest> {
    const { data, error } = await supabase
      .from('ai_generation_requests')
      .insert({
        user_id: userId,
        feature: AIFeature.IMAGE_GENERATION,
        provider: 'openai',
        prompt,
        options: options as any,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating generation request:', error)
      throw error
    }

    // Map database record to interface
    return {
      id: data.id,
      userId: data.user_id || '',
      feature: data.feature as AIFeature,
      prompt: data.prompt || '',
      options: data.options as any,
      status: data.status as 'pending' | 'processing' | 'completed' | 'failed'
    }
  }

  private async updateRequestStatus(
    requestId: string, 
    status: 'pending' | 'processing' | 'completed' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    const updates: any = { status }
    if (errorMessage) {
      updates.error_message = errorMessage
    }

    const { error } = await supabase
      .from('ai_generation_requests')
      .update(updates)
      .eq('id', requestId)

    if (error) {
      console.error('Error updating request status:', error)
      throw error
    }
  }

  private async updateRequestWithResult(requestId: string, result: GeneratedImage): Promise<void> {
    const { error } = await supabase
      .from('ai_generation_requests')
      .update({
        status: 'completed',
        result_url: result.url,
        cost_cents: result.cost
      })
      .eq('id', requestId)

    if (error) {
      console.error('Error updating request with result:', error)
      throw error
    }
  }

  private async storeGeneratedImage(
    userId: string, 
    image: GeneratedImage, 
    requestId: string
  ): Promise<GeneratedImage> {
    // In a real implementation, we would download the image and store it in Supabase Storage
    // For now, we'll just store the metadata
    const { data, error } = await supabase
      .from('generated_assets')
      .insert({
        user_id: userId,
        asset_type: 'image',
        storage_path: image.url, // This would be the actual storage path
        generation_request_id: requestId,
        metadata: {
          prompt: image.prompt,
          options: image.options,
          provider: image.provider,
          cost: image.cost
        } as any
      })
      .select()
      .single()

    if (error) {
      console.error('Error storing generated image:', error)
      throw error
    }

    return {
      ...image,
      id: data.id
    }
  }

  private buildLogoPrompt(brandName: string, industry: string, style: string): string {
    return `Create a professional logo for "${brandName}", a ${industry} company. 
            Style: ${style}. 
            The logo should be clean, memorable, and suitable for business use. 
            Vector-style design with clear typography if text is included. 
            Transparent background preferred.`
  }

  private buildAvatarPrompt(description: string, style: string): string {
    return `Create a professional avatar image: ${description}. 
            Style: ${style}. 
            High quality, well-lit, suitable for professional profiles. 
            Clean background, focused on the subject.`
  }

  private buildBackgroundPrompt(theme: string, mood: string): string {
    return `Create a background image with theme: ${theme} and mood: ${mood}. 
            High resolution, suitable for presentations or web use. 
            Professional quality with good composition and color harmony.`
  }
}