import React, { useState } from 'react'
import { VideoAvatarGenerator } from '@/components/ai/VideoAvatarGenerator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GeneratedVideo } from '@/lib/ai/types'
import { VideoExportService, ExportOptions } from '@/lib/ai/video-export'
import { VideoEffectsService, AppliedEffect } from '@/lib/ai/video-effects'
import { useVideoGeneration } from '@/hooks/use-video-generation'
import { useToast } from '@/hooks/use-toast'
import { 
  Video, 
  Download, 
  Share2, 
  Sparkles, 
  Crown, 
  Zap,
  Instagram,
  Youtube,
  Linkedin
} from 'lucide-react'

export default function VideoAvatarDemo() {
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportResults, setExportResults] = useState<any[]>([])
  
  const { toast } = useToast()
  const videoExportService = new VideoExportService()
  const effectsService = new VideoEffectsService()

  const sampleBrandContent = `Hi, I'm Sarah, a digital marketing specialist with 5 years of experience helping brands grow their online presence. I specialize in social media strategy, content creation, and data-driven campaigns that deliver real results.`

  const handleVideoGenerated = (video: GeneratedVideo) => {
    setGeneratedVideo(video)
    toast({
      title: 'Video Generated Successfully!',
      description: 'Your AI avatar video is ready for export and sharing'
    })
  }

  const handleExportForPlatform = async (platform: ExportOptions['platform']) => {
    if (!generatedVideo) return

    setIsExporting(true)
    try {
      const exportOptions: ExportOptions = {
        platform,
        quality: 'hd',
        format: 'mp4'
      }

      const result = await videoExportService.exportForPlatform(generatedVideo, exportOptions)
      
      setExportResults(prev => [...prev, result])
      
      toast({
        title: 'Export Complete',
        description: `Video optimized for ${platform} is ready for download`
      })
    } catch (error) {
      console.error('Export failed:', error)
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export video',
        variant: 'destructive'
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleBatchExport = async () => {
    if (!generatedVideo) return

    setIsExporting(true)
    try {
      const platforms: ExportOptions['platform'][] = ['instagram', 'tiktok', 'youtube', 'linkedin']
      const results = await videoExportService.exportBatch(generatedVideo, platforms)
      
      setExportResults(results)
      
      toast({
        title: 'Batch Export Complete',
        description: `Video exported for ${platforms.length} platforms`
      })
    } catch (error) {
      console.error('Batch export failed:', error)
      toast({
        title: 'Batch Export Failed',
        description: 'Failed to export videos for all platforms',
        variant: 'destructive'
      })
    } finally {
      setIsExporting(false)
    }
  }

  const availableEffects = effectsService.getAvailableEffects()
  const transitionEffects = effectsService.getEffectsByType('transition')
  const overlayEffects = effectsService.getEffectsByType('overlay')
  const filterEffects = effectsService.getEffectsByType('filter')

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Video className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">AI Video Avatar Generator</h1>
          <Badge variant="secondary" className="ml-2">
            <Crown className="h-3 w-3 mr-1" />
            Tier 2 Feature
          </Badge>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Create professional 10-second animated avatar presentations with AI-powered video generation, 
          customizable effects, and social media optimization.
        </p>
      </div>

      {/* Feature Highlights */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Avatar Generation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Choose from professional, casual, or creative avatar styles with customizable 
              backgrounds and animations powered by D-ID and Synthesia APIs.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Video Effects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Add professional transitions, text overlays, zoom effects, and color grading 
              to create engaging video presentations.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Social Media Ready
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Export optimized videos for Instagram, TikTok, YouTube, LinkedIn, and more 
              with platform-specific aspect ratios and quality settings.
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="generator" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generator">Video Generator</TabsTrigger>
          <TabsTrigger value="effects">Effects Library</TabsTrigger>
          <TabsTrigger value="export">Export Options</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-6">
          <VideoAvatarGenerator
            brandContent={sampleBrandContent}
            onVideoGenerated={handleVideoGenerated}
          />
        </TabsContent>

        <TabsContent value="effects" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Video Effects</CardTitle>
                <CardDescription>
                  Enhance your avatar videos with professional effects and animations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="transitions" className="w-full">
                  <TabsList>
                    <TabsTrigger value="transitions">Transitions</TabsTrigger>
                    <TabsTrigger value="overlays">Overlays</TabsTrigger>
                    <TabsTrigger value="filters">Filters</TabsTrigger>
                  </TabsList>

                  <TabsContent value="transitions" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {transitionEffects.map((effect) => (
                        <Card key={effect.id}>
                          <CardContent className="p-4">
                            <h4 className="font-medium">{effect.name}</h4>
                            <p className="text-sm text-muted-foreground">{effect.description}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline">{effect.type}</Badge>
                              <Badge variant="secondary">{effect.parameters.length} params</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="overlays" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {overlayEffects.map((effect) => (
                        <Card key={effect.id}>
                          <CardContent className="p-4">
                            <h4 className="font-medium">{effect.name}</h4>
                            <p className="text-sm text-muted-foreground">{effect.description}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline">{effect.type}</Badge>
                              <Badge variant="secondary">{effect.parameters.length} params</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="filters" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {filterEffects.map((effect) => (
                        <Card key={effect.id}>
                          <CardContent className="p-4">
                            <h4 className="font-medium">{effect.name}</h4>
                            <p className="text-sm text-muted-foreground">{effect.description}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline">{effect.type}</Badge>
                              <Badge variant="secondary">{effect.parameters.length} params</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export & Social Media Optimization</CardTitle>
              <CardDescription>
                Export your video in formats optimized for different social media platforms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {generatedVideo ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <video
                      controls
                      className="w-full max-w-sm mx-auto rounded-lg"
                      poster="/placeholder-video-poster.jpg"
                    >
                      <source src={generatedVideo.url} type="video/mp4" />
                    </video>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Button
                      onClick={() => handleExportForPlatform('instagram')}
                      disabled={isExporting}
                      className="flex items-center gap-2"
                    >
                      <Instagram className="h-4 w-4" />
                      Export for Instagram
                    </Button>
                    <Button
                      onClick={() => handleExportForPlatform('youtube')}
                      disabled={isExporting}
                      className="flex items-center gap-2"
                    >
                      <Youtube className="h-4 w-4" />
                      Export for YouTube
                    </Button>
                    <Button
                      onClick={() => handleExportForPlatform('linkedin')}
                      disabled={isExporting}
                      className="flex items-center gap-2"
                    >
                      <Linkedin className="h-4 w-4" />
                      Export for LinkedIn
                    </Button>
                    <Button
                      onClick={handleBatchExport}
                      disabled={isExporting}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Batch Export All
                    </Button>
                  </div>

                  {exportResults.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Export Results</h4>
                      {exportResults.map((result, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                          <div>
                            <span className="font-medium">{result.metadata.platform}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              {result.metadata.dimensions.width}x{result.metadata.dimensions.height}
                            </span>
                          </div>
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Generate a video first to see export options
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Professional Brand Presentation</CardTitle>
                <CardDescription>Corporate avatar with office background</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                  <Video className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="space-y-2 text-sm">
                  <div><strong>Avatar:</strong> Professional Female</div>
                  <div><strong>Background:</strong> Modern Office</div>
                  <div><strong>Effects:</strong> Fade In, Zoom, Text Overlay</div>
                  <div><strong>Duration:</strong> 10 seconds</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Creative Portfolio Showcase</CardTitle>
                <CardDescription>Artistic avatar with dynamic effects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                  <Video className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="space-y-2 text-sm">
                  <div><strong>Avatar:</strong> Creative Male</div>
                  <div><strong>Background:</strong> Creative Space</div>
                  <div><strong>Effects:</strong> Slide In, Color Grade, Logo Overlay</div>
                  <div><strong>Duration:</strong> 10 seconds</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}