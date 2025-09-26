import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
};

interface TTSRequest {
  text: string;
  voiceId: string;
  model: string;
  stability?: number;
  similarity?: number;
  style?: number;
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
    if (Deno.env.get('NODE_ENV') === 'development') {
      console.log('TTS: Function called');
    }
    
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!apiKey) {
      console.error('TTS: ELEVENLABS_API_KEY environment variable not set');
      return new Response(
        JSON.stringify({ 
          error: 'ElevenLabs API key not configured',
          reason: 'ELEVENLABS_API_KEY not found in environment variables. Please add it in Supabase Edge Functions settings.',
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
    console.log('TTS: Processing request for voice:', requestData.voiceId, 'text length:', requestData.text.length);
    
    // Validate request
    if (!requestData.text || !requestData.voiceId) {
      console.error('TTS: Missing required fields');
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: text, voiceId',
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
    if (requestData.text.length > 5000) {
      console.error('TTS: Text too long:', requestData.text.length);
      return new Response(
        JSON.stringify({ 
          error: 'Text too long (max 5000 characters)',
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

    // Prepare ElevenLabs request
    const elevenLabsRequest = {
      text: requestData.text.trim(),
      model_id: requestData.model || "eleven_multilingual_v2",
      voice_settings: {
        stability: requestData.stability ?? 0.5,
        similarity_boost: requestData.similarity ?? 0.75,
        style: requestData.style ?? 0.0,
        use_speaker_boost: true
      },
      output_format: 'mp3_44100_128'
    };

    if (Deno.env.get('NODE_ENV') === 'development') {
      console.log('TTS: Calling ElevenLabs API...');
    }

    // Call ElevenLabs API
    const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${requestData.voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify(elevenLabsRequest)
    });

    if (Deno.env.get('NODE_ENV') === 'development') {
      console.log('TTS: ElevenLabs response status:', elevenLabsResponse.status);
    }

    if (!elevenLabsResponse.ok) {
      let errorMessage = `ElevenLabs API error: ${elevenLabsResponse.status}`;
      
      try {
        const errorData = await elevenLabsResponse.json();
        console.error('TTS: ElevenLabs error data:', errorData);
        if (errorData.detail?.message) {
          errorMessage = errorData.detail.message;
        }
      } catch {
        // Error response wasn't JSON
      }
      
      console.error('TTS: ElevenLabs API error:', errorMessage);
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          reason: `ElevenLabs API returned ${elevenLabsResponse.status}. Check your API key and voice ID.`,
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

    if (Deno.env.get('NODE_ENV') === 'development') {
      console.log('TTS: Successfully received audio from ElevenLabs');
    }

    // Stream audio response back to client
    const audioBlob = await elevenLabsResponse.blob();
    
    if (Deno.env.get('NODE_ENV') === 'development') {
      console.log('TTS: Audio blob size:', audioBlob.size);
    }
    
    if (audioBlob.size === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Received empty audio response',
          reason: 'ElevenLabs returned empty audio. This might be a voice ID issue or API limit.',
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
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBlob.size.toString(),
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('TTS: Unexpected error:', error);
    
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