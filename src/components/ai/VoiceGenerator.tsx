import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Download, 
  Mic, 
  Volume2, 
  Settings, 
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { VoiceSynthesisService, VoicePreset } from '@/lib/ai/voice-synthesis-service';
import { GenerationResult } from '@/lib/ai/types';
import { useToast } from '@/hooks/use-toast';

interface VoiceGeneratorProps {
  voiceService: VoiceSynthesisService;
  userId: string;
  brandRiderId?: string;
  initialText?: string;
  onVoiceGenerated?: (result: GenerationResult) => void;
}

export const VoiceGenerator: React.FC<VoiceGeneratorProps> = ({
  voiceService,
  userId,
  brandRiderId,
  initialText = '',
  onVoiceGenerated
}) => {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // State management
  const [text, setText] = useState(initialText);
  const [selectedPreset, setSelectedPreset] = useState<string>('professional');
  const [customVoice, setCustomVoice] = useState({
    voice: 'alloy',
    speed: 1.0,
    pitch: 0,
    emotion: 'professional' as 'neutral' | 'energetic' | 'professional' | 'friendly'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [generationHistory, setGenerationHistory] = useState<any[]>([]);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Voice presets
  const voicePresets = voiceService.getVoicePresets();

  useEffect(() => {
    loadUsageStats();
    loadGenerationHistory();
  }, []);

  useEffect(() => {
    // Update custom voice settings when preset changes
    const preset = voicePresets.find(p => p.id === selectedPreset);
    if (preset) {
      setCustomVoice({
        voice: preset.voice,
        speed: preset.speed,
        pitch: preset.pitch,
        emotion: preset.emotion
      });
    }
  }, [selectedPreset]);

  const loadUsageStats = async () => {
    try {
      const stats = await voiceService.getUsageStats(userId);
      setUsageStats(stats);
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    }
  };

  const loadGenerationHistory = async () => {
    try {
      const history = await voiceService.getVoiceHistory(userId, 5);
      setGenerationHistory(history);
    } catch (error) {
      console.error('Failed to load generation history:', error);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast({
        title: "Text Required",
        description: "Please enter some text to generate voice.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      let result: GenerationResult;
      
      if (brandRiderId) {
        result = await voiceService.generateBrandRiderVoiceover(userId, brandRiderId, {
          ...customVoice,
          customPrompt: text !== initialText ? text : undefined
        });
      } else {
        result = await voiceService.generateCustomVoiceover(userId, text, customVoice);
      }

      setCurrentAudio(result.url);
      onVoiceGenerated?.(result);
      
      // Refresh stats and history
      await loadUsageStats();
      await loadGenerationHistory();

      toast({
        title: "Voice Generated",
        description: "Your voiceover has been generated successfully!",
        variant: "default"
      });

    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate voice. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !currentAudio) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleDownload = async () => {
    if (!currentAudio) return;

    try {
      const response = await fetch(currentAudio);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voiceover_${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the audio file.",
        variant: "destructive"
      });
    }
  };

  const canGenerate = usageStats && usageStats.used < usageStats.limit;
  const usagePercentage = usageStats ? (usageStats.used / usageStats.limit) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Usage Stats */}
      {usageStats && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Voice Generation Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>This Month: {usageStats.used} / {usageStats.limit}</span>
                <span className="text-muted-foreground">
                  Resets {usageStats.resetDate.toLocaleDateString()}
                </span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
              {!canGenerate && (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Monthly limit reached. Upgrade for more generations.</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Generation Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Text Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Text to Speech</label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter the text you want to convert to speech..."
              className="min-h-[100px]"
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">
              {text.length}/500 characters (≈{Math.ceil(text.length / 25)} seconds)
            </div>
          </div>

          {/* Voice Preset Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Voice Style</label>
            <Select value={selectedPreset} onValueChange={setSelectedPreset}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {voicePresets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{preset.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {preset.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Settings */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Advanced Settings
            </Button>
            
            {showAdvanced && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Speed: {customVoice.speed}x</label>
                  <Slider
                    value={[customVoice.speed]}
                    onValueChange={([value]) => setCustomVoice(prev => ({ ...prev, speed: value }))}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pitch: {customVoice.pitch}</label>
                  <Slider
                    value={[customVoice.pitch]}
                    onValueChange={([value]) => setCustomVoice(prev => ({ ...prev, pitch: value }))}
                    min={-5}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Emotion</label>
                  <Select 
                    value={customVoice.emotion} 
                    onValueChange={(value: any) => setCustomVoice(prev => ({ ...prev, emotion: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="energetic">Energetic</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !canGenerate || !text.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Voice...
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Generate Voice
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Audio Player */}
      {currentAudio && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Generated Voice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlayPause}
                className="flex items-center gap-2"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>

              <Badge variant="secondary" className="ml-auto">
                10 seconds
              </Badge>
            </div>

            <audio
              ref={audioRef}
              src={currentAudio}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          </CardContent>
        </Card>
      )}

      {/* Recent Generations */}
      {generationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Generations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {generationHistory.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1">
                    <div className="text-sm font-medium truncate">
                      {item.prompt || 'Custom voiceover'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()} • 
                      {item.cost_cents ? ` ${item.cost_cents}¢` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === 'completed' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {item.result_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentAudio(item.result_url)}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};