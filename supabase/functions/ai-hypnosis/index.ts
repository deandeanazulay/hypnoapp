import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface RequestBody {
  message: string
  egoState: string
  sessionContext?: any
  userId?: string
}

interface EgoState {
  name: string
  description: string
  voice: string
}

const egoStates: Record<string, EgoState> = {
  guardian: {
    name: 'Guardian',
    description: 'Protective, nurturing, creates safe spaces',
    voice: 'calm, protective, reassuring'
  },
  rebel: {
    name: 'Rebel',
    description: 'Challenges limitations, breaks through barriers',
    voice: 'bold, challenging, empowering'
  },
  mystic: {
    name: 'Mystic', 
    description: 'Spiritual, intuitive, connects to deeper wisdom',
    voice: 'mystical, flowing, transcendent'
  },
  lover: {
    name: 'Lover',
    description: 'Compassionate, heart-centered, builds connection',
    voice: 'warm, loving, heart-centered'
  },
  builder: {
    name: 'Builder',
    description: 'Creative, constructive, manifests reality',
    voice: 'practical, encouraging, action-oriented'
  }
}

function buildHypnosisPrompt(message: string, egoState: string, sessionContext: any): string {
  const state = egoStates[egoState] || egoStates.guardian
  
  return `You are Libero, an AI hypnotist guide manifesting as the ${state.name} archetype.

${state.name} Voice: ${state.voice}
Description: ${state.description}

User's message: "${message}"

Respond as Libero in the ${state.name} state. Your response should:
- Be 2-3 sentences maximum
- Use hypnotic language patterns (embedded commands, presuppositions)
- Match the ${state.name}'s energy and approach
- Guide toward relaxation and positive transformation
- End with a gentle suggestion or invitation

Current session context: ${JSON.stringify(sessionContext || {})}

Respond only as Libero, staying in character.`
}

function getFallbackResponse(egoState: string, message: string): string {
  const state = egoStates[egoState] || egoStates.guardian
  
  const fallbacks: Record<string, string[]> = {
    guardian: [
      "Feel yourself settling into this safe space... as you breathe deeply, allow your mind to find its natural rhythm of peace.",
      "Let this moment become a sanctuary where you can release what no longer serves you... and embrace what nurtures your soul.",
      "Notice how easily you can let go now... trusting in your own inner wisdom to guide you toward healing."
    ],
    rebel: [
      "Break free from those limiting thoughts... and step boldly into the power that's always been yours.",
      "Challenge the old patterns that held you back... as you discover the fierce strength within.",
      "Shatter those barriers... and emerge transformed, knowing you can conquer anything you choose."
    ],
    mystic: [
      "Connect with the infinite wisdom flowing through you... as ancient knowledge awakens in your consciousness.",
      "Feel the mystical currents of transformation... weaving through every cell of your being with divine purpose.",
      "Open to the sacred mysteries within... where your deepest truths reveal themselves in perfect timing."
    ],
    lover: [
      "Feel love's gentle embrace surrounding you... as your heart opens to receive all the healing you deserve.",
      "Let compassion flow through every breath... connecting you to the beautiful soul you truly are.",
      "Embrace yourself with tender acceptance... as love transforms every part of your being."
    ],
    builder: [
      "Construct new pathways of possibility... as your mind architects the reality you truly desire.",
      "Build momentum with each conscious breath... creating the foundation for lasting transformation.",
      "Manifest your highest vision... as each moment becomes a stepping stone toward your dreams."
    ]
  }
  
  const responses = fallbacks[egoState] || fallbacks.guardian
  return responses[Math.floor(Math.random() * responses.length)]
}

async function callOpenAI(prompt: string): Promise<string> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are Libero, a hypnotic AI guide. Respond with brief, hypnotic language that helps users relax and transform.'
        },
        {
          role: 'user', 
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.8,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || 'Let yourself relax into this moment of peace...'
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    const body: RequestBody = await req.json()
    const { message, egoState = 'guardian', sessionContext, userId } = body

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Build the prompt for the AI
    const prompt = buildHypnosisPrompt(message, egoState, sessionContext)
    
    let aiResponse: string

    try {
      // Try to call OpenAI
      aiResponse = await callOpenAI(prompt)
    } catch (error) {
      console.warn('OpenAI unavailable, using fallback:', error.message)
      // Use fallback response if OpenAI fails
      aiResponse = getFallbackResponse(egoState, message)
    }

    // Return the response
    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        egoState: egoState,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('AI Hypnosis function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        fallback: getFallbackResponse('guardian', 'help')
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})