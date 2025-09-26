import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

// Import prompt templates
import systemPromptTemplate from '../../src/prompts/sessionScript.system.txt?raw'
import userPromptTemplate from '../../src/prompts/sessionScript.user.template.txt?raw'

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
  requestType: 'guidance' | 'response' | 'induction' | 'deepening' | 'script_generation'
  scriptParams?: {
    goalId: string
    egoState: string
    lengthSec: number
    level: number
    streak: number
    locale: string
    userPrefs: any
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const { message, sessionContext, requestType, scriptParams }: HypnosisRequest = await req.json()

    console.log('Full session context received:', JSON.stringify(sessionContext, null, 2))

    // Get Gemini API key from environment
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY environment variable not set')
      
      // For script generation, return proper JSON structure
      if (requestType === 'script_generation') {
        const mockScript = getMockScript(scriptParams)
        return new Response(
          JSON.stringify({
            response: JSON.stringify(mockScript),
            sessionUpdates: {},
            error: 'API key not configured - using mock script',
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

    let conversation: any[]
    
    // Handle script generation differently
    if (requestType === 'script_generation' && scriptParams) {
      // For script generation, try AI with hardened JSON rules, fallback to mock
      try {
        const prompt = [
          {
            role: 'user',
          parts: [{ text: `You are a professional hypnotherapist creating a detailed script. Return ONLY a valid JSON object with this structure:

{
  "title": "Session Title",
  "segments": [
    {
      "id": "segment_name", 
      "text": "Complete hypnosis script text for this segment...",
      "mood": "calming|deepening|transformative|energizing",
      "voice": "female",
      "sfx": "ambient|gentle|energy"
    }
  ],
  "metadata": {
    "durationSec": ${scriptParams.lengthSec},
    "style": "hypnosis"
  }
}

CRITICAL REQUIREMENTS:
- Total script must be exactly ${scriptParams.lengthSec / 60} minutes (${scriptParams.targetWords || Math.floor(scriptParams.lengthSec * 2.5)} words total)
- Create 6-8 segments with realistic timing
- Each segment should be ${Math.floor((scriptParams.targetWords || Math.floor(scriptParams.lengthSec * 2.5)) / 7)} words on average
- Use ${scriptParams.egoState} archetypal energy throughout
- Focus on goal: ${scriptParams.goalId}
${scriptParams.userPrefs?.customProtocol ? `
- This is a CUSTOM PROTOCOL: "${scriptParams.userPrefs.customProtocol.name}"
- Specific goals: ${scriptParams.userPrefs.customProtocol.goals?.join(', ') || 'transformation'}
- Use ${scriptParams.userPrefs.customProtocol.induction || 'progressive'} induction method
- Custom notes: ${scriptParams.userPrefs.customProtocol.deepener || 'standard approach'}` : ''}

SEGMENT STRUCTURE:
1. Welcome (8% of time) - Introduce the session and goal
2. Induction (25% of time) - Guide into hypnotic state
3. Deepening (20% of time) - Deepen the trance
4. Core Work (30% of time) - Main transformation work on the goal
5. Integration (12% of time) - Lock in the changes
6. Emergence (5% of time) - Return to full awareness

Make each segment substantial and detailed. No short sentences - create full, rich hypnotic language that fills the time allocation.

Return ONLY the JSON object above - no markdown, no explanations.` }]
          }
        ];

        console.log('Calling Gemini for script generation with JSON-only rules...')
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: prompt,
            generationConfig: {
              temperature: 0.3, // Lower temperature for more predictable JSON
              topK: 20,
              topP: 0.8,
              maxOutputTokens: 2048,
              responseMimeType: 'application/json' // Request JSON format
            },
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
            ]
          })
        });

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (aiResponse) {
            // Try to parse as JSON - use defensive extraction
            let scriptResponse: any;
            try {
              scriptResponse = JSON.parse(aiResponse);
            } catch {
              // Try extracting JSON from mixed content
              const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                scriptResponse = JSON.parse(jsonMatch[0]);
              } else {
                throw new Error('No JSON found in response');
              }
            }
            
            // Validate basic structure
            if (scriptResponse.segments && Array.isArray(scriptResponse.segments)) {
              console.log('Script generation successful via Gemini API');
              return new Response(
                JSON.stringify({
                  response: JSON.stringify(scriptResponse),
                  sessionUpdates: {},
                  timestamp: Date.now()
                }),
                {
                  headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders,
                  },
                }
              );
            }
          }
        }
      } catch (error) {
        console.warn('Script generation failed, using mock:', error);
      }
      
      // Fallback to mock script
      const mockScript = getMockScript(scriptParams)
      return new Response(
        JSON.stringify({
          response: JSON.stringify(mockScript),
          sessionUpdates: {},
          source: 'mock_fallback',
          timestamp: Date.now()
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    } else {
      // Build system prompt based on ego state and session context for regular conversations
      const systemPrompt = buildHypnosisPrompt(sessionContext, requestType, message)
      
      // Prepare conversation for Gemini
      conversation = [
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
    }

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
            maxOutputTokens: requestType === 'script_generation' ? 2048 : 1024,
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
      
      // For script generation, return proper JSON structure
      if (requestType === 'script_generation') {
        const mockScript = getMockScript(scriptParams)
        return new Response(
          JSON.stringify({
            response: JSON.stringify(mockScript),
            sessionUpdates: {},
            error: 'Network access limited - using mock script',
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
      
      // For script generation, return proper JSON structure
      if (requestType === 'script_generation') {
        const mockScript = getMockScript(scriptParams)
        return new Response(
          JSON.stringify({
            response: JSON.stringify(mockScript),
            sessionUpdates: {},
            error: `API error: ${response.status} - using mock script`,
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
      
      // For script generation, return proper JSON structure
      if (requestType === 'script_generation') {
        const mockScript = getMockScript(scriptParams)
        return new Response(
          JSON.stringify({
            response: JSON.stringify(mockScript),
            sessionUpdates: {},
            error: 'No AI response - using mock script',
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

    // For script generation, ensure response is valid JSON
    if (requestType === 'script_generation') {
      let scriptResponse: any
      try {
        scriptResponse = JSON.parse(aiResponse)
      } catch {
        console.warn('AI returned non-JSON script, using mock')
        scriptResponse = getMockScript(scriptParams)
      }
      
      return new Response(
        JSON.stringify({
          response: JSON.stringify(scriptResponse),
          sessionUpdates: {},
          timestamp: Date.now()
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    // Parse any session updates from the AI response for regular conversations
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
    
    // For script generation, return proper JSON structure
    if (requestType === 'script_generation') {
      const mockScript = getMockScript(scriptParams)
      return new Response(
        JSON.stringify({
          response: JSON.stringify(mockScript),
          sessionUpdates: {},
          error: error.message || 'Unknown error - using mock script',
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
  
  // For script generation, return JSON-only instructions
  if (requestType === 'script_generation') {
    return `You are a hypnosis script generator. You must respond ONLY with a valid JSON object. Do not include any conversational text, explanations, or markdown outside the JSON block.

Return a JSON object with this exact structure:
{
  "segments": [
    {
      "id": "intro",
      "text": "Welcome script text here...",
      "approxSec": 15,
      "markers": [{"type": "breath", "t": 10}]
    }
  ],
  "outline": "Brief description",
  "safetyNotes": "Safety information",
  "version": "1.0.0",
  "hash": "unique_hash"
}

Generate a ${requestType} hypnosis script for ego state: ${egoState}. Respond ONLY with the JSON object above - no other text.`
  }

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

function getMockScript(scriptParams: any): any {
  const egoState = scriptParams?.egoState || 'guardian'
  const goalId = scriptParams?.goalId || 'relaxation'
  const lengthSec = scriptParams?.lengthSec || 900
  
  return {
    segments: [
      {
        id: "intro",
        text: `Welcome to your ${egoState} session. We'll work on ${goalId} together. Find a comfortable position and let's begin.`,
        approxSec: 15,
        markers: [
          { type: "breath", t: 10 }
        ]
      },
      {
        id: "induction",
        text: "Close your eyes gently and take a deep breath in... and slowly let it out. With each breath, feel your body becoming more and more relaxed.",
        approxSec: 30,
        markers: [
          { type: "breath", t: 8 },
          { type: "pause", t: 15 },
          { type: "breath", t: 25 }
        ]
      },
      {
        id: "deepening",
        text: "Now, imagine yourself going deeper into relaxation. Count backwards from 10, and with each number, feel yourself sinking into a peaceful state.",
        approxSec: 45,
        markers: [
          { type: "pause", t: 20 },
          { type: "breath", t: 35 }
        ]
      },
      {
        id: "transformation",
        text: `As your ${egoState} energy awakens, feel the transformation beginning. You are releasing what no longer serves you and embracing your true potential.`,
        approxSec: 60,
        markers: [
          { type: "affirm", t: 30 },
          { type: "breath", t: 50 }
        ]
      },
      {
        id: "integration",
        text: "These changes are becoming part of you. Feel them integrating into every cell of your being, creating lasting transformation.",
        approxSec: 45,
        markers: [
          { type: "pause", t: 20 },
          { type: "affirm", t: 35 }
        ]
      },
      {
        id: "awakening",
        text: "Now it's time to return. Count from 1 to 5, and with each number, feel yourself becoming more alert and aware. 5... fully awake, refreshed, and transformed.",
        approxSec: 30,
        markers: [
          { type: "pause", t: 15 },
          { type: "breath", t: 25 }
        ]
      }
    ],
    outline: "Progressive relaxation with ego state integration",
    safetyNotes: "Gentle awakening included. User can stop at any time.",
    version: "1.0.0",
    hash: "mock_" + Date.now()
  }
}