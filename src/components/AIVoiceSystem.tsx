import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Brain } from 'lucide-react';

interface AIVoiceSystemProps {
  isActive: boolean;
  sessionType: 'unified' | 'integration';
  onStateChange: (state: any) => void;
  sessionConfig?: any;
  currentPhase?: string;
  currentDepth?: number;
  currentBreathing?: string;
}

export default function AIVoiceSystem({ 
  isActive, 
  sessionType, 
  onStateChange, 
  sessionConfig,
  currentPhase = 'preparation',
  currentDepth = 1,
  currentBreathing = 'inhale'
}: AIVoiceSystemProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [conversation, setConversation] = useState<Array<{role: 'ai' | 'user', content: string, timestamp: number}>>([]);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize speech systems
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');

          if (event.results[event.results.length - 1].isFinal) {
            handleUserSpeech(transcript);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.log('Speech recognition error:', event.error);
          setIsListening(false);
        };
      }
    }
  }, []);

  // Handle user speech input
  const handleUserSpeech = async (transcript: string) => {
    if (!transcript.trim()) return;
    
    const timestamp = Date.now();
    setConversation(prev => [...prev, { role: 'user', content: transcript, timestamp }]);
    setIsListening(false);
    setIsProcessingAI(true);
    
    try {
      // Call Gemini AI through Supabase Edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-hypnosis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: transcript,
          sessionContext: {
            egoState: sessionConfig?.egoState || 'guardian',
            phase: currentPhase,
            depth: currentDepth,
            breathing: currentBreathing,
            userProfile: null, // Could be passed from GameStateManager
            conversationHistory: conversation.map(msg => ({
              role: msg.role === 'ai' ? 'assistant' : 'user',
              content: msg.content
            }))
          },
          requestType: 'response'
        })
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('AI Error:', data.error);
        throw new Error(data.error);
      }
      
      const aiResponse = data.response;
      const sessionUpdates = data.sessionUpdates || {};
      
      // Add AI response to conversation
      setConversation(prev => [...prev, { role: 'ai', content: aiResponse, timestamp: timestamp + 1000 }]);

      // Apply any session updates from AI
      if (Object.keys(sessionUpdates).length > 0) {
        onStateChange(sessionUpdates);
      }
      
      // Speak the response
      speakText(aiResponse);
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Fallback response
      const fallbackResponse = "I'm here with you. Continue to breathe and trust the process.";
      setConversation(prev => [...prev, { role: 'ai', content: fallbackResponse, timestamp: timestamp + 1000 }]);
      speakText(fallbackResponse);
    } finally {
      setIsProcessingAI(false);
    }
  };

  // Text-to-speech
  const speakText = (text: string) => {
    if (!synthRef.current) return;

    // Stop any current speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 0.9;
    utterance.volume = 0.8;

    // Find a calm, soothing voice
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Female') || 
      voice.name.includes('Samantha') ||
      voice.name.includes('Karen')
    ) || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    currentUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  // Start/stop listening
  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Auto-start AI guidance
  useEffect(() => {
    if (isActive && conversation.length === 0) {
      setTimeout(() => {
        const welcomeMessage = `Welcome, I'm Libero. I sense you're ready to channel ${sessionConfig?.egoState || 'Guardian'} energy. Let's begin this transformation together. Simply breathe naturally and tell me what you'd like to work on today.`;
        
        setConversation([{ role: 'ai', content: welcomeMessage, timestamp: Date.now() }]);
        speakText(welcomeMessage);
      }, 2000);
    }
  }, [isActive, sessionType, sessionConfig]);

  if (!isActive) return null;

  return (
    <div className="fixed bottom-32 left-4 right-4 z-40">
      {/* Conversation Display */}
      {conversation.length > 0 && (
        <div className="bg-black/95 backdrop-blur-xl rounded-2xl p-4 mb-4 max-h-32 overflow-y-auto border border-white/20 shadow-2xl">
          {conversation.slice(-3).map((msg, i) => (
            <div key={i} className={`mb-3 last:mb-0 ${msg.role === 'ai' ? 'text-teal-400' : 'text-white'}`}>
              <div className="flex items-center space-x-1 mb-0.5">
                {msg.role === 'ai' ? <Brain size={12} /> : <MessageCircle size={12} />}
                <span className="text-xs opacity-50">
                  {msg.role === 'ai' ? 'Libero' : 'You'}
                </span>
              </div>
              <p className="text-sm leading-relaxed">{msg.content}</p>
            </div>
          ))}
          
          {/* AI Thinking Indicator */}
          {isProcessingAI && (
            <div className="mb-3 text-teal-400">
              <div className="flex items-center space-x-1 mb-0.5">
                <Brain size={12} />
                <span className="text-xs opacity-50">Libero</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span className="text-sm">Processing your response...</span>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Quick Action: Tap to Speak */}
      <div className="flex items-center justify-center">
        <button
          onClick={toggleListening}
          disabled={isProcessingAI}
          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            isListening 
              ? 'bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse' 
              : 'bg-gradient-to-r from-teal-400 to-cyan-400 text-black shadow-lg shadow-teal-400/30'
          }`}
        >
          {isListening ? (
            <>
              <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse" />
              <span>Listening...</span>
            </>
          ) : (
            <>
              <MessageCircle size={16} />
              <span>Tap to Speak with Libero</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}