import ReactMarkdown from "react-markdown";

interface TemplateProps {
  title: string;
  tagline?: string;
  logo_url?: string;
  color_palette?: Array<{ hex: string; name: string }>;
  markdown: string;
}

export const NFLTemplate = ({ title, tagline, logo_url, color_palette, markdown }: TemplateProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-950 via-slate-900 to-orange-950">
      {/* Broadcast Style Header */}
      <div className="relative bg-gradient-to-r from-orange-600 to-orange-700 border-b-8 border-orange-500">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.05)_25%,rgba(255,255,255,.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,.05)_75%,rgba(255,255,255,.05))] bg-[length:20px_20px]" />
        <div className="container mx-auto px-6 py-12 relative z-10">
          <div className="flex items-end justify-between">
            <div className="flex-1">
              <h1 className="font-black italic text-5xl md:text-6xl text-white mb-3 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] skew-y-[-2deg]">
                {title}
              </h1>
              {tagline && (
                <p className="text-xl text-orange-100 font-bold uppercase tracking-wide">
                  {tagline}
                </p>
              )}
            </div>
            {logo_url && (
              <div className="ml-8 transform rotate-3">
                <img 
                  src={logo_url} 
                  alt="Logo" 
                  className="h-28 w-28 object-contain rounded-xl bg-white p-3 shadow-2xl"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Color Palette */}
        {color_palette && color_palette.length > 0 && (
          <div className="mb-12 flex gap-4 justify-center">
            {color_palette.map((swatch, idx) => (
              <div key={idx} className="text-center">
                <div
                  className="w-16 h-16 rounded-full border-4 border-orange-500 shadow-xl transform transition-transform hover:scale-110"
                  style={{ background: swatch.hex }}
                />
                <span className="text-xs text-orange-200 mt-2 block font-bold">{swatch.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Stats Card Style Content */}
        <div className="bg-slate-800/90 backdrop-blur-sm border-4 border-orange-600/50 rounded-2xl p-8 md:p-12 shadow-2xl">
          <div className="prose prose-invert prose-lg max-w-none prose-headings:font-black prose-headings:italic prose-headings:text-orange-400 prose-strong:text-orange-300 prose-a:text-orange-400">
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};
