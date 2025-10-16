import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, FileText, Home, ArrowLeft, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { CVSourceStep } from "./CVSourceStep";

interface GenerateStepProps {
  corpus: string;
  uploadIds: string[];
  format: string;
  logoUrl?: string | null;
  onComplete: (brandId: string, cvId?: string) => void;
  onBrandDataGenerated?: (data: any) => void;
}

export function GenerateStep({ corpus, uploadIds, format, logoUrl, onComplete, onBrandDataGenerated }: GenerateStepProps) {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [stage, setStage] = useState<string>("");
  const [brandGenerated, setBrandGenerated] = useState(false);
  const [brandId, setBrandId] = useState<string>("");
  const [generateCV, setGenerateCV] = useState(false);
  const [showCVOption, setShowCVOption] = useState(false);
  const [showCVSourceStep, setShowCVSourceStep] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Removed auto-generation to prevent issues - now manual only

  const generateBrand = async () => {
    setGenerating(true);
    setError(null);
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
      const errorMessage = error.message || "Failed to generate brand";
      setError(errorMessage);
      toast.error(errorMessage);
      setGenerating(false);
    }
  };

  const handleStartCVGeneration = () => {
    setShowCVOption(false);
    setShowCVSourceStep(true);
  };

  const handleCVSourceComplete = async (selectedUploadIds: string[], additionalCorpus: string) => {
    if (!brandId) return;
    
    setGenerating(true);
    setGenerateCV(true);
    setShowCVSourceStep(false);
    
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
      const combinedCorpus = corpus + (additionalCorpus ? '\n\n' + additionalCorpus : '');
      const cvRes = await supabase.functions.invoke("generate-cv", {
        body: {
          styleData,
          extractedText: combinedCorpus,
          format,
          userProfile,
          sourceUploadIds: selectedUploadIds
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
      const errorMessage = error.message || "Failed to generate CV";
      setError(errorMessage);
      toast.error(errorMessage);
      setGenerating(false);
      setShowCVOption(true);
    }
  };

  const handleSkipCV = () => {
    onComplete(brandId);
  };

  const handleBackFromCVSource = () => {
    setShowCVSourceStep(false);
    setShowCVOption(true);
  };

  // Error state with navigation options
  if (error && !generating) {
    return (
      <div className="space-y-6 text-center py-12">
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <div className="space-y-2">
          <h2 className="font-heading text-3xl">Generation Failed</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            We encountered an error while generating your brand. This might be due to a temporary issue with our services.
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left max-w-md mx-auto">
          <p className="text-sm text-red-800 font-medium mb-2">Error Details:</p>
          <p className="text-xs text-red-700">{error}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
          <Button onClick={() => { setError(null); generateBrand(); }} className="flex items-center gap-2">
            Try Again
          </Button>
          <Button variant="outline" onClick={() => navigate("/dashboard")} className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Start Over
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          If this problem persists, please try uploading different content or contact support.
        </p>
      </div>
    );
  }

  // Show CV source selection step
  if (showCVSourceStep && brandGenerated) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackFromCVSource}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="font-heading text-2xl">Generate Your CV</h2>
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-3 py-1 rounded-full">
                <span className="text-sm font-medium text-primary">Step 4 of 4</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Using your brand style: <span className="font-medium text-foreground">{format.toUpperCase()}</span> format
            </p>
          </div>
        </div>
        
        <CVSourceStep
          brandCorpus={corpus}
          brandUploadIds={uploadIds}
          onComplete={handleCVSourceComplete}
        />
      </div>
    );
  }

  if (showCVOption && brandGenerated) {
    return (
      <div className="space-y-8 text-center py-12">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-heading text-3xl">Brand Created Successfully!</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
            Your Brand Rider is ready. Would you also like to generate a professional CV using the same style and format?
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 text-xs font-bold">✨</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-green-900 mb-1">
                  Smart CV Generation
                </p>
                <p className="text-xs text-green-700">
                  Choose from your uploaded documents and add more content for a comprehensive CV
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
          <Button
            onClick={handleStartCVGeneration}
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

  // Safety check - don't render if no corpus data
  if (!corpus || !corpus.trim()) {
    return (
      <div className="space-y-6 text-center py-12">
        <div className="text-red-500 mb-4">DEBUG: GenerateStep - No corpus data available</div>
        <h2 className="font-heading text-3xl">Missing Content</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          No content was provided for brand generation. Please go back and upload some files first.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
          <Button onClick={() => window.location.reload()}>
            Restart Process
          </Button>
          <Button variant="outline" onClick={() => navigate("/dashboard")} className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate("/")} className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  // Warn if corpus is very small
  if (corpus.length < 100) {
    return (
      <div className="space-y-6 text-center py-12">
        <div className="text-yellow-500 mb-4">DEBUG: GenerateStep - Corpus too small ({corpus.length} chars)</div>
        <h2 className="font-heading text-3xl">Limited Content</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          The uploaded content is very short ({corpus.length} characters). For better results, please upload more substantial content like resumes, writing samples, or project descriptions.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
          <Button onClick={generateBrand}>
            Generate Anyway
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Upload More Content
          </Button>
          <Button variant="outline" onClick={() => navigate("/dashboard")} className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center py-12">
      <div className="relative">
        {generateCV ? (
          <div className="relative">
            <FileText className="w-16 h-16 mx-auto text-primary animate-pulse" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xs">📄</span>
            </div>
          </div>
        ) : (
          <div className="relative">
            <Sparkles className="w-16 h-16 mx-auto text-primary animate-pulse" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-xs">✨</span>
            </div>
          </div>
        )}
      </div>
      <h2 className="font-heading text-3xl">
        {generateCV ? "Creating Your CV" : "Creating Your Brand"}
      </h2>
      <p className="text-muted-foreground max-w-md mx-auto mb-4">{stage}</p>
      {generating && (
        <div className="space-y-4">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 max-w-sm mx-auto">
            <p className="text-xs text-primary text-center">
              {generateCV ? "Analyzing documents and generating CV..." : "Processing your content..."}
            </p>
          </div>
        </div>
      )}
      
      {/* Debug info */}
      <div style={{ color: 'red', fontSize: '12px', marginTop: '20px' }}>
        DEBUG: Corpus length: {corpus.length}, UploadIds: {uploadIds.length}
      </div>
      
      {/* Manual trigger if auto-generation fails */}
      {!generating && (
        <Button onClick={generateBrand} className="mt-4">
          Start Brand Generation
        </Button>
      )}
    </div>
  );
}
