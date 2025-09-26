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

function buildDetailedPrompt(userCtx: any): string {
  const durationMin = (userCtx.lengthSec || 600) / 60;
  const targetWords = userCtx.targetWords || Math.floor(durationMin * 150);
  const egoState = userCtx.egoState || 'guardian';
  const goalId = userCtx.goalId || 'transformation';
  
  return `You are a master hypnotherapist creating a ${durationMin}-minute hypnosis script.

CRITICAL REQUIREMENTS:
- Total script must be EXACTLY ${durationMin} minutes (${targetWords} words at 150 words/minute)
- Create 6 substantial segments with rich, detailed content
- Each segment should be ${Math.floor(targetWords/6)} words on average
- Use ${egoState} archetypal energy throughout
- Focus intensely on goal: ${goalId}
${userCtx.customProtocol ? `
- This is a CUSTOM PROTOCOL: "${userCtx.customProtocol.name}"
- Specific goals: ${userCtx.customProtocol.goals?.join(', ') || 'transformation'}  
- Use ${userCtx.customProtocol.induction || 'progressive'} induction method
- Incorporate: ${userCtx.customProtocol.deepener || 'standard approach'}` : ''}
${userCtx.protocol ? `
- Use PREDEFINED PROTOCOL: "${userCtx.protocol.name}"
- Description: ${userCtx.protocol.description}
- Category: ${userCtx.protocol.category}
- Adapt this protocol content to ${egoState} energy` : ''}

SEGMENT TIMING (must total ${durationMin} minutes):
1. Welcome (8% = ${Math.floor(durationMin * 0.08)} min) - ${Math.floor(targetWords * 0.08)} words
2. Induction (25% = ${Math.floor(durationMin * 0.25)} min) - ${Math.floor(targetWords * 0.25)} words  
3. Deepening (20% = ${Math.floor(durationMin * 0.20)} min) - ${Math.floor(targetWords * 0.20)} words
4. Core Work (30% = ${Math.floor(durationMin * 0.30)} min) - ${Math.floor(targetWords * 0.30)} words
5. Integration (12% = ${Math.floor(durationMin * 0.12)} min) - ${Math.floor(targetWords * 0.12)} words  
6. Emergence (5% = ${Math.floor(durationMin * 0.05)} min) - ${Math.floor(targetWords * 0.05)} words

Each segment must be SUBSTANTIAL and detailed, with rich hypnotic language, natural pauses, breathing cues, and progressive deepening.

Return JSON ONLY with this exact schema:
{
  "title": "string",
  "segments": [
    {
      "id": "welcome",
      "text": "Complete substantial welcome script...",
      "mood": "welcoming", 
      "voice": "female",
      "sfx": "ambient"
    }
  ],
  "metadata": {
    "durationSec": ${userCtx.lengthSec || 600},
    "style": "hypnosis",
    "wordsPerMinute": 150,
    "totalWords": ${targetWords}
  }
}

NO other text - only the JSON object.`;
}

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
  const durationSec = userCtx?.lengthSec || 600;
  const totalMinutes = durationSec / 60;
  const wordsPerMinute = 150;
  const totalWords = Math.floor(totalMinutes * wordsPerMinute);
  const egoState = userCtx?.egoState || 'guardian';
  const goalId = userCtx?.goalId || 'transformation';
  
  return {
    title: `${egoState} Power Protocol: ${goalId} (${totalMinutes} minutes)`,
    segments: [
      {
        id: "welcome",
        text: `Welcome to your ${totalMinutes}-minute ${egoState} transformation session. Today we're focusing intensively on ${goalId}, and I want you to know that you're about to experience profound and lasting change. Your ${egoState} energy is already beginning to stir within you, preparing to guide you through this powerful journey. Find your most comfortable position now and begin to settle into this sacred space of transformation.`,
        mood: "authoritative",
        voice: "female",
        sfx: "ambient"
      },
      {
        id: "induction", 
        text: `Close your eyes now and take a deep, conscious breath. Feel your ${egoState} energy beginning to activate as you breathe in... and as you exhale, feel the first wave of profound relaxation flowing through your entire body. With each breath you take, you're moving deeper into a state of receptivity and transformation. Your ${egoState} wisdom is guiding this process, ensuring that every cell, every nerve, every thought becomes perfectly aligned for the powerful work we'll do on ${goalId}. Feel yourself sinking deeper with each word I speak, each breath you take.`,
        mood: "commanding",
        voice: "female",
        sfx: "deep_tone"
      },
      {
        id: "deepening",
        text: `Now I want you to go even deeper, much deeper than you've ever gone before. Your ${egoState} energy is creating the perfect inner environment for transformation. Feel yourself descending through layers of consciousness, each level bringing you closer to the core where real change happens. Count backwards with me from 10 to 1, and with each number, feel yourself dropping twice as deep into this receptive state. 10... deeper now... 9... even deeper... 8... your ${egoState} wisdom taking control... 7... profoundly relaxed... 6... deeper still... 5... so deep now... 4... perfect state for ${goalId}... 3... almost there... 2... so very deep... 1... perfect.`,
        mood: "hypnotic",
        voice: "female", 
        sfx: "resonance"
      },
      {
        id: "core_work",
        text: `Your ${egoState} energy is now fully activated and laser-focused on ${goalId}. Feel this powerful archetypal force working at the deepest levels of your being, creating the exact changes you desire and need. Every limiting belief, every old pattern, every obstacle related to ${goalId} is dissolving now, being replaced by strength, capability, and natural ease. Your ${egoState} wisdom knows exactly what needs to change and is making those changes now, permanently and powerfully. Feel these transformations occurring in your nervous system, in your thought patterns, in your emotional responses. You are becoming someone who naturally, effortlessly, joyfully experiences ${goalId} in your daily life.`,
        mood: "transformative",
        voice: "female",
        sfx: "energy"
      },
      {
        id: "integration", 
        text: `These profound changes are now locking in at every level of your being. Your ${egoState} energy is ensuring that these transformations around ${goalId} become a permanent, unshakeable part of who you are. Feel these changes crystallizing in your neural pathways, embedding in your cellular memory, becoming as natural and automatic as your heartbeat. When you encounter situations related to ${goalId} in your daily life, these new responses will activate instantly, guided by your ${egoState} wisdom. You carry this transformation with you always, and it grows stronger with each passing day.`,
        mood: "anchoring",
        voice: "female",
        sfx: "crystallize"
      },
      {
        id: "emergence",
        text: `Time to return now, bringing all these powerful changes with you. Your ${egoState} energy will continue working on your ${goalId} long after this session ends. Count with me from 1 to 5, feeling more alert and energized with each number. 1... energy returning to your body... 2... becoming more aware... 3... feeling fantastic, feeling powerful... 4... almost ready to open your eyes... and 5... eyes open! Fully alert, completely refreshed, and permanently transformed. Welcome back to your new reality.`,
        mood: "triumphant",
        voice: "female",
        sfx: "awakening"
      }
    ],
    metadata: {
      durationSec: durationSec,
      style: "advanced_hypnosis",
      wordsPerMinute: wordsPerMinute,
      totalWords: totalWords
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
      console.log(`Script Generation: Mock script created with ${mockScript.segments.length} segments, ${mockScript.metadata.totalWords} words`);
      return new Response(JSON.stringify(mockScript), {
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Script Generation: Calling Gemini API for ${(userCtx.lengthSec || 0) / 60}-minute script...`);
    
    // Build detailed prompt
    const detailedPrompt = buildDetailedPrompt(userCtx);
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;

    const body = {
      generationConfig: { 
        temperature: 0.4,
        topP: 0.8, 
        maxOutputTokens: 4096,
        responseMimeType: "application/json"
      },
      contents: [
        { role: "user", parts: [{ text: detailedPrompt }] }
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

    console.log("Script Generation: Gemini API call successful, parsing response...");
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
      const totalWords = script.segments.reduce((sum, seg) => sum + seg.text.split(' ').length, 0);
      console.log(`Script Generation: SUCCESS - Generated ${script.segments.length} segments, ${totalWords} words, ~${Math.floor(totalWords/150)} minutes`);
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
    const mockScript = getMockScript(error.userCtx || { egoState: 'guardian', goalId: 'transformation', lengthSec: 600 });
    return new Response(JSON.stringify(mockScript), {
      headers: { "content-type": "application/json", ...corsHeaders },
    });
  }
});