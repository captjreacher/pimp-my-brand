import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trophy, Users, User, Shield, Zap, Star, Sparkles } from "lucide-react";

interface FormatStepProps {
  onComplete: (format: string) => void;
}

const formats = [
  { 
    id: "ufc", 
    name: "UFC Announcer", 
    icon: Trophy, 
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
    desc: "Social proof, celebrity tone",
    preview: {
      font: "font-bold",
      bg: "bg-gradient-to-br from-pink-900 via-purple-900 to-blue-900",
      text: "text-pink-400",
      sample: "✨ VERIFIED • COLLAB ✨"
    }
  },
  { 
    id: "custom", 
    name: "Custom", 
    icon: Sparkles, 
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
          return (
            <button
              key={format.id}
              onClick={() => setSelected(format.id)}
              className={`group overflow-hidden rounded-xl border-2 transition-all ${
                selected === format.id
                  ? "border-primary shadow-glow"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {/* Preview Banner */}
              <div className={`${format.preview.bg} p-4 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20" />
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
                  <div className="text-left">
                    <h3 className="font-heading font-semibold mb-1">{format.name}</h3>
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
