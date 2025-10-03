import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ExternalLink, Sparkles } from "lucide-react";

interface Brand {
  id: string;
  title: string;
  tagline: string;
  format_preset: string;
  created_at: string;
}

interface TemplateExample {
  id: string;
  format_preset: string;
  title: string;
  tagline: string;
  heroGradient: string;
  heroLabel: string;
  heroDescription: string;
  heroTags: string[];
  stats: { label: string; value: string }[];
  highlights: string[];
  emblem: string;
  accentGlow: string;
}

// Template examples for showcase
const templateExamples: TemplateExample[] = [
  {
    id: "ufc-example",
    format_preset: "ufc",
    title: "UFC Fighter",
    tagline: "Championship contender template",
    heroGradient: "from-orange-600/90 via-orange-900 to-black",
    heroLabel: "Octagon Profile",
    heroDescription:
      "Designed for fight-night spotlights, featuring records, training camp, and sponsorship placements.",
    heroTags: ["Middleweight", "Southpaw", "Pay-per-view draw"],
    stats: [
      { label: "Record", value: "18 - 2 - 1" },
      { label: "Style", value: "Muay Thai" },
      { label: "Reach", value: '74"' },
      { label: "Camp", value: "American Top Team" },
    ],
    highlights: [
      "Dynamic fight poster hero",
      "Sponsor banner integration",
      "Upcoming bout countdown",
    ],
    emblem: "UF",
    accentGlow: "from-orange-500/40 via-orange-700/20 to-transparent",
  },
  {
    id: "team-example",
    format_preset: "team",
    title: "Team Captain",
    tagline: "Leadership roster card style",
    heroGradient: "from-sky-500/80 via-indigo-900 to-black",
    heroLabel: "Season Spotlight",
    heroDescription:
      "Perfect for team leaders and franchise faces with space for accolades, stats, and motivational quotes.",
    heroTags: ["All-Star", "Locker Room Leader", "Playoff Veteran"],
    stats: [
      { label: "Season", value: "2024" },
      { label: "PPG", value: "27.3" },
      { label: "Assists", value: "8.4" },
      { label: "Championships", value: "3" },
    ],
    highlights: [
      "Roster depth chart callout",
      "Game-day quote module",
      "Sponsor-ready footer strip",
    ],
    emblem: "TC",
    accentGlow: "from-sky-400/40 via-indigo-500/20 to-transparent",
  },
  {
    id: "military-example",
    format_preset: "military",
    title: "Military Professional",
    tagline: "Precision and honor template",
    heroGradient: "from-emerald-600/80 via-emerald-900 to-black",
    heroLabel: "Service Record",
    heroDescription:
      "Structured for elite operators, capturing mission highlights, commendations, and tactical specialties.",
    heroTags: ["Special Operations", "Decorated Veteran", "Mission Ready"],
    stats: [
      { label: "Years", value: "12" },
      { label: "Deployments", value: "8" },
      { label: "Commendations", value: "5" },
      { label: "Security", value: "TS/SCI" },
    ],
    highlights: [
      "Mission timeline showcase",
      "Equipment loadout grid",
      "Leadership endorsements",
    ],
    emblem: "MP",
    accentGlow: "from-emerald-500/40 via-emerald-700/20 to-transparent",
  },
  {
    id: "nfl-example",
    format_preset: "nfl",
    title: "NFL Star",
    tagline: "Pro athlete broadcast style",
    heroGradient: "from-amber-400/80 via-slate-900 to-black",
    heroLabel: "Prime Time Feature",
    heroDescription:
      "Broadcast-ready layout with player metrics, season momentum, and spotlight for marquee matchups.",
    heroTags: ["Franchise QB", "Sunday Night", "Two-minute drill"],
    stats: [
      { label: "Yards", value: "4,982" },
      { label: "TDs", value: "43" },
      { label: "Rating", value: "112.4" },
      { label: "Playoffs", value: "7 Appearances" },
    ],
    highlights: [
      "Network lower-third graphics",
      "Headline ticker space",
      "Game day social tiles",
    ],
    emblem: "QB",
    accentGlow: "from-amber-400/40 via-yellow-500/20 to-transparent",
  },
  {
    id: "influencer-example",
    format_preset: "influencer",
    title: "Social Influencer",
    tagline: "Celebrity media kit format",
    heroGradient: "from-pink-500/70 via-fuchsia-700/80 to-black",
    heroLabel: "Media Persona",
    heroDescription:
      "Vibrant kit for lifestyle creators featuring follower growth, collaborations, and brand tone guidance.",
    heroTags: ["Lifestyle", "Global Reach", "Content Syndication"],
    stats: [
      { label: "Followers", value: "2.4M" },
      { label: "Engagement", value: "8.6%" },
      { label: "Collabs", value: "54" },
      { label: "Platforms", value: "6" },
    ],
    highlights: [
      "Storyboarding carousel",
      "Brand palette showcase",
      "Merch drop announcement",
    ],
    emblem: "SI",
    accentGlow: "from-pink-500/40 via-fuchsia-500/20 to-transparent",
  },
  {
    id: "executive-example",
    format_preset: "executive",
    title: "Executive Leader",
    tagline: "C-suite professional template",
    heroGradient: "from-slate-200/20 via-slate-600/80 to-black",
    heroLabel: "Boardroom Brief",
    heroDescription:
      "Premium corporate dossier outlining strategy pillars, quarterly performance, and leadership philosophy.",
    heroTags: ["Fortune 100", "Thought Leader", "Global Strategy"],
    stats: [
      { label: "Revenue", value: "$4.8B" },
      { label: "Teams", value: "12" },
      { label: "Growth", value: "+18%" },
      { label: "Regions", value: "27" },
    ],
    highlights: [
      "Investor-ready summary",
      "Innovation roadmap grid",
      "Executive testimonial column",
    ],
    emblem: "EL",
    accentGlow: "from-slate-200/30 via-blue-200/20 to-transparent",
  },
];

