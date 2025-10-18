import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const formatOverlays = {
  ufc: `Write with high-energy ring-announcer cadence. Open with "In the Black Corner..." Use punchy, short lines. Keep facts accurate.`,
  team: `Emulate a TV team lineup. Introduce the user as captain or key player. Use lower-third style labels and roster language.`,
  solo: `Sports commentator tone for an individual athlete. Stats-like phrasing for achievements.`,
  military: `Brevity and precision. Rank, unit, mission outcomes. No bravado; professional excellence.`,
  nfl: `American Football broadcast gloss. Playbook metaphors, drive/yardage style phrases.`,
  influencer: `Celebrity/influencer tone. Social proof, collaborations, audience metrics if provided.`,
  custom: `Professional and adaptable tone. Match the user's voice while maintaining clarity.`
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { styleData, visualData, format = 'custom' } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const overlay = formatOverlays[format as keyof typeof formatOverlays] || formatOverlays.custom;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `${overlay}\n\nCompose a 1-page Brand Rider. Brevity, clarity, scannability. Output Markdown.`
          },
          {
            role: "user",
            content: `Create a Brand Rider using this data:

Style: ${JSON.stringify(styleData, null, 2)}
Visual: ${JSON.stringify(visualData, null, 2)}

Structure:
# Brand Rider

## Tagline
[Memorable one-liner from style data]

## Voice & Tone
- [Bullet points from tone data]

## Signature Phrases
- [Key phrases that define the voice]

## Strengths & Watch-outs
**Strengths:**
- [Bullet list from style data]

**Watch-outs:**
- [Potential weaknesses from style data]

## Color & Type
[Describe the palette and fonts from visual data]

## Bio
[Use the bio from style data, 80-120 words]

## Usage Examples
1. **Email opener**: [Example using the voice]
2. **LinkedIn about**: [Example using the voice]
3. **Website hero**: [Example using the voice]`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const markdown = data.choices?.[0]?.message?.content;
    
    if (!markdown) {
      throw new Error("No content in AI response");
    }

    return new Response(JSON.stringify({ markdown }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-brand-rider:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
