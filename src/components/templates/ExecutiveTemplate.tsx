import ReactMarkdown from "react-markdown";

interface TemplateProps {
  title: string;
  tagline?: string;
  logo_url?: string;
  color_palette?: Array<{ hex: string; name: string }>;
  markdown: string;
}

export const ExecutiveTemplate = ({ title, tagline, logo_url, color_palette, markdown }: TemplateProps) => {
  const sections = markdown.split('\n## ').filter(s => s.trim());
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Executive Dashboard Header */}
      <div className="border-b border-slate-700/50 bg-slate-800/40 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-6 max-w-6xl mx-auto">
            {logo_url && (
              <div className="shrink-0">
                <div className="w-20 h-20 rounded-xl bg-slate-700/50 p-3 border border-slate-600 shadow-lg">
                  <img src={logo_url} alt="Logo" className="w-full h-full object-contain" />
                </div>
              </div>
            )}
            <div className="flex-1">
              <div className="inline-block px-3 py-1 bg-slate-700/50 border border-slate-600 rounded mb-2">
                <span className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Executive Profile</span>
              </div>
              <h1 className="font-semibold text-3xl md:text-4xl text-slate-100 mb-1 tracking-tight">
                {title}
              </h1>
              {tagline && (
                <p className="text-base text-slate-300 font-light">
                  {tagline}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Panel */}
          <div className="lg:col-span-2 space-y-6">
            {sections.map((section, idx) => {
              const [heading, ...content] = section.split('\n');
              const sectionTitle = heading.replace(/^#\s*/, '').trim();
              
              return (
                <div key={idx} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden backdrop-blur-sm shadow-lg">
                  <div className="bg-slate-700/30 border-b border-slate-700/50 px-5 py-3">
                    <h2 className="font-semibold text-base tracking-tight text-slate-200">
                      {sectionTitle}
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="prose prose-invert max-w-none prose-headings:text-slate-200 prose-headings:font-semibold prose-p:text-slate-300 prose-strong:text-slate-200 prose-ul:text-slate-300">
                      <ReactMarkdown>{content.join('\n')}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Executive Stats Sidebar */}
          <div className="space-y-6">
            {/* Color Palette */}
            {color_palette && color_palette.length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden backdrop-blur-sm shadow-lg">
                <div className="bg-slate-700/30 border-b border-slate-700/50 px-5 py-3">
                  <h3 className="font-semibold text-sm tracking-tight text-slate-200">Brand Colors</h3>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  {color_palette.map((swatch, idx) => (
                    <div key={idx} className="text-center">
                      <div
                        className="w-full h-14 rounded-lg border border-slate-600 shadow-md mb-2"
                        style={{ background: swatch.hex }}
                      />
                      <span className="text-xs text-slate-400">{swatch.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Executive Details */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden backdrop-blur-sm shadow-lg">
              <div className="bg-slate-700/30 border-b border-slate-700/50 px-5 py-3">
                <h3 className="font-semibold text-sm tracking-tight text-slate-200">Profile Details</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-3">
                  <div className="text-xs text-slate-400 font-medium mb-1">Level</div>
                  <div className="text-sm text-slate-200">Executive</div>
                </div>
                <div className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-3">
                  <div className="text-xs text-slate-400 font-medium mb-1">Status</div>
                  <div className="text-sm text-slate-200">Active</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
