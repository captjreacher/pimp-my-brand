import ReactMarkdown from "react-markdown";

interface TemplateProps {
  title: string;
  tagline?: string;
  logo_url?: string;
  color_palette?: Array<{ hex: string; name: string }>;
  markdown: string;
}

export const TeamTemplate = ({ title, tagline, logo_url, color_palette, markdown }: TemplateProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950">
      {/* Header with Team Badge Style */}
      <div className="relative bg-gradient-to-r from-blue-900/80 to-blue-800/80 backdrop-blur-sm border-b-4 border-blue-500">
        <div className="container mx-auto px-6 py-10">
          <div className="flex items-center gap-8">
            {logo_url && (
              <div className="shrink-0">
                <div className="w-28 h-28 rounded-full bg-white p-4 shadow-2xl ring-4 ring-blue-400">
                  <img src={logo_url} alt="Logo" className="w-full h-full object-contain" />
                </div>
              </div>
            )}
            <div className="flex-1">
              <h1 className="font-bold text-4xl md:text-5xl text-blue-100 mb-2">
                {title}
              </h1>
              {tagline && (
                <p className="text-lg text-blue-200/90 font-medium">
                  {tagline}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Color Palette */}
        {color_palette && color_palette.length > 0 && (
          <div className="mb-10 flex gap-3 justify-center">
            {color_palette.map((swatch, idx) => (
              <div key={idx} className="text-center">
                <div
                  className="w-14 h-14 rounded-lg border-2 border-blue-400/50 shadow-lg mb-2"
                  style={{ background: swatch.hex }}
                />
                <span className="text-xs text-blue-200">{swatch.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Content Card */}
        <div className="bg-slate-800/60 backdrop-blur-sm border border-blue-700/30 rounded-xl p-8 md:p-12 shadow-xl">
          <div className="prose prose-invert prose-lg max-w-none prose-headings:text-blue-300 prose-headings:font-bold prose-strong:text-blue-200 prose-a:text-blue-400">
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};
