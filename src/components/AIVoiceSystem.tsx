import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, MessageCircle, Brain, Send, Loader } from 'lucide-react';

interface AIVoiceSystemProps {
  isActive: boolean;
  sessionType: 'unified' | 'integration';
  onStateChange: (state: any) => void;
  sessionState: any;
  sessionConfig: any;
}

interface SessionState {
  depth: number;
  breathing: 'inhale' | 'hold-inhale' | 'exhale' | 'hold-exhale';
  phase: string;
  userResponse: string;
  aiResponse: string;
  isListening: boolean;
  isSpeaking: boolean;
}

export default function AIVoiceSystem({ isActive, sessionType, onStateChange, sessionState, sessionConfig }: AIVoiceSystemProps) {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [conversation, setConversation] = useState<Array<{role: 'ai' | 'user', content: string, timestamp: number}>>([]);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize speech systems
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      
      // Initialize speech recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          console.log('Speech recognized:', transcript);
          handleUserInput(transcript);
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.log('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  // Auto-start AI guidance
  useEffect(() => {
    if (isActive && conversation.length === 0) {
      setTimeout(() => {
        const welcomeMessage = `Welcome to your ${sessionConfig.egoState} session. I'm Libero, and I'll be guiding you through this transformation journey. Take a deep breath and let me know - what would you like to work on today?`;
        
        const aiMessage = { role: 'ai' as const, content: welcomeMessage, timestamp: Date.now() };
        setConversation([aiMessage]);
        
        if (isVoiceEnabled) {
          speakText(welcomeMessage);
        }
      }, 2000);
    }
  }, [isActive, sessionConfig, isVoiceEnabled]);

  // Handle user input (text or voice)
  const handleUserInput = async (input: string) => {
    if (!input.trim()) return;

    // Add user message to conversation
    const userMessage = { role: 'user' as const, content: input, timestamp: Date.now() };
    const updatedConversation = [...conversation, userMessage];
    setConversation(updatedConversation);
    setTextInput('');
    setIsThinking(true);

    try {
      // Ensure Supabase URL is properly formatted
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }
      
      const baseUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;
      
      // Call AI hypnosis function
      const response = await fetch(`${baseUrl}/functions/v1/ai-hypnosis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          sessionContext: {
            egoState: sessionConfig.egoState,
            phase: sessionState.phase,
            depth: sessionState.depth,
            breathing: sessionState.breathing,
            userProfile: { level: 1 }, // TODO: Get from user state
            conversationHistory: updatedConversation.map(msg => ({
              role: msg.role === 'ai' ? 'assistant' : 'user',
              content: msg.content
            }))
          },
          requestType: 'guidance'
        })
      });

      const data = await response.json();

      if (data.response) {
        const aiMessage = { role: 'ai' as const, content: data.response, timestamp: Date.now() };
        const conversationWithAI = [...updatedConversation, aiMessage];
        setConversation(conversationWithAI);
        
        // Apply any session updates from AI
        if (data.sessionUpdates && Object.keys(data.sessionUpdates).length > 0) {
          onStateChange(data.sessionUpdates);
        }
        
        // Speak the response
        if (isVoiceEnabled) {
          speakText(data.response);
        }
      }
    } catch (error) {
      console.error('AI conversation error:', error);
      const fallbackMessage = error instanceof Error && error.message === 'Supabase URL not configured'
        ? "Connection not available. Please continue with your breathing practice."
        : "I'm here with you. Continue breathing and trust the process.";
      const aiMessage = { role: 'ai' as const, content: fallbackMessage, timestamp: Date.now() };
      const conversationWithAI = [...updatedConversation, aiMessage];
      setConversation(conversationWithAI);
      
      if (isVoiceEnabled) {
        speakText(fallbackMessage);
      }
    } finally {
      setIsThinking(false);
    }
  };

  // Text-to-speech
  const speakText = (text: string) => {
    if (!synthRef.current || !isVoiceEnabled) return;

    // Stop any current speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.7; // Slower for hypnosis
    utterance.pitch = 0.8; // Lower pitch for calming effect
    utterance.volume = 0.9;

    // Find a calm, soothing voice
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Female') || 
      voice.name.includes('Samantha') ||
      voice.name.includes('Karen') ||
      voice.name.includes('Daniel') ||
      voice.lang.includes('en')
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
    if (!recognitionRef.current || !isMicEnabled) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Stop any current speech before listening
      if (synthRef.current) {
        synthRef.current.cancel();
        setIsSpeaking(false);
      }
      
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Handle text form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && !isThinking) {
      handleUserInput(textInput.trim());
    }
  };

  if (!isActive) return null;

  return (
    <div className="fixed bottom-32 left-4 right-4 z-40">
      {/* Conversation Display */}
      {conversation.length > 0 && (
        <div className="bg-black/95 backdrop-blur-xl rounded-2xl p-4 mb-4 max-h-48 overflow-y-auto border border-white/20 space-y-3">
          {conversation.slice(-3).map((msg, i) => (
            <div key={i} className={`${msg.role === 'ai' ? 'text-left' : 'text-right'}`}>
              <div className={`inline-block max-w-[80%] p-3 rounded-2xl ${
                msg.role === 'ai' 
                  ? 'bg-teal-500/20 border border-teal-500/30 text-teal-100' 
                  : 'bg-white/10 border border-white/20 text-white'
              }`}>
                <div className="flex items-center space-x-2 mb-1">
                  {msg.role === 'ai' ? <Brain size={12} className="text-teal-400" /> : <MessageCircle size={12} className="text-white/60" />}
                  <span className="text-xs font-medium opacity-80">
                    {msg.role === 'ai' ? 'Libero' : 'You'}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          
          {/* Thinking indicator */}
          {isThinking && (
            <div className="text-left">
              <div className="inline-block bg-teal-500/20 border border-teal-500/30 p-3 rounded-2xl">
                <div className="flex items-center space-x-2">
                  <Brain size={12} className="text-teal-400" />
                  <span className="text-xs font-medium text-teal-100">Libero</span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Loader size={14} className="text-teal-400 animate-spin" />
                  <span className="text-sm text-teal-100">Tuning into your energy...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input Interface */}
      <div className="bg-black/95 backdrop-blur-xl rounded-2xl border border-white/20 p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center space-x-3">
            {/* Voice Input Button */}
            <button
              type="button"
              onClick={toggleListening}
              disabled={!isMicEnabled || isThinking}
              className={`p-3 rounded-full transition-all duration-300 hover:scale-110 disabled:opacity-50 ${
                isListening 
                  ? 'bg-red-500/20 border-2 border-red-500/60 text-red-400 animate-pulse' 
                  : 'bg-blue-500/20 border border-blue-500/40 text-blue-400'
              }`}
            >
              <Mic size={20} />
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Type your message or use voice..."}
                disabled={isListening || isThinking}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-teal-500/50 focus:bg-white/10 transition-all disabled:opacity-50"
              />
              
              {/* Speaking indicator */}
              {isSpeaking && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 text-teal-400">
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                  <span className="text-xs">Libero is speaking</span>
                </div>
              )}
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!textInput.trim() || isThinking}
              className="p-3 bg-teal-500/20 border border-teal-500/40 text-teal-400 rounded-full hover:bg-teal-500/30 transition-all hover:scale-110 disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>

          {/* Status and Controls */}
          <div className="flex items-center justify-between">
            {/* Status */}
            <div className="flex items-center space-x-2 text-xs text-white/60">
              {isListening && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <span>Listening...</span>
                </div>
              )}
              {isSpeaking && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                  <span className="text-xs">Libero is speaking</span>
                </div>
              )}
            </div>

            {/* Audio Controls */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                  isVoiceEnabled 
                    ? 'bg-green-500/20 border border-green-500/40 text-green-400' 
                    : 'bg-white/10 border border-white/20 text-white/60'
                }`}
              >
                {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              <button
                type="button"
                onClick={() => setIsMicEnabled(!isMicEnabled)}
                className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                  isMicEnabled 
                    ? 'bg-blue-500/20 border border-blue-500/40 text-blue-400' 
                    : 'bg-white/10 border border-white/20 text-white/60'
                }`}
              >
                {isMicEnabled ? <Mic size={16} /> : <MicOff size={16} />}
              </button>
            </div>
          </div>
        </form>

        {/* Quick Suggestions */}
        {conversation.length <= 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              'I feel stressed',
              'Help me focus',
              'I want to relax',
              'I need confidence'
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleUserInput(suggestion)}
                disabled={isThinking}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white/70 text-xs transition-all hover:scale-105 disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}