// AI Service Types and Interfaces

export enum AIFeature {
  IMAGE_GENERATION = 'image_generation',
  VOICE_SYNTHESIS = 'voice_synthesis',
  VIDEO_GENERATION = 'video_generation',
  ADVANCED_EDITING = 'advanced_editing'
}

export interface GenerationOptions {
  timeout?: number;
  priority?: 'low' | 'normal' | 'high';
  userId?: string;
}

export interface GenerationResult {
  url: string;
  metadata?: Record<string, any>;
  costCents?: number;
}

export interface ImageGenerationRequest {
  prompt: string;
  options: ImageOptions;
}

export interface ImageOptions {
  style: 'professional' | 'creative' | 'minimal' | 'bold';
  dimensions: { width: number; height: number };
  format: 'logo' | 'avatar' | 'background' | 'icon';
  colorPalette?: string[];
}

export interface VoiceGenerationRequest {
  text: string;
  options: VoiceOptions;
}

export interface VoiceOptions {
  voice: string;
  speed: number;
  pitch: number;
  emotion: 'neutral' | 'energetic' | 'professional' | 'friendly';
  maxDuration: number; // seconds
}

export interface VideoGenerationRequest {
  config: VideoConfig;
}

export interface VideoConfig {
  avatarStyle: AvatarStyle;
  script: string;
  background: BackgroundConfig;
  animations: AnimationConfig[];
  duration: number; // seconds
}

export interface AvatarStyle {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  category: 'professional' | 'casual' | 'creative';
}

export interface BackgroundConfig {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  category: 'professional' | 'neutral' | 'casual' | 'creative' | 'natural';
  color?: string;
  url?: string;
}

export interface AnimationConfig {
  type: 'zoom' | 'fade' | 'slide' | 'text_overlay';
  timing: { start: number; duration: number };
  properties: Record<string, any>;
}

export interface GeneratedVideo {
  id: string;
  url: string;
  duration: number;
  format: 'mp4' | 'webm';
  provider: string;
  metadata: {
    avatarStyle: AvatarStyle;
    background: BackgroundConfig;
    script: string;
    [key: string]: any;
  };
}

export abstract class AIProvider {
  abstract name: string;
  
  abstract generate(request: any, options: GenerationOptions): Promise<GenerationResult>;
  
  abstract estimateCost(request: any): number;
  
  abstract isAvailable(): Promise<boolean>;
}

export interface UsageLimit {
  monthly: number;
  daily: number;
  perRequest: number;
  costLimit: number; // in cents
}

export interface QuotaStatus {
  remaining: number;
  resetTime: Date;
  exceeded: boolean;
}

// Template Management Types
export interface TemplateData {
  name: string;
  type: 'brand_rider' | 'cv' | 'presentation';
  htmlContent: string;
  styleSheet: string;
  placeholders: PlaceholderConfig[];
  metadata: TemplateMetadata;
}

export interface PlaceholderConfig {
  key: string;
  type: 'text' | 'image' | 'color' | 'font';
  label: string;
  defaultValue?: any;
  validation?: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern';
  value?: any;
  message: string;
}

export interface TemplateMetadata {
  description?: string;
  tags?: string[];
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime?: number; // minutes
}

export interface TemplateFilters {
  type?: 'brand_rider' | 'cv' | 'presentation';
  category?: string;
  tags?: string[];
  isActive?: boolean;
}

// Placeholder Image Types
export interface PlaceholderImage {
  id: string;
  filename: string;
  storagePath: string;
  category: ImageCategory;
  tags: string[];
  metadata: Record<string, any>;
  aiGenerated: boolean;
  generationPrompt?: string;
  createdAt: Date;
}

export enum ImageCategory {
  AVATARS = 'avatars',
  BACKGROUNDS = 'backgrounds',
  LOGOS = 'logos',
  ICONS = 'icons'
}

export interface ImageMetadata {
  alt?: string;
  description?: string;
  license?: string;
  attribution?: string;
  dimensions?: { width: number; height: number };
  fileSize?: number;
}

export interface ImageSearchQuery {
  category?: ImageCategory;
  tags?: string[];
  aiGenerated?: boolean;
  limit?: number;
  offset?: number;
}