import { supabase } from '@/integrations/supabase/client'

export interface BackgroundJob {
  id: string
  type: 'image_generation' | 'voice_synthesis' | 'video_generation' | 'content_moderation'
  payload: Record<string, any>
  status: 'pending' | 'processing' | 'completed' | 'failed'
  priority: number
  userId: string
  createdAt: string
  processedAt?: string
  completedAt?: string
  error?: string
  result?: any
}

export class BackgroundJobProcessor {
  private isProcessing = false
  private processingInterval: NodeJS.Timeout | null = null
  private maxConcurrentJobs = 3
  private currentJobs = new Set<string>()

  constructor() {
    this.startProcessing()
  }

  async queueJob(job: Omit<BackgroundJob, 'id' | 'status' | 'createdAt'>): Promise<string> {
    const { data, error } = await supabase
      .from('ai_background_jobs')
      .insert({
        type: job.type,
        payload: job.payload,
        priority: job.priority,
        user_id: job.userId,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error
    return data.id
  }

  async getJobStatus(jobId: string): Promise<BackgroundJob | null> {
    const { data, error } = await supabase
      .from('ai_background_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error) return null
    return this.mapDbJobToJob(data)
  }

  async getUserJobs(userId: string, limit = 50): Promise<BackgroundJob[]> {
    const { data, error } = await supabase
      .from('ai_background_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data.map(this.mapDbJobToJob)
  }

  private startProcessing() {
    if (this.processingInterval) return

    this.processingInterval = setInterval(async () => {
      if (this.currentJobs.size >= this.maxConcurrentJobs) return

      try {
        await this.processNextJob()
      } catch (error) {
        console.error('Background job processing error:', error)
      }
    }, 5000) // Check every 5 seconds
  }

  private async processNextJob() {
    // Get next pending job with highest priority
    const { data: jobs, error } = await supabase
      .from('ai_background_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)

    if (error || !jobs || jobs.length === 0) return

    const job = this.mapDbJobToJob(jobs[0])
    
    // Check if we're already processing this job
    if (this.currentJobs.has(job.id)) return

    this.currentJobs.add(job.id)

    try {
      // Mark as processing
      await this.updateJobStatus(job.id, 'processing')

      // Process the job based on type
      const result = await this.executeJob(job)

      // Mark as completed
      await this.updateJobStatus(job.id, 'completed', undefined, result)
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error)
      await this.updateJobStatus(job.id, 'failed', error.message)
    } finally {
      this.currentJobs.delete(job.id)
    }
  }

  private async executeJob(job: BackgroundJob): Promise<any> {
    switch (job.type) {
      case 'image_generation':
        return await this.processImageGeneration(job)
      case 'voice_synthesis':
        return await this.processVoiceSynthesis(job)
      case 'video_generation':
        return await this.processVideoGeneration(job)
      case 'content_moderation':
        return await this.processContentModeration(job)
      default:
        throw new Error(`Unknown job type: ${job.type}`)
    }
  }

  private async processImageGeneration(job: BackgroundJob): Promise<any> {
    const { AIServiceOrchestrator } = await import('./service-orchestrator')
    const orchestrator = new AIServiceOrchestrator()
    
    const result = await orchestrator.generateImage(
      job.payload.prompt,
      job.payload.options
    )

    // Update the original generation request
    if (job.payload.requestId) {
      await supabase
        .from('ai_generation_requests')
        .update({
          status: 'completed',
          result_url: result.url,
          processing_time_ms: Date.now() - new Date(job.createdAt).getTime()
        })
        .eq('id', job.payload.requestId)
    }

    return result
  }

  private async processVoiceSynthesis(job: BackgroundJob): Promise<any> {
    const { VoiceSynthesisService } = await import('./voice-synthesis-service')
    const voiceService = new VoiceSynthesisService()
    
    const result = await voiceService.generateVoice(
      job.payload.text,
      job.payload.options
    )

    // Update the original generation request
    if (job.payload.requestId) {
      await supabase
        .from('ai_generation_requests')
        .update({
          status: 'completed',
          result_url: result.audioUrl,
          processing_time_ms: Date.now() - new Date(job.createdAt).getTime()
        })
        .eq('id', job.payload.requestId)
    }

    return result
  }

  private async processVideoGeneration(job: BackgroundJob): Promise<any> {
    const { VideoGenerationService } = await import('./video-generation-service')
    const videoService = new VideoGenerationService()
    
    const result = await videoService.generateVideo(job.payload.config)

    // Update the original generation request
    if (job.payload.requestId) {
      await supabase
        .from('ai_generation_requests')
        .update({
          status: 'completed',
          result_url: result.videoUrl,
          processing_time_ms: Date.now() - new Date(job.createdAt).getTime()
        })
        .eq('id', job.payload.requestId)
    }

    return result
  }

  private async processContentModeration(job: BackgroundJob): Promise<any> {
    const { AIContentModerationService } = await import('./content-moderation-service')
    const moderationService = new AIContentModerationService()
    
    const result = await moderationService.moderateContent(job.payload.request)

    // Log moderation result
    await moderationService.logModerationResult(
      job.payload.request.id,
      result,
      job.payload.request.userId
    )

    return result
  }

  private async updateJobStatus(
    jobId: string, 
    status: BackgroundJob['status'], 
    error?: string, 
    result?: any
  ) {
    const updates: any = { status }
    
    if (status === 'processing') {
      updates.processed_at = new Date().toISOString()
    } else if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString()
    }
    
    if (error) updates.error = error
    if (result) updates.result = result

    await supabase
      .from('ai_background_jobs')
      .update(updates)
      .eq('id', jobId)
  }

  private mapDbJobToJob(dbJob: any): BackgroundJob {
    return {
      id: dbJob.id,
      type: dbJob.type,
      payload: dbJob.payload,
      status: dbJob.status,
      priority: dbJob.priority,
      userId: dbJob.user_id,
      createdAt: dbJob.created_at,
      processedAt: dbJob.processed_at,
      completedAt: dbJob.completed_at,
      error: dbJob.error,
      result: dbJob.result
    }
  }

  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }
  }
}

// Singleton instance
export const backgroundProcessor = new BackgroundJobProcessor()