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
    console.log('Gemini: Generating dynamic script with context:', userContext);
    
    // Add timestamp and randomness for unique scripts
    const enhancedContext = {
      ...userContext,
      currentTime: new Date().toISOString(),
      sessionUniqueId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      promptVariation: Math.floor(Math.random() * 5) + 1
    };
    
    console.log('Gemini: Generating script with context:', userContext);
    
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

    console.log(`Gemini: ✅ Generated ${result.segments.length} unique segments`);
    return result;
    
  } catch (error) {
    console.warn('Gemini: Failed to generate script:', error);
    // NO FALLBACK - Let caller handle the error
    throw new Error(`Dynamic script generation failed: ${error.message}. Please check API configuration.`);
  }
}