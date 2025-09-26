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

CRITICAL: Create unique, varied content every time. Never repeat the same phrases or patterns. Use the current timestamp and session context to ensure complete uniqueness.

Return JSON ONLY. No markdown, no code fences, no explanatory text.

Schema:
{
  "title": "string",
  "segments": [
    {
      "id": "segment_name",
      "text": "Complete, unique hypnosis script text that takes the allocated time to speak...",
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
- VARY the content based on timestamp, user context, and random elements - NO TWO SCRIPTS SHOULD BE THE SAME
- Never use identical phrases or structures between sessions
- Incorporate unique metaphors, imagery, and suggestions each time
- Use the sessionUniqueId and promptVariation to create completely different content
- Reference the current time and make the script feel fresh and personalized
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
  const egoState = String(userCtx?.egoState || 'guardian');
  const goalName = String(userCtx?.goalName || userCtx?.goalId || 'personal transformation');
  const actionName = String(userCtx?.actionName || 'transformation work');
  const protocolName = String(userCtx?.protocolName || 'custom session');
  const variation = userCtx?.variation || 1;
  const sessionId = userCtx?.sessionId || Date.now();
  
  // Calculate words per segment for proper duration
  const segmentTimings = [0.08, 0.25, 0.20, 0.30, 0.12, 0.05]; // percentages
  
  return {
    title: `${egoState} Protocol: ${goalName}`,
    segments: [
      {
        id: "welcome",
        text: generateRichText(egoState, goalName, actionName, 'welcome', Math.floor(totalWords * segmentTimings[0]), sessionId),
        mood: "welcoming",
        voice: "female",
        sfx: "ambient"
      },
      {
        id: "induction",
        text: generateRichText(egoState, goalName, actionName, 'induction', Math.floor(totalWords * segmentTimings[1]), sessionId),
        mood: "calming",
        voice: "female",
        sfx: "deep_tone"
      },
      {
        id: "deepening",
        text: generateRichText(egoState, goalName, actionName, 'deepening', Math.floor(totalWords * segmentTimings[2]), sessionId),
        mood: "hypnotic",
        voice: "female",
        sfx: "resonance"
      },
      {
        id: "core_work",
        text: generateRichText(egoState, goalName, actionName, 'transformation', Math.floor(totalWords * segmentTimings[3]), sessionId),
        mood: "transformative",
        voice: "female", 
        sfx: "energy"
      },
      {
        id: "integration",
        text: generateRichText(egoState, goalName, actionName, 'integration', Math.floor(totalWords * segmentTimings[4]), sessionId),
        mood: "anchoring",
        voice: "female",
        sfx: "crystallize"
      },
      {
        id: "emergence",
        text: generateRichText(egoState, goalName, actionName, 'emergence', Math.floor(totalWords * segmentTimings[5]), sessionId),
        mood: "energizing",
        voice: "female",
        sfx: "awakening"
      }
    ],
    metadata: {
      durationSec: durationSec,
      style: "advanced_hypnosis",
      wordsPerMinute: wordsPerMinute,
      totalWords: totalWords,
      sessionId: sessionId,
      variation: variation
    }
  };
}

function generateRichText(egoState: string, goalName: string, actionName: string, phase: string, targetWords: number, sessionId: number): string {
  // Add variation based on session ID and time
  const timeVariation = Math.floor(Date.now() / 1000) % 5;
  const sessionVariation = sessionId % 3;
  const hourVariation = new Date().getHours() % 4; // Changes every 6 hours
  
  // Ensure parameters are strings
  const safeEgoState = String(egoState || 'guardian');
  const safeGoalName = String(goalName || 'personal transformation');
  const safeActionName = String(actionName || 'transformation work');
  
  // Dynamic metaphors and phrases
  const metaphorSets = [
    ["flowing river", "gentle breeze", "warm sunlight"],
    ["deep ocean", "mountain peak", "starlit sky"],
    ["growing tree", "blooming flower", "crystal formation"],
    ["golden light", "ancient wisdom", "infinite space"],
    ["dancing flames", "whispering wind", "peaceful meadow"]
  ];
  
  const currentMetaphors = metaphorSets[(sessionVariation + hourVariation) % metaphorSets.length];
  const selectedMetaphor = currentMetaphors[timeVariation % currentMetaphors.length];
  
  // Add time-based variations
  const timeOfDay = new Date().getHours();
  const timeContext = timeOfDay < 12 ? "morning energy" : timeOfDay < 18 ? "afternoon clarity" : "evening tranquility";
  
  // Generate substantial text content for each phase
  const templates = {
    welcome: `Welcome to your ${safeEgoState} transformation session in this moment of ${timeContext}. Like ${selectedMetaphor}, this session will flow uniquely for you. Today we're focusing specifically on ${safeGoalName}, and I want you to know that you're in exactly the right place at exactly the right time for this powerful work. Your ${safeEgoState} energy is already beginning to awaken, preparing to guide you through this profound journey of change. Feel the ${timeContext} supporting your transformation as you settle into this space like ${selectedMetaphor} finding its natural state.`,
    induction: `Close your eyes gently now and take your first conscious breath of this unique ${timeContext} session. Like ${selectedMetaphor}, let your breathing flow naturally and deeply. Breathe in slowly and completely... and as you exhale, feel the first wave of relaxation beginning to flow through your body. With each breath you take, you're moving deeper into a state of profound relaxation and receptivity. Your ${safeEgoState} energy is guiding this process, ensuring that you feel completely safe and supported as you let go. Notice how with each exhale, tension leaves your body like ${selectedMetaphor}... with each inhale, the peaceful energy of ${timeContext} flows in.`,
    deepening: `You're going deeper now, much deeper into this peaceful, receptive state of ${timeContext}. Your ${safeEgoState} energy is creating the perfect inner environment for change. Like ${selectedMetaphor}, allow yourself to naturally descend into deeper levels of consciousness. I want you to imagine yourself slowly descending a beautiful staircase bathed in the energy of ${timeContext}, each step taking you deeper into your inner wisdom. With each step down, you feel twice as relaxed, twice as open to positive change around ${safeGoalName}. Your ${safeEgoState} consciousness is expanding like ${selectedMetaphor}, opening to new possibilities in this perfect moment.`,
    transformation: `Your ${safeEgoState} energy is now fully activated and focused on ${safeGoalName} in this sacred time of ${timeContext}. Like ${selectedMetaphor}, feel this powerful archetypal force flowing through every level of your being, creating the exact changes you desire. These transformations are happening now, in this very moment, at the cellular level, at the neurological level, at the quantum level of your existence. Your ${safeEgoState} wisdom knows exactly what needs to change and how to change it. Feel these positive shifts occurring throughout your entire system like ${selectedMetaphor} - naturally, powerfully, perfectly, supported by the energy of ${timeContext}.`,
    integration: `These profound changes are now integrating into every aspect of who you are, like ${selectedMetaphor} becoming part of the landscape in this perfect moment of ${timeContext}. Your ${safeEgoState} energy is ensuring that these transformations become a permanent part of your identity, your daily experience, your automatic responses. Feel these changes locking in at the deepest levels, becoming as natural as breathing, as automatic as your heartbeat. When you encounter situations related to ${safeGoalName} in your daily life, these new patterns will activate automatically, guided by your ${safeEgoState} wisdom like ${selectedMetaphor} carrying the essence of ${timeContext}.`,
    emergence: `It's time now to return to full awareness, bringing all these powerful changes with you like ${selectedMetaphor} carrying its essence wherever it goes in this beautiful ${timeContext}. Your ${safeEgoState} energy will continue working on ${safeGoalName} long after this session ends. I'll count from 1 to 5, and on the count of 5, you'll open your eyes feeling completely refreshed, energized, and transformed. 1... feeling energy beginning to return to your body like ${selectedMetaphor} in the ${timeContext}... 2... becoming more aware of your surroundings... 3... feeling wonderful, feeling powerful, feeling transformed... 4... almost ready to open your eyes... and 5... eyes open! Fully alert, completely refreshed, and permanently changed for the better.`
  };
  
  let baseText = templates[phase as keyof typeof templates] || templates.welcome;
  
  // Expand text to reach target word count
  const currentWords = baseText.split(' ').length;
  if (currentWords < targetWords) {
    const expansionNeeded = targetWords - currentWords;
    // Add breathing cues and pauses to extend duration naturally
    const extensions = [
      ` Take another deep breath now, feeling this energy strengthening like ${selectedMetaphor}...`,
      ` Allow yourself a moment to feel these changes deepening like ${selectedMetaphor}...`, 
      ` Notice how each breath supports this transformation, flowing like ${selectedMetaphor}...`,
      ` Feel this ${egoState} energy expanding throughout your being like ${selectedMetaphor}...`,
      ` Let these positive changes continue to unfold naturally in this ${timeContext}, just like ${selectedMetaphor}...`,
      ` In this moment of ${timeContext}, you are becoming more aligned with ${selectedMetaphor}...`,
      ` Feel the wisdom of ${selectedMetaphor} guiding this transformation through the energy of ${timeContext}...`,
      ` This ${timeContext} supports your ${egoState} transformation like ${selectedMetaphor}...`
    ];
    
    let expandedText = baseText;
    while (expandedText.split(' ').length < targetWords && extensions.length > 0) {
      const extension = extensions.shift()?.replace('${egoState}', egoState).replace(/\${selectedMetaphor}/g, selectedMetaphor) || '';
      expandedText += extension;
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
      return new Response(JSON.stringify({ 
        error: `Gemini API error: ${res.status}`,
        reason: 'API_ERROR',
        suggestion: 'Check GEMINI_API_KEY configuration'
      }), {
        status: 500,
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
      return new Response(JSON.stringify({ 
        error: 'Failed to parse AI response',
        reason: 'PARSE_ERROR',
        suggestion: 'AI returned invalid JSON format'
      }), {
        status: 500,
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
      return new Response(JSON.stringify({ 
        error: 'Script validation failed',
        reason: 'VALIDATION_ERROR',
        details: validationError.message,
        suggestion: 'AI response did not match expected script format'
      }), {
        status: 500,
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

  } catch (error: any) {
    console.error("Generate script error:", error);
    
    // Always return a valid script structure even on error
    console.warn("Generate script failed, returning emergency script:", error.message);
    const emergencyScript = getEmergencyScript(userCtx || {});
    return new Response(JSON.stringify(emergencyScript), {
      headers: { "content-type": "application/json", ...corsHeaders },
    });
  }
});

function getEmergencyScript(userCtx: any): any {
  // Safe parameter extraction with robust defaults
  const egoState = String(userCtx?.egoState || 'guardian');
  const goalName = String(userCtx?.goalName || userCtx?.goalId || 'personal transformation');
  const actionName = String(userCtx?.actionName || 'transformation work');
  const duration = Number(userCtx?.lengthSec) || 600;
  const sessionId = userCtx?.sessionUniqueId || Date.now();
  
  console.log('Emergency script params:', { egoState, goalName, actionName, duration });
  
  return {
    title: `Emergency Session: ${goalName}`,
    segments: [
      {
        id: "emergency_start",
        text: `EMERGENCY MODE: API connection issue. Close your eyes and breathe deeply. We're working on ${goalName} with ${egoState} energy today.`,
        mood: "calming",
        voice: "female",
        sfx: "ambient"
      },
      {
        id: "emergency_relax",
        text: "Take three slow, deep breaths. Inhale for 4 counts, hold for 4, exhale for 6. Feel your body beginning to relax with each breath.",
        mood: "calming",
        voice: "female",
        sfx: "ambient"
      },
      {
        id: "emergency_work",
        text: `Now focus on your goal of ${goalName}. Imagine yourself already achieving this goal. See it clearly, feel it deeply, believe it completely.`,
        mood: "transformative",
        voice: "female",
        sfx: "energy"
      },
      {
        id: "emergency_end",
        text: "Time to return to full awareness. Count with me: 1... feeling energy returning... 2... becoming more alert... 3... eyes open, feeling refreshed.",
        mood: "energizing",
        voice: "female", 
        sfx: "awakening"
      }
    ],
    metadata: {
      durationSec: duration,
      style: "emergency_mode",
      isEmergency: true,
      sessionId: sessionId,
      error: "GEMINI_API_KEY not configured or API call failed"
    }
  };
}