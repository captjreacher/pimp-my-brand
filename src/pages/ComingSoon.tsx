import React from "react";
import logo from "@/images/logo.png";
import { Sparkles, Zap, FileText, Share2, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const ComingSoon = () => {
  const [isFormLoaded, setIsFormLoaded] = React.useState(false);
  const formContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = formContainerRef.current;
    if (container) {
      initializeMailerLiteForm(container);
    }
  }, []);

  const initializeMailerLiteForm = (container: HTMLDivElement) => {
    // Clear any existing content
    container.innerHTML = '';

    // Create a simple HTML form that posts to MailerLite
    const form = document.createElement("form");
    form.action = "https://assets.mailerlite.com/jsonp/1849787/forms/YOUR_FORM_ID/subscribe"; // Replace YOUR_FORM_ID
    form.method = "post";
    form.className = "space-y-4";

    form.innerHTML = `
      <div>
        <input
          type="email"
          name="fields[email]"
          placeholder="Enter your email"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>
      <button
        type="submit"
        class="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
      >
        Join Waitlist
      </button>
      <p class="text-xs text-muted-foreground text-center">
        We respect your privacy. Unsubscribe at any time.
      </p>
    `;

    container.appendChild(form);
    setIsFormLoaded(true);
  };

  return (
    <div className="min-h-screen bg-background" style={{ backgroundColor: '#0a0a0a', color: '#ffffff' }}>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="gradient-hero absolute inset-0" />
        <div className="relative container mx-auto px-6 py-24 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex flex-col items-center gap-6 mb-10">
              <img src={logo} alt="Funk My Brand logo" className="h-20 w-auto rounded-full" />
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/60 backdrop-blur-sm border border-border">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Launching Soon</span>
              </div>
            </div>

            <h1 className="font-heading text-5xl lg:text-7xl font-bold mb-6 leading-tight" style={{ color: '#ffffff', fontSize: '3rem' }}>
              Funk up your brand in minutes
            </h1>

            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              We’re finishing an AI-powered studio that crafts your brand identity, visuals and CVs fast. Join the waitlist to get early access and launch perks.
            </p>

            {/* Waitlist form */}
            <div className="mx-auto max-w-xl">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg rounded-2xl"
                  >
                    Join Waitlist
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold mb-2">Join Our Waitlist</h3>
                    <p className="text-muted-foreground">Get early access to Funk My Brand</p>
                  </div>
                  <div ref={formContainerRef} className="min-h-[200px] flex items-center justify-center">
                    {!isFormLoaded && <div className="text-muted-foreground">Loading form...</div>}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </section>

      {/* Features (copied from Landing without links) */}
      <section className="py-24 bg-surface/30">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="font-heading text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-lg text-muted-foreground">From ingestion to export, we handle the entire brand generation pipeline.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard icon={<Zap className="w-6 h-6 text-primary" />} title="AI Brand Synthesis" description="Upload your content and our AI distills your unique voice, tone, and visual identity." />
            <FeatureCard icon={<FileText className="w-6 h-6 text-secondary" />} title="Multiple Formats" description="UFC Announcer, Military, Influencer, Team Captain—choose the style that fits your goal." />
            <FeatureCard icon={<Share2 className="w-6 h-6 text-accent" />} title="Export & Share" description="Download PDF, PNG hero images, or generate shareable links in one click." />
            <FeatureCard icon={<Users className="w-6 h-6 text-primary" />} title="Community Gallery" description="Publish your brand to the gallery and discover others' work." />
            <FeatureCard icon={<Shield className="w-6 h-6 text-secondary" />} title="Privacy First" description="Your data stays private by default. Share only what you want." />
            <FeatureCard icon={<Sparkles className="w-6 h-6 text-accent" />} title="Custom Styling" description="Edit colors, fonts, and logos live. Your brand, your rules." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center gradient-card border border-border rounded-3xl p-12 shadow-soft">
            <h2 className="font-heading text-4xl font-bold mb-6">We’re Almost Ready</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">Our team is finishing the experience that will help professionals, athletes, creators, and leaders craft compelling brand narratives in minutes.</p>
            <Button size="lg" disabled className="bg-primary/80 text-primary-foreground font-semibold px-8 py-6 text-lg rounded-2xl cursor-not-allowed">
              Coming Soon
            </Button>
          </div>
        </div>
      </section>

      {/* Footer (static text, no links) */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">Powered by <span className="text-primary font-semibold">Funk My Brand</span></div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <span className="opacity-70">Privacy</span>
              <span className="opacity-70">Terms</span>
              <span className="opacity-70">Contact</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div className="gradient-card border border-border rounded-2xl p-6">
    <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center mb-4">{icon}</div>
    <h3 className="font-heading text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default ComingSoon;
