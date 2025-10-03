import ReactMarkdown from "react-markdown";

interface TemplateProps {
  title: string;
  tagline?: string;
  logo_url?: string;
  color_palette?: Array<{ hex: string; name: string }>;
  markdown: string;
}

export const ExecutiveTemplate = ({ title, tagline, logo_url, color_palette, markdown }: TemplateProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Professional Header */}
      <div className="bg-gradient-to-b from-slate-800 to-transparent border-b border-slate-700">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center gap-8 max-w-5xl mx-auto">
            {logo_url && (
              <div className="shrink-0">
                <div className="w-24 h-24 rounded-xl bg-slate-700/50 p-4 border border-slate-600">
                  <img src={logo_url} alt="Logo" className="w-full h-full object-contain" />
                </div>
              </div>
            )}
            <div className="flex-1">
              <h1 className="font-semibold text-4xl md:text-5xl text-slate-100 mb-2 tracking-tight">
                {title}
              </h1>
              {tagline && (
                <p className="text-lg text-slate-300 font-light">
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
          <div className="mb-10 flex gap-3 max-w-5xl mx-auto">
            {color_palette.map((swatch, idx) => (
              <div key={idx} className="group relative">
                <div
                  className="w-14 h-14 rounded-lg border border-slate-600 shadow-md"
                  style={{ background: swatch.hex }}
                />
                <span className="absolute -bottom-8 left-0 text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {swatch.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-10 md:p-16 shadow-xl">
            <div className="prose prose-invert prose-lg max-w-none prose-headings:text-slate-200 prose-headings:font-semibold prose-headings:tracking-tight prose-p:text-slate-300 prose-strong:text-slate-200 prose-a:text-blue-400">
              <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
