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
      console.log('[SCRIPT-GEN] Generating script for:', userContext.goalName, 'with', userContext.egoState);
      console.log('[SCRIPT-GEN] Full context:', userContext);
    }
    
    // Add timestamp and randomness for unique scripts
    const enhancedContext = {
      ...userContext,
      // Ensure all critical fields are clean strings
      egoState: String(userContext.egoState || 'guardian'),
      goalName: String(userContext.goalName || 'personal transformation'),
      actionName: String(userContext.actionName || 'transformation work'),
      methodName: String(userContext.methodName || 'guided relaxation'),
      protocolName: String(userContext.protocolName || 'custom session'),
      // Add custom protocol specific fields for better Edge Function integration
      customProtocolName: userContext.customProtocol?.name || userContext.protocolName || null,
      customProtocolGoals: userContext.customProtocol?.goals?.join(', ') || '',
      customProtocolInduction: userContext.customProtocol?.induction || '',
      customProtocolDuration: userContext.customProtocol?.duration || userContext.lengthSec || 600,
      customProtocolNotes: userContext.customProtocol?.deepener || ''
    };
    
    console.log('[SCRIPT-GEN] Enhanced context prepared:', enhancedContext);
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    // Enhanced validation for environment variables
    if (!supabaseUrl || !supabaseAnonKey || 
        supabaseUrl === 'null' || supabaseUrl === 'undefined' || 
        supabaseAnonKey === 'null' || supabaseAnonKey === 'undefined' ||
        supabaseUrl === 'YOUR_SUPABASE_URL' || 
        supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY' ||
        supabaseUrl.trim() === '' || supabaseAnonKey.trim() === '' ||
        supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1')) {
      console.warn('[SCRIPT-GEN] Invalid Supabase configuration detected');
      console.warn('VITE_SUPABASE_URL:', supabaseUrl);
      console.warn('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '[PRESENT]' : '[MISSING]');
      
      // Create emergency fallback script instead of throwing error
      console.warn('[SCRIPT-GEN] Using emergency fallback script due to missing Supabase config');
      return createEmergencyScript(enhancedContext);
    }
    
    // Ensure URL is properly formatted
    let baseUrl: string;
    try {
      if (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://')) {
        baseUrl = supabaseUrl;
      } else {
        baseUrl = `https://${supabaseUrl}`;
      }
      
      // Validate URL format
      new URL(baseUrl);
    } catch (urlError) {
      console.error('[SCRIPT-GEN] Invalid Supabase URL format:', supabaseUrl);
      return createEmergencyScript(enhancedContext);
    }
    
    const functionUrl = `${baseUrl}/functions/v1/generate-script`;
    
    // Test connectivity before making the actual request
    try {
      console.log('[SCRIPT-GEN] Testing connectivity to:', functionUrl);
      
      // Quick connectivity test with shorter timeout
      const testResponse = await fetch(functionUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000) // 3 second timeout for connectivity test
      });
      
      console.log('[SCRIPT-GEN] Connectivity test result:', testResponse.status);
    } catch (connectivityError) {
      console.error('[SCRIPT-GEN] Connectivity test failed:', connectivityError);
      console.warn('[SCRIPT-GEN] Cannot reach Supabase Edge Functions, using emergency script');
      return createEmergencyScript(enhancedContext);
    }
    
    try {
      console.log('[SCRIPT-GEN] Calling script generation at:', functionUrl);
      const response = await safeFetch(
        functionUrl,
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
      console.log('[SCRIPT-GEN] Received response:', result);
      
      if (!result.segments || result.segments.length === 0) {
        console.error('[SCRIPT-GEN] No segments in response:', result);
        console.warn('[SCRIPT-GEN] No segments returned, using emergency script');
        return createEmergencyScript(enhancedContext);
      }

      if (import.meta.env.DEV) {
        console.log(`[SCRIPT-GEN] Generated ${result.segments.length} segments successfully`);
      }
      return result;
      
    } catch (fetchError) {
      console.error('[SCRIPT-GEN] Fetch error:', fetchError);
      console.warn('[SCRIPT-GEN] API call failed, using emergency script');
      return createEmergencyScript(enhancedContext);
    }
    
  } catch (error: any) {
    console.error('[SCRIPT-GEN] Unexpected error:', error);
    console.warn('[SCRIPT-GEN] Using emergency fallback script');
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