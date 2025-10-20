import { AIProvider, GenerationOptions, GenerationResult, ImageGenerationRequest, VoiceGenerationRequest, VideoGenerationRequest } from '../types';

export interface OpenAIConfig {
  apiKey: string;
  imageModel: 'dall-e-3' | 'dall-e-2';
  ttsModel: 'tts-1' | 'tts-1-hd';
  voiceOptions: string[];
}

export class OpenAIProvider extends AIProvider {
  name = 'openai';
  private config: OpenAIConfig;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(config: OpenAIConfig) {
    super();
    this.config = config;
  }

  async generate(request: any, options: GenerationOptions): Promise<GenerationResult> {
    if (request.prompt && request.options?.format) {
      // Image generation request
      return this.generateImage(request as ImageGenerationRequest, options);
    } else if (request.text && request.options?.voice) {
      // Voice generation request
      return this.generateVoice(request as VoiceGenerationRequest, options);
    } else if (request.config) {
      // Video generation request (fallback implementation)
      return this.generateVideoFallback(request, options);
    } else {
      throw new Error('Unsupported request type for OpenAI provider');
    }
  }

  private async generateImage(request: ImageGenerationRequest, options: GenerationOptions): Promise<GenerationResult> {
    const { prompt, options: imageOptions } = request;
    
    // Enhance prompt based on format and style
    const enhancedPrompt = this.enhanceImagePrompt(prompt, imageOptions);
    
    const requestBody = {
      model: this.config.imageModel,
      prompt: enhancedPrompt,
      n: 1,
      size: this.mapDimensions(imageOptions.dimensions),
      quality: this.config.imageModel === 'dall-e-3' ? 'hd' : 'standard',
      style: imageOptions.style === 'creative' ? 'vivid' : 'natural'
    };

    const response = await this.makeRequest('/images/generations', requestBody, options);
    
    if (!response.data || response.data.length === 0) {
      throw new Error('No image generated');
    }

    const imageUrl = response.data[0].url;
    const costCents = this.calculateImageCost(imageOptions);

    return {
      url: imageUrl,
      metadata: {
        model: this.config.imageModel,
        prompt: enhancedPrompt,
        dimensions: imageOptions.dimensions,
        style: imageOptions.style
      },
      costCents
    };
  }

  private async generateVoice(request: VoiceGenerationRequest, options: GenerationOptions): Promise<GenerationResult> {
    const { text, options: voiceOptions } = request;
    
    // Limit text to ensure 10-second duration
    const limitedText = this.limitTextForDuration(text, voiceOptions.maxDuration);
    
    const requestBody = {
      model: this.config.ttsModel,
      input: limitedText,
      voice: voiceOptions.voice,
      speed: voiceOptions.speed
    };

    const response = await this.makeRequest('/audio/speech', requestBody, options, 'blob');
    
    // Upload audio to storage and return URL
    const audioUrl = await this.uploadAudioToStorage(response, options.userId);
    const costCents = this.calculateVoiceCost(limitedText);

    return {
      url: audioUrl,
      metadata: {
        model: this.config.ttsModel,
        voice: voiceOptions.voice,
        speed: voiceOptions.speed,
        duration: voiceOptions.maxDuration,
        textLength: limitedText.length
      },
      costCents
    };
  }

  private enhanceImagePrompt(prompt: string, options: any): string {
    let enhanced = prompt;
    
    // Add style modifiers
    switch (options.style) {
      case 'professional':
        enhanced += ', professional, clean, corporate style';
        break;
      case 'creative':
        enhanced += ', creative, artistic, vibrant';
        break;
      case 'minimal':
        enhanced += ', minimal, simple, clean lines';
        break;
      case 'bold':
        enhanced += ', bold, striking, high contrast';
        break;
    }

    // Add format-specific modifiers
    switch (options.format) {
      case 'logo':
        enhanced += ', logo design, vector style, transparent background';
        break;
      case 'avatar':
        enhanced += ', portrait, professional headshot';
        break;
      case 'background':
        enhanced += ', background pattern, seamless';
        break;
      case 'icon':
        enhanced += ', icon design, simple, recognizable';
        break;
    }

    // Add color palette if specified
    if (options.colorPalette && options.colorPalette.length > 0) {
      enhanced += `, color palette: ${options.colorPalette.join(', ')}`;
    }

    return enhanced;
  }

  private mapDimensions(dimensions: { width: number; height: number }): string {
    const { width, height } = dimensions;
    
    // Map to OpenAI's supported sizes
    if (width === height) {
      return '1024x1024';
    } else if (width > height) {
      return '1792x1024';
    } else {
      return '1024x1792';
    }
  }

