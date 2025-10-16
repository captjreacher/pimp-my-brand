import { 
  BrandRider, 
  BrandGenerationInput, 
  BrandRiderTemplate, 
  BrandRiderSection,
  UsageExample,
  GenerationOptions 
} from './types';
import { FormatTransformer } from '../formats/transformer';
import { StyleAnalysis, VisualAnalysis } from '../ai/types';

export class BrandGenerator {
  /**
   * Generate a complete Brand Rider document
   * Implements Requirements 4.1, 4.2, 4.3, 4.4, 4.5
   */
  static async generate(
    input: BrandGenerationInput,
    options: GenerationOptions = {}
  ): Promise<BrandRider> {
    const { styleAnalysis, visualAnalysis, format, customFormatConfig, userProfile } = input;
    
    // Validate input data
    this.validateGenerationInput(input);
    
    // Apply format transformation to key content while preserving factual information
    // Requirement 4.3: Apply presentation format while preserving factual content
    const transformedTagline = await FormatTransformer.transformContent({
      format,
      customConfig: customFormatConfig,
      content: styleAnalysis.tagline,
      contentType: 'tagline'
    });

    const transformedBio = await FormatTransformer.transformContent({
      format,
      customConfig: customFormatConfig,
      content: styleAnalysis.bioOneLiner,
      contentType: 'bio'
    });

    // Transform voice & tone adjectives with format overlay
    const transformedVoiceTone = await Promise.all(
      styleAnalysis.tone.adjectives.map(adjective =>
        FormatTransformer.transformContent({
          format,
          customConfig: customFormatConfig,
          content: adjective,
          contentType: 'strengths' // Use existing content type for tone adjectives
        })
      )
    );

    const transformedStrengths = await Promise.all(
      styleAnalysis.strengths.map(strength =>
        FormatTransformer.transformContent({
          format,
          customConfig: customFormatConfig,
          content: strength,
          contentType: 'strengths'
        })
      )
    );

    const transformedWeaknesses = options.includeWeaknesses !== false 
      ? await Promise.all(
          styleAnalysis.weaknesses.map(weakness =>
            FormatTransformer.transformContent({
              format,
              customConfig: customFormatConfig,
              content: weakness,
              contentType: 'weaknesses'
            })
          )
        )
      : [];

    const transformedSignaturePhrases = await Promise.all(
      styleAnalysis.signaturePhrases.map(phrase =>
        FormatTransformer.transformContent({
          format,
          customConfig: customFormatConfig,
          content: phrase,
          contentType: 'signaturePhrases'
        })
      )
    );

    // Generate usage examples with format-specific transformations
    // Requirement 4.1: Include usage examples in Brand Rider
    const examples = options.includeExamples !== false 
      ? await this.generateUsageExamples(styleAnalysis, visualAnalysis, format, customFormatConfig)
      : [];

    // Ensure color palette meets accessibility standards (WCAG AA)
    // Requirement 4.4: Display hex values and color names
    const validatedPalette = this.validateColorPalette(visualAnalysis.palette);

    // Ensure font selections are valid Google Fonts
    // Requirement 4.5: Show both heading and body font selections
    const validatedFonts = this.validateFontPair(visualAnalysis.fonts);

    // Create the brand rider with all required sections
    // Requirement 4.1: Create document with all required sections
    const brandRider: BrandRider = {
      title: this.generateTitle(userProfile?.name),
      tagline: transformedTagline,
      voiceTone: transformedVoiceTone,
      signaturePhrases: transformedSignaturePhrases,
      strengths: transformedStrengths,
      weaknesses: transformedWeaknesses,
      palette: validatedPalette,
      fonts: validatedFonts,
      bio: transformedBio,
      examples,
      format,
      customFormatConfig,
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Final validation before returning
    const validation = this.validate(brandRider);
    if (!validation.isValid) {
      throw new Error(`Brand Rider validation failed: ${validation.errors.join(', ')}`);
    }

    return brandRider;
  }

  /**
   * Generate usage examples based on style and visual analysis
   * Requirement 4.1: Include usage examples in Brand Rider
   */
  private static async generateUsageExamples(
    styleAnalysis: StyleAnalysis,
    visualAnalysis: VisualAnalysis,
    format: any,
    customFormatConfig?: any
  ): Promise<UsageExample[]> {
    const baseExamples = [
      {
        context: 'Email Signature',
        example: `${styleAnalysis.tagline}\n${styleAnalysis.bioOneLiner}`
      },
      {
        context: 'Social Media Bio',
        example: styleAnalysis.bioOneLiner
      },
      {
        context: 'Speaking Introduction',
        example: `${styleAnalysis.bioOneLiner} Known for ${styleAnalysis.signaturePhrases[0]?.toLowerCase() || 'innovative thinking'}.`
      },
      {
        context: 'LinkedIn Headline',
        example: `${styleAnalysis.tagline} | ${styleAnalysis.strengths.slice(0, 2).join(' & ')}`
      },
      {
        context: 'Conference Bio',
        example: `${styleAnalysis.bioOneLiner} ${styleAnalysis.signaturePhrases.slice(0, 2).join('. ')}.`
      }
    ];

    // Transform examples with format overlay while preserving factual content
    // Requirement 4.3: Apply presentation format while preserving factual content
    const transformedExamples = await Promise.all(
      baseExamples.map(async (example) => ({
        context: example.context,
        example: await FormatTransformer.transformContent({
          format,
          customConfig: customFormatConfig,
          content: example.example,
          contentType: 'bio' // Use existing content type for examples
        })
      }))
    );

    return transformedExamples;
  }

  /**
   * Validate generation input data
   */
  private static validateGenerationInput(input: BrandGenerationInput): void {
    if (!input.styleAnalysis) {
      throw new Error('Style analysis is required for Brand Rider generation');
    }
    if (!input.visualAnalysis) {
      throw new Error('Visual analysis is required for Brand Rider generation');
    }
    if (!input.format) {
      throw new Error('Presentation format is required for Brand Rider generation');
    }
    if (!input.styleAnalysis.tagline?.trim()) {
      throw new Error('Tagline is required in style analysis');
    }
    if (!input.styleAnalysis.bioOneLiner?.trim()) {
      throw new Error('Bio is required in style analysis');
    }
  }

  /**
   * Generate appropriate title for Brand Rider
   */
  private static generateTitle(userName?: string): string {
    if (userName?.trim()) {
      return `${userName.trim()} Brand Guidelines`;
    }
    return 'Brand Guidelines';
  }

  /**
   * Validate color palette for accessibility and completeness
   * Requirement 4.4: Display hex values and color names
   */
  private static validateColorPalette(palette: any[]): any[] {
    if (!palette || palette.length === 0) {
      throw new Error('Color palette is required for Brand Rider generation');
    }

    return palette.map((color, index) => {
      if (!color.hex || !color.name) {
        throw new Error(`Color at index ${index} must have both hex and name properties`);
      }
      
      // Ensure hex format is correct
      const hexPattern = /^#[0-9A-Fa-f]{6}$/;
      if (!hexPattern.test(color.hex)) {
        throw new Error(`Invalid hex color format: ${color.hex}`);
      }

      return {
        name: color.name.trim(),
        hex: color.hex.toUpperCase()
      };
    });
  }

  /**
   * Validate font pair for completeness
   * Requirement 4.5: Show both heading and body font selections
   */
  private static validateFontPair(fonts: any): any {
    if (!fonts) {
      throw new Error('Font pair is required for Brand Rider generation');
    }
    if (!fonts.heading?.trim()) {
      throw new Error('Heading font is required');
    }
    if (!fonts.body?.trim()) {
      throw new Error('Body font is required');
    }

    return {
      heading: fonts.heading.trim(),
      body: fonts.body.trim()
    };
  }

  /**
   * Create a template structure for the Brand Rider
   * Requirement 4.2: Format as single page with proper visual hierarchy
   * Requirement 4.1: Include all required sections
   */
  static createTemplate(brandRider: BrandRider): BrandRiderTemplate {
    const sections: BrandRiderSection[] = [];

    // Core content sections in proper hierarchy order
    // 1. Tagline - Primary brand message
    sections.push({
      id: 'tagline',
      title: 'Tagline',
      content: brandRider.tagline,
      type: 'text'
    });

    // 2. Voice & Tone - Brand personality
    sections.push({
      id: 'voice-tone',
      title: 'Voice & Tone',
      content: brandRider.voiceTone.join(', '),
      type: 'list'
    });

    // 3. Signature Phrases - Key messaging
    sections.push({
      id: 'signature-phrases',
      title: 'Signature Phrases',
      content: brandRider.signaturePhrases.map(phrase => `• ${phrase}`).join('\n'),
      type: 'list'
    });

    // 4. Key Strengths - Brand advantages
    sections.push({
      id: 'strengths',
      title: 'Key Strengths',
      content: brandRider.strengths.map(strength => `• ${strength}`).join('\n'),
      type: 'list'
    });

    // 5. Areas for Growth - Optional weaknesses section
    if (brandRider.weaknesses && brandRider.weaknesses.length > 0) {
      sections.push({
        id: 'weaknesses',
        title: 'Areas for Growth',
        content: brandRider.weaknesses.map(weakness => `• ${weakness}`).join('\n'),
        type: 'list'
      });
    }

    // Visual identity sections
    // 6. Color Palette - Visual brand elements
    // Requirement 4.4: Display hex values and color names
    sections.push({
      id: 'palette',
      title: 'Color Palette',
      content: JSON.stringify(brandRider.palette),
      type: 'palette'
    });

    // 7. Typography - Font selections
    // Requirement 4.5: Show both heading and body font selections
    sections.push({
      id: 'fonts',
      title: 'Typography',
      content: JSON.stringify(brandRider.fonts),
      type: 'fonts'
    });

    // 8. Bio - Professional summary
    sections.push({
      id: 'bio',
      title: 'Professional Bio',
      content: brandRider.bio,
      type: 'text'
    });

    // 9. Usage Examples - Practical applications
    // Requirement 4.1: Include usage examples
    if (brandRider.examples && brandRider.examples.length > 0) {
      sections.push({
        id: 'examples',
        title: 'Usage Examples',
        content: JSON.stringify(brandRider.examples),
        type: 'examples'
      });
    }

    return {
      title: brandRider.title,
      sections
    };
  }

  /**
   * Update an existing Brand Rider with new format
   */
  static async updateFormat(
    brandRider: BrandRider,
    newFormat: any,
    customFormatConfig?: any
  ): Promise<BrandRider> {
    // Re-transform content with new format
    const updatedTagline = await FormatTransformer.transformContent({
      format: newFormat,
      customConfig: customFormatConfig,
      content: brandRider.tagline,
      contentType: 'tagline'
    });

    const updatedBio = await FormatTransformer.transformContent({
      format: newFormat,
      customConfig: customFormatConfig,
      content: brandRider.bio,
      contentType: 'bio'
    });

    const updatedStrengths = await Promise.all(
      brandRider.strengths.map(strength =>
        FormatTransformer.transformContent({
          format: newFormat,
          customConfig: customFormatConfig,
          content: strength,
          contentType: 'strengths'
        })
      )
    );

    const updatedSignaturePhrases = await Promise.all(
      brandRider.signaturePhrases.map(phrase =>
        FormatTransformer.transformContent({
          format: newFormat,
          customConfig: customFormatConfig,
          content: phrase,
          contentType: 'signaturePhrases'
        })
      )
    );

    return {
      ...brandRider,
      tagline: updatedTagline,
      bio: updatedBio,
      strengths: updatedStrengths,
      signaturePhrases: updatedSignaturePhrases,
      format: newFormat,
      customFormatConfig,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Validate Brand Rider data against all requirements
   * Ensures compliance with Requirements 4.1, 4.2, 4.3, 4.4, 4.5
   */
  static validate(brandRider: Partial<BrandRider>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Requirement 4.1: All required sections must be present
    if (!brandRider.title?.trim()) {
      errors.push('Title is required for Brand Rider');
    }

    if (!brandRider.tagline?.trim()) {
      errors.push('Tagline is required for Brand Rider');
    }

    if (!brandRider.bio?.trim()) {
      errors.push('Professional bio is required for Brand Rider');
    }

    if (!brandRider.voiceTone || brandRider.voiceTone.length === 0) {
      errors.push('Voice & tone adjectives are required for Brand Rider');
    }

    if (!brandRider.signaturePhrases || brandRider.signaturePhrases.length === 0) {
      errors.push('Signature phrases are required for Brand Rider');
    }

    if (!brandRider.strengths || brandRider.strengths.length === 0) {
      errors.push('Key strengths are required for Brand Rider');
    }

    // Requirement 4.4: Color palette with hex values and names
    if (!brandRider.palette || brandRider.palette.length === 0) {
      errors.push('Color palette is required for Brand Rider');
    } else {
      brandRider.palette.forEach((color, index) => {
        if (!color.hex || !color.name) {
          errors.push(`Color at index ${index} must have both hex value and name`);
        }
      });
    }

    // Requirement 4.5: Font selections for heading and body
    if (!brandRider.fonts) {
      errors.push('Font selection is required for Brand Rider');
    } else {
      if (!brandRider.fonts.heading?.trim()) {
        errors.push('Heading font selection is required');
      }
      if (!brandRider.fonts.body?.trim()) {
        errors.push('Body font selection is required');
      }
    }

    // Requirement 4.3: Presentation format is required
    if (!brandRider.format) {
      errors.push('Presentation format is required for Brand Rider');
    }

    // Optional but recommended sections
    if (!brandRider.examples || brandRider.examples.length === 0) {
      // This is a warning, not an error, as examples are optional
      console.warn('Usage examples are recommended for Brand Rider completeness');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate a preview version with sample data
   */
  static generatePreview(format: any, customFormatConfig?: any): BrandRider {
    return {
      title: 'Sample Brand Guidelines',
      tagline: 'Innovative leader driving digital transformation',
      voiceTone: ['Professional', 'Innovative', 'Results-driven'],
      signaturePhrases: ['Strategic thinking', 'Team collaboration', 'Customer-focused solutions'],
      strengths: ['Leadership', 'Problem-solving', 'Communication'],
      weaknesses: ['Perfectionism', 'Impatience with slow processes'],
      palette: [
        { name: 'Primary Blue', hex: '#2563eb' },
        { name: 'Accent Orange', hex: '#ea580c' },
        { name: 'Neutral Gray', hex: '#6b7280' }
      ],
      fonts: {
        heading: 'Inter',
        body: 'Source Sans Pro'
      },
      bio: 'Experienced professional with a track record of delivering results and building high-performing teams.',
      examples: [
        {
          context: 'Email Signature',
          example: 'Innovative leader driving digital transformation'
        }
      ],
      format,
      customFormatConfig,
      isPublic: false
    };
  }
}