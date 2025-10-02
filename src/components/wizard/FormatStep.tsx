import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, User, Shield, Zap, Star, Sparkles, Crown, Briefcase, Music, Heart, Camera, Palette, Lock } from "lucide-react";
import { SubscriptionTier } from "@/lib/subscription-tiers";
import { useSubscription } from "@/contexts/SubscriptionContext";

interface FormatStepProps {
  onComplete: (format: string) => void;
}

const formats = [
  { 
    id: "ufc", 
    name: "UFC Announcer", 
    icon: Trophy,
    tier: "free" as SubscriptionTier,
    desc: "High-energy, punchy, ring-side style",
    preview: {
      font: "font-black uppercase tracking-wider",
      bg: "bg-gradient-to-br from-red-950 to-black",
      text: "text-red-500",
      sample: "IN THE BLACK CORNER..."
    }
  },
  { 
    id: "team", 
    name: "Team Captain", 
    icon: Users,
    tier: "free" as SubscriptionTier,
    desc: "TV roster card, leadership tone",
    preview: {
      font: "font-bold",
      bg: "bg-gradient-to-br from-blue-950 to-slate-900",
      text: "text-blue-400",
      sample: "#CAPTAIN • LEADERSHIP"
    }
  },
  { 
    id: "solo", 
    name: "Solo Athlete", 
    icon: User,
    tier: "free" as SubscriptionTier,
    desc: "Individual stats, commentator style",
    preview: {
      font: "font-semibold",
      bg: "bg-gradient-to-br from-purple-950 to-slate-900",
      text: "text-purple-400",
      sample: "STATS • PERFORMANCE • WINS"
    }
  },
  { 
    id: "military", 
    name: "Military", 
    icon: Shield,
    tier: "free" as SubscriptionTier,
    desc: "Brevity, precision, professional",
    preview: {
      font: "font-mono uppercase tracking-widest text-xs",
      bg: "bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-green-900 via-slate-800 to-green-950",
      text: "text-green-400",
      sample: "RANK • UNIT • MISSION"
    }
  },
  { 
    id: "nfl", 
    name: "NFL Star", 
    icon: Zap,
    tier: "pro" as SubscriptionTier,
    desc: "Playbook metaphors, broadcast gloss",
    preview: {
      font: "font-black italic",
      bg: "bg-gradient-to-br from-orange-950 to-slate-900",
      text: "text-orange-400",
      sample: "1ST DOWN • GAME TIME"
    }
  },
  { 
    id: "influencer", 
    name: "Influencer", 
    icon: Star,
    tier: "pro" as SubscriptionTier,
    desc: "Social proof, celebrity tone",
    preview: {
      font: "font-bold",
      bg: "bg-gradient-to-br from-pink-900 via-purple-900 to-blue-900",
      text: "text-pink-400",
      sample: "✨ VERIFIED • COLLAB ✨"
    }
  },
  { 
    id: "executive", 
    name: "Executive", 
    icon: Briefcase,
    tier: "pro" as SubscriptionTier,
    desc: "Corporate leadership, C-suite authority",
    preview: {
      font: "font-serif font-semibold",
      bg: "bg-gradient-to-br from-slate-900 to-slate-950",
      text: "text-slate-200",
      sample: "EXPERIENCE • LEADERSHIP"
    }
  },
  { 
    id: "artist", 
    name: "Artist / Musician", 
    icon: Music,
    tier: "elite" as SubscriptionTier,
    desc: "Creative portfolio, press kit style",
    preview: {
      font: "font-bold tracking-wide",
      bg: "bg-gradient-to-br from-violet-950 via-fuchsia-950 to-pink-950",
      text: "text-fuchsia-300",
      sample: "ALBUM • TOUR • PRESS"
    }
  },
  { 
    id: "humanitarian", 
    name: "Humanitarian", 
    icon: Heart,
    tier: "elite" as SubscriptionTier,
    desc: "Mission-driven, impact-focused",
    preview: {
      font: "font-medium",
      bg: "bg-gradient-to-br from-teal-950 to-cyan-950",
      text: "text-teal-300",
      sample: "IMPACT • MISSION • CHANGE"
    }
  },
  { 
    id: "creator", 
    name: "Content Creator", 
    icon: Camera,
    tier: "elite" as SubscriptionTier,
    desc: "Platform stats, brand partnerships",
    preview: {
      font: "font-bold",
      bg: "bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950",
      text: "text-purple-300",
      sample: "CREATOR • BRAND • REACH"
    }
  },
  { 
    id: "fashion", 
    name: "Fashion / Model", 
    icon: Palette,
    tier: "elite" as SubscriptionTier,
    desc: "Lookbook style, editorial tone",
    preview: {
      font: "font-light italic text-lg",
      bg: "bg-gradient-to-br from-rose-950 to-amber-950",
      text: "text-rose-200",
      sample: "RUNWAY • EDITORIAL • STYLE"
    }
  },
  { 
    id: "custom", 
    name: "Custom", 
    icon: Sparkles,
    tier: "free" as SubscriptionTier,
    desc: "Adaptable professional style",
    preview: {
      font: "font-semibold",
      bg: "bg-gradient-to-br from-slate-800 to-slate-900",
      text: "text-slate-300",
      sample: "Professional • Adaptable"
    }
  },
];

