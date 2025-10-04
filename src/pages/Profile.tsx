import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  ChevronLeft,
  Plus,
  Sparkles,
  Star,
  UploadCloud,
  Wand2,
  X,
} from "lucide-react";

interface BrandSummary {
  id: string;
  title: string;
  tagline: string | null;
  format_preset: string | null;
  created_at: string;
  logo_url?: string | null;
}

interface MediaItem {
  id: string;
  url: string;
  label: string;
  type: "logo" | "photo";
  fromUpload?: boolean;
}

interface WardrobeTier {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  items: string[];
}

interface TemplateUniformOption {
  id: string;
  name: string;
  description: string;
  tier: "free" | "pro" | "elite";
}

interface TemplateUniform {
  templateId: string;
  templateName: string;
  description: string;
  options: TemplateUniformOption[];
}

const SAMPLE_BRANDS: BrandSummary[] = [
  {
    id: "sample-ufc",
    title: "Octagon Overdrive",
    tagline: "Fight-night ready hype deck",
    format_preset: "ufc",
    created_at: new Date().toISOString(),
    logo_url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=200&q=60",
  },
  {
    id: "sample-influencer",
    title: "Creator Pulse",
    tagline: "Lifestyle storyteller brand kit",
    format_preset: "influencer",
    created_at: new Date().toISOString(),
    logo_url: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=200&q=60",
  },
];

const SAMPLE_LOGOS: MediaItem[] = [
  {
    id: "logo-aurora",
    url: "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=300&q=60",
    label: "Aurora Monogram",
    type: "logo",
  },
  {
    id: "logo-neon",
    url: "https://images.unsplash.com/photo-1529429617124-aee0a249c5f9?auto=format&fit=crop&w=300&q=60",
    label: "Neon Crest",
    type: "logo",
  },
];

const SAMPLE_PHOTOS: MediaItem[] = [
  {
    id: "photo-stage",
    url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=60",
    label: "Stage Spotlight",
    type: "photo",
  },
  {
    id: "photo-urban",
    url: "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=400&q=60",
    label: "Urban Energy",
    type: "photo",
  },
];

const INITIAL_WARDROBE: WardrobeTier[] = [
  {
    id: "tier-rising",
    name: "Rising Star",
    description: "Launch looks crafted for new creators finding their voice.",
    unlocked: true,
    items: ["Launch Night bomber", "Signature streetwear set"],
  },
  {
    id: "tier-pro",
    name: "Pro Spotlight",
    description: "Premium wardrobe palette for paid appearances and partnerships.",
    unlocked: false,
    items: ["Press conference suit", "Luxury athleisure kit"],
  },
  {
    id: "tier-icon",
    name: "Icon Status",
    description: "Bespoke couture and statement armor reserved for elite campaigns.",
    unlocked: false,
    items: ["Custom couture suit", "Championship walk-out cape"],
  },
];

