import ReactMarkdown from "react-markdown";

interface TemplateAvatar {
  url: string;
  alt: string;
  mode?: "fictional" | "personal";
  showPersonalizationHint?: boolean;
}

interface TemplateProps {
  title: string;
  tagline?: string;
  logo_url?: string;
  color_palette?: Array<{ hex: string; name: string }>;
  markdown: string;
  avatar?: TemplateAvatar;
}

export const NFLTemplate = ({ title, tagline, logo_url, color_palette, markdown, avatar }: TemplateProps) => {
  const sections = markdown.split('\n## ').filter(s => s.trim());
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-950 via-slate-900 to-orange-950">
      {/* Player Card Header */}
      <div className="border-b-8 border-orange-500/60 bg-gradient-to-r from-orange-600/40 to-orange-700/40 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.05)_25%,rgba(255,255,255,.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,.05)_75%,rgba(255,255,255,.05))] bg-[length:20px_20px]" />
        <div className="container mx-auto px-6 py-6 relative z-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end">
            {logo_url && (
              <div className="shrink-0">
                <div className="w-24 h-24 rounded-xl bg-white p-3 shadow-2xl ring-4 ring-orange-400 transform rotate-3">
                  <img src={logo_url} alt="Logo" className="w-full h-full object-contain" />
                </div>
              </div>
            )}
            <div className="flex-1">
              <div className="inline-block px-3 py-1 bg-orange-500/80 rounded mb-2">
                <span className="text-white text-xs font-black uppercase tracking-wider">Player Profile</span>
              </div>
              <h1 className="font-black italic text-4xl md:text-5xl text-white mb-1 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] skew-y-[-1deg]">
                {title}
              </h1>
              {tagline && (
                <p className="text-xl text-orange-100 font-bold uppercase tracking-wide">
                  {tagline}
                </p>
              )}
            </div>
            {avatar && (
              <div className="lg:w-56">
                <div className="relative overflow-hidden rounded-2xl border-4 border-orange-500/60 bg-slate-900/60 shadow-[0_0_40px_rgba(249,115,22,0.4)]">
                  <img src={avatar.url} alt={avatar.alt} className="h-72 w-full object-cover" />
                  {avatar.showPersonalizationHint && (
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-900/65 to-black/85 flex items-end">
                      <p className="w-full px-4 pb-4 text-xs font-black uppercase tracking-wider text-orange-100 text-center">
                        Import your face via Profile settings to personalize this game-day render.
                      </p>
                    </div>
                  )}
                </div>
                <p className="mt-3 text-xs uppercase tracking-wide text-orange-200/80 text-center font-black">
                  {avatar.mode === "personal" ? "Personalized sideline intro" : "Fictional franchise star"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Stats Panel */}
          <div className="lg:col-span-2 space-y-6">
            {sections.map((section, idx) => {
              const [heading, ...content] = section.split('\n');
              const sectionTitle = heading.replace(/^#\s*/, '').trim();
              
              return (
                <div key={idx} className="bg-slate-800/90 border-4 border-orange-600/40 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
                  <div className="bg-orange-700/40 border-b-4 border-orange-600/40 px-5 py-3">
                    <h2 className="font-black italic text-base uppercase tracking-wide text-orange-300">
                      {sectionTitle}
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="prose prose-invert max-w-none prose-headings:font-black prose-headings:italic prose-headings:text-orange-400 prose-p:text-orange-50/90 prose-strong:text-orange-300 prose-ul:text-orange-50/90">
                      <ReactMarkdown>{content.join('\n')}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Player Stats Sidebar */}
          <div className="space-y-6">
            {/* Color Palette */}
            {color_palette && color_palette.length > 0 && (
              <div className="bg-slate-800/90 border-4 border-orange-600/40 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
                <div className="bg-orange-700/40 border-b-4 border-orange-600/40 px-5 py-3">
                  <h3 className="font-black italic text-sm uppercase tracking-wide text-orange-300">Team Colors</h3>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  {color_palette.map((swatch, idx) => (
                    <div key={idx} className="text-center">
                      <div
                        className="w-full h-14 rounded-full border-4 border-orange-500/50 shadow-lg mb-2"
                        style={{ background: swatch.hex }}
                      />
                      <span className="text-xs text-orange-200 font-bold">{swatch.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Player Stats */}
            <div className="bg-slate-800/90 border-4 border-orange-600/40 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
              <div className="bg-orange-700/40 border-b-4 border-orange-600/40 px-5 py-3">
                <h3 className="font-black italic text-sm uppercase tracking-wide text-orange-300">Stats</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="bg-orange-950/50 border-2 border-orange-700/30 rounded-lg p-3">
                  <div className="text-xs text-orange-400 font-black uppercase mb-1">Position</div>
                  <div className="text-sm text-orange-200 font-bold">All-Pro</div>
                </div>
                <div className="bg-orange-950/50 border-2 border-orange-700/30 rounded-lg p-3">
                  <div className="text-xs text-orange-400 font-black uppercase mb-1">Status</div>
                  <div className="text-sm text-orange-200 font-bold">Active</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
