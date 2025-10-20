import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCcw,
  Download,
  Mic,
  Settings
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

interface VoiceoverIntegrationProps {
  voiceoverUrl?: string;
  brandRiderContent: {
    name: string;
    tagline?: string;
    description?: string;
    keyPoints?: string[];
  };
  onGenerateVoice?: () => void;
  onVoiceToggle?: (enabled: boolean) => void;
  className?: string;
}

export const VoiceoverIntegration: React.FC<VoiceoverIntegrationProps> = ({
  voiceoverUrl,
  brandRiderContent,
  onGenerateVoice,
  onVoiceToggle,
  className = ''
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(!!voiceoverUrl);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [voiceoverUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handlePlayPause = () => {
    if (!audioRef.current || !voiceoverUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current && duration > 0) {
      const newTime = (value[0] / 100) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const handleDownload = async () => {
    if (!voiceoverUrl) return;

    try {
      const response = await fetch(voiceoverUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${brandRiderContent.name}_voiceover.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download voiceover:', error);
    }
  };

  const handleVoiceToggle = (enabled: boolean) => {
    setVoiceEnabled(enabled);
    onVoiceToggle?.(enabled);
    
    if (!enabled && isPlaying) {
      audioRef.current?.pause();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Voice Toggle and Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Voiceover
            </CardTitle>
            <div className="flex items-center gap-2">
              {voiceoverUrl && (
                <Badge variant="secondary" className="text-xs">
                  10s
                </Badge>
              )}
              <Switch
                checked={voiceEnabled}
                onCheckedChange={handleVoiceToggle}
                disabled={!voiceoverUrl}
              />
            </div>
          </div>
        </CardHeader>
        
        {voiceEnabled && (
          <CardContent className="pt-0">
            {voiceoverUrl ? (
              <div className="space-y-3">
                {/* Main Controls */}
                <div className="flex items-center gap-3">
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
                    variant="ghost"
                    size="sm"
                    onClick={handleRestart}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>/</span>
                    <span>{formatTime(duration)}</span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowControls(!showControls)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <Slider
                    value={[progressPercentage]}
                    onValueChange={handleSeek}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Advanced Controls */}
                {showControls && (
                  <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleMute}
                      >
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        onValueChange={handleVolumeChange}
                        max={1}
                        step={0.1}
                        className="w-20"
                      />
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDownload}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                )}

                {/* Hidden Audio Element */}
                <audio
                  ref={audioRef}
                  src={voiceoverUrl}
                  preload="metadata"
                  className="hidden"
                />
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">
                  No voiceover generated yet
                </p>
                <Button
                  onClick={onGenerateVoice}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Mic className="h-4 w-4" />
                  Generate Voiceover
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Brand Content Preview (when voice is enabled) */}
      {voiceEnabled && voiceoverUrl && (
        <Card className="bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Voiceover Script</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="font-medium">{brandRiderContent.name}</div>
              {brandRiderContent.tagline && (
                <div className="text-muted-foreground italic">
                  {brandRiderContent.tagline}
                </div>
              )}
              {brandRiderContent.description && (
                <div>{brandRiderContent.description}</div>
              )}
              {brandRiderContent.keyPoints && brandRiderContent.keyPoints.length > 0 && (
                <div className="space-y-1">
                  {brandRiderContent.keyPoints.slice(0, 2).map((point, index) => (
                    <div key={index} className="text-muted-foreground">
                      • {point}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};