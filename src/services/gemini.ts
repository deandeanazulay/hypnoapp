import { z } from "zod";
import { track } from "./analytics";

const ScriptSegmentSchema = z.object({
  id: z.string(),
  text: z.string(),
  mood: z.string().optional(),
  voice: z.string().optional(),
  sfx: z.string().optional()
});

const ScriptSchema = z.object({
  title: z.string(),
  segments: z.array(ScriptSegmentSchema),
  metadata: z.object({
    durationSec: z.number().optional(),
    style: z.string().optional()
  }).optional()
});

export type ScriptSegment = z.infer<typeof ScriptSegmentSchema>;
export type ScriptPlan = z.infer<typeof ScriptSchema>;

export interface GetSessionScriptParams {
  goalId: string;
  egoState: string;
  lengthSec: number;
  locale: string;
  level: number;
  streak: number;
  userPrefs: Record<string, any>;
}

export async function getSessionScript(params: GetSessionScriptParams): Promise<ScriptPlan> {
  const startTime = Date.now();
  console.log('Gemini: Generating script for', params.egoState, 'session');
  track('llm_generation_start', { goalId: params.goalId, egoState: params.egoState });

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Gemini: Supabase configuration missing. Using mock script.');
    track('supabase_config_missing', { context: 'getSessionScript' });
    return getMockScriptPlan(params);
  }

  console.log('Gemini: Calling generate-script function...');
  
  try {
    const baseUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;
    
    const res = await fetch(`${baseUrl}/functions/v1/generate-script`, {
      method: "POST",
      headers: { 
        "content-type": "application/json",
        "Authorization": `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({ 
        userCtx: params, 
        templates: {
          induction: "Progressive relaxation induction",
          deepener: "Counting deepener",
          emerge: "Standard emergence"
        }
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.warn(`Gemini: Edge function failed: ${res.status} - ${errorText}`);
      track('llm_generation_failure', { error: `HTTP ${res.status}` });
      return getMockScriptPlan(params);
    }

    const json = await res.json();
    console.log('Gemini: Received response, parsing...');
    const script = ScriptSchema.parse(json);
    
    console.log('Gemini: ✅ Generated script with', script.segments.length, 'segments');
    track('llm_generation_success', { 
      duration: Date.now() - startTime, 
      segments: script.segments.length 
    });
    
    return script;

  } catch (error: any) {
    console.error('Gemini: Script generation failed:', error.message);
    track('llm_generation_failure', { error: error.message });
    console.log('Gemini: Using mock script as fallback');
    return getMockScriptPlan(params);
  }
}

function getMockScriptPlan(params: GetSessionScriptParams): ScriptPlan {
  console.log('Gemini: Creating mock script for', params.egoState);
  
  const segments: ScriptSegment[] = [
    { 
      id: 'intro', 
      text: `Welcome to your ${params.egoState} transformation session. We'll work on ${params.goalId} together. Find a comfortable position and allow yourself to relax.`, 
      mood: 'welcoming',
      voice: 'female',
      sfx: 'ambient'
    },
    { 
      id: 'induction', 
      text: 'Close your eyes gently and take a deep breath in... hold it for a moment... and slowly let it out. With each breath, feel your body becoming more and more relaxed, more and more peaceful.',
      mood: 'calming',
      voice: 'female',
      sfx: 'breath'
    },
    { 
      id: 'deepening', 
      text: 'Now imagine yourself going deeper into this wonderful state of relaxation. Count slowly backwards from 10 to 1, and with each number, feel yourself sinking twice as deep into peace and calm.',
      mood: 'deepening',
      voice: 'female',
      sfx: 'gentle'
    },
    { 
      id: 'transformation', 
      text: `As your ${params.egoState} energy awakens within you, feel the transformation beginning. You are releasing what no longer serves you and embracing your true potential. These positive changes flow through every part of your being.`,
      mood: 'empowering',
      voice: 'female',
      sfx: 'energy'
    },
    { 
      id: 'integration', 
      text: 'These powerful changes are becoming part of you now. Feel them integrating into every cell, every thought, every breath. Your transformation is complete and permanent.',
      mood: 'integrating',
      voice: 'female',
      sfx: 'healing'
    },
    { 
      id: 'emergence', 
      text: 'Now it\'s time to return, bringing all these positive changes with you. I\'ll count from 1 to 5. On 5, you\'ll open your eyes feeling completely refreshed, alert, and transformed. 1... 2... 3... 4... 5. Eyes open, fully awake.',
      mood: 'energizing',
      voice: 'female',
      sfx: 'uplifting'
    }
  ];

  console.log('Gemini: ✅ Mock script created with', segments.length, 'segments');

  return {
    title: `${params.egoState} transformation session for ${params.goalId}`,
    segments,
    metadata: {
      durationSec: params.lengthSec,
      style: 'hypnosis'
    }
  };
}

export const generateScriptVariation = (protocol: ScriptPlan, variationNumber: number = 1): ScriptPlan => {
  const variations = {
    1: { inductionPrefix: '', deepeningModifier: '', suggestionSuffix: '' },
    2: { inductionPrefix: 'Take your time to settle in... ', deepeningModifier: 'even more deeply... ', suggestionSuffix: '... and these changes happen naturally and easily' },
    3: { inductionPrefix: 'Allow yourself to begin this journey... ', deepeningModifier: 'further and further... ', suggestionSuffix: '... becoming more true for you each day' }
  };

  const variation = variations[variationNumber as keyof typeof variations] || variations[1];

  const modifiedSegments = protocol.segments.map(segment => ({
    ...segment,
    text: segment.id === 'induction' 
      ? `${variation.inductionPrefix}${segment.text}`
      : segment.id === 'deepening'
      ? segment.text.replace(/deeper/gi, `${variation.deepeningModifier}deeper`)
      : segment.id === 'transformation'
      ? `${segment.text}${variation.suggestionSuffix}`
      : segment.text
  }));

  return {
    ...protocol,
    segments: modifiedSegments
  };
};