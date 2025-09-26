import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const { text, voiceId = "pNInz6obpgDQGcFmaJgB" } = await req.json();

    // Validate input
    if (!text || text.length > 5000) {
      return new Response(JSON.stringify({ 
        fallback: "browser-tts",
        reason: "Invalid text input - must be 1-5000 characters"
      }), { 
        status: 400, 
        headers: { "content-type": "application/json", ...corsHeaders }
      });
    }

    // Get API key
    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) {
      console.warn("ELEVENLABS_API_KEY not configured, returning browser-tts fallback");
      return new Response(JSON.stringify({ 
        fallback: "browser-tts",
        reason: "ElevenLabs API key not configured"
      }), {
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    console.log(`TTS: Processing ${text.length} characters with voice ${voiceId}`);

    // Call ElevenLabs API
    const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "content-type": "application/json",
        "accept": "audio/mpeg",
      },
      body: JSON.stringify({ 
        text: text.trim(),
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.8,
          style: 0.3,
          use_speaker_boost: true
        },
        output_format: "mp3_44100_128"
      }),
    });

    // Handle specific error codes with detailed reasons
    if (elevenLabsResponse.status === 401) {
      console.warn("ElevenLabs: Authentication failed - invalid API key");
      return new Response(JSON.stringify({ 
        fallback: "browser-tts",
        reason: "ElevenLabs authentication failed - check API key"
      }), {
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    if (elevenLabsResponse.status === 402) {
      console.warn("ElevenLabs: Payment required - quota exceeded");
      return new Response(JSON.stringify({ 
        fallback: "browser-tts",
        reason: "ElevenLabs quota exceeded - upgrade plan needed"
      }), {
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    if (elevenLabsResponse.status === 429) {
      console.warn("ElevenLabs: Rate limited");
      return new Response(JSON.stringify({ 
        fallback: "browser-tts",
        reason: "ElevenLabs rate limited - try again later"
      }), {
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    if (elevenLabsResponse.status === 422) {
      const errorData = await elevenLabsResponse.text();
      console.warn("ElevenLabs: Invalid request:", errorData);
      return new Response(JSON.stringify({ 
        fallback: "browser-tts",
        reason: `ElevenLabs validation error: ${errorData}`
      }), {
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error(`ElevenLabs API error ${elevenLabsResponse.status}:`, errorText);
      return new Response(JSON.stringify({ 
        fallback: "browser-tts",
        reason: `ElevenLabs API error ${elevenLabsResponse.status}: ${errorText}`
      }), {
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    // Get audio data
    const audioBuffer = await elevenLabsResponse.arrayBuffer();
    
    if (audioBuffer.byteLength === 0) {
      console.error("ElevenLabs returned empty audio response");
      return new Response(JSON.stringify({ 
        fallback: "browser-tts",
        reason: "ElevenLabs returned empty audio"
      }), {
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    console.log(`TTS: Successfully generated ${audioBuffer.byteLength} bytes of audio`);

    // Return audio data
    return new Response(audioBuffer, { 
      headers: { 
        "content-type": "audio/mpeg", 
        "content-length": audioBuffer.byteLength.toString(),
        ...corsHeaders 
      } 
    });

  } catch (error: any) {
    console.error("TTS function error:", error);
    return new Response(JSON.stringify({ 
      fallback: "browser-tts",
      reason: `TTS function error: ${error.message}`,
      error: error.message
    }), {
      status: 500,
      headers: { "content-type": "application/json", ...corsHeaders },
    });
  }
});