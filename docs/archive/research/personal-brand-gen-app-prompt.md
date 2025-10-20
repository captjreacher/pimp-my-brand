Project: Personal Brand Generator (v1)
Goal: A web app that ingests a user’s text corpus (uploaded files + optional connected sources), infers brand voice + visuals, and outputs a 1-page Brand Rider and a 1-page CV, with multiple “presentation formats” (UFC, sports, military, influencer, custom). Users can edit, download/print/share, and optionally publish to a community gallery. Auth + profiles + uploads required. No paywall yet; leave tiering hooks.
Tech & Constraints
•	Framework: Next.js 14+ (App Router, TypeScript), React 18, TailwindCSS, shadcn/ui, Radix.
•	DB/Auth/Storage: Supabase (Auth, Postgres, RLS, Storage).
•	AI: OpenAI (text + image gen) via server routes; keep provider abstraction so we can swap later.
•	PDF: HTML-to-PDF via Playwright/Chromium on server (edge-safe fallback with react-pdf if needed).
•	Icons: lucide-react.
•	Quality: ESLint, Prettier, Zod validation, Jest (unit), Playwright (e2e smoke).
•	Licenses: Only permissive libs.
High-Level Features
1.	Auth & Profiles
o	Email/password + OAuth (Google, GitHub) via Supabase.
o	Profile: name, handle, avatar, bio, role tags, visibility (private/public), social links.
2.	Ingestion
o	Upload: PDF, TXT, MD, DOCX, PNG/JPG (OCR for images optional flag).
o	“Add source” (phase 2): user pastes links (LinkedIn, X/Twitter) → we only fetch after explicit consent. Create stubs + TODO for official OAuth later.
3.	Brand Generation
o	AI pipelines:
	Content model: derive tone, style notes, strengths/weaknesses, signature phrases.
	Visual model: palette, fonts (Google Fonts), logo concept (image gen), layout motifs.
o	Deterministic template assembly for:
	1-page Brand Rider (visuals + voice).
	1-page CV (concise, achievement bullets, skills, links).
