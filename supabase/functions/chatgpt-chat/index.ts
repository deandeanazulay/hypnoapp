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
    let requestData: ChatRequest;
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

    const { message, knowledgeBase, conversationHistory } = requestData;

    // Validate required fields
    if (!message) {
      return new Response(
        JSON.stringify({
          error: 'Missing required field: message',
          code: 'MISSING_MESSAGE',
          details: 'message field is required'
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


    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({
          response: `❌ **OPENAI_API_KEY Not Configured**\n\nThe OpenAI API key is missing from your Supabase Edge Functions environment variables.\n\n**To fix this:**\n1. Go to your Supabase Dashboard\n2. Navigate to Edge Functions → Settings\n3. Add environment variable: \`OPENAI_API_KEY\` = your OpenAI API key\n4. Redeploy your functions`,
          error: 'OPENAI_API_KEY not configured',
          code: 'MISSING_API_KEY',
          suggestion: 'Configure OPENAI_API_KEY in Supabase settings',
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
          response: `🔌 **OpenAI API Error (${response.status})**\n\nThe API key is configured but the call failed.\n\n**Error Details:**\n\`\`\`\n${errorText}\n\`\`\``,
          error: 'OpenAI API error',
          code: 'OPENAI_API_ERROR',
          details: errorText,
          suggestion: 'Check API key validity and quotas',
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
          response: `🤖 **No Response from ChatGPT**\n\nThe API call succeeded but no content was returned.`,
          error: 'No response from OpenAI',
          code: 'NO_AI_RESPONSE',
          details: JSON.stringify(data, null, 2),
          suggestion: 'Try rephrasing your question',
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
        response: `💥 **Unexpected Error**\n\n\`\`\`\n${error.message}\n\`\`\``,
        error: 'Unexpected error occurred',
        code: 'UNEXPECTED_ERROR',
        details: error.message,
        suggestion: 'Check network connection and try again',
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