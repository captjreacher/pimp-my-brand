import { useState, useEffect, useCallback } from 'react';
import { VoiceSynthesisService, VoiceSynthesisOptions } from '@/lib/ai/voice-synthesis-service';
import { GenerationResult } from '@/lib/ai/types';
import { useToast } from '@/hooks/use-toast';

interface UseVoiceSynthesisOptions {
  userId: string;
  voiceService: VoiceSynthesisService;
}

interface VoiceSynthesisState {
  isGenerating: boolean;
  currentAudio: string | null;
  isPlaying: boolean;
  generationHistory: any[];
  usageStats: any;
  error: string | null;
}

export const useVoiceSynthesis = ({ userId, voiceService }: UseVoiceSynthesisOptions) => {
  const { toast } = useToast();
  
  const [state, setState] = useState<VoiceSynthesisState>({
    isGenerating: false,
    currentAudio: null,
    isPlaying: false,
    generationHistory: [],
    usageStats: null,
    error: null
  });

  // Load initial data
  useEffect(() => {
    loadUsageStats();
    loadGenerationHistory();
  }, [userId]);

  const loadUsageStats = useCallback(async () => {
    try {
      const stats = await voiceService.getUsageStats(userId);
      setState(prev => ({ ...prev, usageStats: stats, error: null }));
    } catch (error: any) {
      console.error('Failed to load usage stats:', error);
      setState(prev => ({ ...prev, error: error.message }));
    }
  }, [userId, voiceService]);

  const loadGenerationHistory = useCallback(async () => {
    try {
      const history = await voiceService.getVoiceHistory(userId);
      setState(prev => ({ ...prev, generationHistory: history, error: null }));
    } catch (error: any) {
      console.error('Failed to load generation history:', error);
      setState(prev => ({ ...prev, error: error.message }));
    }
  }, [userId, voiceService]);

  const generateBrandRiderVoice = useCallback(async (
    brandRiderId: string,
    options?: Partial<VoiceSynthesisOptions>
  ): Promise<GenerationResult | null> => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    
    try {
      const result = await voiceService.generateBrandRiderVoiceover(userId, brandRiderId, options);
      
      setState(prev => ({ 
        ...prev, 
        currentAudio: result.url,
        isGenerating: false 
      }));

      // Refresh data
      await Promise.all([loadUsageStats(), loadGenerationHistory()]);

      toast({
        title: "Voice Generated",
        description: "Your brand rider voiceover has been generated successfully!",
      });

      return result;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        error: error.message 
      }));

      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate voice. Please try again.",
        variant: "destructive"
      });

      return null;
    }
  }, [userId, voiceService, loadUsageStats, loadGenerationHistory, toast]);

  const generateCustomVoice = useCallback(async (
    text: string,
    options?: Partial<VoiceSynthesisOptions>
  ): Promise<GenerationResult | null> => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    
    try {
      const result = await voiceService.generateCustomVoiceover(userId, text, options);
      
      setState(prev => ({ 
        ...prev, 
        currentAudio: result.url,
        isGenerating: false 
      }));

      // Refresh data
      await Promise.all([loadUsageStats(), loadGenerationHistory()]);

      toast({
        title: "Voice Generated",
        description: "Your custom voiceover has been generated successfully!",
      });

      return result;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        error: error.message 
      }));

      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate voice. Please try again.",
        variant: "destructive"
      });

      return null;
    }
  }, [userId, voiceService, loadUsageStats, loadGenerationHistory, toast]);

  const setCurrentAudio = useCallback((url: string | null) => {
    setState(prev => ({ ...prev, currentAudio: url }));
  }, []);

  const setIsPlaying = useCallback((playing: boolean) => {
    setState(prev => ({ ...prev, isPlaying: playing }));
  }, []);

  const downloadAudio = useCallback(async (url: string, filename?: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename || `voiceover_${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: "Download Complete",
        description: "Audio file has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the audio file.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const getVoicePresets = useCallback(() => {
    return voiceService.getVoicePresets();
  }, [voiceService]);

  const canGenerate = state.usageStats ? 
    state.usageStats.used < state.usageStats.limit : false;

  const usagePercentage = state.usageStats ? 
    (state.usageStats.used / state.usageStats.limit) * 100 : 0;

  return {
    // State
    ...state,
    canGenerate,
    usagePercentage,

    // Actions
    generateBrandRiderVoice,
    generateCustomVoice,
    setCurrentAudio,
    setIsPlaying,
    downloadAudio,
    loadUsageStats,
    loadGenerationHistory,
    getVoicePresets,

    // Utilities
    refresh: useCallback(() => {
      loadUsageStats();
      loadGenerationHistory();
    }, [loadUsageStats, loadGenerationHistory])
  };
};