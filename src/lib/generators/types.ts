// Type definitions for brand rider and CV generation system

import { ColorSwatch, FontPair, StyleAnalysis, VisualAnalysis } from '../ai/types';
import { PresentationFormat, CustomFormatConfig } from '../formats/types';

// Brand Rider Types
export interface BrandRider {
  id?: string;
  userId?: string;
  title: string;
  tagline: string;
  voiceTone: string[];
  signaturePhrases: string[];
  strengths: string[];
  weaknesses: string[];
  palette: ColorSwatch[];
  fonts: FontPair;
  bio: string;
  examples: UsageExample[];
  format: PresentationFormat;
  customFormatConfig?: CustomFormatConfig;
  createdAt?: string;
  updatedAt?: string;
  isPublic?: boolean;
}

export interface UsageExample {
  context: string;
  example: string;
}

// CV Types
export interface CV {
  id?: string;
  userId?: string;
  name: string;
  role: string;
  summary: string;
  experience: Role[];
  skills: string[];
  links: Link[];
  format: PresentationFormat;
  customFormatConfig?: CustomFormatConfig;
  createdAt?: string;
  updatedAt?: string;
  isPublic?: boolean;
}

export interface Role {
  role: string;
  org: string;
  dates: string;
  bullets: string[];
}

export interface Link {
  label: string;
  url: string;
}

// Generation Input Types
export interface BrandGenerationInput {
  styleAnalysis: StyleAnalysis;
  visualAnalysis: VisualAnalysis;
  format: PresentationFormat;
  customFormatConfig?: CustomFormatConfig;
  userProfile?: {
    name?: string;
    role?: string;
    bio?: string;
  };
}

export interface CVGenerationInput {
  styleAnalysis: StyleAnalysis;
  extractedText: string;
  format: PresentationFormat;
  customFormatConfig?: CustomFormatConfig;
  userProfile?: {
    name?: string;
    role?: string;
    bio?: string;
    links?: Link[];
  };
}

// Template Types
export interface BrandRiderTemplate {
  title: string;
  sections: BrandRiderSection[];
}

export interface BrandRiderSection {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'list' | 'palette' | 'fonts' | 'examples';
}

export interface CVTemplate {
  header: CVHeaderSection;
  sections: CVSection[];
}

export interface CVHeaderSection {
  name: string;
  role: string;
  summary: string;
  links: Link[];
}

export interface CVSection {
  id: string;
  title: string;
  content: string;
  type: 'experience' | 'skills' | 'text';
}

// Generation Options
export interface GenerationOptions {
  includeExamples?: boolean;
  maxExperienceRoles?: number;
  maxBulletsPerRole?: number;
  includeWeaknesses?: boolean;
  customSections?: string[];
}