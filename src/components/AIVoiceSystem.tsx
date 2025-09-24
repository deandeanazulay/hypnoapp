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
      console.error('This likely means the Edge Function needs network permissions to access generativelanguage.googleapis.com')
      
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
    console.error('AI Hypnosis error:', error)
    
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
        status: 200, // Don't fail the session, provide fallback
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

IMPORTANT: This is a CUSTOM protocol session. You should:
1. Follow the specific goals and methods defined in this protocol
2. Reference the protocol name and specific intentions
3. Use the specified induction method approach
4. Incorporate any custom notes provided
5. Start immediately with the protocol and begin the actual hypnosis script
6. Create a full hypnotic induction based on the protocol specifications
7. Do NOT ask what they want to work on - they already defined it in the protocol
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
${hasCustomProtocol ? `
   - Start immediately with the custom protocol "${context.customProtocol.name}"
   - Focus on the specific goals: ${context.customProtocol.goals?.join(', ') || 'transformation'}
   - Use ${context.customProtocol.induction || 'progressive'} induction approach
   - Incorporate: ${context.customProtocol.deepener || 'standard techniques'}
` : ''}

CURRENT REQUEST TYPE: ${requestType}
${isFirstMessage && hasCustomProtocol ? `

SPECIAL INSTRUCTION: This is the FIRST message and you're starting a custom protocol session. 
Begin immediately with "${context.customProtocol.name}" protocol focusing on ${context.customProtocol.goals?.join(' and ') || 'transformation'}. 
Do NOT ask what they want to work on - they already specified it in the protocol.
` : ''}

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
    vis