  private limitTextForDuration(text: string, maxDuration: number): string {
    // Rough estimate: 150 words per minute, so for 10 seconds = ~25 words
    const wordsPerSecond = 2.5;
    const maxWords = Math.floor(maxDuration * wordsPerSecond);
    
    const words = text.split(' ');
    if (words.length <= maxWords) {
      return text;
    }
    
    return words.slice(0, maxWords).join(' ') + '...';
  }

  private async uploadAudioToStorage(audioBlob: Blob, userId?: string): Promise<string> {
    // This would integrate with Supabase storage
    // For now, return a placeholder URL
    const filename = `audio_${Date.now()}.mp3`;
    const path = userId ? `${userId}/${filename}` : filename;
    
    // TODO: Implement actual Supabase storage upload
    return `https://placeholder-storage.com/generated-assets/${path}`;
  }

  private calculateImageCost(options: any): number {
    // DALL-E 3 HD: ~$0.08 per image, Standard: ~$0.04 per image
    // DALL-E 2: ~$0.02 per image
    if (this.config.imageModel === 'dall-e-3') {
      return 8; // 8 cents for HD quality
    } else {
      return 2; // 2 cents for DALL-E 2
    }
  }

  private calculateVoiceCost(text: string): number {
    // OpenAI TTS: $0.015 per 1K characters
    const characters = text.length;
    const costPer1K = 1.5; // 1.5 cents per 1K characters
    return Math.ceil((characters / 1000) * costPer1K);
  }

  private async generateVideoFallback(request: any, options: GenerationOptions): Promise<GenerationResult> {
    // Fallback video generation using OpenAI for static images + simple animations
    // This would create a basic animated presentation using:
    // 1. Generate avatar image with DALL-E
    // 2. Generate voice with TTS
    // 3. Combine with simple animations (fade, zoom, text overlay)
    
    const { config } = request;
    
    // Generate avatar image
    const avatarPrompt = `Professional ${config.avatarStyle.category} person, ${config.avatarStyle.description}, high quality portrait`;
    const imageRequest: ImageGenerationRequest = {
      prompt: avatarPrompt,
      options: {
        style: 'professional',
        dimensions: { width: 1024, height: 1024 },
        format: 'avatar'
      }
    };
    
    const avatarImage = await this.generateImage(imageRequest, options);
    
    // Generate voiceover
    const voiceRequest: VoiceGenerationRequest = {
      text: config.script,
      options: {
        voice: 'alloy',
        speed: 1.0,
        pitch: 1.0,
        emotion: 'professional',
        maxDuration: config.duration
      }
    };
    
    const voiceAudio = await this.generateVoice(voiceRequest, options);
    
    // Simulate video creation (in real implementation, this would use canvas/WebGL + ffmpeg)
    const videoUrl = await this.createSimpleVideo(avatarImage.url, voiceAudio.url, config, options.userId);
    
    const costCents = (avatarImage.costCents || 0) + (voiceAudio.costCents || 0) + 100; // +100 for processing
    
    return {
      url: videoUrl,
      metadata: {
        provider: 'OpenAI Fallback',
        avatarImage: avatarImage.url,
        voiceAudio: voiceAudio.url,
        config,
        note: 'Generated using OpenAI image + voice with simple animations'
      },
      costCents
    };
  }

  private async createSimpleVideo(
    avatarImageUrl: string, 
    voiceAudioUrl: string, 
    config: any, 
    userId?: string
  ): Promise<string> {
    // This would integrate with a video processing service or use client-side libraries
    // For now, return a placeholder that represents the combined video
    const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const filename = `${videoId}.mp4`;
    const path = userId ? `${userId}/videos/${filename}` : `videos/${filename}`;
    
    // TODO: Implement actual video creation using:
    // - Canvas API for compositing
    // - Web Audio API for audio processing  
    // - FFmpeg.wasm for video encoding
    // - Supabase storage for upload
    
    console.log('Creating video with:', {
      avatar: avatarImageUrl,
      audio: voiceAudioUrl,
      config
    });
    
    return `https://placeholder-storage.com/generated-videos/${path}`;
  }

  estimateCost(request: any): number {
    if (request.prompt && request.options?.format) {
      // Image generation
      return this.calculateImageCost(request.options);
    } else if (request.text) {
      // Voice generation
      return this.calculateVoiceCost(request.text);
    } else if (request.config) {
      // Video generation (image + voice + processing)
      return 8 + this.calculateVoiceCost(request.config.script) + 100; // Image + voice + processing
    }
    return 0;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
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
    options: GenerationOptions,
    responseType: 'json' | 'blob' = 'json'
  ): Promise<any> {
    const controller = new AbortController();
    const timeout = options.timeout || 30000;
    
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      if (responseType === 'blob') {
        return await response.blob();
      } else {
        return await response.json();
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }
}