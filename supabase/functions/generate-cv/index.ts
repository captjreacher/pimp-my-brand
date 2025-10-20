import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const formatOverlays = {
  ufc: `Write with high-energy ring-announcer cadence. Transform achievements into KNOCKOUT victories and CHAMPIONSHIP-LEVEL performance. Use punchy, short lines. Keep facts accurate.`,
  team: `Emulate a TV team roster card. Present the user as team captain or key player. Use lower-third style labels and roster language with TEAM CAPTAIN emphasis.`,
  solo: `Sports commentator tone for an individual athlete. Transform achievements into PERSONAL BESTS and RECORD-BREAKING performance. Stats-like phrasing for accomplishments.`,
  military: `Brevity and precision. Transform roles into COMMAND positions and achievements into MISSION ACCOMPLISHED objectives. Professional excellence without bravado.`,
  nfl: `American Football broadcast style. Transform projects into GAME-CHANGING plays and achievements into TOUCHDOWN moments. Playbook metaphors throughout.`,
  influencer: `Celebrity/influencer tone. Transform achievements into VIRAL successes and TRENDING accomplishments. Social proof and collaboration emphasis.`,
  executive: `C-suite authority and corporate leadership. Transform achievements into STRATEGIC victories and P&L impact. Boardroom-ready language.`,
  artist: `Creative portfolio and press kit style. Transform achievements into CRITICALLY ACCLAIMED work and VISIONARY creative direction.`,
  humanitarian: `Mission-driven impact focus. Transform achievements into lives EMPOWERED and communities TRANSFORMED. Purpose-driven language.`,
  creator: `Content creator and digital platform style. Transform achievements into VIRAL content and algorithm-beating success. Creator economy language.`,
  fashion: `Editorial and runway style. Transform achievements into EDITORIAL precision and COUTURE-LEVEL excellence. Sophisticated fashion terminology.`,
  custom: `Professional and adaptable tone. Match the user's voice while maintaining clarity and impact.`
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { styleData, extractedText, format = 'custom', userProfile } = await req.json();

    if (!styleData || !extractedText) {
      throw new Error("Style data and extracted text are required");
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const overlay = formatOverlays[format as keyof typeof formatOverlays] || formatOverlays.custom;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `${overlay}\n\nCreate a professional CV/resume using the provided data. Focus on impact, achievements, and professional excellence. Output structured JSON with CV sections.`
          },
          {
            role: "user",
            content: `Create a professional CV using this data:

Style Analysis: ${JSON.stringify(styleData, null, 2)}
Extracted Text: ${extractedText}
User Profile: ${JSON.stringify(userProfile || {}, null, 2)}

Generate a CV with this exact JSON structure:
{
  "name": "[Name from profile or extracted from text]",
  "role": "[Professional title/role]",
  "summary": "[2-3 sentence professional summary using the bio and tagline from style data]",
  "experience": [
    {
      "role": "[Job title]",
      "org": "[Company/Organization]",
      "dates": "[Date range]",
      "bullets": [
        "[Achievement bullet point 1]",
        "[Achievement bullet point 2]",
        "[Achievement bullet point 3]"
      ]
    }
  ],
  "skills": [
    "[Skill 1]",
    "[Skill 2]",
    "[Skill 3]"
  ],
  "links": [
    {
      "label": "[Platform name]",
      "url": "[URL]"
    }
  ]
}

Requirements:
- Extract name from userProfile or text
- Create professional role/title
- Use bio and tagline from styleData for summary
- Extract 2-3 most recent/relevant roles from text
- Limit to 3 bullet points per role focusing on achievements
- Include 8-12 relevant skills from strengths and extracted text
- Include professional links if available
- Apply the ${format} format overlay to transform language and tone
- Keep all facts accurate while enhancing presentation`
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
          JSON.stringify({ error: "Payment required. Please add credits to your OpenAI account." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Strip markdown code fences if present
    const cleanContent = content.replace(/^```json\n?/i, '').replace(/\n?```$/i, '').trim();

    let cvData;
    try {
      cvData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse CV JSON:", cleanContent);
      throw new Error("Invalid JSON response from AI");
    }

    // Validate required fields
    if (!cvData.name || !cvData.role || !cvData.summary) {
      throw new Error("Missing required CV fields");
    }

    // Ensure arrays exist
    cvData.experience = cvData.experience || [];
    cvData.skills = cvData.skills || [];
    cvData.links = cvData.links || [];

    // Add format information
    cvData.format = format;

    return new Response(JSON.stringify(cvData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-cv:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});