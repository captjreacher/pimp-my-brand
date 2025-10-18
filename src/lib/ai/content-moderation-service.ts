import { supabase } from '@/integrations/supabase/client'

export interface ModerationResult {
  flagged: boolean
  categories: string[]
  confidence: number
  reason?: string
}

export interface ContentModerationRequest {
  id: string
  content: string
  contentType: 'text' | 'image' | 'audio' | 'video'
  userId: string
  metadata?: Record<string, any>
}

export class AIContentModerationService {
  private openaiApiKey: string

  constructor() {
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || ''
  }

  async moderateContent(request: ContentModerationRequest): Promise<ModerationResult> {
    try {
      // Use OpenAI's moderation API for text content
      if (request.contentType === 'text') {
        return await this.moderateText(request.content)
      }
      
      // For images, use OpenAI's vision model for content analysis
      if (request.contentType === 'image') {
        return await this.moderateImage(request.content)
      }
      
      // For audio/video, extract text and moderate
      if (request.contentType === 'audio' || request.contentType === 'video') {
        return await this.moderateAudioVideo(request.content)
      }

      return { flagged: false, categories: [], confidence: 0 }
    } catch (error) {
      console.error('Content moderation failed:', error)
      // Fail safe - flag for manual review
      return { 
        flagged: true, 
        categories: ['error'], 
        confidence: 1.0,
        reason: 'Moderation service error - requires manual review'
      }
    }
  }

  private async moderateText(content: string): Promise<ModerationResult> {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: content
      })
    })

    const data = await response.json()
    const result = data.results[0]

    return {
      flagged: result.flagged,
      categories: Object.keys(result.categories).filter(key => result.categories[key]),
      confidence: Math.max(...Object.values(result.category_scores))
    }
  }

  private async moderateImage(imageUrl: string): Promise<ModerationResult> {
    // Use OpenAI's vision model to analyze image content
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this image for inappropriate content. Return a JSON object with: flagged (boolean), categories (array of strings), confidence (0-1). Categories can include: violence, adult, hate, harassment, self-harm, illegal.'
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        }],
        max_tokens: 300
      })
    })

    const data = await response.json()
    try {
      const analysis = JSON.parse(data.choices[0].message.content)
      return analysis
    } catch {
      // If parsing fails, flag for manual review
      return { flagged: true, categories: ['parsing_error'], confidence: 1.0 }
    }
  }

  private async moderateAudioVideo(mediaUrl: string): Promise<ModerationResult> {
    // For now, return unflagged - would need transcription service
    // In production, integrate with speech-to-text then moderate the text
    return { flagged: false, categories: [], confidence: 0 }
  }

  async logModerationResult(
    requestId: string, 
    result: ModerationResult, 
    userId: string
  ): Promise<void> {
    await supabase
      .from('ai_moderation_logs')
      .insert({
        request_id: requestId,
        user_id: userId,
        flagged: result.flagged,
        categories: result.categories,
        confidence: result.confidence,
        reason: result.reason,
        created_at: new Date().toISOString()
      })
  }

  async getFlaggedContent(limit = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('ai_moderation_logs')
      .select(`
        *,
        ai_generation_requests(*)
      `)
      .eq('flagged', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }
}