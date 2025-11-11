import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Sparkles, Users, Palette, ShieldCheck, Video, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/images/logo.png";

const benefits = [
  {
    title: "AI brand studio",
    description: "Upload highlights, bios, and media. Our AI shapes your unique story, voice, and value in minutes.",
    icon: Sparkles,
  },
  {
    title: "Polished assets",
    description: "Instantly generate CVs, hero graphics, and shareable profiles tuned for scouts, sponsors, and media.",
    icon: FileText,
  },
  {
    title: "Team-ready collaboration",
    description: "Invite coaches or agents, approve edits together, and publish with confidence.",
    icon: Users,
  },
];

const featureHighlights = [
  {
    title: "Tailored voice packs",
    description: "Choose from formats like Team Captain, Influencer, or Military to match the audience you want to impress.",
    icon: Palette,
  },
  {
    title: "Secure by default",
    description: "You decide what gets shared. Private projects stay locked until you publish.",
    icon: ShieldCheck,
  },
  {
    title: "Rich media embeds",
    description: "Drop in video highlights, stat sheets, and logos. We keep everything crisp and on-brand.",
    icon: Video,
  },
];

const testimonials = [
  {
    quote:
      "We pulled together a full sponsorship deck in under an hour. The AI voice pack nailed our tone on the first try.",
    name: "Jayden Cole",
    role: "Founder, Elevate Sports Group",
  },
  {
    quote:
      "My athletes now send one link that covers their entire story. Scouts love how polished it feels.",
    name: "Coach Ramirez",
    role: "NextGen Academy",
  },
];

const faqs = [
  {
    question: "Who is Funk My Brand for?",
    answer:
      "Athletes, creators, founders, and professionals who need a standout presence. If you pitch yourself to sponsors, clients, or recruiters, we built this for you.",
  },
  {
    question: "Do I need design skills?",
    answer:
      "Nope. Pick a vibe, add your story, and the studio handles layout, typography, and color palettes automatically.",
  },
  {
    question: "What can I export?",
    answer:
      "Download PDFs, hero graphics, brand riders, or publish a live page to share everywhere.",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(88,28,135,0.25),_transparent_60%)]" />
        <div className="relative container mx-auto px-6 py-24 lg:py-32 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="space-y-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
              <Sparkles className="h-4 w-4 text-primary" />
              The fastest way to a pro-ready personal brand
            </span>

            <div className="space-y-6">
              <h1 className="font-heading text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Build a magnetic brand that books deals and opportunities
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                Funk My Brand is your AI-powered creative team. Transform raw notes, stats, and highlights into a cohesive story
                with beautiful visuals, resumes, and shareable pages tailored to every audience.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button size="lg" className="h-12 px-8 text-base" asChild>
                <Link to="/create">
                  Start creating <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                <Link to="/gallery">Explore the gallery</Link>
              </Button>
            </div>

            <ul className="grid gap-4 sm:grid-cols-3">
              {benefits.map(({ title, description, icon: Icon }) => (
                <li key={title} className="rounded-2xl border border-border bg-background/70 p-5 shadow-sm">
                  <Icon className="mb-3 h-6 w-6 text-primary" />
                  <h3 className="font-semibold text-lg">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-border bg-surface p-8 shadow-2xl">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Funk My Brand" className="h-12 w-12 rounded-full border border-border" />
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground">Live preview</p>
                <p className="font-heading text-xl">Player profile template</p>
              </div>
            </div>
            <div className="mt-8 space-y-4 text-sm">
              {[
                "AI writes introductions that sound like you",
                "Drop in stats, highlights, and achievements",
                "Download brand riders and CVs instantly",
              ].map(item => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-secondary" />
                  <p className="leading-relaxed text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5 text-sm text-muted-foreground">
              Invite-only beta is rolling out. Claim your spot and we’ll notify you as soon as your studio is ready.
            </div>
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="container mx-auto grid gap-10 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <h2 className="font-heading text-3xl sm:text-4xl">All your branding assets in one flow</h2>
          <p className="text-lg text-muted-foreground">
            Upload once and unlock everything you need—from tone of voice and key messaging to polished collateral. The studio keeps
            your content consistent across formats.
          </p>
          <div className="space-y-4 rounded-3xl border border-border bg-surface p-6 shadow-sm">
            <h3 className="font-semibold text-lg">Your workflow</h3>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3"><span className="font-medium text-foreground">1.</span> Collect notes, stats, and footage in the uploader.</li>
              <li className="flex gap-3"><span className="font-medium text-foreground">2.</span> Pick a format and customize tone, colors, and imagery.</li>
              <li className="flex gap-3"><span className="font-medium text-foreground">3.</span> Publish to the gallery, download assets, or share a live link.</li>
            </ol>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {featureHighlights.map(({ title, description, icon: Icon }) => (
            <div key={title} className="rounded-2xl border border-border bg-background p-6 shadow-sm">
              <Icon className="h-6 w-6 text-secondary" />
              <h3 className="mt-4 font-semibold text-lg">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-surface/60 py-20">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-heading text-3xl sm:text-4xl">Trusted by storytellers and playmakers</h2>
            <p className="mt-4 text-muted-foreground">
              Early teams are closing deals faster with shareable, on-brand materials for every opportunity.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {testimonials.map(({ quote, name, role }) => (
              <blockquote key={name} className="rounded-3xl border border-border bg-background/80 p-8 text-left shadow-sm">
                <p className="text-lg leading-relaxed">“{quote}”</p>
                <footer className="mt-6 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{name}</span> · {role}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl sm:text-4xl">Answers before you dive in</h2>
          <p className="mt-4 text-muted-foreground">Everything you need to know before building your first brand drop.</p>
        </div>
        <dl className="mx-auto mt-12 grid max-w-3xl gap-6">
          {faqs.map(({ question, answer }) => (
            <div key={question} className="rounded-2xl border border-border bg-background/80 p-6 shadow-sm">
              <dt className="font-semibold text-lg">{question}</dt>
              <dd className="mt-2 text-sm text-muted-foreground leading-relaxed">{answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-border bg-gradient-to-b from-primary/10 via-background to-background py-20">
        <div className="container mx-auto px-6">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 rounded-3xl border border-border bg-background/90 p-12 text-center shadow-lg backdrop-blur">
            <h2 className="font-heading text-3xl sm:text-4xl">Ready to funk up your brand?</h2>
            <p className="max-w-2xl text-muted-foreground">
              Join the creators already turning raw notes into deal-winning stories. Start your first project for free and upgrade when you’re ready to share.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" className="h-12 px-8 text-base" asChild>
                <Link to="/auth">Create an account</Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                <Link to="/pricing">See pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
