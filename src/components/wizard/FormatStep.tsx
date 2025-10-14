import { useState, useEffect } from "react";
import { AccessibleButton } from "@/components/ui/accessible-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Trophy, Users, User, Shield, Zap, Star, Sparkles, Crown, Briefcase, Music, Heart, Camera, Palette, Lock, Eye, ArrowRight } from "lucide-react";
import { SubscriptionTier } from "@/lib/subscription-tiers";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PresentationFormat, getFormatOverlay, FormatTransformer } from "@/lib/formats";
import { useScreenReader, useKeyboardNavigation } from "@/hooks/use-accessibility";

interface FormatStepProps {
  onComplete: (format: string) => void;
}

const formatConfigs = [
  { 
    id: "ufc" as PresentationFormat, 
    icon: Trophy,
    tier: "free" as SubscriptionTier,
    preview: {
      font: "font-black uppercase tracking-wider",
      bg: "bg-gradient-to-br from-red-950 to-black",
      text: "text-red-500",
      sample: "IN THE BLACK CORNER..."
    }
  },
  { 
    id: "team" as PresentationFormat, 
    icon: Users,
    tier: "free" as SubscriptionTier,
    preview: {
      font: "font-bold",
      bg: "bg-gradient-to-br from-blue-950 to-slate-900",
      text: "text-blue-400",
      sample: "#CAPTAIN • LEADERSHIP"
    }
  },
  { 
    id: "solo" as PresentationFormat, 
    icon: User,
    tier: "free" as SubscriptionTier,
    preview: {
      font: "font-semibold",
      bg: "bg-gradient-to-br from-purple-950 to-slate-900",
      text: "text-purple-400",
      sample: "STATS • PERFORMANCE • WINS"
    }
  },
  { 
    id: "military" as PresentationFormat, 
    icon: Shield,
    tier: "free" as SubscriptionTier,
    preview: {
      font: "font-mono uppercase tracking-widest text-xs",
      bg: "bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-green-900 via-slate-800 to-green-950",
      text: "text-green-400",
      sample: "RANK • UNIT • MISSION"
    }
  },
  { 
    id: "nfl" as PresentationFormat, 
    icon: Zap,
    tier: "pro" as SubscriptionTier,
    preview: {
      font: "font-black italic",
      bg: "bg-gradient-to-br from-orange-950 to-slate-900",
      text: "text-orange-400",
      sample: "1ST DOWN • GAME TIME"
    }
  },
  { 
    id: "influencer" as PresentationFormat, 
    icon: Star,
    tier: "pro" as SubscriptionTier,
    preview: {
      font: "font-bold",
      bg: "bg-gradient-to-br from-pink-900 via-purple-900 to-blue-900",
      text: "text-pink-400",
      sample: "✨ VERIFIED • COLLAB ✨"
    }
  },
  { 
    id: "executive" as PresentationFormat, 
    icon: Briefcase,
    tier: "pro" as SubscriptionTier,
    preview: {
      font: "font-serif font-semibold",
      bg: "bg-gradient-to-br from-slate-900 to-slate-950",
      text: "text-slate-200",
      sample: "EXPERIENCE • LEADERSHIP"
    }
  },
  { 
    id: "artist" as PresentationFormat, 
    icon: Music,
    tier: "elite" as SubscriptionTier,
    preview: {
      font: "font-bold tracking-wide",
      bg: "bg-gradient-to-br from-violet-950 via-fuchsia-950 to-pink-950",
      text: "text-fuchsia-300",
      sample: "ALBUM • TOUR • PRESS"
    }
  },
  { 
    id: "humanitarian" as PresentationFormat, 
    icon: Heart,
    tier: "elite" as SubscriptionTier,
    preview: {
      font: "font-medium",
      bg: "bg-gradient-to-br from-teal-950 to-cyan-950",
      text: "text-teal-300",
      sample: "IMPACT • MISSION • CHANGE"
    }
  },
  { 
    id: "creator" as PresentationFormat, 
    icon: Camera,
    tier: "elite" as SubscriptionTier,
    preview: {
      font: "font-bold",
      bg: "bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950",
      text: "text-purple-300",
      sample: "CREATOR • BRAND • REACH"
    }
  },
  { 
    id: "fashion" as PresentationFormat, 
    icon: Palette,
    tier: "elite" as SubscriptionTier,
    preview: {
      font: "font-light italic text-lg",
      bg: "bg-gradient-to-br from-rose-950 to-amber-950",
      text: "text-rose-200",
      sample: "RUNWAY • EDITORIAL • STYLE"
    }
  },
  { 
    id: "custom" as PresentationFormat, 
    icon: Sparkles,
    tier: "free" as SubscriptionTier,
    preview: {
      font: "font-semibold",
      bg: "bg-gradient-to-br from-slate-800 to-slate-900",
      text: "text-slate-300",
      sample: "Professional • Adaptable"
    }
  },
];

