import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, FileText, Share2, Users, Shield } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="gradient-hero absolute inset-0" />
        
        <div className="relative container mx-auto px-6 py-24 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/60 backdrop-blur-sm border border-border mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">AI-Powered Personal Branding</span>
            </div>
            
            <h1 className="font-heading text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              Your Brand,
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary"> Maximised</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Generate professional brand identities and CVs instantly. Choose from UFC, Military, Influencer, and more presentation formats.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg rounded-2xl shadow-glow"
              >
                <Link to="/auth">Generate Your Brand</Link>
              </Button>
              
              <Button 
                asChild 
                variant="outline" 
                size="lg"
                className="border-border hover:bg-surface/80 font-semibold px-8 py-6 text-lg rounded-2xl"
              >
                <Link to="/gallery">Browse Gallery</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-surface/30">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="font-heading text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-lg text-muted-foreground">
              From ingestion to export, we handle the entire brand generation pipeline.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon={<Zap className="w-6 h-6 text-primary" />}
              title="AI Brand Synthesis"
              description="Upload your content and our AI distills your unique voice, tone, and visual identity."
            />
            
            <FeatureCard
              icon={<FileText className="w-6 h-6 text-secondary" />}
              title="Multiple Formats"
              description="UFC Announcer, Military, Influencer, Team Captain—choose the style that fits your goal."
            />
            
            <FeatureCard
              icon={<Share2 className="w-6 h-6 text-accent" />}
              title="Export & Share"
              description="Download PDF, PNG hero images, or generate shareable links in one click."
            />
            
            <FeatureCard
              icon={<Users className="w-6 h-6 text-primary" />}
              title="Community Gallery"
              description="Publish your brand to the gallery and discover others' work."
            />
            
            <FeatureCard
              icon={<Shield className="w-6 h-6 text-secondary" />}
              title="Privacy First"
              description="Your data stays private by default. Share only what you want."
            />
            
            <FeatureCard
              icon={<Sparkles className="w-6 h-6 text-accent" />}
              title="Custom Styling"
              description="Edit colors, fonts, and logos live. Your brand, your rules."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center gradient-card border border-border rounded-3xl p-12 shadow-soft">
            <h2 className="font-heading text-4xl font-bold mb-6">Ready to Build Your Brand?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join professionals, athletes, creators, and leaders who trust our platform to craft compelling brand narratives.
            </p>
            <Button 
              asChild 
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg rounded-2xl shadow-glow"
            >
              <Link to="/auth">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Powered by <span className="text-primary font-semibold">Maximised AI</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition">Privacy</a>
              <a href="#" className="hover:text-foreground transition">Terms</a>
              <a href="#" className="hover:text-foreground transition">Contact</a>
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
  <div className="gradient-card border border-border rounded-2xl p-6 hover:shadow-soft transition-shadow">
    <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="font-heading text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default Landing;
