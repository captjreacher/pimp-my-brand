import { GeneratedVideo } from './types'

export interface ExportOptions {
  platform: 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'twitter' | 'facebook'
  quality: 'standard' | 'hd' | '4k'
  format: 'mp4' | 'webm'
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:5'
}

export interface ExportResult {
  url: string
  filename: string
  size: number
  duration: number
  metadata: {
    platform: string
    dimensions: { width: number; height: number }
    bitrate: number
    codec: string
  }
}

export class VideoExportService {
  private static readonly PLATFORM_SPECS = {
    instagram: {
      maxDuration: 60,
      aspectRatios: ['1:1', '4:5', '9:16'],
      maxSize: 100 * 1024 * 1024, // 100MB
      recommendedDimensions: { '1:1': [1080, 1080], '4:5': [1080, 1350], '9:16': [1080, 1920] }
    },
    tiktok: {
      maxDuration: 180,
      aspectRatios: ['9:16'],
      maxSize: 287 * 1024 * 1024, // 287MB
      recommendedDimensions: { '9:16': [1080, 1920] }
    },
    youtube: {
      maxDuration: Infinity,
      aspectRatios: ['16:9'],
      maxSize: 256 * 1024 * 1024, // 256MB
      recommendedDimensions: { '16:9': [1920, 1080] }
    },
    linkedin: {
      maxDuration: 600,
      aspectRatios: ['16:9', '1:1'],
      maxSize: 200 * 1024 * 1024, // 200MB
      recommendedDimensions: { '16:9': [1920, 1080], '1:1': [1080, 1080] }
    },
    twitter: {
      maxDuration: 140,
      aspectRatios: ['16:9', '1:1'],
      maxSize: 512 * 1024 * 1024, // 512MB
      recommendedDimensions: { '16:9': [1280, 720], '1:1': [720, 720] }
    },
    facebook: {
      maxDuration: 240,
      aspectRatios: ['16:9', '1:1', '9:16'],
      maxSize: 4 * 1024 * 1024 * 1024, // 4GB
      recommendedDimensions: { '16:9': [1920, 1080], '1:1': [1080, 1080], '9:16': [1080, 1920] }
    }
  }

  async exportForPlatform(
    video: GeneratedVideo,
    options: ExportOptions
  ): Promise<ExportResult> {
    const platformSpec = VideoExportService.PLATFORM_SPECS[options.platform]
    
    if (!platformSpec) {
      throw new Error(`Unsupported platform: ${options.platform}`)
    }

    // Validate duration
    if (video.duration > platformSpec.maxDuration) {
      throw new Error(`Video duration (${video.duration}s) exceeds platform limit (${platformSpec.maxDuration}s)`)
    }

    // Determine aspect ratio
    const aspectRatio = options.aspectRatio || this.getDefaultAspectRatio(options.platform)
    
    if (!platformSpec.aspectRatios.includes(aspectRatio)) {
      throw new Error(`Aspect ratio ${aspectRatio} not supported for ${options.platform}`)
    }

    // Get target dimensions
    const dimensions = this.getDimensions(options.platform, aspectRatio, options.quality)
    
    // Process video (in a real implementation, this would use FFmpeg or similar)
    const processedVideo = await this.processVideo(video, {
      dimensions,
      quality: options.quality,
      format: options.format,
      platform: options.platform
    })

    return {
      url: processedVideo.url,
      filename: this.generateFilename(video, options),
      size: processedVideo.size,
      duration: video.duration,
      metadata: {
        platform: options.platform,
        dimensions,
        bitrate: this.calculateBitrate(dimensions, options.quality),
        codec: options.format === 'mp4' ? 'h264' : 'vp9'
      }
    }
  }

  private getDefaultAspectRatio(platform: string): string {
    const defaults = {
      instagram: '1:1',
      tiktok: '9:16',
      youtube: '16:9',
      linkedin: '16:9',
      twitter: '16:9',
      facebook: '16:9'
    }
    return defaults[platform as keyof typeof defaults] || '16:9'
  }