const TEMPLATE_UNIFORMS: TemplateUniform[] = [
  {
    templateId: "ufc",
    templateName: "Octagon Champion",
    description: "Select the fight kit that appears across UFC-style templates.",
    options: [
      {
        id: "fight-night",
        name: "Fight Night Classic",
        description: "Default crimson walkout gear included with every account.",
        tier: "free",
      },
      {
        id: "championship-gold",
        name: "Championship Gold",
        description: "Pro members unlock gold trim, banner lighting, and entrance FX.",
        tier: "pro",
      },
      {
        id: "legacy-immortal",
        name: "Legacy Immortal",
        description: "Elite-exclusive holographic robe with pyro choreography.",
        tier: "elite",
      },
    ],
  },
  {
    templateId: "team",
    templateName: "Club Captain",
    description: "Define the jersey used in team and league decks.",
    options: [
      {
        id: "home-tipoff",
        name: "Home Tip-Off",
        description: "Traditional home colors—free for every roster.",
        tier: "free",
      },
      {
        id: "city-edition",
        name: "City Edition",
        description: "Pro upgrade featuring neon trim and alternate shorts.",
        tier: "pro",
      },
      {
        id: "legends-throwback",
        name: "Legends Throwback",
        description: "Elite throwback set with tunnel camera overlays.",
        tier: "elite",
      },
    ],
  },
  {
    templateId: "nfl",
    templateName: "Primetime Receiver",
    description: "Control the uniforms appearing in American football templates.",
    options: [
      {
        id: "primetime-home",
        name: "Primetime Home",
        description: "Baseline kit, optimized for quick exports and highlights.",
        tier: "free",
      },
      {
        id: "color-rush",
        name: "Color Rush",
        description: "Pro members add LED tunnel intros and alternate jerseys.",
        tier: "pro",
      },
      {
        id: "hall-of-fame",
        name: "Hall of Fame",
        description: "Elite sequence with gold jacket ceremony visuals.",
        tier: "elite",
      },
    ],
  },
  {
    templateId: "executive",
    templateName: "Boardroom Visionary",
    description: "Dress the executive persona for keynotes and investor decks.",
    options: [
      {
        id: "boardroom-foundation",
        name: "Boardroom Foundation",
        description: "Tailored charcoal suit—always free.",
        tier: "free",
      },
      {
        id: "global-keynote",
        name: "Global Keynote",
        description: "Pro upgrade with spotlight stage and choreographed camera moves.",
        tier: "pro",
      },
      {
        id: "future-forward",
        name: "Future Forward",
        description: "Elite couture featuring kinetic LED backdrop.",
        tier: "elite",
      },
    ],
  },
];

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") ?? "overview");
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [favoriteBrandIds, setFavoriteBrandIds] = useState<string[]>([]);
  const [logoLibrary, setLogoLibrary] = useState<MediaItem[]>(SAMPLE_LOGOS);
  const [photoLibrary, setPhotoLibrary] = useState<MediaItem[]>(SAMPLE_PHOTOS);
  const [wardrobeTiers, setWardrobeTiers] = useState<WardrobeTier[]>(INITIAL_WARDROBE);
  const [newWardrobeItem, setNewWardrobeItem] = useState<Record<string, string>>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uniformPreferences, setUniformPreferences] = useState<Record<string, string>>(() =>
    TEMPLATE_UNIFORMS.reduce((acc, template) => {
      acc[template.templateId] = template.options[0]?.id ?? "";
      return acc;
    }, {} as Record<string, string>),
  );
  const uploadedUrlsRef = useRef<string[]>([]);

  const [profileData, setProfileData] = useState({
    fullName: "Jordan Rivers",
    headline: "Creator & Brand Strategist",
    email: "jordan.rivers@example.com",
    location: "Los Angeles, CA",
    bio: "Former professional athlete turned global brand spokesperson. I partner with future-facing companies to create immersive fan experiences and electrifying product launches.",
    website: "https://maximised.ai",
    social: "@jordanrivers",
  });

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        applySession(data.session);
      }
      setSession(data.session);
      setLoadingSession(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        applySession(newSession);
      }
    });

    return () => {
      subscription.unsubscribe();
      uploadedUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loadingSession) return;

    if (session?.user) {
      fetchBrands(session.user.id);
    } else {
      setBrands(SAMPLE_BRANDS);
      setBrandsLoading(false);
    }
  }, [loadingSession, session]);

  useEffect(() => {
    const tab = searchParams.get("tab") ?? "overview";
    setActiveTab(tab);
  }, [searchParams]);

  const applySession = (userSession: Session) => {
    const metadata = userSession.user.user_metadata || {};
    setProfileData((prev) => ({
      ...prev,
      fullName: metadata.full_name || metadata.name || prev.fullName,
      headline: metadata.headline || prev.headline,
      email: userSession.user.email || prev.email,
      location: metadata.location || prev.location,
      bio: metadata.bio || prev.bio,
      website: metadata.website || prev.website,
      social: metadata.social || prev.social,
    }));

    if (metadata.avatar_url) {
      setAvatarPreview(metadata.avatar_url);
    }
  };

  const fetchBrands = async (userId: string) => {
    setBrandsLoading(true);
    try {
      const { data, error } = await supabase
        .from("brands")
        .select("id, title, tagline, format_preset, created_at, logo_url")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      console.error("Error loading brands", error);
      toast.error("We couldn't load your brands. Showing a sample view instead.");
      setBrands(SAMPLE_BRANDS);
    } finally {
      setBrandsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    setSearchParams(params, { replace: true });
  };

  const handleProfileChange = (field: keyof typeof profileData, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProfile = () => {
    toast.success("Profile preferences saved");
  };

  const registerUploadUrl = (url: string) => {
    uploadedUrlsRef.current.push(url);
    return url;
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = registerUploadUrl(URL.createObjectURL(file));
    setAvatarPreview(objectUrl);
    toast.success("Avatar updated");
  };

  const handleMediaUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: MediaItem["type"],
  ) => {
    const files = event.target.files;
    if (!files?.length) return;

    const uploads: MediaItem[] = Array.from(files).map((file) => ({
      id: `${type}-${file.name}-${crypto.randomUUID()}`,
      url: registerUploadUrl(URL.createObjectURL(file)),
      label: file.name,
      type,
      fromUpload: true,
    }));

    if (type === "logo") {
      setLogoLibrary((prev) => [...uploads, ...prev]);
    } else {
      setPhotoLibrary((prev) => [...uploads, ...prev]);
    }

    toast.success(`${uploads.length} new ${type === "logo" ? "logos" : "photos"} added`);
  };

  const handleRemoveMedia = (type: MediaItem["type"], id: string) => {
    const updater = (items: MediaItem[]) =>
      items.filter((item) => {
        if (item.id === id && item.fromUpload) {
          URL.revokeObjectURL(item.url);
        }
        return item.id !== id;
      });

    if (type === "logo") {
      setLogoLibrary(updater);
    } else {
      setPhotoLibrary(updater);
    }
  };

  const toggleFavoriteBrand = (brandId: string) => {
    setFavoriteBrandIds((prev) =>
      prev.includes(brandId)
        ? prev.filter((id) => id !== brandId)
        : [...prev, brandId],
    );
  };

  const unlockedCount = wardrobeTiers.filter((tier) => tier.unlocked).length;
  const wardrobeProgress = Math.round((unlockedCount / wardrobeTiers.length) * 100);

  const membershipLabel = useMemo(() => {
    if (unlockedCount >= wardrobeTiers.length) return "Icon Status";
    if (unlockedCount >= 2) return "Pro Spotlight";
    return "Rising Star";
  }, [unlockedCount, wardrobeTiers.length]);

  const handleUnlockTier = (tierId: string) => {
    setWardrobeTiers((prev) =>
      prev.map((tier) =>
        tier.id === tierId
          ? {
              ...tier,
              unlocked: true,
            }
          : tier,
      ),
    );
    const tier = wardrobeTiers.find((item) => item.id === tierId);
    if (tier) {
      toast.success(`${tier.name} tier unlocked`);
    }
  };

  const handleAddWardrobeItem = (tierId: string) => {
    const value = newWardrobeItem[tierId]?.trim();
    if (!value) return;

    setWardrobeTiers((prev) =>
      prev.map((tier) =>
        tier.id === tierId
          ? {
              ...tier,
              items: [...tier.items, value],
            }
          : tier,
      ),
    );
    setNewWardrobeItem((prev) => ({
      ...prev,
      [tierId]: "",
    }));
    const tier = wardrobeTiers.find((item) => item.id === tierId);
    if (tier) {
      toast.success(`Added \"${value}\" to ${tier.name}`);
    }
  };

  const handleRemoveWardrobeItem = (tierId: string, item: string) => {
    setWardrobeTiers((prev) =>
      prev.map((tier) =>
        tier.id === tierId
          ? {
              ...tier,
              items: tier.items.filter((entry) => entry !== item),
            }
          : tier,
      ),
    );
  };

  const totalFavoriteCount = favoriteBrandIds.length;

  const handleUniformChange = (templateId: string, optionId: string) => {
    setUniformPreferences((prev) => ({
      ...prev,
      [templateId]: optionId,
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/70 backdrop-blur">
        <div className="container mx-auto px-6 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3 text-primary">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium uppercase tracking-wide">
                Personal Command Center
              </span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold mt-2">
              Profile & Assets
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Configure how the world sees you, manage your media library, and curate wardrobe looks as you progress through tiers.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/dashboard")}
              className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
          <TabsList className="flex flex-wrap gap-2 bg-surface/80 p-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="media">Avatar & Media</TabsTrigger>
            <TabsTrigger value="wardrobe">Wardrobe Path</TabsTrigger>
            <TabsTrigger value="brands">My Brands</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {!session && !loadingSession && (
              <Alert className="border-primary/40 bg-primary/5">
                <AlertTitle>Preview mode</AlertTitle>
                <AlertDescription>
                  Sign in to sync these settings with your account. You're viewing a sample profile so you can explore the layout.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle>Profile details</CardTitle>
                  <CardDescription>
                    Personal information is used to tailor generated brand riders and voice tone.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                      <div className="relative h-24 w-24">
                        <Avatar className="h-24 w-24 border border-border">
                          {avatarPreview ? (
                            <AvatarImage src={avatarPreview} alt={profileData.fullName} />
                          ) : (
                            <AvatarFallback>
                              {profileData.fullName
                                .split(" ")
                                .map((part) => part[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <label
                          htmlFor="avatar-upload"
                          className="absolute -bottom-2 -right-2 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-surface shadow-md transition hover:bg-surface/80"
                        >
                          <UploadCloud className="h-4 w-4" />
                        </label>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                        />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-heading text-xl">{profileData.fullName}</h3>
                        <p className="text-sm text-muted-foreground">
                          Update your avatar to align with the latest campaign identity.
                        </p>
                      </div>
                    </div>

                    <Separator className="bg-border/60" />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full name</Label>
                        <Input
                          id="fullName"
                          value={profileData.fullName}
                          onChange={(event) => handleProfileChange("fullName", event.target.value)}
                          placeholder="Your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="headline">Headline</Label>
                        <Input
                          id="headline"
                          value={profileData.headline}
                          onChange={(event) => handleProfileChange("headline", event.target.value)}
                          placeholder="Creator & Brand Strategist"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email">Contact email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(event) => handleProfileChange("email", event.target.value)}
                          placeholder="name@brand.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Base city</Label>
                        <Input
                          id="location"
                          value={profileData.location}
                          onChange={(event) => handleProfileChange("location", event.target.value)}
                          placeholder="Where do you operate from?"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={profileData.website}
                          onChange={(event) => handleProfileChange("website", event.target.value)}
                          placeholder="https://yourdomain.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="social">Primary social handle</Label>
                        <Input
                          id="social"
                          value={profileData.social}
                          onChange={(event) => handleProfileChange("social", event.target.value)}
                          placeholder="@yourhandle"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(event) => handleProfileChange("bio", event.target.value)}
                        rows={5}
                        placeholder="Tell us about your story and unique voice."
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSaveProfile} className="gap-2">
                        <Wand2 className="h-4 w-4" />
                        Save profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle>Account snapshot</CardTitle>
                  <CardDescription>
                    Track your progress through wardrobe tiers and saved brand kits.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-secondary/10 p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Membership tier</p>
                        <h3 className="font-heading text-2xl font-semibold mt-1">{membershipLabel}</h3>
                      </div>
                      <Badge variant="outline" className="border-primary/40 text-primary">
                        {unlockedCount}/{wardrobeTiers.length} tiers
                      </Badge>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      Unlock more tiers by publishing brands and keeping your media library fresh.
                    </p>
                  </div>

                  <div className="grid gap-4 text-sm">
                    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-surface/60 px-4 py-3">
                      <span className="text-muted-foreground">Brand kits saved</span>
                      <span className="font-semibold">{brands.length}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-surface/60 px-4 py-3">
                      <span className="text-muted-foreground">Favourited kits</span>
                      <span className="font-semibold">{totalFavoriteCount}</span>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    className="w-full gap-2"
                    onClick={() => handleTabChange("brands")}
                  >
                    Manage my brands
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="media" className="space-y-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle>Logos & marks</CardTitle>
                  <CardDescription>
                    Upload brand marks, monograms, or sponsor logos to keep them handy during template generation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label
                    htmlFor="logo-upload"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-surface/40 p-6 text-center transition hover:border-primary/60 hover:bg-surface/60"
                  >
                    <UploadCloud className="h-6 w-6 text-primary" />
                    <span className="mt-3 font-medium">Drop new logos</span>
                    <span className="text-sm text-muted-foreground">PNG, SVG or JPG up to 5MB.</span>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(event) => handleMediaUpload(event, "logo")}
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {logoLibrary.map((logo) => (
                      <div
                        key={logo.id}
                        className="group relative overflow-hidden rounded-2xl border border-border/60 bg-surface/60"
                      >
                        <img src={logo.url} alt={logo.label} className="h-32 w-full object-cover" />
                        <div className="flex items-center justify-between px-4 py-3">
                          <div className="text-sm font-medium">{logo.label}</div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground"
                            onClick={() => handleRemoveMedia("logo", logo.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle>Photos & gallery</CardTitle>
                  <CardDescription>
                    Store hero shots, press images, and behind-the-scenes captures for quick access.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label
                    htmlFor="photo-upload"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-surface/40 p-6 text-center transition hover:border-secondary/60 hover:bg-surface/60"
                  >
                    <UploadCloud className="h-6 w-6 text-secondary" />
                    <span className="mt-3 font-medium">Upload new photos</span>
                    <span className="text-sm text-muted-foreground">High-res PNG or JPG recommended.</span>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(event) => handleMediaUpload(event, "photo")}
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    {photoLibrary.map((photo) => (
                      <div
                        key={photo.id}
                        className="group relative overflow-hidden rounded-2xl border border-border/60 bg-surface/60"
                      >
                        <img src={photo.url} alt={photo.label} className="h-40 w-full object-cover" />
                        <div className="flex items-center justify-between px-4 py-3">
                          <div>
                            <div className="text-sm font-medium">{photo.label}</div>
                            <div className="text-xs text-muted-foreground">{photo.type === "photo" ? "Creative" : ""}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground"
                            onClick={() => handleRemoveMedia("photo", photo.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="wardrobe" className="space-y-8">
            <Card className="border-border/60">
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Uniform presets</CardTitle>
                  <CardDescription>
                    Choose the base outfit each persona uses by default. Upgrades sync from the Shop and Player Profile locker.
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => navigate("/shop")}>Open Shop</Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {TEMPLATE_UNIFORMS.map((template) => {
                  const selected = uniformPreferences[template.templateId];
                  return (
                    <div
                      key={template.templateId}
                      className="rounded-2xl border border-border/70 bg-background/60 p-5"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="font-heading text-lg font-semibold">{template.templateName}</h3>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => navigate(`/template/${template.templateId}`)}
                        >
                          Preview template
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <RadioGroup
                        value={selected}
                        onValueChange={(value) => handleUniformChange(template.templateId, value)}
                        className="mt-4 space-y-3"
                      >
                        {template.options.map((option) => {
                          const optionId = `${template.templateId}-${option.id}`;
                          const isActive = selected === option.id;
                          return (
                            <Label
                              key={option.id}
                              htmlFor={optionId}
                              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition hover:border-secondary/60 hover:bg-secondary/10 ${
                                isActive ? "border-secondary/70 bg-secondary/10" : "border-border/60 bg-surface/60"
                              }`}
                            >
                              <RadioGroupItem id={optionId} value={option.id} className="mt-1" />
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium">{option.name}</span>
                                  <Badge variant={option.tier === "free" ? "secondary" : "outline"}>
                                    {option.tier.toUpperCase()}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{option.description}</p>
                              </div>
                            </Label>
                          );
                        })}
                      </RadioGroup>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle>Wardrobe progression</CardTitle>
                <CardDescription>
                  Climb through wardrobe tiers to unlock premium looks curated for each moment in your journey.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Progress value={wardrobeProgress} className="h-2 flex-1" />
                  <div className="text-sm text-muted-foreground">
                    {unlockedCount} of {wardrobeTiers.length} tiers unlocked
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Every brand kit you publish and every appearance you log pushes you closer to Icon Status. Keep building momentum!
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
              {wardrobeTiers.map((tier) => (
                <Card key={tier.id} className="border-border/60">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle>{tier.name}</CardTitle>
                        <CardDescription>{tier.description}</CardDescription>
                      </div>
                      <Badge
                        variant={tier.unlocked ? "secondary" : "outline"}
                        className={cn(
                          "uppercase tracking-wide",
                          tier.unlocked
                            ? "bg-secondary/20 text-secondary-foreground"
                            : "border-border/70 text-muted-foreground",
                        )}
                      >
                        {tier.unlocked ? "Unlocked" : "Locked"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {tier.items.length ? (
                        tier.items.map((item) => (
                          <div
                            key={`${tier.id}-${item}`}
                            className="flex items-center justify-between rounded-xl border border-border/60 bg-surface/60 px-4 py-3 text-sm"
                          >
                            <span>{item}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground"
                              onClick={() => handleRemoveWardrobeItem(tier.id, item)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No outfits added yet. Unlock the tier to start styling.
                        </p>
                      )}
                    </div>

                    {tier.unlocked ? (
                      <div className="flex gap-2">
                        <Input
                          value={newWardrobeItem[tier.id] ?? ""}
                          onChange={(event) =>
                            setNewWardrobeItem((prev) => ({
                              ...prev,
                              [tier.id]: event.target.value,
                            }))
                          }
                          placeholder="Add a new look"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => handleAddWardrobeItem(tier.id)}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleUnlockTier(tier.id)}
                      >
                        Unlock tier
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="brands" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-2xl font-semibold">Saved brand kits</h2>
                <p className="text-sm text-muted-foreground">
                  All of your generated, saved, or favourited brands live here. Jump back in to update or export in seconds.
                </p>
              </div>
              <Button variant="secondary" className="gap-2" onClick={() => navigate("/create")}
              >
                <Plus className="h-4 w-4" />
                Create new brand
              </Button>
            </div>

            {brandsLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-48 animate-pulse rounded-2xl border border-border/60 bg-surface/60"
                  />
                ))}
              </div>
            ) : brands.length ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {brands.map((brand) => (
                  <Card key={brand.id} className="border-border/60">
                    <CardContent className="space-y-4 p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-heading text-xl font-semibold">
                            {brand.title || "Untitled Brand"}
                          </h3>
                          {brand.tagline && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {brand.tagline}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleFavoriteBrand(brand.id)}
                          className={cn(
                            "h-9 w-9 rounded-full border border-transparent",
                            favoriteBrandIds.includes(brand.id)
                              ? "text-yellow-400"
                              : "text-muted-foreground",
                          )}
                        >
                          <Star
                            className={cn(
                              "h-4 w-4",
                              favoriteBrandIds.includes(brand.id) && "fill-current",
                            )}
                          />
                        </Button>
                      </div>

                      {brand.logo_url && (
                        <div className="overflow-hidden rounded-xl border border-border/60">
                          <img
                            src={brand.logo_url}
                            alt={`${brand.title} logo`}
                            className="h-32 w-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <Badge variant="outline" className="uppercase tracking-wide">
                          {brand.format_preset || "custom"}
                        </Badge>
                        <span className="text-muted-foreground">
                          {new Date(brand.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={() => navigate(`/brand/${brand.id}`)}
                        >
                          Open brand
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => toggleFavoriteBrand(brand.id)}
                          className="gap-2"
                        >
                          <Star
                            className={cn(
                              "h-4 w-4",
                              favoriteBrandIds.includes(brand.id) && "fill-current text-yellow-400",
                            )}
                          />
                          {favoriteBrandIds.includes(brand.id) ? "Favourited" : "Favourite"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-border/60 bg-surface/60">
                <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                  <Star className="h-10 w-10 text-muted-foreground" />
                  <div className="space-y-2">
                    <h3 className="font-heading text-xl">No brand kits yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Generate a brand to see it appear in your profile. We’ll keep your favourites pinned here.
                    </p>
                  </div>
                  <Button onClick={() => navigate("/create")} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Start your first brand
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;
