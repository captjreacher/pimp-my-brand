import ReactMarkdown from "react-markdown";

interface TemplateProps {
  title: string;
  tagline?: string;
  logo_url?: string;
  color_palette?: Array<{ hex: string; name: string }>;
  markdown: string;
}

export const MilitaryTemplate = ({ title, tagline, logo_url, color_palette, markdown }: TemplateProps) => {
  return (
    <div className="min-h-screen bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-green-900 via-slate-800 to-green-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-green-950/90 to-transparent backdrop-blur-sm border-b-2 border-green-700/50">
        <div className="container mx-auto px-6 py-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="inline-block px-4 py-1 bg-green-900/50 border border-green-600/50 rounded mb-4">
                <span className="text-green-400 text-xs font-mono uppercase tracking-widest">Classified Personnel File</span>
              </div>
              <h1 className="font-mono text-4xl md:text-5xl uppercase tracking-widest text-green-400 mb-2">
                {title}
              </h1>
              {tagline && (
                <p className="text-green-200 font-mono uppercase text-sm tracking-wider">
                  {tagline}
                </p>
              )}
            </div>
            {logo_url && (
              <div className="ml-8">
                <img 
                  src={logo_url} 
                  alt="Logo" 
                  className="h-24 w-24 object-contain rounded-lg bg-green-950/60 backdrop-blur-sm p-3 border border-green-600/50"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Color Palette */}
        {color_palette && color_palette.length > 0 && (
          <div className="mb-10 flex gap-2">
            {color_palette.map((swatch, idx) => (
              <div key={idx} className="relative group">
                <div
                  className="w-12 h-12 border border-green-600/40"
                  style={{ background: swatch.hex }}
                />
                <span className="absolute top-full mt-1 left-0 text-xs text-green-300 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  {swatch.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="bg-slate-900/80 backdrop-blur-sm border-l-4 border-green-600 rounded-r-xl p-8 md:p-12 shadow-2xl">
          <div className="prose prose-invert max-w-none prose-headings:font-mono prose-headings:uppercase prose-headings:tracking-widest prose-headings:text-green-400 prose-p:font-mono prose-p:text-green-100/90 prose-strong:text-green-300">
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};
