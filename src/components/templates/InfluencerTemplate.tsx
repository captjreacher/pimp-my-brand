import ReactMarkdown from "react-markdown";

interface TemplateProps {
  title: string;
  tagline?: string;
  logo_url?: string;
  color_palette?: Array<{ hex: string; name: string }>;
  markdown: string;
}

export const InfluencerTemplate = ({ title, tagline, logo_url, color_palette, markdown }: TemplateProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-blue-900">
      {/* Modern Social Header */}
      <div className="relative bg-gradient-to-r from-pink-600/30 via-purple-600/30 to-blue-600/30 backdrop-blur-xl border-b border-pink-500/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(236,72,153,0.1),transparent)]" />
        <div className="container mx-auto px-6 py-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {logo_url && (
              <div className="mb-6 inline-block">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 p-1 shadow-2xl shadow-pink-500/50">
                  <img 
                    src={logo_url} 
                    alt="Logo" 
                    className="w-full h-full object-cover rounded-full bg-slate-900"
                  />
                </div>
              </div>
            )}
            <h1 className="font-bold text-5xl md:text-6xl bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
              {title}
            </h1>
            {tagline && (
              <p className="text-xl text-pink-200/90 font-medium">
                {tagline}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Color Palette */}
        {color_palette && color_palette.length > 0 && (
          <div className="mb-12 flex gap-4 justify-center flex-wrap">
            {color_palette.map((swatch, idx) => (
              <div key={idx} className="text-center">
                <div
                  className="w-16 h-16 rounded-2xl shadow-xl transform transition-all hover:scale-110 hover:rotate-6 border border-white/20"
                  style={{ background: swatch.hex }}
                />
                <span className="text-xs text-pink-200 mt-2 block">{swatch.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-pink-500/20 rounded-3xl p-8 md:p-12 shadow-2xl shadow-purple-900/30">
            <div className="prose prose-invert prose-lg max-w-none prose-headings:bg-gradient-to-r prose-headings:from-pink-400 prose-headings:to-purple-400 prose-headings:bg-clip-text prose-headings:text-transparent prose-headings:font-bold prose-strong:text-pink-300 prose-a:text-purple-400">
              <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
