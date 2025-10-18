import { useState, useCallback } from 'react'
import { VideoGenerationService } from '@/lib/ai/video-generation-service'
import { FeatureGate } from '@/lib/ai/feature-gate'
import { VideoConfig, GeneratedVideo, AvatarStyle, BackgroundConfig } from '@/lib/ai/types'
import { useSubscription } from './use-subscription'
import { useToast } from './use-toast'

interface UseVideoGenerationOptions {
  onSuccess?: (video: GeneratedVideo) => void
  onError?: (error: Error) => void
}

export function useVideoGeneration(options: UseVideoGenerationOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null)
  const [availableAvatars, setAvailableAvatars] = useState<AvatarStyle[]>([])
  const [availableBackgrounds, setAvailableBackgrounds] = useState<BackgroundConfig[]>([])
  
  const { subscription } = useSubscription()
  const { toast } = useToast()
  
  const videoService = new VideoGenerationService(new FeatureGate())

  const loadOptions = useCallback(async () => {
    try {
      const [avatars, backgrounds] = await Promise.all([
        videoService.getAvailableAvatarStyles(),
        videoService.getBackgroundOptions()
      ])
      setAvailableAvatars(avatars)
      setAvailableBackgrounds(backgrounds)
      return { avatars, backgrounds }
    } catch (error) {
      console.error('Failed to load video options:', error)
      throw error
    }
  }, [])

  const generateVideo = useCallback(async (config: VideoConfig) => {
    if (subscription?.plan !== 'premium') {
      const error = new Error('Video generation requires Premium subscription')
      options.onError?.(error)
      throw error
    }

    setIsGenerating(true)
    setProgress(0)
    setGeneratedVideo(null)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90))
      }, 1000)

      const video = await videoService.generateVideo('current-user-id', config)
      
      clearInterval(progressInterval)
      setProgress(100)
      setGeneratedVideo(video)
      
      options.onSuccess?.(video)
      
      toast({
        title: 'Video Generated Successfully',
        description: 'Your AI avatar video is ready for download and sharing'
      })
      
      return video
    } catch (error) {
      const err = error as Error
      console.error('Video generation failed:', err)
      
      options.onError?.(err)
      
      toast({
        title: 'Video Generation Failed',
        description: err.message || 'An unexpected error occurred',
        variant: 'destructive'
      })
      
      throw err
    } finally {
      setIsGenerating(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }, [subscription, options, toast])

  const downloadVideo = useCallback(async (video: GeneratedVideo) => {
    try {
      const response = await fetch(video.url)
      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `avatar-video-${video.id}.${video.format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: 'Download Started',
        description: 'Your video is being downloaded'
      })
    } catch (error) {
      console.error('Download failed:', error)
      toast({
        title: 'Download Failed',
        description: 'Failed to download the video',
        variant: 'destructive'
      })
    }
  }, [toast])

  const shareVideo = useCallback(async (video: GeneratedVideo) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My AI Avatar Video',
          text: 'Check out my AI-generated avatar presentation!',
          url: video.url
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(video.url)
        toast({
          title: 'Link Copied',
          description: 'Video link copied to clipboard'
        })
      } catch (error) {
        console.error('Copy failed:', error)
        toast({
          title: 'Share Failed',
          description: 'Unable to share video',
          variant: 'destructive'
        })
      }
    }
  }, [toast])

  const canGenerate = subscription?.plan === 'premium' && !isGenerating

  return {
    // State
    isGenerating,
    progress,
    generatedVideo,
    availableAvatars,
    availableBackgrounds,
    canGenerate,
    
    // Actions
    loadOptions,
    generateVideo,
    downloadVideo,
    shareVideo,
    
    // Utils
    resetGeneration: () => {
      setGeneratedVideo(null)
      setProgress(0)
    }
  }
}