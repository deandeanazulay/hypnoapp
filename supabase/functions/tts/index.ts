import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

  try {
    const { text, voiceId = "21m00Tcm4TlvDq8ikWAM" } = await req.json();

    if (!text || text.length > 5000) {
      return new Response("Invalid text input", { status: 400, headers: corsHeaders });
    }

    const key = Deno.env.get("ELEVENLABS_API_KEY");
    if (!key) {
      console.warn("ELEVENLABS_API_KEY not configured, returning browser-tts fallback");
      return new Response(JSON.stringify({ fallback: "browser-tts" }), {
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "content-type": "application/json",
        "accept": "audio/mpeg",
      },
      body: JSON.stringify({ 
        text, 
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.8,
          style: 0.3
        }
      }),
    });

    if (r.status === 401 || r.status === 402 || r.status === 429) {
      console.warn(`ElevenLabs returned ${r.status}, falling back to browser TTS`);
      return new Response(JSON.stringify({ fallback: "browser-tts" }), {
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }
    
    if (!r.ok) {
      const errorText = await r.text();
      console.error(`ElevenLabs API error ${r.status}:`, errorText);
      return new Response(JSON.stringify({ fallback: "browser-tts" }), {
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    const buf = await r.arrayBuffer();
    return new Response(buf, { 
      headers: { 
        "content-type": "audio/mpeg", 
        "content-length": buf.byteLength.toString(),
        ...corsHeaders 
      } 
    });

  } catch (error: any) {
    console.error("TTS error:", error);
    return new Response(JSON.stringify({ fallback: "browser-tts" }), {
      headers: { "content-type": "application/json", ...corsHeaders },
    });
  }
});