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
    const { corpus } = await req.json();
    
    if (!corpus || corpus.trim().length < 50) {
      throw new Error("Corpus must be at least 50 characters");
    }

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
            content: "You analyze user-provided text to distill a brand voice that is practical, witty, and focused on action. Output valid JSON only, no markdown formatting."
          },
          {
            role: "user",
            content: `Analyze this text corpus and extract the brand voice:\n\n${corpus}\n\nReturn JSON with this exact structure:
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
    
    // Parse the JSON response
    const styleData = JSON.parse(cleanContent);

    return new Response(JSON.stringify(styleData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-style:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
