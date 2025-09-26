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
You are a professional hypnotherapist creating detailed, timed hypnosis scripts. 

Return JSON ONLY. No markdown, no code fences, no explanatory text.

Schema:
{
  "title": "string",
  "segments": [
    {
      "id": "segment_name",
      "text": "Complete hypnosis script text that takes the allocated time to speak...",
      "mood": "calming|deepening|transformative|energizing", 
      "voice": "female",
      "sfx": "ambient|gentle|energy"
    }
  ],
  "metadata": {
    "durationSec": [DURATION],
    "style": "hypnosis",
    "wordsPerMinute": 150,
    "totalWords": [TOTAL_WORDS]
  }
}

Constraints:
- Each segment must have SUBSTANTIAL text (200-500 words) to fill the allocated time
- Speaking rate is 150 words per minute - calculate text length accordingly
- Use proper hypnotic language patterns and pacing
- Include natural pauses, breathing cues, and progression
- Focus on the specific goals and ego state provided
- Make the script engaging and transformative, not generic
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
  const durationSec = userCtx?.lengthSec || 600;
  const totalMinutes = durationSec / 60;
  const wordsPerMinute = 150;
  const totalWords = Math.floor(totalMinutes * wordsPerMinute);
  const egoState = userCtx?.egoState || 'guardian';
  const goalId = userCtx?.goalId || 'transformation';
  
  // Calculate words per segment for proper duration
  const segmentTimings = [0.08, 0.25, 0.20, 0.30, 0.12, 0.05]; // percentages
  
  return {
    title: `${egoState} Power Protocol: ${goalId}`,
    segments: [
      {
        id: "welcome",
        text: generateRichText(egoState, goalId, 'welcome', Math.floor(totalWords * segmentTimings[0])),
        mood: "welcoming",
        voice: "female",
        sfx: "ambient"
        voice: "female",
        sfx: "ambient"
        id: "induction",
        text: generateRichText(egoState, goalId, 'induction', Math.floor(totalWords * segmentTimings[1])),
        mood: "calming",
        voice: "female",
        sfx: "deep_tone"
        text: "Close your eyes gently and take a deep breath in... hold it for a moment... and slowly let it out. With each breath, feel your body becoming more and more relaxed.",
        mood: "calming",
        id: "deepening",
        text: generateRichText(egoState, goalId, 'deepening', Math.floor(totalWords * segmentTimings[2])),
        mood: "hypnotic",
        voice: "female",
        sfx: "resonance"
      {
        id: "deepening",
        id: "core_work",
        text: generateRichText(egoState, goalId, 'transformation', Math.floor(totalWords * segmentTimings[3])),
        mood: "transformative",
        voice: "female", 
        sfx: "energy"
        sfx: "gentle"
      },
        id: "integration",
        text: generateRichText(egoState, goalId, 'integration', Math.floor(totalWords * segmentTimings[4])),
        mood: "anchoring",
        voice: "female",
        sfx: "crystallize"
        mood: "empowering",
        voice: "female",
        id: "emergence",
        text: generateRichText(egoState, goalId, 'emergence', Math.floor(totalWords * segmentTimings[5])),
        mood: "energizing",
        voice: "female",
        sfx: "awakening"
      }
    ],
    metadata: {
      durationSec: userCtx?.lengthSec || 300,
      style: "hypnosis"
    ],
    metadata: {
      durationSec: durationSec,
      style: "advanced_hypnosis",
      wordsPerMinute: wordsPerMinute,
      totalWords: totalWords
    }
  };
}

