// Type definitions for presentation format system

export type PresentationFormat = 
  | 'ufc' 
  | 'military' 
  | 'team' 
  | 'solo' 
  | 'nfl' 
  | 'influencer' 
  | 'executive'
  | 'artist'
  | 'humanitarian'
  | 'creator'
  | 'fashion'
  | 'custom';

export interface StyleModifier {
  target: 'tone' | 'language' | 'structure';
  transformation: string;
}

export interface FormatOverlay {
  id: PresentationFormat;
  name: string;
  description: string;
  systemPrompt: string;
  styleModifiers: StyleModifier[];
  examples: {
    before: string;
    after: string;
  }[];
}

export interface CustomFormatConfig {
  keywords: string[];
  tone: string;
  style: string;
}

export interface FormatTransformationContext {
  format: PresentationFormat;
  customConfig?: CustomFormatConfig;
  content: string;
  contentType: 'tagline' | 'bio' | 'strengths' | 'weaknesses' | 'signaturePhrases' | 'experience' | 'summary' | 'voiceTone' | 'examples';
}