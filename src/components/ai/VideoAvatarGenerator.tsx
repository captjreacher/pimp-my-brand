import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VideoGenerationService } from '@/lib/ai/video-generation-service'
import { FeatureGate } from '@/lib/ai/feature-gate'
import { VideoConfig, AvatarStyle, BackgroundConfig, AnimationConfig, GeneratedVideo } from '@/lib/ai/types'
import { useSubscription } from '@/hooks/use-subscription'
import { useToast } from '@/hooks/use-toast'
import { Play, Download, Share2, Loader2, Video, Settings, Palette } from 'lucide-react'

const isVideoGenerationAvailable = (plan?: string): boolean => {
  return plan === 'premium' // Only premium tier has video generation
}

interface VideoAvatarGeneratorProps {
  brandContent?: string
  onVideoGenerated?: (video: GeneratedVideo) => void
}

export function VideoAvatarGenerator({ brandContent, onVideoGenerated }: VideoAvatarGeneratorProps) {
  const [script, setScript] = useState(brandContent || '')
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarStyle | null>(null)
  const [selectedBackground, setSelectedBackground] = useState<BackgroundConfig | null>(null)
  const [animations, setAnimations] = useState<AnimationConfig[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null)
  const [availableAvatars, setAvailableAvatars] = useState<AvatarStyle[]>([])
  const [availableBackgrounds, setAvailableBackgrounds] = useState<BackgroundConfig[]>([])
  const [videoService] = useState(() => new VideoGenerationService(new FeatureGate()))
  
  const { subscription } = useSubscription()
  const { toast } = useToast()

  useEffect(() => {
    loadOptions()
  }, [])

  const loadOptions = async () => {
    try {
      const [avatars, backgrounds] = await Promise.all([
        videoService.getAvailableAvatarStyles(),
        videoService.getBackgroundOptions()
      ])
      setAvailableAvatars(avatars)
      setAvailableBackgrounds(backgrounds)
      
      // Set defaults
      if (avatars.length > 0) setSelectedAvatar(avatars[0])
      if (backgrounds.length > 0) setSelectedBackground(backgrounds[0])
    } catch (error) {
      console.error('Failed to load video options:', error)
      toast({
        title: 'Error',
        description: 'Failed to load video generation options',
        variant: 'destructive'
      })
    }
  }

  const handleGenerateVideo = async () => {
    if (!selectedAvatar || !selectedBackground || !script.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please select an avatar, background, and provide script content',
        variant: 'destructive'
      })
      return
    }

    if (!isVideoGenerationAvailable(subscription?.plan)) {
      toast({
        title: 'Upgrade Required',
        description: 'Video avatar generation requires a Tier 2 subscription',
        variant: 'destructive'
      })
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 10, 90))
      }, 1000)

      const config: VideoConfig = {
        avatarStyle: selectedAvatar,
        script: script.trim(),
        background: selectedBackground,
        animations: animations,
        duration: 10
      }

      const video = await videoService.generateVideo('current-user-id', config)
      
      clearInterval(progressInterval)
      setGenerationProgress(100)
      
      setGeneratedVideo(video)
      onVideoGenerated?.(video)
      
      toast({
        title: 'Video Generated!',
        description: 'Your AI avatar video has been created successfully'
      })
    } catch (error) {
      console.error('Video generation failed:', error)
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate video',
        variant: 'destructive'
      })
    } finally {
      setIsGenerating(false)
      setGenerationProgress(0)
    }
  }

  const addAnimation = (type: AnimationConfig['type']) => {
    const newAnimation: AnimationConfig = {
      type,
      timing: { start: 0, duration: 2 },
      properties: getDefaultAnimationProperties(type)
    }
    setAnimations([...animations, newAnimation])
  }

  const getDefaultAnimationProperties = (type: AnimationConfig['type']) => {
    switch (type) {
      case 'zoom':
        return { scale: 1.2, easing: 'ease-in-out' }
      case 'fade':
        return { opacity: 0.8, easing: 'ease-in' }
      case 'slide':
        return { direction: 'left', distance: 50 }
      case 'text_overlay':
        return { text: 'Your Brand', position: 'bottom', fontSize: 24 }
      default:
        return {}
    }
  }

  const removeAnimation = (index: number) => {
    setAnimations(animations.filter((_, i) => i !== index))
  }

  const canGenerate = selectedAvatar && selectedBackground && script.trim() && !isGenerating

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            AI Video Avatar Generator
          </CardTitle>
          <CardDescription>
            Create 10-second animated avatar presentations for your brand content
          </CardDescription>
          {!isVideoGenerationAvailable(subscription?.plan) && (
            <Alert>
              <AlertDescription>
                Video avatar generation requires a Tier 2 subscription. 
                <Button variant="link" className="p-0 h-auto ml-1">
                  Upgrade now
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="script" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="script">Script</TabsTrigger>
              <TabsTrigger value="avatar">Avatar</TabsTrigger>
              <TabsTrigger value="background">Background</TabsTrigger>
              <TabsTrigger value="effects">Effects</TabsTrigger>
            </TabsList>

            <TabsContent value="script" className="space-y-4">
              <div>
                <Label htmlFor="script">Video Script (Max 500 characters)</Label>
                <Textarea
                  id="script"
                  placeholder="Enter the text for your avatar to speak..."
                  value={script}
                  onChange={(e) => setScript(e.target.value.slice(0, 500))}
                  className="min-h-[120px] mt-2"
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {script.length}/500 characters
                </div>
              </div>
            </TabsContent>

            <TabsContent value="avatar" className="space-y-4">
              <div>
                <Label>Choose Avatar Style</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                  {availableAvatars.map((avatar) => (
                    <Card
                      key={avatar.id}
                      className={`cursor-pointer transition-all ${
                        selectedAvatar?.id === avatar.id
                          ? 'ring-2 ring-primary'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedAvatar(avatar)}
                    >
                      <CardContent className="p-4">
                        <img
                          src={avatar.previewUrl}
                          alt={avatar.name}
                          className="w-full h-32 object-cover rounded-md mb-2"
                        />
                        <h4 className="font-medium text-sm">{avatar.name}</h4>
                        <p className="text-xs text-muted-foreground">{avatar.description}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {avatar.category}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="background" className="space-y-4">
              <div>
                <Label>Choose Background</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                  {availableBackgrounds.map((background) => (
                    <Card
                      key={background.id}
                      className={`cursor-pointer transition-all ${
                        selectedBackground?.id === background.id
                          ? 'ring-2 ring-primary'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedBackground(background)}
                    >
                      <CardContent className="p-4">
                        <img
                          src={background.previewUrl}
                          alt={background.name}
                          className="w-full h-24 object-cover rounded-md mb-2"
                        />
                        <h4 className="font-medium text-sm">{background.name}</h4>
                        <p className="text-xs text-muted-foreground">{background.description}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {background.category}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="effects" className="space-y-4">
              <div>
                <Label>Video Effects & Animations</Label>
                <div className="flex gap-2 mt-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addAnimation('zoom')}
                  >
                    Add Zoom
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addAnimation('fade')}
                  >
                    Add Fade
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addAnimation('text_overlay')}
                  >
                    Add Text
                  </Button>
                </div>
                
                {animations.length > 0 && (
                  <div className="space-y-2">
                    {animations.map((animation, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-md"
                      >
                        <div>
                          <span className="font-medium capitalize">{animation.type}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {animation.timing.start}s - {animation.timing.start + animation.timing.duration}s
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAnimation(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-4 mt-6">
            <Button
              onClick={handleGenerateVideo}
              disabled={!canGenerate}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Video...
                </>
              ) : (
                <>
                  <Video className="mr-2 h-4 w-4" />
                  Generate Video
                </>
              )}
            </Button>
          </div>

          {isGenerating && (
            <div className="mt-4">
              <Label>Generation Progress</Label>
              <Progress value={generationProgress} className="mt-2" />
              <p className="text-sm text-muted-foreground mt-1">
                Creating your AI avatar video... This may take 1-2 minutes.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {generatedVideo && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Video</CardTitle>
            <CardDescription>
              Your AI avatar video is ready! Duration: {generatedVideo.duration}s
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <video
                controls
                className="w-full max-w-md mx-auto rounded-lg"
                poster="/placeholder-video-poster.jpg"
              >
                <source src={generatedVideo.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm">
                  <Play className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download MP4
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>

              <div className="text-sm text-muted-foreground text-center">
                Generated by {generatedVideo.provider} • Optimized for social media
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}