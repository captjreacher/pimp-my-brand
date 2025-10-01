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
  
  // Format-specific styling
  const formatStyles: Record<string, { bg: string; headerFont: string; headerColor: string }> = {
    ufc: {
      bg: "bg-gradient-to-br from-red-950 to-black",
      headerFont: "font-black uppercase tracking-wider",
      headerColor: "text-red-500"
    },
    team: {
      bg: "bg-gradient-to-br from-blue-950 to-slate-900",
      headerFont: "font-bold",
      headerColor: "text-blue-400"
    },
    solo: {
      bg: "bg-gradient-to-br from-purple-950 to-slate-900",
      headerFont: "font-semibold",
      headerColor: "text-purple-400"
    },
    military: {
      bg: "bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-green-900 via-slate-800 to-green-950",
      headerFont: "font-mono uppercase tracking-widest",
      headerColor: "text-green-400"
    },
    nfl: {
      bg: "bg-gradient-to-br from-orange-950 to-slate-900",
      headerFont: "font-black italic",
      headerColor: "text-orange-400"
    },
    influencer: {
      bg: "bg-gradient-to-br from-pink-900 via-purple-900 to-blue-900",
      headerFont: "font-bold",
      headerColor: "text-pink-400"
    },
    custom: {
      bg: "bg-gradient-to-br from-slate-800 to-slate-900",
      headerFont: "font-semibold",
      headerColor: "text-slate-300"
    }
  };

  const style = formatStyles[brand.format_preset] || formatStyles.custom;

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

        {/* Format Header Banner */}
        <div className={`${style.bg} rounded-t-2xl p-8 border-x-2 border-t-2 border-border overflow-hidden relative`}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className={`${style.headerFont} ${style.headerColor} text-3xl mb-2`}>
                {brand.title || brand.tagline}
              </h1>
              <p className="text-muted uppercase text-sm tracking-wide">
                {brand.format_preset} Format
              </p>
            </div>
            {brand.logo_url && (
              <img 
                src={brand.logo_url} 
                alt="Brand logo" 
                className="h-20 w-20 object-contain rounded-lg bg-white/10 backdrop-blur-sm p-2"
              />
            )}
          </div>
        </div>

        <div className="bg-surface/50 border-2 border-t-0 border-border rounded-b-2xl p-8 shadow-soft">
          {/* Color palette display */}
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
