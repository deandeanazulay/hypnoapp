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
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      console.error('OPENAI_API_KEY environment variable not set');
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured',
          reason: 'OPENAI_API_KEY not found in environment variables. Please add it in Supabase Edge Functions settings.',
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

    const requestData: TTSRequest = await req.json();
    
    // Validate request
    if (!requestData.text || !requestData.voice) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: text, voice',
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
          error: 'Text too long (max 4096 characters)',
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
      model: requestData.model || "tts-1",
      input: requestData.text.trim(),
      voice: requestData.voice,
      response_format: requestData.response_format || "wav",
      speed: requestData.speed || 1.0
    };

    // Call OpenAI TTS API
    const openaiResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(openaiRequest)
    });

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
          reason: `OpenAI TTS API returned ${openaiResponse.status}. Check your API key and request parameters.`,
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
          reason: 'OpenAI TTS returned empty audio. This might be a voice parameter or API issue.',
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

    return new Response(audioBlob, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': audioBlob.size.toString(),
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('OpenAI TTS: Unexpected error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        reason: error.message,
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