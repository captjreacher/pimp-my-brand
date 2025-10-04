import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Sparkles, Lock } from "lucide-react";
import { UFCTemplate } from "@/components/templates/UFCTemplate";
import { TeamTemplate } from "@/components/templates/TeamTemplate";
import { MilitaryTemplate } from "@/components/templates/MilitaryTemplate";
import { NFLTemplate } from "@/components/templates/NFLTemplate";
import { InfluencerTemplate } from "@/components/templates/InfluencerTemplate";
import { ExecutiveTemplate } from "@/components/templates/ExecutiveTemplate";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { canAccessTemplate, type SubscriptionTier } from "@/lib/subscription-tiers";

type TemplateAvatarOption = {
  url: string;
  alt: string;
};

type TemplateUniformOption = {
  id: string;
  name: string;
  description: string;
  tier: SubscriptionTier;
};

type TemplateDefinition = {
  title: string;
  tagline: string;
  tier: SubscriptionTier;
  logo_url?: string;
  color_palette: Array<{ hex: string; name: string }>;
  markdown: string;
  avatar: {
    fictional: TemplateAvatarOption;
    personalized?: TemplateAvatarOption;
  };
  uniform: {
    default: string;
    options: TemplateUniformOption[];
  };
};

// Sample data for each template
const templateData: Record<string, TemplateDefinition> = {
  ufc: {
    title: "JOHN \"THE HAMMER\" DAVIDSON",
    tagline: "Undefeated Welterweight Champion",
    tier: "free",
    avatar: {
      fictional: {
        url: "https://images.unsplash.com/photo-1559114367-ff25e89adb7d?auto=format&fit=crop&w=640&q=80",
        alt: "MMA fighter in full walkout gear",
      },
      personalized: {
        url: "https://images.unsplash.com/photo-1549451371-64aa98a6f660?auto=format&fit=crop&w=640&q=80",
        alt: "Octagon fighter awaiting introductions",
      },
    },
    uniform: {
      default: "fight-night",
      options: [
        {
          id: "fight-night",
          name: "Fight Night Classic",
          description: "Baseline black and crimson kit included for every fighter profile.",
          tier: "free",
        },
        {
          id: "championship-gold",
          name: "Championship Gold",
          description: "Add gold trim, walkout banner, and spotlight animations for pro members.",
          tier: "pro",
        },
        {
          id: "legacy-immortal",
          name: "Legacy Immortal",
          description: "Elite-only holographic robe with pyrotechnic entrance overlays.",
          tier: "elite",
        },
      ],
    },
    color_palette: [
      { hex: "#EF4444", name: "Fight Red" },
      { hex: "#1F2937", name: "Arena Black" },
      { hex: "#F3F4F6", name: "Canvas White" },
      { hex: "#FCD34D", name: "Gold" },
    ],
    markdown: `# FIGHTER PROFILE

## Combat Record
**Professional Record:** 15-0-0 (15 Wins, 0 Losses)

**Fighting Style:** Aggressive striker with ground-and-pound expertise

**Notable Victories:**
- KO victory over Marcus "The Beast" Johnson (Round 2)
- Submission win against Carlos Rodriguez (Round 3)
- Championship defense against Anthony Thompson (Round 4)

## Training Background
- **Brazilian Jiu-Jitsu:** Black Belt
- **Muay Thai:** 10+ years experience
- **Wrestling:** Division I Collegiate Champion

## Physical Stats
- **Height:** 6'1"
- **Weight:** 170 lbs
- **Reach:** 74 inches

## Key Strengths
- Lightning-fast combinations
- Elite cardio and endurance
- Devastating ground game
- Mental toughness under pressure

## Media Requirements
All interviews must be scheduled 48 hours in advance. No questions about personal life.`,
  },
  team: {
    title: "RAIDERS BASKETBALL CLUB",
    tagline: "Building Champions On and Off the Court",
    tier: "free",
    avatar: {
      fictional: {
        url: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=640&q=80",
        alt: "Basketball captain posing courtside",
      },
      personalized: {
        url: "https://images.unsplash.com/photo-1454165205744-3b78555e5572?auto=format&fit=crop&w=640&q=80",
        alt: "Athlete celebrating on the court",
      },
    },
    uniform: {
      default: "home-tipoff",
      options: [
        {
          id: "home-tipoff",
          name: "Home Tip-Off",
          description: "Official home jersey with team wordmark, part of the free tier locker.",
          tier: "free",
        },
        {
          id: "city-edition",
          name: "City Edition",
          description: "Vibrant alternate set inspired by city lights, available to pro members.",
          tier: "pro",
        },
        {
          id: "legends-throwback",
          name: "Legends Throwback",
          description: "Elite subscription unlock featuring retro stripes and animated tunnel intro.",
          tier: "elite",
        },
      ],
    },
    color_palette: [
      { hex: "#3B82F6", name: "Team Blue" },
      { hex: "#FBBF24", name: "Victory Gold" },
      { hex: "#1F2937", name: "Court Black" },
      { hex: "#F3F4F6", name: "Jersey White" },
    ],
    markdown: `# TEAM OVERVIEW

## Season Highlights
**Current Standing:** 1st Place in Conference
**Win-Loss Record:** 24-3

## Core Values
- **Excellence:** We demand the best from every player
- **Unity:** One team, one goal
- **Discipline:** Success through dedication
- **Community:** Giving back to those who support us

## Coaching Staff
**Head Coach:** Michael Stevens
- 15+ years coaching experience
- 3x Conference Coach of the Year
- Former professional player

## Team Achievements
- 2x Conference Champions (2022, 2023)
- State Tournament Finalists (2023)
- Community Service Award Recipients

## Player Development Program
We focus on developing well-rounded athletes through:
- Strength and conditioning
- Mental performance coaching
- Academic support
- Leadership training

## Community Engagement
Our team actively participates in local youth programs and charity events.`,
  },
  military: {
    title: "SGT. MAJOR ROBERT ANDERSON",
    tagline: "Special Operations Command",
    tier: "free",
    avatar: {
      fictional: {
        url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=640&q=80",
        alt: "Special operations leader in dress uniform",
      },
      personalized: {
        url: "https://images.unsplash.com/photo-1546525848-3ce03ca516f6?auto=format&fit=crop&w=640&q=80",
        alt: "Military professional standing at attention",
      },
    },
    uniform: {
      default: "field-dress",
      options: [
        {
          id: "field-dress",
          name: "Field Dress",
          description: "Standard tactical service uniform included in every profile loadout.",
          tier: "free",
        },
        {
          id: "honor-guard",
          name: "Honor Guard",
          description: "Ceremonial blues with ribbon rack enhancements for pro subscribers.",
          tier: "pro",
        },
        {
          id: "black-ops-stealth",
          name: "Black Ops Stealth",
          description: "Elite-exclusive stealth gear with reactive lighting and mission HUD.",
          tier: "elite",
        },
      ],
    },
    color_palette: [
      { hex: "#10B981", name: "Military Green" },
      { hex: "#1F2937", name: "Tactical Black" },
      { hex: "#6B7280", name: "Steel Gray" },
      { hex: "#FCD34D", name: "Service Gold" },
    ],
    markdown: `# PERSONNEL FILE

## SERVICE RECORD
**Rank:** Sergeant Major
**Years of Service:** 18 Years
**Current Assignment:** Special Operations Command

## DEPLOYMENTS
- Operation Enduring Freedom (Afghanistan) - 3 Tours
- Operation Iraqi Freedom - 2 Tours
- Peacekeeping Mission (Kosovo) - 1 Tour

## QUALIFICATIONS & CERTIFICATIONS
- Airborne Qualified
- Ranger School Graduate
- Special Forces Qualification Course
- Combat Lifesaver Certified
- Expert Marksman

## COMMENDATIONS
- Bronze Star with Valor
- Purple Heart
- Army Commendation Medal (3)
- NATO Medal

## LEADERSHIP PHILOSOPHY
Excellence in execution. Discipline in conduct. Honor in service.

## SPECIALIZED SKILLS
- Counter-terrorism operations
- Strategic planning
- Team leadership
- Crisis management
- Intelligence analysis

## CLEARANCE LEVEL
**Classification:** Top Secret/SCI`,
  },
  nfl: {
    title: "MARCUS \"LIGHTNING\" WILLIAMS",
    tagline: "Pro Bowl Wide Receiver",
    tier: "pro",
    avatar: {
      fictional: {
        url: "https://images.unsplash.com/photo-1471295253337-3ceaaedca402?auto=format&fit=crop&w=640&q=80",
        alt: "Football star in game-day uniform",
      },
      personalized: {
        url: "https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=640&q=80",
        alt: "Receiver celebrating a touchdown",
      },
    },
    uniform: {
      default: "primetime-home",
      options: [
        {
          id: "primetime-home",
          name: "Primetime Home",
          description: "Signature jersey and gloves available to every rostered player.",
          tier: "free",
        },
        {
          id: "color-rush",
          name: "Color Rush",
          description: "High-voltage alternates with animated LED tunnel for pro members.",
          tier: "pro",
        },
        {
          id: "hall-of-fame",
          name: "Hall of Fame",
          description: "Elite tier gold jacket ceremony scene with broadcast overlays.",
          tier: "elite",
        },
      ],
    },
    color_palette: [
      { hex: "#F97316", name: "Endzone Orange" },
      { hex: "#1F2937", name: "Field Black" },
      { hex: "#F3F4F6", name: "Jersey White" },
      { hex: "#3B82F6", name: "Sky Blue" },
    ],
    markdown: `# PLAYER PROFILE

## Career Statistics
**Games Played:** 94
**Receptions:** 412
**Receiving Yards:** 6,234
**Touchdowns:** 58
**Pro Bowl Selections:** 3

## Physical Attributes
- **Height:** 6'3"
- **Weight:** 210 lbs
- **40-Yard Dash:** 4.38 seconds
- **Vertical Jump:** 38 inches

## Career Highlights
- NFL Offensive Rookie of the Year (2019)
- Led league in receiving yards (2021)
- Super Bowl appearance (2022)
- Team captain (2023-present)

## Playing Style
Known for exceptional route-running, reliable hands, and game-changing speed. A complete receiver who excels in all aspects of the position.

## Off-Field Initiatives
- Founded "Lightning Strikes" youth football camp
- Active spokesperson for literacy programs
- Partnership with local children's hospital

## Media Availability
Available for interviews through team PR department. Advance notice required for all media engagements.

## Brand Partnerships
Open to select endorsement opportunities that align with personal values and community focus.`,
  },
  influencer: {
    title: "SARAH CHEN",
    tagline: "Lifestyle & Wellness Creator",
    tier: "pro",
    avatar: {
      fictional: {
        url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=640&q=80",
        alt: "Fashion influencer posing in studio",
      },
      personalized: {
        url: "https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?auto=format&fit=crop&w=640&q=80",
        alt: "Lifestyle creator walking through city",
      },
    },
    uniform: {
      default: "studio-neutrals",
      options: [
        {
          id: "studio-neutrals",
          name: "Studio Neutrals",
          description: "Signature pastel set perfect for free-tier lookbooks and thumbnails.",
          tier: "free",
        },
        {
          id: "runway-radiance",
          name: "Runway Radiance",
          description: "Glam shoot styling with lens flare filters for pro storytellers.",
          tier: "pro",
        },
        {
          id: "metaverse-muse",
          name: "Metaverse Muse",
          description: "Elite volumetric couture with AR props for immersive collaborations.",
          tier: "elite",
        },
      ],
    },
    color_palette: [
      { hex: "#EC4899", name: "Signature Pink" },
      { hex: "#8B5CF6", name: "Purple Vibe" },
      { hex: "#3B82F6", name: "Sky Blue" },
      { hex: "#F3F4F6", name: "Clean White" },
    ],
    markdown: `# CREATOR PROFILE

## Platform Reach
**Instagram:** 2.4M followers
**TikTok:** 3.8M followers
**YouTube:** 1.2M subscribers
**Total Audience:** 7.4M across platforms

## Content Focus
- Wellness & mindfulness
- Sustainable fashion
- Travel & lifestyle
- Healthy cooking & nutrition

## Audience Demographics
- **Age Range:** 18-34 (65%)
- **Gender:** 78% Female, 22% Male
- **Top Locations:** US, UK, Canada, Australia
- **Engagement Rate:** 8.2% (Industry avg: 2.3%)

## Brand Collaborations
Previous partnerships with leading wellness, fashion, and lifestyle brands. Known for authentic content that resonates with audience values.

## Content Offerings
- **Instagram:** Daily stories, feed posts, Reels
- **TikTok:** Trending content, behind-the-scenes
- **YouTube:** Long-form vlogs, tutorials, Q&As

## Values & Mission
Creating content that inspires positive change, promotes mental wellness, and encourages sustainable living.

## Partnership Opportunities
Open to brand collaborations that align with content pillars and audience interests. Prefer long-term partnerships over one-off campaigns.

## Contact
For business inquiries: team@sarahchen.com`,
  },
  executive: {
    title: "JENNIFER MARTINEZ",
    tagline: "Chief Executive Officer",
    tier: "pro",
    avatar: {
      fictional: {
        url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=640&q=80",
        alt: "Executive leader in boardroom attire",
      },
      personalized: {
        url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=640&q=80",
        alt: "Corporate professional walking through office",
      },
    },
    uniform: {
      default: "boardroom-foundation",
      options: [
        {
          id: "boardroom-foundation",
          name: "Boardroom Foundation",
          description: "Tailored charcoal suit included with every executive template.",
          tier: "free",
        },
        {
          id: "global-keynote",
          name: "Global Keynote",
          description: "Statement wardrobe paired with stage lighting for pro presenters.",
          tier: "pro",
        },
        {
          id: "future-forward",
          name: "Future Forward",
          description: "Elite-tier couture with kinetic LED backdrop for visionary summits.",
          tier: "elite",
        },
      ],
    },
    color_palette: [
      { hex: "#475569", name: "Corporate Gray" },
      { hex: "#1E293B", name: "Executive Black" },
      { hex: "#3B82F6", name: "Trust Blue" },
      { hex: "#F3F4F6", name: "Clean White" },
    ],
    markdown: `# EXECUTIVE PROFILE

## Professional Summary
Accomplished C-suite executive with 20+ years of experience driving organizational growth and transformation in the technology sector.

## Current Position
**Chief Executive Officer**
TechVision Global Corporation

## Key Achievements
- Led company through successful IPO in 2021
- Grew annual revenue from $500M to $2.1B in 5 years
- Expanded operations to 15 countries
- Implemented sustainability initiatives reducing carbon footprint by 40%

## Professional Experience

### CEO, TechVision Global (2019-Present)
Strategic leadership of 5,000+ employees across global operations.

### President & COO, DataCore Systems (2015-2019)
Oversaw operations, product development, and market expansion.

### VP of Strategy, InnovateTech (2010-2015)
Led corporate strategy and M&A initiatives.

## Education
- MBA, Harvard Business School
- BS Computer Science, MIT

## Board Positions
- Board Member, National Tech Council
- Advisory Board, Stanford Graduate School of Business
- Trustee, Global Innovation Foundation

## Speaking & Thought Leadership
Regular speaker at industry conferences on topics including digital transformation, leadership, and corporate sustainability.

## Media Inquiries
Please contact: press@techvisionglobal.com`,
  },
};

