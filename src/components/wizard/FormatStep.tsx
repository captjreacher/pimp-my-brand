import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trophy, Users, User, Shield, Zap, Star, Sparkles } from "lucide-react";

interface FormatStepProps {
  onComplete: (format: string) => void;
}

const formats = [
  { id: "ufc", name: "UFC Announcer", icon: Trophy, desc: "High-energy, punchy, ring-side style" },
  { id: "team", name: "Team Captain", icon: Users, desc: "TV roster card, leadership tone" },
  { id: "solo", name: "Solo Athlete", icon: User, desc: "Individual stats, commentator style" },
  { id: "military", name: "Military", icon: Shield, desc: "Brevity, precision, professional" },
  { id: "nfl", name: "NFL Star", icon: Zap, desc: "Playbook metaphors, broadcast gloss" },
  { id: "influencer", name: "Influencer", icon: Star, desc: "Social proof, celebrity tone" },
  { id: "custom", name: "Custom", icon: Sparkles, desc: "Adaptable professional style" },
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
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                selected === format.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-surface/50 hover:border-primary/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-6 h-6 ${selected === format.id ? "text-primary" : "text-muted"}`} />
                <div>
                  <h3 className="font-heading font-semibold mb-1">{format.name}</h3>
                  <p className="text-sm text-muted">{format.desc}</p>
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
