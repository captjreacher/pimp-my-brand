import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PDFExporter } from '../pdf-exporter';
import { PNGExporter } from '../png-exporter';
import { ShareManager } from '../share-manager';
import type { BrandRider, CV } from '../../generators/types';

// Mock the PDF export tools
vi.mock('../../pdf-export', () => ({
  loadPdfExportTools: vi.fn().mockResolvedValue({
    jsPDF: vi.fn().mockImplementation(() => ({
      internal: {
        pageSize: {
          getWidth: () => 210,
          getHeight: () => 297,
        },
      },
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      splitTextToSize: vi.fn().mockReturnValue(['test line']),
      text: vi.fn(),
      addPage: vi.fn(),
      output: vi.fn().mockReturnValue(new Blob(['test'], { type: 'application/pdf' })),
    })),
    html2canvas: vi.fn().mockResolvedValue({
      toBlob: vi.fn().mockImplementation((callback) => {
        callback(new Blob(['test'], { type: 'image/png' }));
      }),
      width: 1200,
      height: 630,
    }),
  }),
}));

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
      }),
    },
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'test-share-id',
              token: 'test-token',
              expires_at: null,
            },
          }),
        }),
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
          }),
        }),
      }),
    }),
    rpc: vi.fn().mockResolvedValue({
      data: [{
        id: 'test-share-id',
        kind: 'brand',
        target_id: 'test-brand-id',
        token: 'test-token',
        created_at: new Date().toISOString(),
        expires_at: null,
      }],
    }),
  },
}));

// Mock DOM methods
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn().mockReturnValue('blob:test-url'),
    revokeObjectURL: vi.fn(),
  },
});

Object.defineProperty(document, 'createElement', {
  value: vi.fn().mockReturnValue({
    innerHTML: '',
    style: {},
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  }),
});

Object.defineProperty(document, 'body', {
  value: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  },
});

describe('Export System', () => {
  const mockBrandRider: BrandRider = {
    title: 'Test Brand',
    tagline: 'Test Tagline',
    voiceTone: ['Professional', 'Friendly'],
    signaturePhrases: ['Test phrase'],
    strengths: ['Strong communication'],
    weaknesses: ['Time management'],
    palette: [{ name: 'Primary', hex: '#000000' }],
    fonts: { heading: 'Arial', body: 'Helvetica' },
    bio: 'Test bio',
    examples: [{ context: 'Email', example: 'Hello there!' }],
    format: 'professional',
  };

  const mockCV: CV = {
    name: 'John Doe',
    role: 'Software Engineer',
    summary: 'Experienced developer',
    experience: [{
      role: 'Developer',
      org: 'Tech Corp',
      dates: '2020-2023',
      bullets: ['Built applications', 'Led team'],
    }],
    skills: ['JavaScript', 'React'],
    links: [{ label: 'GitHub', url: 'https://github.com/johndoe' }],
    format: 'professional',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PDFExporter', () => {
    it('should export brand rider to PDF', async () => {
      const result = await PDFExporter.exportBrandRider(mockBrandRider);
      
      expect(result).toHaveProperty('blob');
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('filename');
      expect(result.filename).toContain('document');
    });

    it('should export CV to PDF', async () => {
      const result = await PDFExporter.exportCV(mockCV);
      
      expect(result).toHaveProperty('blob');
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('filename');
      expect(result.filename).toContain('document');
    });
  });

  describe('PNGExporter', () => {
    it('should export brand rider hero to PNG', async () => {
      const result = await PNGExporter.exportBrandRiderHero(mockBrandRider);
      
      expect(result).toHaveProperty('blob');
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('filename');
      expect(result).toHaveProperty('width');
      expect(result).toHaveProperty('height');
    });

    it('should export CV hero to PNG', async () => {
      const result = await PNGExporter.exportCVHero(mockCV);
      
      expect(result).toHaveProperty('blob');
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('filename');
      expect(result).toHaveProperty('width');
      expect(result).toHaveProperty('height');
    });

    it('should create social media image', async () => {
      const content = {
        title: 'Test Title',
        subtitle: 'Test Subtitle',
        colors: ['#000000', '#ffffff'],
      };

      const result = await PNGExporter.createSocialMediaImage(content, 'twitter');
      
      expect(result).toHaveProperty('blob');
      expect(result).toHaveProperty('url');
      expect(result.width).toBe(1200);
      expect(result.height).toBe(630);
    });
  });

  describe('ShareManager', () => {
    it('should create brand share', async () => {
      const result = await ShareManager.shareBrandRider('test-brand-id');
      
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('url');
      expect(result.url).toContain('/share/');
    });

    it('should create CV share', async () => {
      const result = await ShareManager.shareCV('test-cv-id');
      
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('url');
      expect(result.url).toContain('/share/');
    });

    it('should validate share expiration', () => {
      const validShare = { expiresAt: new Date(Date.now() + 86400000) }; // 1 day from now
      const expiredShare = { expiresAt: new Date(Date.now() - 86400000) }; // 1 day ago
      const neverExpiresShare = {};

      expect(ShareManager.isShareValid(validShare)).toBe(true);
      expect(ShareManager.isShareValid(expiredShare)).toBe(false);
      expect(ShareManager.isShareValid(neverExpiresShare)).toBe(true);
    });

    it('should provide expiration presets', () => {
      const presets = ShareManager.getExpirationPresets();
      
      expect(presets).toHaveLength(6);
      expect(presets[0].label).toBe('Never');
      expect(presets[0].value).toBeNull();
      expect(presets[1].label).toBe('1 Hour');
      expect(presets[1].value).toBeInstanceOf(Date);
    });
  });
});