4.	Presentation Formats (selectable style overlays)
o	UFC Announcer, Team Captain (TV roster), Solo Athlete, Military (Sergeant/General/Admiral), American Football Star, Celebrity/Influencer, User-Defined (freeform).
o	Each format = prompt preset + layout component + copy tone rules.
5.	Editing & Output
o	Inline WYSIWYG/markdown editor for generated text.
o	Swap palettes/fonts/logos live.
o	Export PDF; export PNG of hero section; copy markdown; share link.
6.	Community Gallery
o	Public/private toggle per artifact.
o	Public items appear in a browse page with search & tags.
7.	Future Tiering Hooks
o	Add plan field (free/pro/enterprise).
o	Feature flags: video gen, voiceover, social post packs (not implemented yet).
Pages / Routes (App Router)
•	/ Landing (CTA to “Generate Your Brand”)
•	/auth/(sign-in|sign-up|callback)
•	/dashboard (cards: Create New, My Brands, My CVs, Uploads, Connect Sources)
•	/create (wizard: ingest → choose formats → generate → review)
•	/brand/[id] (edit/view Brand Rider, swap styles, export/share)
•	/cv/[id] (edit/view CV, export/share)
•	/gallery (public items)
•	/settings (profile, links, API keys if any)
•	/api/* server routes for AI, PDF, share tokens
Data Model (Supabase SQL)
-- users handled by auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  handle text unique,
  avatar_url text,
  bio text,
  role_tags text[],
  website_url text,
  socials jsonb default '{}'::jsonb, -- {twitter, linkedin, github, ...}
  visibility text default 'private' check (visibility in ('private','public')),
  plan text default 'free' check (plan in ('free','pro','enterprise')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  storage_path text not null,
  original_name text not null,
  mime_type text,
  size_bytes bigint,
  extracted_text text, -- filled after ingestion worker
  visibility text default 'private' check (visibility in ('private','public')),
  created_at timestamptz default now()
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  kind text not null, -- 'link', 'oauth-linkedin' (future), etc
  label text,
  url text,
  status text default 'pending',
  last_fetched_at timestamptz
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  summary text,
  tone_notes text,      -- distilled style guide
  strengths text[],
  weaknesses text[],
  signature_phrases text[],
  color_palette jsonb,  -- [{name,hex}...]
  fonts jsonb,          -- {heading:'Inter', body:'Poppins'}
  logo_url text,        -- generated PNG/SVG in storage
  format_preset text,   -- 'ufc' | 'team' | 'solo' | 'military' | 'nfl' | 'influencer' | 'custom'
  visibility text default 'private' check (visibility in ('private','public')),
  raw_context jsonb,    -- references to uploads/source ids used
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  summary text,
  experience jsonb,     -- [{role,org,dates,bullets[]}]
  skills text[],
  links jsonb,          -- {portfolio,github,linkedin,...}
  format_preset text,   -- same enums as brands
  visibility text default 'private' check (visibility in ('private','public')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  kind text not null,   -- 'brand' | 'cv'
  target_id uuid not null,
  token text unique not null,
  created_at timestamptz default now(),
  expires_at timestamptz
);
Storage buckets: uploads, logos, exports (RLS: only owner read/write; public only for shared artifacts via signed URLs).
Env (.env.local)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
Server Modules (summaries)
•	lib/ai/provider.ts: provider interface; default OpenAI.
•	lib/ai/prompts.ts: prompt templates (see below).
•	lib/ingest/extract.ts: text extraction (pdf→pdf-parse, docx→mammoth, image→(todo OCR)).
•	lib/pdf/export.ts: HTML→PDF via Playwright.
•	lib/theme/palettes.ts: accessible palettes + Google Fonts resolver.
•	lib/share/tokens.ts: crypto-random token + Supabase record.
Prompt Templates (core)
1) Style Synthesis
SYSTEM: You analyze user-provided text to distill a brand voice that is practical, witty, and focused on action. Output JSON only.
USER_CORPUS: <<concat extracted_text from uploads/sources>>
ASSISTANT: Return:
{
  "tone": {"adjectives":[], "dos":[], "donts":[]},
  "signature_phrases": [],
  "strengths": [],
  "weaknesses": [],
  "tagline": "",
  "bio_one_liner": ""
}
2) Visual Synthesis
SYSTEM: You are a brand designer. Propose a color palette (5 swatches, hex), font pairings (Google Fonts), and a logo concept prompt for image generation. Output JSON only.
INPUT: { "keywords":[], "role_tags":[], "bio": "" }
ASSISTANT: Return:
{
  "palette":[{"name":"Primary","hex":"#..."},...],
  "fonts":{"heading":"", "body":""},
  "logo_prompt":"A minimal, scalable mark ... (SVG-like framing, high contrast)"
}
3) Artifact Assembly (Brand Rider)
SYSTEM: Compose a 1-page Brand Rider. Brevity, clarity, scannability.
INPUT: {tone, phrases, strengths, weaknesses, palette, fonts}
ASSISTANT: Return Markdown with sections:
# Brand Rider
- Tagline
- Voice & Tone (bulleted)
- Signature Phrases
- Color & Type (swatches + font names)
- Bio (80-120 words)
- 3 Usage Examples (email opener, LinkedIn about, website hero)
4) Artifact Assembly (CV)
SYSTEM: Compose a 1-page CV. Tactical bullets with quantified outcomes.
INPUT: {summary, experience, skills, links} plus tone overlay
ASSISTANT: Return Markdown with:
- Name & Role
- Summary (3 lines)
- Experience (3 roles max, 3 bullets each, action+impact)
- Skills (comma list)
- Links (short)
5) Presentation Format Overlays
•	UFC: “In the Black Corner… [Name], weighing in with [skills], record of [achievements].”
•	Team Captain TV: roster card, lower-third style intros, team colors.
•	Solo Athlete: commentator cadence, event stats style.
•	Military: rank + unit + commendations; brevity, precision.
•	NFL Star: draft/season stats metaphors; playbook lingo.
•	Influencer/Celebrity: social proof, collabs, follower counts (if provided).
•	Custom: user-specified tone keywords & metaphors.
Each overlay = a short system preamble that modifies wording + layout labels without changing factual content.
Key Components
•	components/Wizard.tsx (steps: Upload → Sources → Analyze → Choose Format → Generate → Review & Edit → Export)
•	components/Editor.tsx (MD editor + preview)
•	components/PalettePicker.tsx, FontPicker.tsx, LogoGen.tsx (call /api/ai/logo)
•	components/ShareButton.tsx (create share token + link)
•	components/GalleryGrid.tsx
API Routes (handlers)
•	POST /api/ingest/upload → sign URL → store → extract → save text.
•	POST /api/ai/style → returns style JSON.
•	POST /api/ai/visual → returns palette/fonts/logo prompt.
•	POST /api/ai/logo → calls image gen, stores PNG/SVG, returns URL.
•	POST /api/assemble/brand → returns Brand Rider MD + saves brands row.
•	POST /api/assemble/cv → returns CV MD + saves cvs row.
•	POST /api/export/pdf → HTML (server-rendered) → PDF in exports/.
•	POST /api/share/create → returns share URL/token.
•	GET /api/share/[token] → SSR read-only view of brand/cv.
All endpoints gated by user session; /api/share/[token] public read-only.
UX Requirements
•	Clean, minimal UI. Dashboard cards for quick start.
•	Wizard with progress at top; autosave state.
•	Format switcher (UFC/Team/Solo/Military/NFL/Influencer/Custom) that live-updates copy.
•	Editor supports full edit of generated text; changes persist.
•	Download (PDF, PNG hero), Print, Share, Visibility toggle, Delete.
•	Gallery shows only public items; search by tags/role.
Accessibility
•	WCAG AA contrast on palettes; font sizes scalable.
•	Keyboard nav & focus rings; aria labels on interactive components.
RLS (Supabase)
•	Row-level policies so users only see/edit their own records; public reads only via shares.token.
Tests
•	Unit: prompt mappers and zod schemas.
•	E2E: sign-in, upload, generate brand rider, export PDF, share link opens read-only.
CLI / Scripts
•	pnpm dev / pnpm build / pnpm test / pnpm e2e
•	Seed script to create a demo user + sample uploads (text stubs).
Acceptance Criteria (must pass)
1.	New user can sign up, upload a PDF/TXT, click Generate, choose UFC format, and view a filled Brand Rider + CV.
2.	User can edit text, swap fonts/colors, generate a logo, and export both pages to PDF.
3.	Share link opens read-only page without auth.
4.	Public toggle places item in /gallery.
5.	Lint/tests pass; no client secrets shipped; RLS enforced.
Now:
1.	Initialize repo with the above stack & folders.
2.	Create Supabase migrations for the schema.
3.	Implement minimal vertical slice: upload → style/visual → brand rider (UFC) → export → share.
4.	Then add remaining formats and the CV page.
5.	Ship a polished UI with shadcn components and Tailwind.





Absolutely. I’ve tailored the Personal Brand Generator for Maximised AI (black bg, #ff4f00, #89bbfe, white) and added pre-styled 1-page PDF templates for both the Brand Rider and CV—ready to drop into the Cursor one-shot you already have.
Below are copy-paste snippets (TypeScript/React + Tailwind) you can paste straight into your repo. They slot into the earlier structure without changing it.
________________________________________
1) Theme Preset (Maximised AI)
lib/theme/presets.ts
export const maximisedAI = {
  name: "Maximised AI",
  colors: {
    background: "#0A0A0A",    // near-black
    surface: "#111316",
    primary: "#ff4f00",       // burnt orange
    secondary: "#89bbfe",     // blue
    accent: "#ffe066",        // warm yellow (sparingly)
    text: "#FFFFFF",
    textMuted: "#C9D1D9",
    border: "#2A2F36"
  },
  fonts: {
    heading: "Poppins",
    body: "Inter"
  },
  gradientHero:
    "linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(255,79,0,0.16) 48%, rgba(137,187,254,0.18) 100%)"
};
app/globals.css (theme CSS vars—dark, high contrast)
:root {
  --bg: #0a0a0a;
  --surface: #111316;
  --primary: #ff4f00;
  --secondary: #89bbfe;
  --accent: #ffe066;
  --text: #ffffff;
  --text-muted: #c9d1d9;
  --border: #2a2f36;
  --radius: 16px;
}

html, body {
  background: var(--bg);
  color: var(--text);
}
tailwind.config.ts (extracts)
import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        accent: "var(--accent)",
        text: "var(--text)",
        muted: "var(--text-muted)",
        border: "var(--border)"
      },
      borderRadius: {
        xl: "var(--radius)",
        "2xl": "calc(var(--radius) + 8px)"
      },
      boxShadow: {
        soft: "0 8px 32px rgba(0,0,0,0.35)"
      },
      fontFamily: {
        heading: ["Poppins", "ui-sans-serif", "system-ui"],
        body: ["Inter", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
};
export default config;
app/layout.tsx (load Google Fonts once)
import "./globals.css";
import { Poppins, Inter } from "next/font/google";

const poppins = Poppins({ weight: ["400","600","700"], subsets: ["latin"], variable: "--font-heading" });
const inter = Inter({ weight: ["400","500","600"], subsets: ["latin"], variable: "--font-body" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <body className="font-body bg-bg text-text">{children}</body>
    </html>
  );
}
________________________________________
2) PDF-Ready Components (1-page Brand Rider & CV)
Both render cleanly for screen and PDF. They accept your AI outputs, palettes, and font picks. Keep them WYSIWYG and accessible.
components/pdf/PdfBrandRider.tsx
"use client";
import React from "react";

type Swatch = { name: string; hex: string };
type Fonts = { heading: string; body: string };

export function PdfBrandRider({
  title,
  tagline,
  voiceTone,
  signaturePhrases,
  strengths,
  weaknesses,
  palette,
  fonts,
  bio,
  examples
}: {
  title: string;
  tagline: string;
  voiceTone: string[];             // bullets
  signaturePhrases: string[];      // bullets
  strengths: string[];
  weaknesses: string[];
  palette: Swatch[];               // 5 swatches
  fonts: Fonts;                    // Google fonts
  bio: string;                     // 80–120 words
  examples: { label: string; text: string }[]; // 3 items
}) {
  return (
    <div className="w-[794px] min-h-[1123px] mx-auto bg-bg text-text p-10 rounded-2xl shadow-soft"
         style={{ backgroundImage: "linear-gradient(135deg, rgba(0,0,0,.9), rgba(255,79,0,.10) 50%, rgba(137,187,254,.12))" }}>
      <header className="mb-6">
        <div className="text-sm text-muted">Brand Rider</div>
        <h1 className="font-heading text-4xl mt-1">{title}</h1>
        <p className="text-lg mt-2 text-secondary">{tagline}</p>
      </header>

      <section className="grid grid-cols-12 gap-6">
        <div className="col-span-7 space-y-5">
          <div className="bg-surface/80 rounded-xl border border-border p-4">
            <h2 className="font-heading text-xl mb-2">Voice & Tone</h2>
            <ul className="list-disc list-inside text-sm space-y-1">
              {voiceTone.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>

          <div className="bg-surface/80 rounded-xl border border-border p-4">
            <h2 className="font-heading text-xl mb-2">Signature Phrases</h2>
            <ul className="list-disc list-inside text-sm space-y-1">
              {signaturePhrases.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>

          <div className="bg-surface/80 rounded-xl border border-border p-4">
            <h2 className="font-heading text-xl mb-2">Bio</h2>
            <p className="text-sm leading-6">{bio}</p>
          </div>
        </div>

        <div className="col-span-5 space-y-5">
          <div className="bg-surface/80 rounded-xl border border-border p-4">
            <h2 className="font-heading text-xl mb-2">Color & Type</h2>
            <div className="flex gap-2 mb-3">
              {palette.slice(0,5).map((s, i) => (
                <div key={i} className="rounded-lg overflow-hidden border border-border">
                  <div className="w-16 h-10" style={{ background: s.hex }} />
                  <div className="px-2 py-1 text-[10px] text-muted">
                    <div>{s.name}</div>
                    <div>{s.hex}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-sm">
              <div><span className="text-muted">Heading:</span> {fonts.heading}</div>
              <div><span className="text-muted">Body:</span> {fonts.body}</div>
            </div>
          </div>

          <div className="bg-surface/80 rounded-xl border border-border p-4">
            <h2 className="font-heading text-xl mb-2">Strengths & Watch-outs</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted mb-1">Strengths</div>
                <ul className="list-disc list-inside space-y-1">
                  {strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div>
                <div className="text-muted mb-1">Weaknesses</div>
                <ul className="list-disc list-inside space-y-1">
                  {weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-surface/80 rounded-xl border border-border p-4">
            <h2 className="font-heading text-xl mb-2">Usage Examples</h2>
            <ul className="space-y-2">
              {examples.map((e, i) => (
                <li key={i}>
                  <div className="text-xs text-muted">{e.label}</div>
                  <div className="text-sm">{e.text}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <footer className="mt-6 pt-4 border-t border-border text-xs text-muted">
        Powered by <span className="text-primary">Maximised AI</span>
      </footer>
    </div>
  );
}
components/pdf/PdfCV.tsx
"use client";
import React from "react";

type Role = { role: string; org: string; dates: string; bullets: string[] };

export function PdfCV({
  name,
  role,
  summary,
  roles,
  skills,
  links
}: {
  name: string;
  role: string;
  summary: string;
  roles: Role[];          // max 3
  skills: string[];       // 10–16
  links: { label: string; url: string }[];
}) {
  return (
    <div className="w-[794px] min-h-[1123px] mx-auto bg-bg text-text p-10 rounded-2xl shadow-soft">
      <header className="mb-6">
        <h1 className="font-heading text-4xl">{name}</h1>
        <div className="text-secondary text-lg">{role}</div>
        <p className="mt-3 text-sm text-muted max-w-[680px]">{summary}</p>
      </header>

      <section className="grid grid-cols-12 gap-6">
        <div className="col-span-7 space-y-5">
          <div className="bg-surface/80 rounded-xl border border-border p-4">
            <h2 className="font-heading text-xl mb-2">Experience</h2>
            <div className="space-y-4">
              {roles.slice(0,3).map((r, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{r.role} — <span className="text-secondary">{r.org}</span></div>
                    <div className="text-xs text-muted">{r.dates}</div>
                  </div>
                  <ul className="list-disc list-inside text-sm space-y-1 mt-1">
                    {r.bullets.slice(0,3).map((b, j) => <li key={j}>{b}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-5 space-y-5">
          <div className="bg-surface/80 rounded-xl border border-border p-4">
            <h2 className="font-heading text-xl mb-2">Skills</h2>
            <p className="text-sm">{skills.join(" · ")}</p>
          </div>

          <div className="bg-surface/80 rounded-xl border border-border p-4">
            <h2 className="font-heading text-xl mb-2">Links</h2>
            <ul className="text-sm space-y-1">
              {links.map((l, i) => (
                <li key={i}>
                  <span className="text-muted">{l.label}:</span> <span className="underline">{l.url}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <footer className="mt-6 pt-4 border-t border-border text-xs text-muted">
        Print-ready · One page · <span className="text-primary">Maximised AI</span>
      </footer>
    </div>
  );
}
________________________________________
3) Presentation Formats (Overlays)
Drop these into lib/ai/prompts.ts as format modifiers (they wrap your existing assembly prompts).
export const formatOverlays = {
  ufc: `SYSTEM: Write with high-energy ring-announcer cadence. Open with "In the Black Corner..." Use punchy, short lines. Keep facts accurate.`,
  team: `SYSTEM: Emulate a TV team lineup. Introduce the user as captain or key player. Use lower-third style labels and roster language.`,
  solo: `SYSTEM: Sports commentator tone for an individual athlete. Stats-like phrasing for achievements.`,
  military: `SYSTEM: Brevity and precision. Rank, unit, mission outcomes. No bravado; professional excellence.`,
  nfl: `SYSTEM: American Football broadcast gloss. Playbook metaphors, drive/yardage style phrases.`,
  influencer: `SYSTEM: Celebrity/influencer tone. Social proof, collaborations, audience metrics if provided.`,
  custom: (keywords: string[]) => `SYSTEM: Style to match: ${keywords.join(", ")}. Keep content factual; transform tone only.`
};
At generation time, you prepend one of these strings to your Brand Rider and CV assembly prompts.
________________________________________
4) Export to PDF (server route)
app/api/export/pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import playwright from "playwright-core";

export const runtime = "nodejs"; // ensure Node runtime (not edge)

export async function POST(req: NextRequest) {
  const { html, fileName = "export.pdf" } = await req.json();

  const browser = await playwright.chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 } }); // A4 @ ~96dpi
  await page.setContent(html, { waitUntil: "networkidle" });
  const pdf = await page.pdf({
    printBackground: true,
    width: "794px",
    height: "1123px",
    margin: { top: "12px", right: "12px", bottom: "12px", left: "12px" }
  });
  await browser.close();

  return new NextResponse(pdf, {
    status: 200,
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${fileName}"` }
  });
}
Client helper (render component → HTML → PDF):
import ReactDOMServer from "react-dom/server";

export async function exportComponentToPdf(Component: React.ReactElement, fileName: string) {
  const html = `
    <html>
      <head>
        <meta charSet="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
        <style> ${/* inline a minimal subset of globals.css or load built CSS */""} </style>
      </head>
      <body style="margin:0;background:#0a0a0a;color:#fff;">
        ${ReactDOMServer.renderToString(Component)}
      </body>
    </html>`;

    const res = await fetch("/api/export/pdf", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ html, fileName })
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);
}
________________________________________
5) Wiring it Up in the Wizard
•	When the user picks format (UFC/Team/Solo/Military/NFL/Influencer/Custom), pass the chosen overlay to your assembly endpoints.
•	After generation, feed the JSON into the components above:
o	Brand Rider: PdfBrandRider with palette, fonts, etc.
o	CV: PdfCV with roles, skills, links.
•	Use exportComponentToPdf(<PdfBrandRider {...data} />, "brand-rider.pdf") and likewise for the CV.
•	Add Share, Print, Download (PDF/PNG) buttons on the editor view; PNG can be produced via html-to-image on the client for the hero section.
________________________________________
6) Defaults for “Maximised AI” Theme in the UI
•	Pre-select palette & fonts from maximisedAI on first load for new users.
•	Buttons: rounded-2xl, bg-primary hover: opacity-90, text #fff.
•	Cards: bg-surface/80, border border-border, shadow soft.
•	Hero: use gradientHero for subtle brand glow.
________________________________________
7) Quick Acceptance Test (Brand + CV)
1.	Upload a TXT/PDF → run style & visual synthesis → choose UFC → render Brand Rider.
2.	Swap fonts to Poppins/Inter (already default), adjust one swatch → re-render.
3.	Export Brand Rider & CV to PDF; verify A4 one-page and legible contrast.
4.	Toggle public → appears in /gallery, open share link read-only.
