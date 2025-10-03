import { forwardRef } from "react";
import ReactMarkdown from "react-markdown";
import { UFCTemplate } from "@/components/templates/UFCTemplate";
import { TeamTemplate } from "@/components/templates/TeamTemplate";
import { MilitaryTemplate } from "@/components/templates/MilitaryTemplate";
import { NFLTemplate } from "@/components/templates/NFLTemplate";
import { InfluencerTemplate } from "@/components/templates/InfluencerTemplate";
import { ExecutiveTemplate } from "@/components/templates/ExecutiveTemplate";

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
    const TemplateComponent = brand?.format_preset ? templateComponents[brand.format_preset] : undefined;
    const title = brand?.title || brand?.tagline || "Untitled Brand";

    const content = TemplateComponent ? (
      <TemplateComponent
        title={title}
        tagline={brand?.tagline}
        logo_url={brand?.logo_url}
        color_palette={brand?.color_palette}
        markdown={markdown}
      />
    ) : (
      <div className="min-h-screen bg-background py-8">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="bg-surface border border-border rounded-2xl p-8 shadow-lg">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">{title}</h1>
                {brand?.tagline && <p className="text-muted-foreground">{brand.tagline}</p>}
              </div>
              {brand?.logo_url && (
                <img src={brand.logo_url} alt="Brand logo" className="h-20 w-20 object-contain" />
              )}
            </div>

            {Array.isArray(brand?.color_palette) && brand.color_palette.length > 0 && (
              <div className="flex gap-2 mb-6">
                {brand.color_palette.map((swatch: any, idx: number) => (
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
              <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>

            <div className="mt-8 pt-6 border-t border-border text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <div>Format: {brand?.format_preset || "Custom"}</div>
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
