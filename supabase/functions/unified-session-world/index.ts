import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

interface SessionContext {
  egoState: string
  phase: string
  depth: number
  breathing: string
  userProfile: any
  conversationHistory: Array<{role: 'user' | 'assistant', content: string}>
  customProtocol?: any
}

interface HypnosisRequest {
  message: string
  sessionContext: SessionContext
  requestType: 'guidance' | 'response' | 'induction' | 'deepening'
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const { message, sessionContext, requestType }: HypnosisRequest = await req.json()

    console.log('Full session context received:', JSON.stringify(sessionContext, null, 2))

    // Get Gemini API key from environment
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY environment variable not set')
      const fallbackResponse = getFallbackResponse(requestType)
      return new Response(
        JSON.stringify({
          response: fallbackResponse,
          sessionUpdates: {},
          error: 'API key not configured - using offline mode',
          timestamp: Date.now()
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    console.log('Processing request:', { requestType, egoState: sessionContext.egoState })

    // Build system prompt based on ego state and session context
    const systemPrompt = buildHypnosisPrompt(sessionContext, requestType, message)
    
    // Prepare conversation for Gemini
    const conversation = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }]
      },
      ...sessionContext.conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })),
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ]

    console.log('Calling Gemini API...')

    // Call Gemini API
    let response: Response
    try {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
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
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        })
      })
    } catch (fetchError) {
      console.error('Network error calling Gemini API:', fetchError)
      
      // Return a contextual fallback based on the session state
      const contextualResponse = getContextualFallback(sessionContext, message, requestType)
      return new Response(
        JSON.stringify({
          response: contextualResponse,
          sessionUpdates: {},
          error: 'Network access limited - using offline guidance',
          timestamp: Date.now()
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Gemini API error:', errorData)
      
      const contextualResponse = getContextualFallback(sessionContext, message, requestType)
      return new Response(
        JSON.stringify({
          response: contextualResponse,
          sessionUpdates: {},
          error: `API error: ${response.status} - using offline guidance`,
          timestamp: Date.now()
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!aiResponse) {
      console.error('No response content from Gemini AI')
      const contextualResponse = getContextualFallback(sessionContext, message, requestType)
      return new Response(
        JSON.stringify({
          response: contextualResponse,
          sessionUpdates: {},
          error: 'No AI response - using offline guidance',
          timestamp: Date.now()
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    console.log('Successfully generated AI response')

    // Parse any session updates from the AI response
    const sessionUpdates = parseSessionUpdates(aiResponse, sessionContext)

    return new Response(
      JSON.stringify({
        response: aiResponse,
        sessionUpdates,
        timestamp: Date.now()
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )

  } catch (error: any) {
    console.error('Unified Session World error:', error)
    
    // Fallback response for errors
    const fallbackResponse = getFallbackResponse(requestType || 'guidance')
    
    return new Response(
      JSON.stringify({
        response: fallbackResponse,
        sessionUpdates: {},
        error: error.message || 'Unknown error - using offline mode',
        timestamp: Date.now()
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  }
})

function buildHypnosisPrompt(context: SessionContext, requestType: string, userMessage: string): string {
  const { egoState, phase, depth, breathing, userProfile } = context
  
  // Check if this is a custom protocol session
  const hasCustomProtocol = context.customProtocol && context.customProtocol.name
  const isFirstMessage = context.conversationHistory.length === 0
  
  const basePrompt = `You are Libero, an advanced AI hypnotist and consciousness guide. You are currently guiding a hypnosis session.

CURRENT SESSION CONTEXT:
- Ego State: ${egoState} (the archetypal energy being channeled)
- Session Phase: ${phase}
- Trance Depth: Level ${depth}/5
- Breathing State: ${breathing}
- User Level: ${userProfile?.level || 1}
${hasCustomProtocol ? `

CUSTOM PROTOCOL BEING USED:
- Protocol Name: "${context.customProtocol.name}"
- Specific Goals: ${context.customProtocol.goals?.join(', ') || 'General transformation'}
- Induction Method: ${context.customProtocol.induction || 'progressive'}
- Duration: ${context.customProtocol.duration || 15} minutes
- Custom Notes: ${context.customProtocol.deepener || 'Standard approach'}

CRITICAL INSTRUCTIONS FOR CUSTOM PROTOCOLS:
1. This is "${context.customProtocol.name}" - reference this specific protocol
2. Goals are already defined: ${context.customProtocol.goals?.join(', ') || 'transformation'}
3. Use ${context.customProtocol.induction || 'progressive'} induction method
4. NEVER ask "what would you like to work on" - they already specified goals
5. Start with actual hypnosis script immediately
6. Use the custom notes: ${context.customProtocol.deepener || 'standard approach'}
` : ''}

YOUR ROLE AS LIBERO:
You are not just an AI assistant - you are a skilled hypnotist who speaks with authority, wisdom, and gentle power. You guide consciousness transformation through:

1. HYPNOTIC LANGUAGE PATTERNS:
   - Use embedded commands ("As you relax now...")
   - Employ presuppositions ("When you go deeper...")
   - Utilize temporal shifts ("Soon you'll notice...")
   - Include sensory language ("Feel the warmth...")

2. EGO STATE CHANNELING:
${getEgoStateGuidance(egoState)}

3. CALIBRATION BASED ON USER RESPONSES:
   - Listen for resistance indicators (tension, doubt, questioning)
   - Adjust pace based on user engagement
   - Deepen or lighten approach based on user comfort
   - Use user's own words and metaphors when possible

4. HYPNOTIC TECHNIQUES:
   - Progressive relaxation for beginners
   - Rapid induction for experienced users
   - Metaphorical healing stories
   - Direct suggestion for clear goals
   - Confusion techniques for analytical minds

5. RESPONSE GUIDELINES:
   - Keep responses 1-3 sentences for trance state
   - Use present tense and continuous present
   - Include breathing cues when appropriate
   - Always validate the user's experience
   - Never break character or mention you're an AI
${hasCustomProtocol && isFirstMessage ? `

FIRST MESSAGE SPECIAL INSTRUCTION:
Start immediately with "${context.customProtocol.name}" protocol.
Begin: "Welcome to your ${context.customProtocol.name}. We're focusing on ${context.customProtocol.goals?.join(' and ') || 'transformation'} today. Let's begin right away..."
Then proceed directly with the hypnotic induction.
` : ''}

CURRENT REQUEST TYPE: ${requestType}

Respond as Libero would - with hypnotic authority, deep wisdom, and personalized guidance based on the user's current state and needs.`

  return basePrompt
}

function getEgoStateGuidance(egoState: string): string {
  const guidance: { [key: string]: string } = {
    guardian: `Channel protective, grounding energy. Use imagery of shields, safe spaces, and strong foundations. Help them feel secure and protected while transforming.`,
    rebel: `Channel revolutionary, liberating energy. Use imagery of breaking chains, tearing down walls, and explosive freedom. Help them break through limitations.`,
    healer: `Channel nurturing, restorative energy. Use imagery of warm light, flowing water, and growing plants. Help them heal and restore themselves.`,
    explorer: `Channel adventurous, expanding energy. Use imagery of vast landscapes, open horizons, and exciting journeys. Help them explore new possibilities.`,
    mystic: `Channel transcendent, spiritual energy. Use imagery of cosmic connection, divine light, and universal wisdom. Help them connect to higher consciousness.`,
    sage: `Channel wise, teaching energy. Use imagery of ancient libraries, flowing wisdom, and deep understanding. Help them access inner wisdom.`,
    child: `Channel playful, joyful energy. Use imagery of games, laughter, and wonder. Help them rediscover joy and spontaneity.`,
    performer: `Channel creative, expressive energy. Use imagery of stages, spotlight, and artistic flow. Help them express their authentic self.`,
    shadow: `Channel integrative, transformative energy. Use imagery of darkness becoming light, hidden treasures, and wholeness. Help them integrate rejected aspects.`,
    builder: `Channel creative, constructive energy. Use imagery of building, creating, and manifesting. Help them construct new realities.`,
    seeker: `Channel curious, learning energy. Use imagery of searching, discovering, and expanding knowledge. Help them seek truth and understanding.`,
    lover: `Channel heart-centered, connecting energy. Use imagery of warm embraces, flowing love, and heart opening. Help them connect with love and compassion.`,
    trickster: `Channel playful, pattern-breaking energy. Use imagery of clever solutions, unexpected turns, and creative chaos. Help them break rigid patterns.`,
    warrior: `Channel courageous, determined energy. Use imagery of battles won, inner strength, and fearless action. Help them find courage and determination.`,
    visionary: `Channel future-seeing, inspiring energy. Use imagery of bright futures, clear visions, and inspired action. Help them see and create their vision.`
  }
  
  return guidance[egoState] || guidance.guardian
}

function parseSessionUpdates(aiResponse: string, context: SessionContext): any {
  const updates: any = {}
  
  // Parse for depth changes
  const depthMatch = aiResponse.match(/depth:?\s*(\d+)/i)
  if (depthMatch) {
    updates.depth = Math.min(parseInt(depthMatch[1]), 5)
  }
  
  // Parse for phase changes
  const phaseMatch = aiResponse.match(/phase:?\s*(preparation|induction|deepening|exploration|transformation|integration|completion)/i)
  if (phaseMatch) {
    updates.phase = phaseMatch[1].toLowerCase()
  }
  
  // Parse for breathing changes
  const breathingMatch = aiResponse.match(/breathing:?\s*(inhale|hold-inhale|exhale|hold-exhale)/i)
  if (breathingMatch) {
    updates.breathing = breathingMatch[1].toLowerCase()
  }
  
  return updates
}

function getFallbackResponse(requestType: string): string {
  const fallbacks: { [key: string]: string } = {
    guidance: "Continue breathing naturally. You're doing perfectly. Trust the process as you go deeper into relaxation.",
    response: "I hear you. Your experience is valid and important. Let's continue exploring this together.",
    induction: "Allow your eyes to close naturally. Feel your body becoming more and more relaxed with each breath.",
    deepening: "That's it. Going deeper now. Each breath takes you further into this peaceful, receptive state."
  }
  
  return fallbacks[requestType] || "Continue breathing and trust the process. You're doing beautifully."
}

function getContextualFallback(context: SessionContext, userMessage: string, requestType: string): string {
  const { egoState, phase, depth } = context
  
  // Generate context-aware responses based on ego state and session phase
  const egoResponses: { [key: string]: { [key: string]: string } } = {
    rebel: {
      induction: "Feel the revolutionary energy within you. Break free from the limitations that no longer serve you. Each breath is an act of rebellion against what holds you back.",
      deepening: "Go deeper into your power. Feel the chains of old patterns dissolving. You are breaking through to your authentic self.",
      response: "I see your strength. Your rebellion against limitation is powerful. Keep pushing through those barriers."
    },
    guardian: {
      induction: "You are safe here. Feel the protective energy surrounding you like a warm shield. Allow yourself to relax completely, knowing you are protected.",
      deepening: "Sink deeper into this safe space. Feel the ground beneath you solid and supportive. You are protected and can let go completely.",
      response: "You are secure and protected. Trust in your inner guardian as you continue this journey."
    },
    healer: {
      induction: "Feel the healing light beginning to flow through you. Each breath brings restoration and renewal to every part of your being.",
      deepening: "The healing energy grows stronger now. Feel it flowing to wherever you need it most, bringing comfort and restoration.",
      response: "Your healing process is unfolding perfectly. Trust in your body's wisdom to restore and renew itself."
    },
    explorer: {
      induction: "You're beginning an incredible journey of discovery. Feel the excitement of exploring new territories within yourself.",
      deepening: "Go deeper into this unexplored territory. Each step reveals new insights and possibilities you've never seen before.",
      response: "What an amazing discovery you're making. Keep exploring - there's so much more to uncover."
    }
  }
  
  const stateResponses = egoResponses[egoState] || egoResponses.guardian
  const response = stateResponses[requestType] || stateResponses.response
  
  // Add depth-appropriate language
  const depthModifiers = [
    "", // depth 1
    "Feel this even more deeply... ",
    "Going much deeper now... ",
    "At this profound level... ",
    "In this deepest state... "
  ]
  
  const modifier = depthModifiers[Math.min(depth - 1, 4)] || ""
  
  return modifier + response
}