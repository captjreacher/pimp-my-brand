// Type definitions for AI analysis system

export interface ColorSwatch {
  name: string;
  hex: string;
}

export interface FontPair {
  heading: string;
  body: string;
}

export interface VisualAnalysis {
  palette: ColorSwatch[];
  fonts: FontPair;
  logoPrompt: string;
}

export interface StyleAnalysis {
  tone: {
    adjectives: string[];
    dos: string[];
    donts: string[];
  };
  signaturePhrases: string[];
  strengths: string[];
  weaknesses: string[];
  tagline: string;
  bioOneLiner: string;
}

export interface AIProvider {
  analyzeStyle(text: string): Promise<StyleAnalysis>;
  analyzeVisual(keywords: string[], roleTags: string[], bio: string): Promise<VisualAnalysis>;
}