export default function TemplatePreview() {
  const { format } = useParams<{ format: string }>();
  const navigate = useNavigate();
  const { tier } = useSubscription();

  const template = format ? templateData[format] : null;
  const [avatarMode, setAvatarMode] = useState<"fictional" | "personal">("fictional");
  const [selectedUniform, setSelectedUniform] = useState<string>(() => template?.uniform.default ?? "");

  useEffect(() => {
    setAvatarMode("fictional");
    setSelectedUniform(template?.uniform.default ?? "");
  }, [format, template?.uniform.default]);

  if (!template) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Template not found</h1>
          <Button onClick={() => navigate("/gallery")}>Back to Gallery</Button>
        </div>
      </div>
    );
  }

  const canAccess = canAccessTemplate(tier, template.tier);
  const TemplateComponent = {
    ufc: UFCTemplate,
    team: TeamTemplate,
    military: MilitaryTemplate,
    nfl: NFLTemplate,
    influencer: InfluencerTemplate,
    executive: ExecutiveTemplate,
  }[format!];

  const uniformOptions = template.uniform.options;
  const activeUniform = useMemo(
    () => uniformOptions.find((option) => option.id === (selectedUniform || template.uniform.default)) ?? uniformOptions[0],
    [selectedUniform, template.uniform.default, uniformOptions],
  );
  const avatarSource = avatarMode === "personal"
    ? template.avatar.personalized ?? template.avatar.fictional
    : template.avatar.fictional;
  const showPersonalizationHint = avatarMode === "personal" && !template.avatar.personalized;

  const renderTierBadge = (optionTier: SubscriptionTier) => {
    if (optionTier === "free") return <Badge variant="secondary">Free</Badge>;
    if (optionTier === "pro") {
      return (
        <Badge variant="outline" className="gap-1">
          <Sparkles className="w-3 h-3" /> Pro Upgrade
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        <Lock className="w-3 h-3" /> Elite Unlock
      </Badge>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Preview Banner */}
      <div className="bg-surface/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/gallery")}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Gallery
              </Button>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="capitalize">
                  {format} Template
                </Badge>
                {template.tier !== "free" && (
                  <Badge variant="outline" className="gap-1">
                    {template.tier === "pro" && <Sparkles className="w-3 h-3" />}
                    {template.tier === "elite" && <Lock className="w-3 h-3" />}
                    {template.tier.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!canAccess ? (
                <Button asChild>
                  <Link to="/pricing">
                    <Lock className="w-4 h-4 mr-2" />
                    Upgrade to Use
                  </Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/create">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Use This Template
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Avatar + Uniform Controls */}
      <div className="border-b border-border/60 bg-background/80">
        <div className="container mx-auto px-6 py-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-3xl border border-border/70 bg-surface/80 p-6 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-heading text-xl font-semibold">Avatar presentation</h3>
                  <p className="text-sm text-muted-foreground">
                    Swap between the platform generated body kit or map your own face from Profile → Avatar &amp; Media.
                  </p>
                </div>
                <Badge variant="secondary" className="uppercase tracking-wide">
                  {avatarMode === "personal" ? "Personal" : "Fictional"}
                </Badge>
              </div>
              <div className="mt-4 flex gap-3">
                <Button
                  variant={avatarMode === "fictional" ? "default" : "outline"}
                  onClick={() => setAvatarMode("fictional")}
                  className="flex-1"
                >
                  Platform avatar
                </Button>
                <Button
                  variant={avatarMode === "personal" ? "default" : "outline"}
                  onClick={() => setAvatarMode("personal")}
                  className="flex-1"
                >
                  Use my face
                </Button>
              </div>
              {avatarMode === "personal" && (
                <p className="mt-3 text-xs text-muted-foreground">
                  We’ll automatically blend your uploaded portrait into this template’s wardrobe. Update your wardrobe tiers in the Player Profile locker to change outfits globally.
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-border/70 bg-surface/80 p-6 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-heading text-xl font-semibold">Uniform loadout</h3>
                  <p className="text-sm text-muted-foreground">
                    Base looks are free. Premium fits unlock in the Shop or with higher membership tiers.
                  </p>
                </div>
                <Button variant="link" className="px-0" asChild>
                  <Link to="/shop">Visit Shop</Link>
                </Button>
              </div>
              <div className="mt-4 space-y-3">
                <RadioGroup value={activeUniform.id} onValueChange={setSelectedUniform}>
                  {uniformOptions.map((option) => {
                    const optionId = `${option.id}-option`;
                    const isSelected = activeUniform.id === option.id;
                    return (
                      <Label
                        key={option.id}
                        htmlFor={optionId}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition hover:border-primary/40 hover:bg-primary/5 ${
                          isSelected ? "border-primary/60 bg-primary/10" : "border-border/70 bg-surface/60"
                        }`}
                      >
                        <RadioGroupItem id={optionId} value={option.id} className="mt-1" />
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{option.name}</span>
                            {renderTierBadge(option.tier)}
                          </div>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                      </Label>
                    );
                  })}
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  Currently selected: <span className="font-medium text-foreground">{activeUniform.name}</span>. Syncs with Player Profile → Wardrobe Path.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Template Preview */}
      {TemplateComponent && (
        <TemplateComponent
          title={template.title}
          tagline={template.tagline}
          logo_url={template.logo_url}
          color_palette={template.color_palette}
          markdown={template.markdown}
          avatar={{
            url: avatarSource.url,
            alt: avatarSource.alt,
            mode: avatarMode,
            showPersonalizationHint: showPersonalizationHint,
          }}
        />
      )}
    </div>
  );
}
