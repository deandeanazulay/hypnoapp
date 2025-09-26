import { safeFetch, ApiError, getUserFriendlyErrorMessage } from '../utils/apiErrorHandler';

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
    if (import.meta.env.DEV) {
      console.log('ChatGPT: Generating script for:', userContext.goalName, 'with', userContext.egoState);
    }
    
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
    
    // Robust validation for environment variables
    if (!supabaseUrl || !supabaseAnonKey || 
        supabaseUrl === 'null' || supabaseUrl === 'undefined' || 
        supabaseAnonKey === 'null' || supabaseAnonKey === 'undefined' ||
        supabaseUrl === 'YOUR_SUPABASE_URL' || 
        supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY' ||
        supabaseUrl.trim() === '' || supabaseAnonKey.trim() === '') {
      console.warn('ChatGPT: Invalid Supabase configuration detected');
      console.warn('VITE_SUPABASE_URL:', supabaseUrl);
      console.warn('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '[PRESENT]' : '[MISSING]');
      throw new Error('Invalid or missing Supabase configuration. Please check your environment variables.');
    }
    
    const baseUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;
    
    // Validate the final URL before making the request
    let validatedUrl: URL;
    try {
      validatedUrl = new URL(`${baseUrl}/functions/v1/generate-script`);
    
      const response = await safeFetch(
        validatedUrl.toString(),
        {
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
        },
        {
          operation: 'Script Generation',
          additionalContext: {
            egoState: enhancedContext.egoState,
            goalName: enhancedContext.goalName,
            duration: enhancedContext.lengthSec
          }
        }
      );

      const result = await response.json();
      
      if (!result.segments || result.segments.length === 0) {
        throw new ApiError(
          'No segments returned from script generation',
          500,
          'NO_SEGMENTS',
          'Script generation API returned empty or invalid response',
          'Try again or check API configuration'
        );
      }

      if (import.meta.env.DEV) {
        console.log(`ChatGPT: Generated ${result.segments.length} segments`);
      }
      return result;
      
    } catch (urlError) {
      console.error('ChatGPT: Invalid Supabase URL construction');
      console.error('Base URL:', baseUrl);
      throw new ApiError(
        'Invalid Supabase URL configuration',
        500,
        'INVALID_URL',
        `Base URL: ${baseUrl}`,
        'Verify VITE_SUPABASE_URL is correct'
      );
    }
    
  } catch (error: any) {
    if (error instanceof ApiError) {
      console.error('Script generation failed:', getUserFriendlyErrorMessage(error));
      throw error;
    }
    
    console.error('Script generation failed with unexpected error:', error);
    
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