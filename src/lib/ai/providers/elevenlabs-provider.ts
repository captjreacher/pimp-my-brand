import { AIProvider, GenerationOptions, GenerationResult, VoiceGenerationRequest } from '../types';
import { supabase } from '@/integrations/supabase/client';

export interface ElevenLabsConfig {
  apiKey: string;
  voiceId: string;
  model?: string;
}

export class ElevenLabsProvider extends AIProvider {
  name = 'elevenlabs';
  private config: ElevenLabsConfig;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor(config: ElevenLabsConfig) {
    super();
    this.config = config;
  }

  async generate(request: any, options: GenerationOptions): Promise<GenerationResult> {
    if (!request.text || !request.options?.voice) {
      throw new Error('Invalid voice generation request for ElevenLabs');
    }

    return this.generateVoice(request as VoiceGenerationRequest, options);
  }

  private async generateVoice(request: VoiceGenerationRequest, options: GenerationOptions): Promise<GenerationResult> {
    const { text, options: voiceOptions } = request;
    
    // Limit text to ensure 10-second duration
    const limitedText = this.limitTextForDuration(text, voiceOptions.maxDuration);
    
    const requestBody = {
      text: limitedText,
      model_id: this.config.model || 'eleven_monolingual_v1',
      voice_settings: {
        stability: this.mapEmotionToStability(voiceOptions.emotion),
        similarity_boost: 0.75,
        style: this.mapEmotionToStyle(voiceOptions.emotion),
        use_speaker_boost: true
      }
    };

    // Use the configured voice ID or map from voice name
    const voiceId = this.mapVoiceNameToId(voiceOptions.voice);
    
    const response = await this.makeRequest(`/text-to-speech/${voiceId}`, requestBody, options);
    
    // Upload audio to storage and return URL
    const audioUrl = await this.uploadAudioToStorage(response, options.userId);
    const costCents = this.calculateVoiceCost(limitedText);

    return {
      url: audioUrl,
      metadata: {
        provider: 'elevenlabs',
        voice: voiceOptions.voice,
        voiceId,
        model: this.config.model || 'eleven_monolingual_v1',
        duration: voiceOptions.maxDuration,
        textLength: limitedText.length,
        emotion: voiceOptions.emotion
      },
      costCents
    };
  }

  private limitTextForDuration(text: string, maxDuration: number): string {
    // ElevenLabs: roughly 150-200 words per minute, so for 10 seconds = ~25-30 words
    const wordsPerSecond = 2.8;
    const maxWords = Math.floor(maxDuration * wordsPerSecond);
    
    const words = text.split(' ');
    if (words.length <= maxWords) {
      return text;
    }
    
    return words.slice(0, maxWords).join(' ') + '...';
  }

  private mapVoiceNameToId(voiceName: string): string {
    // Map common voice names to ElevenLabs voice IDs
    const voiceMap: Record<string, string> = {
      'alloy': this.config.voiceId, // Use configured default
      'echo': this.config.voiceId,
      'fable': this.config.voiceId,
      'onyx': this.config.voiceId,
      'nova': this.config.voiceId,
      'shimmer': this.config.voiceId,
      'professional': this.config.voiceId,
      'energetic': this.config.voiceId,
      'friendly': this.config.voiceId
    };

    return voiceMap[voiceName] || this.config.voiceId;
  }

  private mapEmotionToStability(emotion: string): number {
    switch (emotion) {
      case 'energetic': return 0.3; // Less stable for more variation
      case 'professional': return 0.8; // Very stable
      case 'friendly': return 0.6; // Moderately stable
      case 'neutral':
      default: return 0.5; // Balanced
    }
  }

  private mapEmotionToStyle(emotion: string): number {
    switch (emotion) {
      case 'energetic': return 0.8; // High style for expressiveness
      case 'professional': return 0.2; // Low style for consistency
      case 'friendly': return 0.6; // Moderate style
      case 'neutral':
      default: return 0.4; // Balanced style
    }
  }

  private async uploadAudioToStorage(audioBlob: Blob, userId?: string): Promise<string> {
    if (!userId) {
      throw new Error('User ID required for audio storage');
    }

    const filename = `voice_${Date.now()}.mp3`;
    const path = `${userId}/generated-audio/${filename}`;

    const { data, error } = await supabase.storage
      .from('generated-assets')
      .upload(path, audioBlob, {
        contentType: 'audio/mpeg',
        cacheControl: '3600'
      });

    if (error) {
      console.error('Failed to upload audio to storage:', error);
      throw new Error('Failed to store generated audio');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('generated-assets')
      .getPublicUrl(path);

    return publicUrl;
  }

  private calculateVoiceCost(text: string): number {
    // ElevenLabs pricing: roughly $0.30 per 1K characters
    const characters = text.length;
    const costPer1K = 30; // 30 cents per 1K characters
    return Math.ceil((characters / 1000) * costPer1K);
  }

  estimateCost(request: any): number {
    if (request.text) {
      return this.calculateVoiceCost(request.text);
    }
    return 0;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.config.apiKey,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async makeRequest(
    endpoint: string, 
    body: any, 
    options: GenerationOptions
  ): Promise<Blob> {
    const controller = new AbortController();
    const timeout = options.timeout || 30000;
    
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.config.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(`ElevenLabs API error: ${error.detail || response.statusText}`);
      }

      return await response.blob();
    } finally {
      clearTimeout(timeoutId);
    }
  }
}