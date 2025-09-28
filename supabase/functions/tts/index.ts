import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
};

interface TTSRequest {
  text: string;
  voice: string;
  model: string;
  speed?: number;
  response_format?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED',
        details: 'Only POST requests are supported'
      }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      console.error('OPENAI_API_KEY environment variable not set');
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured',
          code: 'MISSING_API_KEY',
          details: 'OPENAI_API_KEY not found in environment variables',
          suggestion: 'Add OPENAI_API_KEY in Supabase Edge Functions settings',
          provider: 'browser-tts'
        }),
        {
          status: 200, // Don't fail the request, just indicate fallback
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    let requestData: TTSRequest;
    try {
      requestData = await req.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON',
          details: parseError.message
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    // Validate request
    if (!requestData.text || !requestData.voice) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          code: 'MISSING_FIELDS',
          details: 'text and voice are required',
          provider: 'browser-tts'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Validate text length
    if (requestData.text.length > 4096) {
      return new Response(
        JSON.stringify({ 
          error: 'Text too long',
          code: 'TEXT_TOO_LONG',
          details: `Text length: ${requestData.text.length}, max: 4096`,
          suggestion: 'Reduce text length and try again',
          provider: 'browser-tts'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Prepare OpenAI TTS request
    const openaiRequest = {
      model: requestData.model || "tts-1", // Use same model as working setup
      input: requestData.text.trim(),
      voice: requestData.voice || "ash", // Default to ash voice
      response_format: requestData.response_format || "mp3",
      speed: requestData.speed || 1.0
    };

    if (import.meta.env.DEV) {
      console.log('🎤 OpenAI TTS: Calling API with ash voice:', {
        model: openaiRequest.model,
        voice: openaiRequest.voice,
        textLength: openaiRequest.input.length,
        speed: openaiRequest.speed,
        format: openaiRequest.response_format
      });
    }

    // Call OpenAI TTS API
    console.log('🎤 Making OpenAI TTS API call...');
    const openaiResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(openaiRequest)
    });

    console.log('🎤 OpenAI TTS API response status:', openaiResponse.status);
    
    if (!openaiResponse.ok) {
      let errorMessage = `OpenAI TTS API error: ${openaiResponse.status}`;
      
      try {
        const errorData = await openaiResponse.json();
        console.error('OpenAI TTS error data:', errorData);
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        // Error response wasn't JSON
      }
      
      console.error('OpenAI TTS API error:', errorMessage);
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          code: 'OPENAI_TTS_ERROR',
          details: `API returned status ${openaiResponse.status}`,
          suggestion: 'Check API key and request parameters',
          provider: 'browser-tts'
        }),
        {
          status: 200, // Don't fail the session, fall back to browser TTS
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Get audio response from OpenAI
    const audioBlob = await openaiResponse.blob();
    
    if (audioBlob.size === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Received empty audio response',
          code: 'EMPTY_AUDIO',
          details: 'OpenAI TTS returned empty audio',
          suggestion: 'Check voice parameters or try again',
          provider: 'browser-tts'
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    console.log('OpenAI TTS: Successfully generated audio with ash voice, size:', audioBlob.size);

    return new Response(audioBlob, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBlob.size.toString(),
        'Cache-Control': 'public, max-age=3600',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('OpenAI TTS: Unexpected error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: error.message,
        suggestion: 'Try again or contact support if issue persists',
        provider: 'browser-tts'
      }),
      {
        status: 200, // Fall back gracefully
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});