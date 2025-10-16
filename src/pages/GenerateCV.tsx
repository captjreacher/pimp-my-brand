import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Home, AlertCircle } from "lucide-react";
import { CVSourceStep } from "@/components/wizard/CVSourceStep";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function GenerateCV() {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const [brand, setBrand] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (brandId) {
      fetchBrand();
    }
  }, [brandId]);

  const fetchBrand = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .eq("id", brandId)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setBrand(data);
    } catch (error: any) {
      console.error("Error fetching brand:", error);
      setError("Failed to load brand information");
    } finally {
      setLoading(false);
    }
  };

  const handleCVSourceComplete = async (selectedUploadIds: string[], additionalCorpus: string) => {
    if (!brand) return;

    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const rawContext = brand.raw_context as any;
      const styleData = rawContext?.styleData;

      if (!styleData) throw new Error("Brand style data not found");

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

      // Get the original brand corpus
      const originalCorpus = rawContext?.uploadIds ? 
        (await Promise.all(
          rawContext.uploadIds.map(async (uploadId: string) => {
            const { data } = await supabase
              .from("uploads")
              .select("extracted_text")
              .eq("id", uploadId)
              .single();
            return data?.extracted_text || "";
          })
        )).join('\n\n') : "";

      // Combine original brand corpus with additional corpus
      const combinedCorpus = originalCorpus + (additionalCorpus ? '\n\n' + additionalCorpus : '');

      // Generate CV
      const cvRes = await supabase.functions.invoke("generate-cv", {
        body: {
          styleData,
          extractedText: combinedCorpus,
          format: brand.format_preset,
          userProfile,
          sourceUploadIds: selectedUploadIds
        },
      });

      if (cvRes.error) throw cvRes.error;
      const cvData = cvRes.data;

      // Save CV to database
      const { data: cv, error: cvDbError } = await supabase
        .from("cvs")
        .insert({
          user_id: user.id,
          title: `${cvData.name} - CV`,
          summary: cvData.summary,
          experience: cvData.experience,
          skills: cvData.skills,
          links: cvData.links,
          format_preset: brand.format_preset,
        })
        .select()
        .single();

      if (cvDbError) throw cvDbError;

      toast.success("CV generated successfully!");
      navigate(`/cv/${cv.id}`);
    } catch (error: any) {
      console.error("CV generation error:", error);
      setError(error.message || "Failed to generate CV");
      toast.error(error.message || "Failed to generate CV");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading brand information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="bg-surface/50 border border-border rounded-2xl p-8 shadow-lg">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              
              <div className="space-y-2">
                <h2 className="font-heading text-3xl text-foreground">Brand Not Found</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {error || "The brand you're trying to generate a CV from could not be found."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <Button onClick={() => navigate("/dashboard")} className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Go to Dashboard
                </Button>
                <Button variant="outline" onClick={() => navigate("/")} className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="bg-surface/50 border border-border rounded-2xl p-8 shadow-lg">
            <div className="text-center py-12 space-y-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <div className="space-y-2">
                <h2 className="font-heading text-3xl">Generating Your CV</h2>
                <p className="text-muted-foreground">
                  Creating a professional CV using your brand style...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/brand/${brandId}`)}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Brand
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>

        <div className="bg-surface/50 border border-border rounded-2xl p-8 shadow-lg">
          <div className="mb-6">
            <h1 className="font-heading text-3xl mb-2">Generate CV from Brand</h1>
            <p className="text-muted-foreground">
              Using style from: <span className="font-medium">{brand.title}</span>
            </p>
          </div>

          <CVSourceStep
            brandCorpus={brand.raw_context?.markdown || ""}
            brandUploadIds={brand.raw_context?.uploadIds || []}
            onComplete={handleCVSourceComplete}
          />
        </div>
      </div>
    </div>
  );
}