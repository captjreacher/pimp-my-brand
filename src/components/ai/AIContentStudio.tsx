import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AIImageGenerator } from './AIImageGenerator'
import { UsageTracker } from './UsageTracker'
import { GeneratedImage } from '@/lib/ai/image-generation-service'
import { SubscriptionTier } from '@/lib/ai/feature-gate'
import { useToast } from '@/hooks/use-toast'
import { 
  Wand2, 
  BarChart3, 
  Crown, 
  Zap,
  Image as ImageIcon,
  Mic,
  Video,
  Sparkles
} from 'lucide-react'

interface AIContentStudioProps {
  userId: string
  subscriptionTier: SubscriptionTier
  onUpgrade?: () => void
  className?: string
}

export const AIContentStudio: React.FC<AIContentStudioProps> = ({
  userId,
  subscriptionTier,
  onUpgrade,
  className
}) => {
  const [activeTab, setActiveTab] = useState('generate')
  const [recentImages, setRecentImages] = useState<GeneratedImage[]>([])
  const { toast } = useToast()

  const handleImageGenerated = (image: GeneratedImage) => {
    setRecentImages(prev => [image, ...prev.slice(0, 9)]) // Keep last 10 images
    toast({
      title: "Image Generated Successfully",
      description: "Your AI-generated image is ready!"
    })
  }

  const getFeatureAvailability = () => {
    return {
      imageGeneration: true, // Available for all tiers
      voiceSynthesis: subscriptionTier !== SubscriptionTier.FREE,
      videoGeneration: subscriptionTier === SubscriptionTier.TIER_2,
      advancedEditing: true // Available for all tiers with limits (includes background removal)
    }
  }

  const features = getFeatureAvailability()

  const getTierBadge = () => {
    switch (subscriptionTier) {
      case SubscriptionTier.FREE:
        return <Badge variant="outline">Free Tier</Badge>
      case SubscriptionTier.TIER_1:
        return <Badge className="bg-blue-500">Pro Tier</Badge>
      case SubscriptionTier.TIER_2:
        return <Badge className="bg-purple-500">Premium Tier</Badge>
      default:
        return <Badge variant="outline">Free Tier</Badge>
    }
  }

  return (
    <div className={`ai-content-studio ${className}`}>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-purple-600" />
              AI Content Studio
            </h1>
            <p className="text-gray-600 mt-1">
              Create stunning visuals and content with AI-powered tools
            </p>
          </div>
          <div className="flex items-center gap-3">
            {getTierBadge()}
            {subscriptionTier !== SubscriptionTier.TIER_2 && onUpgrade && (
              <Button onClick={onUpgrade} className="flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Upgrade
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Gallery
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Usage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          {/* Feature Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className={features.imageGeneration ? '' : 'opacity-50'}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Image Generation</h3>
                    <p className="text-sm text-gray-600">
                      {features.imageGeneration ? 'Available' : 'Upgrade Required'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={features.voiceSynthesis ? '' : 'opacity-50'}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Mic className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Voice Synthesis</h3>
                    <p className="text-sm text-gray-600">
                      {features.voiceSynthesis ? 'Available' : 'Pro Tier Required'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={features.videoGeneration ? '' : 'opacity-50'}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Video className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Video Generation</h3>
                    <p className="text-sm text-gray-600">
                      {features.videoGeneration ? 'Available' : 'Premium Tier Required'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Image Generator */}
          <AIImageGenerator
            userId={userId}
            onImageGenerated={handleImageGenerated}
          />

          {/* Coming Soon Features */}
          {!features.voiceSynthesis && (
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="p-6 text-center">
                <Mic className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Voice Synthesis</h3>
                <p className="text-gray-600 mb-4">
                  Generate AI voiceovers for your brand content with Pro tier
                </p>
                {onUpgrade && (
                  <Button onClick={onUpgrade} variant="outline">
                    <Zap className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {!features.videoGeneration && (
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="p-6 text-center">
                <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Video Generation</h3>
                <p className="text-gray-600 mb-4">
                  Create AI-powered video presentations with Premium tier
                </p>
                {onUpgrade && (
                  <Button onClick={onUpgrade} variant="outline">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="gallery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Generations</CardTitle>
            </CardHeader>
            <CardContent>
              {recentImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {recentImages.map((image) => (
                    <div key={image.id} className="group relative">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={image.url}
                          alt={image.prompt}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-medium truncate">{image.options.format}</p>
                        <p className="text-xs text-gray-600 truncate">{image.prompt}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {image.provider}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No images yet</h3>
                  <p className="text-gray-600 mb-4">
                    Generate your first AI image to see it here
                  </p>
                  <Button onClick={() => setActiveTab('generate')}>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Start Creating
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <UsageTracker userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}