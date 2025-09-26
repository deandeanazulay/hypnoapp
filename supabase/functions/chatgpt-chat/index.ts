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

    if (Deno.env.get('NODE_ENV') === 'development') {
      console.log('ChatGPT Chat: Processing message:', message);
      console.log('ChatGPT Chat: Knowledge base keys:', Object.keys(knowledgeBase || {}));
    }

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({
          response: `❌ **OPENAI_API_KEY Not Configured**

The OpenAI API key is missing from your Supabase Edge Functions environment variables.

**To fix this:**
1. Go to your Supabase Dashboard
2. Navigate to Edge Functions → Settings
3. Add environment variable: \`OPENAI_API_KEY\` = your OpenAI API key
4. Redeploy your functions

**Get an OpenAI API key:**
- Visit: https://platform.openai.com/api-keys
- Sign in to your OpenAI account
- Create new API key
- Copy and paste into Supabase

**Current App Status:**
- User Level: ${knowledgeBase?.currentUser?.level || 'N/A'}
- Active Ego State: ${knowledgeBase?.currentUser?.activeEgoState || 'N/A'}
- Plan: ${knowledgeBase?.currentUser?.plan || 'N/A'}

Without the API key, script generation will fail and you'll get 0 segments in sessions.`,
          error: 'OPENAI_API_KEY not configured',
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

    // Build messages for OpenAI format
    const messages = [
      {
        role: 'system',
        content: `${LIBERO_SYSTEM_PROMPT}

CURRENT USER CONTEXT:
${JSON.stringify(knowledgeBase, null, 2)}`
      },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      return new Response(
        JSON.stringify({
          response: `🔌 **OpenAI API Error (${response.status})**

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
1. Verify OPENAI_API_KEY is correct
2. Test the key at: https://platform.openai.com/playground
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
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      return new Response(
        JSON.stringify({
          response: `🤖 **No Response from ChatGPT**

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

    if (Deno.env.get('NODE_ENV') === 'development') {
      console.log('ChatGPT Chat: Successfully generated response');
    }

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
    console.error('ChatGPT Chat error:', error);
    
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
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});