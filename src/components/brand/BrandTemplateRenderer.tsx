import { forwardRef } from "react";
import ReactMarkdown from "react-markdown";
import { UFCTemplate } from "@/components/templates/UFCTemplate";
import { TeamTemplate } from "@/components/templates/TeamTemplate";
import { MilitaryTemplate } from "@/components/templates/MilitaryTemplate";
import { NFLTemplate } from "@/components/templates/NFLTemplate";
import { InfluencerTemplate } from "@/components/templates/InfluencerTemplate";
import { ExecutiveTemplate } from "@/components/templates/ExecutiveTemplate";
import { getTemplateImage } from "@/lib/images/template-images";

const templateComponents: Record<string, any> = {
  ufc: UFCTemplate,
  team: TeamTemplate,
  military: MilitaryTemplate,
  nfl: NFLTemplate,
  influencer: InfluencerTemplate,
  executive: ExecutiveTemplate,
};

interface BrandTemplateRendererProps {
  brand: any;
  markdown: string;
}

export const BrandTemplateRenderer = forwardRef<HTMLDivElement, BrandTemplateRendererProps>(
  ({ brand, markdown }, ref) => {
    const parsedRawContext = (() => {
      if (!brand?.raw_context) return null;
      if (typeof brand.raw_context === "string") {
        try {
          const parsed = JSON.parse(brand.raw_context);
          return parsed && typeof parsed === "object" ? parsed : null;
        } catch (error) {
          console.warn("Failed to parse brand raw_context", error);
          return null;
        }
      }
      if (typeof brand.raw_context === "object") {
        return brand.raw_context as Record<string, unknown>;
      }
      return null;
    })();

    const resolveFormatPreset = () => {
      const preset =
        brand?.format_preset ||
        (parsedRawContext?.format_preset as string | undefined) ||
        (parsedRawContext?.format as string | undefined);

      return typeof preset === "string" ? preset.toLowerCase() : undefined;
    };

    const normalizePalette = (palette: unknown): Array<{ hex: string; name?: string }> => {
      if (Array.isArray(palette)) {
        return palette as Array<{ hex: string; name?: string }>;
      }

      if (typeof palette === "string") {
        try {
          const parsed = JSON.parse(palette);
          return Array.isArray(parsed) ? (parsed as Array<{ hex: string; name?: string }>) : [];
        } catch (error) {
          console.warn("Failed to parse color palette", error);
          return [];
        }
      }

      return [];
    };

    const formatPreset = resolveFormatPreset();
    const TemplateComponent = formatPreset ? templateComponents[formatPreset] : undefined;
    const title = brand?.title || brand?.tagline || "Untitled Brand";
    const tagline = brand?.tagline || (parsedRawContext?.tagline as string | undefined);
    const logoUrl = brand?.logo_url || (parsedRawContext?.logo_url as string | undefined);
    const colorPalette = normalizePalette(brand?.color_palette ?? parsedRawContext?.color_palette);
    
    // Ensure we have some markdown content
    const displayMarkdown = markdown || `# ${title}\n\n${tagline || 'No content available yet.'}`;
    
    // Get template-appropriate images
    const avatarImage = formatPreset ? getTemplateImage(
      formatPreset, 
      'avatar', 
      brand?.avatar_url || parsedRawContext?.avatar_url as string | undefined,
      false
    ) : null;

    const content = TemplateComponent ? (
      <TemplateComponent
        title={title}
        tagline={tagline}
        logo_url={logoUrl}
        color_palette={colorPalette}
        markdown={displayMarkdown}
        avatar={avatarImage ? {
          url: avatarImage.url,
          alt: avatarImage.alt,
          mode: brand?.avatar_url ? "personal" : "fictional",
          showPersonalizationHint: !brand?.avatar_url
        } : undefined}
      />
    ) : (
      <div className="min-h-screen bg-background py-8">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="bg-surface border border-border rounded-2xl p-8 shadow-lg">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">{title}</h1>
                {tagline && <p className="text-muted-foreground">{tagline}</p>}
              </div>
              {logoUrl && (
                <img src={logoUrl} alt="Brand logo" className="h-20 w-20 object-contain" />
              )}
            </div>

            {colorPalette.length > 0 && (
              <div className="flex gap-2 mb-6">
                {colorPalette.map((swatch: any, idx: number) => (
                  <div
                    key={idx}
                    className="w-12 h-12 rounded-lg border border-border shadow-sm"
                    style={{ background: swatch.hex }}
                    title={swatch.name ? `${swatch.name}: ${swatch.hex}` : swatch.hex}
                  />
                ))}
              </div>
            )}

            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>{displayMarkdown}</ReactMarkdown>
            </div>

            <div className="mt-8 pt-6 border-t border-border text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <div>Format: {formatPreset || "Custom"}</div>
                {brand?.created_at && (
                  <div>Created: {new Date(brand.created_at).toLocaleDateString()}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    return <div ref={ref}>{content}</div>;
  },
);

BrandTemplateRenderer.displayName = "BrandTemplateRenderer";
