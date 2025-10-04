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

export const TeamTemplate = ({ title, tagline, logo_url, color_palette, markdown, avatar }: TemplateProps) => {
  const sections = markdown.split('\n## ').filter(s => s.trim());

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950">
      {/* Team Roster Header */}
      <div className="border-b-4 border-blue-500/50 bg-gradient-to-r from-blue-900/40 to-blue-800/40 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            {logo_url && (
              <div className="shrink-0">
                <div className="w-24 h-24 rounded-full bg-white p-3 shadow-xl shadow-blue-500/30 ring-4 ring-blue-400/50">
                  <img src={logo_url} alt="Logo" className="w-full h-full object-contain" />
                </div>
              </div>
            )}
            <div className="flex-1">
              <div className="inline-block px-3 py-1 bg-blue-500/20 border border-blue-400/50 rounded-full mb-2">
                <span className="text-blue-300 text-xs font-bold uppercase tracking-wider">Team Profile</span>
              </div>
              <h1 className="font-bold text-3xl md:text-4xl text-blue-100 mb-1">
                {title}
              </h1>
              {tagline && (
                <p className="text-lg text-blue-200/90 font-medium">
                  {tagline}
                </p>
              )}
            </div>
            {avatar && (
              <div className="lg:w-56">
                <div className="relative overflow-hidden rounded-2xl border-2 border-blue-400/60 bg-slate-900/50 shadow-[0_0_32px_rgba(59,130,246,0.35)]">
                  <img src={avatar.url} alt={avatar.alt} className="h-72 w-full object-cover" />
                  {avatar.showPersonalizationHint && (
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/65 to-slate-950/85 flex items-end">
                      <p className="w-full px-4 pb-4 text-xs font-semibold uppercase tracking-wide text-blue-100 text-center">
                        Personalize this jersey with your face from the Profile locker.
                      </p>
                    </div>
                  )}
                </div>
                <p className="mt-3 text-xs uppercase tracking-wide text-blue-200/80 text-center">
                  {avatar.mode === "personal" ? "Team sheet with your face" : "Fictional club captain"}
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
                <div key={idx} className="bg-slate-800/60 border-2 border-blue-600/30 rounded-xl overflow-hidden backdrop-blur-sm shadow-lg">
                  <div className="bg-blue-900/40 border-b-2 border-blue-600/30 px-5 py-3">
                    <h2 className="font-bold text-base uppercase tracking-wide text-blue-300">
                      {sectionTitle}
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="prose prose-invert max-w-none prose-headings:text-blue-300 prose-headings:font-bold prose-p:text-blue-100/90 prose-strong:text-blue-200 prose-ul:text-blue-100/90">
                      <ReactMarkdown>{content.join('\n')}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Team Stats Sidebar */}
          <div className="space-y-6">
            {/* Color Palette */}
            {color_palette && color_palette.length > 0 && (
              <div className="bg-slate-800/60 border-2 border-blue-600/30 rounded-xl overflow-hidden backdrop-blur-sm shadow-lg">
                <div className="bg-blue-900/40 border-b-2 border-blue-600/30 px-5 py-3">
                  <h3 className="font-bold text-sm uppercase tracking-wide text-blue-300">Team Colors</h3>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  {color_palette.map((swatch, idx) => (
                    <div key={idx} className="text-center">
                      <div
                        className="w-full h-14 rounded-lg border-2 border-blue-400/40 shadow-md mb-2"
                        style={{ background: swatch.hex }}
                      />
                      <span className="text-xs text-blue-200">{swatch.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team Info */}
            <div className="bg-slate-800/60 border-2 border-blue-600/30 rounded-xl overflow-hidden backdrop-blur-sm shadow-lg">
              <div className="bg-blue-900/40 border-b-2 border-blue-600/30 px-5 py-3">
                <h3 className="font-bold text-sm uppercase tracking-wide text-blue-300">Team Info</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="bg-blue-950/40 border border-blue-700/30 rounded-lg p-3">
                  <div className="text-xs text-blue-400 font-semibold mb-1">Status</div>
                  <div className="text-sm text-blue-200 font-medium">Active Roster</div>
                </div>
                <div className="bg-blue-950/40 border border-blue-700/30 rounded-lg p-3">
                  <div className="text-xs text-blue-400 font-semibold mb-1">Category</div>
                  <div className="text-sm text-blue-200 font-medium">Professional</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
