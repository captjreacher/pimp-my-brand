import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentRiskAnalyzer, ContentAnalysisInput } from '../content-risk-analyzer';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { created_at: '2024-01-01' }, error: null }))
        })),
        head: vi.fn(() => Promise.resolve({ count: 0, error: null }))
      }))
    }))
  }
}));

describe('ContentRiskAnalyzer', () => {
  let analyzer: ContentRiskAnalyzer;

  beforeEach(() => {
    analyzer = new ContentRiskAnalyzer();
  });

  describe('analyzeContent', () => {
    it('should detect profanity in brand content', async () => {
      const input: ContentAnalysisInput = {
        content_type: 'brand',
        title: 'My Brand',
        description: 'This is a fucking awesome brand',
        content_data: {
          tagline: 'Best damn product ever',
          values: ['quality', 'shit service']
        },
        user_id: 'test-user'
      };

      const result = await analyzer.analyzeContent(input);

      expect(result.overall_score).toBeGreaterThan(0);
      expect(result.risk_factors).toHaveLength(1);
      expect(result.risk_factors[0].type).toBe('profanity');
      expect(result.risk_factors[0].severity).toBe('medium');
    });

    it('should detect spam patterns', async () => {
      const input: ContentAnalysisInput = {
        content_type: 'brand',
        title: 'CLICK HERE NOW!!!',
        description: 'Buy now! Limited time offer! Act now! Free money guaranteed!',
        content_data: {
          tagline: 'Winner winner chicken dinner!'
        },
        user_id: 'test-user'
      };

      const result = await analyzer.analyzeContent(input);

      expect(result.overall_score).toBeGreaterThan(0);
      expect(result.risk_factors.some(f => f.type === 'spam')).toBe(true);
    });

    it('should detect suspicious patterns', async () => {
      const input: ContentAnalysisInput = {
        content_type: 'cv',
        content_data: {
          summary: 'I can hack any system and crack passwords',
          experience: [{
            title: 'Hacker',
            company: 'Illegal Operations Inc',
            description: 'Stole credit card information'
          }]
        },
        user_id: 'test-user'
      };

      const result = await analyzer.analyzeContent(input);

      expect(result.overall_score).toBeGreaterThan(0);
      expect(result.risk_factors.some(f => f.type === 'suspicious_patterns')).toBe(true);
    });

    it('should flag content with very short length', async () => {
      const input: ContentAnalysisInput = {
        content_type: 'brand',
        title: 'Hi',
        content_data: {},
        user_id: 'test-user'
      };

      const result = await analyzer.analyzeContent(input);

      expect(result.overall_score).toBeGreaterThan(0);
      expect(result.risk_factors.some(f => f.type === 'inappropriate_content')).toBe(true);
    });

    it('should return low risk for clean content', async () => {
      const input: ContentAnalysisInput = {
        content_type: 'brand',
        title: 'Professional Brand',
        description: 'A high-quality professional service focused on excellence and customer satisfaction.',
        content_data: {
          tagline: 'Excellence in every detail',
          values: ['quality', 'integrity', 'innovation'],
          description: 'We provide professional services with attention to detail and customer focus.'
        },
        user_id: 'test-user'
      };

      const result = await analyzer.analyzeContent(input);

      expect(result.overall_score).toBeLessThan(20);
      expect(result.risk_factors).toHaveLength(0);
      expect(result.auto_flag).toBe(false);
    });

    it('should auto-flag high-risk content', async () => {
      const input: ContentAnalysisInput = {
        content_type: 'brand',
        title: 'FUCKING AWESOME SHIT',
        description: 'Click here now! Buy this shit! Guaranteed money! Hack the system! Steal passwords!',
        content_data: {
          tagline: 'Best damn fucking service ever!',
          values: ['hack', 'steal', 'illegal']
        },
        user_id: 'test-user',
        user_history: {
          previous_flags: 5,
          account_age_days: 0,
          content_count: 100
        }
      };

      const result = await analyzer.analyzeContent(input);

      expect(result.overall_score).toBeGreaterThan(70);
      expect(result.auto_flag).toBe(true);
      expect(result.risk_factors.length).toBeGreaterThan(1);
    });

    it('should consider user history in risk assessment', async () => {
      const input: ContentAnalysisInput = {
        content_type: 'brand',
        title: 'My Brand',
        description: 'A simple brand description',
        content_data: {},
        user_id: 'test-user',
        user_history: {
          previous_flags: 3,
          account_age_days: 0,
          content_count: 50
        }
      };

      const result = await analyzer.analyzeContent(input);

      expect(result.overall_score).toBeGreaterThan(0);
      expect(result.risk_factors.some(f => f.type === 'policy_violation')).toBe(true);
      expect(result.risk_factors.some(f => f.type === 'suspicious_patterns')).toBe(true);
    });

    it('should calculate confidence correctly', async () => {
      const input: ContentAnalysisInput = {
        content_type: 'brand',
        title: 'Test Brand',
        description: 'A comprehensive description with enough content to analyze properly and provide good confidence in the risk assessment results.',
        content_data: {
          tagline: 'Professional service',
          values: ['quality', 'service']
        },
        user_id: 'test-user'
      };

      const result = await analyzer.analyzeContent(input);

      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.confidence).toBeLessThanOrEqual(1.0);
    });
  });

  describe('extractTextContent', () => {
    it('should extract text from brand data', () => {
      const input: ContentAnalysisInput = {
        content_type: 'brand',
        title: 'Brand Title',
        description: 'Brand Description',
        content_data: {
          tagline: 'Brand Tagline',
          values: ['value1', 'value2']
        },
        user_id: 'test-user'
      };

      const text = analyzer['extractTextContent'](input);
      
      expect(text).toContain('brand title');
      expect(text).toContain('brand description');
      expect(text).toContain('brand tagline');
      expect(text).toContain('value1');
      expect(text).toContain('value2');
    });

    it('should extract text from CV data', () => {
      const input: ContentAnalysisInput = {
        content_type: 'cv',
        content_data: {
          summary: 'Professional summary',
          experience: [
            {
              title: 'Job Title',
              company: 'Company Name',
              description: 'Job description'
            }
          ],
          skills: ['skill1', 'skill2']
        },
        user_id: 'test-user'
      };

      const text = analyzer['extractTextContent'](input);
      
      expect(text).toContain('professional summary');
      expect(text).toContain('job title');
      expect(text).toContain('company name');
      expect(text).toContain('job description');
      expect(text).toContain('skill1');
      expect(text).toContain('skill2');
    });
  });

  describe('shouldAutoFlag', () => {
    it('should auto-flag high score with good confidence', () => {
      const shouldFlag = analyzer['shouldAutoFlag'](75, 0.8);
      expect(shouldFlag).toBe(true);
    });

    it('should auto-flag very high score regardless of confidence', () => {
      const shouldFlag = analyzer['shouldAutoFlag'](90, 0.3);
      expect(shouldFlag).toBe(true);
    });

    it('should auto-flag moderate score with very high confidence', () => {
      const shouldFlag = analyzer['shouldAutoFlag'](55, 0.95);
      expect(shouldFlag).toBe(true);
    });

    it('should not auto-flag low score', () => {
      const shouldFlag = analyzer['shouldAutoFlag'](30, 0.9);
      expect(shouldFlag).toBe(false);
    });

    it('should not auto-flag moderate score with low confidence', () => {
      const shouldFlag = analyzer['shouldAutoFlag'](60, 0.5);
      expect(shouldFlag).toBe(false);
    });
  });
});