import ReactMarkdown from "react-markdown";

interface TemplateProps {
  title: string;
  tagline?: string;
  logo_url?: string;
  color_palette?: Array<{ hex: string; name: string }>;
  markdown: string;
}

export const UFCTemplate = ({ title, tagline, logo_url, color_palette, markdown }: TemplateProps) => {
  const sections = markdown.split('\n## ').filter(s => s.trim());
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-black to-red-950">
      {/* Fighter Card Header */}
      <div className="border-b-4 border-red-600 bg-black/70 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iIzMzMCIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="container mx-auto px-6 py-6 relative z-10">
          <div className="flex items-center gap-6">
            {logo_url && (
              <div className="shrink-0">
                <div className="w-24 h-24 rounded-xl bg-black/60 border-2 border-red-600 p-3 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                  <img src={logo_url} alt="Logo" className="w-full h-full object-contain" />
                </div>
              </div>
            )}
            <div className="flex-1">
              <div className="inline-block px-3 py-1 bg-red-900/50 border border-red-600 rounded mb-2">
                <span className="text-red-400 text-xs font-black uppercase tracking-wider">Fighter Profile</span>
              </div>
              <h1 className="font-black text-4xl md:text-5xl uppercase tracking-wider text-red-500 mb-1 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                {title}
              </h1>
              {tagline && (
                <p className="text-xl text-red-200 uppercase tracking-wide font-bold">
                  {tagline}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Fight Stats Panel */}
          <div className="lg:col-span-2 space-y-6">
            {sections.map((section, idx) => {
              const [heading, ...content] = section.split('\n');
              const sectionTitle = heading.replace(/^#\s*/, '').trim();
              
              return (
                <div key={idx} className="bg-black/60 border-2 border-red-900/50 rounded-xl overflow-hidden backdrop-blur-sm shadow-2xl">
                  <div className="bg-red-950/40 border-b-2 border-red-900/50 px-5 py-3">
                    <h2 className="font-black text-base uppercase tracking-wide text-red-400">
                      {sectionTitle}
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="prose prose-invert max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-wide prose-headings:text-red-400 prose-p:text-red-50/90 prose-strong:text-red-300 prose-ul:text-red-50/90">
                      <ReactMarkdown>{content.join('\n')}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fighter Stats Sidebar */}
          <div className="space-y-6">
            {/* Color Palette */}
            {color_palette && color_palette.length > 0 && (
              <div className="bg-black/60 border-2 border-red-900/50 rounded-xl overflow-hidden backdrop-blur-sm shadow-2xl">
                <div className="bg-red-950/40 border-b-2 border-red-900/50 px-5 py-3">
                  <h3 className="font-black text-sm uppercase tracking-wide text-red-400">Fight Colors</h3>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  {color_palette.map((swatch, idx) => (
                    <div key={idx} className="text-center">
                      <div
                        className="w-full h-14 rounded-lg border-2 border-red-600/50 shadow-lg mb-2"
                        style={{ background: swatch.hex }}
                      />
                      <span className="text-xs text-red-200">{swatch.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fighter Stats */}
            <div className="bg-black/60 border-2 border-red-900/50 rounded-xl overflow-hidden backdrop-blur-sm shadow-2xl">
              <div className="bg-red-950/40 border-b-2 border-red-900/50 px-5 py-3">
                <h3 className="font-black text-sm uppercase tracking-wide text-red-400">Fighter Stats</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="bg-red-950/50 border border-red-800/50 rounded-lg p-3">
                  <div className="text-xs text-red-400 font-black uppercase mb-1">Division</div>
                  <div className="text-sm text-red-200 font-bold">Elite</div>
                </div>
                <div className="bg-red-950/50 border border-red-800/50 rounded-lg p-3">
                  <div className="text-xs text-red-400 font-black uppercase mb-1">Status</div>
                  <div className="text-sm text-red-200 font-bold">Active</div>
                </div>
                <div className="bg-red-950/50 border border-red-800/50 rounded-lg p-3">
                  <div className="text-xs text-red-400 font-black uppercase mb-1">Record</div>
                  <div className="text-sm text-red-200 font-bold">Undefeated</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
