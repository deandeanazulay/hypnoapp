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
    console.log('ChatGPT: Generating script for:', userContext.goalName, 'with', userContext.egoState);
    
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
      console.warn('ChatGPT: Supabase not configured, using fallback');
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
      console.warn('ChatGPT: API error, using fallback:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.segments || result.segments.length === 0) {
      throw new Error('No segments returned from API');
    }

    if (import.meta.env.DEV) {
      console.log(`ChatGPT: Generated ${result.segments.length} segments`);
    }
    return result;
    
  } catch (error) {
    console.error('Script generation failed:', error);
    
    // Try one more time with a direct API call as final backup
    console.warn('Edge function failed, attempting direct API call...');
    try {
      const script = await generateScriptDirectly(enhancedContext);
      if (script.segments && script.segments.length > 0) {
        console.log('Direct API call succeeded!');
        return script;
      }
    } catch (directError) {
      console.error('Direct API call also failed:', directError);
    }
    
    // Final emergency fallback - guaranteed to work
    console.warn('All AI attempts failed, using final emergency script');
    return createEmergencyScript(enhancedContext);
  }
}

async function generateScriptDirectly(userContext: any): Promise<SessionScript> {
  // This would be a direct call to OpenAI API if needed as fallback
  throw new Error('Direct API call not implemented');
}

function createEmergencyScript(userContext: any): SessionScript {
  const egoState = String(userContext.egoState || 'guardian');
  const goalName = String(userContext.goalName || 'personal transformation');
  
  return {
    title: `Emergency ${egoState} Session`,
    segments: [
      {
        id: 'emergency-intro',
        text: `Welcome to your emergency ${egoState} session for ${goalName}. Close your eyes and breathe deeply.`,
        approxSec: 15
      },
      {
        id: 'emergency-relax',
        text: 'Take three slow, deep breaths. Feel your body beginning to relax with each exhale.',
        approxSec: 30
      },
      {
        id: 'emergency-end',
        text: 'Count from 1 to 5 and open your eyes feeling refreshed and calm.',
        approxSec: 15
      }
    ],
    metadata: {
      isEmergency: true,
      source: 'fallback'
    }
  };
}