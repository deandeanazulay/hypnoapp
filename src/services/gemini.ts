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