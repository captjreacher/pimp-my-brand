import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VoiceSynthesisService } from '../voice-synthesis-service';
import { AIServiceOrchestrator } from '../service-orchestrator';

// Mock the dependencies
vi.mock('../service-orchestrator');
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: {
                  usage_count: 0,
                  total_cost_cents: 0
                },
                error: null
              }))
            }))
          })),
          single: vi.fn(() => Promise.resolve({
            data: {
              title: 'Test Brand',
              tagline: 'Test Tagline',
              bio: 'Test bio description',
              strengths: ['Strength 1', 'Strength 2']
            },
            error: null
          }))
        }))
      })),
      insert: vi.fn(() => Promise.resolve({ error: null }))
    }))
  }
}));

vi.mock('../feature-gate', () => ({
  FeatureGate: {
    canAccessFeature: vi.fn(() => Promise.resolve(true)),
    trackUsage: vi.fn(() => Promise.resolve()),
    checkQuota: vi.fn(() => Promise.resolve({
      canUse: true,
      remaining: 10,
      resetDate: new Date()
    })),
    getUsageLimit: vi.fn(() => Promise.resolve({
      monthly: 20,
      daily: 5,
      perRequest: 1,
      costLimit: 500
    }))
  }
}));

describe('VoiceSynthesisService', () => {
  let voiceService: VoiceSynthesisService;
  let mockOrchestrator: any;

  const mockConfig = {
    providers: {
      openai: {
        apiKey: 'test-key',
        imageModel: 'dall-e-3' as const,
        ttsModel: 'tts-1' as const,
        voiceOptions: ['alloy', 'echo']
      },
      stability: {
        apiKey: 'test-key',
        endpoint: 'https://api.stability.ai'
      },
      elevenlabs: {
        apiKey: 'test-key',
        voiceId: 'test-voice-id'
      }
    },
    limits: {
      maxFileSize: 10 * 1024 * 1024,
      maxGenerationTime: 60000,
      costLimits: { free: 100, tier_1: 1000, tier_2: 5000 }
    }
  };

  beforeEach(() => {
    mockOrchestrator = {
      generateWithFallback: vi.fn(() => Promise.resolve({
        url: 'https://example.com/generated-audio.mp3',
        metadata: {
          provider: 'openai',
          voice: 'alloy',
          duration: 10
        },
        costCents: 15
      }))
    };

    vi.mocked(AIServiceOrchestrator).mockImplementation(() => mockOrchestrator);
    voiceService = new VoiceSynthesisService(mockConfig);
  });

  describe('generateBrandRiderVoiceover', () => {
    it('should generate voiceover from brand rider content', async () => {
      const userId = 'test-user-123';
      const brandRiderId = 'test-brand-456';

      const result = await voiceService.generateBrandRiderVoiceover(userId, brandRiderId);

      expect(result).toBeDefined();
      expect(result.url).toBe('https://example.com/generated-audio.mp3');
      expect(result.costCents).toBe(15);
      expect(mockOrchestrator.generateWithFallback).toHaveBeenCalledWith(
        'voice_synthesis',
        expect.objectContaining({
          text: expect.stringContaining('Test Brand'),
          options: expect.objectContaining({
            voice: 'professional',
            maxDuration: 10
          })
        }),
        expect.objectContaining({ userId }),
        userId
      );
    });

    it('should use custom voice options when provided', async () => {
      const userId = 'test-user-123';
      const brandRiderId = 'test-brand-456';
      const options = {
        voice: 'energetic',
        speed: 1.2,
        emotion: 'energetic' as const
      };

      await voiceService.generateBrandRiderVoiceover(userId, brandRiderId, options);

      expect(mockOrchestrator.generateWithFallback).toHaveBeenCalledWith(
        'voice_synthesis',
        expect.objectContaining({
          options: expect.objectContaining({
            voice: 'energetic',
            speed: 1.2,
            emotion: 'energetic'
          })
        }),
        expect.any(Object),
        userId
      );
    });
  });

  describe('generateCustomVoiceover', () => {
    it('should generate voiceover from custom text', async () => {
      const userId = 'test-user-123';
      const text = 'This is a custom voiceover text for testing.';

      const result = await voiceService.generateCustomVoiceover(userId, text);

      expect(result).toBeDefined();
      expect(result.url).toBe('https://example.com/generated-audio.mp3');
      expect(mockOrchestrator.generateWithFallback).toHaveBeenCalledWith(
        'voice_synthesis',
        expect.objectContaining({
          text: text,
          options: expect.objectContaining({
            voice: 'professional',
            maxDuration: 10
          })
        }),
        expect.objectContaining({ userId }),
        userId
      );
    });
  });

  describe('getVoicePresets', () => {
    it('should return available voice presets', () => {
      const presets = voiceService.getVoicePresets();

      expect(presets).toHaveLength(5);
      expect(presets[0]).toEqual({
        id: 'professional',
        name: 'Professional',
        voice: 'alloy',
        speed: 1.0,
        pitch: 0,
        emotion: 'professional',
        description: 'Clear, authoritative voice perfect for business presentations'
      });
    });
  });

  describe('getUsageStats', () => {
    it('should return usage statistics for the user', async () => {
      const userId = 'test-user-123';

      const stats = await voiceService.getUsageStats(userId);

      expect(stats).toEqual({
        used: 0,
        limit: 20,
        costUsed: 0,
        costLimit: 500,
        resetDate: expect.any(Date)
      });
    });
  });
});