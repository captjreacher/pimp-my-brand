import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VoiceGenerator } from '@/components/ai/VoiceGenerator';
import { VoiceoverIntegration } from '@/components/ai/VoiceoverIntegration';
import { VoiceSynthesisService } from '@/lib/ai/voice-synthesis-service';
import { AIServiceOrchestrator } from '@/lib/ai/service-orchestrator';
import { useVoiceSynthesis } from '@/hooks/use-voice-synthesis';
import { useToast } from '@/hooks/use-toast';
import { 
  Mic, 
  Crown, 
  Zap, 
  Volume2, 
  Users,
  CheckCircle,
  XCircle
} from 'lucide-react';

// Mock configuration - in production this would come from environment variables
const mockConfig = {
  providers: {
    openai: {
      apiKey: process.env.VITE_OPENAI_API_KEY || 'mock-key',
      imageModel: 'dall-e-3' as const,
      ttsModel: 'tts-1' as const,
      voiceOptions: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
    },
    stability: {
      apiKey: process.env.VITE_STABILITY_API_KEY || 'mock-key',
      endpoint: 'https://api.stability.ai'
    },
    elevenlabs: {
      apiKey: process.env.VITE_ELEVENLABS_API_KEY || 'mock-key',
      voiceId: 'default-voice-id'
    }
  },
  limits: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxGenerationTime: 60000, // 60 seconds
    costLimits: {
      free: 100, // $1.00
      tier_1: 1000, // $10.00
      tier_2: 5000 // $50.00
    }
  }
};

const VoiceSynthesisDemo: React.FC = () => {
  const { toast } = useToast();
  const [userId] = useState('demo-user-123'); // Mock user ID
  const [voiceService, setVoiceService] = useState<VoiceSynthesisService | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [generatedVoiceover, setGeneratedVoiceover] = useState<string | null>(null);

  // Mock brand data
  const mockBrands = [
    {
      id: 'brand-1',
      name: 'TechInnovate Solutions',
      tagline: 'Transforming Ideas into Digital Reality',
      description: 'We specialize in cutting-edge software development and digital transformation services.',
      key_points: [
        'Expert team with 10+ years experience',
        'Agile development methodology',
        'End-to-end project management'
      ]
    },
    {
      id: 'brand-2',
      name: 'EcoGreen Consulting',
      tagline: 'Sustainable Solutions for a Better Tomorrow',
      description: 'Environmental consulting firm focused on helping businesses reduce their carbon footprint.',
      key_points: [
        'Certified sustainability experts',
        'Proven track record of 40% emission reductions',
        'Comprehensive environmental audits'
      ]
    }
  ];

  useEffect(() => {
    // Initialize voice service
    const orchestrator = new AIServiceOrchestrator(mockConfig);
    const service = new VoiceSynthesisService(mockConfig);
    setVoiceService(service);
    setSelectedBrand(mockBrands[0]);
  }, []);

  const {
    isGenerating,
    currentAudio,
    isPlaying,
    generationHistory,
    usageStats,
    canGenerate,
    usagePercentage,
    generateBrandRiderVoice,
    generateCustomVoice,
    setCurrentAudio,
    downloadAudio,
    getVoicePresets
  } = useVoiceSynthesis({
    userId,
    voiceService: voiceService!
  });

  const handleGenerateVoice = async () => {
    if (!selectedBrand || !voiceService) return;

    try {
      const result = await generateBrandRiderVoice(selectedBrand.id);
      if (result) {
        setGeneratedVoiceover(result.url);
        toast({
          title: "Voice Generated!",
          description: "Your brand rider voiceover is ready to play.",
        });
      }
    } catch (error) {
      console.error('Failed to generate voice:', error);
    }
  };

  const subscriptionFeatures = [
    {
      tier: 'Free',
      icon: <Users className="h-5 w-5" />,
      features: [
        { text: 'Basic image editing', available: true },
        { text: 'Template selection', available: true },
        { text: 'Voice synthesis', available: false },
        { text: 'Video avatars', available: false }
      ],
      price: '$0/month'
    },
    {
      tier: 'Tier 1',
      icon: <Zap className="h-5 w-5" />,
      features: [
        { text: 'AI image generation', available: true },
        { text: 'Voice synthesis (20/month)', available: true },
        { text: 'Advanced editing tools', available: true },
        { text: 'Video avatars', available: false }
      ],
      price: '$19/month',
      highlight: true
    },
    {
      tier: 'Tier 2',
      icon: <Crown className="h-5 w-5" />,
      features: [
        { text: 'Unlimited AI generation', available: true },
        { text: 'Voice synthesis (100/month)', available: true },
        { text: 'Video avatar creation', available: true },
        { text: 'Priority support', available: true }
      ],
      price: '$49/month'
    }
  ];

  if (!voiceService) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading voice synthesis service...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
          <Mic className="h-8 w-8 text-primary" />
          AI Voice Synthesis
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Transform your brand content into professional voiceovers with AI-powered speech synthesis.
          Available for Tier 1+ subscribers.
        </p>
      </div>

      {/* Subscription Tiers */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Tiers & Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {subscriptionFeatures.map((tier) => (
              <Card key={tier.tier} className={tier.highlight ? 'border-primary shadow-lg' : ''}>
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {tier.icon}
                    <CardTitle className="text-lg">{tier.tier}</CardTitle>
                  </div>
                  <div className="text-2xl font-bold">{tier.price}</div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        {feature.available ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={feature.available ? '' : 'text-muted-foreground'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Demo Interface */}
      <Tabs defaultValue="generator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generator">Voice Generator</TabsTrigger>
          <TabsTrigger value="integration">Brand Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-6">
          <VoiceGenerator
            voiceService={voiceService}
            userId={userId}
            onVoiceGenerated={(result) => {
              setGeneratedVoiceover(result.url);
              setCurrentAudio(result.url);
            }}
          />
        </TabsContent>

        <TabsContent value="integration" className="space-y-6">
          {/* Brand Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Brand for Voiceover</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {mockBrands.map((brand) => (
                  <Card 
                    key={brand.id}
                    className={`cursor-pointer transition-colors ${
                      selectedBrand?.id === brand.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedBrand(brand)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{brand.name}</h3>
                      <p className="text-sm text-muted-foreground italic">{brand.tagline}</p>
                      <p className="text-sm mt-2">{brand.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Voiceover Integration */}
          {selectedBrand && (
            <VoiceoverIntegration
              voiceoverUrl={generatedVoiceover}
              brandRiderContent={selectedBrand}
              onGenerateVoice={handleGenerateVoice}
              onVoiceToggle={(enabled) => {
                console.log('Voice toggle:', enabled);
              }}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Demo Notice */}
      <Card className="bg-muted/50">
        <CardContent className="p-6 text-center">
          <Volume2 className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Demo Mode</h3>
          <p className="text-muted-foreground">
            This is a demonstration of the voice synthesis system. In production, this feature requires 
            a Tier 1+ subscription and valid API keys for OpenAI and ElevenLabs services.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceSynthesisDemo;