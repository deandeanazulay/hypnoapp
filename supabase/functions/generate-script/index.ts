import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const Script = z.object({
  title: z.string(),
  segments: z.array(z.object({
    id: z.string(),
    text: z.string(),
    mood: z.string().optional(),
    voice: z.string().optional(),
    sfx: z.string().optional(),
  })),
  metadata: z.object({
    durationSec: z.number().optional(),
    style: z.string().optional(),
  }).optional(),
});

const SYSTEM_RULES = `
Return JSON ONLY. No markdown, no code fences, no prose.
Schema:
{
  "title": "string",
  "segments": [ { "id":"intro","text":"string","mood":"calm","voice":"female","sfx":"waves" } ],
  "metadata": { "durationSec": 180, "style": "hypnosis" }
}
Constraints:
- Escape quotes.
- No trailing commas.
- Each "text" <= 700 chars.
- If unsure, return an empty array for optional fields.
`;

// robust extractor for when APIs wrap output
function extractJson(raw: string) {
  try { return JSON.parse(raw); } catch {}
  const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
  if (fenced) { try { return JSON.parse(fenced[1]); } catch {} }
  const s = raw.indexOf("{"); const e = raw.lastIndexOf("}");
  if (s !== -1 && e > s) { const slice = raw.slice(s, e + 1); try { return JSON.parse(slice); } catch {} }
  throw new Error("Failed to parse JSON");
}

function getMockScript(userCtx: any): any {
  return {
    title: `${userCtx?.egoState || 'Guardian'} Transformation Session`,
    segments: [
      {
        id: "intro",
        text: `Welcome to your ${userCtx?.egoState || 'Guardian'} session. Find a comfortable position and let's begin this transformation journey together.`,
        mood: "welcoming",
        voice: "female",
        sfx: "ambient"
      },
      {
        id: "induction", 
        text: "Close your eyes gently and take a deep breath in... hold it for a moment... and slowly let it out. With each breath, feel your body becoming more and more relaxed.",
        mood: "calming",
        voice: "female",
        sfx: "breath"
      },
      {
        id: "deepening",
        text: "Now imagine yourself going deeper into this wonderful state of relaxation. Count slowly backwards from 5 to 1, and with each number, feel yourself sinking twice as deep.",
        mood: "deepening",
        voice: "female", 
        sfx: "gentle"
      },
      {
        id: "transformation",
        text: `Feel your ${userCtx?.egoState || 'Guardian'} energy awakening within you. You are releasing what no longer serves you and embracing your true potential.`,
        mood: "empowering",
        voice: "female",
        sfx: "energy"
      },
      {
        id: "emergence",
        text: "Now it's time to return. Count from 1 to 5, and with each number, feel yourself becoming more alert. 5... eyes open, fully awake and transformed.",
        mood: "energizing",
        voice: "female",
        sfx: "uplifting"
      }
    ],
    metadata: {
      durationSec: userCtx?.lengthSec || 300,
      style: "hypnosis"
    }
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

  try {
    const { userCtx, templates } = await req.json();

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not configured, using mock script");
      const mockScript = getMockScript(userCtx);
      return new Response(JSON.stringify(mockScript), {
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    // Google Gemini endpoint (key on query string)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;

    const body = {
      generationConfig: { 
        temperature: 0.3,
        topP: 0.9, 
        maxOutputTokens: 2048,
        responseMimeType: "application/json"
      },
      contents: [
        { role: "user", parts: [{ text: SYSTEM_RULES }] },
        { role: "user", parts: [{ text: JSON.stringify({ userCtx, templates }) }] }
      ]
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.warn(`Gemini API error ${res.status}, using mock script`);
      const mockScript = getMockScript(userCtx);
      return new Response(JSON.stringify(mockScript), {
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    const raw = await res.text();

    // Unwrap candidates → JSON text → parse
    let payload: any;
    try {
      const j = JSON.parse(raw);
      const text = j.candidates?.[0]?.content?.parts?.[0]?.text ?? j.output_text ?? raw;
      payload = typeof text === "string" ? extractJson(text) : extractJson(JSON.stringify(text));
    } catch {
      console.warn("Failed to extract JSON from Gemini response, using mock script");
      const mockScript = getMockScript(userCtx);
      return new Response(JSON.stringify(mockScript), {
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    try {
      const script = Script.parse(payload);
      return new Response(JSON.stringify(script), {
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    } catch (validationError) {
      console.warn("Script validation failed, using mock script:", validationError);
      const mockScript = getMockScript(userCtx);
      return new Response(JSON.stringify(mockScript), {
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

  } catch (error: any) {
    console.error("Generate script error:", error);
    const mockScript = getMockScript({ egoState: 'Guardian' });
    return new Response(JSON.stringify(mockScript), {
      headers: { "content-type": "application/json", ...corsHeaders },
    });
  }
});