  private getDimensions(platform: string, aspectRatio: string, quality: string): { width: number; height: number } {
    const platformSpec = VideoExportService.PLATFORM_SPECS[platform as keyof typeof VideoExportService.PLATFORM_SPECS]
    const baseDimensions = (platformSpec.recommendedDimensions as any)[aspectRatio]
    
    if (!baseDimensions) {
      throw new Error(`No dimensions found for ${platform} with aspect ratio ${aspectRatio}`)
    }

    const [baseWidth, baseHeight] = baseDimensions
    
    // Adjust for quality
    const qualityMultiplier = {
      'standard': 0.75,
      'hd': 1.0,
      '4k': 2.0
    }[quality] || 1.0

    return {
      width: Math.round(baseWidth * qualityMultiplier),
      height: Math.round(baseHeight * qualityMultiplier)
    }
  }

  private calculateBitrate(dimensions: { width: number; height: number }, quality: string): number {
    const pixelCount = dimensions.width * dimensions.height
    const baseRate = pixelCount / 1000 // Base rate per 1000 pixels
    
    const qualityMultiplier = {
      'standard': 1.0,
      'hd': 1.5,
      '4k': 2.5
    }[quality] || 1.0

    return Math.round(baseRate * qualityMultiplier)
  }

  private async processVideo(
    video: GeneratedVideo,
    options: {
      dimensions: { width: number; height: number }
      quality: string
      format: string
      platform: string
    }
  ): Promise<{ url: string; size: number }> {
    // In a real implementation, this would:
    // 1. Download the original video
    // 2. Use FFmpeg.wasm or similar to process it
    // 3. Apply platform-specific optimizations
    // 4. Upload the processed video to storage
    // 5. Return the new URL and file size

    // For now, simulate processing and return the original video
    // with platform-specific metadata
    
    console.log('Processing video for platform:', options.platform)
    console.log('Target dimensions:', options.dimensions)
    console.log('Quality:', options.quality)
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Return processed video info (simulated)
    return {
      url: `${video.url}?platform=${options.platform}&quality=${options.quality}`,
      size: this.estimateFileSize(options.dimensions, video.duration, options.quality)
    }
  }

  private estimateFileSize(
    dimensions: { width: number; height: number },
    duration: number,
    quality: string
  ): number {
    const pixelsPerSecond = dimensions.width * dimensions.height * 30 // 30 FPS
    const bitsPerPixel = {
      'standard': 0.1,
      'hd': 0.15,
      '4k': 0.25
    }[quality] || 0.1

    const totalBits = pixelsPerSecond * duration * bitsPerPixel
    return Math.round(totalBits / 8) // Convert to bytes
  }

  private generateFilename(video: GeneratedVideo, options: ExportOptions): string {
    const timestamp = new Date().toISOString().slice(0, 10)
    const platform = options.platform
    const quality = options.quality
    const aspectRatio = options.aspectRatio?.replace(':', 'x') || '16x9'
    
    return `avatar-video-${video.id}-${platform}-${quality}-${aspectRatio}-${timestamp}.${options.format}`
  }

  async getBatchExportOptions(video: GeneratedVideo): Promise<ExportOptions[]> {
    // Return common export configurations for batch processing
    return [
      // Instagram options
      { platform: 'instagram', quality: 'hd', format: 'mp4', aspectRatio: '1:1' },
      { platform: 'instagram', quality: 'hd', format: 'mp4', aspectRatio: '9:16' },
      
      // TikTok
      { platform: 'tiktok', quality: 'hd', format: 'mp4', aspectRatio: '9:16' },
      
      // YouTube
      { platform: 'youtube', quality: 'hd', format: 'mp4', aspectRatio: '16:9' },
      
      // LinkedIn
      { platform: 'linkedin', quality: 'hd', format: 'mp4', aspectRatio: '16:9' },
      
      // Twitter
      { platform: 'twitter', quality: 'hd', format: 'mp4', aspectRatio: '16:9' }
    ]
  }

  async exportBatch(
    video: GeneratedVideo,
    platforms: ExportOptions['platform'][]
  ): Promise<ExportResult[]> {
    const batchOptions = await this.getBatchExportOptions(video)
    const selectedOptions = batchOptions.filter(option => 
      platforms.includes(option.platform)
    )

    const results = await Promise.all(
      selectedOptions.map(options => this.exportForPlatform(video, options))
    )

    return results
  }
}