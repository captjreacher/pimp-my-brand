import { useState, useEffect, useCallback } from 'react'
import { ImageGenerationService, GeneratedImage } from '@/lib/ai/image-generation-service'
import { FeatureGate, AIFeature, QuotaStatus, SubscriptionTier } from '@/lib/ai/feature-gate'
import { useToast } from '@/hooks/use-toast'

interface UseAIContentOptions {
  userId: string
  autoRefreshQuota?: boolean
  refreshInterval?: number
}

interface UseAIContentReturn {
  // Image Generation
  generateImage: (prompt: string, options: any) => Promise<GeneratedImage>
  generateLogo: (brandName: string, industry: string, style: string) => Promise<GeneratedImage>
  generateAvatar: (description: string, style: string) => Promise<GeneratedImage>
  generateBackground: (theme: string, mood: string) => Promise<GeneratedImage>
  
  // Image Enhancement
  enhanceImage: (imageUrl: string) => Promise<GeneratedImage>
  removeBackground: (imageUrl: string) => Promise<GeneratedImage>
  
  // State
  isGenerating: boolean
  generatedImages: GeneratedImage[]
  quotaStatus: Record<AIFeature, QuotaStatus>
  subscriptionTier: SubscriptionTier
  
  // Quota Management
  checkQuota: (feature: AIFeature) => Promise<QuotaStatus>
  refreshQuota: () => Promise<void>
  canUseFeature: (feature: AIFeature) => boolean
  
  // History
  loadGenerationHistory: () => Promise<void>
  clearHistory: () => void
}

