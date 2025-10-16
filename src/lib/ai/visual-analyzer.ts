import { ColorSwatch, FontPair, VisualAnalysis } from './types';

// WCAG AA color contrast validation
export class ColorContrastValidator {
  /**
   * Calculate relative luminance of a color
   * Based on WCAG 2.1 specification
   */
  private static getRelativeLuminance(hex: string): number {
    // Remove # if present
    const cleanHex = hex.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(cleanHex.substr(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substr(2, 2), 16) / 255;
    const b = parseInt(cleanHex.substr(4, 2), 16) / 255;
    
    // Apply gamma correction
    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    // Calculate relative luminance
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  }
  
  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(color1: string, color2: string): number {
    const l1 = this.getRelativeLuminance(color1);
    const l2 = this.getRelativeLuminance(color2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }
  
  /**
   * Check if color combination meets WCAG AA standards
   * AA requires 4.5:1 for normal text, 3:1 for large text
   */
  static meetsWCAGAA(foreground: string, background: string, isLargeText = false): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  }
  
  /**
   * Validate an entire color palette for accessibility
   */
  static validatePalette(palette: ColorSwatch[]): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Find light and dark colors for text contrast testing
    const lightColors = palette.filter(c => this.getRelativeLuminance(c.hex) > 0.5);
    const darkColors = palette.filter(c => this.getRelativeLuminance(c.hex) <= 0.5);
    
    if (lightColors.length === 0) {
      issues.push('No light colors found for text backgrounds');
      recommendations.push('Add a light color (e.g., #ffffff or #f8f9fa) for text backgrounds');
    }
    
    if (darkColors.length === 0) {
      issues.push('No dark colors found for text');
      recommendations.push('Add a dark color (e.g., #000000 or #1a1a1a) for text');
    }
    
    // Test common text combinations
    if (lightColors.length > 0 && darkColors.length > 0) {
      const lightestColor = lightColors.reduce((prev, curr) => 
        this.getRelativeLuminance(prev.hex) > this.getRelativeLuminance(curr.hex) ? prev : curr
      );
      const darkestColor = darkColors.reduce((prev, curr) => 
        this.getRelativeLuminance(prev.hex) < this.getRelativeLuminance(curr.hex) ? prev : curr
      );
      
      if (!this.meetsWCAGAA(darkestColor.hex, lightestColor.hex)) {
        issues.push(`Poor contrast between ${darkestColor.name} and ${lightestColor.name}`);
        recommendations.push('Consider using darker text colors or lighter background colors');
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }
}

// Google Fonts integration and validation
export class GoogleFontsValidator {
  // Popular Google Fonts that work well for different use cases
  private static readonly RECOMMENDED_FONTS = {
    heading: [
      'Poppins', 'Montserrat', 'Roboto', 'Open Sans', 'Lato', 'Source Sans Pro',
      'Raleway', 'Ubuntu', 'Nunito', 'Merriweather', 'Playfair Display',
      'Oswald', 'Roboto Condensed', 'Fira Sans', 'Work Sans'
    ],
    body: [
      'Inter', 'Roboto', 'Open Sans', 'Lato', 'Source Sans Pro', 'Nunito',
      'PT Sans', 'Libre Franklin', 'IBM Plex Sans', 'System UI', 'Segoe UI',
      'Helvetica Neue', 'Arial', 'Noto Sans', 'Liberation Sans'
    ]
  };
  
  /**
   * Check if a font is available in Google Fonts
   */
  static isValidGoogleFont(fontName: string): boolean {
    const allFonts = [...this.RECOMMENDED_FONTS.heading, ...this.RECOMMENDED_FONTS.body];
    return allFonts.includes(fontName);
  }
  
  /**
   * Get font recommendations based on style keywords
   */
  static getRecommendations(keywords: string[], roleTags: string[]): FontPair[] {
    const recommendations: FontPair[] = [];
    
    // Determine style based on keywords and roles
    const isTech = keywords.some(k => ['tech', 'developer', 'engineer', 'software'].includes(k.toLowerCase())) ||
                   roleTags.some(r => ['developer', 'engineer', 'tech'].includes(r.toLowerCase()));
    
    const isCreative = keywords.some(k => ['creative', 'design', 'art', 'brand'].includes(k.toLowerCase())) ||
                       roleTags.some(r => ['designer', 'creative', 'artist'].includes(r.toLowerCase()));
    
    const isFormal = keywords.some(k => ['professional', 'corporate', 'business', 'executive'].includes(k.toLowerCase())) ||
                     roleTags.some(r => ['executive', 'manager', 'director'].includes(r.toLowerCase()));
    
    if (isTech) {
      recommendations.push(
        { heading: 'Fira Sans', body: 'IBM Plex Sans' },
        { heading: 'Roboto', body: 'Inter' },
        { heading: 'Source Sans Pro', body: 'System UI' }
      );
    }
    
    if (isCreative) {
      recommendations.push(
        { heading: 'Playfair Display', body: 'Lato' },
        { heading: 'Montserrat', body: 'Open Sans' },
        { heading: 'Raleway', body: 'Nunito' }
      );
    }
    
    if (isFormal) {
      recommendations.push(
        { heading: 'Merriweather', body: 'Source Sans Pro' },
        { heading: 'Roboto', body: 'Open Sans' },
        { heading: 'Lato', body: 'PT Sans' }
      );
    }
    
    // Default recommendations if no specific style detected
    if (recommendations.length === 0) {
      recommendations.push(
        { heading: 'Poppins', body: 'Inter' },
        { heading: 'Montserrat', body: 'Open Sans' },
        { heading: 'Roboto', body: 'Lato' }
      );
    }
    
    return recommendations.slice(0, 3); // Return top 3 recommendations
  }
  
  /**
   * Validate a font pair for Google Fonts compatibility
   */
  static validateFontPair(fonts: FontPair): {
    isValid: boolean;
    issues: string[];
    alternatives: FontPair[];
  } {
    const issues: string[] = [];
    const alternatives: FontPair[] = [];
    
    if (!this.isValidGoogleFont(fonts.heading)) {
      issues.push(`Heading font "${fonts.heading}" is not available in Google Fonts`);
    }
    
    if (!this.isValidGoogleFont(fonts.body)) {
      issues.push(`Body font "${fonts.body}" is not available in Google Fonts`);
    }
    
    if (issues.length > 0) {
      // Provide alternatives
      alternatives.push(...this.getRecommendations([], []));
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      alternatives
    };
  }
}

// Main VisualAnalyzer class
export class VisualAnalyzer {
  /**
   * Generate color palette based on keywords and context
   */
  static generateColorPalette(keywords: string[], roleTags: string[]): ColorSwatch[] {
    // Base palette that meets WCAG AA standards
    let palette: ColorSwatch[] = [
      { name: 'Primary', hex: '#2563eb' },     // Blue
      { name: 'Secondary', hex: '#7c3aed' },   // Purple
      { name: 'Accent', hex: '#f59e0b' },      // Amber
      { name: 'Dark', hex: '#111827' },        // Dark gray
      { name: 'Light', hex: '#f9fafb' }        // Light gray
    ];
    
    // Adjust palette based on keywords and roles
    const isTech = keywords.some(k => ['tech', 'developer', 'engineer', 'software'].includes(k.toLowerCase()));
    const isCreative = keywords.some(k => ['creative', 'design', 'art', 'brand'].includes(k.toLowerCase()));
    const isBusiness = keywords.some(k => ['business', 'corporate', 'professional'].includes(k.toLowerCase()));
    const isSports = roleTags.some(r => ['athlete', 'coach', 'sports'].includes(r.toLowerCase()));
    
    if (isTech) {
      palette = [
        { name: 'Primary', hex: '#0ea5e9' },   // Sky blue
        { name: 'Secondary', hex: '#8b5cf6' }, // Violet
        { name: 'Accent', hex: '#10b981' },    // Emerald
        { name: 'Dark', hex: '#0f172a' },      // Slate
        { name: 'Light', hex: '#f8fafc' }      // Slate light
      ];
    } else if (isCreative) {
      palette = [
        { name: 'Primary', hex: '#ec4899' },   // Pink
        { name: 'Secondary', hex: '#8b5cf6' }, // Violet
        { name: 'Accent', hex: '#f59e0b' },    // Amber
        { name: 'Dark', hex: '#1f2937' },      // Gray
        { name: 'Light', hex: '#fef7ff' }      // Pink light
      ];
    } else if (isBusiness) {
      palette = [
        { name: 'Primary', hex: '#1e40af' },   // Blue
        { name: 'Secondary', hex: '#374151' }, // Gray
        { name: 'Accent', hex: '#059669' },    // Emerald
        { name: 'Dark', hex: '#111827' },      // Gray dark
        { name: 'Light', hex: '#f9fafb' }      // Gray light
      ];
    } else if (isSports) {
      palette = [
        { name: 'Primary', hex: '#dc2626' },   // Red
        { name: 'Secondary', hex: '#1d4ed8' }, // Blue
        { name: 'Accent', hex: '#f59e0b' },    // Amber
        { name: 'Dark', hex: '#1f2937' },      // Gray
        { name: 'Light', hex: '#ffffff' }      // White
      ];
    }
    
    return palette;
  }
  
  /**
   * Generate font recommendations
   */
  static generateFontRecommendations(keywords: string[], roleTags: string[]): FontPair {
    const recommendations = GoogleFontsValidator.getRecommendations(keywords, roleTags);
    return recommendations[0]; // Return the top recommendation
  }
  
  /**
   * Generate logo concept prompt
   */
  static generateLogoPrompt(keywords: string[], roleTags: string[], bio: string): string {
    const style = this.determineLogoStyle(keywords, roleTags);
    const concept = this.extractLogoConcept(bio, keywords);
    
    return `Create a ${style} logo for ${concept}. The design should be minimal, scalable, and work well in both color and monochrome. Focus on clean lines and professional appearance suitable for business cards, websites, and social media profiles.`;
  }
  
  private static determineLogoStyle(keywords: string[], roleTags: string[]): string {
    const isTech = keywords.some(k => ['tech', 'developer', 'engineer', 'software'].includes(k.toLowerCase()));
    const isCreative = keywords.some(k => ['creative', 'design', 'art', 'brand'].includes(k.toLowerCase()));
    const isBusiness = keywords.some(k => ['business', 'corporate', 'professional'].includes(k.toLowerCase()));
    
    if (isTech) return 'modern, geometric';
    if (isCreative) return 'artistic, expressive';
    if (isBusiness) return 'professional, classic';
    
    return 'clean, versatile';
  }
  
  private static extractLogoConcept(bio: string, keywords: string[]): string {
    // Extract key concepts from bio and keywords
    const concepts = [...keywords];
    
    // Simple keyword extraction from bio
    const bioWords = bio.toLowerCase().split(/\s+/);
    const relevantWords = bioWords.filter(word => 
      word.length > 4 && 
      !['that', 'with', 'have', 'been', 'will', 'from', 'they', 'this', 'were'].includes(word)
    );
    
    concepts.push(...relevantWords.slice(0, 3));
    
    return concepts.slice(0, 5).join(', ') || 'professional brand';
  }
  
  /**
   * Perform complete visual analysis
   */
  static analyzeVisual(keywords: string[], roleTags: string[], bio: string): VisualAnalysis {
    const palette = this.generateColorPalette(keywords, roleTags);
    const fonts = this.generateFontRecommendations(keywords, roleTags);
    const logoPrompt = this.generateLogoPrompt(keywords, roleTags, bio);
    
    // Validate the generated palette
    const paletteValidation = ColorContrastValidator.validatePalette(palette);
    if (!paletteValidation.isValid) {
      console.warn('Generated palette has accessibility issues:', paletteValidation.issues);
    }
    
    // Validate the font pair
    const fontValidation = GoogleFontsValidator.validateFontPair(fonts);
    if (!fontValidation.isValid) {
      console.warn('Generated fonts have compatibility issues:', fontValidation.issues);
    }
    
    return {
      palette,
      fonts,
      logoPrompt
    };
  }
}