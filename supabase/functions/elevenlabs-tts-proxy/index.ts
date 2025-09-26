import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface TTSRequest {
  text: string;
  voiceId: string;
  model: 'flash-v2.5' | 'v3';
  stability?: number;
  similarity?: number;
  style?: number;
  mode?: 'live' | 'pre-gen';
}

const MODEL_MAP = {
  'flash-v2.5': 'eleven_flash_v2_5', 
  'v3': 'eleven_multilingual_v2'
} as const;

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
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!apiKey) {
      console.error('ELEVENLABS_API_KEY environment variable not set');
      return new Response(
        JSON.stringify({ error: 'ElevenLabs API key not configured' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    const requestData: TTSRequest = await req.json();
    
    // Validate request
    if (!requestData.text || !requestData.voiceId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: text, voiceId' }),
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
      return new Response(
        JSON.stringify({ error: 'Text too long (max 5000 characters)' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    console.log('TTS Proxy: Processing request for voice:', requestData.voiceId, 'text length:', requestData.text.length);

    // Map model name
    const modelId = MODEL_MAP[requestData.model] || MODEL_MAP['flash-v2.5'];
    
    // Choose endpoint based on mode
    const isStreaming = requestData.mode === 'live';
    const endpoint = isStreaming 
      ? `https://api.elevenlabs.io/v1/text-to-speech/${requestData.voiceId}/stream`
      : `https://api.elevenlabs.io/v1/text-to-speech/${requestData.voiceId}`;

    // Prepare ElevenLabs request
    const elevenLabsRequest = {
      text: requestData.text.trim(),
      model_id: modelId,
      voice_settings: {
        stability: requestData.stability ?? 0.7,
        similarity_boost: requestData.similarity ?? 0.8,
        style: requestData.style ?? 0.3,
        use_speaker_boost: true
      },
      output_format: 'mp3_44100_128'
    };

    console.log('TTS Proxy: Calling ElevenLabs API...');

    // Call ElevenLabs API
    const elevenLabsResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify(elevenLabsRequest)
    });

    if (!elevenLabsResponse.ok) {
      let errorMessage = `ElevenLabs API error: ${elevenLabsResponse.status}`;
      
      try {
        const errorData = await elevenLabsResponse.json();
        if (errorData.detail?.message) {
          errorMessage = errorData.detail.message;
        }
      } catch {
        // Error response wasn't JSON
      }
      
      console.error('TTS Proxy: ElevenLabs API error:', errorMessage);
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: elevenLabsResponse.status,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    console.log('TTS Proxy: Successfully received audio from ElevenLabs');

    // Stream audio response back to client
    const audioBlob = await elevenLabsResponse.blob();
    
    if (audioBlob.size === 0) {
      return new Response(
        JSON.stringify({ error: 'Received empty audio response' }),
        {
          status: 500,
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
    console.error('TTS Proxy: Unexpected error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});