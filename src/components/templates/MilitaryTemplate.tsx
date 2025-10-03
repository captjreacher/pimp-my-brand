import ReactMarkdown from "react-markdown";

interface TemplateProps {
  title: string;
  tagline?: string;
  logo_url?: string;
  color_palette?: Array<{ hex: string; name: string }>;
  markdown: string;
}

export const MilitaryTemplate = ({ title, tagline, logo_url, color_palette, markdown }: TemplateProps) => {
  const sections = markdown.split('\n## ').filter(s => s.trim());
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-green-950 to-slate-950">
      {/* Tactical Header */}
      <div className="border-b border-green-700/30 bg-black/40 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-6">
            {logo_url && (
              <div className="shrink-0">
                <div className="w-20 h-20 rounded-lg bg-green-950/60 border-2 border-green-600/50 p-2 shadow-lg shadow-green-900/50">
                  <img src={logo_url} alt="Logo" className="w-full h-full object-contain" />
                </div>
              </div>
            )}
            <div className="flex-1">
              <div className="inline-block px-3 py-1 bg-green-900/40 border border-green-600/50 rounded mb-2">
                <span className="text-green-400 text-xs font-mono uppercase tracking-widest">Operative Profile</span>
              </div>
              <h1 className="font-mono text-3xl md:text-4xl uppercase tracking-wider text-green-400 mb-1">
                {title}
              </h1>
              {tagline && (
                <p className="text-green-300/80 font-mono text-sm uppercase tracking-wide">
                  {tagline}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Loadout Panel */}
          <div className="lg:col-span-2 space-y-6">
            {sections.map((section, idx) => {
              const [heading, ...content] = section.split('\n');
              const sectionTitle = heading.replace(/^#\s*/, '').trim();
              
              return (
                <div key={idx} className="bg-slate-900/60 border-2 border-green-800/30 rounded-lg overflow-hidden backdrop-blur-sm">
                  <div className="bg-green-950/40 border-b border-green-800/30 px-4 py-2">
                    <h2 className="font-mono text-sm uppercase tracking-widest text-green-400">
                      {sectionTitle}
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="prose prose-invert prose-sm max-w-none prose-headings:font-mono prose-headings:text-green-400 prose-p:font-mono prose-p:text-green-100/90 prose-strong:text-green-300 prose-ul:text-green-100/90 prose-li:font-mono">
                      <ReactMarkdown>{content.join('\n')}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar Stats Panel */}
          <div className="space-y-6">
            {/* Color Palette Loadout */}
            {color_palette && color_palette.length > 0 && (
              <div className="bg-slate-900/60 border-2 border-green-800/30 rounded-lg overflow-hidden backdrop-blur-sm">
                <div className="bg-green-950/40 border-b border-green-800/30 px-4 py-2">
                  <h3 className="font-mono text-sm uppercase tracking-widest text-green-400">Color Loadout</h3>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  {color_palette.map((swatch, idx) => (
                    <div key={idx} className="bg-black/40 border border-green-700/30 rounded p-2">
                      <div
                        className="w-full h-12 rounded border border-green-600/40 mb-2"
                        style={{ background: swatch.hex }}
                      />
                      <span className="text-xs text-green-300 font-mono block text-center">{swatch.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Profile Stats */}
            <div className="bg-slate-900/60 border-2 border-green-800/30 rounded-lg overflow-hidden backdrop-blur-sm">
              <div className="bg-green-950/40 border-b border-green-800/30 px-4 py-2">
                <h3 className="font-mono text-sm uppercase tracking-widest text-green-400">Profile Stats</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="bg-black/40 border border-green-700/30 rounded p-3">
                  <div className="text-xs text-green-400 font-mono mb-1">Classification</div>
                  <div className="text-sm text-green-300 font-mono">Tactical</div>
                </div>
                <div className="bg-black/40 border border-green-700/30 rounded p-3">
                  <div className="text-xs text-green-400 font-mono mb-1">Status</div>
                  <div className="text-sm text-green-300 font-mono">Active</div>
                </div>
                <div className="bg-black/40 border border-green-700/30 rounded p-3">
                  <div className="text-xs text-green-400 font-mono mb-1">Clearance</div>
                  <div className="text-sm text-green-300 font-mono">Classified</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
