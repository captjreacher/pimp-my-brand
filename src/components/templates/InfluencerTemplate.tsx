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

export const InfluencerTemplate = ({ title, tagline, logo_url, color_palette, markdown, avatar }: TemplateProps) => {
  const sections = markdown.split('\n## ').filter(s => s.trim());
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-blue-900">
      {/* Creator Profile Header */}
      <div className="border-b border-pink-500/30 bg-gradient-to-r from-pink-600/20 via-purple-600/20 to-blue-600/20 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(236,72,153,0.1),transparent)]" />
        <div className="container mx-auto px-6 py-8 relative z-10">
          <div className="max-w-5xl mx-auto flex flex-col items-center gap-6 lg:flex-row lg:items-end">
            {logo_url && (
              <div className="inline-block">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 p-1 shadow-2xl shadow-pink-500/50">
                  <img
                    src={logo_url}
                    alt="Logo"
                    className="w-full h-full object-cover rounded-full bg-slate-900"
                  />
                </div>
              </div>
            )}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-block px-3 py-1 bg-pink-500/20 border border-pink-400/40 rounded-full mb-3">
                <span className="text-pink-300 text-xs font-bold uppercase tracking-wider">Creator Profile</span>
              </div>
              <h1 className="font-bold text-4xl md:text-5xl bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                {title}
              </h1>
              {tagline && (
                <p className="text-lg text-pink-200/90 font-medium">
                  {tagline}
                </p>
              )}
            </div>
            {avatar && (
              <div className="lg:w-56">
                <div className="relative overflow-hidden rounded-3xl border border-pink-400/40 bg-gradient-to-br from-pink-500/30 via-purple-500/30 to-blue-500/30 shadow-[0_0_45px_rgba(236,72,153,0.35)]">
                  <img src={avatar.url} alt={avatar.alt} className="h-72 w-full object-cover" />
                  {avatar.showPersonalizationHint && (
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/60 to-black/80 flex items-end">
                      <p className="w-full px-4 pb-4 text-xs font-semibold uppercase tracking-wider text-pink-100 text-center">
                        Drop your face in Profile → Avatar & Media to glam this look.
                      </p>
                    </div>
                  )}
                </div>
                <p className="mt-3 text-xs uppercase tracking-wide text-pink-200/80 text-center">
                  {avatar.mode === "personal" ? "Personalized creator render" : "Fictional studio avatar"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Panel */}
          <div className="lg:col-span-2 space-y-6">
            {sections.map((section, idx) => {
              const [heading, ...content] = section.split('\n');
              const sectionTitle = heading.replace(/^#\s*/, '').trim();
              
              return (
                <div key={idx} className="bg-slate-900/60 border border-pink-500/30 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl shadow-purple-900/20">
                  <div className="bg-gradient-to-r from-pink-600/20 to-purple-600/20 border-b border-pink-500/30 px-5 py-3">
                    <h2 className="font-bold text-base bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                      {sectionTitle}
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="prose prose-invert max-w-none prose-headings:bg-gradient-to-r prose-headings:from-pink-400 prose-headings:to-purple-400 prose-headings:bg-clip-text prose-headings:text-transparent prose-headings:font-bold prose-p:text-pink-100/90 prose-strong:text-pink-300 prose-ul:text-pink-100/90">
                      <ReactMarkdown>{content.join('\n')}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Creator Stats Sidebar */}
          <div className="space-y-6">
            {/* Color Palette */}
            {color_palette && color_palette.length > 0 && (
              <div className="bg-slate-900/60 border border-pink-500/30 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl shadow-purple-900/20">
                <div className="bg-gradient-to-r from-pink-600/20 to-purple-600/20 border-b border-pink-500/30 px-5 py-3">
                  <h3 className="font-bold text-sm bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">Brand Colors</h3>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  {color_palette.map((swatch, idx) => (
                    <div key={idx} className="text-center">
                      <div
                        className="w-full h-14 rounded-2xl shadow-lg border border-white/20 mb-2 transform transition-all hover:scale-105 hover:rotate-3"
                        style={{ background: swatch.hex }}
                      />
                      <span className="text-xs text-pink-200">{swatch.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Creator Stats */}
            <div className="bg-slate-900/60 border border-pink-500/30 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl shadow-purple-900/20">
              <div className="bg-gradient-to-r from-pink-600/20 to-purple-600/20 border-b border-pink-500/30 px-5 py-3">
                <h3 className="font-bold text-sm bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">Profile Stats</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="bg-gradient-to-br from-pink-950/50 to-purple-950/50 border border-pink-500/20 rounded-xl p-3">
                  <div className="text-xs text-pink-400 font-semibold mb-1">Category</div>
                  <div className="text-sm text-pink-200 font-medium">Content Creator</div>
                </div>
                <div className="bg-gradient-to-br from-pink-950/50 to-purple-950/50 border border-pink-500/20 rounded-xl p-3">
                  <div className="text-xs text-pink-400 font-semibold mb-1">Status</div>
                  <div className="text-sm text-pink-200 font-medium">Active</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
