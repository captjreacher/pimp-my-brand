import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Shirt, Shield, ArrowRight } from "lucide-react";

interface Loadout {
  id: string;
  templateId: string;
  name: string;
  role: string;
  uniform: string;
  tier: "free" | "pro" | "elite";
  fictionalAvatar: string;
  personalizedAvatar: string;
  description: string;
  palette: string[];
}

const LOADOUTS: Loadout[] = [
  {
    id: "ufc",
    templateId: "ufc",
    name: "Octagon Champion",
    role: "Combat Sports",
    uniform: "Fight Night Classic",
    tier: "free",
    fictionalAvatar: "https://images.unsplash.com/photo-1559114367-ff25e89adb7d?auto=format&fit=crop&w=720&q=80",
    personalizedAvatar: "https://images.unsplash.com/photo-1549451371-64aa98a6f660?auto=format&fit=crop&w=720&q=80",
    description: "Aggressive striker narrative with crimson and black walkout visuals.",
    palette: ["#EF4444", "#FCD34D", "#1F2937"],
  },
  {
    id: "team",
    templateId: "team",
    name: "Club Captain",
    role: "Team Sports",
    uniform: "Home Tip-Off",
    tier: "free",
    fictionalAvatar: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=720&q=80",
    personalizedAvatar: "https://images.unsplash.com/photo-1454165205744-3b78555e5572?auto=format&fit=crop&w=720&q=80",
    description: "Locker-room leadership highlight with modern blue and gold styling.",
    palette: ["#3B82F6", "#FBBF24", "#1F2937"],
  },
  {
    id: "nfl",
    templateId: "nfl",
    name: "Primetime Receiver",
    role: "Pro Football",
    uniform: "Color Rush",
    tier: "pro",
    fictionalAvatar: "https://images.unsplash.com/photo-1471295253337-3ceaaedca402?auto=format&fit=crop&w=720&q=80",
    personalizedAvatar: "https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=720&q=80",
    description: "High-voltage stadium entrance with animated tunnel lighting.",
    palette: ["#F97316", "#1F2937", "#3B82F6"],
  },
  {
    id: "executive",
    templateId: "executive",
    name: "Boardroom Visionary",
    role: "Corporate",
    uniform: "Boardroom Foundation",
    tier: "free",
    fictionalAvatar: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=720&q=80",
    personalizedAvatar: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=720&q=80",
    description: "Executive leadership stance with slate and cobalt palette.",
    palette: ["#1E293B", "#3B82F6", "#CBD5F5"],
  },
];

const PlayerProfile = () => {
  const navigate = useNavigate();
  const [activeLoadoutId, setActiveLoadoutId] = useState<string>(LOADOUTS[0].id);
  const [avatarMode, setAvatarMode] = useState<"fictional" | "personal">("fictional");

  const activeLoadout = LOADOUTS.find((entry) => entry.id === activeLoadoutId) ?? LOADOUTS[0];
  const avatarUrl = avatarMode === "personal" ? activeLoadout.personalizedAvatar : activeLoadout.fictionalAvatar;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/60 backdrop-blur">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-widest">Player Profile Locker</span>
              </div>
              <div>
                <h1 className="font-heading text-3xl md:text-4xl font-bold">Control your on-stage persona</h1>
                <p className="text-muted-foreground max-w-2xl">
                  Choose the wardrobe, stance, and face mapping that appear across every generated template. Sync updates with your Shop purchases and profile wardrobe tiers.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate("/dashboard")}>Back to dashboard</Button>
              <Button asChild>
                <Link to="/shop">
                  <Shirt className="h-4 w-4 mr-2" />
                  Browse uniforms
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">
        <Tabs defaultValue="avatars" className="space-y-8">
          <TabsList className="bg-surface/80 p-2">
            <TabsTrigger value="avatars">Avatar & Wardrobe</TabsTrigger>
            <TabsTrigger value="tiers">Tier Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="avatars" className="space-y-8">
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <Card className="border-border/70 bg-surface/70">
                <CardHeader className="space-y-1">
                  <CardTitle className="flex items-center justify-between">
                    <span>{activeLoadout.name}</span>
                    <Badge variant={activeLoadout.tier === "free" ? "secondary" : "outline"} className="gap-1 uppercase">
                      {activeLoadout.tier === "pro" && <Sparkles className="h-3 w-3" />}
                      {activeLoadout.tier === "elite" && <Shield className="h-3 w-3" />}
                      {activeLoadout.tier.toUpperCase()}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{activeLoadout.description}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-surface/80">
                    <img src={avatarUrl} alt={activeLoadout.name} className="h-[420px] w-full object-cover" />
                    {avatarMode === "personal" && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-6 py-4 text-xs uppercase tracking-wide text-primary-foreground">
                        Your uploaded face replaces the platform avatar here. Update it in Profile → Avatar & Media.
                      </div>
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Button
                      variant={avatarMode === "fictional" ? "default" : "outline"}
                      onClick={() => setAvatarMode("fictional")}
                    >
                      Keep fictional avatar
                    </Button>
                    <Button
                      variant={avatarMode === "personal" ? "default" : "outline"}
                      onClick={() => setAvatarMode("personal")}
                    >
                      Map my face
                    </Button>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">Uniform in use:</span>
                      <Badge variant="secondary">{activeLoadout.uniform}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Switch looks from the Shop or Wardrobe Path. Base kits remain free; premium styles unlock with subscriptions or one-off purchases.
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {activeLoadout.palette.map((hex) => (
                        <span
                          key={hex}
                          className="h-8 w-8 rounded-full border border-border/70"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                    <Button asChild variant="ghost" className="gap-2">
                      <Link to={`/template/${activeLoadout.templateId}`}>
                        Preview template
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-surface/70">
                <CardHeader>
                  <CardTitle>Loadouts</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Tap a persona to adjust uniforms, copy introductions, or open the template preview.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {LOADOUTS.map((loadout) => (
                    <button
                      key={loadout.id}
                      onClick={() => setActiveLoadoutId(loadout.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition hover:border-primary/50 hover:bg-primary/5 ${
                        activeLoadoutId === loadout.id
                          ? "border-primary/60 bg-primary/10"
                          : "border-border/70 bg-background/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{loadout.name}</div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">{loadout.role}</div>
                        </div>
                        <Badge variant={loadout.tier === "free" ? "secondary" : "outline"}>
                          {loadout.tier.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Wearing {loadout.uniform}
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tiers">
            <Card className="border-border/70 bg-surface/70">
              <CardHeader>
                <CardTitle>Wardrobe tiers overview</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Unlock higher tiers by sharing brands, purchasing spotlight bundles, or subscribing to Pro and Elite.
                </p>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                {["Rising Star", "Pro Spotlight", "Icon Status"].map((tierName, index) => (
                  <div key={tierName} className="rounded-2xl border border-border/70 bg-background/60 p-5">
                    <h3 className="font-heading text-lg font-semibold">{tierName}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {index === 0 && "Free base uniforms across every persona."}
                      {index === 1 && "Unlock enhanced fits, sponsor patches, and animated intros."}
                      {index === 2 && "Elite couture, volumetric lighting, and cinematic reveal sequences."}
                    </p>
                    <Button asChild variant="outline" className="mt-4">
                      <Link to="/shop">Explore upgrades</Link>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PlayerProfile;
