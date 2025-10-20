import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ImageEditor } from './ImageEditor'
import { ImageGenerationService, ImageOptions, GeneratedImage } from '@/lib/ai/image-generation-service'
import { FeatureGate, AIFeature, QuotaStatus } from '@/lib/ai/feature-gate'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Wand2, Image as ImageIcon, Palette, User } from 'lucide-react'

interface AIImageGeneratorProps {
  userId: string
  onImageGenerated?: (image: GeneratedImage) => void
  className?: string
}

export const AIImageGenerator: React.FC<AIImageGeneratorProps> = ({
  userId,
  onImageGenerated,
  className
}) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'edit'>('generate')
  const [generationType, setGenerationType] = useState<'logo' | 'avatar' | 'background'>('logo')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null)
  const [quota, setQuota] = useState<QuotaStatus | null>(null)
  const [prompt, setPrompt] = useState('')
  const [brandName, setBrandName] = useState('')
  const [industry, setIndustry] = useState('')
  const [style, setStyle] = useState('professional')
  const [description, setDescription] = useState('')
  const [theme, setTheme] = useState('')
  const [mood, setMood] = useState('')
  
  const { toast } = useToast()
  const imageService = new ImageGenerationService()

  React.useEffect(() => {
    checkQuota()
  }, [userId])

  const checkQuota = async () => {
    try {
      const quotaStatus = await FeatureGate.checkQuota(userId, AIFeature.IMAGE_GENERATION)
      setQuota(quotaStatus)
    } catch (error) {
      console.error('Error checking quota:', error)
    }
  }

  const handleGenerate = async () => {
    if (!quota?.canUse) {
      toast({
        title: "Usage Limit Reached",
        description: quota?.reason || "You've reached your usage limit for this feature.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    
    try {
      let result: GeneratedImage

      switch (generationType) {
        case 'logo':
          if (!brandName || !industry) {
            toast({
              title: "Missing Information",
              description: "Please provide brand name and industry for logo generation.",
              variant: "destructive"
            })
            return
          }
          result = await imageService.generateLogo(userId, brandName, industry, style)
          break
          
        case 'avatar':
          if (!description) {
            toast({
              title: "Missing Information", 
              description: "Please provide a description for avatar generation.",
              variant: "destructive"
            })
            return
          }
          result = await imageService.generateAvatar(userId, description, style)
          break
          
        case 'background':
          if (!theme || !mood) {
            toast({
              title: "Missing Information",
              description: "Please provide theme and mood for background generation.",
              variant: "destructive"
            })
            return
          }
          result = await imageService.generateBackground(userId, theme, mood)
          break
          
        default:
          if (!prompt) {
            toast({
              title: "Missing Prompt",
              description: "Please provide a prompt for image generation.",
              variant: "destructive"
            })
            return
          }
          
          const options: ImageOptions = {
            style: style as any,
            dimensions: { width: 512, height: 512 },
            format: generationType,
            quality: 'hd'
          }
          
          result = await imageService.generateImage(userId, prompt, options)
      }

      setGeneratedImage(result)
      setActiveTab('edit')
      await checkQuota() // Refresh quota after generation
      
      toast({
        title: "Image Generated Successfully",
        description: "Your AI-generated image is ready for editing."
      })

      if (onImageGenerated) {
        onImageGenerated(result)
      }

    } catch (error) {
      console.error('Generation failed:', error)
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate image. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEnhanceImage = async (imageUrl: string) => {
    try {
      setIsGenerating(true)
      const enhanced = await imageService.enhanceImage(userId, imageUrl)
      setGeneratedImage(enhanced)
      
      toast({
        title: "Image Enhanced",
        description: "Your image has been enhanced with AI."
      })
    } catch (error) {
      toast({
        title: "Enhancement Failed",
        description: error.message || "Failed to enhance image.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRemoveBackground = async (imageUrl: string) => {
    try {
      setIsGenerating(true)
      const processed = await imageService.removeBackground(userId, imageUrl)
      setGeneratedImage(processed)
      
      toast({
        title: "Background Removed",
        description: "Background has been removed from your image."
      })
    } catch (error) {
      toast({
        title: "Background Removal Failed",
        description: error.message || "Failed to remove background.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className={`ai-image-generator ${className}`}>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">
            <Wand2 className="w-4 h-4 mr-2" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="edit" disabled={!generatedImage}>
            <ImageIcon className="w-4 h-4 mr-2" />
            Edit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5" />
                AI Image Generation
              </CardTitle>
              {quota && (
                <div className="flex gap-2">
                  <Badge variant={quota.canUse ? "default" : "destructive"}>
                    {quota.remaining} generations remaining
                  </Badge>
                  <Badge variant="outline">
                    Resets: {quota.resetDate.toLocaleDateString()}
                  </Badge>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Generation Type</Label>
                <Select value={generationType} onValueChange={(value) => setGenerationType(value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="logo">
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Logo
                      </div>
                    </SelectItem>
                    <SelectItem value="avatar">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Avatar
                      </div>
                    </SelectItem>
                    <SelectItem value="background">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Background
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="artistic">Artistic</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {generationType === 'logo' && (
                <>
                  <div>
                    <Label>Brand Name</Label>
                    <Input
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Enter your brand name"
                    />
                  </div>
                  <div>
                    <Label>Industry</Label>
                    <Input
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g., Technology, Healthcare, Finance"
                    />
                  </div>
                </>
              )}

              {generationType === 'avatar' && (
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the avatar you want to generate..."
                    rows={3}
                  />
                </div>
              )}

              {generationType === 'background' && (
                <>
                  <div>
                    <Label>Theme</Label>
                    <Input
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      placeholder="e.g., Nature, Abstract, Geometric"
                    />
                  </div>
                  <div>
                    <Label>Mood</Label>
                    <Input
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                      placeholder="e.g., Calm, Energetic, Professional"
                    />
                  </div>
                </>
              )}

              <div>
                <Label>Custom Prompt (Optional)</Label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Add additional details or specific requirements..."
                  rows={2}
                />
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !quota?.canUse}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit">
          {generatedImage && (
            <Card>
              <CardHeader>
                <CardTitle>Edit Generated Image</CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEnhanceImage(generatedImage.url)}
                    disabled={isGenerating}
                    variant="outline"
                    size="sm"
                  >
                    Enhance Quality
                  </Button>
                  <Button
                    onClick={() => handleRemoveBackground(generatedImage.url)}
                    disabled={isGenerating}
                    variant="outline"
                    size="sm"
                  >
                    Remove Background
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ImageEditor
                  initialImage={generatedImage.url}
                  onSave={(blob) => {
                    // Handle saving the edited image
                    console.log('Saving edited image:', blob)
                  }}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}