// Enhanced preview dialog component with live updates
function FormatPreviewDialog({ format, onFormatChange }: { 
  format: PresentationFormat;
  onFormatChange?: (format: PresentationFormat) => void;
}) {
  const overlay = getFormatOverlay(format);
  const [livePreviewText, setLivePreviewText] = useState("Led a team of 15 developers on multiple successful projects, increasing productivity by 30% and delivering innovative solutions.");
  const [transformedPreview, setTransformedPreview] = useState("");

  // Update live preview when format or text changes
  useEffect(() => {
    const transformed = FormatTransformer.getPreviewTransformation(livePreviewText, format);
    setTransformedPreview(transformed);
  }, [format, livePreviewText]);

  const sampleTexts = [
    "Led a team of 15 developers on multiple successful projects, increasing productivity by 30% and delivering innovative solutions.",
    "Managed a $2M budget while overseeing critical infrastructure improvements across three departments.",
    "Developed innovative marketing strategies that increased brand awareness by 45% and drove record sales.",
    "Collaborated with cross-functional teams to deliver high-impact solutions under tight deadlines."
  ];

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {overlay.name} Format Preview
          <Badge variant="outline" className="text-xs">
            Live Preview
          </Badge>
        </DialogTitle>
        <DialogDescription className="text-base">
          {overlay.description}
        </DialogDescription>
      </DialogHeader>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="live">Live Preview</TabsTrigger>
          <TabsTrigger value="style">Style Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Format Characteristics
                </h4>
                <div className="grid gap-3">
                  {overlay.styleModifiers.map((modifier, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Badge variant="secondary" className="capitalize shrink-0">
                        {modifier.target}
                      </Badge>
                      <span className="text-sm">{modifier.transformation}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <div className="grid gap-4">
            {overlay.examples.map((example, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Before</Badge>
                      </div>
                      <p className="text-sm bg-muted/30 p-3 rounded-md">{example.before}</p>
                    </div>
                    
                    <div className="flex justify-center">
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-xs">After ({overlay.name})</Badge>
                      </div>
                      <p className="text-sm bg-primary/10 p-3 rounded-md font-medium">{example.after}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="live" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-3">Try Different Sample Texts</h4>
                  <div className="grid gap-2">
                    {sampleTexts.map((text, index) => (
                      <AccessibleButton
                        key={index}
                        variant={livePreviewText === text ? "default" : "outline"}
                        size="sm"
                        className="justify-start text-left h-auto p-3"
                        onClick={() => setLivePreviewText(text)}
                        aria-label={`Use sample text: ${text.substring(0, 50)}...`}
                      >
                        <span className="text-xs line-clamp-2">{text}</span>
                      </AccessibleButton>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Original Text</Badge>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-md">
                      <p className="text-sm">{livePreviewText}</p>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs">
                        {overlay.name} Transformation
                      </Badge>
                    </div>
                    <div className="bg-primary/10 p-4 rounded-md border-l-4 border-primary">
                      <p className="text-sm font-medium">{transformedPreview}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="style" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Key Style Elements</h4>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="font-medium">Tone</span>
                      <Badge variant="secondary">
                        {overlay.styleModifiers.find(m => m.target === 'tone')?.transformation.split(' ')[2] || 'Professional'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="font-medium">Language Style</span>
                      <Badge variant="secondary">
                        {format === 'ufc' ? 'High-energy' : 
                         format === 'military' ? 'Precise' :
                         format === 'influencer' ? 'Trendy' :
                         format === 'executive' ? 'Authoritative' : 'Professional'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="font-medium">Structure</span>
                      <Badge variant="secondary">
                        {format === 'ufc' ? 'Punchy' : 
                         format === 'military' ? 'Hierarchical' :
                         format === 'team' ? 'Stats-focused' : 'Structured'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-3">Best Used For</h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    {format === 'ufc' && (
                      <ul className="list-disc list-inside space-y-1">
                        <li>High-energy presentations and pitches</li>
                        <li>Competitive industries and sales roles</li>
                        <li>Personal branding with bold personality</li>
                      </ul>
                    )}
                    {format === 'military' && (
                      <ul className="list-disc list-inside space-y-1">
                        <li>Leadership and management positions</li>
                        <li>Project management and operations</li>
                        <li>Government and defense sectors</li>
                      </ul>
                    )}
                    {format === 'team' && (
                      <ul className="list-disc list-inside space-y-1">
                        <li>Team leadership and collaboration roles</li>
                        <li>Sports and athletic backgrounds</li>
                        <li>Group-oriented achievements</li>
                      </ul>
                    )}
                    {format === 'executive' && (
                      <ul className="list-disc list-inside space-y-1">
                        <li>C-suite and senior leadership roles</li>
                        <li>Corporate and business development</li>
                        <li>Strategic and financial positions</li>
                      </ul>
                    )}
                    {format === 'influencer' && (
                      <ul className="list-disc list-inside space-y-1">
                        <li>Social media and content creation</li>
                        <li>Marketing and brand partnerships</li>
                        <li>Creative and lifestyle industries</li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DialogContent>
  );
}

export function FormatStep({ onComplete }: FormatStepProps) {
  const [selected, setSelected] = useState<PresentationFormat>("custom");
  const [previewFormat, setPreviewFormat] = useState<PresentationFormat>("custom");
  const { tier } = useSubscription();
  const { announce } = useScreenReader();

  const handleSelect = (formatId: PresentationFormat, requiredTier: SubscriptionTier) => {
    const tierOrder = { free: 0, pro: 1, elite: 2 };
    const hasAccess = tierOrder[tier] >= tierOrder[requiredTier];
    
    if (hasAccess) {
      setSelected(formatId);
      setPreviewFormat(formatId);
      const overlay = getFormatOverlay(formatId);
      announce(`Selected ${overlay.name} format`, 'polite');
    } else {
      announce(`${getFormatOverlay(formatId).name} format requires ${requiredTier} subscription`, 'assertive');
    }
  };

  const handlePreviewFormat = (formatId: PresentationFormat) => {
    setPreviewFormat(formatId);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-heading text-3xl mb-2">Choose Your Format</h2>
        <p className="text-muted">
          Select a presentation style for your Brand Rider
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Format Selection Cards */}
        <div className="lg:col-span-2">
          <fieldset>
            <legend className="sr-only">Choose a presentation format</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="radiogroup" aria-label="Presentation format options">
              {formatConfigs.map((formatConfig) => {
                const Icon = formatConfig.icon;
                const overlay = getFormatOverlay(formatConfig.id);
                const tierOrder = { free: 0, pro: 1, elite: 2 };
                const hasAccess = tierOrder[tier] >= tierOrder[formatConfig.tier];
                const isPremium = formatConfig.tier !== "free";
                const isSelected = selected === formatConfig.id;
                
                return (
                  <div key={formatConfig.id} className="relative">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-describedby={`format-${formatConfig.id}-desc`}
                      onClick={() => handleSelect(formatConfig.id, formatConfig.tier)}
                      onMouseEnter={() => hasAccess && handlePreviewFormat(formatConfig.id)}
                      onFocus={() => hasAccess && handlePreviewFormat(formatConfig.id)}
                      disabled={!hasAccess}
                      className={`w-full group overflow-hidden rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                        isSelected
                          ? "border-primary shadow-glow"
                          : "border-border hover:border-primary/50"
                      } ${!hasAccess ? "opacity-60 cursor-not-allowed" : ""}`}
                      aria-label={`${overlay.name} format${!hasAccess ? ` (requires ${formatConfig.tier} subscription)` : ''}${isSelected ? ' (selected)' : ''}`}
                    >
                      {/* Preview Banner */}
                      <div className={`${formatConfig.preview.bg} p-4 relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-black/20" />
                        {!hasAccess && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
                            <div className="text-center">
                              <Lock className="w-8 h-8 text-white mx-auto mb-2" aria-hidden="true" />
                              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                                {formatConfig.tier === "pro" ? "Pro" : "Elite"} Only
                              </Badge>
                            </div>
                          </div>
                        )}
                        <p className={`${formatConfig.preview.font} ${formatConfig.preview.text} relative z-10 text-center`}>
                          {formatConfig.preview.sample}
                        </p>
                      </div>
                      
                      {/* Content */}
                      <div className={`p-4 transition-colors ${
                        isSelected ? "bg-primary/10" : "bg-surface/50"
                      }`}>
                        <div className="flex items-start gap-3">
                          <Icon className={`w-6 h-6 flex-shrink-0 ${isSelected ? "text-primary" : "text-muted"}`} aria-hidden="true" />
                          <div className="text-left flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-heading font-semibold">{overlay.name}</h3>
                              {isPremium && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    formatConfig.tier === "elite" 
                                      ? "border-amber-500/50 text-amber-400" 
                                      : "border-blue-500/50 text-blue-400"
                                  }`}
                                >
                                  {formatConfig.tier === "pro" ? <Crown className="w-3 h-3" aria-hidden="true" /> : "⭐"}
                                </Badge>
                              )}
                            </div>
                            <p id={`format-${formatConfig.id}-desc`} className="text-sm text-muted">{overlay.description}</p>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Preview Button */}
                    {hasAccess && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <AccessibleButton
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2 z-30 bg-black/50 border-white/20 text-white hover:bg-black/70"
                            onClick={() => handlePreviewFormat(formatConfig.id)}
                            aria-label={`Preview ${overlay.name} format in detail`}
                          >
                            <Eye className="w-4 h-4" aria-hidden="true" />
                          </AccessibleButton>
                        </DialogTrigger>
                        <FormatPreviewDialog 
                          format={previewFormat} 
                          onFormatChange={handlePreviewFormat}
                        />
                      </Dialog>
                    )}
                  </div>
                );
              })}
            </div>
          </fieldset>
        </div>

        {/* Live Preview Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <h3 className="font-semibold">Live Preview</h3>
                  <Badge variant="outline" className="text-xs">
                    {getFormatOverlay(previewFormat).name}
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Original
                    </span>
                    <p className="text-sm mt-1 p-2 bg-muted/30 rounded text-muted-foreground">
                      Led a successful team of developers, delivering innovative solutions and exceeding project goals.
                    </p>
                  </div>
                  
                  <div className="flex justify-center">
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                  
                  <div>
                    <span className="text-xs font-medium text-primary uppercase tracking-wide">
                      {getFormatOverlay(previewFormat).name} Style
                    </span>
                    <p className="text-sm mt-1 p-2 bg-primary/10 rounded font-medium">
                      {FormatTransformer.getPreviewTransformation(
                        "Led a successful team of developers, delivering innovative solutions and exceeding project goals.",
                        previewFormat
                      )}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Key Characteristics</h4>
                  <div className="space-y-1">
                    {getFormatOverlay(previewFormat).styleModifiers.slice(0, 2).map((modifier, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary/60" />
                        <span className="text-xs text-muted-foreground capitalize">
                          {modifier.target}: {modifier.transformation.split(' ').slice(0, 4).join(' ')}...
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AccessibleButton 
        onClick={() => onComplete(selected)} 
        className="w-full" 
        size="lg"
        aria-describedby="format-selection-help"
      >
        Continue with {getFormatOverlay(selected).name}
      </AccessibleButton>
      
      <p id="format-selection-help" className="text-sm text-muted-foreground text-center">
        This format will be applied to your brand materials and can be changed later
      </p>
    </div>
  );
}
