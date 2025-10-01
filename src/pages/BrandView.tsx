import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Download, Share2, Edit } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-bg py-8">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
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

        <div className="bg-surface/50 border border-border rounded-2xl p-8 shadow-soft">
          {/* Color palette display */}
          {brand.color_palette && (
            <div className="flex gap-2 mb-6">
              {brand.color_palette.map((swatch: any, idx: number) => (
                <div
                  key={idx}
                  className="w-12 h-12 rounded-lg border border-border"
                  style={{ background: swatch.hex }}
                  title={`${swatch.name}: ${swatch.hex}`}
                />
              ))}
            </div>
          )}

          {/* Markdown content */}
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </div>

          {/* Metadata */}
          <div className="mt-8 pt-6 border-t border-border text-sm text-muted">
            <div className="flex items-center justify-between">
              <div>Format: {brand.format_preset}</div>
              <div>Created: {new Date(brand.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
