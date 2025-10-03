import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Download, Share2, Edit } from "lucide-react";
import { UFCTemplate } from "@/components/templates/UFCTemplate";
import { TeamTemplate } from "@/components/templates/TeamTemplate";
import { MilitaryTemplate } from "@/components/templates/MilitaryTemplate";
import { NFLTemplate } from "@/components/templates/NFLTemplate";
import { InfluencerTemplate } from "@/components/templates/InfluencerTemplate";
import { ExecutiveTemplate } from "@/components/templates/ExecutiveTemplate";
import ReactMarkdown from "react-markdown";

export default function BrandView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [brand, setBrand] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBrand();
  }, [id]);

  const loadBrand = async () => {
    try {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setBrand(data);
    } catch (error: any) {
      console.error("Load error:", error);
      toast.error("Failed to load brand");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  if (!brand) return null;

  const markdown = brand.raw_context?.markdown || "# Brand Rider\n\nContent not available.";
  
  // Map format to template component
  const templateComponents: Record<string, any> = {
    ufc: UFCTemplate,
    team: TeamTemplate,
    military: MilitaryTemplate,
    nfl: NFLTemplate,
    influencer: InfluencerTemplate,
    executive: ExecutiveTemplate,
  };

  const TemplateComponent = templateComponents[brand.format_preset];

  return (
    <div className="min-h-screen">
      {/* Action Bar */}
      <div className="bg-surface/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Render with template if available, otherwise fallback to simple display */}
      {TemplateComponent ? (
        <TemplateComponent
          title={brand.title || brand.tagline || "Untitled Brand"}
          tagline={brand.tagline}
          logo_url={brand.logo_url}
          color_palette={brand.color_palette}
          markdown={markdown}
        />
      ) : (
        // Fallback for custom or unknown formats
        <div className="min-h-screen bg-background py-8">
          <div className="container max-w-5xl mx-auto px-4">
            <div className="bg-surface border border-border rounded-2xl p-8 shadow-lg">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    {brand.title || brand.tagline || "Untitled Brand"}
                  </h1>
                  {brand.tagline && <p className="text-muted-foreground">{brand.tagline}</p>}
                </div>
                {brand.logo_url && (
                  <img 
                    src={brand.logo_url} 
                    alt="Brand logo" 
                    className="h-20 w-20 object-contain"
                  />
                )}
              </div>

              {brand.color_palette && (
                <div className="flex gap-2 mb-6">
                  {brand.color_palette.map((swatch: any, idx: number) => (
                    <div
                      key={idx}
                      className="w-12 h-12 rounded-lg border border-border shadow-sm"
                      style={{ background: swatch.hex }}
                      title={`${swatch.name}: ${swatch.hex}`}
                    />
                  ))}
                </div>
              )}

              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>{markdown}</ReactMarkdown>
              </div>

              <div className="mt-8 pt-6 border-t border-border text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <div>Format: {brand.format_preset || "Custom"}</div>
                  <div>Created: {new Date(brand.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