export function FormatStep({ onComplete }: FormatStepProps) {
  const [selected, setSelected] = useState<string>("custom");
  const { tier } = useSubscription();

  const handleSelect = (formatId: string, requiredTier: SubscriptionTier) => {
    const tierOrder = { free: 0, pro: 1, elite: 2 };
    const hasAccess = tierOrder[tier] >= tierOrder[requiredTier];
    
    if (hasAccess) {
      setSelected(formatId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-heading text-3xl mb-2">Choose Your Format</h2>
        <p className="text-muted">
          Select a presentation style for your Brand Rider
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {formats.map((format) => {
          const Icon = format.icon;
          const tierOrder = { free: 0, pro: 1, elite: 2 };
          const hasAccess = tierOrder[tier] >= tierOrder[format.tier];
          const isPremium = format.tier !== "free";
          
          return (
            <button
              key={format.id}
              onClick={() => handleSelect(format.id, format.tier)}
              disabled={!hasAccess}
              className={`group overflow-hidden rounded-xl border-2 transition-all ${
                selected === format.id
                  ? "border-primary shadow-glow"
                  : "border-border hover:border-primary/50"
              } ${!hasAccess ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {/* Preview Banner */}
              <div className={`${format.preview.bg} p-4 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20" />
                {!hasAccess && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
                    <div className="text-center">
                      <Lock className="w-8 h-8 text-white mx-auto mb-2" />
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        {format.tier === "pro" ? "Pro" : "Elite"} Only
                      </Badge>
                    </div>
                  </div>
                )}
                <p className={`${format.preview.font} ${format.preview.text} relative z-10 text-center`}>
                  {format.preview.sample}
                </p>
              </div>
              
              {/* Content */}
              <div className={`p-4 transition-colors ${
                selected === format.id ? "bg-primary/10" : "bg-surface/50"
              }`}>
                <div className="flex items-start gap-3">
                  <Icon className={`w-6 h-6 flex-shrink-0 ${selected === format.id ? "text-primary" : "text-muted"}`} />
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading font-semibold">{format.name}</h3>
                      {isPremium && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            format.tier === "elite" 
                              ? "border-amber-500/50 text-amber-400" 
                              : "border-blue-500/50 text-blue-400"
                          }`}
                        >
                          {format.tier === "pro" ? <Crown className="w-3 h-3" /> : "⭐"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted">{format.desc}</p>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Button onClick={() => onComplete(selected)} className="w-full" size="lg">
        Continue with {formats.find((f) => f.id === selected)?.name}
      </Button>
    </div>
  );
}
