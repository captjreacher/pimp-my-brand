import logo from "@/images/logo.png";
import { Sparkles } from "lucide-react";

const ComingSoon = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="gradient-hero absolute inset-0" />
      <div className="relative flex flex-col items-center gap-6 mb-10 text-center">
        <img src={logo} alt="Maximised AI logo" className="h-16 w-auto" />
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/60 backdrop-blur-sm border border-border">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Launching Soon</span>
        </div>
        <h1 className="font-heading text-5xl lg:text-7xl font-bold leading-tight">
          Your Brand Experience Is Nearly Here
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          We&apos;re putting the final touches on Maximised AI. Check back soon to be among the first to craft your story.
        </p>
      </div>
    </div>
  );
};

export default ComingSoon;