const Gallery = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicBrands();
  }, []);

  const fetchPublicBrands = async () => {
    try {
      const { data, error } = await supabase
        .from("brands")
        .select("id, title, tagline, format_preset, created_at")
        .eq("visibility", "public")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      console.error("Error fetching brands:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBrands = brands.filter(
    (brand) =>
      brand.title?.toLowerCase().includes(search.toLowerCase()) ||
      brand.tagline?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-2xl font-bold">Community Gallery</h1>
            <Button asChild variant="outline" className="gap-2">
              <Link to="/dashboard">
                Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="templates">
              <Sparkles className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="community">
              <Search className="w-4 h-4 mr-2" />
              Community
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="font-heading text-2xl font-bold mb-2">Brand Templates</h2>
                <p className="text-muted-foreground">
                  Explore our professionally designed templates
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {templateExamples.map((template) => (
                  <div
                    key={template.id}
                    className="group relative rounded-3xl border border-border/70 bg-surface/40 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.65)]"
                  >
                    <div
                      className={`pointer-events-none absolute inset-px rounded-[26px] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-br ${template.accentGlow}`}
                    />
                    <div className="relative flex h-full flex-col gap-6">
                      <div
                        className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br p-6 text-white shadow-inner ${template.heroGradient}`}
                      >
                        <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full border border-white/10 bg-white/10 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-24 left-8 h-48 w-48 rounded-full bg-white/5 blur-[120px]" />
                        <div className="relative flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.35em] text-white/70">
                              {template.heroLabel}
                            </p>
                            <h3 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
                              {template.title}
                            </h3>
                            <p className="mt-3 text-sm text-white/80">
                              {template.heroDescription}
                            </p>
                          </div>
                          <div className="flex h-16 w-16 flex-none items-center justify-center rounded-full border border-white/30 bg-white/10 text-sm font-semibold uppercase tracking-widest">
                            {template.emblem}
                          </div>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">
                          {template.heroTags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-white/80"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div>
                          <Badge variant="secondary" className="mb-2 uppercase tracking-[0.25em]">
                            {template.format_preset}
                          </Badge>
                          <p className="text-sm text-muted-foreground">
                            {template.tagline}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {template.stats.map((stat) => (
                            <div
                              key={stat.label}
                              className="rounded-xl border border-border/60 bg-background/40 p-3"
                            >
                              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                                {stat.label}
                              </p>
                              <p className="mt-2 font-heading text-lg font-semibold text-foreground">
                                {stat.value}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {template.highlights.map((highlight) => (
                            <div
                              key={highlight}
                              className="rounded-full border border-border/60 bg-background/40 px-3 py-1 text-xs font-medium text-muted-foreground"
                            >
                              {highlight}
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="mt-auto w-full gap-2"
                      >
                        <Link to={`/template/${template.format_preset}`}>
                          Preview Template
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Community Tab */}
          <TabsContent value="community">
            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search community brands..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 py-6 bg-surface border-border rounded-xl"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center text-muted-foreground py-12">
                Loading gallery...
              </div>
            ) : filteredBrands.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                {search ? "No brands match your search." : "No public brands yet."}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {filteredBrands.map((brand) => (
                  <div
                    key={brand.id}
                    className="gradient-card border border-border rounded-2xl p-6 hover:shadow-soft transition-shadow"
                  >
                    <div className="mb-4">
                      <Badge variant="secondary" className="mb-3">
                        {brand.format_preset || "Custom"}
                      </Badge>
                      <h3 className="font-heading text-xl font-semibold mb-2">
                        {brand.title || "Untitled Brand"}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {brand.tagline || "No tagline"}
                      </p>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                    >
                      <Link to={`/brand/${brand.id}`}>
                        View Brand
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Gallery;
