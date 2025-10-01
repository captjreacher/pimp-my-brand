// AI prompt templates for brand generation

export const formatOverlays = {
  ufc: `Write with high-energy ring-announcer cadence. Open with "In the Black Corner..." Use punchy, short lines. Keep facts accurate.`,
  team: `Emulate a TV team lineup. Introduce the user as captain or key player. Use lower-third style labels and roster language.`,
  solo: `Sports commentator tone for an individual athlete. Stats-like phrasing for achievements.`,
  military: `Brevity and precision. Rank, unit, mission outcomes. No bravado; professional excellence.`,
  nfl: `American Football broadcast gloss. Playbook metaphors, drive/yardage style phrases.`,
  influencer: `Celebrity/influencer tone. Social proof, collaborations, audience metrics if provided.`,
  custom: `Professional and adaptable tone. Match the user's voice while maintaining clarity.`
};

export function getStylePrompt(corpus: string) {
  return {
    system: "You analyze user-provided text to distill a brand voice that is practical, witty, and focused on action. Output JSON only.",
    user: `Analyze this text corpus and extract the brand voice:\n\n${corpus}\n\nReturn JSON with this structure:
{
  "tone": {
    "adjectives": ["action-oriented", "witty", "concise"],
    "dos": ["Use active voice", "Keep it real"],
    "donts": ["Avoid jargon", "No passive voice"]
  },
  "signature_phrases": ["phrase1", "phrase2", "phrase3"],
  "strengths": ["clarity", "energy", "authenticity"],
  "weaknesses": ["may be too casual for formal contexts"],
  "tagline": "A memorable one-liner",
  "bio": "80-120 word bio capturing the essence"
}`
  };
}

export function getVisualPrompt(keywords: string[], roleTags: string[], bio: string) {
  return {
    system: "You are a brand designer. Propose a color palette (5 swatches, hex), font pairings (Google Fonts), and a logo concept prompt for image generation. Output JSON only.",
    user: `Create visual brand identity for:
Keywords: ${keywords.join(", ")}
Roles: ${roleTags.join(", ")}
Bio: ${bio}

Return JSON:
{
  "palette": [
    {"name": "Primary", "hex": "#ff4f00"},
    {"name": "Secondary", "hex": "#89bbfe"},
    {"name": "Accent", "hex": "#ffe066"},
    {"name": "Dark", "hex": "#111316"},
    {"name": "Light", "hex": "#ffffff"}
  ],
  "fonts": {
    "heading": "Poppins",
    "body": "Inter"
  },
  "logo_prompt": "A minimal, scalable logo mark representing [concept]. High contrast, SVG-ready, geometric style."
}`
  };
}

export function getBrandRiderPrompt(
  styleData: any,
  visualData: any,
  format: keyof typeof formatOverlays
) {
  const overlay = formatOverlays[format];
  return {
    system: `${overlay}\n\nCompose a 1-page Brand Rider. Brevity, clarity, scannability. Output Markdown.`,
    user: `Create a Brand Rider using this data:

Style: ${JSON.stringify(styleData, null, 2)}
Visual: ${JSON.stringify(visualData, null, 2)}

Structure:
# Brand Rider

## Tagline
[Memorable one-liner]

## Voice & Tone
- [Bullet points from tone data]

## Signature Phrases
- [Key phrases that define the voice]

## Strengths & Watch-outs
**Strengths:**
- [Bullet list]

**Watch-outs:**
- [Potential weaknesses]

## Color & Type
[Describe the palette and fonts]

## Bio
[80-120 words capturing the essence]

## Usage Examples
1. **Email opener**: [Example]
2. **LinkedIn about**: [Example]
3. **Website hero**: [Example]`
  };
}
