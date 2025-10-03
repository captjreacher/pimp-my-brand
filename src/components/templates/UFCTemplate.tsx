import ReactMarkdown from "react-markdown";

interface TemplateProps {
  title: string;
  tagline?: string;
  logo_url?: string;
  color_palette?: Array<{ hex: string; name: string }>;
  markdown: string;
}

export const UFCTemplate = ({ title, tagline, logo_url, color_palette, markdown }: TemplateProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-black to-red-950">
      {/* Header Banner */}
      <div className="relative border-b-4 border-red-600 bg-black/60 backdrop-blur-sm">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iIzMzMCIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="container mx-auto px-6 py-12 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="font-black text-5xl md:text-6xl uppercase tracking-wider text-red-500 mb-3 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                {title}
              </h1>
              {tagline && (
                <p className="text-xl text-red-200 uppercase tracking-wide font-bold">
                  {tagline}
                </p>
              )}
            </div>
            {logo_url && (
              <div className="ml-8">
                <img 
                  src={logo_url} 
                  alt="Logo" 
                  className="h-32 w-32 object-contain rounded-xl bg-black/40 backdrop-blur-sm p-4 border-2 border-red-600 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Color Palette */}
        {color_palette && color_palette.length > 0 && (
          <div className="mb-12 flex gap-3">
            {color_palette.map((swatch, idx) => (
              <div key={idx} className="group relative">
                <div
                  className="w-16 h-16 rounded-lg border-2 border-red-600/50 shadow-lg transition-transform hover:scale-110"
                  style={{ background: swatch.hex }}
                />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-red-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {swatch.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="bg-black/60 backdrop-blur-sm border-2 border-red-900/50 rounded-2xl p-8 md:p-12 shadow-2xl">
          <div className="prose prose-invert prose-lg max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-wide prose-headings:text-red-400 prose-strong:text-red-300 prose-a:text-red-400">
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};
