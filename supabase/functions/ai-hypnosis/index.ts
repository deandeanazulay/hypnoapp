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
- Focus on goal: ${scriptParams.goalName || scriptParams.goalId}
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
      return new Response(
        JSON.stringify({
          error: error.message || 'Script generation failed',
          reason: 'UNKNOWN_ERROR',
          suggestion: 'Check all configurations and try again',
          timestamp: Date.now()
        }),
        {
          status: 500,
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