export const useAIContent = ({
  userId,
  autoRefreshQuota = true,
  refreshInterval = 60000 // 1 minute
}: UseAIContentOptions): UseAIContentReturn => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [quotaStatus, setQuotaStatus] = useState<Record<AIFeature, QuotaStatus>>({} as any)
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>(SubscriptionTier.FREE)
  
  const { toast } = useToast()
  const imageService = new ImageGenerationService()

  // Load initial data
  useEffect(() => {
    if (userId) {
      loadInitialData()
    }
  }, [userId])

  // Auto-refresh quota
  useEffect(() => {
    if (!autoRefreshQuota || !userId) return

    const interval = setInterval(() => {
      refreshQuota()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [userId, autoRefreshQuota, refreshInterval])

  const loadInitialData = async () => {
    try {
      await Promise.all([
        refreshQuota(),
        loadSubscriptionTier(),
        loadGenerationHistory()
      ])
    } catch (error) {
      console.error('Error loading initial AI content data:', error)
    }
  }

  const loadSubscriptionTier = async () => {
    try {
      // This would typically come from a user context or API call
      // For now, we'll use the FeatureGate's internal method
      const tier = await (FeatureGate as any).getUserSubscriptionTier(userId)
      setSubscriptionTier(tier)
    } catch (error) {
      console.error('Error loading subscription tier:', error)
      setSubscriptionTier(SubscriptionTier.FREE)
    }
  }

  const refreshQuota = useCallback(async () => {
    try {
      const features = [
        AIFeature.IMAGE_GENERATION,
        AIFeature.VOICE_SYNTHESIS,
        AIFeature.VIDEO_GENERATION,
        AIFeature.ADVANCED_EDITING
      ]

      const quotas: Record<AIFeature, QuotaStatus> = {} as any

      for (const feature of features) {
        quotas[feature] = await FeatureGate.checkQuota(userId, feature)
      }

      setQuotaStatus(quotas)
    } catch (error) {
      console.error('Error refreshing quota:', error)
    }
  }, [userId])

  const checkQuota = useCallback(async (feature: AIFeature): Promise<QuotaStatus> => {
    try {
      const quota = await FeatureGate.checkQuota(userId, feature)
      setQuotaStatus(prev => ({ ...prev, [feature]: quota }))
      return quota
    } catch (error) {
      console.error('Error checking quota:', error)
      throw error
    }
  }, [userId])

  const canUseFeature = useCallback((feature: AIFeature): boolean => {
    const quota = quotaStatus[feature]
    return quota?.canUse ?? false
  }, [quotaStatus])

  const loadGenerationHistory = useCallback(async () => {
    try {
      const history = await imageService.getGenerationHistory(userId, 20)
      // Convert generation requests to generated images for display
      const images: GeneratedImage[] = history
        .filter(req => req.status === 'completed' && req.result)
        .map(req => req.result!)
      
      setGeneratedImages(images)
    } catch (error) {
      console.error('Error loading generation history:', error)
    }
  }, [userId])

  const clearHistory = useCallback(() => {
    setGeneratedImages([])
  }, [])

  // Generation functions with error handling and state management
  const generateImage = useCallback(async (prompt: string, options: any): Promise<GeneratedImage> => {
    if (!canUseFeature(AIFeature.IMAGE_GENERATION)) {
      const quota = quotaStatus[AIFeature.IMAGE_GENERATION]
      throw new Error(quota?.reason || 'Feature not available')
    }

    setIsGenerating(true)
    try {
      const result = await imageService.generateImage(userId, prompt, options)
      setGeneratedImages(prev => [result, ...prev.slice(0, 19)]) // Keep last 20
      await refreshQuota() // Refresh quota after generation
      return result
    } catch (error) {
      console.error('Image generation failed:', error)
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate image",
        variant: "destructive"
      })
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [userId, canUseFeature, quotaStatus, refreshQuota, toast])

  const generateLogo = useCallback(async (brandName: string, industry: string, style: string): Promise<GeneratedImage> => {
    if (!canUseFeature(AIFeature.IMAGE_GENERATION)) {
      const quota = quotaStatus[AIFeature.IMAGE_GENERATION]
      throw new Error(quota?.reason || 'Feature not available')
    }

    setIsGenerating(true)
    try {
      const result = await imageService.generateLogo(userId, brandName, industry, style)
      setGeneratedImages(prev => [result, ...prev.slice(0, 19)])
      await refreshQuota()
      return result
    } catch (error) {
      console.error('Logo generation failed:', error)
      toast({
        title: "Logo Generation Failed",
        description: error.message || "Failed to generate logo",
        variant: "destructive"
      })
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [userId, canUseFeature, quotaStatus, refreshQuota, toast])

  const generateAvatar = useCallback(async (description: string, style: string): Promise<GeneratedImage> => {
    if (!canUseFeature(AIFeature.IMAGE_GENERATION)) {
      const quota = quotaStatus[AIFeature.IMAGE_GENERATION]
      throw new Error(quota?.reason || 'Feature not available')
    }

    setIsGenerating(true)
    try {
      const result = await imageService.generateAvatar(userId, description, style)
      setGeneratedImages(prev => [result, ...prev.slice(0, 19)])
      await refreshQuota()
      return result
    } catch (error) {
      console.error('Avatar generation failed:', error)
      toast({
        title: "Avatar Generation Failed",
        description: error.message || "Failed to generate avatar",
        variant: "destructive"
      })
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [userId, canUseFeature, quotaStatus, refreshQuota, toast])

  const generateBackground = useCallback(async (theme: string, mood: string): Promise<GeneratedImage> => {
    if (!canUseFeature(AIFeature.IMAGE_GENERATION)) {
      const quota = quotaStatus[AIFeature.IMAGE_GENERATION]
      throw new Error(quota?.reason || 'Feature not available')
    }

    setIsGenerating(true)
    try {
      const result = await imageService.generateBackground(userId, theme, mood)
      setGeneratedImages(prev => [result, ...prev.slice(0, 19)])
      await refreshQuota()
      return result
    } catch (error) {
      console.error('Background generation failed:', error)
      toast({
        title: "Background Generation Failed",
        description: error.message || "Failed to generate background",
        variant: "destructive"
      })
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [userId, canUseFeature, quotaStatus, refreshQuota, toast])

  const enhanceImage = useCallback(async (imageUrl: string): Promise<GeneratedImage> => {
    if (!canUseFeature(AIFeature.ADVANCED_EDITING)) {
      const quota = quotaStatus[AIFeature.ADVANCED_EDITING]
      throw new Error(quota?.reason || 'Feature not available')
    }

    setIsGenerating(true)
    try {
      const result = await imageService.enhanceImage(userId, imageUrl)
      setGeneratedImages(prev => [result, ...prev.slice(0, 19)])
      await refreshQuota()
      return result
    } catch (error) {
      console.error('Image enhancement failed:', error)
      toast({
        title: "Enhancement Failed",
        description: error.message || "Failed to enhance image",
        variant: "destructive"
      })
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [userId, canUseFeature, quotaStatus, refreshQuota, toast])

  const removeBackground = useCallback(async (imageUrl: string): Promise<GeneratedImage> => {
    if (!canUseFeature(AIFeature.ADVANCED_EDITING)) {
      const quota = quotaStatus[AIFeature.ADVANCED_EDITING]
      throw new Error(quota?.reason || 'Feature not available')
    }

    setIsGenerating(true)
    try {
      const result = await imageService.removeBackground(userId, imageUrl)
      setGeneratedImages(prev => [result, ...prev.slice(0, 19)])
      await refreshQuota()
      return result
    } catch (error) {
      console.error('Background removal failed:', error)
      toast({
        title: "Background Removal Failed",
        description: error.message || "Failed to remove background",
        variant: "destructive"
      })
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [userId, canUseFeature, quotaStatus, refreshQuota, toast])

  return {
    // Generation functions
    generateImage,
    generateLogo,
    generateAvatar,
    generateBackground,
    
    // Enhancement functions
    enhanceImage,
    removeBackground,
    
    // State
    isGenerating,
    generatedImages,
    quotaStatus,
    subscriptionTier,
    
    // Quota management
    checkQuota,
    refreshQuota,
    canUseFeature,
    
    // History management
    loadGenerationHistory,
    clearHistory
  }
}