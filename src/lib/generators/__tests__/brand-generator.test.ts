import { BrandGenerator } from '../brand-generator';
import { BrandGenerationInput } from '../types';
import { StyleAnalysis, VisualAnalysis } from '../../ai/types';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { describe } from 'vitest';

describe('BrandGenerator', () => {
  const mockStyleAnalysis: StyleAnalysis = {
    tagline: 'Innovative leader driving digital transformation',
    bioOneLiner: 'Experienced professional with a track record of delivering results',
    tone: {
      adjectives: ['Professional', 'Innovative', 'Results-driven'],
      dos: ['Be direct and clear', 'Use action-oriented language'],
      donts: ['Avoid jargon', 'Don\'t be overly casual']
    },
    signaturePhrases: ['Strategic thinking', 'Team collaboration', 'Customer-focused solutions'],
    strengths: ['Leadership', 'Problem-solving', 'Communication'],
    weaknesses: ['Perfectionism', 'Impatience with slow processes']
  };

  const mockVisualAnalysis: VisualAnalysis = {
    palette: [
      { name: 'Primary Blue', hex: '#2563eb' },
      { name: 'Accent Orange', hex: '#ea580c' },
      { name: 'Neutral Gray', hex: '#6b7280' }
    ],
    fonts: {
      heading: 'Inter',
      body: 'Source Sans Pro'
    },
    logoPrompt: 'A minimal, professional logo representing innovation and leadership'
  };

  const mockInput: BrandGenerationInput = {
    styleAnalysis: mockStyleAnalysis,
    visualAnalysis: mockVisualAnalysis,
    format: 'executive',
    userProfile: {
      name: 'John Doe',
      role: 'Senior Manager',
      bio: 'Experienced leader in digital transformation'
    }
  };

  describe('generate', () => {
    it('should generate a complete Brand Rider with all required sections', async () => {
      const result = await BrandGenerator.generate(mockInput);

      // Requirement 4.1: All required sections
      expect(result.title).toBe('John Doe Brand Guidelines');
      expect(result.tagline).toBeTruthy();
      expect(result.voiceTone).toHaveLength(3);
      expect(result.signaturePhrases).toHaveLength(3);
      expect(result.strengths).toHaveLength(3);
      expect(result.palette).toHaveLength(3);
      expect(result.fonts).toHaveProperty('heading');
      expect(result.fonts).toHaveProperty('body');
      expect(result.bio).toBeTruthy();
      expect(result.examples).toBeTruthy();
      expect(result.format).toBe('executive');
    });

    it('should apply format transformation while preserving factual content', async () => {
      const result = await BrandGenerator.generate(mockInput);

      // Requirement 4.3: Format overlay applied
      expect(result.format).toBe('executive');
      expect(result.tagline).toContain('transformation'); // Executive format applied
    });

    it('should validate color palette with hex values and names', async () => {
      const result = await BrandGenerator.generate(mockInput);

      // Requirement 4.4: Color palette validation
      result.palette.forEach(color => {
        expect(color).toHaveProperty('name');
        expect(color).toHaveProperty('hex');
        expect(color.hex).toMatch(/^#[0-9A-F]{6}$/);
      });
    });

    it('should include both heading and body font selections', async () => {
      const result = await BrandGenerator.generate(mockInput);

      // Requirement 4.5: Font selections
      expect(result.fonts.heading).toBe('Inter');
      expect(result.fonts.body).toBe('Source Sans Pro');
    });

    it('should throw error for invalid input', async () => {
      const invalidInput = { ...mockInput, styleAnalysis: null as any };

      await expect(BrandGenerator.generate(invalidInput)).rejects.toThrow(
        'Style analysis is required for Brand Rider generation'
      );
    });
  });

  describe('createTemplate', () => {
    it('should create template with proper visual hierarchy', async () => {
      const brandRider = await BrandGenerator.generate(mockInput);
      const template = BrandGenerator.createTemplate(brandRider);

      // Requirement 4.2: Proper visual hierarchy
      expect(template.title).toBe('John Doe Brand Guidelines');
      expect(template.sections).toHaveLength(9); // All required sections
      
      const sectionIds = template.sections.map(s => s.id);
      expect(sectionIds).toEqual([
        'tagline',
        'voice-tone',
        'signature-phrases',
        'strengths',
        'weaknesses',
        'palette',
        'fonts',
        'bio',
        'examples'
      ]);
    });
  });

  describe('validate', () => {
    it('should validate complete Brand Rider successfully', async () => {
      const brandRider = await BrandGenerator.generate(mockInput);
      const validation = BrandGenerator.validate(brandRider);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should return errors for incomplete Brand Rider', () => {
      const incompleteBrandRider = {
        title: '',
        tagline: '',
        palette: [],
        fonts: null
      };

      const validation = BrandGenerator.validate(incompleteBrandRider);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('generatePreview', () => {
    it('should generate preview with sample data', () => {
      const preview = BrandGenerator.generatePreview('executive');

      expect(preview.title).toBe('Sample Brand Guidelines');
      expect(preview.tagline).toBeTruthy();
      expect(preview.format).toBe('executive');
      expect(preview.palette).toHaveLength(3);
      expect(preview.fonts).toHaveProperty('heading');
      expect(preview.fonts).toHaveProperty('body');
    });
  });
});