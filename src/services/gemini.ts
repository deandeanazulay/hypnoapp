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
    console.log('Gemini: Generating script with context:', userContext);
    
    const { data, error } = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-script`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        egoState: userContext.egoState || 'guardian',
        goalId: userContext.goalId || 'transformation',
        lengthSec: userContext.lengthSec || 600,
        customProtocol: userContext.customProtocol,
        protocol: userContext.protocol,
        userPrefs: userContext.userPrefs || {}
      })
    });

    if (error) {
      console.warn('Gemini: API error, using fallback');
      throw new Error(`API Error: ${error}`);
    }

    const result = await data.json();
    
    if (!result.segments || result.segments.length === 0) {
      throw new Error('No segments returned from API');
    }

    console.log(`Gemini: Generated ${result.segments.length} segments`);
    return result;
    
  } catch (error) {
    console.warn('Gemini: Failed to generate script:', error);
    throw error; // Let session.ts handle the fallback
  }
}