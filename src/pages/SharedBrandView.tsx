import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Loader2, ExternalLink } from "lucide-react";
import { BrandTemplateRenderer } from "@/components/brand/BrandTemplateRenderer";

interface ShareRecord {
  id: string;
  token: string;
  target_id: string;
  kind: string;
  created_at: string;
  expires_at: string | null;
  user_id: string;
}

export default function SharedBrandView() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [share, setShare] = useState<ShareRecord | null>(null);
  const [brand, setBrand] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const brandContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSharedBrand();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const parseRawContext = (rawContext: unknown) => {
    if (!rawContext) return null;

    if (typeof rawContext === "string") {
      try {
        const parsed = JSON.parse(rawContext);
        return parsed && typeof parsed === "object" ? parsed : null;
      } catch (error) {
        console.warn("Failed to parse shared brand raw_context", error);
        return null;
      }
    }

    if (typeof rawContext === "object") {
      return rawContext as Record<string, unknown>;
    }

    return null;
  };

  const loadSharedBrand = async () => {
    if (!token) {
      setError("Missing share token");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: shareError } = await supabase.rpc("get_share_by_token", {
        _token: token,
      });

      if (shareError) throw shareError;

      const record = data?.[0];

      if (!record) {
        setError("Share link not found");
        setLoading(false);
        return;
      }

      if (record.kind !== "brand") {
        setError("This share link is not valid for brand content");
        setLoading(false);
        return;
      }

      if (record.expires_at && new Date(record.expires_at) < new Date()) {
        setError("This share link has expired");
        setLoading(false);
        return;
      }

      const { data: brandData, error: brandError } = await supabase
        .from("brands")
        .select("*")
        .eq("id", record.target_id)
        .single();

      if (brandError) throw brandError;

      setShare(record);
      setBrand({
        ...brandData,
        raw_context: parseRawContext(brandData.raw_context),
      });
    } catch (err: any) {
      console.error("Shared view error:", err);
      setError(err?.message || "Unable to load shared brand");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-lg w-full">
          <CardContent className="p-6 space-y-4 text-center">
            <Alert variant="destructive">
              <Info className="w-4 h-4" />
              <AlertTitle>Link unavailable</AlertTitle>
              <AlertDescription>{error || "This brand is no longer accessible."}</AlertDescription>
            </Alert>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate("/")}>Return Home</Button>
              <Button variant="outline" asChild>
                <Link to="/gallery">Browse gallery</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const markdown = brand.raw_context?.markdown || "# Brand Rider\n\nContent not available.";

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-surface/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{brand.title || brand.tagline || "Brand Rider"}</h1>
            {brand.tagline && <p className="text-muted-foreground">{brand.tagline}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Shared brand</Badge>
            {share?.created_at && (
              <span className="text-xs text-muted-foreground">
                Shared on {new Date(share.created_at).toLocaleDateString()}
              </span>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link to={`/brand/${brand.id}`}>
                Edit in dashboard
                <ExternalLink className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <BrandTemplateRenderer ref={brandContentRef} brand={brand} markdown={markdown} />
    </div>
  );
}
