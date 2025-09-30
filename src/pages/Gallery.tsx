import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink } from "lucide-react";

interface Brand {
  id: string;
  title: string;
  tagline: string;
  format_preset: string;
  created_at: string;
}

const Gallery = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicBrands();
  }, []);

  const fetchPublicBrands = async () => {
    try {
      const { data, error } = await supabase
        .from("brands")
        .select("id, title, tagline, format_preset, created_at")
        .eq("visibility", "public")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      console.error("Error fetching brands:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBrands = brands.filter(
    (brand) =>
      brand.title?.toLowerCase().includes(search.toLowerCase()) ||
      brand.tagline?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-2xl font-bold">Community Gallery</h1>
            <Button asChild variant="outline" className="gap-2">
              <Link to="/dashboard">
                Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 py-6 bg-surface border-border rounded-xl"
            />
          </div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="text-center text-muted-foreground py-12">
            Loading gallery...
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            {search ? "No brands match your search." : "No public brands yet."}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {filteredBrands.map((brand) => (
              <div
                key={brand.id}
                className="gradient-card border border-border rounded-2xl p-6 hover:shadow-soft transition-shadow"
              >
                <div className="mb-4">
                  <div className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium mb-3">
                    {brand.format_preset || "Custom"}
                  </div>
                  <h3 className="font-heading text-xl font-semibold mb-2">
                    {brand.title || "Untitled Brand"}
                  </h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {brand.tagline || "No tagline"}
                  </p>
                </div>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                >
                  <Link to={`/brand/${brand.id}`}>
                    View Brand
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
