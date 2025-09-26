export interface ScriptSegment {
  id: string;
  text: string;
  approxSec?: number;
  mood?: string;
  voice?: string;
  sfx?: string;
}

export interface SessionScript {
  title: string;
  segments: ScriptSegment[];
  metadata?: any;
}

export async function getSessionScript(userContext: any): Promise<SessionScript> {
  try {
    console.log('Gemini: Generating script for:', userContext.goalName, 'with', userContext.egoState);
    
    // Add timestamp and randomness for unique scripts
    const enhancedContext = {
      ...userContext,
      // Ensure all critical fields are clean strings
      egoState: String(userContext.egoState || 'guardian'),
      goalName: String(userContext.goalName || 'personal transformation'),
      actionName: String(userContext.actionName || 'transformation work'),
      methodName: String(userContext.methodName || 'guided relaxation'),
      protocolName: String(userContext.protocolName || 'custom session')
    };
    
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Gemini: Supabase not configured, using fallback');
      throw new Error('Supabase configuration missing');
    }
    
    const baseUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;
    
    const response = await fetch(`${baseUrl}/functions/v1/generate-script`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        userCtx: enhancedContext,
        templates: {
          systemPrompt: 'Create a unique, dynamic hypnosis script',
          requireUnique: true
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('Gemini: API error, using fallback:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.segments || result.segments.length === 0) {
      throw new Error('No segments returned from API');
    }

    if (import.meta.env.DEV) {
      console.log(`Gemini: Generated ${result.segments.length} segments`);
    }
    return result;
    
  } catch (error) {
    console.error('Script generation failed:', error);
    
    // Return emergency fallback to prevent session from breaking
    console.warn('Using emergency fallback script');
    return {
      title: `Emergency Session: ${enhancedContext.goalName}`,
      segments: [
        {
          id: "emergency_intro",
          text: `API ERROR: Close your eyes and breathe. Working on ${enhancedContext.goalName} in emergency mode.`,
          approxSec: 30
        },
        {
          id: "emergency_relax",
          text: "Take deep breaths. Relax your body. This is a basic session while AI is being configured.",
          approxSec: 60
        },
        {
          id: "emergency_work", 
          text: `Focus on ${enhancedContext.goalName}. Imagine achieving this goal successfully.`,
          approxSec: 180
        },
        {
          id: "emergency_end",
          text: "Count 1, 2, 3 and open your eyes. Configure GEMINI_API_KEY for full AI sessions.",
          approxSec: 30
        }
      ],
      metadata: {
        isEmergency: true,
        error: error.message
      }
    };
  }
}

async function generateScriptDirectly(userContext: any): Promise<SessionScript> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const prompt = `Create a ${Math.floor(userContext.lengthSec / 60)}-minute hypnosis script for:
- Goal: ${userContext.goalName}
- Ego State: ${userContext.egoState}
- Action: ${userContext.actionName}

Return ONLY valid JSON with this structure:
{
  "title": "Session Title",
  "segments": [
    {"id": "intro", "text": "Complete script text...", "mood": "calming"},
    {"id": "main", "text": "Main transformation text...", "mood": "transformative"},
    {"id": "end", "text": "Awakening text...", "mood": "energizing"}
  ]
}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Direct API call failed: ${response.status}`);
  }

  const data = await response.json();
  const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!aiResponse) {
    throw new Error('No response from Gemini API');
  }

  const script = JSON.parse(aiResponse);
  if (!script.segments || script.segments.length === 0) {
    throw new Error('Invalid script structure from API');
  }

  return script;
}

function createEmergencyScript(userContext: any): SessionScript {
  const egoState = String(userContext?.egoState || 'guardian');
  const goalName = String(userContext?.goalName || 'personal transformation');
  const actionName = String(userContext?.actionName || 'transformation work');
  
  return {
    title: `Emergency Mode: ${goalName}`,
    segments: [
      {
        id: "emergency_1",
        text: `Emergency session activated. Close your eyes and breathe deeply. Today we're working on ${goalName} using ${egoState} energy.`,
        approxSec: 30,
        mood: "calming"
      },
      {
        id: "emergency_2", 
        text: "Take slow, deep breaths. Count backwards from 10 to 1, feeling more relaxed with each number.",
        approxSec: 45,
        mood: "deepening"
      },
      {
        id: "emergency_3",
        text: `Focus on your intention for ${goalName}. Visualize yourself succeeding. Feel the confidence and power within you.`,
        approxSec: 120,
        mood: "transformative"
      },
      {
        id: "emergency_4",
        text: "Count from 1 to 5. On 5, open your eyes feeling refreshed and empowered. 1... 2... 3... 4... 5, eyes open!",
        approxSec: 25,
        mood: "energizing"
      }
    ],
    metadata: {
      isEmergency: true,
      durationSec: userContext?.lengthSec || 600
    }
  };
}