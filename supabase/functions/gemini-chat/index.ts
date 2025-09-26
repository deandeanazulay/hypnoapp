import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface ChatRequest {
  message: string;
  knowledgeBase: any;
  conversationHistory: Array<{role: 'user' | 'assistant', content: string}>;
}

const LIBERO_SYSTEM_PROMPT = `You are Libero, an AI assistant and expert on the Libero hypnotherapy app. You help users understand the app, troubleshoot issues, and provide guidance on hypnotherapy and consciousness transformation.

KNOWLEDGE BASE CONTEXT:
You have access to detailed information about:
- Libero app features and functionality  
- Ego states and archetypal guides
- Hypnosis protocols and categories
- Technical setup and configuration
- User progress and gamification
- Troubleshooting common issues

RESPONSE STYLE:
- Be helpful, knowledgeable, and supportive
- Use the user's current app context to provide personalized help
- Explain technical concepts in simple terms
- Provide step-by-step solutions for problems
- Reference specific app features and data when relevant
- Use a warm, encouraging tone that matches Libero's brand

TROUBLESHOOTING FOCUS:
- Help diagnose API configuration issues
- Explain how to set up environment variables
- Guide users through common setup problems
- Provide clear error explanations
- Suggest specific solutions for Libero app issues

Answer questions clearly and provide actionable help based on the user's current app state and the knowledge base provided.`;

Deno.serve(async (req: Request) => {
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
    const { message, knowledgeBase, conversationHistory }: ChatRequest = await req.json();

    console.log('Gemini Chat: Processing message:', message);
    console.log('Gemini Chat: Knowledge base keys:', Object.keys(knowledgeBase || {}));

    // Get Gemini API key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY not configured');
      return new Response(
        JSON.stringify({
          response: `❌ **GEMINI_API_KEY Not Configured**

The Gemini API key is missing from your Supabase Edge Functions environment variables.

**To fix this:**
1. Go to your Supabase Dashboard
2. Navigate to Edge Functions → Settings
3. Add environment variable: \`GEMINI_API_KEY\` = your Google API key
4. Redeploy your functions

**Get a free Gemini API key:**
- Visit: https://makersuite.google.com/app/apikey
- Sign in with Google account
- Create new API key
- Copy and paste into Supabase

**Current App Status:**
- User Level: ${knowledgeBase?.currentUser?.level || 'N/A'}
- Active Ego State: ${knowledgeBase?.currentUser?.activeEgoState || 'N/A'}
- Plan: ${knowledgeBase?.currentUser?.plan || 'N/A'}

Without the API key, script generation will fail and you'll get 0 segments in sessions.`,
          error: 'GEMINI_API_KEY not configured',
          timestamp: Date.now()
        }),
        {
          status: 200, // Don't fail the chat, provide helpful error info
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Build conversation for Gemini
    const conversation = [
      {
        role: 'user',
        parts: [{ 
          text: `${LIBERO_SYSTEM_PROMPT}

CURRENT USER CONTEXT:
${JSON.stringify(knowledgeBase, null, 2)}

User's message: ${message}` 
        }]
      },
      ...conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))
    ];

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: conversation,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      
      return new Response(
        JSON.stringify({
          response: `🔌 **Gemini API Error (${response.status})**

The API key is configured but the call failed.

**Error Details:**
\`\`\`
${errorText}
\`\`\`

**Possible Solutions:**
• API key may be invalid or expired
• Rate limits exceeded
• Temporary API outage
• Network connectivity issues

**Check Your Setup:**
1. Verify GEMINI_API_KEY is correct
2. Test the key at: https://makersuite.google.com/
3. Check API quotas and billing
4. Try again in a few moments

**Current App Status:**
- Sessions will fail with 0 segments until this is resolved
- Browser TTS will be used as fallback for voice`,
          error: `API Error ${response.status}`,
          timestamp: Date.now()
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

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      return new Response(
        JSON.stringify({
          response: `🤖 **No Response from Gemini**

The API call succeeded but no content was returned.

**This usually means:**
• Safety filters blocked the response
• Empty or invalid prompt
• API returned malformed data

**Debug Info:**
\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`

Try rephrasing your question or ask something simpler to test the connection.`,
          error: 'No AI response',
          timestamp: Date.now()
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

    console.log('Gemini Chat: Successfully generated response');

    return new Response(
      JSON.stringify({
        response: aiResponse,
        timestamp: Date.now(),
        apiStatus: 'working'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Gemini Chat error:', error);
    
    return new Response(
      JSON.stringify({
        response: `💥 **Unexpected Error**

\`\`\`
${error.message}
\`\`\`

**Common Causes:**
• Network connectivity issues
• Malformed request data
• Edge Function timeout
• Invalid JSON in request

**What to Try:**
1. Check your internet connection
2. Refresh the page and try again
3. Check browser console for details
4. Contact support if issue persists

This error suggests a deeper technical issue beyond just API configuration.`,
        error: error.message,
        timestamp: Date.now()
      }),
      {
        status: 200, // Don't break the chat UI
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});