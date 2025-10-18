import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keywords, roleTags, bio } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

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
            content: "You are a brand designer. Propose a color palette (5 swatches, hex), font pairings (Google Fonts), and a logo concept prompt. Output valid JSON only, no markdown."
          },
          {
            role: "user",
            content: `Create visual brand identity for:
Keywords: ${keywords?.join(", ") || "professional"}
Roles: ${roleTags?.join(", ") || "creator"}
Bio: ${bio || "A professional creator"}

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
  "logo_prompt": "A minimal, scalable logo mark. High contrast, geometric style, professional."
}`
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
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Strip markdown code fences if present
    const cleanContent = content.replace(/^```json\n?/i, '').replace(/\n?```$/i, '').trim();

    const visualData = JSON.parse(cleanContent);

    return new Response(JSON.stringify(visualData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-visual:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
