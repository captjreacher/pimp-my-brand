import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GenerateStepProps {
  corpus: string;
  uploadIds: string[];
  format: string;
  onComplete: (brandId: string) => void;
}

export function GenerateStep({ corpus, uploadIds, format, onComplete }: GenerateStepProps) {
  const [generating, setGenerating] = useState(false);
  const [stage, setStage] = useState<string>("");

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

      // Stage 3: Brand Rider assembly
      setStage("Assembling your Brand Rider...");
      const riderRes = await supabase.functions.invoke("generate-brand-rider", {
        body: { styleData, visualData, format },
      });

      if (riderRes.error) throw riderRes.error;
      const { markdown } = riderRes.data;

      // Stage 4: Save to database
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
          raw_context: { uploadIds, markdown },
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast.success("Brand generated successfully!");
      onComplete(brand.id);
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Failed to generate brand");
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 text-center py-12">
      <Sparkles className="w-16 h-16 mx-auto text-primary animate-pulse" />
      <h2 className="font-heading text-3xl">Creating Your Brand</h2>
      <p className="text-muted max-w-md mx-auto">{stage}</p>
      {generating && (
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
      )}
    </div>
  );
}
