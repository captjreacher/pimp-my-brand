import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, FileText, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GenerateStepProps {
  corpus: string;
  uploadIds: string[];
  format: string;
  logoUrl?: string | null;
  onComplete: (brandId: string, cvId?: string) => void;
  onBrandDataGenerated?: (data: any) => void;
}

export function GenerateStep({ corpus, uploadIds, format, logoUrl, onComplete, onBrandDataGenerated }: GenerateStepProps) {
  const [generating, setGenerating] = useState(false);
  const [stage, setStage] = useState<string>("");
  const [brandGenerated, setBrandGenerated] = useState(false);
  const [brandId, setBrandId] = useState<string>("");
  const [generateCV, setGenerateCV] = useState(false);
  const [showCVOption, setShowCVOption] = useState(false);

  useEffect(() => {
    generateBrand();
  }, []);

  const generateBrand = async () => {
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Stage 1: Style synthesis
      setStage("Analyzing your writing style...");
      const styleRes = await supabase.functions.invoke("generate-style", {
        body: { corpus },
      });

      if (styleRes.error) throw styleRes.error;
      const styleData = styleRes.data;

      // Stage 2: Visual synthesis
      setStage("Creating visual identity...");
      const visualRes = await supabase.functions.invoke("generate-visual", {
        body: {
          keywords: styleData.tone?.adjectives || [],
          roleTags: [],
          bio: styleData.bio || "",
        },
      });

      if (visualRes.error) throw visualRes.error;
      const visualData = visualRes.data;

      // Notify parent of brand data for logo step
      if (onBrandDataGenerated) {
        onBrandDataGenerated({ ...styleData, ...visualData });
      }

      // Stage 3: Brand Rider assembly
      setStage("Assembling your Brand Rider...");
      const riderRes = await supabase.functions.invoke("generate-brand-rider", {
        body: { styleData, visualData, format },
      });

      if (riderRes.error) throw riderRes.error;
      const { markdown } = riderRes.data;

      // Stage 4: Save brand to database
      setStage("Saving your brand...");
      const { data: brand, error: dbError } = await supabase
        .from("brands")
        .insert({
          user_id: user.id,
          title: styleData.tagline || "My Brand",
          tagline: styleData.tagline,
          tone_notes: JSON.stringify(styleData.tone),
          signature_phrases: styleData.signature_phrases,
          strengths: styleData.strengths,
          weaknesses: styleData.weaknesses,
          bio: styleData.bio,
          color_palette: visualData.palette,
          fonts: visualData.fonts,
          format_preset: format,
          logo_url: logoUrl,
          raw_context: { uploadIds, markdown, styleData, visualData },
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setBrandId(brand.id);
      setBrandGenerated(true);
      setGenerating(false);
      setShowCVOption(true);
      toast.success("Brand generated successfully!");
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Failed to generate brand");
      setGenerating(false);
    }
  };

  const handleGenerateCV = async () => {
    if (!brandId) return;
    
    setGenerating(true);
    setGenerateCV(true);
    setShowCVOption(false);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get the brand data to extract style and visual data
      const { data: brand, error: brandError } = await supabase
        .from("brands")
        .select("*")
        .eq("id", brandId)
        .single();

      if (brandError) throw brandError;

      const rawContext = brand.raw_context as any;
      const styleData = rawContext?.styleData;
      const visualData = rawContext?.visualData;

      if (!styleData) throw new Error("Style data not found");

      // Get user profile for CV generation
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const userProfile = {
        name: profile?.display_name || "Professional Name",
        role: profile?.role_tags?.[0] || "Professional",
        bio: profile?.bio || styleData.bio,
        links: profile?.socials ? Object.entries(profile.socials).map(([label, url]) => ({ label, url: url as string })) : []
      };

      // Stage 5: CV generation
      setStage("Generating your professional CV...");
      const cvRes = await supabase.functions.invoke("generate-cv", {
        body: {
          styleData,
          extractedText: corpus,
          format,
          userProfile
        },
      });

      if (cvRes.error) throw cvRes.error;
      const cvData = cvRes.data;

      // Stage 6: Save CV to database
      setStage("Saving your CV...");
      const { data: cv, error: cvDbError } = await supabase
        .from("cvs")
        .insert({
          user_id: user.id,
          title: `${cvData.name} - CV`,
          summary: cvData.summary,
          experience: cvData.experience,
          skills: cvData.skills,
          links: cvData.links,
          format_preset: format,
        })
        .select()
        .single();

      if (cvDbError) throw cvDbError;

      toast.success("CV generated successfully!");
      onComplete(brandId, cv.id);
    } catch (error: any) {
      console.error("CV generation error:", error);
      toast.error(error.message || "Failed to generate CV");
      setGenerating(false);
      setShowCVOption(true);
    }
  };

  const handleSkipCV = () => {
    onComplete(brandId);
  };

  if (showCVOption && brandGenerated) {
    return (
      <div className="space-y-8 text-center py-12">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-heading text-3xl">Brand Created Successfully!</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your Brand Rider is ready. Would you also like to generate a professional CV using the same style and format?
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
          <Button
            onClick={handleGenerateCV}
            className="flex items-center gap-2"
            disabled={generating}
          >
            <FileText className="w-4 h-4" />
            Generate CV
          </Button>
          <Button
            variant="outline"
            onClick={handleSkipCV}
            disabled={generating}
          >
            Skip for Now
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          You can always generate a CV later from your dashboard
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center py-12">
      <div className="relative">
        {generateCV ? (
          <FileText className="w-16 h-16 mx-auto text-primary animate-pulse" />
        ) : (
          <Sparkles className="w-16 h-16 mx-auto text-primary animate-pulse" />
        )}
      </div>
      <h2 className="font-heading text-3xl">
        {generateCV ? "Creating Your CV" : "Creating Your Brand"}
      </h2>
      <p className="text-muted-foreground max-w-md mx-auto">{stage}</p>
      {generating && (
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
      )}
    </div>
  );
}
