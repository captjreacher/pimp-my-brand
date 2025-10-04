import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Crown, ShieldCheck, ArrowRight } from "lucide-react";

const SHOP_CATEGORIES = [
  {
    id: "base",
    title: "Base Kits",
    tier: "Free",
    description: "Essential uniforms that ship with every template. Perfect for quick exports and trials.",
    perks: [
      "Full-body avatar aligned to your selected template",
      "Color-matched styling pulled from your brand palette",
      "Unlocked automatically for every account",
    ],
  },
  {
    id: "pro",
    title: "Pro Enhancements",
    tier: "Pro Subscription",
    description: "Signature looks, cinematic entrances, and branded props for creators who need more flair.",
    perks: [
      "Animated intros and lighting effects",
      "Alternate uniforms like City Edition & Championship Gold",
      "Sponsor patch placements and pose variations",
    ],
  },
  {
    id: "elite",
    title: "Elite Experiences",
    tier: "Elite Unlock",
    description: "Premium couture, volumetric FX, and broadcast-ready scenes for live shows and mega launches.",
    perks: [
      "Volumetric avatars with AR overlays",
      "Walkout choreography and cinematic score",
      "Exclusive wardrobe collaborations updated monthly",
    ],
  },
];

const FEATURED_ITEMS = [
  {
    name: "Championship Gold Walkout",
    tier: "Pro",
    description: "Gold-laced robe, spotlight tunnel, and roar soundtrack for fight night templates.",
  },
  {
    name: "Legends Throwback",
    tier: "Elite",
    description: "Retro basketball uniforms with tunnel cameras and crowd animations.",
  },
  {
    name: "Global Keynote Ensemble",
    tier: "Pro",
    description: "Executive couture with LED keynote stage projection and choreographed camera dolly.",
  },
];

const Shop = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/70 backdrop-blur">
        <div className="container mx-auto px-6 py-10">
          <div className="max-w-4xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-4 py-2 text-xs uppercase tracking-wider text-primary">
              <Sparkles className="h-4 w-4" />
              Wardrobe Marketplace
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold">Outfit every template with next-level uniforms</h1>
            <p className="text-lg text-muted-foreground">
              Base clothing is always free. Upgrade to Pro or Elite to unlock flamboyant walkouts, cinematic lighting, and exclusive collaborations tailored to each persona.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/pricing">
                  <Crown className="h-4 w-4 mr-2" />
                  Compare subscriptions
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/player-profile">
                  Manage locker
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 space-y-12">
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SHOP_CATEGORIES.map((category) => (
            <Card key={category.id} className="border-border/70 bg-surface/70">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{category.title}</CardTitle>
                  <Badge variant={category.id === "base" ? "secondary" : "outline"}>{category.tier}</Badge>
                </div>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {category.perks.map((perk) => (
                  <div key={perk} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary mt-1" />
                    <span>{perk}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="rounded-3xl border border-border/70 bg-surface/80 p-8 shadow-soft">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-2">
              <h2 className="font-heading text-3xl font-semibold">Featured drops</h2>
              <p className="text-muted-foreground">
                Rotate new uniforms into your locker monthly. Purchase outright or unlock via subscription tiers.
              </p>
            </div>
            <Button asChild variant="default">
              <Link to="/player-profile">Preview in Player Profile</Link>
            </Button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {FEATURED_ITEMS.map((item) => (
              <div key={item.name} className="rounded-2xl border border-border/60 bg-background/70 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{item.name}</h3>
                  <Badge variant={item.tier === "Elite" ? "outline" : "secondary"}>{item.tier}</Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-dashed border-primary/40 bg-primary/5 p-10 text-center">
          <h2 className="font-heading text-3xl font-semibold">Bring your own designs</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Already have a signature uniform? Upload reference shots in Profile → Avatar & Media. Our stylists convert them into ready-to-use template outfits within 24 hours.
          </p>
          <Button asChild className="mt-6">
            <Link to="/profile?tab=media">Upload references</Link>
          </Button>
        </section>
      </main>
    </div>
  );
};

export default Shop;
