import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  console.log(`TTS: Received ${req.method} request`);
  
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
    const requestBody = await req.json();
    console.log('TTS: Request body:', requestBody);
    
    const { text, voiceId = "pNInz6obpgDQGcFmaJgB" } = requestBody;

    // Validate input
    if (!text || typeof text !== 'string') {
      console.error('TTS: Invalid text input:', text);
      return new Response(JSON.stringify({ 
        fallback: "browser-tts",
        reason: "Invalid text input - must be a non-empty string"
      }), { 
        status: 400, 
        headers: { "content-type": "application/json", ...corsHeaders }
      });
    }

    // Trim and validate text length
    const processedText = text.trim();
    if (processedText.length === 0) {
      console.error('TTS: Empty text after trimming');
      return new Response(JSON.stringify({ 
        fallback: "browser-tts",
        reason: "Text is empty after trimming"
      }), { 
        status: 400, 
        headers: { "content-type": "application/json", ...corsHeaders }
      });
    }

    if (processedText.length > 3000) {
      console.error(`TTS: Text too long: ${processedText.length} characters (max 3000)`);
      return new Response(JSON.stringify({ 
        fallback: "browser-tts",
        reason: `Text too long: ${processedText.length} characters (max 3000 for eleven_flash_v2_5)`
      }), { 
        status: 400, 
        headers: { "content-type": "application/json", ...corsHeaders }
      });
    }

    // Get API key
    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) {
      console.warn("TTS: ELEVENLABS_API_KEY not configured");
      return new Response(JSON.stringify({ 
        fallback: "browser-tts",
        reason: "ElevenLabs API key not configured in Supabase Edge Functions environment"
      }), {
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    console.log(`TTS: Processing ${processedText.length} characters with voice ${voiceId}`);
    console.log(`TTS: Text preview: "${processedText.substring(0, 100)}..."`);

    // ElevenLabs API request body
    const elevenLabsBody = { 
      text: processedText,
      model_id: "eleven_flash_v2_5",
      voice_settings: {
        stability: 0.7,
        similarity_boost: 0.8,
        style: 0.3,
        use_speaker_boost: true
      },
      output_format: "mp3_44100_128"
    };

    console.log('TTS: Calling ElevenLabs API with body:', JSON.stringify(elevenLabsBody, null, 2));

    // Call ElevenLabs API
    const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "content-type": "application/json",
        "accept": "audio/mpeg",
      },
      body: JSON.stringify(elevenLabsBody),
    });

    console.log(`TTS: ElevenLabs response status: ${elevenLabsResponse.status}`);
    console.log(`TTS: ElevenLabs response headers:`, Object.fromEntries(elevenLabsResponse.headers.entries()));

    // Handle specific error codes with detailed logging
    if (elevenLabsResponse.status === 401) {
      console.error("TTS: ElevenLabs authentication failed - invalid API key");
      return new Response(JSON.stringify({ 
        fallback: "browser-tts",
        reason: "ElevenLabs authentication failed - check API key in Supabase settings",
        details: { status: 401, voiceId, textLength: processedText.length }
      }), {
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    if (elevenLabsResponse.status === 402) {
      console.error("TTS: ElevenLabs payment required - quota exceeded");
      return new Response(JSON.stringify({ 
        fallback: "browser-tts",
        reason: "ElevenLabs quota exceeded - upgrade your plan or wait for reset",
        details: { status: 402, voiceId, textLength: processedText.length }
      }), {
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    if (elevenLabsResponse.status === 429) {
      console.error("TTS: ElevenLabs rate limited");
      return new Response(JSON.stringify({ 
        fallback: "browser-tts",
        reason: "ElevenLabs rate limited - too many requests per minute",
        details: { status: 429, voiceId, textLength: processedText.length }
      }), {
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    if (elevenLabsResponse.status === 422) {
      let validationError = 'Unknown validation error';
      try {
        const errorData = await elevenLabsResponse.json();
        validationError = JSON.stringify(errorData);
        console.error("TTS: ElevenLabs validation error:", errorData);
      } catch {
        validationError = await elevenLabsResponse.text();
        console.error("TTS: ElevenLabs validation error (text):", validationError);
      }
      
      return new Response(JSON.stringify({ 
        fallback: "browser-tts",
        reason: `ElevenLabs validation error: ${validationError}`,
        details: { status: 422, voiceId, textLength: processedText.length, model: "eleven_flash_v2_5" }
      }), {
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    if (!elevenLabsResponse.ok) {
      let errorDetails = '';
      let errorData = null;
      
      try {
        const contentType = elevenLabsResponse.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          errorData = await elevenLabsResponse.json();
          errorDetails = JSON.stringify(errorData);
        } else {
          errorDetails = await elevenLabsResponse.text();
        }
        console.error(`TTS: ElevenLabs API error ${elevenLabsResponse.status}:`, errorData || errorDetails);
      } catch (parseError) {
        errorDetails = 'Could not parse error response';
        console.error(`TTS: Could not parse ElevenLabs error response:`, parseError);
      }
      
      return new Response(JSON.stringify({ 
        fallback: "browser-tts",
        reason: `ElevenLabs API error ${elevenLabsResponse.status}: ${errorDetails}`,
        details: {
          status: elevenLabsResponse.status,
          textLength: processedText.length,
          voiceId: voiceId,
          model: "eleven_flash_v2_5",
          errorData: errorData
        }
      }), {
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    // Check content type of successful response
    const responseContentType = elevenLabsResponse.headers.get("content-type") || "";
    console.log(`TTS: ElevenLabs response content-type: ${responseContentType}`);
    
    if (!responseContentType.includes("audio/")) {
      // Response is not audio - might be JSON error
      const responseText = await elevenLabsResponse.text();
      console.error("TTS: ElevenLabs returned non-audio response:", responseText);
      
      let parsedError = null;
      try {
        parsedError = JSON.parse(responseText);
      } catch {}
      
      return new Response(JSON.stringify({ 
        fallback: "browser-tts",
        reason: `ElevenLabs returned ${responseContentType} instead of audio`,
        details: {
          status: elevenLabsResponse.status,
          contentType: responseContentType,
          response: responseText,
          parsedError: parsedError
        }
      }), {
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    // Get audio data
    const audioBuffer = await elevenLabsResponse.arrayBuffer();
    
    if (audioBuffer.byteLength === 0) {
      console.error("TTS: ElevenLabs returned empty audio response");
      return new Response(JSON.stringify({ 
        fallback: "browser-tts",
        reason: "ElevenLabs returned empty audio (0 bytes)"
      }), {
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    console.log(`TTS: ✅ Successfully generated ${audioBuffer.byteLength} bytes of audio from ElevenLabs`);

    // Return audio data
    return new Response(audioBuffer, { 
      headers: { 
        "content-type": "audio/mpeg", 
        "content-length": audioBuffer.byteLength.toString(),
        ...corsHeaders 
      } 
    });

  } catch (error: any) {
    console.error("TTS: Unexpected function error:", error);
    return new Response(JSON.stringify({ 
      fallback: "browser-tts",
      reason: `TTS function error: ${error.message}`,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { "content-type": "application/json", ...corsHeaders },
    });
  }
});