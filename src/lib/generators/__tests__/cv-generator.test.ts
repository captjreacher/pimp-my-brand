import { CVGenerator } from '../cv-generator';
import { CVGenerationInput, CV, GenerationOptions } from '../types';
import { StyleAnalysis } from '../../ai/types';
import { PresentationFormat } from '../../formats/types';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
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
import { expect } from 'vitest';
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
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
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
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { describe } from 'vitest';
import { vi } from 'vitest';
import { vi } from 'vitest';

// Mock the FormatTransformer
vi.mock('../../formats/transformer', () => ({
  FormatTransformer: {
    transformContent: vi.fn().mockImplementation(({ content }) => Promise.resolve(content))
  }
}));

describe('CVGenerator', () => {
  const mockStyleAnalysis: StyleAnalysis = {
    tone: {
      adjectives: ['professional', 'innovative', 'results-driven'],
      dos: ['Use active voice', 'Be specific with metrics'],
      donts: ['Avoid jargon', 'Don\'t be overly casual']
    },
    signaturePhrases: ['driving innovation', 'delivering results', 'leading teams'],
    strengths: ['Leadership', 'Strategic Thinking', 'Problem Solving'],
    weaknesses: ['Perfectionism', 'Impatience with inefficiency'],
    tagline: 'Innovative leader driving digital transformation',
    bioOneLiner: 'Experienced professional with 10+ years in technology leadership'
  };

  const mockInput: CVGenerationInput = {
    styleAnalysis: mockStyleAnalysis,
    extractedText: 'I am a Senior Software Engineer at Tech Company. I have experience with JavaScript, React, and Node.js. I led a team of 5 developers and improved system performance by 40%.',
    format: 'professional' as PresentationFormat,
    userProfile: {
      name: 'John Doe',
      role: 'Senior Software Engineer',
      bio: 'Passionate about building scalable solutions',
      links: [
        { label: 'LinkedIn', url: 'https://linkedin.com/in/johndoe' },
        { label: 'GitHub', url: 'https://github.com/johndoe' }
      ]
    }
  };

  describe('generate', () => {
    it('should generate a complete CV with all required sections', async () => {
      const cv = await CVGenerator.generate(mockInput);

      expect(cv).toMatchObject({
        name: 'John Doe',
        role: 'Senior Software Engineer',
        summary: expect.any(String),
        experience: expect.any(Array),
        skills: expect.any(Array),
        links: expect.arrayContaining([
          { label: 'LinkedIn', url: 'https://linkedin.com/in/johndoe' },
          { label: 'GitHub', url: 'https://github.com/johndoe' }
        ]),
        format: 'professional',
        isPublic: false
      });
    });

    it('should limit experience to maximum 3 roles', async () => {
      const cv = await CVGenerator.generate(mockInput);
      expect(cv.experience.length).toBeLessThanOrEqual(3);
    });

    it('should limit bullets to maximum 3 per role', async () => {
      const cv = await CVGenerator.generate(mockInput);
      cv.experience.forEach(role => {
        expect(role.bullets.length).toBeLessThanOrEqual(3);
      });
    });

    it('should include skills from style analysis and extracted text', async () => {
      const cv = await CVGenerator.generate(mockInput);
      
      // Should include strengths from style analysis
      expect(cv.skills).toEqual(expect.arrayContaining(['Leadership', 'Strategic Thinking', 'Problem Solving']));
      
      // Should include technical skills from text
      expect(cv.skills).toEqual(expect.arrayContaining(['JavaScript', 'React', 'Node.js']));
    });

    it('should generate summary from style analysis', async () => {
      const cv = await CVGenerator.generate(mockInput);
      expect(cv.summary).toContain(mockStyleAnalysis.bioOneLiner);
      expect(cv.summary).toContain(mockStyleAnalysis.tagline);
    });

    it('should respect generation options', async () => {
      const options: GenerationOptions = {
        maxExperienceRoles: 2,
        maxBulletsPerRole: 2
      };

      const cv = await CVGenerator.generate(mockInput, options);
      
      expect(cv.experience.length).toBeLessThanOrEqual(2);
      cv.experience.forEach(role => {
        expect(role.bullets.length).toBeLessThanOrEqual(2);
      });
    });

    it('should use default values when user profile is incomplete', async () => {
      const inputWithoutProfile: CVGenerationInput = {
        ...mockInput,
        userProfile: undefined
      };

      const cv = await CVGenerator.generate(inputWithoutProfile);
      
      expect(cv.name).toBe('Professional Name');
      expect(cv.links).toEqual([]);
    });
  });

  describe('createTemplate', () => {
    it('should create a proper CV template structure', async () => {
      const cv = await CVGenerator.generate(mockInput);
      const template = CVGenerator.createTemplate(cv);

      expect(template).toHaveProperty('header');
      expect(template).toHaveProperty('sections');
      
      expect(template.header).toMatchObject({
        name: cv.name,
        role: cv.role,
        summary: cv.summary,
        links: cv.links
      });

      expect(template.sections).toHaveLength(2);
      expect(template.sections[0]).toMatchObject({
        id: 'experience',
        title: 'Professional Experience',
        type: 'experience'
      });
      expect(template.sections[1]).toMatchObject({
        id: 'skills',
        title: 'Core Competencies',
        type: 'skills'
      });
    });
  });

  describe('updateFormat', () => {
    it('should update CV with new format while preserving structure', async () => {
      const cv = await CVGenerator.generate(mockInput);
      const newFormat = 'military' as PresentationFormat;
      
      const updatedCV = await CVGenerator.updateFormat(cv, newFormat);
      
      expect(updatedCV.format).toBe(newFormat);
      expect(updatedCV.name).toBe(cv.name); // Name should not change
      expect(updatedCV.experience.length).toBe(cv.experience.length); // Structure preserved
      expect(updatedCV.skills.length).toBe(cv.skills.length); // Skills count preserved
      expect(updatedCV).toHaveProperty('updatedAt');
    });
  });

  describe('validate', () => {
    it('should validate complete CV successfully', async () => {
      const cv = await CVGenerator.generate(mockInput);
      const validation = CVGenerator.validate(cv);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should return errors for incomplete CV', () => {
      const incompleteCV: Partial<CV> = {
        name: '',
        role: '',
        summary: '',
        experience: [],
        skills: [],
        format: undefined as any
      };

      const validation = CVGenerator.validate(incompleteCV);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Name is required');
      expect(validation.errors).toContain('Role is required');
      expect(validation.errors).toContain('Summary is required');
      expect(validation.errors).toContain('At least one experience entry is required');
      expect(validation.errors).toContain('Skills are required');
      expect(validation.errors).toContain('Presentation format is required');
    });

    it('should validate experience entries', () => {
      const cvWithInvalidExperience: Partial<CV> = {
        name: 'John Doe',
        role: 'Engineer',
        summary: 'Summary',
        experience: [
          {
            role: '',
            org: '',
            dates: '',
            bullets: []
          }
        ],
        skills: ['Skill 1'],
        format: 'professional' as PresentationFormat
      };

      const validation = CVGenerator.validate(cvWithInvalidExperience);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Experience 1: Role is required');
      expect(validation.errors).toContain('Experience 1: Organization is required');
      expect(validation.errors).toContain('Experience 1: Dates are required');
      expect(validation.errors).toContain('Experience 1: At least one bullet point is required');
    });
  });

  describe('generatePreview', () => {
    it('should generate preview CV with sample data', () => {
      const format = 'professional' as PresentationFormat;
      const preview = CVGenerator.generatePreview(format);
      
      expect(preview).toMatchObject({
        name: 'John Professional',
        role: 'Senior Software Engineer',
        summary: expect.any(String),
        experience: expect.any(Array),
        skills: expect.any(Array),
        links: expect.any(Array),
        format: format,
        isPublic: false
      });

      expect(preview.experience.length).toBeGreaterThan(0);
      expect(preview.skills.length).toBeGreaterThan(0);
      expect(preview.links.length).toBeGreaterThan(0);
    });
  });

  describe('text extraction methods', () => {
    it('should extract technical skills from text', () => {
      const text = 'I have experience with JavaScript, Python, React, AWS, and Docker. I also work with SQL databases.';
      const skills = (CVGenerator as any).extractTechnicalSkills(text);
      
      expect(skills).toContain('JavaScript');
      expect(skills).toContain('Python');
      expect(skills).toContain('React');
      expect(skills).toContain('AWS');
      expect(skills).toContain('Docker');
      expect(skills).toContain('SQL');
    });

    it('should extract roles from text patterns', () => {
      const text = 'I worked as a Software Engineer at Google (2020-2022) and as a Senior Developer at Microsoft.';
      const roles = (CVGenerator as any).extractRolesFromText(text);
      
      expect(roles.length).toBeGreaterThan(0);
      expect(roles[0]).toMatchObject({
        role: expect.stringContaining('Software Engineer'),
        org: expect.stringContaining('Google'),
        dates: expect.stringContaining('2020'),
        bullets: expect.any(Array)
      });
    });
  });
});