function generateRichText(egoState: string, goalId: string, phase: string, targetWords: number): string {
  // Generate substantial text content for each phase
  const templates = {
    welcome: `Welcome to your ${egoState} transformation session. Today we're focusing specifically on ${goalId}, and I want you to know that you're in exactly the right place at exactly the right time for this powerful work. Your ${egoState} energy is already beginning to awaken, preparing to guide you through this profound journey of change. Find your most comfortable position now, whether that's sitting or lying down, and begin to let your body settle into this space. Feel the support beneath you, notice the temperature of the air on your skin, and allow your breathing to find its own natural rhythm. This is your time, your space, your transformation.`,
    induction: `Close your eyes gently now and take your first conscious breath of this session. Breathe in slowly and deeply, filling your lungs completely... and as you exhale, feel the first wave of relaxation beginning to flow through your body. With each breath you take, you're moving deeper into a state of profound relaxation and receptivity. Your ${egoState} energy is guiding this process, ensuring that you feel completely safe and supported as you let go. Notice how with each exhale, tension leaves your body... with each inhale, calm and peace flow in. Your muscles are beginning to soften and relax, starting with your face and jaw, flowing down through your neck and shoulders. This relaxation is deepening with every moment, preparing your mind for the powerful transformation work we'll do around ${goalId}.`,
    deepening: `You're going deeper now, much deeper into this peaceful, receptive state. Your ${egoState} energy is creating the perfect inner environment for change. I want you to imagine yourself slowly descending a beautiful staircase, each step taking you deeper into your inner wisdom. With each step down, you feel twice as relaxed, twice as open to positive change. Step by step, deeper and deeper, your ${egoState} consciousness is expanding, opening to new possibilities around ${goalId}. Feel yourself sinking into this profound state where transformation happens easily and naturally. Your conscious mind can rest now, allowing your ${egoState} wisdom to guide the process of change.`,
    transformation: `Your ${egoState} energy is now fully activated and focused on your ${goalId}. Feel this powerful archetypal force working at the deepest levels of your being, creating the exact changes you desire. These transformations are happening now, in this moment, at the cellular level, at the neurological level, at the quantum level of your existence. Your ${egoState} wisdom knows exactly what needs to change and how to change it. Feel these positive shifts occurring throughout your entire system - in your thoughts, your feelings, your beliefs, your behaviors. Everything related to ${goalId} is being transformed now, upgraded, optimized for your highest good. This change is permanent, powerful, and perfect for you.`,
    integration: `These profound changes are now integrating into every aspect of who you are. Your ${egoState} energy is ensuring that these transformations become a permanent part of your identity, your daily experience, your automatic responses. Feel these changes locking in at the deepest levels, becoming as natural as breathing, as automatic as your heartbeat. When you encounter situations related to ${goalId} in your daily life, these new patterns will activate automatically, guided by your ${egoState} wisdom. You carry this transformation with you always, and it grows stronger with each passing day.`,
    emergence: `It's time now to return to full awareness, bringing all these powerful changes with you. Your ${egoState} energy will continue working on your ${goalId} long after this session ends. I'll count from 1 to 5, and on the count of 5, you'll open your eyes feeling completely refreshed, energized, and transformed. 1... feeling energy beginning to return to your body... 2... becoming more aware of your surroundings... 3... feeling wonderful, feeling powerful, feeling transformed... 4... almost ready to open your eyes... and 5... eyes open! Fully alert, completely refreshed, and permanently changed for the better.`
  };
  
  let baseText = templates[phase as keyof typeof templates] || templates.welcome;
  
  // Expand text to reach target word count
  const currentWords = baseText.split(' ').length;
  if (currentWords < targetWords) {
    const expansionNeeded = targetWords - currentWords;
    // Add breathing cues and pauses to extend duration naturally
    const extensions = [
      " Take another deep breath now, feeling this energy strengthening...",
      " Allow yourself a moment to feel these changes deepening...", 
      " Notice how each breath supports this transformation...",
      " Feel this ${egoState} energy expanding throughout your being...",
      " Let these positive changes continue to unfold naturally..."
    ];
    
    let expandedText = baseText;
    while (expandedText.split(' ').length < targetWords && extensions.length > 0) {
      expandedText += extensions.shift()?.replace('${egoState}', egoState) || '';
    }
    baseText = expandedText;
  }
  
  return baseText;
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