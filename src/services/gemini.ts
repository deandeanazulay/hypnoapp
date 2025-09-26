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

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('Gemini: No Supabase config, using mock script');
    return getMockScriptPlan(params);
  }

  
  try {
    const baseUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;
    
    // Calculate proper word count for duration
    const totalMinutes = params.lengthSec / 60;
    const wordsPerMinute = 150; // Slower speaking rate for hypnosis
    const totalWords = Math.floor(totalMinutes * wordsPerMinute);
    
    console.log(`Gemini: Requesting ${totalMinutes}-minute script (${totalWords} words) for ${params.egoState} ego state`);
    
    const res = await fetch(`${baseUrl}/functions/v1/ai-hypnosis`, {
      method: "POST",
      headers: { 
        "content-type": "application/json",
        "Authorization": `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({ 
        message: "Generate a complete hypnosis script",
        sessionContext: {
          egoState: params.egoState,
          phase: 'preparation',
          depth: 1,
          breathing: 'rest',
          userProfile: { level: params.level },
          conversationHistory: [],
          customProtocol: params.userPrefs?.customProtocol
        },
        requestType: 'script_generation',
        scriptParams: {
          goalId: params.goalId,
          egoState: params.egoState,
          lengthSec: params.lengthSec,
          level: params.level,
          streak: params.streak,
          locale: params.locale,
          userPrefs: params.userPrefs,
          targetWords: totalWords,
          wordsPerMinute: wordsPerMinute
        }
      }),
    });

    if (!res.ok) {
      console.log(`Gemini: API error ${res.status}, using mock script`);
      return getMockScriptPlan(params);
    }

    const data = await res.json();
    
    if (data.response) {
      try {
        const scriptData = JSON.parse(data.response);
        const script = ScriptSchema.parse(scriptData);
        console.log(`Gemini: Successfully generated ${script.segments.length} segments`);
        return script;
      } catch (parseError) {
        console.log('Gemini: Failed to parse script response, using mock');
        return getMockScriptPlan(params);
      }
    }
    
    console.log('Gemini: No response content, using mock script');
    return getMockScriptPlan(params);

  } catch (error: any) {
    console.log('Gemini: Network error, using mock script:', error.message);
    return getMockScriptPlan(params);
  }
}

function getMockScriptPlan(params: GetSessionScriptParams): ScriptPlan {
  // Calculate optimal timing based on hypnosis best practices
  const totalMinutes = params.lengthSec / 60;
  const wordsPerMinute = 150; // Slower speaking rate for hypnosis
  const totalWords = Math.floor(totalMinutes * wordsPerMinute);
  
  // Advanced script structure with ego state integration
  const segments: ScriptSegment[] = [
    { 
      id: 'pre_induction', 
      text: generateEgoStateIntro(params.egoState, params.goalId), 
      mood: 'authoritative',
      voice: 'female',
      sfx: 'ambient'
    },
    { 
      id: 'induction', 
      text: generateRapidInduction(params.egoState, params.goalId),
      mood: 'commanding',
      voice: 'female',
      sfx: 'deep_tone'
    },
    { 
      id: 'deepening', 
      text: generateFractionationDeepening(params.egoState),
      mood: 'hypnotic',
      voice: 'female',
      sfx: 'resonance'
    },
    { 
      id: 'ego_activation', 
      text: generateEgoStateActivation(params.egoState, params.goalId),
      mood: 'powerful',
      voice: 'female',
      sfx: 'activation'
    },
    { 
      id: 'transformation_work', 
      text: generateAdvancedSuggestions(params.egoState, params.goalId),
      mood: 'transformative',
      voice: 'female',
      sfx: 'transformation'
    },
    { 
      id: 'integration', 
      text: generateIntegration(params.egoState, params.goalId),
      mood: 'anchoring',
      voice: 'female',
      sfx: 'crystallize'
    },
    { 
      id: 'emergence', 
      text: generateConfidentEmergence(params.egoState, params.goalId),
      mood: 'triumphant',
      voice: 'female',
      sfx: 'awakening'
    }
  ];

  return {
    title: `${params.egoState} Power Protocol: ${params.goalId}`,
    segments,
    metadata: {
      durationSec: params.lengthSec,
      style: 'advanced_hypnosis',
      wordsPerMinute: wordsPerMinute,
      totalWords: totalWords,
      technique: 'ego_state_integration_with_rapid_induction'
    }
  };
}

// Advanced script generation functions
function generateEgoStateIntro(egoState: string, goalId: string): string {
  const intros = {
    guardian: `Your guardian spirit is awakening now. Feel that protective force rising within you, ready to shield you from anything that doesn't serve your transformation around ${goalId}.`,
    rebel: `There's a revolutionary force inside you that's been waiting for this moment. Your rebel energy is stirring, ready to shatter every limitation around ${goalId}.`,
    healer: `Your inner healer is awakening, bringing profound restoration. Feel that gentle, powerful healing energy focusing on your ${goalId}.`,
    mystic: `Connect with the infinite wisdom that flows through you. Your mystic nature knows the deepest secrets of transformation around ${goalId}.`,
    explorer: `Your adventurous spirit is ready to discover new territories. Feel that explorer energy awakening, eager to venture into new possibilities around ${goalId}.`
  };
  return intros[egoState as keyof typeof intros] || intros.guardian;
}

function generateRapidInduction(egoState: string, goalId: string): string {
  // Stage hypnosis-style rapid induction
  return `Close your eyes NOW and take a deep breath. That's it. Feel your body relaxing instantly, completely, deeply. With every word I speak, you go deeper and deeper into hypnosis. Your ${egoState} energy is guiding you into the perfect state for working on ${goalId}. Deeper and deeper now, following your ${egoState} wisdom into profound transformation.`;
}

function generateFractionationDeepening(egoState: string): string {
  // Advanced fractionation technique
  return `Now open your eyes for just a moment... and close them again, going TWICE as deep. That's the power of your ${egoState} energy - each time you relax, you go deeper than before. Open them again briefly... and close them, going even DEEPER still. Feel yourself sinking into the most profound state of receptivity you've ever experienced.`;
}

function generateEgoStateActivation(egoState: string, goalId: string): string {
  const activations = {
    guardian: `Your guardian force is fully activated now. Feel that protective power coursing through you, creating unshakeable safety for your transformation around ${goalId}.`,
    rebel: `Your rebel spirit is FULLY ALIVE now. Feel that revolutionary energy breaking through every barrier, every limitation around ${goalId}. You are unstoppable.`,
    healer: `Your healing energy is flowing at maximum power now. Every cell, every thought, every feeling around ${goalId} is being restored to perfect harmony.`,
    mystic: `Your connection to infinite consciousness is wide open now. Universal wisdom is flowing through you, revealing profound truths about ${goalId}.`,
    explorer: `Your explorer energy is at full power now. You're venturing fearlessly into new territories of possibility around ${goalId}.`
  };
  return activations[egoState as keyof typeof activations] || activations.guardian;
}

function generateAdvancedSuggestions(egoState: string, goalId: string): string {
  // Core transformation work with embedded commands
  const suggestions = {
    'stress-relief': 'Stress is dissolving from your system now, completely and permanently. Your body remembers how to be calm. Your mind knows peace as its natural state.',
    'confidence': 'Confidence flows through you like a river of liquid gold. You feel it in your posture, your voice, your presence. This confidence is yours by right.',
    'sleep': 'Your natural sleep rhythm is restored now. Your body knows exactly when and how to sleep deeply, peacefully, naturally.',
    'healing': 'Healing happens now at the deepest levels. Your body\'s intelligence is activated, restoring perfect balance and vitality.',
    'transformation': 'You are becoming your most powerful self now. Old limitations dissolve like morning mist. Your true nature emerges, confident and free.'
  };
  
  const coreWork = suggestions[goalId as keyof typeof suggestions] || suggestions.transformation;
  return `${coreWork} Your ${egoState} energy amplifies these changes, making them deeper, stronger, more permanent than ever before.`;
}

function generateIntegration(egoState: string, goalId: string): string {
  return `These changes are locking in now at the cellular level, the neurological level, the quantum level of your being. Your ${egoState} energy ensures these transformations around ${goalId} become a permanent part of who you are. Feel them crystallizing, becoming unshakeable, lasting forever.`;
}

function generateConfidentEmergence(egoState: string, goalId: string): string {
  return `Time to return now, carrying these powerful changes with you. Your ${egoState} energy will continue working on ${goalId} long after this session ends. 1... feeling energy returning... 2... awareness expanding... 3... feeling fantastic... 4... almost ready... 5... eyes open! Completely alert, totally refreshed, permanently transformed!`;
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